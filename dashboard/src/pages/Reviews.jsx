import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitPullRequest, ExternalLink, Filter, Search } from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import useUiStore from '../store/uiStore';
import { SkeletonTable } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';

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

// Map category to badge styles
const categoryStyles = {
  security: 'bg-severity-critical/15 text-severity-critical border border-severity-critical/20',
  logic_error: 'bg-severity-high/15 text-severity-high border border-severity-high/20',
  code_smell: 'bg-warning/15 text-warning border border-warning/20',
  bad_practice: 'bg-severity-medium/15 text-severity-medium border border-severity-medium/20',
  architecture_concern: 'bg-accent-violet/15 text-accent-violet border border-accent-violet/20',
  style: 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20',
  logic: 'bg-severity-high/15 text-severity-high border border-severity-high/20',
  architecture: 'bg-accent-violet/15 text-accent-violet border border-accent-violet/20',
};

export default function Reviews() {
  const selectedRepo = useUiStore((s) => s.selectedRepo);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: reviews, isLoading, error, refetch } = useReviews({
    repo: selectedRepo,
  });

  // Client-side search filter
  const filteredReviews = reviews?.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        String(r.pr_number).includes(q) ||
        (r.author || '').toLowerCase().includes(q) ||
        (r.repo || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">PR Review Center</h1>
          <p className="text-sm text-dark-muted mt-1">All pull requests reviewed by the AI system</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            placeholder="Search by PR number, author, or repo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-10"
          />
        </div>
      </div>

      {/* Review List */}
      {isLoading ? (
        <div className="card"><SkeletonTable rows={6} cols={5} /></div>
      ) : error ? (
        <ErrorBanner message="Failed to load reviews" onRetry={refetch} />
      ) : !filteredReviews?.length ? (
        <EmptyState
          icon={GitPullRequest}
          title="No reviews found"
          message="No PRs have been reviewed yet. Reviews will appear here after the AI processes pull requests."
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border text-xs text-dark-muted uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">PR</th>
                <th className="text-left px-5 py-3 font-medium">Author</th>
                <th className="text-left px-5 py-3 font-medium">Categories</th>
                <th className="text-left px-5 py-3 font-medium">Comments</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={`${review.repo}-${review.pr_number}`} className="table-row">
                  <td className="px-5 py-4">
                    <Link to={`/reviews/${review.pr_number}`} className="hover:text-accent-violet transition-colors">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="w-4 h-4 text-accent-blue flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-dark-text">#{review.pr_number}</span>
                          <p className="text-xs text-dark-muted truncate max-w-[200px] font-mono">{review.repo}</p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-dark-text font-mono">{review.author}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {(review.categories || []).map((cat) => (
                        <span key={cat} className={`badge text-[10px] ${categoryStyles[cat] || 'bg-dark-hover text-dark-muted border border-dark-border'}`}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-dark-text">{review.comment_count}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-dark-muted">{timeAgo(review.date)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <a href={review.github_url} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
