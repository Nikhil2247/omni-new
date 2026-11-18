import * as React from 'react';
import { cn } from '@/lib/utils';

type CoreTone = 'success' | 'warning' | 'destructive' | 'muted' | 'info';
/** The five semantic tones. `danger` / `neutral` / `purple` are legacy aliases kept for old call sites. */
export type StatusTone = CoreTone | 'danger' | 'neutral' | 'purple';

const TONE_CLASS: Record<CoreTone, string> = {
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/12 text-destructive',
  info: 'bg-info/12 text-info',
  muted: 'bg-muted text-muted-foreground',
};
const ALIAS: Record<string, CoreTone> = { danger: 'destructive', neutral: 'muted', purple: 'info' };

const words = (s: string) => new Set(s.split(' '));

/**
 * Status string -> tone. Built from the enums in lib/api/types (lead, event, KYC, invoice, dispute,
 * task, ticket, subscription, payment, campaign and booking states) plus common generic words.
 */
const SUCCESS = words(
  'active approved verified completed complete paid published success succeeded resolved accepted confirmed won live done signed enabled healthy online delivered fulfilled processed attending booked shortlisted kyc_approved profile_approved admin_verified account_verified read'
);
const DESTRUCTIVE = words(
  'suspended rejected failed cancelled canceled declined overdue blocked banned deleted lost expired error disputed critical urgent disabled unhealthy offline high terminated past_due voided kyc_rejected profile_rejected no_show not_attending fraud harassment locked'
);
const WARNING = words(
  'pending pending_verification pending_review pending_approval pending_signature in_review review under_review processing draft on_hold hold partial partially_paid partially_refunded trial trialing warning medium waiting scheduled invited new paused maybe negotiating proposal_sent unclaimed'
);
const INFO = words('in_progress inprogress sent open assigned contacted qualified ongoing viewed submitted negotiation planning refunded');

export function toneForStatus(status?: string | null): CoreTone {
  const s = (status ?? '').toString().trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (SUCCESS.has(s)) return 'success';
  if (DESTRUCTIVE.has(s)) return 'destructive';
  if (WARNING.has(s)) return 'warning';
  if (INFO.has(s)) return 'info';
  return 'muted';
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

/** The one status pill used in every dashboard table. */
export function StatusBadge({ status, tone, children, className }: StatusBadgeProps) {
  const t: CoreTone = tone ? (ALIAS[tone] ?? (tone as CoreTone)) : toneForStatus(status);
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASS[t],
        className
      )}
    >
      {children ?? humanizeStatus(status)}
    </span>
  );
}
