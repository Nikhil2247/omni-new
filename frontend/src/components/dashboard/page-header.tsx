import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Page title. Dashboard pages show a title only: no description line. */
  title: React.ReactNode;
  /** Primary actions (buttons) aligned to the right of the title. */
  actions?: React.ReactNode;
  /** Optional element shown before the title (e.g. a back button). */
  leading?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, actions, leading, className }: PageHeaderProps) {
  return (
    <div className={cn('flex min-h-8 flex-wrap items-center justify-between gap-2', className)}>
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
