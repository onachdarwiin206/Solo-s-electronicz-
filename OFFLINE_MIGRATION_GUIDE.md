# Offline Order Queue Migration Guide: LocalStorage to IndexedDB

This guide outlines the technical architecture, schema specifications, and automatic migration engine built to replace the legacy `LocalStorage` offline queue with a resilient, unlimited-capacity **IndexedDB** engine.

---

## 1. Why we migrated to IndexedDB

The previous architecture relied on `LocalStorage` to queue offline orders. While convenient, this had critical limitations:
1. **Quota Constraint (5MB to 10MB Limit):** Standard browsers strictly enforce a 5-10MB limit on `LocalStorage`. High-volume queuing (e.g., 100+ orders with rich payloads) would trigger `QuotaExceededError` exceptions, causing silent data loss.
2. **Synchronous Performance Bottleneck:** `LocalStorage` reads and writes are synchronous, blocking the main UI thread during heavy JSON serialization tasks.
3. **Weak Crash Durability:** Because of synchronous writes and lack of transactions, browser crashes mid-operation often corrupted the JSON strings.

**The Solution:** An asynchronous, transaction-based **IndexedDB** database (`DigitalHome_OfflineDB`) with virtually **unlimited storage** (typically up to 50% of the user's free disk space).

---

## 2. IndexedDB Schema Design

The IndexedDB structure consists of three dedicated object stores inside the `DigitalHome_OfflineDB` database (Version `1`):

### Store 1: `'orders'`
*   **Purpose:** Secure, long-term storage of all orders placed on the device (both offline and online).
*   **Key Path:** `id` (maps directly to the Order reference number, e.g., `ORD-XXXX`).
*   **Payload Schema:**
    ```typescript
    interface OfflineOrder {
      id: string; // Order reference ID
      customer_name: string;
      customer_phone: string;
      items: CartItem[];
      total: number;
      status: string; // 'pending_payment' | 'pending' | 'confirmed'
      delivery_address: string;
      district?: string;
      payment_method?: string;
      verification_token?: string;
      payment_deadline?: string;
      created_at: string;
      tracking_logs?: TrackingLog[];
      synced?: boolean; // Flag to trace online synchronization status
    }
    ```

### Store 2: `'products'`
*   **Purpose:** High-performance local cache of catalog products for offline price verification, stock depletion simulations, and offline search.
*   **Key Path:** `id`

### Store 3: `'syncQueue'`
*   **Purpose:** Standard FIFO (First-In, First-Out) synchronization queue of pending orders awaiting network restoration.
*   **Key Path:** `id` (corresponds to the unique order ID to avoid duplication).
*   **Payload Schema:**
    ```typescript
    interface SyncQueueItem {
      id: string; // Unique order ID
      order: OfflineOrder; // Complete order payload
      retryCount: number; // For exponential backoff retry tracing
      lastAttempt?: string; // Timestamp of the last replay attempt
      error?: string; // Stringified error of the latest attempt
      synced: boolean;
      timestamp: string; // Insertion timestamp
    }
    ```

---

## 3. Automatic Zero-Friction Migration Engine

To prevent any data loss for returning customers who might have legacy orders or pending checkouts queued in `LocalStorage`, we designed an automatic migration script inside `src/lib/offlineDB.ts` that runs instantly on application mount inside `src/App.tsx`.

### Migration Logic:
1. **Sourcing Sandbox Orders:** It checks for the existence of legacy `'solo_sandbox_orders'` in `LocalStorage`.
2. **Sourcing Pending Mutations:** It checks for any pending order inserts in the legacy mutation queue (`'solo_offline_mutations'`).
3. **Database Insertion:** It loads these items and asynchronously writes them into the corresponding IndexedDB stores.
4. **LocalStorage Purging:** Once successfully saved to IndexedDB, it deletes the legacy keys from `LocalStorage` to reclaim space.

This migration happens entirely in the background within **milliseconds** and requires zero human intervention.

---

## 4. Synchronization Lifecycle & Exponential Backoff

Offline synchronization is completely automated and works under a robust retry-backoff lifecycle:

```
[User Offline Checkout] 
       │
       ▼
[Saved to 'orders' & 'syncQueue'] ──> Displays "Will Sync When Online" success view
       │
       ├─ [Browser detects 'online' event]
       ▼
[Replay Queue Loop Started]
       │
       ├─► [Deduplicate Queue based on Order ID]
       ▼
[POST Request to /api/v1/orders]
       │
       ├─── [Success (HTTP 201)] ──► Mark order as synced, remove from queue, show Success Toast
       │
       └─── [Failure (HTTP 400 / Business Conflict / Out of Stock)]
               │
               └───► Reject order, remove from queue, dispatch 'order_sync_conflict' Toast to notify user
       │
       └─── [Network Timeout / Connection Interrupted (HTTP 5xx)]
               │
               ├───► Increment retryCount, record latest error message
               │
               └───► Sleep for exponential delay (2s, 4s, 8s, 16s, 32s...) and retry
```

---

## 5. Summary of Modified Files

1.  **`src/lib/offlineDB.ts`**: The core database controller. Initializes IndexedDB, handles CRUD actions for orders/products, implements queueing routines, handles automatic browser `online` listeners, and hosts the exponential backoff synchronizer.
2.  **`src/hooks/useSyncQueue.ts`**: A reactive hook subscribing to custom Window events (`sync_queue_updated`, `sync_status_changed`, `order_sync_success`, etc.). Exposes live state (`queue`, `offlineOrders`, `isSyncing`) to render high-fidelity syncing components and header statuses.
3.  **`backend/routes/orders.ts`**: Upgraded the live Express order registrar to optionally accept pre-defined IDs, verification tokens, and creation dates, enabling synchronized offline-to-online record convergence.
4.  **`src/services/checkoutService.ts`**: Replaced standard LocalStorage writing with the `addOrderToQueue` IndexedDB invocation.
5.  **`src/components/shop/Cart.tsx`**: Fully integrated visual offline feedback into the checkout response modal.
6.  **`src/App.tsx`**: Mounted the background migration engine, automatic sync trigger, and bound sync outcomes to gorgeous, informative notification toasts.
7.  **`src/components/admin/AdminDashboard.tsx` & `src/components/profile/UserProfile.tsx`**: Updated management lists to load order data directly from IndexedDB.
