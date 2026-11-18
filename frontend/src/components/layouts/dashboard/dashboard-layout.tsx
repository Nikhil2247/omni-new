'use client';

import * as React from 'react';
import { Inter } from 'next/font/google';
import { useSidebarStore, SIDEBAR_STORAGE_KEY } from '@/store/sidebar-store';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { CommandPalette } from './command-palette';
import { AuthGuard } from '@/components/auth/auth-guard';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/app/dashboard.css';

// Loaded here (not in the root layout) so public pages never pay for it. The class carrying the
// variable is put on <html> while a dashboard is mounted, so Radix portals get the font too.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter-dash', display: 'swap' });

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // Scope the dashboard skin (src/app/dashboard.css) to dashboards only. Applied before paint and
  // removed on unmount, so public pages are never affected.
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-area', 'dashboard');
    root.classList.add(inter.variable);
    return () => {
      root.removeAttribute('data-area');
      root.classList.remove(inter.variable);
    };
  }, []);

  // Restore persisted sidebar state; first visit defaults to collapsed on narrow screens.
  React.useEffect(() => {
    let firstVisit = true;
    try {
      firstVisit = localStorage.getItem(SIDEBAR_STORAGE_KEY) === null;
    } catch {
      /* ignore */
    }
    void useSidebarStore.persist.rehydrate();
    if (firstVisit && window.innerWidth < 1100) useSidebarStore.getState().setCollapsed(true);
  }, []);

  // Ctrl/Cmd+K opens the command palette.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AuthGuard>
      <TooltipProvider delayDuration={200}>
        <div data-dash-root className="bg-background text-foreground flex h-screen overflow-hidden">
          <a
            href="#dash-main"
            className="bg-primary text-primary-foreground sr-only z-[60] rounded-md px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            Skip to content
          </a>

          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <Header onOpenSearch={() => setPaletteOpen(true)} />
            <main id="dash-main" className="min-h-0 flex-1 overflow-auto p-3 sm:p-4 2xl:p-6">
              <div className="mx-auto flex min-h-full w-full max-w-9xl flex-col gap-3">{children}</div>
            </main>
          </div>
        </div>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </TooltipProvider>
    </AuthGuard>
  );
}
