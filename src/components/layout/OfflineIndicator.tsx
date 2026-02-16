import { useEffect } from 'react';
import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useToast } from '../../contexts/ToastContext';

const OfflineIndicator = () => {
  const { isOnline, wasOffline, pendingOperations } = useNetworkStatus();
  const { showToast } = useToast();

  // Show toast when going offline/online
  useEffect(() => {
    if (!isOnline) {
      showToast('offline', 'You are offline. Changes will sync when reconnected.', 0);
    } else if (wasOffline) {
      showToast('success', 'Back online! Syncing changes...', 3000);
    }
  }, [isOnline, wasOffline, showToast]);

  if (isOnline && pendingOperations === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 
                    rounded-lg border backdrop-blur-sm text-xs font-medium
                    ${isOnline 
                      ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' 
                      : 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple'
                    }`}>
      {isOnline ? (
        <>
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          <span>Syncing {pendingOperations} changes...</span>
        </>
      ) : (
        <>
          <WifiIcon className="w-4 h-4" />
          <span>Offline Mode</span>
          {pendingOperations > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-neon-purple/20 text-[10px]">
              {pendingOperations} pending
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
