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
      <div className="relative min-h-screen bg-background">
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
            'flex min-h-screen flex-col transition-all duration-300 ease-in-out',
            'md:ml-16 lg:ml-64',
            isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          )}
        >
          {/* Header */}
          <Header />

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
