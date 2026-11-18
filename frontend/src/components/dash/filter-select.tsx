'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[] | string[];
  /** Value that represents "no filter". Defaults to 'all'. */
  allValue?: string;
  allLabel?: string;
  /** Set false for filters that have no "All" option. */
  showAll?: boolean;
  className?: string;
}

/** Toolbar filter chip rendered as "Label: All v". */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allValue = 'all',
  allLabel = 'All',
  showAll = true,
  className,
}: FilterSelectProps) {
  const opts: FilterOption[] = (options as Array<FilterOption | string>).map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className={cn('h-8 gap-1.5 text-[13px]', className)}>
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {showAll && <SelectItem value={allValue}>{allLabel}</SelectItem>}
        {opts.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
