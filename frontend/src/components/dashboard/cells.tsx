'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

function initials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Avatar initials + primary line + muted secondary line (name / email). */
export function UserCell({
  name,
  subtitle,
  className,
}: {
  name?: string | null;
  subtitle?: string | null;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
        {initials(name)}
      </span>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-medium">{name || '-'}</div>
        {subtitle ? (
          <div className="text-muted-foreground truncate text-xs">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

/** Two-line cell: title + muted subtitle, no avatar. */
export function TwoLineCell({ title, subtitle }: { title?: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate text-sm font-medium">{title ?? '-'}</div>
      {subtitle ? <div className="text-muted-foreground truncate text-xs">{subtitle}</div> : null}
    </div>
  );
}

/** Monospace id with a copy-to-clipboard button. */
export function CopyCell({ value }: { value?: string | null }) {
  const [copied, setCopied] = React.useState(false);
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-[13px]">{value}</span>
      <button
        type="button"
        aria-label="Copy"
        className="text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          });
        }}
      >
        {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
      </button>
    </span>
  );
}
