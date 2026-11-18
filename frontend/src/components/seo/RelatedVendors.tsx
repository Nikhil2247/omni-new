'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaintedScene, skPaper } from '@/components/sketch';

function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Vendor {
  id: string;
  slug: string;
  name: string;
  category?: {
    slug: string;
    name: string;
  };
  city?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  coverImage?: string;
}

interface RelatedVendorsProps {
  vendors: Vendor[];
  title?: string;
  subtitle?: string;
  currentVendorId?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  variant?: 'default' | 'compact' | 'horizontal';
  limit?: number;
}

export function RelatedVendors({
  vendors,
  title = 'Similar Vendors You May Like',
  subtitle,
  currentVendorId,
  showViewAll = true,
  viewAllHref = '/vendors',
  variant = 'default',
  limit = 4,
}: RelatedVendorsProps) {
  const filteredVendors = currentVendorId
    ? vendors.filter((v) => v.id !== currentVendorId).slice(0, limit)
    : vendors.slice(0, limit);

  if (filteredVendors.length === 0) return null;

  if (variant === 'compact') {
    return (
      <section className="py-6 border-t-2 border-dashed border-line">
        <div className="flex items-center justify-between mb-4">
          <h3 className="sk-eyebrow">
            {title}
          </h3>
          {showViewAll && (
            <Link
              href={viewAllHref}
              className="text-xs font-bold text-blue hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        <div className="space-y-3">
          {filteredVendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-wash transition-colors group"
            >
              <div className="relative h-12 w-12 rounded-md overflow-hidden bg-blue-wash shrink-0 border-2 border-ink">
                {vendor.coverImage ? (
                  <Image
                    src={vendor.coverImage}
                    alt={vendor.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <PaintedScene seed={seedOf(vendor.id)} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate group-hover:text-blue transition-colors">
                  {vendor.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-ink-soft">
                  {vendor.rating && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      {vendor.rating.toFixed(1)}
                    </span>
                  )}
                  {vendor.city && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {vendor.city}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  if (variant === 'horizontal') {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-ink-soft mt-1">{subtitle}</p>}
          </div>
          {showViewAll && (
            <Link
              href={viewAllHref}
              className="text-sm font-bold text-blue hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-line">
          {filteredVendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="flex-none w-64 group"
            >
              <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-blue-wash mb-3 border-2 border-ink">
                {vendor.coverImage ? (
                  <Image
                    src={vendor.coverImage}
                    alt={vendor.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <PaintedScene seed={seedOf(vendor.id)} />
                )}
              </div>
              <h3 className="font-medium text-sm group-hover:text-blue transition-colors truncate">
                {vendor.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-ink-soft mt-1">
                {vendor.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    {vendor.rating.toFixed(1)}
                    {vendor.reviewCount && <span>({vendor.reviewCount})</span>}
                  </span>
                )}
                {vendor.category?.name && <span>{vendor.category.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 border-t-2 border-dashed border-line">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-ink-soft mt-1">{subtitle}</p>}
        </div>
        {showViewAll && (
          <Link
            href={viewAllHref}
            className="text-sm font-bold text-blue hover:underline inline-flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredVendors.map((vendor) => (
          <Link
            key={vendor.id}
            href={`/vendors/${vendor.slug}`}
            className={cn(
              skPaper({ className: 'group block overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-1' })
            )}
          >
            <div className="relative aspect-[4/3] bg-blue-wash">
              {vendor.coverImage ? (
                <Image
                  src={vendor.coverImage}
                  alt={vendor.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <PaintedScene seed={seedOf(vendor.id)} />
              )}
              {vendor.priceRange && (
                <span className="absolute top-2 right-2 sk-chip !px-2 !py-1 !text-xs">
                  {vendor.priceRange}
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium group-hover:text-blue transition-colors truncate">
                {vendor.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-ink-soft mt-1">
                {vendor.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                    {vendor.rating.toFixed(1)}
                    {vendor.reviewCount && (
                      <span className="text-xs">({vendor.reviewCount})</span>
                    )}
                  </span>
                )}
                {vendor.city && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {vendor.city}
                  </span>
                )}
              </div>
              {vendor.category?.name && (
                <span className="sk-chip mt-2 !text-xs">
                  {vendor.category.name}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
