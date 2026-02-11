'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { getSettingsPath } from '@/lib/utils/permissions'
import type { Role } from '@/config/roles'
import {
  Home,
  Compass,
  Users,
  Newspaper,
  Settings,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  href: string | null
  label: string
  icon: LucideIcon
  requiresAuth?: boolean
  dynamicHref?: (role?: Role) => string
}

// Public page navigation items
const baseNavItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/vendors', label: 'Vendors', icon: Users },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/blog', label: 'Blog', icon: Newspaper },
  { href: null, label: 'Settings', icon: Settings, requiresAuth: true, dynamicHref: getSettingsPath },
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
          const Icon = item.icon

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
              <Icon className={cn('h-5 w-5', isActive && 'fill-current')} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
