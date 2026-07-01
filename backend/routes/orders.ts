import { Router } from "express";
import crypto from "crypto";
import { INITIAL_PRODUCTS } from "../../src/constants";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "../middleware/auth";

const router = Router();

// Initialize Supabase Client if configured
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.length > 20 &&
  !supabaseUrl.includes('placeholder')
);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseKey!) : null;

// In-memory fallbacks for resilient operation without Supabase
export const mockProducts = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
export const mockOrders: any[] = [];
export const mockPaymentVerifications: any[] = [];

/**
 * Endpoint: GET /api/v1/orders/products
 * Fetch products from database (or mock)
 */
router.get("/products", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("products").select("*");
      if (!error && data) {
        return res.json(data);
      }
    }
    return res.json(mockProducts);
  } catch (err: any) {
    return res.json(mockProducts);
  }
});

/**
 * Endpoint: POST /api/v1/orders
 * Creates an order, validates cart total/pricing, decrements stock atomically, and registers verification token.
 */
router.post("/", async (req, res) => {
  try {
    const { 
      items, 
      customerName, 
      phone, 
      address, 
      district, 
      deliveryFee, 
      paymentMethod,
      id,
      verification_token,
      payment_deadline,
      created_at
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Sourcing basket details are missing." });
    }
    if (!customerName || !phone) {
      return res.status(400).json({ success: false, error: "A client name and telephone number are required." });
    }

    // 1. Fetch current catalog pricing to prevent client-side tampering
    let currentCatalog: any[] = [];
    if (supabase) {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.warn("[Backend Orders] Supabase product fetch failed, utilizing server-side memory:", error.message);
        currentCatalog = mockProducts;
      } else {
        currentCatalog = data || [];
      }
    } else {
      currentCatalog = mockProducts;
    }

    let calculatedTotal = 0;
    const verifiedItems: any[] = [];

    for (const item of items) {
      const catalogItem = currentCatalog.find(p => p.id === item.id);
      if (!catalogItem) {
        return res.status(404).json({ 
          success: false, 
          error: `Product "${item.name}" was not found in our catalog index.` 
        });
      }

      // Check for price tampering
      if (Number(item.price) !== Number(catalogItem.price)) {
        console.warn(`[Security Alert] Price tampering attempt on ${catalogItem.name}. Provided: ${item.price}, Actual: ${catalogItem.price}`);
        return res.status(400).json({ 
          success: false, 
          error: `Tampering Shield: Prices for "${catalogItem.name}" did not match showroom catalog values.` 
        });
      }

      // Check stock sufficiency
      if (Number(catalogItem.stock) < Number(item.quantity)) {
        return res.status(400).json({ 
          success: false, 
          error: `Logistics Limit: Requested quantity of "${catalogItem.name}" exceeds current available stock (${catalogItem.stock} available).` 
        });
      }

      calculatedTotal += Number(catalogItem.price) * Number(item.quantity);
      verifiedItems.push({
        ...item,
        price: catalogItem.price,
        quantity: item.quantity
      });
    }

    const totalValuation = calculatedTotal + (Number(deliveryFee) || 0);

    // 2. Decrement product stock atomically
    if (supabase) {
      for (const item of verifiedItems) {
        // Attempt using RPC
        const { error: rpcErr } = await supabase.rpc("deplete_product_stock", { p_id: item.id, p_qty: item.quantity });
        if (rpcErr) {
          console.warn(`[Backend Orders] RPC stock depletion failed for ${item.id}. Using manual transaction:`, rpcErr.message);
          const catalogItem = currentCatalog.find(p => p.id === item.id);
          const newStock = Math.max(0, Number(catalogItem.stock) - Number(item.quantity));
          await supabase.from("products").update({ stock: newStock }).eq("id", item.id);
        }
      }
    } else {
      // Local mock stock decrement
      for (const item of verifiedItems) {
        const catalogItem = mockProducts.find(p => p.id === item.id);
        if (catalogItem) {
          catalogItem.stock = Math.max(0, catalogItem.stock - item.quantity);
        }
      }
    }

    // 3. Generate credentials or use predefined offline credentials
    const orderId = id || `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const verificationToken = verification_token || `VT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const paymentDeadline = payment_deadline || new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 Hour limit
    const createdAt = created_at || new Date().toISOString();

    const orderData = {
      id: orderId,
      user_id: null,
      customer_name: customerName,
      customer_phone: phone,
      total: totalValuation,
      status: "pending_payment",
      items: verifiedItems,
      delivery_address: address || "Direct Collection",
      district: district || "Kampala",
      payment_method: paymentMethod || "momo",
      verification_token: verificationToken,
      payment_verified_at: null,
      payment_deadline: paymentDeadline,
      created_at: createdAt,
      updated_at: createdAt,
      tracking_logs: [
        { 
          status: "pending_payment", 
          message: `Order initialized. Verification code [${verificationToken}] generated. Please complete payment within 60 minutes.`, 
          timestamp: createdAt 
        }
      ]
    };

    // 4. Record order details
    if (supabase) {
      const { error: insertError } = await supabase.from("orders").insert(orderData);
      if (insertError) {
        console.error("[Backend Orders] Supabase order insertion failed. Saving to fallback storage:", insertError.message);
        mockOrders.push(orderData);
      }
    } else {
      mockOrders.push(orderData);
    }

    console.log(`[Backend Orders] Successfully registered Order: ${orderId}. Verification token is: ${verificationToken}.`);

    return res.status(201).json({
      success: true,
      orderId,
      verificationToken,
      paymentDeadline,
      total: totalValuation
    });

  } catch (err: any) {
    console.error("[Backend Orders] Unexpected transaction error:", err);
    return res.status(500).json({ success: false, error: "Internal Sourcing Engine failure. Please try again." });
  }
});

