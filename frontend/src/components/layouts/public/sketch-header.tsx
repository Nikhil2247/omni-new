'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { ChevronDown, Heart, LogOut, Menu, MessageSquare, Moon, Bookmark, Settings, Sun, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { skBtn } from '@/components/sketch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { NotificationPopover } from '@/components/features/notifications/notification-popover'
import { useAuthStore } from '@/store/auth-store'
import { useLogout } from '@/hooks/use-auth'
import { useMounted } from '@/hooks/use-mounted'
import { useBusinessProfile, useBusinessKyc, useBusinessContract, useConsentStatus } from '@/hooks/queries/use-business'
import { ROLES } from '@/config/roles'
import type { Role } from '@/config/roles'
import { getSettingsPath } from '@/lib/utils/permissions'
import { MyToolsPanel } from './my-tools'
import { useMyTools } from './use-my-tools'

const GUEST_TOOLS = [
  { href: '/event-budget-calculator', label: 'Budget Calculator' },
  { href: '/wedding-guest-list', label: 'Guest List Manager' },
  { href: '/event-checklist-tool', label: 'Event Checklist' },
  { href: '/event-timeline-generator', label: 'Timeline Generator' },
  { href: '/rsvp-manager', label: 'RSVP Manager' },
  { href: '/digital-invite-generator', label: 'Digital Invites' },
]

