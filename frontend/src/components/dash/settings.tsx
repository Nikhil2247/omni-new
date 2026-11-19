'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Loader2, Shield, User, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PageHeader } from './page-header';

/* ------------------------------------------------------------------ */
/* SettingsShell: page header + section nav (left on desktop, tabs on   */
/* mobile) + content. One accent colour, neutrals only.                 */
/* ------------------------------------------------------------------ */

export interface SettingsNavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  /** Extra path that also marks this item active (e.g. the settings index). */
  alsoActiveAt?: string;
}

const ShellContext = React.createContext(false);
/** True when rendered inside a SettingsShell (forms then skip their own page title). */
export const useInSettingsShell = () => React.useContext(ShellContext);

/** Profile / Notifications / Security for a role's settings base path, e.g. `/ops/settings`. */
export function defaultSettingsNav(basePath: string): SettingsNavItem[] {
  const base = basePath.replace(/\/$/, '');
  return [
    { label: 'Profile', href: `${base}/profile`, icon: User, alsoActiveAt: base },
    { label: 'Notifications', href: `${base}/notifications`, icon: Bell },
    { label: 'Security', href: `${base}/security`, icon: Shield },
  ];
}

interface SettingsShellProps {
  /** Role settings base path, e.g. `/marketing/settings`. Used for the default nav. */
  basePath?: string;
  items?: SettingsNavItem[];
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SettingsShell({ basePath, items, title = 'Settings', children, className }: SettingsShellProps) {
  const pathname = usePathname();
  const nav = items ?? (basePath ? defaultSettingsNav(basePath) : []);
  const isActive = (it: SettingsNavItem) =>
    pathname === it.href || pathname.startsWith(`${it.href}/`) || (it.alsoActiveAt ? pathname === it.alsoActiveAt : false);

  return (
    <ShellContext.Provider value>
      <div className={cn('space-y-4', className)}>
        <PageHeader title={title} />
        <div className="grid gap-4 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start lg:grid-cols-[14rem_minmax(0,1fr)]">
          {nav.length > 0 ? (
            <nav aria-label="Settings sections" className="md:sticky md:top-4">
              <ul className="bg-muted/50 flex gap-1 overflow-x-auto rounded-lg p-1 md:flex-col md:bg-transparent md:p-0">
                {nav.map((it) => {
                  const active = isActive(it);
                  const Icon = it.icon;
                  return (
                    <li key={it.href} className="shrink-0 md:shrink">
                      <Link
                        href={it.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'focus-visible:ring-ring/50 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none md:py-2',
                          active
                            ? 'bg-background text-foreground shadow-xs md:bg-primary/10 md:text-primary md:shadow-none'
                            : 'text-muted-foreground hover:text-foreground md:hover:bg-accent/60'
                        )}
                      >
                        {Icon ? <Icon className="size-4" aria-hidden /> : null}
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
          <div className="min-w-0 space-y-4">{children}</div>
        </div>
      </div>
    </ShellContext.Provider>
  );
}

/** Title shown by a settings form only when it is NOT inside a SettingsShell. */
export function SettingsStandaloneTitle({ title, description }: { title: string; description?: string }) {
  const inShell = useInSettingsShell();
  if (inShell) return null;
  return (
    <div className="space-y-0.5">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SettingsSection: titled card; rows inside are divided                */
/* ------------------------------------------------------------------ */

interface SettingsSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right side of the header (button, badge). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({ title, description, action, children, className }: SettingsSectionProps) {
  return (
    <section className={cn('bg-card rounded-xl border shadow-xs', className)}>
      <header className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? <p className="text-muted-foreground mt-0.5 text-xs">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="divide-border/60 divide-y px-4 sm:px-5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SettingRow: label + helper left, control right                       */
/* ------------------------------------------------------------------ */

interface SettingRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Associates the label with the control (e.g. a Switch id). */
  htmlFor?: string;
  children?: React.ReactNode;
  /** Stack the control under the text (for wide inputs like text fields). */
  stacked?: boolean;
  className?: string;
}

export function SettingRow({ label, description, htmlFor, children, stacked, className }: SettingRowProps) {
  return (
    <div
      className={cn(
        'flex gap-3 py-3.5',
        stacked ? 'flex-col sm:flex-row sm:items-start sm:gap-6' : 'items-center justify-between',
        className
      )}
    >
      <div className={cn('min-w-0 space-y-0.5', stacked && 'sm:w-2/5 sm:shrink-0')}>
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
      </div>
      {children ? <div className={cn('shrink-0', stacked && 'w-full sm:max-w-sm sm:flex-1')}>{children}</div> : null}
    </div>
  );
}

/** Free-form block inside a SettingsSection (forms, QR setup, etc.). */
export function SettingsBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('py-4', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* DangerZone: destructive actions, the only place red is used          */
/* ------------------------------------------------------------------ */

export function DangerZone({
  title = 'Danger zone',
  description,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-destructive/30 bg-card rounded-xl border shadow-xs">
      <header className="border-destructive/20 border-b px-4 py-3 sm:px-5">
        <h2 className="text-destructive text-sm font-semibold">{title}</h2>
        {description ? <p className="text-muted-foreground mt-0.5 text-xs">{description}</p> : null}
      </header>
      <div className="divide-border/60 divide-y px-4 sm:px-5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SettingsSaveBar: sticky unsaved-changes bar                          */
/* ------------------------------------------------------------------ */

interface SettingsSaveBarProps {
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  onReset: () => void;
  saveLabel?: string;
}

/** Appears only while there are unsaved changes; sticks to the bottom of the viewport. */
export function SettingsSaveBar({ dirty, saving, onSave, onReset, saveLabel = 'Save changes' }: SettingsSaveBarProps) {
  if (!dirty) return null;
  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      className="bg-background/95 sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 shadow-md backdrop-blur"
    >
      <p className="text-sm font-medium">You have unsaved changes</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={saving}>
          Discard
        </Button>
        <Button type="button" size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {saving ? 'Saving...' : saveLabel}
        </Button>
      </div>
    </div>
  );
}
