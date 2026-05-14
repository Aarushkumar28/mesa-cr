import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-dark-hover flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-dark-muted" />
      </div>
      <h3 className="text-lg font-semibold text-dark-text mb-1">{title}</h3>
      <p className="text-sm text-dark-muted max-w-md">{message}</p>
    </div>
  );
}
