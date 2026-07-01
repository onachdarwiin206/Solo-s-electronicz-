import { isSupabaseConfigured } from '../lib/supabase';
import { safeGetLocalStorage, safeSetLocalStorage } from '../lib/sandboxDb';

export interface OfflineMutation {
  id: string;
  timestamp: string; // ISO String for last-write-wins ordering
  entityType: 'cart' | 'order' | 'wishlist' | 'like';
  opType: 'insert' | 'update' | 'delete';
  payload: any;
}

// In-memory fallback if localStorage is completely disabled or full
const inMemoryFallback: Record<string, string> = {};

// Tab identification for leadership election
const TAB_ID = typeof window !== 'undefined' 
  ? `tab_${Math.random().toString(36).substring(2, 11)}` 
  : 'server_tab';

const MUTATION_QUEUE_KEY = 'solo_offline_mutations';
const SYNC_LOCK_KEY = 'solo_sync_lock';
const LOCK_EXPIRY_MS = 10000; // 10 seconds lock lifespan

/**
 * Custom localStorage wrapper with robust quota detection & in-memory fallback
 */
export function secureGetItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    const memVal = inMemoryFallback[key];
    if (memVal) {
      try {
        return JSON.parse(memVal) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

export function secureSetItem<T>(key: string, value: T): boolean {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.warn(`[Secure Storage] Storage quota exceeded or disabled for key "${key}". Reverting to safe in-memory cache.`);
    inMemoryFallback[key] = serialized;
    return false;
  }
}

/**
 * Adds an operations-based mutation to the persistent offline queue.
 */
export function queueOfflineMutation(
  entityType: OfflineMutation['entityType'],
  opType: OfflineMutation['opType'],
  payload: any
): string {
  const id = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  const mutation: OfflineMutation = {
    id,
    timestamp,
    entityType,
    opType,
    payload
  };

  const currentQueue = secureGetItem<OfflineMutation[]>(MUTATION_QUEUE_KEY, []);
  
  // Deduplicate identical pending operations on the same entity to avoid redundant processing
  const filteredQueue = currentQueue.filter(item => {
    const isSameEntity = item.entityType === entityType && 
                         item.opType === opType && 
                         JSON.stringify(item.payload) === JSON.stringify(payload);
    return !isSameEntity;
  });

  filteredQueue.push(mutation);
  secureSetItem(MUTATION_QUEUE_KEY, filteredQueue);
  
  console.log(`[Offline Queue] Mutation registered: ${entityType} -> ${opType}. Queue length: ${filteredQueue.length}`);
  return id;
}

/**
 * Retrieves the full pending mutation queue sorted chronologically.
 */
export function getOfflineQueue(): OfflineMutation[] {
  const queue = secureGetItem<OfflineMutation[]>(MUTATION_QUEUE_KEY, []);
  return queue.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Removes a mutation from the offline queue.
 */
export function dequeueMutation(id: string): void {
  const currentQueue = secureGetItem<OfflineMutation[]>(MUTATION_QUEUE_KEY, []);
  const updated = currentQueue.filter(m => m.id !== id);
  secureSetItem(MUTATION_QUEUE_KEY, updated);
}

/**
 * Tries to acquire the synchronization lock to declare this tab as the "Sync Leader".
 * Prevents multiple browser tabs from syncing simultaneously and causing race conditions or duplicates.
 */
function acquireSyncLock(): boolean {
  const now = Date.now();
  const currentLock = secureGetItem<{ tabId: string; expiresAt: number } | null>(SYNC_LOCK_KEY, null);

  if (currentLock && currentLock.expiresAt > now && currentLock.tabId !== TAB_ID) {
    // Another active tab holds the lock
    return false;
  }

  // Claim or renew lock
  const newLock = { tabId: TAB_ID, expiresAt: now + LOCK_EXPIRY_MS };
  return secureSetItem(SYNC_LOCK_KEY, newLock);
}

/**
 * Explicitly releases the sync lock.
 */
function releaseSyncLock(): void {
  const currentLock = secureGetItem<{ tabId: string; expiresAt: number } | null>(SYNC_LOCK_KEY, null);
  if (currentLock && currentLock.tabId === TAB_ID) {
    try {
      localStorage.removeItem(SYNC_LOCK_KEY);
    } catch {
      delete inMemoryFallback[SYNC_LOCK_KEY];
    }
  }
}

/**
 * Main Sync Engine. Replays offline mutations to Supabase in a safe, serial, and idempotent manner.
 */
export async function executeSyncEngine(supabaseClient: any, user: any): Promise<{
  syncedOrders: number;
  syncedProfileUpdates: number;
  remainingQueue: number;
}> {
  const report = { syncedOrders: 0, syncedProfileUpdates: 0, remainingQueue: 0 };
  
  if (!isSupabaseConfigured || !user || !navigator.onLine) {
    return report;
  }

  // 1. Single Sync Leader Tab Check
  if (!acquireSyncLock()) {
    console.log(`[Sync Engine] Skip sync on this tab (${TAB_ID}). Another tab holds the leader lock.`);
    return report;
  }

  try {
    const queue = getOfflineQueue();
    if (queue.length === 0) {
      releaseSyncLock();
      return report;
    }

    console.log(`[Sync Engine] Tab ${TAB_ID} starting sync replay for ${queue.length} mutations.`);

    for (const mutation of queue) {
      const { id, entityType, opType, payload } = mutation;
      
      try {
        if (entityType === 'order' && opType === 'insert') {
          // Idempotency verification: Check if order already exists on backend
          const { data: existingOrder } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('id', payload.id)
            .maybeSingle();

          if (existingOrder) {
            console.log(`[Sync Engine] Order "${payload.id}" already present in Remote DB. Skipping replay.`);
            dequeueMutation(id);
            report.syncedOrders++;
            continue;
          }

          // Safe insert with user_id context alignment
          const alignedPayload = {
            ...payload,
            user_id: user.id,
            synced_from_offline_queue: true,
            synced_at: new Date().toISOString()
          };

          const { error: orderErr } = await supabaseClient
            .from('orders')
            .insert(alignedPayload);

          if (orderErr) {
            // Check if error is schema discrepancy or fatal (not temporary network disconnect)
            if (orderErr.code === '23505' || orderErr.message?.includes('duplicate key')) {
              // Duplicate key - safely discard
              dequeueMutation(id);
            } else if (orderErr.code?.startsWith('22') || orderErr.code?.startsWith('23') || orderErr.code === 'PGRST204') {
              // Bad payload formats or constraint violations - discard to prevent blocking the queue
              console.error(`[Sync Engine] Discarding malformed order mutation ${id}:`, orderErr.message);
              dequeueMutation(id);
            } else {
              // Server offline or network timeout - leave in queue for retry
              console.warn(`[Sync Engine] Network failure during order sync ${id}. Will retry.`);
              break;
            }
          } else {
            // Update inventory remotely using secure rpc function for each item
            if (payload.items && Array.isArray(payload.items)) {
              for (const item of payload.items) {
                try {
                  await supabaseClient.rpc('deplete_product_stock', { p_id: item.id, p_qty: item.quantity });
                } catch (stockErr) {
                  console.warn("[Sync Engine] Failed to deplete remote stock for item:", item.id, stockErr);
                }
              }
            }
            dequeueMutation(id);
            report.syncedOrders++;
          }
        } 
        
        else if (entityType === 'wishlist' || entityType === 'like') {
          const field = entityType === 'wishlist' ? 'wishlist' : 'likes';
          
          // Fetch current state of this field from the backend (Last-Write-Wins logic)
          const { data: dbProfile, error: fetchErr } = await supabaseClient
            .from('profiles')
            .select(field)
            .eq('id', user.id)
            .single();

          if (fetchErr) {
            console.warn(`[Sync Engine] Could not fetch remote profile for ${entityType} sync:`, fetchErr);
            break;
          }

          const remoteList: string[] = dbProfile?.[field] || [];
          let mergedList: string[] = [];

          if (opType === 'update') {
            // Add unique item
            mergedList = Array.from(new Set([...remoteList, payload.productId]));
          } else if (opType === 'delete') {
            // Remove item
            mergedList = remoteList.filter((productId: string) => productId !== payload.productId);
          }

          // Update backend with the fully merged state
          const { error: updateErr } = await supabaseClient
            .from('profiles')
            .update({ [field]: mergedList })
            .eq('id', user.id);

          if (updateErr) {
            console.warn(`[Sync Engine] Failed syncing ${entityType} change:`, updateErr);
            break;
          }

          // Update product table liked count if syncing a 'like' toggling
          if (entityType === 'like') {
            try {
              await supabaseClient.rpc('toggle_product_like', {
                p_id: payload.productId,
                increment: opType === 'update'
              });
            } catch (likeRpcErr) {
              console.log("[Sync Engine] Like counter RPC skip:", likeRpcErr);
            }
          }

          dequeueMutation(id);
          report.syncedProfileUpdates++;
        }
      } catch (mutationError) {
        console.error(`[Sync Engine] Exception replaying mutation ${id}:`, mutationError);
      }
    }
  } finally {
    releaseSyncLock();
  }

  report.remainingQueue = getOfflineQueue().length;
  return report;
}
