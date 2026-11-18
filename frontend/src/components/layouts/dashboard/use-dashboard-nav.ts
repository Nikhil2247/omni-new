'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Role } from '@/config/roles';
import { getNavigationForRole, filterNavByRole, type NavGroup, type NavItem } from '@/config/navigation';
import { useFilteredNavigationGroups } from '@/hooks/use-filtered-navigation';

/** Role- and feature-flag-filtered navigation for the signed-in user. Single source for sidebar + palette. */
export function useDashboardNav(): NavGroup[] {
  const user = useAuthStore((s) => s.user);
  const role = user?.role as Role | undefined;
  const roleFiltered = useMemo(() => (role ? filterNavByRole(getNavigationForRole(role), role) : []), [role]);
  return useFilteredNavigationGroups(roleFiltered);
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

export function isItemActive(pathname: string, item: NavItem): boolean {
  return isActivePath(pathname, item.href) || !!item.children?.some((c) => isActivePath(pathname, c.href));
}

/** First path segment, used to scope persisted group state per area (admin, ops, business...). */
export function areaOf(pathname: string): string {
  return pathname.split('/').filter(Boolean)[0] ?? 'app';
}
