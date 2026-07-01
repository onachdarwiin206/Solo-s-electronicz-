import { Product, CartItem, Order, TrackingLog } from '../types/index';

const DB_NAME = 'DigitalHome_OfflineDB';
const DB_VERSION = 1;

export interface OfflineOrder extends Omit<Order, 'status'> {
  id: string; // Order ID
  customer_name: string;
  customer_phone: string;
  items: CartItem[];
  total: number;
  status: string;
  delivery_address: string;
  district?: string;
  payment_method?: any;
  verification_token?: string;
  payment_verified_at?: string;
  payment_deadline?: string;
  created_at: string;
  tracking_logs?: TrackingLog[];
  synced?: boolean;
}

export interface SyncQueueItem {
  id: string; // Matches order.id
  order: OfflineOrder;
  retryCount: number;
  lastAttempt?: string;
  error?: string;
  synced: boolean;
  timestamp: string;
}

export let isSyncing = false;

/**
 * Promise-based getter for the IndexedDB instance
 */
export function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in the browser context.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // Store: orders (keyPath: 'id')
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }

      // Store: products (keyPath: 'id')
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }

      // Store: syncQueue (keyPath: 'id')
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }

      console.log('[OfflineDB] Database initialized & stores created.');
    };
  });
}

/**
 * Adds or updates an order in the 'orders' store
 */
export async function addOrder(order: OfflineOrder): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('orders', 'readwrite');
    const store = tx.objectStore('orders');
    const request = store.put(order);
    request.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('offline_orders_updated'));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all orders from the 'orders' store
 */
