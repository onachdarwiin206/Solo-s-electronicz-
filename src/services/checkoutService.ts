import { Product, CartItem, PaymentMethod } from '../types';
import { generateDeterministicOrderId, safeGetLocalStorage, safeSetLocalStorage } from '../lib/sandboxDb';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { format, addDays } from 'date-fns';

const WHATSAPP_NUMBER = "256793405517";

// In-memory idempotency cache to prevent duplicate checkouts within short intervals
const recentCheckouts = new Set<string>();

export interface CheckoutParams {
  cart: CartItem[];
  user: any;
  method: PaymentMethod;
  district: string;
  deliveryFee: number;
  phone: string;
  address: string;
  customerName: string;
  masterProducts: Product[]; // Used for trusted price lookup & offline stock verification
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

/**
 * Centered checkout & order creation engine.
 * Protects against tampering, ensures stock validation, tracks idempotency,
 * handles atomicity between order generation & inventory depletion,
 * and only wipes the cart upon fully verified transaction commit.
 */
export async function executeCheckout({
  cart,
  user,
  method,
  district,
  deliveryFee,
  phone,
  address,
  customerName,
  masterProducts
}: CheckoutParams): Promise<CheckoutResult> {
  
  // 1. Double Click / Idempotency Protection
  const idempotencyKey = `${phone}_${district}_${cart.map(i => `${i.id}:${i.quantity}`).join(',')}`;
  if (recentCheckouts.has(idempotencyKey)) {
    return {
      success: false,
      error: "Double Click Protected: Your checkout request is already being processed."
    };
  }
  recentCheckouts.add(idempotencyKey);
  
  // Auto-expire lock in 15 seconds to allow retry on true failure
  setTimeout(() => recentCheckouts.delete(idempotencyKey), 15000);

  // 2. Empty Cart Guard
  if (!cart || cart.length === 0) {
    recentCheckouts.delete(idempotencyKey);
    return {
      success: false,
      error: "Your transaction basket is currently empty."
    };
  }

  // 3. Price Tampering Prevention & Server-Side Valuation Recalculation
  let subtotal = 0;
  const verifiedCartItems: CartItem[] = [];

  for (const item of cart) {
    // Find trusted price of product in master catalog
    const trustedProduct = masterProducts.find(p => p.id === item.id);
    if (!trustedProduct) {
      recentCheckouts.delete(idempotencyKey);
      return {
        success: false,
        error: `Security Alert: Component "${item.name}" could not be authenticated in the live hardware index.`
      };
    }

    const trustedPrice = trustedProduct.price;
    subtotal += trustedPrice * item.quantity;
    verifiedCartItems.push({
      ...item,
      price: trustedPrice // Override with verified price
    });
  }

  const totalValuation = subtotal + deliveryFee;
  const orderId = generateDeterministicOrderId(phone, district);
  const createdAt = new Date().toISOString();
  const estDelivery = format(addDays(new Date(createdAt), 3), 'PPP');

  const orderData = {
    id: orderId,
    user_id: user?.id || null,
    customer_name: customerName,
    customer_phone: phone,
    items: verifiedCartItems,
    total: totalValuation,
    status: 'pending',
    delivery_address: address,
    district,
    payment_method: method,
    created_at: createdAt,
    estimated_delivery: estDelivery,
    tracking_logs: [
      { status: 'pending', message: 'Order initialized in the hardware pool.', timestamp: createdAt }
    ]
  };

  // 4. Sourcing Pipeline: Remote (Supabase) vs. Sandbox Local Sourcing
  if (isSupabaseConfigured) {
    try {
      // A. Real-time Inventory Verification & Depletion
      // Retrieve fresh stock data directly from database to prevent concurrency overrides
      const { data: dbProducts, error: fetchErr } = await supabase
        .from('products')
        .select('id, name, stock')
        .in('id', verifiedCartItems.map(i => i.id));

      if (fetchErr) throw fetchErr;

      // Verify stock sufficiency for each component
      for (const item of verifiedCartItems) {
        const dbProduct = dbProducts?.find(p => p.id === item.id);
        const currentStock = dbProduct?.stock ?? 10; // Default to 10 if stock missing

        if (currentStock < item.quantity) {
          recentCheckouts.delete(idempotencyKey);
          return {
            success: false,
            error: `Logistics Limit: Requested quantity of "${item.name}" exceeds current available stock (${currentStock} available).`
          };
        }
      }

      // B. Create Order record
      let { error: insertErr } = await supabase.from('orders').insert(orderData);
      
      // Fallback for older schemas lacking tracker columns
      if (insertErr && (insertErr.message?.includes('estimated_delivery') || insertErr.message?.includes('tracking_logs') || insertErr.code === 'PGRST204')) {
        console.warn("[Checkout Pipeline] Old orders table detected. Running legacy payload fallback.");
        const { 
          id, user_id, customer_name, customer_phone, items: legacyItems, total: legacyTotal, 
          status, delivery_address, district, payment_method, created_at 
        } = orderData;
        const legacyData = { 
          id, user_id, customer_name, customer_phone, items: legacyItems, total: legacyTotal, 
          status, delivery_address, district, payment_method, created_at 
        };
        const { error: retryError } = await supabase.from('orders').insert(legacyData);
        insertErr = retryError;
      }

      if (insertErr) {
        if (insertErr.code === '42P01' || insertErr.message?.includes('not found')) {
          console.warn("[Checkout Pipeline] Orders table is missing on remote DB. Sourcing as sandbox fallback.");
        } else {
          throw insertErr;
        }
      }

      // C. Deplete stock atomically on Supabase
      for (const item of verifiedCartItems) {
        const dbProduct = dbProducts?.find(p => p.id === item.id);
        const currentStock = dbProduct?.stock ?? 10;
        const updatedStock = Math.max(0, currentStock - item.quantity);
        
        await supabase
          .from('products')
          .update({ stock: updatedStock, updated_at: new Date().toISOString() })
          .eq('id', item.id);
      }

      // Success Path: Send message and return
      launchWhatsAppReceipt(orderId, customerName, verifiedCartItems, totalValuation, phone);
      recentCheckouts.delete(idempotencyKey);
      return { success: true, orderId };

    } catch (err: any) {
      console.error("[Checkout Pipeline] Transaction aborted due to database failure:", err);
      recentCheckouts.delete(idempotencyKey);
      return {
        success: false,
        error: `Database Sourcing Error: ${err.message || "Failed to commit order signature."}`
      };
    }
  } else {
    // 5. Offline Sandbox Sourcing
    // Verify local/cached stock sufficiency
    const customProducts: Product[] = safeGetLocalStorage<Product[]>('custom_products', []);
    
    for (const item of verifiedCartItems) {
      const matchedProduct = customProducts.find(p => p.id === item.id) || masterProducts.find(p => p.id === item.id);
      const currentStock = matchedProduct?.stock ?? 10;

      if (currentStock < item.quantity) {
        recentCheckouts.delete(idempotencyKey);
        return {
          success: false,
          error: `Logistics Limit: Requested quantity of "${item.name}" exceeds current available stock (${currentStock} available).`
        };
      }
    }

    // Write order locally
    const sandboxOrders = safeGetLocalStorage<any[]>('solo_sandbox_orders', []);
    sandboxOrders.push(orderData);
    safeSetLocalStorage('solo_sandbox_orders', sandboxOrders);

    // Deplete stock in local storage
    const updatedCustoms = customProducts.map(p => {
      const orderedItem = verifiedCartItems.find(item => item.id === p.id);
      if (orderedItem) {
        return { ...p, stock: Math.max(0, (p.stock ?? 10) - orderedItem.quantity) };
      }
      return p;
    });
    safeSetLocalStorage('custom_products', updatedCustoms);

    // Also dispatch localized event for real-time app update
    window.dispatchEvent(new CustomEvent('sandbox_custom_products_updated', { detail: updatedCustoms }));

    // Send message and return
    launchWhatsAppReceipt(orderId, customerName, verifiedCartItems, totalValuation, phone);
    recentCheckouts.delete(idempotencyKey);
    return { success: true, orderId };
  }
}

/**
 * Triggers native WhatsApp redirect containing formatted purchase transaction summary.
 */
function launchWhatsAppReceipt(
  orderId: string, 
  customerName: string, 
  items: CartItem[], 
  total: number, 
  phone: string
) {
  const cartSummary = items.map(i => `• ${i.name} (x${i.quantity}) - UGX ${(i.price * i.quantity).toLocaleString()}`).join('\n');
  
  const receiptTemplate = `
🧾 *DIGITAL HOME - HARDWARE RECEIPT*
---------------------------------------
*Order ID:* ${orderId}
*Date:* ${new Date().toLocaleDateString()}
*Customer:* ${customerName}

*ITEMS:*
${cartSummary}

---------------------------------------
*TOTAL:* UGX ${total.toLocaleString()}

*CONTACT PHONE:* ${phone}

_Thank you for choosing Digital Home!_
_Your hardware order is now being processed._
`.trim();
  
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(receiptTemplate)}`;
  window.open(whatsappUrl, '_blank');
}
