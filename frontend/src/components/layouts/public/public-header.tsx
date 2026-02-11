"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Menu, X, User, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useLogout } from "@/hooks/use-auth";
import { getDefaultPath, getSettingsPath } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";
import type { Role } from "@/config/roles";

interface PublicHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function PublicHeader({ onToggleSidebar, isSidebarOpen }: PublicHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isAuthenticated, hasHydrated, user } = useAuthStore();
  const logoutMutation = useLogout();
  const dashboardPath = getDefaultPath(user?.role as Role | undefined);
  const settingsPath = getSettingsPath(user?.role as Role | undefined);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="border-border/40 bg-background/95 supports-backdrop-filter:bg-background/80 fixed top-0 left-0 z-50 w-full border-b backdrop-blur">
      <nav className="mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Section: Sidebar Toggle + Logo */}
        <div className="flex items-center gap-2">
          {/* Sidebar Toggle (Desktop) */}
          {onToggleSidebar && !isSidebarOpen && (
            <button
              className="hidden rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground lg:inline-flex"
              onClick={onToggleSidebar}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
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

        {/* Desktop Navigation (Tablet) */}
        <div className="hidden items-center gap-6 md:flex lg:hidden">
          <Link
            href="/vendors"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Find Vendors
          </Link>
          <Link
            href="/discover"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Discover
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Link
            href="/blog"
            className="hover:text-primary text-sm font-medium text-gray-700 transition-colors"
          >
            Blog
          </Link>
        </div>

        {/* Right Section: Auth Buttons */}
        <div className="flex items-center gap-4">
          {hasHydrated && !isAuthenticated && (
            <>
              <Button
                variant="outline"
                asChild
                className="border-primary/30 text-primary hover:text-primary"
              >
                <Link href="/register/vendor">Register Vendor</Link>
              </Button>
              <Button variant="ghost" asChild className="hover:text-primary text-gray-700">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                className="shadow-primary/25 from-primary to-primary/80 bg-linear-to-r shadow-lg"
              >
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
          {hasHydrated && isAuthenticated && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-gray-100/50"
                  aria-label="Open user menu"
                >
                  <div className="from-primary to-primary/60 text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br font-semibold shadow-md">
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
                        <Link
                          href={dashboardPath}
                          className="flex items-center gap-3 rounded-md px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link
                          href={settingsPath}
                          className="flex items-center gap-3 rounded-md px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
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
