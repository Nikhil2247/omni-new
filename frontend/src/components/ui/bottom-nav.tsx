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
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  href: string | null
  label: string
  outlinedIcon: LucideIcon
  filledIcon: LucideIcon
  requiresAuth?: boolean
  dynamicHref?: (role?: Role) => string
}

const getWishlistPath = (_role?: Role) => '/wishlists'

// Public page navigation items
const baseNavItems: NavItem[] = [
  {
    href: '/tools',
    label: 'Tools',
    outlinedIcon: Calendar,
    filledIcon: Calendar,
  },
  {
    href: '/vendors',
    label: 'Vendors',
    outlinedIcon: Users,
    filledIcon: Users,
  },
  {
    href: '/discover',
    label: 'Discover',
    outlinedIcon: Compass,
    filledIcon: Compass,
  },
  {
    href: '/blog',
    label: 'Blog',
    outlinedIcon: Newspaper,
    filledIcon: Newspaper,
  },
  {
    href: null,
    label: 'Wishlist',
    outlinedIcon: Heart,
    filledIcon: Heart,
    requiresAuth: true,
    dynamicHref: getWishlistPath,
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, hasHydrated, user } = useAuthStore()

  // Filter items based on auth status
  const navItems = baseNavItems.filter(item => {
    if (item.requiresAuth) {
      return hasHydrated && isAuthenticated
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