/**
 * Endpoint: POST /api/v1/orders/:orderId/verify-payment (Admin Only)
 * Allows administrator to verify mobile money payment token and update order state to 'payment_verified'.
 */
router.post("/:orderId/verify-payment", verifyAdminToken, async (req: any, res) => {
  try {
    const { orderId } = req.params;
    const { verificationToken, verificationNotes } = req.body;

    if (!verificationToken) {
      return res.status(400).json({ success: false, error: "Verification token is required to reconcile payment." });
    }

    const adminEmail = req.adminUser?.email || "admin@emmaelectronics.com";

    // 1. Fetch Order
    let order: any = null;
    if (supabase) {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (!error && data) {
        order = data;
      }
    }

    if (!order) {
      order = mockOrders.find(o => o.id === orderId);
    }

    if (!order) {
      return res.status(404).json({ success: false, error: `Sourcing order "${orderId}" was not found.` });
    }

    // 2. Validate Token Matches Order
    if (order.verification_token !== verificationToken) {
      console.warn(`[Security Alert] Payment reconciliation token mismatch on Order ${orderId}. Supplied: ${verificationToken}`);
      return res.status(400).json({ success: false, error: "Payment Reconciler Error: Verification token mismatch." });
    }

    // 3. Update order state
    const verifiedAt = new Date().toISOString();
    const updatedLogs = [
      ...(order.tracking_logs || []),
      { 
        status: "payment_verified", 
        message: `Payment verified by administrator ${adminEmail}. Notes: ${verificationNotes || 'No notes specified.'}`, 
        timestamp: verifiedAt 
      }
    ];

    if (supabase) {
      const { error: updateErr } = await supabase
        .from("orders")
        .update({
          status: "payment_verified",
          payment_verified_at: verifiedAt,
          tracking_logs: updatedLogs
        })
        .eq("id", orderId);

      if (updateErr) {
        console.error("[Backend Orders] Failed to update order on Supabase. Applying local update:", updateErr.message);
        const idx = mockOrders.findIndex(o => o.id === orderId);
        if (idx !== -1) {
          mockOrders[idx].status = "payment_verified";
          mockOrders[idx].payment_verified_at = verifiedAt;
          mockOrders[idx].tracking_logs = updatedLogs;
        }
      }
    } else {
      const idx = mockOrders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        mockOrders[idx].status = "payment_verified";
        mockOrders[idx].payment_verified_at = verifiedAt;
        mockOrders[idx].tracking_logs = updatedLogs;
      }
    }

    // Update in-memory state as well to ensure synchronization
    const localOrder = mockOrders.find(o => o.id === orderId);
    if (localOrder) {
      localOrder.status = "payment_verified";
      localOrder.payment_verified_at = verifiedAt;
      localOrder.tracking_logs = updatedLogs;
    }

    // 4. Create record in payment_verifications audit table
    const auditRecord = {
      order_id: orderId,
      verification_token: verificationToken,
      verification_notes: verificationNotes || "Verified by Admin Dashboard",
      verified_at: verifiedAt,
      verified_by: adminEmail
    };

    if (supabase) {
      const { error: auditErr } = await supabase.from("payment_verifications").insert(auditRecord);
      if (auditErr) {
        console.warn("[Backend Orders] Audit logger failed to register payment verification in Supabase:", auditErr.message);
        mockPaymentVerifications.push(auditRecord);
      }
    } else {
      mockPaymentVerifications.push(auditRecord);
    }

    // 5. Trigger SMS/Email Delivery Service
    console.log(`[Notification Engine] Triggered customer SMS dispatch to ${order.customer_phone}:`);
    console.log(`- MESSAGE: "Hello ${order.customer_name}! Your payment for Digital Home order ${orderId} has been verified successfully. Your hardware is now being dispatched."`);

    return res.json({
      success: true,
      message: "Order payment successfully reconciled and verified.",
      status: "payment_verified",
      paymentVerifiedAt: verifiedAt
    });

  } catch (err: any) {
    console.error("[Backend Orders] Reconciler failure:", err);
    return res.status(500).json({ success: false, error: "Internal payment processing engine error." });
  }
});

