/**
 * Offline Sync Queue — Manages offline edits and syncs when online
 */

export interface SyncOperation {
  id: string;
  type: 'toggleDay' | 'updateDayHours' | 'createHabit' | 'updateHabit' | 'deleteHabit';
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

const SYNC_QUEUE_KEY = 'habit-tracker-sync-queue';
const OFFLINE_DATA_KEY = 'habit-tracker-offline-data';
const MAX_RETRIES = 3;

/**
 * Get pending operations from localStorage
 */
export function getSyncQueue(): SyncOperation[] {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save sync queue to localStorage
 */
export function saveSyncQueue(queue: SyncOperation[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save sync queue:', e);
  }
}

/**
 * Add operation to sync queue
 */
export function addToSyncQueue(
  type: SyncOperation['type'],
  payload: Record<string, unknown>
): SyncOperation {
  const queue = getSyncQueue();
  const operation: SyncOperation = {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    payload,
    timestamp: Date.now(),
    retries: 0,
  };
  queue.push(operation);
  saveSyncQueue(queue);
  return operation;
}

/**
 * Remove operation from sync queue
 */
export function removeFromSyncQueue(operationId: string): void {
  const queue = getSyncQueue();
  const filtered = queue.filter((op) => op.id !== operationId);
  saveSyncQueue(filtered);
}

/**
 * Increment retry count for an operation
 */
export function incrementRetry(operationId: string): boolean {
  const queue = getSyncQueue();
  const operation = queue.find((op) => op.id === operationId);
  
  if (operation) {
    operation.retries++;
    if (operation.retries >= MAX_RETRIES) {
      // Remove after max retries
      saveSyncQueue(queue.filter((op) => op.id !== operationId));
      return false;
    }
    saveSyncQueue(queue);
    return true;
  }
  return false;
}

/**
 * Clear entire sync queue
 */
export function clearSyncQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

/**
 * Cache offline data (last loaded week)
 */
export function cacheOfflineData(weekId: string, data: unknown): void {
  try {
    const stored = getOfflineCache();
    stored[weekId] = {
      data,
      cachedAt: Date.now(),
    };
    // Keep only last 4 weeks
    const weekIds = Object.keys(stored).sort().reverse();
    if (weekIds.length > 4) {
      weekIds.slice(4).forEach((id) => delete stored[id]);
    }
    localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to cache offline data:', e);
  }
}

/**
 * Get offline cache
 */
export function getOfflineCache(): Record<string, { data: unknown; cachedAt: number }> {
  try {
    const stored = localStorage.getItem(OFFLINE_DATA_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get cached data for a specific week
 */
export function getCachedWeekData(weekId: string): unknown | null {
  const cache = getOfflineCache();
  return cache[weekId]?.data || null;
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Create online/offline event listeners
 */
export function createNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
