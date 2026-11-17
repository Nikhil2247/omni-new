'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebar-store';
import { useAuthStore } from '@/store/auth-store';
import { Role } from '@/config/roles';
import { getNavigationForRole, filterNavByRole, type NavGroup, type NavItem } from '@/config/navigation';
import { useFilteredNavigationGroups } from '@/hooks/use-filtered-navigation';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeft, X } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isOpen, toggle, close } = useSidebarStore();
  const { user } = useAuthStore();
  const userRole = user?.role as Role;

  // Get navigation based on user role
  const roleFilteredNav = userRole ? filterNavByRole(getNavigationForRole(userRole), userRole) : [];

  // Filter by feature flags - items with disabled features are hidden
  const navigation = useFilteredNavigationGroups(roleFilteredNav);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-all duration-200 ease-in-out',
        // Mobile: full width overlay, hidden by default
        'w-60 -translate-x-full md:translate-x-0',
        isOpen && 'translate-x-0',
        // Desktop: always visible, collapsible
        'md:w-14 lg:w-60',
        isCollapsed && 'lg:w-14'
      )}
    >
      {/* Logo */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
        <Link href="/" className="flex items-center gap-2">
          {/* Full logo (expanded) */}
          <NextImage
            src="/images/omnilogo.avif"
            width={32}
            height={32}
            unoptimized={true}
            priority={true}
            alt="Omnicassion"
            className={cn(
              'h-8 w-auto object-contain transition-opacity duration-200',
              isCollapsed && 'lg:hidden'
            )}
          />
          {/* Icon-only logo (collapsed) */}
          <NextImage
            src="/icons/omnicassion favicon.png"
            width={32}
            height={32}
            unoptimized={true}
            priority={true}
            alt="Omnicassion"
            className={cn(
              'h-8 w-8 object-contain transition-opacity duration-200',
              !isCollapsed && 'lg:hidden'
            )}
          />
        </Link>
        
        {/* Close button (mobile) */}
        <button
          onClick={close}
          className="rounded-md p-1.5 hover:bg-sidebar-accent md:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Collapse button (desktop) */}
        <button
          onClick={toggle}
          className="hidden rounded-md p-1.5 hover:bg-sidebar-accent lg:block"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 [--scroll-thumb:rgb(255_255_255/0.25)] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
        {navigation.map((group, groupIndex) => (
          <NavGroupComponent
            key={groupIndex}
            group={group}
            isCollapsed={isCollapsed}
            pathname={pathname}
            onNavigate={close}
          />
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className={cn(
          'border-t border-sidebar-border p-3 transition-all duration-200',
          isCollapsed && 'lg:p-1.5'
        )}>
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={cn(
              'flex-1 overflow-hidden transition-opacity duration-200',
              isCollapsed && 'lg:opacity-0 lg:hidden'
            )}>
              <p className="truncate text-[13px] font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/70">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

interface NavGroupComponentProps {
  group: NavGroup;
  isCollapsed: boolean;
  pathname: string;
  onNavigate: () => void;
}

function NavGroupComponent({ group, isCollapsed, pathname, onNavigate }: NavGroupComponentProps) {
  return (
    <div className="mb-3">
      {!isCollapsed && (
        <h3 className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          {group.title}
        </h3>
      )}
      <ul className="space-y-0.5">
        {group.items.map((item, index) => (
          <NavItemComponent
            key={index}
            item={item}
            isCollapsed={isCollapsed}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

interface NavItemComponentProps {
  item: NavItem;
  isCollapsed: boolean;
  pathname: string;
  onNavigate: () => void;
  depth?: number;
}

function NavItemComponent({ item, isCollapsed, pathname, onNavigate, depth = 0 }: NavItemComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const isChildActive = item.children?.some(
    child => pathname === child.href || pathname.startsWith(child.href + '/')
  );

  const Icon = item.icon;

  // Auto-expand if child is active
  const shouldBeOpen = isOpen || isChildActive;

  if (hasChildren && !isCollapsed) {
    return (
      <li>
        <button
          onClick={() => setIsOpen(!shouldBeOpen)}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
            isActive || isChildActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_#7fb0f0]'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className="flex-1 text-left">{item.title}</span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            !shouldBeOpen && '-rotate-90'
          )} />
        </button>
        {shouldBeOpen && (
          <ul className="ml-3.5 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
            {item.children?.map((child, index) => (
              <NavItemComponent
                key={index}
                item={child}
                isCollapsed={isCollapsed}
                pathname={pathname}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_#7fb0f0]'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
          isCollapsed && 'lg:justify-center'
        )}
        title={isCollapsed ? item.title : undefined}
      >
        <Icon className="size-4 shrink-0" />
        <span className={cn(
          'transition-opacity duration-200',
          isCollapsed && 'lg:opacity-0 lg:hidden'
        )}>{item.title}</span>
        {!isCollapsed && item.badge && (
          <span className="ml-auto rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}
