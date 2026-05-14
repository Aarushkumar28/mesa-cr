import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reviews from './pages/Reviews';
import ReviewDetail from './pages/ReviewDetail';
import Developers from './pages/Developers';
import DeveloperDetail from './pages/DeveloperDetail';
import Drift from './pages/Drift';
import DriftDetail from './pages/DriftDetail';
import Conflicts from './pages/Conflicts';
import ConflictDetail from './pages/ConflictDetail';
import Config from './pages/Config';
import Repos from './pages/Repos';
import useUiStore from './store/uiStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }) {
  const user = useUiStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function OAuthCallback() {
  // Future: parse ?code= from URL, send to backend /auth/github/callback,
  // receive JWT, store in localStorage, redirect to /dashboard.
  // For now, redirect to login since OAuth is not yet implemented in the backend.
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-dark-muted text-sm">Authenticating with GitHub...</p>
        <p className="text-dark-muted text-xs mt-2">OAuth callback not yet connected to backend.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/github/callback" element={<OAuthCallback />} />

          {/* Protected — wrapped in AppLayout */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="reviews/:prNumber" element={<ReviewDetail />} />
            <Route path="developers" element={<Developers />} />
            <Route path="developers/:username" element={<DeveloperDetail />} />
            <Route path="drift" element={<Drift />} />
            <Route path="drift/:snapshotId" element={<DriftDetail />} />
            <Route path="conflicts" element={<Conflicts />} />
            <Route path="conflicts/:id" element={<ConflictDetail />} />
            <Route path="config" element={<Config />} />
            <Route path="repos" element={<Repos />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
