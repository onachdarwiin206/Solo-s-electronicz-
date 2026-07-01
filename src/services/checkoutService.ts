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
  verificationToken?: string;
  paymentDeadline?: string;
  total?: number;
  error?: string;
  offline?: boolean;
}

/**
 * Centered checkout & order creation engine.
 * Protects against tampering, ensures stock validation, tracks idempotency,
 * and calls the backend API to atomically reserve stock and generate verification codes.
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

  // 3. Price Tampering Prevention & Server-Side Valuation Recalculation (Pre-verification)
  let subtotal = 0;
  const verifiedCartItems: CartItem[] = [];

  for (const item of cart) {
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
      price: trustedPrice
    });
  }

  const totalValuation = subtotal + deliveryFee;
  const isCurrentlyOffline = typeof window !== 'undefined' && !navigator.onLine;

  // 4. Secure Backend Order Routing Flow
  if (!isCurrentlyOffline) {
    try {
      console.log("[Checkout Pipeline] Sourcing order via backend API...");
      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: verifiedCartItems,
          customerName,
          phone,
          address,
          district,
          deliveryFee,
          paymentMethod: method
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        recentCheckouts.delete(idempotencyKey);
        return {
          success: false,
          error: resData.error || "Order creation failure on database reservation."
        };
      }

      const { orderId, verificationToken, paymentDeadline, total } = resData;

      // Launch WhatsApp receipt with verification token embedded
      launchWhatsAppReceipt({
        orderId,
        customerName,
        items: verifiedCartItems,
        total,
        phone,
        verificationToken,
        paymentDeadline
      });

      recentCheckouts.delete(idempotencyKey);
      return {
        success: true,
        orderId,
        verificationToken,
        paymentDeadline,
        total
      };

    } catch (err: any) {
      console.warn("[Checkout Pipeline] Connection failed, falling back to local sandbox:", err);
    }
  }

  // 5. Offline Sandbox Sourcing (Reliability Fallback)
  console.log("[Checkout Pipeline] Offline status or backend timeout. Creating mock order locally.");
  const orderId = generateDeterministicOrderId(phone, district);
  const verificationToken = `VT-LOC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const paymentDeadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // Verify stock locally
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

  const orderData = {
    id: orderId,
    user_id: user?.id || null,
    customer_name: customerName,
    customer_phone: phone,
    items: verifiedCartItems,
    total: totalValuation,
    status: 'pending_payment',
    delivery_address: address,
    district,
    payment_method: method,
    verification_token: verificationToken,
    payment_deadline: paymentDeadline,
    payment_verified_at: null,
    created_at: new Date().toISOString(),
    tracking_logs: [
      { status: 'pending_payment' as const, message: `Order recorded offline. Awaiting payment verification. Local token: ${verificationToken}`, timestamp: new Date().toISOString() }
    ]
  };

  // Write order locally to IndexedDB so it's tracked securely offline with unlimited capacity
  try {
    const { addOrderToQueue } = await import('../lib/offlineDB');
    await addOrderToQueue(orderData);
  } catch (queueErr) {
    console.error("[Checkout Pipeline] IndexedDB Queue failed, falling back to legacy LocalStorage:", queueErr);
    // Legacy fallback just in case
    const sandboxOrders = safeGetLocalStorage<any[]>('solo_sandbox_orders', []);
    sandboxOrders.push(orderData);
    safeSetLocalStorage('solo_sandbox_orders', sandboxOrders);
  }

  // Deplete stock in local storage
  simulateLocalDepletion(verifiedCartItems, masterProducts);

  // Launch WhatsApp with local verification details
  launchWhatsAppReceipt({
    orderId,
    customerName,
    items: verifiedCartItems,
    total: totalValuation,
    phone,
    verificationToken,
    paymentDeadline
  });

  recentCheckouts.delete(idempotencyKey);
  return {
    success: true,
    orderId,
    verificationToken,
    paymentDeadline,
    total: totalValuation,
    offline: true
  };
}

/**
 * Simulates stock depletion in local storage to ensure immediate, snappy visual feedback
 */
function simulateLocalDepletion(items: CartItem[], masterProducts: Product[]) {
  const customProducts: Product[] = safeGetLocalStorage<Product[]>('custom_products', []);
  const updatedCustoms = customProducts.map(p => {
    const orderedItem = items.find(item => item.id === p.id);
    if (orderedItem) {
      return { ...p, stock: Math.max(0, (p.stock ?? 10) - orderedItem.quantity) };
    }
    return p;
  });

  // If a product from master catalog is ordered but not yet customized, insert it into custom_products
  for (const item of items) {
    if (!updatedCustoms.some(p => p.id === item.id)) {
      const original = masterProducts.find(p => p.id === item.id);
      if (original) {
        updatedCustoms.push({
          ...original,
          stock: Math.max(0, (original.stock ?? 10) - item.quantity)
        });
      }
    }
  }

  safeSetLocalStorage('custom_products', updatedCustoms);
  window.dispatchEvent(new CustomEvent('sandbox_custom_products_updated', { detail: updatedCustoms }));
}

interface WhatsAppReceiptParams {
  orderId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  phone: string;
  verificationToken: string;
  paymentDeadline: string;
}

/**
 * Triggers native WhatsApp redirect containing formatted purchase transaction summary with embedded verification details.
 */
function launchWhatsAppReceipt({
  orderId,
  customerName,
  items,
  total,
  phone,
  verificationToken,
  paymentDeadline
}: WhatsAppReceiptParams) {
  const cartSummary = items.map(i => `• ${i.name} (x${i.quantity}) - UGX ${(i.price * i.quantity).toLocaleString()}`).join('\n');
  const formattedDeadline = format(new Date(paymentDeadline), 'p (PPP)');

  const receiptTemplate = `
🧾 *DIGITAL HOME - HARDWARE RECEIPT*
---------------------------------------
*Order ID:* ${orderId}
*Customer:* ${customerName}
*Date:* ${new Date().toLocaleDateString()}

*PAYMENT VERIFICATION REQUIRED:*
*Verification Token:* ${verificationToken}
*Payment Deadline:* ${formattedDeadline}
*Order Status:* Pending Payment

*ITEMS:*
${cartSummary}

---------------------------------------
*TOTAL:* UGX ${total.toLocaleString()}

*CONTACT PHONE:* ${phone}

⚠️ *INSTRUCTIONS:*
Please complete your payment on Mobile Money (MOMO) / Bank and share the confirmation receipt screenshot.
Always quote your *Verification Token: ${verificationToken}* to guarantee swift, automatic system matching and dispatch!

_Thank you for choosing Digital Home!_
`.trim();
  
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(receiptTemplate)}`;
  window.open(whatsappUrl, '_blank');
}
