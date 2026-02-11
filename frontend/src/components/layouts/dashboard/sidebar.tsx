'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebar-store';
import { useAuthStore } from '@/store/auth-store';
import { Role } from '@/config/roles';
import { getNavigationForRole, filterNavByRole, type NavGroup, type NavItem } from '@/config/navigation';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeft, X } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isOpen, toggle, close } = useSidebarStore();
  const { user } = useAuthStore();
  const userRole = user?.role as Role;

  // Get navigation based on user role
  const navigation = userRole ? filterNavByRole(getNavigationForRole(userRole), userRole) : [];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-card shadow-lg transition-all duration-300 ease-in-out',
        // Mobile: full width overlay, hidden by default
        'w-64 -translate-x-full md:translate-x-0',
        isOpen && 'translate-x-0',
        // Desktop: always visible, collapsible
        'md:w-16 lg:w-64',
        isCollapsed && 'lg:w-16'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className={cn(
          'flex items-center gap-2 transition-opacity duration-200',
          (isCollapsed && 'lg:opacity-0 lg:hidden') || 'opacity-100'
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/60">
            <span className="text-lg font-bold text-primary-foreground">O</span>
          </div>
          <span className="text-xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">Omni</span>
        </Link>
        
        {/* Close button (mobile) */}
        <button
          onClick={close}
          className="rounded-md p-2 hover:bg-accent md:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Collapse button (desktop) */}
        <button
          onClick={toggle}
          className="hidden rounded-md p-2 hover:bg-accent lg:block"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
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
          'border-t p-4 transition-all duration-200',
          isCollapsed && 'lg:p-2'
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/60 text-primary-foreground font-semibold shadow-md">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={cn(
              'flex-1 overflow-hidden transition-opacity duration-200',
              isCollapsed && 'lg:opacity-0 lg:hidden'
            )}>
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
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
    <div className="mb-6">
      {!isCollapsed && (
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {group.title}
        </h3>
      )}
      <ul className="space-y-1">
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
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive || isChildActive
              ? 'bg-primary/10 text-primary shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm'
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left">{item.title}</span>
          <ChevronDown className={cn(
            'h-4 w-4 transition-transform duration-200',
            !shouldBeOpen && '-rotate-90'
          )} />
        </button>
        {shouldBeOpen && (
          <ul className="ml-4 mt-1 space-y-1 border-l-2 border-primary/20 pl-4">
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
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm',
          isCollapsed && 'lg:justify-center'
        )}
        title={isCollapsed ? item.title : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className={cn(
          'transition-opacity duration-200',
          isCollapsed && 'lg:opacity-0 lg:hidden'
        )}>{item.title}</span>
        {!isCollapsed && item.badge && (
          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}
