import { create } from 'zustand';

const useUiStore = create((set) => ({
  // Theme
  theme: 'dark',
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'dark' ? 'light' : 'dark'
  })),

  // Selected repo filter
  selectedRepo: null,
  setSelectedRepo: (repo) => set({ selectedRepo: repo }),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({
    sidebarCollapsed: !state.sidebarCollapsed
  })),

  // Toasts
  toasts: [],
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, {
      id: Date.now(),
      ...toast,
      createdAt: Date.now(),
    }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  // Auth
  user: JSON.parse(localStorage.getItem('gh_user') || 'null'),
  setUser: (user) => {
    if (user) {
      localStorage.setItem('gh_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('gh_user');
      localStorage.removeItem('gh_token');
    }
    set({ user });
  },
}));

export default useUiStore;
