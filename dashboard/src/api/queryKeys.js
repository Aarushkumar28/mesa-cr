export const queryKeys = {
  // Dashboard
  dashboardStats: ['dashboard', 'stats'],
  dashboardActivity: ['dashboard', 'activity'],

  // Health
  health: ['health'],

  // Reviews
  reviews: (filters) => ['reviews', filters],
  reviewDetail: (prNumber, repo) => ['reviews', prNumber, repo],
  reviewDebate: (prNumber) => ['reviews', prNumber, 'debate'],

  // Developers
  developers: (repo) => ['developers', repo],
  developerDetail: (username) => ['developers', username],
  developerPatterns: (username) => ['developers', username, 'patterns'],

  // Drift
  driftList: (repo) => ['drift', repo],
  driftLatest: (repo) => ['drift', 'latest', repo],
  driftDetail: (snapshotId) => ['drift', snapshotId],

  // Conflicts
  conflicts: (filters) => ['conflicts', filters],
  conflictDetail: (id) => ['conflicts', id],

  // Repos
  repos: ['repos'],
  repoRules: (repo) => ['repos', repo, 'rules'],

  // Config
  config: (repo) => ['config', repo],

  // Auth
  me: ['auth', 'me'],
};
