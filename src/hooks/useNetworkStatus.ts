import { useState, useEffect, useCallback } from 'react';
import { isOnline, createNetworkListeners, getSyncQueue } from '../utils/offlineSync';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  pendingOperations: number;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: isOnline(),
    wasOffline: false,
    pendingOperations: getSyncQueue().length,
  });

  const handleOnline = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isOnline: true,
      wasOffline: true,
    }));
  }, []);

  const handleOffline = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isOnline: false,
    }));
  }, []);

  const refreshPendingCount = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      pendingOperations: getSyncQueue().length,
    }));
  }, []);

  useEffect(() => {
    const cleanup = createNetworkListeners(handleOnline, handleOffline);
    return cleanup;
  }, [handleOnline, handleOffline]);

  return {
    ...status,
    refreshPendingCount,
  };
}

export default useNetworkStatus;
