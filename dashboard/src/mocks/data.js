// ─── Realistic mock data for all dashboard endpoints ───

const now = new Date();
const daysAgo = (n) => new Date(now - n * 86400000).toISOString();
const hoursAgo = (n) => new Date(now - n * 3600000).toISOString();

export const mockUser = {
  id: 1,
  login: 'Aarushkumar28',
  avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
  name: 'Aarush Kumar',
};

export const mockRepos = [
  {
    id: 1,
    repo_full_name: 'Aarushkumar28/test-creview',
    installation_id: 12345,
    owner_github_id: 'Aarushkumar28',
    webhook_active: true,
    created_at: daysAgo(30),
    last_pr_reviewed: daysAgo(1),
    last_drift_scan: daysAgo(3),
    status: 'active',
  },
  {
    id: 2,
    repo_full_name: 'Aarushkumar28/code-reviewer',
    installation_id: 12346,
    owner_github_id: 'Aarushkumar28',
    webhook_active: true,
    created_at: daysAgo(60),
    last_pr_reviewed: daysAgo(2),
    last_drift_scan: daysAgo(5),
    status: 'active',
  },
  {
    id: 3,
    repo_full_name: 'Aarushkumar28/api-gateway',
    installation_id: 12347,
    owner_github_id: 'Aarushkumar28',
    webhook_active: false,
    created_at: daysAgo(90),
    last_pr_reviewed: daysAgo(14),
    last_drift_scan: null,
    status: 'paused',
  },
];

export const mockDashboardStats = {
  total_prs_reviewed: 142,
  total_comments: 1847,
  active_conflicts: 3,
  total_drift_flags: 12,
  active_repos: 3,
};

export const mockActivity = [
  { id: 1, type: 'pr_reviewed', description: 'PR #47 reviewed — 8 comments posted', repo: 'Aarushkumar28/test-creview', timestamp: hoursAgo(1) },
  { id: 2, type: 'conflict_detected', description: 'Conflict found between PR #45 and PR #47', repo: 'Aarushkumar28/test-creview', timestamp: hoursAgo(3) },
  { id: 3, type: 'drift_flagged', description: 'Architecture drift detected — 3 new flags', repo: 'Aarushkumar28/code-reviewer', timestamp: hoursAgo(6) },
  { id: 4, type: 'debate_resolved', description: 'Debate on PR #42 resolved — AI conceded', repo: 'Aarushkumar28/test-creview', timestamp: hoursAgo(12) },
  { id: 5, type: 'pr_reviewed', description: 'PR #46 reviewed — 3 comments posted', repo: 'Aarushkumar28/code-reviewer', timestamp: hoursAgo(18) },
  { id: 6, type: 'debate_escalated', description: 'Debate on PR #44 escalated to human reviewer', repo: 'Aarushkumar28/test-creview', timestamp: daysAgo(1) },
  { id: 7, type: 'pr_reviewed', description: 'PR #45 reviewed — 12 comments posted', repo: 'Aarushkumar28/test-creview', timestamp: daysAgo(1) },
  { id: 8, type: 'conflict_detected', description: 'Semantic conflict between PR #43 and PR #44', repo: 'Aarushkumar28/code-reviewer', timestamp: daysAgo(2) },
  { id: 9, type: 'pr_reviewed', description: 'PR #44 reviewed — 5 comments posted', repo: 'Aarushkumar28/code-reviewer', timestamp: daysAgo(2) },
  { id: 10, type: 'drift_flagged', description: 'Architecture drift scan completed — clean', repo: 'Aarushkumar28/api-gateway', timestamp: daysAgo(3) },
];

export const mockHealth = {
  status: 'running',
  celery_workers: true,
  redis: true,
  pinecone: false,
  sqlite: true,
};

