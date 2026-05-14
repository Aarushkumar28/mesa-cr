import { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useConfig, useSaveConfig } from '../hooks/useConfig';
import { useRepos } from '../hooks/useRepos';
import useUiStore from '../store/uiStore';
import { SkeletonCard } from '../components/ui/Skeleton';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';

export default function Config() {
  const selectedRepo = useUiStore((s) => s.selectedRepo);
  const [selectedConfigRepo, setSelectedConfigRepo] = useState(selectedRepo || 'global');

  const { data: repos } = useRepos();
  const { data: configData, isLoading, error, refetch } = useConfig(selectedConfigRepo);
  const saveConfig = useSaveConfig(selectedConfigRepo);

  // Backend returns { repo, rules: { security_check, logic_errors, ... } }
  const rules = configData?.rules || {};

  // Local editable state
  const [localRules, setLocalRules] = useState(null);

  useEffect(() => {
    setLocalRules(null);
  }, [configData]);

  const displayRules = localRules || rules;
  const hasChanges = localRules !== null;

  const handleToggle = (key) => {
    setLocalRules({
      ...displayRules,
      [key]: !displayRules[key],
    });
  };

  const handleSliderChange = (key, value) => {
    setLocalRules({
      ...displayRules,
      [key]: parseFloat(value),
    });
  };

  const handleSave = () => {
    saveConfig.mutate(displayRules);
    setLocalRules(null);
  };

  const handleReset = () => {
    setLocalRules(null);
  };

  const toggleRules = [
    { key: 'security_check', label: 'Security Vulnerability Detection', description: 'Scan for common security issues in code' },
    { key: 'logic_errors', label: 'Logic Error Detection', description: 'AI-powered logical correctness analysis' },
    { key: 'style_check', label: 'Style & Formatting Checks', description: 'Code style and formatting enforcement' },
    { key: 'architecture_check', label: 'Architecture Review', description: 'Check for architecture pattern violations' },
    { key: 'drift_detection', label: 'Drift Detection', description: 'Weekly codebase structure comparison' },
    { key: 'conflict_detection', label: 'Inter-PR Conflict Detection', description: 'Detect overlapping changes across open PRs' },
    { key: 'debate_mode', label: 'AI Debate Mode', description: 'Allow back-and-forth discussion on flagged issues' },
  ];

  const sliderRules = [
    { key: 'confidence_gate', label: 'Confidence Gate', description: 'Minimum confidence to auto-post a comment', min: 0, max: 1, step: 0.05 },
    { key: 'pattern_threshold', label: 'Pattern Threshold', description: 'Occurrences needed before flagging a recurring pattern', min: 1, max: 10, step: 1 },
    { key: 'escalation_threshold', label: 'Escalation Threshold', description: 'Confidence below which comments are escalated to humans', min: 0, max: 1, step: 0.05 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Rule Configuration</h1>
          <p className="text-sm text-dark-muted mt-1">Configure AI review behavior per repository</p>
        </div>
      </div>

      {/* Repo Selector */}
      <div className="card">
        <label className="text-sm text-dark-muted mb-2 block">Select Repository</label>
        <select
          value={selectedConfigRepo}
          onChange={(e) => setSelectedConfigRepo(e.target.value)}
          className="input w-full max-w-md"
        >
          <option value="global">Global (all repos)</option>
          {(repos || []).map((repo) => (
            <option key={repo.id} value={repo.repo}>{repo.repo}</option>
          ))}
        </select>
      </div>

      {/* Config Panel */}
      {isLoading ? (
        <SkeletonCard />
      ) : error ? (
        <ErrorBanner message="Failed to load configuration" onRetry={refetch} />
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent-violet" />
              Review Rules
            </h2>
            <div className="flex gap-2">
              {hasChanges && (
                <button onClick={handleReset} className="btn-secondary text-sm">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saveConfig.isPending}
                className="btn-primary text-sm"
              >
                <Save className="w-4 h-4" />
                {saveConfig.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggle Rules */}
            {toggleRules.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between py-3 px-4 rounded-xl bg-dark-subtle/50">
                <div>
                  <p className="text-sm font-medium text-dark-text">{label}</p>
                  <p className="text-xs text-dark-muted mt-0.5">{description}</p>
                </div>
                <button
                  onClick={() => handleToggle(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    displayRules[key] ? 'bg-accent-violet' : 'bg-dark-border'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                    displayRules[key] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}

            {/* Slider Rules */}
            {sliderRules.map(({ key, label, description, min, max, step }) => (
              <div key={key} className="py-3 px-4 rounded-xl bg-dark-subtle/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-dark-text">{label}</p>
                    <p className="text-xs text-dark-muted mt-0.5">{description}</p>
                  </div>
                  <span className="text-sm font-mono text-accent-violet min-w-[40px] text-right">
                    {typeof displayRules[key] === 'number' ? (step < 1 ? displayRules[key].toFixed(2) : displayRules[key]) : '—'}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={displayRules[key] || 0}
                  onChange={(e) => handleSliderChange(key, e.target.value)}
                  className="w-full h-1.5 bg-dark-border rounded-full appearance-none cursor-pointer accent-accent-violet"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
