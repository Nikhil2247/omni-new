'use client';

import * as React from 'react';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, ChevronRight, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Tones: one colour system shared by every dashboard widget           */
/* ------------------------------------------------------------------ */

export type WidgetTone = 'primary' | 'success' | 'warning' | 'info' | 'destructive' | 'muted';

// Simple professional look: one accent (primary) + neutrals. `tone` is kept in the API so call
// sites stay compatible, but it no longer changes colours. Only StatusBadge uses semantic colours.
const CHIP = 'bg-primary/10 text-primary';
const TONE_CHIP: Record<WidgetTone, string> = {
  primary: CHIP,
  success: CHIP,
  warning: CHIP,
  info: CHIP,
  destructive: CHIP,
  muted: CHIP,
};

const TONE_VAR: Record<WidgetTone, string> = {
  primary: 'var(--primary)',
  success: 'var(--primary)',
  warning: 'var(--primary)',
  info: 'var(--primary)',
  destructive: 'var(--primary)',
  muted: 'var(--primary)',
};

/** Segment shades by position: strongest first, then lighter tints of the same accent. */
const BAR_SHADES = ['bg-primary', 'bg-primary/55', 'bg-primary/30', 'bg-muted-foreground/30'];
const shade = (i: number) => BAR_SHADES[Math.min(i, BAR_SHADES.length - 1)];

/* ------------------------------------------------------------------ */
/* DashboardHero: greeting banner with the day's primary actions        */
/* ------------------------------------------------------------------ */

interface DashboardHeroProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Small label above the title, e.g. the role name. */
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  /** Optional compact highlights shown on the right (e.g. "3 drafts waiting"). */
  aside?: React.ReactNode;
  className?: string;
}

export function DashboardHero({ title, subtitle, eyebrow, actions, aside, className }: DashboardHeroProps) {
  return (
    <section
      className={cn('bg-card rounded-xl border p-4 shadow-xs sm:p-5', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <p className="text-primary text-[11px] font-semibold tracking-wider uppercase">{eyebrow}</p>
          ) : null}
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {subtitle ? <p className="text-muted-foreground max-w-xl text-sm">{subtitle}</p> : null}
          {actions ? <div className="flex flex-wrap items-center gap-2 pt-2">{actions}</div> : null}
        </div>
        {aside ? <div className="flex flex-wrap items-center gap-2">{aside}</div> : null}
      </div>
    </section>
  );
}