export const mockReviews = [
  {
    pr_number: 47, title: 'Add user authentication middleware', repo: 'Aarushkumar28/test-creview',
    author: 'octocat', severity_summary: { critical: 1, high: 2, medium: 3, low: 2 },
    confidence_score: 0.87, date: hoursAgo(1), status: 'reviewed',
    github_url: 'https://github.com/Aarushkumar28/test-creview/pull/47',
  },
  {
    pr_number: 46, title: 'Refactor database connection pooling', repo: 'Aarushkumar28/code-reviewer',
    author: 'devuser1', severity_summary: { critical: 0, high: 1, medium: 2, low: 0 },
    confidence_score: 0.92, date: hoursAgo(18), status: 'reviewed',
    github_url: 'https://github.com/Aarushkumar28/code-reviewer/pull/46',
  },
  {
    pr_number: 45, title: 'Implement rate limiting for API endpoints', repo: 'Aarushkumar28/test-creview',
    author: 'securitydev', severity_summary: { critical: 2, high: 3, medium: 4, low: 3 },
    confidence_score: 0.78, date: daysAgo(1), status: 'debating',
    github_url: 'https://github.com/Aarushkumar28/test-creview/pull/45',
  },
  {
    pr_number: 44, title: 'Update CI/CD pipeline configuration', repo: 'Aarushkumar28/code-reviewer',
    author: 'devops-pro', severity_summary: { critical: 0, high: 0, medium: 2, low: 5 },
    confidence_score: 0.95, date: daysAgo(2), status: 'escalated',
    github_url: 'https://github.com/Aarushkumar28/code-reviewer/pull/44',
  },
  {
    pr_number: 43, title: 'Add WebSocket support for real-time updates', repo: 'Aarushkumar28/test-creview',
    author: 'fullstack-dev', severity_summary: { critical: 0, high: 1, medium: 1, low: 1 },
    confidence_score: 0.91, date: daysAgo(3), status: 'reviewed',
    github_url: 'https://github.com/Aarushkumar28/test-creview/pull/43',
  },
  {
    pr_number: 42, title: 'Fix memory leak in event handler', repo: 'Aarushkumar28/test-creview',
    author: 'bugfixer', severity_summary: { critical: 1, high: 0, medium: 0, low: 1 },
    confidence_score: 0.84, date: daysAgo(4), status: 'reviewed',
    github_url: 'https://github.com/Aarushkumar28/test-creview/pull/42',
  },
];

export const mockReviewDetail = {
  pr_number: 47,
  title: 'Add user authentication middleware',
  repo: 'Aarushkumar28/test-creview',
  author: 'octocat',
  opened_date: hoursAgo(6),
  github_url: 'https://github.com/Aarushkumar28/test-creview/pull/47',
  comments: [
    {
      id: 1, file: 'src/middleware/auth.js', line: 23,
      body: 'The JWT token is being verified without checking the expiration timestamp. This allows expired tokens to be used indefinitely, which is a critical security vulnerability.',
      category: 'security', severity: 'critical', confidence_score: 0.94,
      has_debate: true,
    },
    {
      id: 2, file: 'src/middleware/auth.js', line: 45,
      body: 'The error handling here catches all exceptions and returns a generic 500 error. Consider differentiating between authentication failures (401) and authorization failures (403).',
      category: 'logic', severity: 'high', confidence_score: 0.88,
      has_debate: false,
    },
    {
      id: 3, file: 'src/routes/protected.js', line: 12,
      body: 'The middleware is applied after the route handler processes the request. Move the authentication check to execute before the handler to prevent unauthorized access.',
      category: 'security', severity: 'high', confidence_score: 0.91,
      has_debate: false,
    },
    {
      id: 4, file: 'src/utils/token.js', line: 8,
      body: 'Consider using a constant-time comparison for token validation instead of a direct string comparison to prevent timing attacks.',
      category: 'security', severity: 'medium', confidence_score: 0.76,
      has_debate: true,
    },
    {
      id: 5, file: 'src/middleware/auth.js', line: 67,
      body: 'The variable naming here is inconsistent with the rest of the codebase. Consider using camelCase (`isAuthenticated`) instead of snake_case (`is_authenticated`).',
      category: 'style', severity: 'low', confidence_score: 0.82,
      has_debate: false,
    },
  ],
  debates: [
    {
      comment_id: 1,
      developer_reply: 'The token library we use automatically checks expiration. The `verify()` method throws a `TokenExpiredError` if the token is expired.',
      ai_decision: 'CONCEDE',
      ai_reasoning: 'After reviewing the jsonwebtoken library documentation, the `verify()` method does indeed check the `exp` claim by default and throws a `TokenExpiredError`. My initial concern was incorrect. The current implementation is secure.',
      escalated_to_human: false,
    },
    {
      comment_id: 4,
      developer_reply: 'This is a session token, not a cryptographic secret. Timing attacks are not relevant here because an attacker cannot gain useful information from response time differences.',
      ai_decision: 'MAINTAIN',
      ai_reasoning: 'While the developer makes a valid point about the specific token type, security best practices recommend constant-time comparisons for all token validations as a defense-in-depth measure. The performance overhead is negligible.',
      escalated_to_human: false,
    },
  ],
};

