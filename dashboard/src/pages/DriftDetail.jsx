import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingDown, Calendar, FileCode } from 'lucide-react';
import { useDriftDetail } from '../hooks/useDrift';
import { SkeletonCard } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';

export default function DriftDetail() {
  const { snapshotId } = useParams();
  const { data: drift, isLoading, error, refetch } = useDriftDetail(snapshotId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) return <ErrorBanner message="Failed to load drift detail" onRetry={refetch} />;
  if (!drift) return null;

  // Real API returns: { id, repo, snapshot (raw text), created_at }
  // snapshot is a raw string (file list or JSON blob from Agent D)
  const snapshotText = drift.snapshot || 'No snapshot data available.';

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/drift" className="inline-flex items-center gap-1.5 text-sm text-dark-muted hover:text-accent-violet transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Drift Reports
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-text flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-warning" />
              Drift Snapshot #{drift.id}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-dark-muted">
              <span className="font-mono">{drift.repo}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {drift.created_at ? new Date(drift.created_at).toLocaleString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Snapshot */}
      <div className="card">
        <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2 mb-4">
          <FileCode className="w-5 h-5 text-accent-blue" />
          Architecture Snapshot
        </h2>
        <div className="bg-dark-subtle rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs text-dark-text font-mono whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
            {snapshotText}
          </pre>
        </div>
      </div>
    </div>
  );
}