/** Small pill used inside the hero `aside`. */
export function HeroChip({
  icon: Icon,
  label,
  value,
  tone = 'primary',
}: {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: WidgetTone;
}) {
  return (
    <div className="bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2">
      {Icon ? (
        <span className={cn('flex size-8 items-center justify-center rounded-md', TONE_CHIP[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      ) : null}
      <div className="leading-tight">
        <div className="tabular text-base font-semibold">{value}</div>
        <div className="text-muted-foreground text-[11px]">{label}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

export function Sparkline({
  data,
  tone = 'primary',
  height = 36,
  className,
}: {
  data: number[];
  tone?: WidgetTone;
  height?: number;
  className?: string;
}) {
  const id = React.useId().replace(/:/g, '');
  if (!data || data.length < 2) return null;
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className={cn('w-full', className)} style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TONE_VAR[tone]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={TONE_VAR[tone]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={TONE_VAR[tone]}
            strokeWidth={1.75}
            fill={`url(#spark-${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KpiCard: icon chip, big value, delta, optional sparkline, link       */
/* ------------------------------------------------------------------ */

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: WidgetTone;
  /** % change vs previous period. */
  delta?: number;
  goodWhenUp?: boolean;
  hint?: React.ReactNode;
  trend?: number[];
  href?: string;
  loading?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  delta,
  goodWhenUp = true,
  hint,
  trend,
  href,
  loading,
  className,
}: KpiCardProps) {
  const up = (delta ?? 0) >= 0;
  const good = up === goodWhenUp;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs font-medium">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="tabular mt-1 text-2xl leading-none font-semibold tracking-tight">{value}</p>
          )}
        </div>
        {Icon ? (
          <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', TONE_CHIP[tone])}>
            <Icon className="size-[18px]" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex min-h-5 items-center justify-between gap-2">
        {loading ? (
          <Skeleton className="h-3 w-24" />
        ) : delta !== undefined ? (
          <span className={cn('tabular flex items-center gap-0.5 text-xs font-medium', good ? 'text-foreground' : 'text-destructive')}>
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta).toFixed(1)}%
            <span className="text-muted-foreground ml-1 font-normal">vs last period</span>
          </span>
        ) : hint ? (
          <span className="text-muted-foreground truncate text-xs">{hint}</span>
        ) : (
          <span />
        )}
      </div>
      {trend && trend.length > 1 && !loading ? <Sparkline data={trend} tone={tone} className="mt-1" /> : null}
    </>
  );

  const base = cn(
    'bg-card group relative block rounded-xl border p-3.5 shadow-xs transition-all',
    href && 'hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none',
    className
  );

  return href ? (
    <Link href={href} className={base}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}

/** Responsive KPI row: 2 columns on mobile, 4 on lg (or 3 / 5 / 6 via `cols`). */
export function KpiGrid({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode;
  cols?: 3 | 4 | 5 | 6;
  className?: string;
}) {
  const map = { 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' } as const;
  return <div className={cn('grid grid-cols-2 gap-3', map[cols], className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Panel: titled card used as the body of every widget                  */
/* ------------------------------------------------------------------ */

interface PanelProps {
  title: React.ReactNode;
  icon?: LucideIcon;
  description?: React.ReactNode;
  /** "View all" style link in the header. */
  action?: { label: string; href: string };
  /** Custom node on the right of the header (buttons, filters). */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({ title, icon: Icon, description, action, headerRight, children, className, bodyClassName }: PanelProps) {
  return (
    <div className={cn('bg-card flex h-full flex-col rounded-xl border shadow-xs', className)}>
      <header className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden /> : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            {description ? <p className="text-muted-foreground truncate text-xs">{description}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight}
          {action ? (
            <Link href={action.href} className="text-primary flex items-center text-xs font-medium hover:underline">
              {action.label}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </header>
      <div className={cn('flex-1 px-3.5 pb-3.5', bodyClassName)}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* QuickActionTile                                                      */
/* ------------------------------------------------------------------ */

export function QuickActionTile({
  icon: Icon,
  label,
  hint,
  href,
  tone = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  href: string;
  tone?: WidgetTone;
}) {
  return (
    <Link
      href={href}
      className="hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-ring/50 group flex items-center gap-3 rounded-lg border p-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105', TONE_CHIP[tone])}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        {hint ? <span className="text-muted-foreground block truncate text-xs">{hint}</span> : null}
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* ListRow: icon + title + meta + trailing slot                         */
/* ------------------------------------------------------------------ */

export function ListRow({
  icon: Icon,
  tone = 'muted',
  title,
  meta,
  trailing,
  href,
}: {
  icon?: LucideIcon;
  tone?: WidgetTone;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      {Icon ? (
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', TONE_CHIP[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {meta ? <span className="text-muted-foreground block truncate text-xs">{meta}</span> : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </>
  );
  const cls = 'flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 transition-colors';
  return href ? (
    <Link href={href} className={cn(cls, 'hover:bg-accent/60')}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Divided stack of ListRows. */
export function ListStack({ children }: { children: React.ReactNode }) {
  return <div className="divide-border/60 flex flex-col divide-y [&>*]:py-2 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* SegmentedBar: one-line distribution (e.g. content by status)         */
/* ------------------------------------------------------------------ */

export interface Segment {
  label: string;
  value: number;
  tone: WidgetTone;
}

export function SegmentedBar({ segments, emptyLabel = 'Nothing to show yet.' }: { segments: Segment[]; emptyLabel?: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  return (
    <div className="space-y-3">
      <div className="bg-muted flex h-2.5 overflow-hidden rounded-full" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(', ')}>
        {segments.map((s, i) =>
          s.value > 0 ? (
            <div key={s.label} className={cn('h-full transition-all', shade(i))} style={{ width: `${(s.value / total) * 100}%` }} />
          ) : null
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <span className={cn('size-2 rounded-full', shade(i))} aria-hidden />
              {s.label}
            </span>
            <span className="tabular font-medium">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Friendly empty line inside a Panel. */
export function PanelEmpty({ icon: Icon, children, action }: { icon?: LucideIcon; children: React.ReactNode; action?: { label: string; href: string } }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-6 text-center text-sm">
      {Icon ? <Icon className="size-6 opacity-60" aria-hidden /> : null}
      <p>{children}</p>
      {action ? (
        <Link href={action.href} className="text-primary text-xs font-medium hover:underline">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
