'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const isVendorRoute = pathname.startsWith('/register/vendor');

  const panelTitle = isVendorRoute
    ? 'Build your vendor presence with confidence.'
    : 'Plan the moment. Celebrate the magic.';
  const panelDescription = isVendorRoute
    ? 'Showcase your services, manage inquiries, and convert leads into unforgettable events.'
    : 'A calm, polished workspace to curate every detail, keep vendors aligned, and delight every guest.';
  const panelHighlights = isVendorRoute
    ? [
        {
          icon: Sparkles,
          text: 'Curated storefronts that spotlight your best work.',
        },
        {
          icon: CalendarCheck,
          text: 'Lead management, availability, and bookings in one place.',
        },
        {
          icon: ShieldCheck,
          text: 'Verified profiles and secure access for your team.',
        },
      ]
    : [
        {
          icon: Sparkles,
          text: 'Curated templates and intelligent planning guidance.',
        },
        {
          icon: CalendarCheck,
          text: 'Timelines and checklists that stay in sync.',
        },
        {
          icon: ShieldCheck,
          text: 'Secure access with the control you expect.',
        },
      ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_700px_at_12%_-10%,rgba(79,70,229,0.18),transparent),radial-gradient(900px_600px_at_95%_10%,rgba(14,165,233,0.16),transparent)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.04),transparent_35%,rgba(15,23,42,0.06))]" />
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="space-y-5 lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                  <span className="text-lg font-semibold">O</span>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Welcome</p>
                  <p className="text-xl font-semibold">{siteConfig.name}</p>
                </div>
              </Link>
              <p className="text-sm text-muted-foreground">
                {isVendorRoute
                  ? 'Everything you need to showcase your services and manage vendor inquiries.'
                  : 'Elegant tools for planners, couples, and vendors to coordinate unforgettable celebrations.'}
              </p>
            </div>

            <div className="hidden space-y-6 lg:block">
              <Link href="/" className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20">
                  <span className="text-xl font-semibold">O</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Omnicassion</p>
                  <p className="text-2xl font-semibold">{siteConfig.name}</p>
                </div>
              </Link>
              <h1 className="text-4xl font-serif font-semibold leading-tight text-foreground">
                {panelTitle}
              </h1>
              <p className="text-lg text-muted-foreground">
                {panelDescription}
              </p>
              <div className="grid gap-4 text-sm text-muted-foreground">
                {panelHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.text} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center lg:justify-end">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
