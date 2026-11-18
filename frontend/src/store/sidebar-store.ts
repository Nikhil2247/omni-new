import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

interface SidebarState {
  /** Mobile off-canvas drawer. */
  isOpen: boolean;
  /** Desktop collapsed (icon-only) state. Persisted. */
  isCollapsed: boolean;
  /** Per-group open state, keyed `${area}:${group title}`. Persisted. */
  openGroups: Record<string, boolean>;
  /** Toggle the mobile drawer. */
  toggle: () => void;
  open: () => void;
  close: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setGroupOpen: (key: string, open: boolean) => void;
}

export const SIDEBAR_STORAGE_KEY = 'omni-dash-sidebar';

// localStorage can throw (private mode, blocked site data): never let it break the shell.
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* ignore */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      isCollapsed: false,
      openGroups: {},
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setGroupOpen: (key, open) => set((s) => ({ openGroups: { ...s.openGroups, [key]: open } })),
    }),
    {
      name: SIDEBAR_STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ isCollapsed: s.isCollapsed, openGroups: s.openGroups }),
      skipHydration: true,
    }
  )
);
