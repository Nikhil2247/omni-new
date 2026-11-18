import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Tailwind text color class for the icon + value accent, e.g. 'text-green-600'. */
  accent?: string;
  hint?: React.ReactNode;
  className?: string;
}

/** Compact KPI tile: label + value on one tight block, small icon on the right. */
export function StatCard({ label, value, icon: Icon, accent, hint, className }: StatCardProps) {
  return (
    <div className={cn('bg-card flex items-center justify-between gap-2 rounded-lg border px-3 py-2', className)}>
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs">{label}</p>
        <p className={cn('text-lg leading-tight font-semibold tabular-nums', accent)}>{value}</p>
        {hint ? <p className="text-muted-foreground truncate text-[11px]">{hint}</p> : null}
      </div>
      {Icon ? (
        <span className={cn('bg-muted flex size-8 shrink-0 items-center justify-center rounded-md', accent)}>
          <Icon className="size-4" />
        </span>
      ) : null}
    </div>
  );
}

/** Responsive row of StatCards. */
export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-2 lg:grid-cols-4', className)}>{children}</div>;
}
