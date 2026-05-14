import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import useUiStore from '../../store/uiStore';

const icons = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'border-success/30 bg-success/10',
  error: 'border-danger/30 bg-danger/10',
  info: 'border-info/30 bg-info/10',
  warning: 'border-warning/30 bg-warning/10',
};

const iconStyles = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
  warning: 'text-warning',
};

function ToastItem({ toast }) {
  const removeToast = useUiStore((s) => s.removeToast);
  const Icon = icons[toast.type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-md animate-toast-in ${styles[toast.type] || styles.info}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconStyles[toast.type]}`} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-medium text-dark-text">{toast.title}</p>}
        <p className="text-sm text-dark-muted">{toast.message}</p>
      </div>
      <button onClick={() => removeToast(toast.id)} className="text-dark-muted hover:text-dark-text">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
