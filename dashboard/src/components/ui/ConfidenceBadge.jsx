export default function ConfidenceBadge({ score }) {
  const percentage = Math.round(score * 100);
  const getColor = () => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 70) return 'bg-accent-blue';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  const getTextColor = () => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 70) return 'text-accent-blue';
    if (percentage >= 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-dark-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-medium ${getTextColor()}`}>
        {percentage}%
      </span>
    </div>
  );
}