export const mockDevelopers = [
  {
    id: 1, github_username: 'octocat', repo: 'Aarushkumar28/test-creview',
    total_prs: 28, active_patterns: 3, avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
    last_pr_date: hoursAgo(1),
  },
  {
    id: 2, github_username: 'devuser1', repo: 'Aarushkumar28/code-reviewer',
    total_prs: 15, active_patterns: 1, avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
    last_pr_date: hoursAgo(18),
  },
  {
    id: 3, github_username: 'securitydev', repo: 'Aarushkumar28/test-creview',
    total_prs: 22, active_patterns: 2, avatar_url: 'https://avatars.githubusercontent.com/u/3?v=4',
    last_pr_date: daysAgo(1),
  },
  {
    id: 4, github_username: 'devops-pro', repo: 'Aarushkumar28/code-reviewer',
    total_prs: 9, active_patterns: 0, avatar_url: 'https://avatars.githubusercontent.com/u/4?v=4',
    last_pr_date: daysAgo(2),
  },
  {
    id: 5, github_username: 'fullstack-dev', repo: 'Aarushkumar28/test-creview',
    total_prs: 34, active_patterns: 4, avatar_url: 'https://avatars.githubusercontent.com/u/5?v=4',
    last_pr_date: daysAgo(3),
  },
  {
    id: 6, github_username: 'bugfixer', repo: 'Aarushkumar28/test-creview',
    total_prs: 19, active_patterns: 1, avatar_url: 'https://avatars.githubusercontent.com/u/6?v=4',
    last_pr_date: daysAgo(4),
  },
];

export const mockDeveloperDetail = {
  github_username: 'octocat',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  github_url: 'https://github.com/octocat',
  stats: {
    total_prs_reviewed: 28,
    total_comments_received: 156,
    resolved_patterns: 5,
    active_patterns: 3,
  },
  ai_summary: 'octocat demonstrates strong backend development skills with consistent code quality across API implementations. Primary areas for improvement include: (1) input validation — frequently missing edge case checks for nullable parameters, (2) error handling — tendency to use broad catch blocks instead of specific exception types, and (3) documentation — inline comments are sparse, especially for complex business logic. Improvement trend is positive: error handling issues have decreased by 40% over the last 10 PRs.',
  patterns: [
    { id: 1, category: 'error-handling', description: 'Using broad catch blocks instead of specific exception types', occurrences: 12, weight: 0.8, resolved: false, last_seen_pr: 47 },
    { id: 2, category: 'input-validation', description: 'Missing null checks for optional parameters', occurrences: 8, weight: 0.6, resolved: false, last_seen_pr: 45 },
    { id: 3, category: 'documentation', description: 'Complex functions lacking inline documentation', occurrences: 6, weight: 0.4, resolved: false, last_seen_pr: 43 },
    { id: 4, category: 'naming', description: 'Inconsistent variable naming conventions', occurrences: 15, weight: 0.3, resolved: true, last_seen_pr: 38 },
    { id: 5, category: 'security', description: 'Hardcoded configuration values in source', occurrences: 4, weight: 0.7, resolved: true, last_seen_pr: 35 },
  ],
  pr_history: [
    { pr_number: 47, title: 'Add user authentication middleware', date: hoursAgo(1), comments_count: 8 },
    { pr_number: 45, title: 'Implement rate limiting', date: daysAgo(1), comments_count: 12 },
    { pr_number: 43, title: 'Add WebSocket support', date: daysAgo(3), comments_count: 3 },
    { pr_number: 40, title: 'Refactor user service', date: daysAgo(7), comments_count: 6 },
    { pr_number: 38, title: 'Fix pagination bug', date: daysAgo(12), comments_count: 2 },
    { pr_number: 35, title: 'Add caching layer', date: daysAgo(18), comments_count: 9 },
  ],
};

export const mockDriftSnapshots = [
  {
    id: 1, repo: 'Aarushkumar28/test-creview', created_at: daysAgo(3),
    drift_flags_count: 3, is_latest: true,
  },
  {
    id: 2, repo: 'Aarushkumar28/test-creview', created_at: daysAgo(10),
    drift_flags_count: 5, is_latest: false,
  },
  {
    id: 3, repo: 'Aarushkumar28/code-reviewer', created_at: daysAgo(5),
    drift_flags_count: 2, is_latest: true,
  },
  {
    id: 4, repo: 'Aarushkumar28/test-creview', created_at: daysAgo(17),
    drift_flags_count: 1, is_latest: false,
  },
];

