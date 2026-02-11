/**
 * Homepage SEO Component
 * Adds structured data for the homepage
 */

import { JsonLd } from '@/components/common/JsonLd';
import { createFAQSchema, createBreadcrumbSchema } from '@/lib/seo/structured-data';

const homepageFAQs = [
  {
    question: 'What is Omnicassion?',
    answer: 'Omnicassion is India\'s premier event planning platform that connects event planners with over 10,000 verified vendors for weddings, corporate events, parties, and celebrations. We provide tools for budgeting, guest list management, vendor comparison, and more.',
  },
  {
    question: 'How do I find vendors on Omnicassion?',
    answer: 'Simply browse our vendor directory by category (venues, caterers, photographers, etc.), filter by location and budget, read reviews, compare prices, and request quotes directly through the platform.',
  },
  {
    question: 'Is Omnicassion free to use?',
    answer: 'Yes, Omnicassion is free for event planners. You can browse vendors, request quotes, and access basic planning tools at no cost. We also offer premium features for enhanced event management.',
  },
  {
    question: 'How are vendors verified?',
    answer: 'All vendors on Omnicassion go through a verification process that includes business registration checks, portfolio reviews, and customer feedback validation to ensure quality and reliability.',
  },
  {
    question: 'Can I manage multiple events on Omnicassion?',
    answer: 'Yes, you can create and manage multiple events simultaneously. Each event has its own budget tracker, guest list, timeline, and vendor shortlist.',
  },
];

export function HomePageSEO() {
  return (
    <>
      <JsonLd data={createFAQSchema(homepageFAQs)} />
      <JsonLd
        data={createBreadcrumbSchema([
          { name: 'Home', url: '/' },
        ])}
      />
    </>
  );
}
