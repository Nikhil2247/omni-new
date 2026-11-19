import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KpiCard } from './widgets';

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
  /** Optional link: makes the whole card clickable. */
  href?: string;
  /** Optional trend line (numbers, oldest first). */
  trend?: number[];
  /** @deprecated Ignored: stat cards use one colour system. Kept so existing call sites compile. */
  accent?: string;
  className?: string;
}

/** KPI tile used on every dashboard. Thin wrapper over KpiCard so all pages share one look. */
export function StatCard({ accent: _accent, ...props }: StatCardProps) {
  return <KpiCard {...props} />;
}

/** Responsive row of StatCards: 2 columns on mobile, 4 on lg. */
export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{children}</div>;
}
