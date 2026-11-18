import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'neutral';

const TONE: Record<StatusTone, string> = {
  success: 'bg-green-500/12 text-green-700 dark:text-green-400',
  danger: 'bg-red-500/12 text-red-700 dark:text-red-400',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  info: 'bg-blue-500/12 text-blue-700 dark:text-blue-400',
  purple: 'bg-purple-500/12 text-purple-700 dark:text-purple-400',
  neutral: 'bg-muted text-muted-foreground',
};

const SUCCESS = /^(active|approved|verified|completed|complete|paid|published|success|succeeded|resolved|accepted|confirmed|won|live|done|signed|enabled|healthy|online|open_?won)$/;
const DANGER = /^(suspended|rejected|failed|cancelled|canceled|declined|overdue|blocked|banned|deleted|lost|expired|error|disputed|critical|urgent|disabled|unhealthy|offline|high)$/;
const WARNING = /^(pending|pending_verification|pending_review|in_review|review|processing|draft|on_hold|hold|partial|partially_paid|trial|warning|medium|waiting|scheduled|invited|new)$/;
const INFO = /^(in_progress|inprogress|sent|open|assigned|contacted|qualified|ongoing|low|viewed|submitted|negotiation)$/;

/** Maps a raw status string (ACTIVE, PENDING_VERIFICATION, ...) to a tone. */
export function toneForStatus(status?: string | null): StatusTone {
  const s = (status ?? '').toString().trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (SUCCESS.test(s)) return 'success';
  if (DANGER.test(s)) return 'danger';
  if (WARNING.test(s)) return 'warning';
  if (INFO.test(s)) return 'info';
  return 'neutral';
}

/** "PENDING_VERIFICATION" -> "Pending verification" */
export function humanizeStatus(status?: string | null): string {
  const s = (status ?? '').toString().replace(/[_-]+/g, ' ').trim().toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '-';
}

interface StatusBadgeProps {
  /** Raw status; tone and label are derived from it unless overridden. */
  status?: string | null;
  tone?: StatusTone;
  children?: React.ReactNode;
  className?: string;
}

/** Soft tinted pill used for every status in dashboard tables. */
export function StatusBadge({ status, tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE[tone ?? toneForStatus(status)],
        className
      )}
    >
      {children ?? humanizeStatus(status)}
    </span>
  );
}
