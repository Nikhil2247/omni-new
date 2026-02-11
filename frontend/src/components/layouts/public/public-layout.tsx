"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { BottomNav } from "@/components/ui/bottom-nav";
import { ChatbotWidget } from "@/components/features/chatbot/chatbot-widget";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import {
  Compass,
  Users,
  Sparkles,
  Info,
  Newspaper,
  BadgeDollarSign,
  HelpCircle,
  ListChecks,
  X,
} from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAuthRoute = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ].some((route) => pathname?.startsWith(route));

  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  const navItems = [
    { href: "/vendors", label: "Find Vendors", icon: Users },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/about", label: "About", icon: Info },
    { href: "/blog", label: "Blog", icon: Newspaper },
    { href: "/for-vendors", label: "Partner with Us", icon: BadgeDollarSign },
  ];

  if (isAuthRoute) {
    return <div className="relative flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <PublicHeader
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="relative flex flex-1 pt-16">
        {/* Desktop Sidebar (Overlay) */}
        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] hidden bg-black/30 backdrop-blur-[2px] transition-all duration-200 lg:block"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="border-border/40 bg-background/95 supports-backdrop-filter:bg-background/95 fixed top-0 left-0 z-[70] hidden h-screen w-64 flex-col border-r shadow-xl backdrop-blur transition-all duration-200 ease-out lg:flex">
              {/* Sidebar Header with Close Button */}
              <div className="border-border/40 flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/omnilogo.avif"
                    className="h-9 rounded-full"
                    alt="Omnicassion Logo"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-all duration-200"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-0.5 px-3">
                  {navItems.map((item) => {
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname?.startsWith(item.href.replace("/#", "/")) ||
                          pathname?.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 pt-0 pb-20 md:pb-0">{children}</main>
      </div>
      <PublicFooter />
      {/* Mobile Bottom Navigation */}
      <BottomNav />
      <ChatbotWidget />
    </div>
  );
}
