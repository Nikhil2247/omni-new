'use client';

import Link from 'next/link';
import { Camera, MapPin, UtensilsCrossed, Sparkles, Palette, Music, Heart, Users, Gem, Flower2, Scissors, Film } from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
  'photography': Camera,
  'videography': Film,
  'venues': MapPin,
  'catering': UtensilsCrossed,
  'decor-design': Palette,
  'entertainment': Music,
  'wedding-planning': Heart,
  'makeup-hair': Scissors,
  'mehndi-artists': Sparkles,
  'florist': Flower2,
  'jewellery': Gem,
  'invitation': Users,
};

const allCategories = [
  { slug: 'photography', name: 'Photographers', shortName: 'Photography' },
  { slug: 'videography', name: 'Videographers', shortName: 'Videography' },
  { slug: 'venues', name: 'Venues', shortName: 'Venues' },
  { slug: 'catering', name: 'Caterers', shortName: 'Catering' },
  { slug: 'decor-design', name: 'Decorators', shortName: 'Decor' },
  { slug: 'entertainment', name: 'Entertainment', shortName: 'Entertainment' },
  { slug: 'wedding-planning', name: 'Wedding Planners', shortName: 'Planners' },
  { slug: 'makeup-hair', name: 'Makeup Artists', shortName: 'Makeup' },
  { slug: 'mehndi-artists', name: 'Mehndi Artists', shortName: 'Mehndi' },
  { slug: 'florist', name: 'Florists', shortName: 'Florists' },
  { slug: 'jewellery', name: 'Jewellery', shortName: 'Jewellery' },
  { slug: 'invitation', name: 'Invitations', shortName: 'Invitations' },
];

interface RelatedCategoriesProps {
  currentCategory?: string;
  city?: string;
  title?: string;
  limit?: number;
  variant?: 'default' | 'compact' | 'grid';
}

export function RelatedCategories({
  currentCategory,
  city,
  title = 'Browse Other Categories',
  limit = 6,
  variant = 'default',
}: RelatedCategoriesProps) {
  const categories = currentCategory
    ? allCategories.filter((cat) => cat.slug !== currentCategory).slice(0, limit)
    : allCategories.slice(0, limit);

  if (variant === 'compact') {
    return (
      <div className="border-t py-6">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={city ? `/vendors/${category.slug}/${city.toLowerCase()}` : `/vendors/category/${category.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {category.shortName}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <section className="py-8">
        <h2 className="mb-6 text-xl font-serif font-semibold">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] || Heart;
            return (
              <Link
                key={category.slug}
                href={city ? `/vendors/${category.slug}/${city.toLowerCase()}` : `/vendors/category/${category.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all group"
              >
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">{category.shortName}</span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 border-t">
      <h2 className="mb-4 text-lg font-serif font-semibold">{title}</h2>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const Icon = categoryIcons[category.slug] || Heart;
          return (
            <Link
              key={category.slug}
              href={city ? `/vendors/${category.slug}/${city.toLowerCase()}` : `/vendors/category/${category.slug}`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Icon className="h-4 w-4 text-primary" />
              {category.name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
