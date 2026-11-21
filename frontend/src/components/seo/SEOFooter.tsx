'use client';

import Link from 'next/link';

const vendorCategories = [
  { name: 'Wedding Photographers', href: '/vendors/category/photography' },
  { name: 'Wedding Videographers', href: '/vendors/category/videography' },
  { name: 'Wedding Venues', href: '/vendors/category/venues' },
  { name: 'Wedding Caterers', href: '/vendors/category/catering' },
  { name: 'Wedding Decorators', href: '/vendors/category/decor-design' },
  { name: 'Makeup Artists', href: '/vendors/category/makeup-hair' },
  { name: 'Mehndi Artists', href: '/vendors/category/mehndi-artists' },
  { name: 'Wedding Planners', href: '/vendors/category/wedding-planning' },
  { name: 'Wedding DJs', href: '/vendors/category/entertainment' },
  { name: 'Wedding Florists', href: '/vendors/category/florist' },
  { name: 'Bridal Jewellery', href: '/vendors/category/jewellery' },
  { name: 'Wedding Invitations', href: '/vendors/category/invitation' },
];

const popularCities = [
  { name: 'Mumbai', href: '/vendors/photography/mumbai' },
  { name: 'Delhi', href: '/vendors/photography/delhi' },
  { name: 'Bangalore', href: '/vendors/photography/bangalore' },
  { name: 'Hyderabad', href: '/vendors/photography/hyderabad' },
  { name: 'Chennai', href: '/vendors/photography/chennai' },
  { name: 'Kolkata', href: '/vendors/photography/kolkata' },
  { name: 'Pune', href: '/vendors/photography/pune' },
  { name: 'Jaipur', href: '/vendors/photography/jaipur' },
  { name: 'Goa', href: '/vendors/photography/goa' },
  { name: 'Udaipur', href: '/vendors/photography/udaipur' },
];

const planningTools = [
  { name: 'Budget Calculator', href: '/event-budget-calculator' },
  { name: 'Wedding Checklist', href: '/event-checklist-tool' },
  { name: 'Guest List Manager', href: '/wedding-guest-list' },
  { name: 'Timeline Generator', href: '/event-timeline-generator' },
  { name: 'RSVP Manager', href: '/rsvp-manager' },
  { name: 'Digital Invites', href: '/digital-invite-generator' },
];

const quickLinks = [
  { name: 'About Us', href: '/about' },
  { name: 'For Vendors', href: '/for-vendors' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Blog', href: '/blog' },
  { name: 'Support', href: '/support' },
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
];

interface SEOFooterProps {
  showCategories?: boolean;
  showCities?: boolean;
  showTools?: boolean;
  showQuickLinks?: boolean;
}

export function SEOFooter({
  showCategories = true,
  showCities = true,
  showTools = true,
  showQuickLinks = true,
}: SEOFooterProps) {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {showCategories && (
            <div>
              <h3 className="font-semibold text-sm mb-4 uppercase tracking-wide text-muted-foreground">
                Wedding Vendors
              </h3>
              <ul className="space-y-2">
                {vendorCategories.slice(0, 8).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showCities && (
            <div>
              <h3 className="font-semibold text-sm mb-4 uppercase tracking-wide text-muted-foreground">
                Popular Cities
              </h3>
              <ul className="space-y-2">
                {popularCities.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Vendors in {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showTools && (
            <div>
              <h3 className="font-semibold text-sm mb-4 uppercase tracking-wide text-muted-foreground">
                Planning Tools
              </h3>
              <ul className="space-y-2">
                {planningTools.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showQuickLinks && (
            <div>
              <h3 className="font-semibold text-sm mb-4 uppercase tracking-wide text-muted-foreground">
                Quick Links
              </h3>
              <ul className="space-y-2">
                {quickLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* SEO Text Block */}
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-lg font-serif font-semibold mb-4">
            Omnicassion - Wedding Planning Platform in India
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Omnicassion is India&apos;s premier all-in-one wedding and event planning platform.
            Find and book verified wedding vendors including photographers, videographers, venues,
            caterers, decorators, makeup artists, mehndi artists, wedding planners, and more across
            major Indian cities like Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata, Pune,
            Jaipur, Goa, and Udaipur.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Use our free wedding planning tools - budget calculator, checklist, guest list manager,
            timeline generator, RSVP tracker, and digital invitation maker.
            across India for planning their dream weddings and celebrations.
          </p>
        </div>

        {/* Extended Links for SEO */}
        <div className="mt-8 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Wedding Vendors by Category:</strong>{' '}
            {vendorCategories.map((cat, i) => (
              <span key={cat.href}>
                <Link href={cat.href} className="hover:text-primary">
                  {cat.name}
                </Link>
                {i < vendorCategories.length - 1 && ' | '}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
