import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'offline';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconClass = "w-5 h-5";
  switch (type) {
    case 'success':
      return <CheckCircleIcon className={`${iconClass} text-neon-green`} />;
    case 'error':
      return <XCircleIcon className={`${iconClass} text-neon-red`} />;
    case 'warning':
      return <ExclamationTriangleIcon className={`${iconClass} text-neon-yellow`} />;
    case 'info':
      return <InformationCircleIcon className={`${iconClass} text-neon-cyan`} />;
    case 'offline':
      return <WifiIcon className={`${iconClass} text-neon-purple`} />;
  }
};

const getToastStyles = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'border-neon-green/30 bg-neon-green/10';
    case 'error':
      return 'border-neon-red/30 bg-neon-red/10';
    case 'warning':
      return 'border-neon-yellow/30 bg-neon-yellow/10';
    case 'info':
      return 'border-neon-cyan/30 bg-neon-cyan/10';
    case 'offline':
      return 'border-neon-purple/30 bg-neon-purple/10';
  }
};

const ToastItem = ({ 
  toast, 
  onDismiss 
}: { 
  toast: Toast; 
  onDismiss: (id: string) => void;
}) => {
  return (
    <div 
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm
                 animate-slide-left shadow-lg ${getToastStyles(toast.type)}`}
    >
      <ToastIcon type={toast.type} />
      <p className="flex-1 text-sm text-trader-text">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-trader-muted hover:text-trader-text transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast: Toast = { id, type, message, duration };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
