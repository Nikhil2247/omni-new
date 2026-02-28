import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function AuthFooter() {
  return (
    <footer className="border-t py-8 sm:py-10">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Logo + Branding */}
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/images/omnilogo.avif"
              alt={siteConfig.name}
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{siteConfig.name}</p>
              <p className="text-xs text-muted-foreground">Indian premier event planning and social platform</p>
              <p className="text-xs italic text-muted-foreground/70">Just sit back and enjoy</p>
            </div>
          </div>

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

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
