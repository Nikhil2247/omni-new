'use client';

import * as React from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebar-store';
import { useAuthStore } from '@/store/auth-store';
import { Role, ROLE_LABELS } from '@/config/roles';
import type { NavGroup, NavItem } from '@/config/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { areaOf, isActivePath, isItemActive, useDashboardNav } from './use-dashboard-nav';

const ITEM_BASE =
  'flex h-10 items-center gap-3 rounded-md px-3 text-[14px] transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50';
const ITEM_ON = 'bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--sidebar-ring)]';
const ITEM_OFF = 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground';

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isOpen, close } = useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const navigation = useDashboardNav();
  const role = user?.role as Role | undefined;
  const area = areaOf(pathname);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={close} aria-hidden="true" />}

      <aside
        aria-label="Main navigation"
        className={cn(
          'bg-sidebar text-sidebar-foreground border-sidebar-border flex shrink-0 flex-col border-r transition-[width,transform] duration-200',
          // Mobile: off-canvas drawer
          'fixed inset-y-0 left-0 z-50 w-64 -translate-x-full md:static md:z-auto md:translate-x-0',
          isOpen && 'translate-x-0',
          isCollapsed ? 'md:w-16' : 'md:w-64'
        )}
      >
        {/* Logo row */}
        <div className="border-sidebar-border flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="Omnicassion home">
            <span className="bg-logo-surface flex shrink-0 items-center justify-center rounded-md px-2 py-1.5">
              <NextImage
                src={isCollapsed ? '/icons/omnicassion favicon.png' : '/images/omnilogo.avif'}
                width={32}
                height={32}
                unoptimized
                priority
                alt=""
                className={cn('h-5 object-contain', isCollapsed ? 'w-5' : 'w-auto')}
              />
            </span>
            {!isCollapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold text-sidebar-primary">Omnicassion</span>
                <span className="block truncate text-xs opacity-70">{role ? ROLE_LABELS[role] : 'Dashboard'}</span>
              </span>
            )}
          </Link>
          <button
            onClick={close}
            className="hover:bg-sidebar-accent ml-auto rounded-md p-1.5 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [--scroll-thumb:rgb(255_255_255/0.25)] [--scroll-thumb-hover:rgb(255_255_255/0.4)]">
          {navigation.map((group, i) => (
            <NavGroupBlock
              key={group.title}
              group={group}
              area={area}
              pathname={pathname}
              collapsed={isCollapsed}
              first={i === 0}
              onNavigate={close}
            />
          ))}
        </nav>

        {/* Footer */}
        {user && (
          <div className="border-sidebar-border shrink-0 border-t p-3">
            <div className={cn('flex items-center gap-3', isCollapsed && 'md:justify-center')}>
              <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className={cn('min-w-0 flex-1', isCollapsed && 'md:hidden')}>
                <p className="truncate text-[13px] font-medium text-sidebar-primary">{user.name}</p>
                <p className="truncate text-xs opacity-70">{role ? ROLE_LABELS[role] : user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

interface NavGroupBlockProps {
  group: NavGroup;
  area: string;
  pathname: string;
  collapsed: boolean;
  first: boolean;
  onNavigate: () => void;
}

function NavGroupBlock({ group, area, pathname, collapsed, first, onNavigate }: NavGroupBlockProps) {
  const key = `${area}:${group.title}`;
  const stored = useSidebarStore((s) => s.openGroups[key]);
  const setGroupOpen = useSidebarStore((s) => s.setGroupOpen);
  const hasActive = group.items.some((it) => isItemActive(pathname, it));
  // Open when the user opened it, or when it holds the current route (default open when never touched).
  const open = hasActive || (stored ?? true);

  const list = (
    <ul className="space-y-0.5">
      {group.items.map((item) => (
        <NavItemRow key={item.href + item.title} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </ul>
  );

  return (
    <div className={cn(!first && 'mt-2')}>
      {/* Collapsed (desktop): icon-only with a separator between groups */}
      <div className="hidden md:block">
        {collapsed ? (
          <>
            {!first && <div className="bg-sidebar-border mx-2 my-2 h-px" />}
            {list}
          </>
        ) : null}
      </div>
      <div className={cn(collapsed && 'md:hidden')}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setGroupOpen(key, !open)}
          className="hover:text-sidebar-primary flex h-11 w-full items-center justify-between px-3 text-[14px] font-medium opacity-90"
        >
          <span className="truncate">{group.title}</span>
          <ChevronDown className={cn('size-4 shrink-0 transition-transform duration-200', !open && '-rotate-90')} />
        </button>
        {open && list}
      </div>
    </div>
  );
}

function NavItemRow({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const active = isItemActive(pathname, item);
  const hasChildren = !!item.children?.length;
  const childActive = !!item.children?.some((c) => isActivePath(pathname, c.href));
  const [manual, setManual] = React.useState(false);
  const showChildren = hasChildren && !collapsed && (manual || childActive);

  const iconEl = <Icon className="size-[18px] shrink-0 stroke-[1.5]" aria-hidden />;

  // Collapsed desktop: icon only + tooltip on the right.
  const collapsedLink = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-label={item.title}
          aria-current={active ? 'page' : undefined}
          className={cn(ITEM_BASE, 'justify-center px-0', active ? ITEM_ON : ITEM_OFF)}
        >
          {iconEl}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );

  const expandedBody = (
    <>
      {iconEl}
      <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
      {item.badge && (
        <span className="bg-sidebar-accent-foreground/20 rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-sidebar-primary">
          {item.badge}
        </span>
      )}
    </>
  );

  return (
    <li>
      {collapsed && <div className="hidden md:block">{collapsedLink}</div>}
      <div className={cn(collapsed && 'md:hidden')}>
        {hasChildren ? (
          <>
            <button
              type="button"
              aria-expanded={showChildren}
              onClick={() => setManual((v) => !v)}
              className={cn(ITEM_BASE, 'w-full', active ? ITEM_ON : ITEM_OFF)}
            >
              {expandedBody}
              <ChevronRight className={cn('size-4 shrink-0 transition-transform duration-200', showChildren && 'rotate-90')} />
            </button>
            {showChildren && (
              <ul className="border-sidebar-border mt-0.5 ml-5 space-y-0.5 border-l pl-2">
                {item.children!.map((child) => {
                  const on = isActivePath(pathname, child.href);
                  return (
                    <li key={child.href + child.title}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={on ? 'page' : undefined}
                        className={cn(ITEM_BASE, 'h-9 text-[13px]', on ? ITEM_ON : ITEM_OFF)}
                      >
                        <span className="truncate">{child.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(ITEM_BASE, active ? ITEM_ON : ITEM_OFF)}
          >
            {expandedBody}
          </Link>
        )}
      </div>
    </li>
  );
}
