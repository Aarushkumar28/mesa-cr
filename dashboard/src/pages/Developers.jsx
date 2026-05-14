import { Link } from 'react-router-dom';
import { Users, GitPullRequest, AlertCircle } from 'lucide-react';
import { useDevelopers } from '../hooks/useDevelopers';
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

export default function Developers() {
  const selectedRepo = useUiStore((s) => s.selectedRepo);
  const { data: developers, isLoading, error, refetch } = useDevelopers(selectedRepo);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-dark-text">Developer Profiles</h1>
        <p className="text-sm text-dark-muted mt-1">AI-tracked feedback profiles for all contributors</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorBanner message="Failed to load developers" onRetry={refetch} />
      ) : !developers?.length ? (
        <EmptyState icon={Users} title="No developers tracked" message="Developer profiles will appear here once the AI reviews their pull requests." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {developers.map((dev) => (
            <Link key={dev.username} to={`/developers/${dev.username}`} className="card card-hover group block">
              <div className="flex items-start gap-4">
                <img
                  src={dev.avatar_url || `https://github.com/${dev.username}.png`}
                  alt={dev.username}
                  className="w-12 h-12 rounded-full ring-2 ring-dark-border group-hover:ring-accent-violet/50 transition-all"
                  onError={(e) => { e.target.src = 'https://github.com/ghost.png'; }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-dark-text group-hover:text-accent-violet transition-colors">
                    {dev.username}
                  </h3>
                  <p className="text-xs font-mono text-dark-muted truncate">
                    {dev.total_comments || 0} comment{(dev.total_comments || 0) !== 1 ? 's' : ''} tracked
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-dark-border/50">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-dark-muted mb-1">
                    <GitPullRequest className="w-3 h-3" />
                  </div>
                  <p className="text-lg font-bold text-dark-text">{dev.total_prs || 0}</p>
                  <p className="text-[10px] text-dark-muted uppercase tracking-wider">PRs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-dark-muted mb-1">
                    <AlertCircle className="w-3 h-3" />
                  </div>
                  <p className={`text-lg font-bold ${(dev.active_patterns || 0) > 0 ? 'text-warning' : 'text-success'}`}>
                    {dev.active_patterns || 0}
                  </p>
                  <p className="text-[10px] text-dark-muted uppercase tracking-wider">Patterns</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-dark-muted mb-1">Last Active</p>
                  <p className="text-sm text-dark-text">{timeAgo(dev.last_active)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
