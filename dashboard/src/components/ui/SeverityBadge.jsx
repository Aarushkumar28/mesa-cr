export default function SeverityBadge({ severity }) {
  const styles = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  };

  return (
    <span className={styles[severity] || 'badge-low'}>
      {severity}
    </span>
  );
}
