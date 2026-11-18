'use client';

import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from './confirm-dialog';

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void | Promise<unknown>;
  href?: string;
  /** Red icon, used for delete. */
  danger?: boolean;
  disabled?: boolean;
  /** Hidden entirely when false (e.g. permission based). */
  visible?: boolean;
  /** When set, clicking opens a confirmation modal and only then runs onClick. Required for deletes. */
  confirm?: {
    title?: string;
    description?: React.ReactNode;
    confirmLabel?: string;
    tone?: 'danger' | 'primary';
  };
}

const BTN =
  'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4';

/**
 * Inline icon actions for a table row (view / edit / delete ...). Each has a tooltip,
 * and any action with `confirm` goes through a confirmation modal before running.
 */
export function RowActions({ actions, className }: { actions: RowAction[]; className?: string }) {
  const [pending, setPending] = React.useState<RowAction | null>(null);
  const visible = actions.filter((a) => a.visible !== false);

  return (
    <div
      className={cn('flex items-center justify-end gap-0.5', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {visible.map((a) => {
        const Icon = a.icon;
        const cls = cn(BTN, a.danger && 'text-red-600 hover:bg-red-500/10 hover:text-red-700');
        const inner = <Icon aria-hidden />;
        const trigger =
          a.href && !a.disabled ? (
            <Link href={a.href} aria-label={a.label} className={cls}>
              {inner}
            </Link>
          ) : (
            <button
              type="button"
              aria-label={a.label}
              disabled={a.disabled}
              className={cls}
              onClick={() => (a.confirm ? setPending(a) : a.onClick?.())}
            >
              {inner}
            </button>
          );
        return (
          <Tooltip key={a.label}>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="top">{a.label}</TooltipContent>
          </Tooltip>
        );
      })}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending?.confirm?.title}
        description={pending?.confirm?.description}
        confirmLabel={pending?.confirm?.confirmLabel}
        tone={pending?.confirm?.tone ?? (pending?.danger ? 'danger' : 'primary')}
        onConfirm={async () => {
          await pending?.onClick?.();
        }}
      />
    </div>
  );
}
