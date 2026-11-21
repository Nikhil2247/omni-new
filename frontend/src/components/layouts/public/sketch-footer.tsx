import Link from 'next/link'
import NextImage from 'next/image'
import { siteConfig } from '@/config/site'

const columns = [
  {
    title: 'Product',
    links: [
      { href: '/vendors', label: 'Find Vendors' },
      { href: '/discover', label: 'Discover' },
      { href: '/planning-tools', label: 'Planning Tools' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/quote', label: 'Get a Quote' },
      { href: '/assistant', label: 'AI Assistant' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
      { href: '/for-vendors', label: 'For Vendors' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/support', label: 'Support' },
    ],
  },
]

const social = [
  { href: siteConfig.links.instagram, label: 'Instagram' },
  { href: siteConfig.links.facebook, label: 'Facebook' },
  { href: siteConfig.links.twitter, label: 'Twitter' },
  { href: siteConfig.links.linkedin, label: 'LinkedIn' },
]

export function SketchFooter() {
  return (
    <footer className="border-line relative mt-[70px] border-t-2 border-dashed bg-[linear-gradient(var(--paper),color-mix(in_srgb,var(--sky1)_55%,var(--paper)))]">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-11 pb-8">
        <div className="grid gap-8 pb-6 max-[700px]:grid-cols-2 min-[701px]:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-[700px]:col-span-2">
            <Link href="/" className="sk-sticker" aria-label="Omnicassion home">
              <NextImage src="/images/omnilogo.avif" width={150} height={36} unoptimized alt="Omnicassion" className="h-[34px] w-auto" />
            </Link>
            <p className="text-ink-soft mt-3 max-w-[22rem] text-sm">
              Wedding & Event Planning Platform in India. Book verified vendors and plan every detail.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-ink-soft hover:text-blue">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="sk-eyebrow mb-3">{col.title}</p>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-blue block py-[3px] text-[0.95rem]">
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="text-ink-soft border-line flex flex-wrap justify-between gap-4 border-t-2 border-dashed pt-[18px] text-sm">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </span>
          <span>Made with care in India.</span>
        </div>
      </div>
    </footer>
  )
}
