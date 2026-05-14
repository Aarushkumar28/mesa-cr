import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, GitPullRequest, FileCode, Zap, CheckCircle } from 'lucide-react';
import { useConflicts } from '../hooks/useConflicts';
import useUiStore from '../store/uiStore';
import { SkeletonCard } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';

function timeAgo(date) {
  if (!date) return 'N/A';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default function Conflicts() {
  const selectedRepo = useUiStore((s) => s.selectedRepo);

  const { data, isLoading, error, refetch } = useConflicts({
    repo: selectedRepo,
  });

  // Backend returns { open_prs: [...], conflicts: [...] }
  const conflicts = data?.conflicts || [];
  const openPrs = data?.open_prs || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-dark-text">Inter-PR Conflict Monitor</h1>
        <p className="text-sm text-dark-muted mt-1">Detected conflicts between open pull requests</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorBanner message="Failed to load conflicts" onRetry={refetch} />
      ) : conflicts.length === 0 && openPrs.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No conflicts detected"
          message="Your PRs are clean — no overlapping or semantically incompatible changes found. ✓"
        />
      ) : (
        <div className="space-y-6">
          {/* Detected Conflicts */}
          {conflicts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-dark-text flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-severity-high" />
                Active Conflicts ({conflicts.length})
              </h2>
              {conflicts.map((conflict) => (
                <Link
                  key={conflict.id}
                  to={`/conflicts/${conflict.id}`}
                  className="card card-hover flex items-center justify-between group block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-severity-high/10">
                      <AlertTriangle className="w-6 h-6 text-severity-high" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="flex items-center gap-1 text-sm font-medium text-dark-text">
                          <GitPullRequest className="w-4 h-4 text-accent-blue" />
                          PR #{conflict.pr_number}
                        </span>
                        <Zap className="w-4 h-4 text-warning" />
                        <span className="flex items-center gap-1 text-sm font-medium text-dark-text">
                          <GitPullRequest className="w-4 h-4 text-accent-blue" />
                          PR #{conflict.conflicting_pr_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-dark-muted">
                        <span className="font-mono">{(conflict.repo || '').split('/')[1] || conflict.repo}</span>
                        <span>·</span>
                        <span>{timeAgo(conflict.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-dark-muted group-hover:text-accent-violet transition-colors" />
                </Link>
              ))}
            </div>
          )}

          {/* Open PRs */}
          {openPrs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-dark-text flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-accent-blue" />
                Open PRs ({openPrs.length})
              </h2>
              {openPrs.map((pr, i) => (
                <div key={i} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitPullRequest className="w-5 h-5 text-accent-blue" />
                    <div>
                      <span className="text-sm font-medium text-dark-text">PR #{pr.pr_number}</span>
                      <p className="text-xs text-dark-muted">by {pr.author} · {(pr.repo || '').split('/')[1] || pr.repo}</p>
                    </div>
                  </div>
                  <span className="text-xs text-dark-muted">{timeAgo(pr.opened_at)}</span>
                </div>
              ))}
            </div>
          )}

          {/* No conflicts but has PRs */}
          {conflicts.length === 0 && openPrs.length > 0 && (
            <div className="card bg-success/5 border-success/20 text-center py-4">
              <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-sm text-dark-text">No conflicts detected across {openPrs.length} open PR{openPrs.length !== 1 ? 's' : ''}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
