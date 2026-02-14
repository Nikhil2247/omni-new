'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Role } from '@/config/roles';
import { hasAnyRole, getDefaultPath } from '@/lib/utils/permissions';
import { Loader2, ShieldX } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
  redirectOnFail?: boolean;
  showAccessDenied?: boolean;
  exactMatch?: boolean;
}

/**
 * RoleGuard component that protects routes based on user roles.
 * Must be used inside an AuthGuard.
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectOnFail = true,
  showAccessDenied = true,
  exactMatch = false,
}: RoleGuardProps) {
  const router = useRouter();
  const { user, isLoading, hasHydrated } = useAuthStore();
  const userRole = user?.role as Role | undefined;
  const userRoles = (user?.roles?.length ? user.roles : userRole ? [userRole] : []) as Role[];

  const hasAccess = exactMatch
    ? (userRole ? allowedRoles.includes(userRole) : false)
    : userRoles.some((role) => hasAnyRole(role, allowedRoles));

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading || !hasHydrated) return;

    // If user doesn't have access and we should redirect
    if (!hasAccess && redirectOnFail && userRole) {
      const defaultPath = getDefaultPath(userRole);
      router.replace(defaultPath);
    }
  }, [hasAccess, isLoading, redirectOnFail, router, userRole]);

  // Show loading state while checking
  if (isLoading || !hasHydrated) {
    return (
      fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }

  // User doesn't have access
  if (!hasAccess) {
    if (showAccessDenied && !redirectOnFail) {
      return <AccessDenied />;
    }
    return (
      fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }

  // User has access, render children
  return <>{children}</>;
}

/**
 * Access Denied component shown when user lacks required role
 */
function AccessDenied() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRole = user?.role as Role | undefined;

  const handleGoBack = () => {
    if (userRole) {
      const defaultPath = getDefaultPath(userRole);
      router.push(defaultPath);
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <ShieldX className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="text-muted-foreground">
        You don&apos;t have permission to access this page.
      </p>
      <button
        onClick={handleGoBack}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

/**
 * Hook to check if the current user has any of the specified roles
 */
export function useHasRole(requiredRoles: Role[]): boolean {
  const { user } = useAuthStore();
  const userRole = user?.role as Role | undefined;
  return hasAnyRole(userRole, requiredRoles);
}

/**
 * Component that conditionally renders children based on user role
 */
export function RoleBasedContent({
  children,
  allowedRoles,
  fallback = null,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}) {
  const hasAccess = useHasRole(allowedRoles);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