const COMPANY_LINKS = [
  { href: '/for-vendors', label: 'For Vendors' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

const MORE_LINKS = [
  { href: '/support', label: 'Support' },
  { href: '/contact', label: 'Contact' },
  { href: '/quote', label: 'Get a quote' },
  { href: '/assistant', label: 'AI assistant' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
]

const navLink =
  'whitespace-nowrap font-medium transition-colors hover:text-blue focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-gold focus-visible:outline-offset-4'
const navActive =
  'font-bold text-blue bg-[linear-gradient(var(--blue-wash),var(--blue-wash))] bg-[length:100%_6px] bg-bottom bg-no-repeat'

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="sk-sticker" aria-label="Omnicassion home">
      <NextImage src="/images/omnilogo.avif" width={150} height={36} unoptimized priority alt="Omnicassion" className={cn('h-[34px] w-auto', className)} />
    </Link>
  )
}

export function SketchHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, hasHydrated, user } = useAuthStore()
  const logoutMutation = useLogout()

  const isVendor = user?.role === ROLES.BUSINESS_ADMIN
  const isUser = user?.role === ROLES.USER
  const authed = hasHydrated && isAuthenticated
  const isLoggedInUser = authed && isUser
  const hasWishlist = authed && (isUser || isVendor)
  const settingsPath = getSettingsPath(user?.role as Role | undefined)
  const messagesPath = isVendor ? '/business-messages' : '/messages'
  const profilePath = isVendor ? '/business/profile' : '/settings/profile'

  // Vendors who have not finished onboarding go to onboarding instead of the profile.
  const { data: vendorProfile } = useBusinessProfile({ enabled: isVendor })
  const { data: vendorKyc } = useBusinessKyc({ enabled: isVendor })
  const { data: vendorContract } = useBusinessContract({ enabled: isVendor })
  const { data: consentStatus } = useConsentStatus({ enabled: isVendor })
  const onboardingComplete = (() => {
    if (!isVendor) return true
    const complete =
      !!vendorProfile?.id && !!vendorProfile?.businessName && !!vendorProfile?.description && !!vendorProfile?.categoryId
    return (
      complete &&
      vendorKyc?.status === 'APPROVED' &&
      (consentStatus?.required?.hasAll ?? false) &&
      (vendorContract?.contract?.signedByVendor ?? false)
    )
  })()
  const goProfile = () => {
    setMenuOpen(false)
    router.push(isVendor && !onboardingComplete ? '/business/onboarding' : profilePath)
  }

  // What the signed-in host has set up, so the Tools menu can say what is started and what is not.
  const myTools = useMyTools({ events: isLoggedInUser, wishlist: hasWishlist })

  const dark = mounted && theme === 'dark'
  const toggleTheme = () => setTheme(dark ? 'light' : 'dark')
  const closeMenu = () => setMenuOpen(false)

  const toolsActive =
    GUEST_TOOLS.some((t) => isActive(pathname, t.href)) ||
    isActive(pathname, '/planning-tools') ||
    isActive(pathname, '/tools') ||
    isActive(pathname, '/events')

  const mainLinks = [
    { href: '/vendors', label: 'Find Vendors' },
    { href: '/discover', label: 'Discover' },
    { href: '/blog', label: 'Blog' },
  ]
  const moreLinks = authed ? [...COMPANY_LINKS, ...MORE_LINKS] : MORE_LINKS

  return (
    <header className="flex items-center justify-between gap-3 py-3 md:py-4">
      <Logo />

      {/* ---------- desktop navigation ---------- */}
      <nav aria-label="Main" className="hidden items-center gap-[22px] md:flex">
        {mainLinks.map((l) => (
          <Link key={l.href} href={l.href} className={cn(navLink, isActive(pathname, l.href) && navActive)}>
            {l.label}
          </Link>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger className={cn(navLink, 'inline-flex items-center gap-1', toolsActive && navActive)}>
            {isLoggedInUser ? 'My tools' : 'Tools'} <ChevronDown className="size-3.5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="border-ink bg-card w-72 border-2 p-0">
            {isLoggedInUser ? (
              <MyToolsPanel
                data={myTools}
                renderRow={(row, key) => (
                  <DropdownMenuItem key={key} asChild className="p-0 focus:bg-transparent">
                    {row}
                  </DropdownMenuItem>
                )}
              />
            ) : (
              <div className="p-1">
                <DropdownMenuItem asChild>
                  <Link href="/planning-tools">All planning tools</Link>
                </DropdownMenuItem>
                {GUEST_TOOLS.map((t) => (
                  <DropdownMenuItem key={t.href} asChild>
                    <Link href={t.href}>{t.label}</Link>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasWishlist ? (
          <Link href="/wishlists" className={cn(navLink, 'inline-flex items-center gap-1.5', isActive(pathname, '/wishlists') && navActive)}>
            Wishlist
            {myTools.savedCount > 0 ? (
              <span className="bg-blue text-on-blue rounded-full px-1.5 py-px text-[0.68rem] leading-none font-bold">{myTools.savedCount}</span>
            ) : null}
          </Link>
        ) : null}

        {!authed
          ? COMPANY_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={cn(navLink, isActive(pathname, l.href) && navActive)}>
                {l.label}
              </Link>
            ))
          : null}

        <DropdownMenu>
          <DropdownMenuTrigger className={cn(navLink, 'inline-flex items-center gap-1')}>
            More <ChevronDown className="size-3.5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="border-ink bg-card min-w-48 border-2">
            {moreLinks.map((m) => (
              <DropdownMenuItem key={m.href} asChild>
                <Link href={m.href}>{m.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* ---------- desktop actions ---------- */}
      <div className="hidden items-center gap-2.5 md:flex">
        {hasHydrated && !isAuthenticated ? (
          <>
            <Link href="/login" className={skBtn('ghost', 'sm')}>
              Login
            </Link>
            <Link href="/register" className={skBtn('solid', 'sm')}>
              Sign Up
            </Link>
          </>
        ) : null}

        {authed ? (
          <>
            <NotificationPopover className="hover:bg-muted flex size-9 items-center justify-center rounded-full p-0" />
            {isUser || isVendor ? (
              <Link href={messagesPath} aria-label="Messages" title="Messages" className="hover:bg-muted flex size-9 items-center justify-center rounded-full">
                <MessageSquare className="size-[18px]" />
              </Link>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Open user menu" className="bg-blue text-on-blue flex size-9 items-center justify-center rounded-full border-2 border-ink text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-ink bg-card w-56 border-2">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-ink-soft text-xs font-normal">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={goProfile}>
                  <User className="size-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={settingsPath}>
                    <Settings className="size-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={toggleTheme}>
                  {dark ? <Sun className="size-4" /> : <Moon className="size-4" />} Toggle theme
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => logoutMutation.mutate()}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <button type="button" onClick={toggleTheme} aria-label="Switch light and dark paper" title="Toggle theme" className="bg-card text-ink flex size-[38px] items-center justify-center rounded-full border-2 border-ink">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        )}
      </div>

      {/* ---------- mobile bar: logo, sign up / bell, menu ---------- */}
      <div className="flex items-center gap-2 md:hidden">
        {hasHydrated && !isAuthenticated ? (
          <Link href="/register" className={skBtn('solid', 'sm')}>
            Sign Up
          </Link>
        ) : null}
        {authed ? <NotificationPopover className="hover:bg-muted flex size-10 items-center justify-center rounded-full p-0" /> : null}

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button type="button" aria-label="Open menu" className="bg-card text-ink flex size-10 items-center justify-center rounded-full border-2 border-ink">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-paper border-ink w-[min(88vw,380px)] gap-0 overflow-y-auto border-l-2 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Site navigation</SheetDescription>

            <div className="border-line flex items-center gap-3 border-b-2 border-dashed p-4 pr-14">
              {authed ? (
                <>
                  <span className="bg-blue text-on-blue flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink text-lg font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{user?.name}</p>
                    <p className="text-ink-soft truncate text-xs">{user?.email}</p>
                  </div>
                </>
              ) : (
                <Logo />
              )}
            </div>

            <nav aria-label="Menu" className="grid gap-1 p-3">
              {mainLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={closeMenu} className={cn('rounded-md px-3 py-3 text-base font-medium', isActive(pathname, l.href) ? 'bg-accent text-blue font-bold' : 'hover:bg-accent')}>
                  {l.label}
                </Link>
              ))}

              {/* tools: the host's own event tools when signed in, the public tools otherwise */}
              <p className="sk-eyebrow mt-3 px-3">{isLoggedInUser ? 'My tools' : 'Planning tools'}</p>
              {isLoggedInUser ? (
                <div className="sk-paper sk-paper--alt mx-1 my-1">
                  <MyToolsPanel data={myTools} onNavigate={closeMenu} />
                </div>
              ) : (
                <>
                  <Link href="/planning-tools" onClick={closeMenu} className="hover:bg-accent rounded-md px-3 py-2.5 font-medium">
                    All planning tools
                  </Link>
                  {GUEST_TOOLS.map((t) => (
                    <Link key={t.href} href={t.href} onClick={closeMenu} className={cn('rounded-md px-3 py-2.5 text-[0.95rem]', isActive(pathname, t.href) ? 'bg-accent text-blue font-bold' : 'hover:bg-accent')}>
                      {t.label}
                    </Link>
                  ))}
                </>
              )}

              {hasWishlist ? (
                <Link href="/wishlists" onClick={closeMenu} className={cn('mt-2 flex items-center justify-between rounded-md px-3 py-3 text-base font-medium', isActive(pathname, '/wishlists') ? 'bg-accent text-blue font-bold' : 'hover:bg-accent')}>
                  <span className="flex items-center gap-2">
                    {isVendor ? <Bookmark className="size-4" /> : <Heart className="size-4" />} Wishlist
                  </span>
                  <span className={cn('sk-stamp !rotate-0', myTools.savedCount === 0 && 'sk-stamp--wait')}>
                    {myTools.savedCount > 0 ? `${myTools.savedCount} saved` : 'Nothing saved'}
                  </span>
                </Link>
              ) : null}
              {authed && (isUser || isVendor) ? (
                <Link href={messagesPath} onClick={closeMenu} className="hover:bg-accent flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium">
                  <MessageSquare className="size-4" /> Messages
                </Link>
              ) : null}

              <p className="sk-eyebrow mt-3 px-3">Company</p>
              {[...COMPANY_LINKS, ...MORE_LINKS].map((l) => (
                <Link key={l.href} href={l.href} onClick={closeMenu} className={cn('rounded-md px-3 py-2.5 text-[0.95rem]', isActive(pathname, l.href) ? 'bg-accent text-blue font-bold' : 'hover:bg-accent')}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="border-line mt-auto grid gap-2 border-t-2 border-dashed p-4">
              <button type="button" onClick={toggleTheme} className="hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-[0.95rem] font-medium">
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />} {dark ? 'Light paper' : 'Dark paper'}
              </button>
              {authed ? (
                <>
                  <button type="button" onClick={goProfile} className="hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-[0.95rem] font-medium">
                    <User className="size-4" /> Profile
                  </button>
                  <Link href={settingsPath} onClick={closeMenu} className="hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2.5 text-[0.95rem] font-medium">
                    <Settings className="size-4" /> Settings
                  </Link>
                  <button type="button" onClick={() => { closeMenu(); logoutMutation.mutate() }} className="text-destructive hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-[0.95rem] font-medium">
                    <LogOut className="size-4" /> Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" onClick={closeMenu} className={cn(skBtn('line', 'md'), 'flex-1')}>
                    Login
                  </Link>
                  <Link href="/register" onClick={closeMenu} className={cn(skBtn('solid', 'md'), 'flex-1')}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
