/**
 * Breadcrumb Component with Schema
 * Displays breadcrumb navigation with structured data
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { JsonLd } from './JsonLd';
import { createBreadcrumbSchema } from '@/lib/seo/structured-data';

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  // Add home as first item if not present
  const allItems = items[0]?.name === 'Home' 
    ? items 
    : [{ name: 'Home', url: '/' }, ...items];

  return (
    <>
      {/* Structured Data */}
      <JsonLd data={createBreadcrumbSchema(allItems)} />

      {/* Visual Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center space-x-2 text-sm ${className}`}
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
              )}
              
              {isLast ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : item.url ? (
                <Link
                  href={item.url}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isFirst && <Home className="h-4 w-4" />}
                  {!isFirst && item.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">{item.name}</span>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
