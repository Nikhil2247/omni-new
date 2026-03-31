'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';

const indianCities = [
  { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra' },
  { name: 'Delhi', slug: 'delhi', state: 'Delhi NCR' },
  { name: 'Bangalore', slug: 'bangalore', state: 'Karnataka' },
  { name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana' },
  { name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', slug: 'kolkata', state: 'West Bengal' },
  { name: 'Pune', slug: 'pune', state: 'Maharashtra' },
  { name: 'Ahmedabad', slug: 'ahmedabad', state: 'Gujarat' },
  { name: 'Jaipur', slug: 'jaipur', state: 'Rajasthan' },
  { name: 'Lucknow', slug: 'lucknow', state: 'Uttar Pradesh' },
  { name: 'Goa', slug: 'goa', state: 'Goa' },
  { name: 'Udaipur', slug: 'udaipur', state: 'Rajasthan' },
  { name: 'Chandigarh', slug: 'chandigarh', state: 'Punjab' },
  { name: 'Kochi', slug: 'kochi', state: 'Kerala' },
  { name: 'Gurgaon', slug: 'gurgaon', state: 'Haryana' },
];

interface RelatedCitiesProps {
  category?: string;
  currentCity?: string;
  title?: string;
  limit?: number;
  variant?: 'default' | 'compact' | 'list';
}

export function RelatedCities({
  category,
  currentCity,
  title = 'Browse by City',
  limit = 10,
  variant = 'default',
}: RelatedCitiesProps) {
  const cities = currentCity
    ? indianCities.filter((city) => city.slug !== currentCity.toLowerCase()).slice(0, limit)
    : indianCities.slice(0, limit);

  if (variant === 'compact') {
    return (
      <div className="border-t py-6">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={category ? `/vendors/${category}/${city.slug}` : `/vendors?city=${city.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <MapPin className="h-3 w-3" />
              {city.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <section className="py-6">
        <h3 className="mb-4 text-lg font-serif font-semibold">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-2">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={category ? `/vendors/${category}/${city.slug}` : `/vendors?city=${city.slug}`}
              className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
            >
              {city.name}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 border-t">
      <h2 className="mb-4 text-lg font-serif font-semibold">{title}</h2>
      <div className="flex flex-wrap gap-3">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={category ? `/vendors/${category}/${city.slug}` : `/vendors?city=${city.slug}`}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span>{city.name}</span>
            <span className="text-xs text-muted-foreground">({city.state})</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
