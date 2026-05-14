import { Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUiStore from '../../store/uiStore';
import { useRepos } from '../../hooks/useRepos';

export default function TopNav() {
  const { theme, toggleTheme, user, setUser, selectedRepo, setSelectedRepo } = useUiStore();
  const navigate = useNavigate();
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { data: repos } = useRepos();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <header className="h-16 bg-dark-card/80 backdrop-blur-md border-b border-dark-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Repo Selector */}
      <div className="relative">
        <button
          onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
          className="btn-secondary text-sm"
        >
          <span className="text-dark-muted">Repo:</span>
          <span className="text-dark-text font-medium">
            {selectedRepo ? (selectedRepo.split('/')[1] || selectedRepo) : 'All Repos'}
          </span>
          <ChevronDown className="w-4 h-4 text-dark-muted" />
        </button>
        {repoDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-dark-card border border-dark-border rounded-lg shadow-xl py-1 z-50 animate-fade-in">
            <button
              onClick={() => { setSelectedRepo(null); setRepoDropdownOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-dark-hover transition-colors ${!selectedRepo ? 'text-accent-violet' : 'text-dark-text'}`}
            >
              All Repositories
            </button>
            {(repos || []).map((repo) => (
              <button
                key={repo.id}
                onClick={() => { setSelectedRepo(repo.repo); setRepoDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-dark-hover transition-colors ${selectedRepo === repo.repo ? 'text-accent-violet' : 'text-dark-text'}`}
              >
                <span className="font-mono text-xs">{repo.repo}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Theme + User */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="btn-ghost p-2">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 btn-ghost"
          >
            <img
              src={user?.avatar_url || `https://github.com/${user?.login || 'ghost'}.png`}
              alt="avatar"
              className="w-7 h-7 rounded-full ring-2 ring-dark-border"
            />
            <span className="text-sm text-dark-text hidden md:inline">
              {user?.login || 'User'}
            </span>
            <ChevronDown className="w-4 h-4 text-dark-muted" />
          </button>
          {userDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-dark-card border border-dark-border rounded-lg shadow-xl py-1 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-dark-border">
                <p className="text-sm font-medium text-dark-text">{user?.name || user?.login}</p>
                <p className="text-xs text-dark-muted">@{user?.login}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-dark-hover transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(repoDropdownOpen || userDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setRepoDropdownOpen(false); setUserDropdownOpen(false); }}
        />
      )}
    </header>
  );
}
