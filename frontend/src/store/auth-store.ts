import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name?: string;
  role: string;
  roles?: string[];
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  hasCompletedOnboarding?: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setCredentials: (accessToken: string, refreshToken: string | null, user: User) => void;
  setLoading: (isLoading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setOnboardingComplete: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasHydrated: false,
      setCredentials: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setOnboardingComplete: () =>
        set((state) => ({
          user: state.user ? { ...state.user, hasCompletedOnboarding: true } : null,
        })),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.setLoading(false);
      },
    }
  )
);
