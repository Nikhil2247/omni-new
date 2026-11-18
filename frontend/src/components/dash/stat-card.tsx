import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** % change vs the previous period. */
  delta?: number;
  /** Whether an increase is good news (e.g. spend going up is not). */
  goodWhenUp?: boolean;
  hint?: React.ReactNode;
  loading?: boolean;
  /** @deprecated Ignored: stat cards use one colour system. Kept so existing call sites compile. */
  accent?: string;
  className?: string;
}

/** Compact KPI tile: label + icon, big tabular value, optional delta chip. */
export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  goodWhenUp = true,
  hint,
  loading,
  className,
}: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  const good = up === goodWhenUp;
  return (
    <Card className={cn('gap-0 p-3', className)}>
      <div className="text-muted-foreground flex items-center justify-between gap-2">
        <span className="truncate text-xs">{label}</span>
        {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-7 w-16" />
          <Skeleton className="mt-1.5 h-3 w-20" />
        </>
      ) : (
        <>
          <div className="tabular mt-1 text-2xl font-semibold tracking-tight">{value}</div>
          {delta !== undefined ? (
            <div className={cn('tabular mt-0.5 flex items-center gap-1 text-xs', good ? 'text-success' : 'text-destructive')}>
              {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(delta).toFixed(1)}%
              <span className="text-muted-foreground">vs last period</span>
            </div>
          ) : hint ? (
            <div className="text-muted-foreground mt-0.5 truncate text-xs">{hint}</div>
          ) : null}
        </>
      )}
    </Card>
  );
}

/** Responsive row of StatCards: 2 columns on mobile, 4 on lg. */
export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{children}</div>;
}
