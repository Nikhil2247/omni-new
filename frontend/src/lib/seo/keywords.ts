/**
 * Comprehensive SEO Keywords Configuration
 * Central location for all keyword variations to maximize search rankings
 */

// Major Indian cities for location-based keywords
export const indianCities = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Goa',
  'Udaipur',
  'Kochi',
  'Gurgaon',
  'Noida',
  'Indore',
  'Surat',
  'Nagpur',
  'Coimbatore',
] as const

export type IndianCity = (typeof indianCities)[number]

// Category keyword configurations with extensive variations
export const categoryKeywords: Record<string, {
  primary: string[]
  secondary: string[]
  longTail: string[]
  questions: string[]
  localVariants: (city: string) => string[]
}> = {
  photography: {
    primary: [
      'wedding photographer',
      'wedding photography',
      'candid wedding photographer',
      'pre-wedding photographer',
      'bridal photographer',
    ],
    secondary: [
      'professional wedding photographer',
      'best wedding photographer',
      'top wedding photographers',
      'affordable wedding photography',
      'luxury wedding photographer',
      'destination wedding photographer',
      'wedding photoshoot',
      'engagement photographer',
      'maternity photographer',
      'event photographer',
    ],
    longTail: [
      'candid wedding photography packages',
      'pre-wedding photoshoot prices',
      'best wedding photographer near me',
      'wedding photography cost India',
      'affordable wedding photography packages',
      'professional wedding photographer rates',
      'wedding album photographer',
      'drone wedding photography',
      'cinematic wedding photography',
      'traditional wedding photography',
      'South Indian wedding photographer',
      'North Indian wedding photographer',
      'Muslim wedding photographer',
      'Christian wedding photographer',
      'destination wedding photography packages',
      'pre-wedding shoot locations',
    ],
    questions: [
      'how much does wedding photography cost in India',
      'how to choose a wedding photographer',
      'what to look for in a wedding photographer',
      'best time for pre-wedding photoshoot',
      'wedding photography checklist',
    ],
    localVariants: (city: string) => [
      `wedding photographer in ${city}`,
      `best wedding photographer ${city}`,
      `${city} wedding photography`,
      `candid photographer ${city}`,
      `pre-wedding photoshoot ${city}`,
      `affordable wedding photographer ${city}`,
    ],
  },

  videography: {
    primary: [
      'wedding videographer',
      'wedding videography',
      'wedding cinematography',
      'wedding film',
      'event videographer',
    ],
    secondary: [
      'cinematic wedding video',
      'wedding highlight video',
      'wedding trailer',
      'drone wedding video',
      'same day edit wedding',
      'wedding documentary',
      'pre-wedding video',
      'engagement video',
      'teaser video wedding',
    ],
    longTail: [
      'wedding videography packages India',
      'cinematic wedding video cost',
      'drone wedding videography prices',
      'same day edit wedding video',
      'wedding highlight reel cost',
      '4K wedding videography',
      'wedding film production',
      'traditional wedding video',
      'candid wedding videography',
    ],
    questions: [
      'how much does wedding videography cost',
      'wedding videography vs photography',
      'is wedding videography worth it',
      'how long should a wedding video be',
    ],
    localVariants: (city: string) => [
      `wedding videographer in ${city}`,
      `best wedding videographer ${city}`,
      `${city} wedding cinematography`,
      `cinematic wedding video ${city}`,
    ],
  },

  catering: {
    primary: [
      'wedding catering',
      'catering services',
      'event catering',
      'party catering',
      'caterers',
    ],
    secondary: [
      'vegetarian catering',
      'non-veg catering',
      'multi-cuisine catering',
      'outdoor catering',
      'buffet catering',
      'live food counters',
      'corporate catering',
      'birthday party catering',
      'engagement catering',
    ],
    longTail: [
      'wedding catering cost per plate India',
      'best caterers for wedding',
      'vegetarian wedding catering packages',
      'outdoor catering services near me',
      'live food counter catering',
      'South Indian catering services',
      'North Indian catering',
      'Mughlai catering',
      'Chinese food catering',
      'continental catering',
      'affordable wedding caterers',
      'premium catering services',
    ],
    questions: [
      'how much does wedding catering cost per person',
      'how to choose a wedding caterer',
      'what food to serve at Indian wedding',
      'vegetarian wedding menu ideas',
    ],
    localVariants: (city: string) => [
      `wedding caterers in ${city}`,
      `best catering services ${city}`,
      `${city} caterers`,
      `party catering ${city}`,
      `outdoor catering ${city}`,
    ],
  },

  venues: {
    primary: [
      'wedding venue',
      'banquet hall',
      'marriage hall',
      'party venue',
      'event venue',
    ],
    secondary: [
      'destination wedding venue',
      'farmhouse wedding',
      'resort wedding',
      'hotel wedding',
      'outdoor wedding venue',
      'garden wedding venue',
      'beach wedding venue',
      'palace wedding venue',
      'budget wedding venue',
      'luxury wedding venue',
    ],
    longTail: [
      'wedding venues with accommodation',
      'small wedding venues for 50 guests',
      'wedding venues for 500 guests',
      'wedding venue cost per plate',
      'wedding venue with lawn',
      'AC banquet hall for wedding',
      'poolside wedding venue',
      'rooftop wedding venue',
      'heritage wedding venue',
      'budget friendly wedding venue',
      'all inclusive wedding venue',
    ],
    questions: [
      'how to choose a wedding venue',
      'how much does a wedding venue cost in India',
      'best season for outdoor wedding',
      'questions to ask wedding venue',
    ],
    localVariants: (city: string) => [
      `wedding venues in ${city}`,
      `best banquet halls ${city}`,
      `${city} marriage halls`,
      `party venues ${city}`,
      `destination wedding ${city}`,
      `farmhouse for wedding ${city}`,
    ],
  },

  'decor-design': {
    primary: [
      'wedding decorator',
      'wedding decor',
      'event decoration',
      'wedding stage decoration',
      'mandap decoration',
    ],
    secondary: [
      'floral decoration',
      'theme wedding decor',
      'reception decoration',
      'entrance decoration',
      'table decoration',
      'ceiling decoration',
      'lighting decoration',
      'balloon decoration',
      'sangeet decoration',
      'haldi decoration',
    ],
    longTail: [
      'wedding stage decoration cost',
      'mandap decoration ideas',
      'wedding entrance decoration',
      'budget wedding decoration ideas',
      'luxury wedding decor',
      'rustic wedding decoration',
      'royal wedding theme decoration',
      'floral mandap decoration',
      'LED stage decoration',
      'outdoor wedding decoration',
      'indoor wedding decoration',
      'traditional wedding decoration',
      'modern wedding decor',
    ],
    questions: [
      'how much does wedding decoration cost',
      'wedding decoration ideas on budget',
      'latest wedding decoration trends',
      'how to decorate wedding stage',
    ],
    localVariants: (city: string) => [
      `wedding decorators in ${city}`,
      `best wedding decoration ${city}`,
      `${city} event decorators`,
      `mandap decorators ${city}`,
    ],
  },

  'makeup-hair': {
    primary: [
      'bridal makeup artist',
      'wedding makeup',
      'bridal makeup',
      'hair stylist',
      'makeup artist',
    ],
    secondary: [
      'HD bridal makeup',
      'airbrush makeup',
      'engagement makeup',
      'reception makeup',
      'party makeup',
      'mehndi function makeup',
      'sangeet makeup',
      'haldi makeup',
      'bridal hairstyle',
      'wedding hairstyle',
    ],
    longTail: [
      'bridal makeup artist cost India',
      'HD bridal makeup prices',
      'airbrush bridal makeup near me',
      'South Indian bridal makeup',
      'North Indian bridal makeup',
      'Muslim bridal makeup',
      'Christian bridal makeup',
      'Bengali bridal makeup',
      'Marathi bridal makeup',
      'Punjabi bridal makeup',
      'bridal makeup packages with trial',
      'freelance bridal makeup artist',
    ],
    questions: [
      'how much does bridal makeup cost',
      'HD vs airbrush bridal makeup',
      'how to choose bridal makeup artist',
      'bridal makeup trial tips',
    ],
    localVariants: (city: string) => [
      `bridal makeup artist in ${city}`,
      `best makeup artist ${city}`,
      `${city} bridal makeup`,
      `wedding makeup artist ${city}`,
    ],
  },

  'mehndi-artists': {
    primary: [
      'mehndi artist',
      'henna artist',
      'bridal mehndi',
      'mehndi designer',
      'mehendi artist',
    ],
    secondary: [
      'Arabic mehndi',
      'Indian mehndi',
      'Rajasthani mehndi',
      'dulhan mehndi',
      'engagement mehndi',
      'party mehndi',
      'simple mehndi',
      'designer mehndi',
      'traditional mehndi',
      'modern mehndi',
    ],
    longTail: [
      'bridal mehndi artist near me',
      'Arabic mehndi design for bride',
      'full hand bridal mehndi cost',
      'mehndi artist charges per hand',
      'rajasthani bridal mehndi',
      'mehndi artist for wedding',
      'professional mehndi artist',
      'celebrity mehndi artist',
      'mehndi artist with dark stain',
    ],
    questions: [
      'how much does bridal mehndi cost',
      'how to book mehndi artist for wedding',
      'Arabic vs Indian mehndi which is better',
      'how to get dark mehndi stain',
    ],
    localVariants: (city: string) => [
      `mehndi artist in ${city}`,
      `best mehndi artist ${city}`,
      `${city} henna artist`,
      `bridal mehndi ${city}`,
    ],
  },

  'wedding-planning': {
    primary: [
      'wedding planner',
      'event planner',
      'wedding coordinator',
      'wedding organizer',
      'event management',
    ],
    secondary: [
      'destination wedding planner',
      'luxury wedding planner',
      'budget wedding planner',
      'day of coordinator',
      'full service wedding planner',
      'partial wedding planning',
      'corporate event planner',
      'birthday party planner',
    ],
    longTail: [
      'wedding planner cost India',
      'destination wedding planner India',
      'luxury wedding planning services',
      'affordable wedding planner near me',
      'best wedding planners in India',
      'wedding planning packages',
      'wedding planner fees structure',
      'full service wedding planning cost',
      'day of wedding coordinator',
      'wedding planning checklist India',
    ],
    questions: [
      'how much does a wedding planner cost',
      'do I need a wedding planner',
      'what does a wedding planner do',
      'how to choose a wedding planner',
    ],
    localVariants: (city: string) => [
      `wedding planner in ${city}`,
      `best wedding planners ${city}`,
      `${city} event planners`,
      `destination wedding planner ${city}`,
    ],
  },

  florist: {
    primary: [
      'wedding florist',
      'flower decorator',
      'floral designer',
      'bouquet designer',
      'event florist',
    ],
    secondary: [
      'bridal bouquet',
      'wedding flowers',
      'floral arrangements',
      'stage flowers',
      'car decoration flowers',
      'mandap flowers',
      'fresh flower decoration',
      'imported flowers',
    ],
    longTail: [
      'wedding florist near me',
      'bridal bouquet cost India',
      'car decoration with flowers price',
      'wedding stage flower decoration cost',
      'fresh flower mandap decoration',
      'imported flower decoration wedding',
      'rose decoration for wedding',
      'marigold decoration wedding',
      'lily wedding decoration',
    ],
    questions: [
      'how much do wedding flowers cost',
      'best flowers for Indian wedding',
      'how to preserve bridal bouquet',
      'seasonal flowers for wedding',
    ],
    localVariants: (city: string) => [
      `wedding florist in ${city}`,
      `flower decorator ${city}`,
      `${city} bridal bouquet`,
      `floral decoration ${city}`,
    ],
  },

  entertainment: {
    primary: [
      'wedding DJ',
      'live band',
      'wedding entertainment',
      'event anchor',
      'emcee',
    ],
    secondary: [
      'sangeet choreographer',
      'wedding singer',
      'dhol player',
      'band baaja',
      'wedding games',
      'photo booth',
      'dance troupe',
      'standup comedian',
      'magician',
    ],
    longTail: [
      'wedding DJ cost India',
      'live band for wedding reception',
      'sangeet choreographer near me',
      'dhol wala for wedding',
      'wedding anchor charges',
      'photo booth rental wedding',
      'bollywood dance troupe wedding',
      'wedding games and activities',
      'baraat DJ and dhol',
    ],
    questions: [
      'how much does a wedding DJ cost',
      'live band vs DJ for wedding',
      'best entertainment ideas for wedding',
      'how to choose wedding entertainment',
    ],
    localVariants: (city: string) => [
      `wedding DJ in ${city}`,
      `live band ${city}`,
      `${city} wedding entertainment`,
      `sangeet choreographer ${city}`,
    ],
  },

  invitation: {
    primary: [
      'wedding invitation',
      'wedding card',
      'invitation designer',
      'wedding invite',
      'e-invitation',
    ],
    secondary: [
      'digital invitation',
      'printed wedding card',
      'luxury invitation',
      'video invitation',
      'WhatsApp invitation',
      'custom wedding card',
      'designer invitation',
      'box invitation',
      'scroll invitation',
    ],
    longTail: [
      'wedding invitation card design',
      'digital wedding invitation maker',
      'luxury wedding card cost',
      'wedding e-invite video',
      'custom wedding invitation design',
      'box type wedding card',
      'royal wedding invitation',
      'South Indian wedding card',
      'Muslim wedding invitation',
      'Sikh wedding card',
      'minimalist wedding invitation',
    ],
    questions: [
      'how much do wedding invitations cost',
      'digital vs printed wedding invitation',
      'when to send wedding invitations India',
      'wedding invitation wording ideas',
    ],
    localVariants: (city: string) => [
      `wedding card designers ${city}`,
      `invitation printers ${city}`,
      `${city} wedding invitations`,
    ],
  },

  jewellery: {
    primary: [
      'bridal jewellery',
      'wedding jewellery',
      'jewellery rental',
      'bridal sets',
      'artificial jewellery',
    ],
    secondary: [
      'kundan jewellery',
      'polki jewellery',
      'temple jewellery',
      'gold jewellery',
      'diamond jewellery',
      'pearl jewellery',
      'antique jewellery',
      'jadau jewellery',
      'meenakari jewellery',
    ],
    longTail: [
      'bridal jewellery sets for wedding',
      'jewellery rental for bride',
      'kundan bridal jewellery',
      'South Indian bridal jewellery',
      'Rajasthani bridal jewellery',
      'Bengali bridal jewellery',
      'affordable bridal jewellery',
      'imitation bridal jewellery',
      'wedding jewellery on rent',
    ],
    questions: [
      'how to choose bridal jewellery',
      'rent vs buy bridal jewellery',
      'best bridal jewellery brands India',
      'bridal jewellery matching tips',
    ],
    localVariants: (city: string) => [
      `bridal jewellery ${city}`,
      `jewellery rental ${city}`,
      `${city} bridal sets`,
    ],
  },
}

