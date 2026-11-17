import type { IcoName } from '@/components/sketch'

/** Vendor categories shown as tiles. The slug matches the `categoryId` filter used by /vendors. */
export const CATEGORY_TILES: Array<{ title: string; slug: string; icon: IcoName }> = [
  { title: 'Venue', slug: 'venue', icon: 'venue' },
  { title: 'Photography', slug: 'photography', icon: 'photography' },
  { title: 'Catering', slug: 'food-catering', icon: 'catering' },
  { title: 'Decor', slug: 'decor-design', icon: 'decor' },
  { title: 'Mehndi', slug: 'mehndi-artists', icon: 'mehndi' },
  { title: 'Entertainment', slug: 'entertainment', icon: 'entertainment' },
  { title: 'Planner', slug: 'wedding-planning', icon: 'planner' },
  { title: 'Makeup', slug: 'makeup-hair', icon: 'makeup' },
]

/** The six platform features, shown on the "Start Planning" path. */
export const PLATFORM_FEATURES: Array<{
  title: string
  description: string
  icon: IcoName
  caption: string
  motif: number
}> = [
  {
    title: 'Discover Vendors',
    description:
      'Browse thousands of verified vendors across all categories including venues, photographers, caterers, decorators, and more. Filter by location, budget, style, and availability to find your perfect match.',
    icon: 'search',
    caption: 'browse by style and budget',
    motif: 2,
  },
  {
    title: 'Verified Reviews',
    description:
      'Read authentic reviews and ratings from real couples who have worked with our vendors. See photos, detailed feedback, and honest experiences to make informed decisions.',
    icon: 'star',
    caption: 'real couples, real words',
    motif: 4,
  },
  {
    title: 'Planning Tools',
    description:
      'Access free budget calculators, guest list managers, event checklists, timeline generators, RSVP trackers, and digital invite creators to stay organized throughout your planning journey.',
    icon: 'calendar',
    caption: 'free, and always on',
    motif: 3,
  },
  {
    title: 'Secure Booking',
    description:
      'Book vendors with confidence using our secure payment processing. Your transactions are protected, and we offer booking guarantees to ensure peace of mind for your special day.',
    icon: 'shield',
    caption: 'book with peace of mind',
    motif: 1,
  },
  {
    title: 'Instant Communication',
    description:
      'Message vendors directly through our platform, share ideas, request quotes, negotiate details, and finalize everything in one convenient place without switching between apps.',
    icon: 'chat',
    caption: 'one chat for everything',
    motif: 0,
  },
  {
    title: 'Best Price Guarantee',
    description:
      "Get competitive pricing with transparent quotes from multiple vendors. Compare packages, negotiate deals, and ensure you're getting the best value for your celebration.",
    icon: 'tag',
    caption: 'compare, then choose',
    motif: 3,
  },
]

export type ToolKey = 'budget' | 'guests' | 'checklist' | 'timeline' | 'rsvp' | 'invite'

/** The six free planning tools and the public page for each. */
export const PLANNING_TOOLS: Array<{
  key: ToolKey
  title: string
  description: string
  tagline: string
  href: string
  icon: IcoName
}> = [
  { key: 'budget', title: 'Budget Calculator', description: 'Track expenses and manage your event budget', tagline: 'Track every rupee with confidence', href: '/event-budget-calculator', icon: 'wallet' },
  { key: 'guests', title: 'Guest List Manager', description: 'Organize guests, RSVPs, and seating', tagline: 'Organize guests, track RSVPs, stress less', href: '/wedding-guest-list', icon: 'guests' },
  { key: 'checklist', title: 'Event Checklist', description: 'Never miss a task with smart planning', tagline: 'Never miss a planning task', href: '/event-checklist-tool', icon: 'planner' },
  { key: 'timeline', title: 'Timeline Generator', description: 'Create day-of schedules for your event', tagline: 'Keep your big day running smoothly', href: '/event-timeline-generator', icon: 'clock' },
  { key: 'rsvp', title: 'RSVP Manager', description: 'Track responses and send reminders', tagline: 'Track every response, effortlessly', href: '/rsvp-manager', icon: 'mail' },
  { key: 'invite', title: 'Digital Invites', description: 'Design and send beautiful invitations', tagline: 'Create stunning invitations in minutes', href: '/digital-invite-generator', icon: 'heart' },
]

export const INSPIRE_TILES = [
  { title: 'Wedding Decor', count: '2,500+ ideas', query: 'decor', motif: 3 },
  { title: 'Venue Ideas', count: '1,800+ venues', query: 'venue', motif: 2 },
  { title: 'Bridal Looks', count: '3,200+ styles', query: 'bridal', motif: 4 },
  { title: 'Food & Menu', count: '1,500+ menus', query: 'food', motif: 0 },
]

export const HOME_FAQS = [
  {
    question: 'Is Omnicassion free to use?',
    answer:
      'Yes! Creating an account, browsing vendors, and using our planning tools is completely free. You only pay when you book vendor services.',
  },
  {
    question: 'How do I find the right vendor?',
    answer:
      'Use our search filters to narrow down by category, location, budget, and style. Read reviews, view portfolios, and message vendors directly to find your perfect match.',
  },
  {
    question: 'Are vendors on Omnicassion verified?',
    answer:
      'Yes, all vendors go through a verification process. We check business documents, portfolios, and monitor reviews to ensure quality service.',
  },
  {
    question: 'Can I manage my entire event on Omnicassion?',
    answer:
      'Absolutely! Use our budget calculator, guest list manager, checklist, timeline generator, and digital invites to plan every detail of your event.',
  },
  {
    question: 'How does vendor booking work?',
    answer:
      'Browse vendors, request quotes, compare prices, and book directly through our secure platform. We handle payments and provide booking protection.',
  },
  {
    question: 'What if I need help with planning?',
    answer:
      'Our AI assistant is available 24/7 to answer questions and provide recommendations. You can also hire professional planners through our platform.',
  },
]

/** Fallback event types for the hero planner when the lookup API has not loaded. */
export const FALLBACK_EVENT_TYPES = [
  'Wedding',
  'Engagement',
  'Sangeet and mehendi',
  'Birthday',
  'Corporate event',
  'Other celebration',
]
