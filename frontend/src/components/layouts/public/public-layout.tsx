"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { BottomNav } from "@/components/ui/bottom-nav";
import { ChatbotWidget } from "@/components/features/chatbot/chatbot-widget";
import { NotificationPopover } from "@/components/features/notifications/notification-popover";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { ROLES } from "@/config/roles";
import { getSettingsPath } from "@/lib/utils/permissions";
import { useEventsEnabled } from "@/hooks/queries/use-events";
import {
  Compass,
  Users,
  Newspaper,
  Calendar,
  CheckSquare,
  Clock3,
  Images,
  Wallet,
  MessageSquare,
  Heart,
  User,
  Settings,
  LogOut,
  LogIn,
  Moon,
  Sun,
} from "lucide-react";
import type { Role } from "@/config/roles";
import { useRouter } from "next/navigation";
import { useLogout } from "@/hooks/use-auth";
import { useTheme } from "next-themes";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, hasHydrated, user } = useAuthStore();
  const router = useRouter();
  const logoutMutation = useLogout();
  const { theme, setTheme } = useTheme();
  const settingsPath = getSettingsPath(user?.role as Role | undefined);
  const isLoggedInUser = hasHydrated && isAuthenticated && user?.role === ROLES.USER;
  const isBusinessOrUser = user?.role === ROLES.BUSINESS_ADMIN || user?.role === ROLES.USER;
  const isUser = user?.role === ROLES.USER;
  const messagesPath = user?.role === ROLES.BUSINESS_ADMIN ? "/business-messages" : "/messages";
  const profilePath =
    user?.role === ROLES.BUSINESS_ADMIN ? "/business/profile" : "/settings/profile";
  const { data: eventsResponse } = useEventsEnabled({ page: 1, limit: 1 }, isLoggedInUser);
  const primaryEventId = eventsResponse?.data?.[0]?.id;
  const toolSubItems = primaryEventId
    ? [
        { href: `/events/${primaryEventId}/guestlist`, label: "Guestlist", icon: Users },
        { href: `/events/${primaryEventId}/checklist`, label: "Checklist", icon: CheckSquare },
        { href: `/events/${primaryEventId}/budget`, label: "Budget", icon: Wallet },
        { href: `/events/${primaryEventId}/timeline`, label: "Timeline", icon: Clock3 },
        { href: `/events/${primaryEventId}/memories`, label: "Memories", icon: Images },
        { href: "/events", label: "Events", icon: Calendar },
      ]
    : [];
  const isAuthRoute = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ].some((route) => pathname?.startsWith(route));

  const guestNavItems = [
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/vendors", label: "Find Vendors", icon: Users },
    { href: "/blog", label: "Blog", icon: Newspaper },
  ];

  const navItems = isLoggedInUser
    ? [...guestNavItems, { href: "/tools", label: "Tools", icon: Calendar }]
    : guestNavItems;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isAuthRoute) {
    return <div className="relative flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <PublicHeader />
      <div className="relative flex flex-1 pt-16 md:pt-0">
        <aside className="bg-background/95 fixed top-0 left-0 z-40 hidden h-screen w-16 flex-col border-r backdrop-blur-md md:flex">
          <div className="flex items-center justify-center py-3 border-b">
            <Link href="/" aria-label="Home">
              <NextImage
                src="/icons/omnicassion favicon.png"
                width={32}
                height={32}
                unoptimized={true}
                priority={true}
                className="h-8 w-auto object-contain rounded-full"
                alt="Omnicassion Logo"
              />
            </Link>
          </div>

          <nav className="space-y-1 px-2 py-3 pt-4">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/tools"
                    ? pathname?.startsWith("/tools") || pathname?.startsWith("/events")
                  : pathname?.startsWith(item.href.replace("/#", "/")) ||
                    pathname?.startsWith(item.href);
              const Icon = item.icon;
              const isToolsItem = item.href === "/tools";
              return (
                <div key={item.href} className={cn(isToolsItem && toolSubItems.length > 0 ? "group/tools relative" : undefined)}>
                  <Link
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    className={cn(
                      "flex items-center justify-center rounded-lg p-2.5 transition-all duration-150",
                      isActive
                        ? "bg-accent text-primary shadow-sm"
                        : "text-foreground/90 hover:bg-accent"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>

                  {isToolsItem && toolSubItems.length > 0 && (
                    <div className="bg-background pointer-events-none invisible absolute top-0 left-full z-50 ml-2 w-44 rounded-xl border p-1 opacity-0 shadow-lg transition-all duration-150 group-hover/tools:pointer-events-auto group-hover/tools:visible group-hover/tools:opacity-100 group-focus-within/tools:pointer-events-auto group-focus-within/tools:visible group-focus-within/tools:opacity-100">
                      {toolSubItems.map((tool) => {
                        const ToolIcon = tool.icon;
                        const isToolActive = pathname?.startsWith(tool.href);

                        return (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                              isToolActive
                                ? "bg-accent text-primary"
                                : "text-foreground/90 hover:bg-accent"
                            )}
                          >
                            <ToolIcon className="h-4 w-4" />
                            <span>{tool.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {hasHydrated && isAuthenticated && isUser && (
              <div className="pt-2">
                <Link
                  href="/wishlists"
                  className="hover:bg-muted mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-foreground/90 transition-all"
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </Link>
              </div>
            )}
          </nav>

          {hasHydrated && isAuthenticated && (
            <div className="mt-auto space-y-2 border-t px-2 py-3">

              {isBusinessOrUser && (
                <Link
                  href={messagesPath}
                  className="hover:bg-muted mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-foreground/90 transition-all"
                  aria-label="Messages"
                  title="Messages"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
              )}

              <div className="flex justify-center">
                <NotificationPopover
                  className="hover:bg-muted flex h-9 w-9 items-center justify-center p-0 text-foreground/90"
                  contentSide="right"
                  contentAlign="start"
                />
              </div>

              <Link
                href={profilePath}
                className="hover:bg-muted mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-foreground/90 transition-all"
                aria-label="Profile"
                title="Profile"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={() => router.push(settingsPath)}
                className="hover:bg-muted mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-foreground/90 transition-all"
                aria-label="Settings"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-muted mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-foreground/90 transition-all"
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {mounted && theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={() => logoutMutation.mutate()}
                className="hover:bg-muted mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-foreground/90 transition-all"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}

          {hasHydrated && !isAuthenticated && (
            <div className="mt-auto space-y-2 border-t px-2 py-3">
              <Link
                href="/login"
                className="hover:bg-muted mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-foreground/90 transition-all"
                aria-label="Login"
                title="Login"
              >
                <LogIn className="h-5 w-5" />
              </Link>
            </div>
          )}
        </aside>

        <main className="flex-1 pt-0 pb-20 md:ml-16 md:pb-0">{children}</main>
      </div>
      <div className="md:ml-16 hidden md:block">
        <PublicFooter />
      </div>
      {/* Mobile Bottom Navigation */}
      <BottomNav />
      <ChatbotWidget />
    </div>
  );
}