export async function getOrders(): Promise<OfflineOrder[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('orders', 'readonly');
    const store = tx.objectStore('orders');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Caches products in the 'products' store
 */
export async function cacheProducts(products: Product[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    store.clear();
    for (const product of products) {
      store.put(product);
    }

    tx.oncomplete = () => {
      console.log(`[OfflineDB] Cached ${products.length} products to IndexedDB.`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieves cached products from the 'products' store
 */
export async function getCachedProducts(): Promise<Product[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Adds an order to the sync queue with synced=false
 */
export async function addOrderToQueue(order: OfflineOrder): Promise<void> {
  // Save order to primary orders store for immediate rendering
  await addOrder({ ...order, synced: false });

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');

    const queueItem: SyncQueueItem = {
      id: order.id,
      order,
      retryCount: 0,
      synced: false,
      timestamp: new Date().toISOString()
    };

    const request = store.put(queueItem);
    request.onsuccess = () => {
      console.log(`[OfflineDB] Order ${order.id} added to offline sync queue.`);
      window.dispatchEvent(new CustomEvent('sync_queue_updated'));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all unsynced items from the sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const request = store.getAll();
    request.onsuccess = () => {
      const items: SyncQueueItem[] = request.result || [];
      resolve(items.filter(item => !item.synced));
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Removes an order from the sync queue and marks it as synced in the orders store
 */
export async function markSynced(orderId: string): Promise<void> {
  const db = await getDB();

  // 1. Update orders store
  try {
    const txOrders = db.transaction('orders', 'readwrite');
    const storeOrders = txOrders.objectStore('orders');
    const getReq = storeOrders.get(orderId);
    getReq.onsuccess = () => {
      const order = getReq.result as OfflineOrder;
      if (order) {
        order.synced = true;
        if (!order.tracking_logs) {
          order.tracking_logs = [];
        }
        order.tracking_logs.push({
          status: 'pending',
          message: 'Order synced with the backend catalog successfully.',
          timestamp: new Date().toISOString()
        });
        storeOrders.put(order);
      }
    };
  } catch (err) {
    console.error('[OfflineDB] Error updating synced order status:', err);
  }

  // 2. Remove from syncQueue
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const request = store.delete(orderId);
    request.onsuccess = () => {
      console.log(`[OfflineDB] Removed order ${orderId} from sync queue.`);
      window.dispatchEvent(new CustomEvent('sync_queue_updated'));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Updates retry state for a queue item
 */
async function updateQueueRetryState(id: string, retryCount: number, error: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result as SyncQueueItem;
      if (item) {
        item.retryCount = retryCount;
        item.lastAttempt = new Date().toISOString();
        item.error = error;
        store.put(item);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Synchronization function with exponential backoff retry logic
 */
export async function syncWithBackoff(maxRetries = 5): Promise<void> {
  if (isSyncing) return;
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  isSyncing = true;
  window.dispatchEvent(new CustomEvent('sync_status_changed', { detail: { isSyncing } }));

  console.log(`[Offline Sync] Sourcing ${queue.length} orders for backend synchronization.`);

  // Deduplicate queue based on order ID
  const seen = new Set<string>();
  const deduplicatedQueue = queue.filter(item => {
    if (seen.has(item.order.id)) {
      markSynced(item.order.id);
      return false;
    }
    seen.add(item.order.id);
    return true;
  });

  for (const item of deduplicatedQueue) {
    let success = false;
    let delay = 2000; // 2 seconds initial backoff delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (!navigator.onLine) {
        console.warn('[Offline Sync] Sync aborted - client disconnected.');
        break;
      }

      try {
        console.log(`[Offline Sync] Replaying order ${item.order.id}. Attempt ${attempt}/${maxRetries}`);

        const payload = {
          id: item.order.id,
          items: item.order.items,
          customerName: item.order.customer_name,
          phone: item.order.customer_phone,
          address: item.order.delivery_address,
          district: item.order.district,
          deliveryFee: item.order.total - item.order.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
          paymentMethod: item.order.payment_method,
          verification_token: item.order.verification_token,
          payment_deadline: item.order.payment_deadline,
          created_at: item.order.created_at
        };

        const response = await fetch('/api/v1/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log(`[Offline Sync] Order ${item.order.id} registered on server successfully.`);
          await markSynced(item.order.id);
          
          window.dispatchEvent(new CustomEvent('order_sync_success', {
            detail: {
              orderId: item.order.id,
              verificationToken: data.verificationToken || item.order.verification_token
            }
          }));
          success = true;
          break;
        } else {
          const errorMsg = data?.error || 'Synchronization failed on backend.';
          console.error(`[Offline Sync] Server rejected order ${item.order.id}:`, errorMsg);

          // Business validation failure (e.g., stock changes or price tampering checks): Reject & remove from queue to prevent blockages
          if (
            errorMsg.includes('Logistics Limit') ||
            errorMsg.includes('stock') ||
            errorMsg.includes('out of stock') ||
            errorMsg.includes('Tampering Shield') ||
            response.status === 400
          ) {
            console.error(`[Offline Sync] Discarding order ${item.order.id} due to non-retryable conflict:`, errorMsg);
            await markSynced(item.order.id);

            window.dispatchEvent(new CustomEvent('order_sync_conflict', {
              detail: {
                orderId: item.order.id,
                error: errorMsg,
                order: item.order
              }
            }));
            success = true; // Count as processed to continue queue sequence
            break;
          }

          throw new Error(errorMsg);
        }
      } catch (err: any) {
        console.warn(`[Offline Sync] Attempt ${attempt} failed:`, err.message);
        await updateQueueRetryState(item.id, attempt, err.message);

        if (attempt === maxRetries) {
          console.error(`[Offline Sync] Sync failed completely for order ${item.order.id} after maximum retries.`);
          window.dispatchEvent(new CustomEvent('order_sync_failed', {
            detail: { orderId: item.order.id, error: err.message }
          }));
        } else {
          console.log(`[Offline Sync] Backoff retry triggered. Delaying for ${delay}ms.`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Double delay: 2s, 4s, 8s, 16s, 32s
        }
      }
    }

    // Stop queue replay if a temporary network error blocks synchronization
    if (!success) {
      break;
    }
  }

  isSyncing = false;
  window.dispatchEvent(new CustomEvent('sync_status_changed', { detail: { isSyncing } }));
}

/**
 * Triggers automatic synchronization when the browser detects a restore of online status
 */
export function onOnline() {
  console.log('[OfflineDB] Online connectivity detected. Auto-syncing queue.');
  syncWithBackoff();
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', onOnline);
}

/**
 * Migrates existing data from localStorage keys 'solo_sandbox_orders' and pending orders in 'solo_offline_mutations' to IndexedDB
 */
export async function migrateLocalStorageToIndexedDB(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Migrate sandbox orders
    const rawSandboxOrders = localStorage.getItem('solo_sandbox_orders');
    if (rawSandboxOrders) {
      try {
        const orders = JSON.parse(rawSandboxOrders);
        if (Array.isArray(orders) && orders.length > 0) {
          console.log(`[Migration] Sourcing ${orders.length} orders from localStorage for IndexedDB migration.`);
          for (const order of orders) {
            await addOrder({
              ...order,
              synced: order.synced ?? true
            });
          }
          localStorage.removeItem('solo_sandbox_orders');
          console.log('[Migration] Sandbox orders migration completed successfully.');
        }
      } catch (e) {
        console.error('[Migration] Failed to parse localStorage sandbox orders:', e);
      }
    }

    // 2. Migrate pending order insertions from mutations queue
    const rawMutations = localStorage.getItem('solo_offline_mutations');
    if (rawMutations) {
      try {
        const mutations = JSON.parse(rawMutations);
        if (Array.isArray(mutations) && mutations.length > 0) {
          const orderMutations = mutations.filter(m => m.entityType === 'order' && m.opType === 'insert');
          if (orderMutations.length > 0) {
            console.log(`[Migration] Sourcing ${orderMutations.length} unsynced orders from mutations queue.`);
            for (const mut of orderMutations) {
              const order = mut.payload;
              if (order && order.id) {
                await addOrderToQueue(order);
              }
            }
            const remainingMutations = mutations.filter(m => !(m.entityType === 'order' && m.opType === 'insert'));
            if (remainingMutations.length > 0) {
              localStorage.setItem('solo_offline_mutations', JSON.stringify(remainingMutations));
            } else {
              localStorage.removeItem('solo_offline_mutations');
            }
            console.log('[Migration] Pending offline order mutations migrated successfully.');
          }
        }
      } catch (e) {
        console.error('[Migration] Failed to parse localStorage offline mutations:', e);
      }
    }
  } catch (err) {
    console.error('[Migration] Critical exception during IndexedDB migration:', err);
  }
}
