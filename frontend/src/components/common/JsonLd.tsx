/**
 * JSON-LD Component
 * Renders structured data in JSON-LD format for SEO
 */

import { generateJsonLd } from '@/lib/seo/metadata';
import type { JsonLdSchema } from '@/lib/seo/types';

interface JsonLdProps {
  data: JsonLdSchema | JsonLdSchema[];
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLdString = generateJsonLd(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString }}
    />
  );
}
