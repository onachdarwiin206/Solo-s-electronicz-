import { isSupabaseConfigured } from './supabase';

const SCHEMA_VERSION_KEY = 'solo_sandbox_schema_version';
const CURRENT_SCHEMA_VERSION = 1;

// Channels for Broadcast logic
const BROADCAST_CHANNEL_NAME = 'solo_sandbox_channel';

// Custom event for cross-tab or in-page events when BroadcastChannel is not supported
export const SANDBOX_SYNC_EVENT = 'solo_sandbox_sync_event';

// Initial structure templates for corruption relief
const DEFAULT_TEMPLATES = {
  'solo_sandbox_orders': [],
  'solo_sandbox_users': [],
  'solo_sandbox_session': null,
};

/**
 * Safe JSON parser with auto-recovery on corruption
 */
export function safeGetLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  const raw = localStorage.getItem(key);
  if (raw === null) {
    // Key doesn't exist, set the template if available
    const initial = (DEFAULT_TEMPLATES as any)[key] !== undefined 
      ? (DEFAULT_TEMPLATES as any)[key] 
      : defaultValue;
    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch (e) {
      console.error('[Sandbox Storage] Failed to write initial template:', e);
    }
    return initial as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[Sandbox Storage] Corrupted data detected in key "${key}". Initiating safe recovery.`, error);
    
    // Backup corrupted string in case user has important local state they want to salvage manually
    try {
      localStorage.setItem(`${key}_corrupted_backup_${Date.now()}`, raw);
    } catch {
      // Ignore if localstorage is full
    }

    // Set defaults and heal
    const fallback = (DEFAULT_TEMPLATES as any)[key] !== undefined 
      ? (DEFAULT_TEMPLATES as any)[key] 
      : defaultValue;
      
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback as T;
  }
}

/**
 * Persistently records a local storage value and triggers cross-tab sync signals
 */
export function safeSetLocalStorage<T>(key: string, value: T, bypassBroadcast = false): void {
  if (typeof window === 'undefined') return;
  
  try {
    const rawVal = JSON.stringify(value);
    localStorage.setItem(key, rawVal);
    
    if (!bypassBroadcast) {
      // Trigger BroadcastChannel for cross-tab sync
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          bc.postMessage({ type: 'SYNC_KEY', key, value });
          bc.close();
        }
      } catch (broadcastErr) {
        // Fallback for limited sandbox iframe sandbox environments
      }

      // Also trigger a window-level custom event for dynamic state re-renders in the active window
      window.dispatchEvent(new CustomEvent(SANDBOX_SYNC_EVENT, { detail: { key, value } }));
    }
  } catch (e) {
    console.error(`[Sandbox Storage] Parse error writing key "${key}":`, e);
  }
}

/**
 * Automatically initializes and checks schema versioning on boot
 */
export function initializeSandboxSchema(): void {
  if (typeof window === 'undefined') return;

  const activeVersion = safeGetLocalStorage<number>(SCHEMA_VERSION_KEY, 0);
  
  if (activeVersion < CURRENT_SCHEMA_VERSION) {
    console.log(`[Sandbox Migrator] Migrating Local Database Schema from v${activeVersion} to v${CURRENT_SCHEMA_VERSION}`);
    
    // Perform migrations if schema properties have drifted in newer revisions
    if (activeVersion === 0) {
      // Convert legacy wishlists or preferences structure if exists
      try {
        const legacyWish = localStorage.getItem('guest_wishlist');
        if (legacyWish) {
          const items = JSON.parse(legacyWish);
          const currentSession = safeGetLocalStorage<any>('solo_sandbox_session', null);
          if (currentSession) {
            currentSession.wishlist = Array.from(new Set([...(currentSession.wishlist || []), ...items]));
            safeSetLocalStorage('solo_sandbox_session', currentSession);
          }
          localStorage.removeItem('guest_wishlist');
        }
      } catch (err) {
        console.warn('[Sandbox Migrator] Failed converting guest_wishlist legacy nodes');
      }
    }

    // Set stable version descriptor
    safeSetLocalStorage(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION, true);
  }

  // Bind to dynamic cross-tab synchronization listener
  try {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_KEY') {
          const { key, value } = event.data;
          // Set internally while bypassing loop trigger
          safeSetLocalStorage(key, value, true);
          // Redispatch local layout update
          window.dispatchEvent(new CustomEvent(SANDBOX_SYNC_EVENT, { detail: { key, value } }));
        }
      };
    }
  } catch (bcError) {
    // Fail silently in sandboxed environments lacking BroadcastChannel Permissions
  }
}

/**
 * Generates an elegant, highly structured and deterministic Order Tracking Reference.
 * Formatted as: SL-YYYY-MMDD-[6-char deterministic entropy]
 */
export function generateDeterministicOrderId(phone: string, district: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Combine characteristics of transaction context to make a semi-stable checksum hash
  const salt = `${phone || '000000'}-${district || 'UG'}-${now.getTime()}-${Math.random()}`;
  let hashVal = 0;
  for (let i = 0; i < salt.length; i++) {
    hashVal = (hashVal << 5) - hashVal + salt.charCodeAt(i);
    hashVal |= 0; // Force 32-bit integer signature
  }
  
  const alphanumericSalt = Math.abs(hashVal).toString(36).toUpperCase().substring(0, 6).padStart(6, 'X');
  return `SL-${year}-${month}${day}-${alphanumericSalt}`;
}

/**
 * Prepared Synchronization path: Migrates sandbox checkout history and preferences 
 * to active remote Supabase cloud structures when connectivity returns or is configured.
 */
export async function syncSandboxDataToRemote(supabaseClient: any, remoteUser: any): Promise<{
  syncedLikes: number;
  syncedWishlist: number;
  syncedOrders: number;
}> {
  const result = { syncedLikes: 0, syncedWishlist: 0, syncedOrders: 0 };
  if (!isSupabaseConfigured || !remoteUser) return result;

  try {
    // 1. Sync User likes/wishlists back up to Remote Profiles
    const cachedSession = safeGetLocalStorage<any>('solo_sandbox_session', null);
    if (cachedSession) {
      const sandboxLikes = cachedSession.likes || [];
      const sandboxWishlist = cachedSession.wishlist || [];

      if (sandboxLikes.length > 0 || sandboxWishlist.length > 0) {
        // Fetch original profile from live DB
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('likes, wishlist')
          .eq('id', remoteUser.id)
          .single();

        const combinedLikes = Array.from(new Set([...(profile?.likes || []), ...sandboxLikes]));
        const combinedWishlist = Array.from(new Set([...(profile?.wishlist || []), ...sandboxWishlist]));

        const { error: profileSyncError } = await supabaseClient
          .from('profiles')
          .update({
            likes: combinedLikes,
            wishlist: combinedWishlist
          })
          .eq('id', remoteUser.id);

        if (!profileSyncError) {
          result.syncedLikes = sandboxLikes.length;
          result.syncedWishlist = sandboxWishlist.length;
          
          // Align offline session reference
          cachedSession.likes = combinedLikes;
          cachedSession.wishlist = combinedWishlist;
          safeSetLocalStorage('solo_sandbox_session', cachedSession);
        }
      }
    }

    // 2. Sync Offline Transactions created during sandbox states
    const offlineOrders = safeGetLocalStorage<any[]>('solo_sandbox_orders', []);
    if (offlineOrders.length > 0) {
      // Upload each offline order to high-fidelity storage structures in Remote
      let count = 0;
      for (const order of offlineOrders) {
        // Only upload orders associated with current user or upload guest orders to their account
        const sanitizedOrder = {
          ...order,
          user_id: remoteUser.id, // claim order ownership inside user account
          synced_from_sandbox: true,
          synced_at: new Date().toISOString()
        };

        const { error: orderUploadError } = await supabaseClient
          .from('orders')
          .insert(sanitizedOrder);

        if (!orderUploadError) {
          count++;
        } else {
          console.error('[Sandbox Sync] Failed uploading order sequence:', order.id, orderUploadError);
        }
      }

      result.syncedOrders = count;

      // Clear or tag synced items from sandbox order manifest to prevent duplicate uploads
      safeSetLocalStorage('solo_sandbox_orders', []);
    }

  } catch (syncErr) {
    console.error('[Sandbox Sync] Synchronizer pipeline encountered general exception:', syncErr);
  }

  return result;
}
