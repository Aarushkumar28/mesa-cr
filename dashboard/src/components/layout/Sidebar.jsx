import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, GitPullRequest, Users, TrendingDown,
  AlertTriangle, Settings, GitFork, ChevronLeft, ChevronRight, Code2
} from 'lucide-react';
import useUiStore from '../../store/uiStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reviews', label: 'Reviews', icon: GitPullRequest },
  { to: '/developers', label: 'Developers', icon: Users },
  { to: '/drift', label: 'Drift', icon: TrendingDown },
  { to: '/conflicts', label: 'Conflicts', icon: AlertTriangle },
  { to: '/config', label: 'Config', icon: Settings },
  { to: '/repos', label: 'Repos', icon: GitFork },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-dark-card border-r border-dark-border flex flex-col z-40 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-blue flex items-center justify-center flex-shrink-0">
          <Code2 className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-semibold text-dark-text whitespace-nowrap">Code Reviewer</span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? 'nav-link-active' : 'nav-link'
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 py-3 border-t border-dark-border">
        <button
          onClick={toggleSidebar}
          className="nav-link w-full justify-center"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
