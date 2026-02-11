import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function AuthFooter() {
  return (
    <footer className="border-t py-6 sm:py-8">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Copyright */}
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/support" className="transition-colors hover:text-foreground">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
