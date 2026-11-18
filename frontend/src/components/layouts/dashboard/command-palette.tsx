'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDashboardNav } from './use-dashboard-nav';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Ctrl/Cmd+K jump-to-page palette. Items come from the same role-filtered navigation as the sidebar. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const groups = useDashboardNav();

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Jump to a page">
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No pages found.</CommandEmpty>
        {groups.map((g) => (
          <CommandGroup key={g.title} heading={g.title}>
            {g.items.flatMap((item) => {
              const rows = [{ title: item.title, href: item.href, Icon: item.icon }];
              for (const c of item.children ?? []) rows.push({ title: `${item.title} / ${c.title}`, href: c.href, Icon: c.icon });
              return rows.map((r) => (
                <CommandItem key={r.href + r.title} value={`${g.title} ${r.title}`} onSelect={() => go(r.href)}>
                  <r.Icon className="size-4" aria-hidden />
                  {r.title}
                </CommandItem>
              ));
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
