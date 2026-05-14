import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, GitPullRequest, MessageSquare,
  CheckCircle, AlertCircle, Brain, Clock
} from 'lucide-react';
import { useDeveloperDetail } from '../hooks/useDevelopers';
import { SkeletonCard } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';

function timeAgo(date) {
  if (!date) return 'N/A';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default function DeveloperDetail() {
  const { username } = useParams();
  const { data: dev, isLoading, error, refetch } = useDeveloperDetail(username);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) return <ErrorBanner message="Failed to load developer profile" onRetry={refetch} />;
  if (!dev) return null;

  // Real API returns: { username, avatar_url, github_url, total_prs,
  //   active_patterns: [{category, occurrence_count, ...}],
  //   resolved_patterns: [...], recent_comments: [...], dev_profile_summary }
  const activePatterns = dev.active_patterns || [];
  const resolvedPatterns = dev.resolved_patterns || [];
  const recentComments = dev.recent_comments || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link to="/developers" className="inline-flex items-center gap-1.5 text-sm text-dark-muted hover:text-accent-violet transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Developers
      </Link>

      {/* Profile Header */}
      <div className="card">
        <div className="flex items-center gap-5">
          <img
            src={dev.avatar_url || `https://github.com/${dev.username}.png`}
            alt={dev.username}
            className="w-20 h-20 rounded-full ring-3 ring-dark-border"
            onError={(e) => { e.target.src = 'https://github.com/ghost.png'; }}
          />
          <div>
            <h1 className="text-2xl font-bold text-dark-text">{dev.username}</h1>
            <a
              href={dev.github_url || `https://github.com/${dev.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:underline mt-1"
            >
              View on GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total PRs', value: dev.total_prs || 0, icon: GitPullRequest, color: 'text-accent-blue' },
            { label: 'Active Patterns', value: activePatterns.length, icon: AlertCircle, color: 'text-warning' },
            { label: 'Resolved', value: resolvedPatterns.length, icon: CheckCircle, color: 'text-success' },
            { label: 'Recent Comments', value: recentComments.length, icon: MessageSquare, color: 'text-accent-violet' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-dark-subtle rounded-xl p-4 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
              <p className="text-xl font-bold text-dark-text">{value}</p>
              <p className="text-xs text-dark-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Patterns */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Active Patterns
          </h2>
          <span className="text-xs text-dark-muted">{activePatterns.length} active</span>
        </div>

        {activePatterns.length === 0 ? (
          <p className="text-sm text-dark-muted py-4 text-center">No active patterns — great work! ✓</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border text-xs text-dark-muted uppercase tracking-wider">
                  <th className="text-left px-4 py-2 font-medium">Category</th>
                  <th className="text-left px-4 py-2 font-medium">Occurrences</th>
                  <th className="text-left px-4 py-2 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {activePatterns.map((pattern, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="px-4 py-3">
                      <span className="badge bg-warning/15 text-warning border border-warning/20">{pattern.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-dark-text">{pattern.occurrence_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-dark-muted">{pattern.last_seen ? timeAgo(pattern.last_seen) : '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Comments */}
      {recentComments.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent-violet" />
              Recent AI Feedback
            </h2>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {recentComments.slice(0, 10).map((c, i) => (
              <div key={i} className="bg-dark-subtle/50 rounded-lg p-3 border-l-2 border-l-accent-violet/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="badge bg-accent-violet/15 text-accent-violet border border-accent-violet/20 text-[10px]">{c.category}</span>
                  <span className="text-[10px] text-dark-muted flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    PR #{c.pr_number}
                  </span>
                </div>
                <p className="text-xs text-dark-text mt-1 line-clamp-2">{c.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {!dev.dev_profile_summary && (
        <div className="card border-l-2 border-l-dark-border opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-dark-muted" />
            <h2 className="text-lg font-semibold text-dark-text">AI Feedback Summary</h2>
          </div>
          <p className="text-sm text-dark-muted italic">AI summary not yet generated for this developer. It will appear after their next PR review.</p>
        </div>
      )}
    </div>
  );
}
