'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { ChatbotWidget } from '@/components/features/chatbot/chatbot-widget'
import { BgFx, CornerMandala } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { SketchHeader } from './sketch-header'
import { SketchFooter } from './sketch-footer'

interface PublicLayoutProps {
  children: React.ReactNode
}

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

/**
 * Shell for every public and signed-in user page, in the hand-painted theme:
 * paper background with a faint mandala pattern, painted washes, corner mandalas, a top nav and a footer.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname()
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const authed = hasHydrated && isAuthenticated

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname?.startsWith(route))
  const isVendorSlugPage = Boolean(pathname?.match(/^\/vendors\/[^/]+$/))
  const isMessagesPage = pathname === '/messages' || pathname === '/business-messages'
  const isAssistantPage = pathname === '/assistant'
  const showFooter = !isVendorSlugPage && !isMessagesPage && !isAssistantPage

  if (isAuthRoute) {
    return (
      <div className="sk-root relative flex min-h-screen flex-col overflow-x-clip">
        <BgFx />
        <div className="relative z-[2] flex flex-1 flex-col">{children}</div>
      </div>
    )
  }

  return (
    <div className="sk-root relative flex min-h-screen flex-col overflow-x-clip">
      <BgFx />
      <CornerMandala />
      <div className="relative z-[2] flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1440px] px-4">
          <SketchHeader />
        </div>
        <main className={cn('flex-1', authed && 'pb-20 md:pb-0')}>{children}</main>
        {showFooter ? <SketchFooter /> : null}
      </div>
      {authed ? <BottomNav /> : null}
      <ChatbotWidget />
    </div>
  )
}
