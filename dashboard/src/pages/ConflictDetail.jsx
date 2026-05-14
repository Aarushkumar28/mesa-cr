import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, GitPullRequest, FileCode, AlertTriangle,
  Zap, MessageSquare
} from 'lucide-react';
import { useConflictDetail } from '../hooks/useConflicts';
import { SkeletonCard } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';

export default function ConflictDetail() {
  const { id } = useParams();
  const { data: conflict, isLoading, error, refetch } = useConflictDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) return <ErrorBanner message="Failed to load conflict detail" onRetry={refetch} />;
  if (!conflict) return null;

  // Real API: { id, repo, pr_number, conflicting_pr_number, files: [], reason, created_at }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/conflicts" className="inline-flex items-center gap-1.5 text-sm text-dark-muted hover:text-accent-violet transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Conflicts
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-severity-high" />
          <h1 className="text-2xl font-bold text-dark-text">Conflict #{conflict.id}</h1>
        </div>

        {/* PR Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-subtle rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <GitPullRequest className="w-5 h-5 text-accent-blue" />
              <span className="text-lg font-bold text-dark-text">PR #{conflict.pr_number}</span>
            </div>
            <p className="text-xs text-dark-muted mb-3 font-mono">{conflict.repo}</p>
            <a
              href={`https://github.com/${conflict.repo}/pull/${conflict.pr_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs"
            >
              <ExternalLink className="w-3 h-3" />
              View on GitHub
            </a>
          </div>
          <div className="bg-dark-subtle rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <GitPullRequest className="w-5 h-5 text-accent-blue" />
              <span className="text-lg font-bold text-dark-text">PR #{conflict.conflicting_pr_number}</span>
            </div>
            <p className="text-xs text-dark-muted mb-3 font-mono">{conflict.repo}</p>
            <a
              href={`https://github.com/${conflict.repo}/pull/${conflict.conflicting_pr_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs"
            >
              <ExternalLink className="w-3 h-3" />
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Overlapping Files */}
      <div className="card">
        <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2 mb-4">
          <FileCode className="w-5 h-5 text-accent-blue" />
          Overlapping Files
        </h2>
        <div className="space-y-2">
          {(conflict.files || []).map((file, i) => (
            <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-dark-subtle/50">
              <Zap className="w-3.5 h-3.5 text-warning" />
              <span className="font-mono text-sm text-accent-blue">{file}</span>
            </div>
          ))}
          {(!conflict.files || conflict.files.length === 0) && (
            <p className="text-sm text-dark-muted py-2">No specific files listed.</p>
          )}
        </div>
      </div>

      {/* Reason / Analysis */}
      <div className="card border-l-2 border-l-warning">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-semibold text-dark-text">Conflict Reason</h2>
        </div>
        <p className="text-sm text-dark-text leading-relaxed">
          {conflict.reason || 'No reason provided.'}
        </p>
      </div>

      {/* Metadata */}
      <div className="card">
        <div className="flex items-center justify-between text-sm text-dark-muted">
          <span>Detected: {conflict.created_at ? new Date(conflict.created_at).toLocaleString() : 'Unknown'}</span>
          <span className="font-mono">{conflict.repo}</span>
        </div>
      </div>
    </div>
  );
}
