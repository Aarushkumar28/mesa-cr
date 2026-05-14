import { Link } from 'react-router-dom';
import { TrendingDown, Calendar, ChevronRight } from 'lucide-react';
import { useDriftList } from '../hooks/useDrift';
import useUiStore from '../store/uiStore';
import { SkeletonCard } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';

export default function Drift() {
  const selectedRepo = useUiStore((s) => s.selectedRepo);
  const { data: snapshots, isLoading, error, refetch } = useDriftList(selectedRepo);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-dark-text">Architecture Drift Reports</h1>
        <p className="text-sm text-dark-muted mt-1">Track codebase structural deviations from baseline architecture</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorBanner message="Failed to load drift snapshots" onRetry={refetch} />
      ) : !snapshots?.length ? (
        <EmptyState
          icon={TrendingDown}
          title="No drift snapshots yet"
          message="Architecture drift scans run weekly via Celery Beat. Snapshots will appear here after the first scan."
        />
      ) : (
        <div className="space-y-3">
          {snapshots.map((snapshot) => (
            <Link
              key={snapshot.id}
              to={`/drift/${snapshot.id}`}
              className="card card-hover flex items-center justify-between group block"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  snapshot.is_latest ? 'bg-warning/10' : 'bg-dark-hover'
                }`}>
                  <TrendingDown className={`w-6 h-6 ${snapshot.is_latest ? 'text-warning' : 'text-dark-muted'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dark-text group-hover:text-accent-violet transition-colors">
                      Snapshot #{snapshot.id}
                    </h3>
                    {snapshot.is_latest && (
                      <span className="badge bg-accent-blue/15 text-accent-blue border border-accent-blue/20 text-[10px]">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-dark-muted">
                    <span className="font-mono">{(snapshot.repo || '').split('/')[1] || snapshot.repo}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {snapshot.created_at ? new Date(snapshot.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-dark-muted group-hover:text-accent-violet transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