// Generate all keywords for a category
export function getAllCategoryKeywords(categorySlug: string, city?: string): string[] {
  const config = categoryKeywords[categorySlug]
  if (!config) return []

  const keywords = [
    ...config.primary,
    ...config.secondary,
    ...config.longTail,
  ]

  if (city) {
    keywords.push(...config.localVariants(city))
  } else {
    // Add keywords for top cities
    indianCities.slice(0, 5).forEach(topCity => {
      keywords.push(...config.localVariants(topCity).slice(0, 2))
    })
  }

  return Array.from(new Set(keywords))
}

// Get top keywords for meta tags (limited to 15)
export function getMetaKeywords(categorySlug: string, city?: string): string[] {
  const config = categoryKeywords[categorySlug]
  if (!config) return []

  const keywords = [
    ...config.primary.slice(0, 3),
    ...config.secondary.slice(0, 3),
    ...config.longTail.slice(0, 4),
  ]

  if (city) {
    keywords.push(...config.localVariants(city).slice(0, 3))
  }

  return Array.from(new Set(keywords)).slice(0, 15)
}

// FAQ questions for schema markup
export function getCategoryFAQs(categorySlug: string): Array<{ question: string; answer: string }> {
  const config = categoryKeywords[categorySlug]
  if (!config) return []

  // Generate FAQs from questions
  const faqAnswers: Record<string, Record<string, string>> = {
    photography: {
      'how much does wedding photography cost in India': 'Wedding photography costs in India range from ₹25,000 to ₹5,00,000+ depending on the photographer\'s experience, package inclusions, and event duration. Basic packages start around ₹25,000-50,000, while premium photographers charge ₹1,50,000-5,00,000 for comprehensive coverage.',
      'how to choose a wedding photographer': 'Choose a wedding photographer by reviewing their portfolio, checking reviews, meeting them in person, discussing your vision, understanding their style (candid vs traditional), and comparing packages. Ensure they have backup equipment and a clear contract.',
      'what to look for in a wedding photographer': 'Look for consistent portfolio quality, experience with similar weddings, good reviews, clear communication, professional equipment, backup plans, reasonable pricing, and a style that matches your preferences.',
      'best time for pre-wedding photoshoot': 'The best time for pre-wedding photoshoot is during golden hours - early morning (6-8 AM) or late afternoon (4-6 PM) for soft, flattering light. Avoid harsh midday sun. Schedule 2-3 months before the wedding.',
    },
    catering: {
      'how much does wedding catering cost per person': 'Wedding catering in India costs ₹500-3,000+ per person depending on menu type, number of items, service style (buffet/served), and caterer reputation. Budget options start at ₹500-800, while premium catering ranges from ₹1,500-3,000+ per plate.',
      'how to choose a wedding caterer': 'Choose a wedding caterer by attending food tastings, checking hygiene standards, reading reviews, verifying licenses, discussing menu customization, understanding their setup and service staff quality, and getting detailed cost breakdowns.',
    },
    venues: {
      'how to choose a wedding venue': 'Choose a wedding venue based on guest capacity, location accessibility, available dates, catering options (in-house vs outside), decor flexibility, accommodation availability, parking, budget, and ambiance that matches your wedding theme.',
      'how much does a wedding venue cost in India': 'Wedding venue costs in India range from ₹50,000 to ₹50,00,000+ depending on location, capacity, amenities, and prestige. Budget venues cost ₹50,000-2,00,000, mid-range ₹2,00,000-10,00,000, and luxury/destination venues ₹10,00,000-50,00,000+.',
    },
  }

  const categoryFAQs = faqAnswers[categorySlug]
  if (!categoryFAQs) return []

  return Object.entries(categoryFAQs).map(([question, answer]) => ({
    question,
    answer,
  }))
}

