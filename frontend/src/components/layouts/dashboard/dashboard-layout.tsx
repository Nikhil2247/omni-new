'use client';

import { useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebar-store';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { AuthGuard } from '@/components/auth/auth-guard';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/app/dashboard.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isCollapsed, isOpen, close } = useSidebarStore();

  // Scope the dashboard skin (src/app/dashboard.css) to dashboards only. It sits on <html> so it also
  // reaches Radix portals (dialogs, selects). Removed on unmount, so public pages are never affected.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-area', 'dashboard');
    return () => root.removeAttribute('data-area');
  }, []);

  return (
    <AuthGuard>
      <TooltipProvider delayDuration={200}>
        <div className="relative h-screen overflow-hidden bg-background">
          {/* Mobile overlay */}
          {isOpen && (
            <div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={close}
              aria-hidden="true"
            />
          )}

          {/* Sidebar - hidden on mobile, shown on desktop */}
          <Sidebar />

          {/* Main content area */}
          <div
            className={cn(
              'flex h-screen flex-col transition-all duration-200 ease-in-out',
              'md:ml-14 lg:ml-60',
              isCollapsed ? 'lg:ml-14' : 'lg:ml-60'
            )}
          >
            {/* Header */}
            <Header />

            {/* Page content */}
            <main className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
              <div className="mx-auto max-w-9xl space-y-3">
                {children}
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </AuthGuard>
  );
}
