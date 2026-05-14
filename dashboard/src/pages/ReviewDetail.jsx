import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileCode, MessageSquare } from 'lucide-react';
import { useReviewDetail } from '../hooks/useReviews';
import { SkeletonCard } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';

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

export default function ReviewDetail() {
  const { prNumber } = useParams();
  const { data: review, isLoading, error, refetch } = useReviewDetail(prNumber);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) return <ErrorBanner message="Failed to load PR review" onRetry={refetch} />;
  if (!review) return null;

  // Real API returns: { pr_number, repo, author, github_url, comments: [{id, username, repo, pr_number, category, comment, created_at}] }
  const comments = review.comments || [];

  // Group categories for summary
  const categoryCounts = {};
  comments.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link to="/reviews" className="inline-flex items-center gap-1.5 text-sm text-dark-muted hover:text-accent-violet transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Reviews
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-text flex items-center gap-3">
              <span className="text-accent-blue">#{review.pr_number}</span>
              PR Review
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-dark-muted">
              <span className="font-mono">{review.repo}</span>
              <span>·</span>
              <span>by <strong className="text-dark-text">{review.author}</strong></span>
            </div>
          </div>
          <a href={review.github_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
            <ExternalLink className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-dark-text">{comments.length}</p>
          <p className="text-xs text-dark-muted">Total Comments</p>
        </div>
        {Object.entries(categoryCounts).slice(0, 3).map(([cat, count]) => (
          <div key={cat} className="card text-center">
            <p className="text-2xl font-bold text-dark-text">{count}</p>
            <p className="text-xs text-dark-muted capitalize">{cat.replace(/_/g, ' ')}</p>
          </div>
        ))}
      </div>

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent-violet" />
          AI Review Comments
        </h2>

        {comments.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-dark-muted text-sm">No comments found for this PR.</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="card border-l-2 border-l-accent-violet/50">
              {/* Category Badge + Timestamp */}
              <div className="flex items-center justify-between mb-3">
                <span className={`badge ${categoryStyles[c.category] || 'bg-dark-hover text-dark-muted border border-dark-border'}`}>
                  {c.category}
                </span>
                <span className="text-xs text-dark-muted">{timeAgo(c.created_at)}</span>
              </div>

              {/* Comment Body */}
              <p className="text-sm text-dark-text leading-relaxed">{c.comment}</p>

              {/* Metadata */}
              <div className="flex items-center gap-3 mt-3 text-xs text-dark-muted">
                <span className="font-mono">by {c.username}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
