export default function StatusIndicator({ status, label }) {
  const dotClass = status === 'up' || status === true
    ? 'status-dot-green'
    : status === 'degraded'
      ? 'status-dot-yellow'
      : 'status-dot-red';

  return (
    <div className="flex items-center gap-2">
      <span className={dotClass} />
      {label && <span className="text-xs text-dark-muted">{label}</span>}
    </div>
  );
}
