'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  submitLabel?: string;
  /** Disables the submit button while the form is not valid. */
  canSubmit?: boolean;
  loading?: boolean;
  /** Called when the form is submitted (Enter or the button). May be async; throw/reject to keep the dialog open. */
  onSubmit: () => void | Promise<unknown>;
}

/** Modal form for create / edit in admin tables. Keeps its content simple: put <FormField>s inside. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = 'Save',
  canSubmit = true,
  loading,
  onSubmit,
}: FormDialogProps) {
  const [busy, setBusy] = React.useState(false);
  const pending = busy || !!loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || pending) return;
    try {
      setBusy(true);
      await onSubmit();
      onOpenChange(false);
    } catch {
      // The caller shows the error (toast); keep the dialog open so the admin can fix and retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || pending}>
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Label + control + optional hint, stacked. */
export function FormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
