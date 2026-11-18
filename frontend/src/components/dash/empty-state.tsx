import * as React from 'react';
import { AlertCircle, Inbox, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional action (e.g. a "New" button). */
  children?: React.ReactNode;
}

/** Compact empty state used inside tables and cards. */
export function EmptyState({ title, icon: Icon = Inbox, children }: EmptyStateProps) {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-3 px-4 py-10 text-sm">
      <Icon className="size-4" aria-hidden />
      <span>{title}</span>
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="text-destructive flex items-center justify-center gap-3 px-4 py-10 text-sm">
      <AlertCircle className="size-4" aria-hidden />
      <span>{message ?? 'Something went wrong while loading data.'}</span>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCw /> Retry
        </Button>
      ) : null}
    </div>
  );
}
