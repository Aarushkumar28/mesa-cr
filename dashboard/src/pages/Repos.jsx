import { GitFork, ExternalLink, Clock, Plus } from 'lucide-react';
import { useRepos } from '../hooks/useRepos';
import { SkeletonCard } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';

function timeAgo(date) {
  if (!date) return 'Never';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function Repos() {
  const { data: repos, isLoading, error, refetch } = useRepos();
  const appName = import.meta.env.VITE_GITHUB_APP_NAME || 'codereview-mesa';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Connected Repositories</h1>
          <p className="text-sm text-dark-muted mt-1">Manage GitHub App installations and repository connections</p>
        </div>
        <a
          href={`https://github.com/apps/${appName}/installations/new`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm"
        >
          <Plus className="w-4 h-4" />
          Connect New Repo
        </a>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorBanner message="Failed to load repositories" onRetry={refetch} />
      ) : !repos?.length ? (
        <EmptyState
          icon={GitFork}
          title="No repos connected"
          message="Install the Code Reviewer GitHub App on your repositories to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <div key={repo.id} className="card card-hover group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-dark-hover flex items-center justify-center group-hover:bg-accent-violet/10 transition-colors">
                    <GitFork className="w-5 h-5 text-dark-muted group-hover:text-accent-violet transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-dark-text">
                      {(repo.repo || '').split('/')[1] || repo.repo}
                    </h3>
                    <p className="text-xs text-dark-muted font-mono">
                      {(repo.repo || '').split('/')[0]}
                    </p>
                  </div>
                </div>
                <span className="badge bg-success/15 text-success border border-success/20">
                  active
                </span>
              </div>

              {/* Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-muted">Installation ID</span>
                  <span className="text-dark-text font-mono text-xs">{repo.installation_id}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-dark-border/50 flex items-center justify-between">
                <span className="text-xs text-dark-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Connected {timeAgo(repo.installed_at)}
                </span>
                <a
                  href={`https://github.com/${repo.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs p-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