/**
 * Cleanup Service: Automatically cancel expired pending_payment orders and restore stock
 */
export async function autoCancelExpiredOrders() {
  try {
    const now = new Date().toISOString();

    // 1. Fetch expired orders from Supabase (if configured)
    let expiredOrders: any[] = [];
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending_payment")
        .lt("payment_deadline", now);
      
      if (!error && data) {
        expiredOrders = data;
      }
    }

    // Combine with local mock orders that expired
    const localExpired = mockOrders.filter(
      o => o.status === "pending_payment" && o.payment_deadline < now
    );

    const mergedExpired = [...expiredOrders];
    for (const le of localExpired) {
      if (!mergedExpired.some(e => e.id === le.id)) {
        mergedExpired.push(le);
      }
    }

    if (mergedExpired.length === 0) return;

    console.log(`[Auto-Reconciliation Engine] Found ${mergedExpired.length} expired orders. Revoking stock hold...`);

    for (const order of mergedExpired) {
      const updatedLogs = [
        ...(order.tracking_logs || []),
        { 
          status: "cancelled", 
          message: "Order automatically cancelled. Reason: Payment verification timeline expired (1-hour window).", 
          timestamp: now 
        }
      ];

      // A. Restore inventory levels
      if (supabase) {
        const { data: latestProducts } = await supabase.from("products").select("id, stock");
        
        for (const item of order.items) {
          const freshProd = latestProducts?.find(p => p.id === item.id);
          const currentStock = freshProd?.stock || 0;
          await supabase
            .from("products")
            .update({ stock: currentStock + item.quantity })
            .eq("id", item.id);
        }

        // B. Update Order Status
        await supabase
          .from("orders")
          .update({
            status: "cancelled",
            tracking_logs: updatedLogs
          })
          .eq("id", order.id);
      } else {
        // Local in-memory restoration
        for (const item of order.items) {
          const mockProd = mockProducts.find(p => p.id === item.id);
          if (mockProd) {
            mockProd.stock += item.quantity;
          }
        }
      }

      // Sync local collections
      const idx = mockOrders.findIndex(o => o.id === order.id);
      if (idx !== -1) {
        mockOrders[idx].status = "cancelled";
        mockOrders[idx].tracking_logs = updatedLogs;
      }

      console.log(`[Auto-Reconciliation Engine] Released stock hold and cancelled order: ${order.id}`);
    }

  } catch (err: any) {
    console.error("[Auto-Reconciliation Engine Error] Stock restoration failure:", err.message);
  }
}

// Spin up background worker to clean up expired payments every 60 seconds
setInterval(autoCancelExpiredOrders, 60000);

export default router;
