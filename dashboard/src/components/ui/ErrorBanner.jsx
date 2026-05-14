import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center justify-between bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" />
        <p className="text-sm text-danger">{message || 'Something went wrong. Please try again.'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-ghost text-danger hover:text-danger flex items-center gap-1.5 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}
