import { useState, useEffect, useCallback } from 'react';
import { SyncQueueItem, OfflineOrder, getSyncQueue, getOrders, syncWithBackoff, isSyncing as initialSyncState } from '../lib/offlineDB';

/**
 * React hook to access offline sync status, queue items, and trigger manual synchronization.
 * Synchronizes with IndexedDB events to ensure reactive, live UI updates.
 */
export function useSyncQueue() {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [offlineOrders, setOfflineOrders] = useState<OfflineOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(initialSyncState);

  const refreshData = useCallback(async () => {
    try {
      const q = await getSyncQueue();
      const o = await getOrders();
      setQueue(q);
      // Sort orders descending by creation date
      const sortedOrders = o.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOfflineOrders(sortedOrders);
    } catch (err) {
      console.error('[useSyncQueue] Failed to load data from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    // Load initial data
    refreshData();

    // Setup event listeners for IndexedDB changes
    const handleQueueUpdate = () => {
      refreshData();
    };

    const handleSyncStatusUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.isSyncing === 'boolean') {
        setIsSyncing(customEvent.detail.isSyncing);
      }
      refreshData();
    };

    window.addEventListener('sync_queue_updated', handleQueueUpdate);
    window.addEventListener('offline_orders_updated', handleQueueUpdate);
    window.addEventListener('sync_status_changed', handleSyncStatusUpdate);
    window.addEventListener('order_sync_success', handleQueueUpdate);
    window.addEventListener('order_sync_conflict', handleQueueUpdate);

    return () => {
      window.removeEventListener('sync_queue_updated', handleQueueUpdate);
      window.removeEventListener('offline_orders_updated', handleQueueUpdate);
      window.removeEventListener('sync_status_changed', handleSyncStatusUpdate);
      window.removeEventListener('order_sync_success', handleQueueUpdate);
      window.removeEventListener('order_sync_conflict', handleQueueUpdate);
    };
  }, [refreshData]);

  const syncNow = useCallback(async () => {
    await syncWithBackoff();
  }, []);

  return {
    queue,
    offlineOrders,
    isSyncing,
    syncNow,
    refreshData,
  };
}
