'use client';

import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` (default) is red and used for deletes. */
  tone?: 'danger' | 'primary';
  /** May be async; the dialog stays open with a spinner until it settles. */
  onConfirm: () => void | Promise<unknown>;
  /** External loading state (e.g. a mutation's isPending). */
  loading?: boolean;
}

/**
 * Confirmation modal for destructive / irreversible actions. Use for every delete.
 * Self-contained styling (does not depend on the sketch dialog look).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Delete this item?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  const [busy, setBusy] = React.useState(false);
  const pending = busy || !!loading;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      await onConfirm();
      onOpenChange(false);
    } catch {
      // The caller surfaces the error (toast); keep the dialog open so the user can retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-foreground/45" />
        <AlertDialogPrimitive.Content
          className="bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-md border p-4 shadow-lg outline-none sm:max-w-sm"
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full',
                tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              )}
            >
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <AlertDialogPrimitive.Title className="text-sm font-semibold">
                {title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="text-muted-foreground text-sm">
                {description}
              </AlertDialogPrimitive.Description>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel
              disabled={pending}
              className="hover:bg-accent h-8 rounded-md border px-3 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={handleConfirm}
              disabled={pending}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-destructive-foreground transition-colors disabled:opacity-60',
                tone === 'danger' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              {confirmLabel}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

/**
 * State helper for "delete this row" flows.
 *
 *   const del = useConfirmAction<Task>();
 *   <Button onClick={() => del.ask(task)} />
 *   <ConfirmDialog {...del.dialogProps} title="Delete task?" onConfirm={() => remove(del.target!.id)} />
 */
export function useConfirmAction<T = unknown>() {
  const [target, setTarget] = React.useState<T | null>(null);
  return {
    target,
    ask: (t: T) => setTarget(t),
    close: () => setTarget(null),
    dialogProps: {
      open: target !== null,
      onOpenChange: (o: boolean) => {
        if (!o) setTarget(null);
      },
    },
  };
}
