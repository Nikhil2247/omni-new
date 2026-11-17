'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSidebarStore } from '@/store/sidebar-store';
import { Role, ROLE_LABELS, ROLES } from '@/config/roles';
import { getSettingsPath } from '@/lib/utils/permissions';
import {
  Settings,
  LogOut,
  User,
  Menu,
  Moon,
  Sun,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

export function Header() {
  const router = useRouter();
  const { user, logout, isAuthenticated, hasHydrated } = useAuthStore();
  const { toggle } = useSidebarStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const userRole = user?.role as Role;
  const roleLabel = userRole ? ROLE_LABELS[userRole] : '';
  const settingsPath = getSettingsPath(userRole);
  const profilePath = getProfilePath(userRole);

  useEffect(() => {
    // Check initial theme
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="z-30 flex h-12 shrink-0 items-center gap-3 border-b bg-card px-3 sm:px-4">
      {/* Mobile menu button */}
      <button
        onClick={toggle}
        className="rounded-md p-1.5 hover:bg-accent transition-colors md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-1.5 hover:bg-accent transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-yellow-500" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </button>

        {/* Notifications */}
        <NotificationPopover />

        {/* User menu */}
        {hasHydrated && isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-md p-1 hover:bg-accent transition-colors"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-[13px] leading-tight font-medium">{user?.name}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{roleLabel}</p>
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                  <div className="border-b px-3 py-2">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {roleLabel}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push(profilePath);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] hover:bg-accent transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push(settingsPath);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] hover:bg-accent transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </div>
                  <div className="border-t py-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-destructive hover:bg-accent transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </header>
  );
}
