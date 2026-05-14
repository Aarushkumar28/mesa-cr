import {
  GitPullRequest, MessageSquare, AlertTriangle, TrendingDown,
  GitFork, Activity, CheckCircle, XCircle, Clock, ArrowUpRight,
  Shield, Users, Swords, Scale
} from 'lucide-react';
import { useDashboardStats, useDashboardActivity } from '../hooks/useDashboard';
import { useHealth } from '../hooks/useConfig';
import { SkeletonStats, SkeletonCard } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';

const eventIcons = {
  pr_reviewed: GitPullRequest,
  conflict_detected: AlertTriangle,
  drift_flagged: TrendingDown,
  debate_escalated: Swords,
  debate_resolved: Scale,
};

const eventColors = {
  pr_reviewed: 'text-accent-blue bg-accent-blue/10',
  conflict_detected: 'text-severity-high bg-severity-high/10',
  drift_flagged: 'text-warning bg-warning/10',
  debate_escalated: 'text-danger bg-danger/10',
  debate_resolved: 'text-success bg-success/10',
};

function timeAgo(date) {
  if (!date) return 'N/A';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: activity, isLoading: activityLoading, error: activityError, refetch: refetchActivity } = useDashboardActivity();
  const { data: health } = useHealth();

  const statCards = stats ? [
    { label: 'PRs Reviewed', value: stats.total_prs_reviewed || 0, icon: GitPullRequest, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
    { label: 'AI Comments', value: stats.total_comments || 0, icon: MessageSquare, color: 'text-accent-violet', bg: 'bg-accent-violet/10' },
    { label: 'Active Conflicts', value: stats.active_conflicts || 0, icon: AlertTriangle, color: 'text-severity-high', bg: 'bg-severity-high/10' },
    { label: 'Drift Snapshots', value: stats.total_drift_snapshots || 0, icon: TrendingDown, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Connected Repos', value: stats.connected_repos || 0, icon: GitFork, color: 'text-success', bg: 'bg-success/10' },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Dashboard</h1>
          <p className="text-sm text-dark-muted mt-1">Overview of your AI code review system</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-dark-muted">
          <Activity className="w-4 h-4" />
          <span>Live — updates every 30s</span>
        </div>
      </div>

      {/* Stats Bar */}
      {statsLoading ? (
        <SkeletonStats count={5} />
      ) : statsError ? (
        <ErrorBanner message="Failed to load dashboard stats" onRetry={refetchStats} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card card-hover group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-dark-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold text-dark-text">{(value || 0).toLocaleString()}</p>
              <p className="text-xs text-dark-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent-violet" />
                Recent Activity
              </h2>
              <span className="text-xs text-dark-muted">{activity?.length || 0} events</span>
            </div>

            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 py-3">
                    <div className="skeleton w-9 h-9 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton w-3/4 h-4" />
                      <div className="skeleton w-1/3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityError ? (
              <ErrorBanner message="Failed to load activity" onRetry={refetchActivity} />
            ) : !activity?.length ? (
              <div className="text-center py-8 text-dark-muted text-sm">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No activity yet. Open a PR on a connected repo to see events here.</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {activity.map((event) => {
                  const Icon = eventIcons[event.type] || Activity;
                  const colorClass = eventColors[event.type] || 'text-dark-muted bg-dark-hover';
                  return (
                    <div key={event.id} className="flex items-start gap-3 py-3 px-2 rounded-lg hover:bg-dark-hover/50 transition-colors group">
                      <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-dark-text">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-dark-muted">{(event.repo || '').split('/')[1] || event.repo}</span>
                          <span className="text-dark-border">·</span>
                          <span className="text-xs text-dark-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div>
          <div className="card">
            <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-success" />
              System Health
            </h2>
            <div className="space-y-3">
              {[
                { label: 'API Server', check: (h) => h?.status === 'running' },
                { label: 'SQLite Database', check: (h) => h?.sqlite === 'ok' },
              ].map(({ label, check }) => (
                <div key={label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-subtle/50">
                  <span className="text-sm text-dark-text">{label}</span>
                  <div className="flex items-center gap-2">
                    {check(health) ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-xs text-success">Online</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-danger" />
                        <span className="text-xs text-danger">Offline</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card mt-4">
            <h3 className="text-sm font-semibold text-dark-text mb-3">Quick Links</h3>
            <div className="space-y-2">
              {[
                { label: 'View latest reviews', href: '/reviews' },
                { label: 'Check for conflicts', href: '/conflicts' },
                { label: 'Architecture drift', href: '/drift' },
                { label: 'Configure rules', href: '/config' },
              ].map(({ label, href }) => (
                <a key={href} href={href} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-hover transition-colors group text-sm text-dark-muted hover:text-dark-text">
                  <span>{label}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
