'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard component that protects routes requiring authentication.
 * Redirects unauthenticated users to the login page.
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, hasHydrated } = useAuthStore();

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading || !hasHydrated) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      // Store the intended destination
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading state while checking auth
  if (isLoading || !hasHydrated) {
    return (
      fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}

/**
 * Hook to check if the current user is authenticated
 */
export function useAuth() {
  const { isAuthenticated, isLoading, hasHydrated, user, setCredentials, logout } = useAuthStore();

  return {
    isAuthenticated,
    isLoading,
    hasHydrated,
    user,
    setCredentials,
    logout,
  };
}