// Vendor-specific keyword generator
export function getVendorKeywords(
  businessName: string,
  categorySlug: string,
  city?: string,
  state?: string
): string[] {
  const config = categoryKeywords[categorySlug]
  const categoryName = config?.primary[0] || 'vendor'

  const keywords = [
    // Brand keywords
    businessName,
    `${businessName} reviews`,
    `${businessName} portfolio`,
    `${businessName} prices`,
    `${businessName} contact`,

    // Category keywords
    ...(config?.primary.slice(0, 3) || []),
    ...(config?.secondary.slice(0, 3) || []),

    // Location keywords
    ...(city ? [
      `${categoryName} in ${city}`,
      `best ${categoryName} ${city}`,
      `${businessName} ${city}`,
      `top ${categoryName} ${city}`,
    ] : []),

    ...(city && state ? [
      `${categoryName} ${city} ${state}`,
    ] : []),

    // Generic high-intent
    'wedding vendors India',
    'book online',
    'verified vendor',
    'Omnicassion',
  ]

  return Array.from(new Set(keywords.filter(Boolean))).slice(0, 20)
}

// Tool page keywords
export const toolKeywords = {
  'event-budget-calculator': [
    'event budget calculator',
    'wedding budget calculator',
    'wedding budget planner',
    'wedding cost calculator',
    'party budget tracker',
    'event expense tracker',
    'Indian wedding budget',
    'wedding budget India',
    'marriage budget calculator',
    'wedding planning budget',
    'free budget calculator',
    'online budget planner',
    'wedding cost estimator',
    'event budget template',
    'wedding expense calculator',
    'shaadi budget calculator',
    'budget wedding planning India',
  ],
  'event-checklist-tool': [
    'wedding checklist',
    'event checklist',
    'wedding planning checklist',
    'marriage checklist',
    'wedding to-do list',
    'Indian wedding checklist',
    'wedding preparation checklist',
    'bridal checklist',
    'wedding planning guide',
    'event planning checklist',
    'free wedding checklist',
    'printable wedding checklist',
    'wedding task list',
    'complete wedding checklist',
    'shaadi checklist',
  ],
  'event-timeline-generator': [
    'wedding timeline',
    'event timeline generator',
    'wedding day timeline',
    'wedding schedule planner',
    'event schedule maker',
    'wedding itinerary',
    'wedding day schedule',
    'marriage timeline',
    'wedding planning timeline',
    'event timeline template',
    'wedding countdown',
    'day of wedding timeline',
    'wedding ceremony timeline',
  ],
  'wedding-guest-list': [
    'wedding guest list',
    'guest list manager',
    'wedding guest list template',
    'guest management',
    'wedding invitee list',
    'guest list tracker',
    'wedding attendance tracker',
    'RSVP tracker',
    'marriage guest list',
    'free guest list manager',
    'wedding guest organizer',
    'party guest list',
  ],
  'rsvp-manager': [
    'RSVP manager',
    'wedding RSVP',
    'online RSVP',
    'RSVP tracker',
    'wedding response tracker',
    'guest RSVP management',
    'digital RSVP',
    'RSVP collection',
    'wedding attendance',
    'free RSVP tool',
  ],
  'digital-invite-generator': [
    'digital wedding invitation',
    'e-invitation maker',
    'online wedding card',
    'WhatsApp invitation',
    'digital invite generator',
    'video invitation maker',
    'e-invite designer',
    'free digital invitation',
    'wedding e-card',
    'electronic wedding invitation',
    'animated wedding invitation',
    'social media wedding invite',
  ],
}
