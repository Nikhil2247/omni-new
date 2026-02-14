"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Menu, X, User, Settings, LogOut, Bell, MessageSquare, LayoutDashboard, Heart } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useLogout } from "@/hooks/use-auth";
import { getDefaultPath, getSettingsPath } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";
import type { Role } from "@/config/roles";
import { ROLES } from "@/config/roles";
import { useRouter } from "next/navigation";
import { NotificationPopover } from "@/components/features/notifications/notification-popover";
import { GlobalSearch } from "@/components/common/global-search";

interface PublicHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function PublicHeader({ onToggleSidebar, isSidebarOpen }: PublicHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isAuthenticated, hasHydrated, user } = useAuthStore();
  const logoutMutation = useLogout();
  const router = useRouter();
  const dashboardPath = getDefaultPath(user?.role as Role | undefined);
  const settingsPath = getSettingsPath(user?.role as Role | undefined);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Check if user is business or regular user
  const isBusinessOrUser = user?.role === ROLES.BUSINESS_ADMIN || user?.role === ROLES.USER;
  const messagesPath = user?.role === ROLES.BUSINESS_ADMIN ? '/business-messages' : '/user-messages';
  const profilePath = user?.role === ROLES.BUSINESS_ADMIN ? '/business/profile' : '/settings/profile';
  const isUser = user?.role === ROLES.USER;

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-linear-to-b from-[#9cc0e4] to-transparent shadow-lg backdrop-blur-md">
      <nav className="mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Section: Sidebar Toggle + Logo */}
        <div className="flex items-center gap-2">
          {/* Sidebar Toggle (Tablet & Desktop) */}
          {onToggleSidebar && !isSidebarOpen && (
            <button
              className="hidden rounded-lg p-2 text-white/80 transition-all duration-200 hover:bg-gray-100 hover:text-white md:inline-flex"
              onClick={onToggleSidebar}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5 text-black" />
            </button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/images/omnilogo.avif"
              className="h-9 rounded-full"
              alt="Omnicassion Logo"
              onError={(e) => {
                // Fallback to text logo if image doesn't exist
                e.currentTarget.style.display = "none";
              }}
            />
          </Link>
        </div>

        {/* Center Section: Global Search */}
        <div className="hidden flex-1 justify-center px-4 lg:flex">
          <GlobalSearch className="max-w-xl" />
        </div>

        {/* Desktop Navigation (Tablet) */}
        <div className="hidden items-center gap-6 md:flex lg:hidden">
          <Link
            href="/vendors"
            className="text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            Find Vendors
          </Link>
          <Link
            href="/discover"
            className="text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            Discover
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            How It Works
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            About
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            Blog
          </Link>
        </div>

        {/* Right Section: Auth Buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          {hasHydrated && !isAuthenticated && (
            <Button asChild className="bg-white text-[#4597e3] shadow-lg hover:bg-white/90">
              <Link href="/login">Login</Link>
            </Button>
          )}
          {hasHydrated && isAuthenticated && (
            <>
              {/* Notification Popover */}
              <NotificationPopover />

              {isBusinessOrUser && (
                <Link
                  href={messagesPath}
                  className="rounded-lg p-2 text-white/90 transition-all hover:bg-gray-100 hover:text-white inline-flex items-center justify-center"
                  aria-label="Messages"
                >
                  <MessageSquare className="h-5 w-5 text-black" />
                </Link>
              )}

              {isUser && (
                <Link
                  href="/wishlists"
                  className="rounded-lg p-2 text-white/90 transition-all hover:bg-gray-100 hover:text-white inline-flex items-center justify-center"
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5 text-black" />
                </Link>
              )}

              {/* Profile Icon with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-white/10"
                  aria-label="Open user menu"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1B75C9] font-semibold shadow-md">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border bg-white shadow-lg">
                      <div className="border-b px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            router.push(dashboardPath);
                            setShowUserMenu(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </button>
                        <button
                          onClick={() => {
                            router.push(profilePath);
                            setShowUserMenu(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            router.push(settingsPath);
                            setShowUserMenu(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </button>
                      </div>
                      <div className="border-t py-2">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-red-600 transition-colors hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