export const mockDriftDetail = {
  id: 1,
  repo: 'Aarushkumar28/test-creview',
  created_at: daysAgo(3),
  next_scan: new Date(now.getTime() + 4 * 86400000).toISOString(),
  flags: [
    {
      id: 1,
      description: 'Business logic found in API route handlers — 8 files affected',
      severity: 'high',
      affected_files: ['src/routes/users.js', 'src/routes/orders.js', 'src/routes/payments.js', 'src/routes/auth.js', 'src/routes/products.js', 'src/routes/reviews.js', 'src/routes/notifications.js', 'src/routes/settings.js'],
      linked_prs: [45, 43, 40],
    },
    {
      id: 2,
      description: 'Database queries scattered across service and controller layers',
      severity: 'medium',
      affected_files: ['src/controllers/userController.js', 'src/services/userService.js', 'src/controllers/orderController.js'],
      linked_prs: [47, 42],
    },
    {
      id: 3,
      description: 'Utility functions duplicated between modules',
      severity: 'low',
      affected_files: ['src/utils/helpers.js', 'src/utils/formatters.js'],
      linked_prs: [44],
    },
  ],
  architecture_current: {
    layers: ['Routes', 'Controllers', 'Services', 'Models', 'Utils'],
    dependencies: { 'Routes': ['Controllers', 'Services'], 'Controllers': ['Services', 'Models'], 'Services': ['Models', 'Utils'] },
  },
  architecture_baseline: {
    layers: ['Routes', 'Controllers', 'Services', 'Models', 'Utils'],
    dependencies: { 'Routes': ['Controllers'], 'Controllers': ['Services'], 'Services': ['Models', 'Utils'] },
  },
};

export const mockConflicts = [
  {
    id: 1, repo: 'Aarushkumar28/test-creview', pr_number_a: 45, pr_number_b: 47,
    overlapping_files: ['src/middleware/auth.js', 'src/routes/protected.js'],
    type: 'file-overlap', severity: 'high', resolved: false, created_at: hoursAgo(3),
  },
  {
    id: 2, repo: 'Aarushkumar28/code-reviewer', pr_number_a: 43, pr_number_b: 44,
    overlapping_files: ['src/services/eventService.js'],
    type: 'semantic', severity: 'medium', resolved: false, created_at: daysAgo(2),
  },
  {
    id: 3, repo: 'Aarushkumar28/test-creview', pr_number_a: 40, pr_number_b: 42,
    overlapping_files: ['src/models/user.js', 'src/services/userService.js'],
    type: 'file-overlap', severity: 'low', resolved: true, created_at: daysAgo(7),
  },
];

export const mockConflictDetail = {
  id: 1,
  repo: 'Aarushkumar28/test-creview',
  pr_a: { number: 45, title: 'Implement rate limiting for API endpoints', author: 'securitydev', github_url: 'https://github.com/Aarushkumar28/test-creview/pull/45' },
  pr_b: { number: 47, title: 'Add user authentication middleware', author: 'octocat', github_url: 'https://github.com/Aarushkumar28/test-creview/pull/47' },
  overlapping_files: [
    { file: 'src/middleware/auth.js', sections: ['Lines 20-45: Authentication check logic', 'Lines 60-75: Token validation'] },
    { file: 'src/routes/protected.js', sections: ['Lines 10-18: Middleware application order'] },
  ],
  conflict_type: 'file-overlap',
  conflict_description: 'Both PRs modify the authentication middleware in overlapping sections. PR #45 adds rate limiting checks before authentication, while PR #47 restructures the authentication flow. If both are merged, the rate limiting check may bypass the new authentication structure, creating a security gap.',
  warning_posted: true,
  warning_urls: [
    'https://github.com/Aarushkumar28/test-creview/pull/45#issuecomment-1',
    'https://github.com/Aarushkumar28/test-creview/pull/47#issuecomment-2',
  ],
  severity: 'high',
  resolved: false,
};

export const mockRules = [
  { rule_name: 'security_check', description: 'Flag security vulnerabilities in code', enabled: true, type: 'toggle' },
  { rule_name: 'logic_errors', description: 'LLM flags logical errors and edge cases', enabled: true, type: 'toggle' },
  { rule_name: 'style_check', description: 'Static linter for code style issues', enabled: true, type: 'toggle' },
  { rule_name: 'architecture_check', description: 'Cross-PR architecture reasoning', enabled: true, type: 'toggle' },
  { rule_name: 'drift_detection', description: 'Weekly architecture drift scan', enabled: true, type: 'toggle' },
  { rule_name: 'conflict_detection', description: 'Inter-PR conflict detection', enabled: true, type: 'toggle' },
  { rule_name: 'debate_mode', description: 'Allow developer reply + AI debate', enabled: false, type: 'toggle' },
  { rule_name: 'confidence_gate', description: 'Minimum confidence threshold to post comments', value: 0.7, type: 'slider', min: 0, max: 1, step: 0.05 },
  { rule_name: 'pattern_threshold', description: 'Occurrences before a pattern is flagged', value: 3, type: 'slider', min: 1, max: 10, step: 1 },
  { rule_name: 'escalation_threshold', description: 'Confidence below which to escalate to human', value: 0.5, type: 'slider', min: 0, max: 1, step: 0.05 },
];
