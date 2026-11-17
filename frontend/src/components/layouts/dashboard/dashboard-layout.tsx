'use client';

import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebar-store';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { AuthGuard } from '@/components/auth/auth-guard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isCollapsed, isOpen, close } = useSidebarStore();

  return (
    <AuthGuard>
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
          <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="mx-auto max-w-9xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
