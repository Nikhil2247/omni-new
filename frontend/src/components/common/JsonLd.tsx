/**
 * JSON-LD Component
 * Renders structured data in JSON-LD format for SEO
 */

import { generateJsonLd } from '@/lib/seo/metadata';
import type { JsonLdSchema } from '@/lib/seo/types';

// Extended type to allow custom schema objects beyond the strict types
type ExtendedJsonLdSchema = JsonLdSchema | Record<string, unknown>;

interface JsonLdProps {
  data: ExtendedJsonLdSchema | ExtendedJsonLdSchema[];
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLdString = generateJsonLd(data as JsonLdSchema | JsonLdSchema[]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString }}
    />
  );
}
