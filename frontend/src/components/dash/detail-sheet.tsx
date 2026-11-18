import * as React from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onEdit?: () => void;
  children: React.ReactNode;
}

/** Read-only detail view in a right sheet. Tabs live in `children`. */
export function DetailSheet({ open, onOpenChange, title, subtitle, badge, onEdit, children }: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b p-4 pr-12">
          <div className="flex items-center gap-2">
            <SheetTitle className="truncate text-base">{title}</SheetTitle>
            {badge}
            {onEdit ? (
              <Button variant="outline" size="sm" className="ml-auto" onClick={onEdit}>
                <Pencil /> Edit
              </Button>
            ) : null}
          </div>
          <SheetDescription className={subtitle ? 'text-xs' : 'sr-only'}>{subtitle ?? title}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

/** Label/value grid used in Details tabs. */
export function DetailGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-muted-foreground text-xs">{i.label}</dt>
          <dd className="mt-0.5 truncate">{i.value || '-'}</dd>
        </div>
      ))}
    </dl>
  );
}
