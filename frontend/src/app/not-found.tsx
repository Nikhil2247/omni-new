import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Omnicassion',
  description: 'The page you are looking for could not be found. Discover verified event vendors, wedding planners, and celebration services on Omnicassion.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* 404 Visual */}
        <div className="relative">
          <h1 className="text-[120px] font-bold leading-none text-muted-foreground/20 sm:text-[150px]">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Search className="h-12 w-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/vendors">
              <Search className="mr-2 h-4 w-4" />
              Browse Vendors
            </Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Popular pages you might be looking for:</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/vendors" className="text-primary hover:underline">
              Find Vendors
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/discover" className="text-primary hover:underline">
              Discover
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/blog" className="text-primary hover:underline">
              Blog
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/pricing" className="text-primary hover:underline">
              Pricing
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/contact" className="text-primary hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
