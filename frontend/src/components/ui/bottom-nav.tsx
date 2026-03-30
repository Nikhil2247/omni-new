'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import type { Role } from '@/config/roles'
import { ROLES } from '@/config/roles'
import {
  Calendar,
  Compass,
  Users,
  Newspaper,
  Heart,
  Wrench,
  Store,
  CreditCard,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  href: string | null
  label: string
  outlinedIcon: LucideIcon
  filledIcon: LucideIcon
  requiresAuth?: boolean
  roles?: Role[] // Only show for these roles (if specified)
  excludeRoles?: Role[] // Hide from these roles
  dynamicHref?: (role?: Role) => string
}

const getWishlistPath = (_role?: Role) => '/wishlists'

// Navigation items - some are role-specific
const baseNavItems: NavItem[] = [
  // Tools - only for USER role
  {
    href: '/tools',
    label: 'Tools',
    outlinedIcon: Wrench,
    filledIcon: Wrench,
    roles: [ROLES.USER],
  },
  // Business Dashboard - only for BUSINESS_ADMIN
  {
    href: '/business/dashboard',
    label: 'Dashboard',
    outlinedIcon: Store,
    filledIcon: Store,
    roles: [ROLES.BUSINESS_ADMIN],
  },
  // Pricing - for BUSINESS_ADMIN
  {
    href: '/pricing',
    label: 'Pricing',
    outlinedIcon: CreditCard,
    filledIcon: CreditCard,
    roles: [ROLES.BUSINESS_ADMIN],
  },
  // Vendors - for everyone
  {
    href: '/vendors',
    label: 'Vendors',
    outlinedIcon: Users,
    filledIcon: Users,
  },
  // Discover - for everyone
  {
    href: '/discover',
    label: 'Discover',
    outlinedIcon: Compass,
    filledIcon: Compass,
  },
  // Blog - for everyone
  {
    href: '/blog',
    label: 'Blog',
    outlinedIcon: Newspaper,
    filledIcon: Newspaper,
  },
  // Wishlist - for authenticated users only
  {
    href: null,
    label: 'Wishlist',
    outlinedIcon: Heart,
    filledIcon: Heart,
    requiresAuth: true,
    excludeRoles: [ROLES.BUSINESS_ADMIN],
    dynamicHref: getWishlistPath,
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, hasHydrated, user } = useAuthStore()
  const userRole = user?.role as Role | undefined

  // Filter items based on auth status and role
  const navItems = baseNavItems.filter(item => {
    // Check auth requirement
    if (item.requiresAuth && !(hasHydrated && isAuthenticated)) {
      return false
    }

    // Check role restrictions
    if (item.roles && item.roles.length > 0) {
      // If roles specified, user must have one of them
      if (!userRole || !item.roles.includes(userRole)) {
        return false
      }
    }

    // Check excluded roles
    if (item.excludeRoles && item.excludeRoles.length > 0) {
      if (userRole && item.excludeRoles.includes(userRole)) {
        return false
      }
    }

    return true
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          // Get dynamic href if available
          const href = item.dynamicHref ? item.dynamicHref(user?.role as Role | undefined) : item.href
          if (!href) return null

          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const OutlinedIcon = item.outlinedIcon
          const FilledIcon = item.filledIcon

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive ? (
                <span className="relative inline-flex h-5 w-5 items-center justify-center">
                  <FilledIcon className="h-5 w-5 fill-current" strokeWidth={1.4} />
                </span>
              ) : (
                <OutlinedIcon className="h-5 w-5" strokeWidth={2} />
              )}
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
