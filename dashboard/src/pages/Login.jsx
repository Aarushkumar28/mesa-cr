import { useNavigate } from 'react-router-dom';
import { Code2, Shield, GitPullRequest, Brain, Zap } from 'lucide-react';
import useUiStore from '../store/uiStore';

function GithubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const setUser = useUiStore((s) => s.setUser);

  const handleLogin = () => {
    // Simplified auth: stores a local session.
    // When real GitHub OAuth is implemented on the backend,
    // this will redirect to GET /auth/github/login instead.
    const user = {
      login: 'Aarushkumar28',
      avatar_url: 'https://github.com/Aarushkumar28.png',
      name: 'Aarush Kumar',
    };
    setUser(user);
    localStorage.setItem('gh_token', 'session_active');
    localStorage.setItem('gh_username', user.login);
    localStorage.setItem('gh_avatar', user.avatar_url);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-accent-violet/8 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-accent-blue/8 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-blue flex items-center justify-center mx-auto mb-5 shadow-lg glow-violet">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dark-text mb-2">Code Reviewer</h1>
          <p className="text-dark-muted text-base">AI-powered persistent code review for GitHub teams</p>
        </div>

        {/* Login Card */}
        <div className="card glow-violet border-dark-border/50">
          <div className="space-y-5">
            {/* Feature highlights */}
            <div className="space-y-3">
              {[
                { icon: Shield, text: 'Security vulnerability detection' },
                { icon: Brain, text: 'Developer feedback memory & profiles' },
                { icon: GitPullRequest, text: 'Inter-PR conflict monitoring' },
                { icon: Zap, text: 'AI debate mode with reasoning' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-dark-muted">
                  <div className="w-8 h-8 rounded-lg bg-accent-violet/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-accent-violet" />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dark-border" />

            {/* GitHub Login Button */}
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg"
            >
              <GithubIcon className="w-5 h-5" />
              Connect with GitHub
            </button>

            <p className="text-xs text-dark-muted text-center">
              By connecting, you authorize Code Reviewer to access your repositories and pull requests.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-dark-muted/50 mt-6">
          Powered by Meta Llama 3 · LangGraph · Pinecone
        </p>
      </div>
    </div>
  );
}
