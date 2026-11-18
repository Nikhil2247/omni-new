'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LogOut, Menu, Moon, PanelLeft, PanelLeftClose, Search, Settings, Sun, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useSidebarStore } from '@/store/sidebar-store';
import { Role, ROLE_LABELS, ROLES } from '@/config/roles';
import { getSettingsPath } from '@/lib/utils/permissions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationPopover } from '@/components/features/notifications/notification-popover';

function getProfilePath(userRole: Role | undefined): string {
  if (!userRole) return '/settings/profile';

  switch (userRole) {
    case ROLES.ADMIN_SYSTEM:
    case ROLES.ADMIN:
      return '/admin/settings/profile';
    case ROLES.OPERATIONAL_ADMIN:
    case ROLES.OPERATIONAL_MANAGER:
    case ROLES.OPERATIONAL_ASSISTANT:
      return '/ops/settings/profile';
    case ROLES.MARKETING_SERVICES_ADMIN:
    case ROLES.CONTENT_WRITER:
      return '/marketing/settings/profile';
    case ROLES.SALES_MANAGER:
      return '/sales/settings/profile';
    case ROLES.BUSINESS_ADMIN:
      return '/business/settings/profile';
    default:
      return '/settings/profile';
  }
}

const titleCase = (s: string) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

interface HeaderProps {
  onOpenSearch?: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, hasHydrated } = useAuthStore();
  const { toggle, isCollapsed, toggleCollapsed } = useSidebarStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const userRole = user?.role as Role;
  const roleLabel = userRole ? ROLE_LABELS[userRole] : '';
  const settingsPath = getSettingsPath(userRole);
  const profilePath = getProfilePath(userRole);
  const isDark = mounted && resolvedTheme === 'dark';

  // Breadcrumb from the URL: /ops/events/123 -> Ops / Events / 123 (dynamic ids stay as-is).
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => ({ label: titleCase(seg), href: '/' + segments.slice(0, i + 1).join('/') }));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-background z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-5">
      {/* Mobile: open drawer */}
      <Button variant="ghost" size="icon" className="md:hidden" onClick={toggle} aria-label="Open menu">
        <Menu />
      </Button>
      {/* Desktop: collapse / expand */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <PanelLeft /> : <PanelLeftClose />}
      </Button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-muted-foreground hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <React.Fragment key={c.href}>
              {i > 0 && <span aria-hidden>/</span>}
              {last ? (
                <span className="text-foreground truncate font-medium" aria-current="page">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="hover:text-foreground truncate">
                  {c.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Search trigger */}
      {onOpenSearch && (
        <button
          type="button"
          onClick={onOpenSearch}
          className="bg-card text-muted-foreground hover:bg-accent hidden h-8 w-64 items-center gap-2 rounded-md border px-2.5 text-sm md:flex"
        >
          <Search className="size-4" aria-hidden />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="bg-muted rounded px-1.5 py-0.5 text-[11px] font-medium">Ctrl K</kbd>
        </button>
      )}
      {onOpenSearch && (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSearch} aria-label="Search">
          <Search />
        </Button>
      )}

      {/* Notifications */}
      <NotificationPopover />

      {/* Theme */}
      <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme">
        {isDark ? <Sun /> : <Moon />}
      </Button>

      {/* Account */}
      {hasHydrated && isAuthenticated && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="hover:bg-accent focus-visible:ring-ring/50 flex items-center gap-2 rounded-md p-1 outline-none focus-visible:ring-[3px]"
            >
              <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
              {roleLabel && (
                <p className="bg-primary/10 text-primary mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium">{roleLabel}</p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push(profilePath)}>
              <User /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push(settingsPath)}>
              <Settings /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
