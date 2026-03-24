import 'dotenv/config'
import { BlogStatus, PrismaClient, UserStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

type RoleSeed = {
  name: string
  displayName: string
  description: string
  level: number
  parentRoleName?: string
}

type LaunchUserSeed = {
  email: string
  firstName: string
  lastName: string
  roleName: string
}

type CategorySeed = {
  name: string
  slug: string
  description: string
  icon: string
  sortOrder: number
  serviceTypes: { name: string; slug: string; description: string }[]
}

type BlogSeed = {
  title: string
  slug: string
  excerpt: string
  content: string
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  keywords: string[]
  categorySlug: string
  tags: string[]
  readingTime: number
  publishedAt: Date
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

const normalizeHashtag = (value: string) =>
  value
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 80)

async function upsertSystemConfigAndFlags() {
  const existingConfig = await prisma.systemConfig.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (existingConfig) {
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: {
        maintenanceMode: false,
        registrationEnabled: true,
        allowVendorOnboarding: true,
        supportEmail: 'support@omnicassion.com',
      },
    })
  } else {
    await prisma.systemConfig.create({
      data: {
        maintenanceMode: false,
        registrationEnabled: true,
        allowVendorOnboarding: true,
        supportEmail: 'support@omnicassion.com',
      },
    })
  }

  // Feature flags using consistent dot notation (matching feature-flags.seed.ts)
  // These are the launch-essential flags that should be enabled
  const launchFlags = [
    { key: 'vendor.onboarding', enabled: true },
    { key: 'vendor.claiming', enabled: true },
    { key: 'vendor.portfolio', enabled: true },
    { key: 'vendor.services', enabled: true },
    { key: 'vendor.calendar', enabled: true },
    { key: 'vendor.messaging', enabled: true },
    { key: 'user.events', enabled: true },
    { key: 'user.wishlists', enabled: true },
    { key: 'user.messaging', enabled: true },
    { key: 'user.reviews', enabled: true },
    { key: 'system.search', enabled: true },
    { key: 'system.notifications', enabled: true },
    { key: 'marketing.featured_vendors', enabled: true },
  ]

  for (const flag of launchFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { enabled: flag.enabled },
      create: {
        key: flag.key,
        name: flag.key.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        description: `Enable ${flag.key.replace('.', ' ')} feature`,
        category: flag.key.split('.')[0],
        enabled: flag.enabled,
        isSystem: true,
      },
    })
  }
}

async function seedIndiaChandigarhLocations() {
  const india = await prisma.country.upsert({
    where: { code: 'IND' },
    update: {
      name: 'India',
      code2: 'IN',
      dialCode: '+91',
      currency: 'INR',
      isActive: true,
    },
    create: {
      name: 'India',
      code: 'IND',
      code2: 'IN',
      dialCode: '+91',
      currency: 'INR',
      isActive: true,
    },
  })

  const chandigarhState = await prisma.state.upsert({
    where: {
      countryId_name: {
        countryId: india.id,
        name: 'Chandigarh',
      },
    },
    update: {
      code: 'CH',
      isActive: true,
    },
    create: {
      countryId: india.id,
      name: 'Chandigarh',
      code: 'CH',
      isActive: true,
    },
  })

  const punjabState = await prisma.state.upsert({
    where: {
      countryId_name: {
        countryId: india.id,
        name: 'Punjab',
      },
    },
    update: {
      code: 'PB',
      isActive: true,
    },
    create: {
      countryId: india.id,
      name: 'Punjab',
      code: 'PB',
      isActive: true,
    },
  })

  const upsertCity = async (stateId: string, name: string) => {
    const existing = await prisma.city.findFirst({
      where: { stateId, name },
    })

    if (existing) return existing

    return prisma.city.create({
      data: {
        stateId,
        name,
        isActive: true,
      },
    })
  }

  const chandigarhCity = await upsertCity(chandigarhState.id, 'Chandigarh')
  const mohaliCity = await upsertCity(punjabState.id, 'Mohali')
  const sasNagarCity = await upsertCity(punjabState.id, 'Sahibzada Ajit Singh Nagar')
  const khararCity = await upsertCity(punjabState.id, 'Kharar')

  const addAddressIfMissing = async (cityId: string, addressLine1: string, postalCode: string) => {
    const existingAddress = await prisma.address.findFirst({
      where: {
        cityId,
        addressLine1,
        postalCode,
      },
    })

    if (!existingAddress) {
      await prisma.address.create({
        data: {
          cityId,
          addressLine1,
          postalCode,
        },
      })
    }
  }

  const chandigarhSectors = [
    1, 2, 5, 7, 8, 9, 10, 11, 15, 17, 19, 20, 21, 22, 23, 24, 26, 27, 28, 30, 31, 32, 33, 34,
    35, 36, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
  ]

  const mohaliSectors = [
    47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
    69, 70, 71, 74, 75, 76, 77, 78, 79, 80, 82, 85, 88, 91, 104, 105, 108, 109, 110, 111,
    114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125,
  ]

  for (const sector of chandigarhSectors) {
    await addAddressIfMissing(
      chandigarhCity.id,
      `SCO ${sector + 10}, Sector ${sector}, Chandigarh`,
      `1600${((sector % 30) + 10).toString().padStart(2, '0')}`,
    )
  }

  for (const sector of mohaliSectors) {
    const postCodeBase = sector >= 100 ? '1403' : '1600'
    await addAddressIfMissing(
      mohaliCity.id,
      `SCO ${sector + 20}, Sector ${sector}, Mohali`,
      `${postCodeBase}${((sector % 20) + 10).toString().padStart(2, '0')}`,
    )
  }

  const additionalCityAddresses: Array<{ cityId: string; addressLine1: string; postalCode: string }> = [
    { cityId: sasNagarCity.id, addressLine1: 'Industrial Area Phase 8B, SAS Nagar', postalCode: '160071' },
    { cityId: sasNagarCity.id, addressLine1: 'Airport Road, SAS Nagar', postalCode: '140306' },
    { cityId: sasNagarCity.id, addressLine1: 'Phase 5 Market, SAS Nagar', postalCode: '160059' },
    { cityId: khararCity.id, addressLine1: 'Landran Road, Kharar', postalCode: '140301' },
    { cityId: khararCity.id, addressLine1: 'Kharar Bus Stand Market, Kharar', postalCode: '140301' },
    { cityId: khararCity.id, addressLine1: 'Sunny Enclave Main Road, Kharar', postalCode: '140301' },
  ]

  for (const entry of additionalCityAddresses) {
    await addAddressIfMissing(entry.cityId, entry.addressLine1, entry.postalCode)
  }

}

async function seedRolesAndUsers() {
  const roles: RoleSeed[] = [
    {
      name: 'ADMIN_SYSTEM',
      displayName: 'System Administrator',
      description: 'Platform super admin role',
      level: 100,
    },
    {
      name: 'ADMIN',
      displayName: 'General Administrator',
      description: 'General admin role for platform management',
      level: 90,
      parentRoleName: 'ADMIN_SYSTEM',
    },
    {
      name: 'MARKETING_SERVICES_ADMIN',
      displayName: 'Marketing Administrator',
      description: 'Marketing, growth and campaign role',
      level: 70,
    },
    {
      name: 'CONTENT_WRITER',
      displayName: 'Content Writer',
      description: 'Content publishing and editorial role',
      level: 60,
      parentRoleName: 'MARKETING_SERVICES_ADMIN',
    },
    {
      name: 'OPERATIONAL_USER',
      displayName: 'Operations User',
      description: 'Operations role user only',
      level: 45,
      parentRoleName: 'OPERATIONAL_ASSISTANT',
    },
    {
      name: 'OPERATIONAL_ADMIN',
      displayName: 'Operations Admin',
      description: 'Operations administration and approvals role',
      level: 65,
      parentRoleName: 'ADMIN',
    },
    {
      name: 'OPERATIONAL_MANAGER',
      displayName: 'Operations Manager',
      description: 'Operations team management role',
      level: 60,
      parentRoleName: 'OPERATIONAL_ADMIN',
    },
    {
      name: 'OPERATIONAL_ASSISTANT',
      displayName: 'Operations Assistant',
      description: 'Operations support assistant role',
      level: 50,
      parentRoleName: 'OPERATIONAL_MANAGER',
    },
    {
      name: 'BUSINESS_ADMIN',
      displayName: 'Business Admin',
      description: 'Vendor/business admin account',
      level: 50,
    },
    {
      name: 'USER',
      displayName: 'User',
      description: 'End user/planner account',
      level: 10,
    },
  ]

  const roleByName = new Map<string, string>()

  for (const role of roles) {
    const upserted = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        displayName: role.displayName,
        description: role.description,
        level: role.level,
        isSystem: true,
      },
      create: {
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        level: role.level,
        isSystem: true,
      },
    })

    roleByName.set(role.name, upserted.id)
  }

  for (const role of roles) {
    if (!role.parentRoleName) continue

    const roleId = roleByName.get(role.name)
    const parentRoleId = roleByName.get(role.parentRoleName)

    if (roleId && parentRoleId) {
      await prisma.role.update({
        where: { id: roleId },
        data: { parentRoleId },
      })
    }
  }

  const defaultPassword = process.env.LAUNCH_SEED_PASSWORD || 'Password123!'
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  const launchUsers: LaunchUserSeed[] = [
    {
      email: 'system.admin@omnicassion.com',
      firstName: 'System',
      lastName: 'Admin',
      roleName: 'ADMIN_SYSTEM',
    },
    {
      email: 'general.admin@omnicassion.com',
      firstName: 'General',
      lastName: 'Admin',
      roleName: 'ADMIN',
    },
    {
      email: 'marketing.admin@omnicassion.com',
      firstName: 'Marketing',
      lastName: 'Admin',
      roleName: 'MARKETING_SERVICES_ADMIN',
    },
    {
      email: 'content.writer@omnicassion.com',
      firstName: 'Content',
      lastName: 'Writer',
      roleName: 'CONTENT_WRITER',
    },
    {
      email: 'ops.user@omnicassion.com',
      firstName: 'Ops',
      lastName: 'User',
      roleName: 'OPERATIONAL_USER',
    },
    {
      email: 'ops.admin@omnicassion.com',
      firstName: 'Ops',
      lastName: 'Admin',
      roleName: 'OPERATIONAL_ADMIN',
    },
    {
      email: 'ops.manager@omnicassion.com',
      firstName: 'Ops',
      lastName: 'Manager',
      roleName: 'OPERATIONAL_MANAGER',
    },
    {
      email: 'ops.assistant@omnicassion.com',
      firstName: 'Ops',
      lastName: 'Assistant',
      roleName: 'OPERATIONAL_ASSISTANT',
    },
  ]

  for (const launchUser of launchUsers) {
    const user = await prisma.user.upsert({
      where: { email: launchUser.email },
      update: {
        firstName: launchUser.firstName,
        lastName: launchUser.lastName,
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        hasCompletedOnboarding: true,
      },
      create: {
        email: launchUser.email,
        firstName: launchUser.firstName,
        lastName: launchUser.lastName,
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        hasCompletedOnboarding: true,
      },
    })

    const roleId = roleByName.get(launchUser.roleName)
    if (!roleId) continue

    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId,
      },
    })
  }
}

async function seedVendorTaxonomy() {
  const categories: CategorySeed[] = [
    { name: 'Photo & Videography', slug: 'photography', description: 'Photo & Videography services', icon: 'camera', sortOrder: 1, serviceTypes: [] },
    { name: 'Food & Catering', slug: 'food-catering', description: 'Food & Catering services', icon: 'utensils', sortOrder: 2, serviceTypes: [] },
    { name: 'Venue', slug: 'venue', description: 'Venue services', icon: 'building', sortOrder: 3, serviceTypes: [] },
    { name: 'Entertainment', slug: 'entertainment', description: 'Entertainment services', icon: 'music', sortOrder: 4, serviceTypes: [] },
    { name: 'Decor & Design', slug: 'decor-design', description: 'Decor & Design services', icon: 'palette', sortOrder: 5, serviceTypes: [] },
    { name: 'Makeup & Hair', slug: 'makeup-hair', description: 'Makeup & Hair services', icon: 'sparkles', sortOrder: 6, serviceTypes: [] },
    { name: 'Mehndi & Artists', slug: 'mehndi-artists', description: 'Mehndi & Artists services', icon: 'brush', sortOrder: 7, serviceTypes: [] },
    { name: 'Planner', slug: 'wedding-planning', description: 'Planner services', icon: 'clipboard-list', sortOrder: 8, serviceTypes: [] },
    { name: 'Event Planner', slug: 'event-planner', description: 'Event Planner services', icon: 'calendar-check', sortOrder: 9, serviceTypes: [] },
    { name: 'Event Management Company', slug: 'event-management-company', description: 'Event Management Company services', icon: 'briefcase', sortOrder: 10, serviceTypes: [] },
    { name: 'Hospitality', slug: 'hospitality', description: 'Hospitality services', icon: 'hotel', sortOrder: 11, serviceTypes: [] },
  ]

  for (const categorySeed of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categorySeed.slug },
      update: {
        name: categorySeed.name,
        description: categorySeed.description,
        icon: categorySeed.icon,
        sortOrder: categorySeed.sortOrder,
        isActive: true,
      },
      create: {
        name: categorySeed.name,
        slug: categorySeed.slug,
        description: categorySeed.description,
        icon: categorySeed.icon,
        sortOrder: categorySeed.sortOrder,
        isActive: true,
      },
    })

    for (const serviceTypeSeed of categorySeed.serviceTypes) {
      await prisma.serviceType.upsert({
        where: {
          categoryId_slug: {
            categoryId: category.id,
            slug: serviceTypeSeed.slug,
          },
        },
        update: {
          name: serviceTypeSeed.name,
          description: serviceTypeSeed.description,
          isActive: true,
        },
        create: {
          categoryId: category.id,
          name: serviceTypeSeed.name,
          slug: serviceTypeSeed.slug,
          description: serviceTypeSeed.description,
          isActive: true,
        },
      })
    }
  }
}

async function seedComprehensiveTags() {
  const vendorTags = [
    // Event formats
    'Wedding', 'Engagement', 'Reception', 'Haldi', 'Mehndi', 'Sangeet', 'Roka', 'Cocktail',
    'Destination Wedding', 'Intimate Wedding', 'Big Fat Wedding', 'Micro Wedding',
    'Birthday', 'Anniversary', 'Baby Shower', 'Corporate Event', 'Festive Event',
    // Service quality and positioning
    'Luxury', 'Premium', 'Budget-Friendly', 'Value for Money', 'High Rated', 'Verified Vendor',
    'Trusted', 'Fast Response', 'On-Time Delivery',
    // Venue and setup style
    'Indoor', 'Outdoor', 'Rooftop', 'Banquet Hall', 'Farmhouse', 'Resort', 'Beachside', 'Garden Setup',
    'Heritage Venue', 'Poolside Setup',
    // Design and creative
    'Traditional', 'Modern', 'Minimalist', 'Royal', 'Classic', 'Bohemian', 'Rustic',
    'Contemporary', 'Theme Based', 'Floral Luxury', 'Pastel Decor', 'Bold Decor',
    // Photography / media style
    'Candid Photography', 'Traditional Photography', 'Cinematic Video', 'Documentary Style',
    'Drone Coverage', 'Reels Coverage', 'Same Day Edit',
    // Food and catering
    'Multi-Cuisine', 'North Indian', 'South Indian', 'Punjabi', 'Gujarati', 'Rajasthani',
    'Vegetarian', 'Jain Menu', 'Vegan', 'Live Counters', 'Fusion Menu', 'Dessert Studio',
    // Operations / experience
    'Full Planning', 'Partial Planning', 'Day Coordination', 'Guest Management',
    'Vendor Management', 'Custom Package', 'All Inclusive', 'Last Minute Booking',
    // Trends
    'Sustainable', 'Eco-Friendly', 'Pet Friendly', 'Family Friendly', 'Custom Theme',
    'Bridal Entry', 'Baraat Special', 'Fireworks',
  ]

  const mediaHashtags = [
    'weddinginspiration', 'indianwedding', 'weddingdecor', 'bridallook', 'groomstyle',
    'bridalentry', 'weddingreels', 'weddinghighlights', 'weddingfilm', 'candidmoments',
    'candidphotography', 'cinematicwedding', 'droneshots', 'preweddingshoot', 'savethedate',
    'engagementshoot', 'mehndivibes', 'haldiceremony', 'sangeetnight', 'receptionnight',
    'baraatmoments', 'weddinggoals', 'shaadiseason', 'bigfatindianwedding', 'destinationwedding',
    'luxurywedding', 'intimatewedding', 'microcelebration', 'weddingdetails', 'tablescapeinspo',
    'floraldecor', 'stagegoals', 'mandapdecor', 'bridalportrait', 'groupportraits',
    'coupleshoot', 'sunsetshoot', 'goldenhour', 'nightportrait', 'weddingstory',
    'behindthescenes', 'eventstyling', 'weddingideas', 'vendorfeature', 'realwedding',
    'weddingvenue', 'banquetsetup', 'gardenwedding', 'beachwedding', 'rooftopwedding',
    'weddingmenu', 'livecounter', 'desserttable', 'cocktailhour', 'weddingmusic',
    'djnight', 'liveband', 'weddingdance', 'bridalmakeup', 'hairgoals',
    'mehndiart', 'weddingplanner', 'eventplanner', 'celebrationmoments', 'familymoments',
  ]

  const blogTags = [
    'Wedding Planning', 'Planning Checklist', 'Budget Planning', 'Cost Saving', 'Timeline Guide',
    'Vendor Selection', 'Vendor Contracts', 'Negotiation Tips', 'Venue Guide', 'Venue Shortlisting',
    'Destination Weddings', 'Real Weddings', 'Vendor Spotlight', 'Bride Guide', 'Groom Guide',
    'Bridal Fashion', 'Groom Fashion', 'Jewelry Guide', 'Invitation Design', 'Wedding Website',
    'Photography Tips', 'Videography Tips', 'Decor Trends', 'Floral Design', 'Color Palettes',
    'Theme Weddings', 'Traditional Ceremonies', 'Modern Weddings', 'Intimate Weddings', 'Luxury Weddings',
    'Catering Ideas', 'Wedding Menu', 'Dessert Ideas', 'Guest Experience', 'Entertainment Ideas',
    'Sangeet Ideas', 'Mehndi Ideas', 'Haldi Ideas', 'Reception Ideas', 'Bridal Entry Ideas',
    'Sustainable Weddings', 'Eco Friendly Events', 'DIY Decor', 'DIY Wedding', 'Post Wedding Tasks',
    'Honeymoon Planning', 'Marriage Documentation', 'Health and Wellness', 'Pre Wedding Prep', 'Wedding Mistakes',
    'Seasonal Weddings', 'Monsoon Weddings', 'Winter Weddings', 'Summer Weddings', 'Engagement Ideas',
    'Anniversary Ideas', 'Family Functions', 'Corporate Event Planning', 'Social Media Strategy', 'SEO Content',
    'Content Marketing', 'Business Growth', 'Lead Generation', 'Conversion Tips', 'Client Retention',
  ]

  for (const tagName of vendorTags) {
    const slug = toSlug(tagName)

    await prisma.tag.upsert({
      where: { slug },
      update: {
        name: tagName,
      },
      create: {
        name: tagName,
        slug,
      },
    })
  }

  for (const hashtagValue of mediaHashtags) {
    const normalized = normalizeHashtag(hashtagValue)
    if (!normalized) continue

    await prisma.hashtag.upsert({
      where: { normalized },
      update: {
        tag: normalized,
      },
      create: {
        tag: normalized,
        normalized,
      },
    })
  }

  for (const blogTagName of blogTags) {
    const safeName = blogTagName.slice(0, 50)
    const slug = toSlug(safeName).slice(0, 60)

    await prisma.blogTag.upsert({
      where: { slug },
      update: {
        name: safeName,
      },
      create: {
        name: safeName,
        slug,
      },
    })
  }
}

async function seedSeoBlogs() {
  const preferredAuthorEmails = [
    'content.writer@omnicassion.com',
    'marketing.admin@omnicassion.com',
    'system.admin@omnicassion.com',
  ]

  const author = await prisma.user.findFirst({
    where: {
      email: {
        in: preferredAuthorEmails,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (!author) {
    return
  }

  const blogCategories = [
    {
      name: 'Wedding Planning Guides',
      slug: 'wedding-planning-guides',
      description: 'Actionable wedding planning guides and checklists',
      metaTitle: 'Wedding Planning Guides | Omnicassion Blog',
      metaDescription: 'Practical wedding planning checklists, timelines, and budgeting tips for modern couples.',
      color: '#F97316',
      sortOrder: 1,
    },
    {
      name: 'Vendor Selection & Management',
      slug: 'vendor-selection-management',
      description: 'Choose the right vendors and manage them smoothly',
      metaTitle: 'Vendor Selection & Management Tips | Omnicassion',
      metaDescription: 'Learn how to shortlist vendors, compare proposals, and manage contracts effectively.',
      color: '#0EA5E9',
      sortOrder: 2,
    },
    {
      name: 'Chandigarh Event Insights',
      slug: 'chandigarh-event-insights',
      description: 'Local planning insights for Chandigarh, Mohali and nearby regions',
      metaTitle: 'Chandigarh & Mohali Event Insights | Omnicassion',
      metaDescription: 'Explore local event planning tips for Chandigarh and Mohali with practical venue and vendor insights.',
      color: '#22C55E',
      sortOrder: 3,
    },
  ]

  const blogCategoryMap = new Map<string, string>()

  for (const category of blogCategories) {
    const upserted = await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        color: category.color,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        color: category.color,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    })

    blogCategoryMap.set(category.slug, upserted.id)
  }

  const blogs: BlogSeed[] = [
    {
      title: 'Complete Chandigarh Wedding Planning Checklist for 2026',
      slug: 'chandigarh-wedding-planning-checklist-2026',
      excerpt: 'A practical, month-by-month Chandigarh wedding planning checklist to help couples stay on budget and stress-free.',
      content:
        'Most wedding delays happen because planning starts with inspiration, not operations. This checklist flips that order and gives you a practical roadmap for Chandigarh and Mohali celebrations.\n\nPhase 1 (12 to 9 months): define the event vision, total budget ceiling, and a realistic guest count range. Build a funding plan with milestone-based releases instead of one large pool. Shortlist venues by accessibility, parking, weather fallback, and neighborhood restrictions.\n\nPhase 2 (8 to 6 months): lock your priority vendors first, usually venue, catering, photography, and decor. Compare each vendor using a fixed scorecard: quality proof, response time, delivery promise, and contract clarity. Keep negotiation notes documented so decisions remain transparent across families.\n\nPhase 3 (5 to 3 months): complete outfit calendars, invitation flow, accommodation planning, and travel support. Create one master document with all contacts, payment due dates, and escalation owners. This single source of truth reduces confusion between planners, families, and vendors.\n\nPhase 4 (Final 30 days): move to execution mode. Freeze non-critical decisions, close payment milestones, run venue walkthroughs, and test stage-to-dining guest flow. Prepare a contingency kit for rain, traffic delays, and power interruptions.\n\nFinal 72-hour rule: avoid introducing new vendors or major scope changes. Your goal is consistency, communication discipline, and fast decision routing. Weddings feel smooth when planning systems are simple and accountability is clear.',
      metaTitle: 'Chandigarh Wedding Planning Checklist 2026 | Omnicassion',
      metaDescription: 'Use this step-by-step Chandigarh wedding planning checklist for 2026 to stay organized, on budget, and stress-free.',
      focusKeyword: 'chandigarh wedding planning checklist',
      keywords: ['chandigarh wedding planning', 'wedding checklist 2026', 'mohali wedding planning'],
      categorySlug: 'wedding-planning-guides',
      tags: ['Wedding Planning', 'Planning Checklist', 'Chandigarh Weddings'],
      readingTime: 10,
      publishedAt: new Date('2026-01-08T10:00:00.000Z'),
    },
    {
      title: 'How to Choose the Best Event Planner in Mohali and Chandigarh',
      slug: 'best-event-planner-mohali-chandigarh-guide',
      excerpt: 'Learn a reliable framework to shortlist and hire the right event planner for weddings, family events, and corporate functions.',
      content:
        'Choosing the right event planner is less about popularity and more about fit. A planner who is perfect for a 500-guest wedding may not be ideal for a 120-guest intimate function.\n\nStart with a clarity brief: event type, guest profile, venue preference, spending ceiling, and timeline pressure. Share this same brief with every planner so proposals are comparable.\n\nUse a five-part evaluation model during interviews. 1) Process maturity: do they have documented workflows? 2) Team depth: who handles on-ground execution? 3) Vendor ecosystem: do they have category coverage and backups? 4) Risk planning: how do they handle cancellations and delays? 5) Communication quality: are updates proactive and structured?\n\nAsk for two recent references with similar event scale in Chandigarh or Mohali. Request sample run sheets, escalation maps, and payment calendars. Professional planners provide these artifacts without hesitation.\n\nBefore signing, align on decision rights. Define what the planner can approve independently versus what needs family confirmation. This one step prevents most day-of conflicts.\n\nPick the planner who gives clarity, predictability, and calm execution under pressure. That is usually a better long-term decision than choosing only by price.',
      metaTitle: 'Best Event Planner in Mohali & Chandigarh | Hiring Guide',
      metaDescription: 'Use this hiring guide to choose the best event planner in Mohali and Chandigarh with confidence and clear contracts.',
      focusKeyword: 'best event planner in mohali',
      keywords: ['event planner mohali', 'event planner chandigarh', 'wedding planner selection'],
      categorySlug: 'vendor-selection-management',
      tags: ['Vendor Selection', 'Event Planner', 'Vendor Contracts'],
      readingTime: 9,
      publishedAt: new Date('2026-01-11T10:00:00.000Z'),
    },
    {
      title: 'Event Management Company vs Freelance Planner: Which is Better?',
      slug: 'event-management-company-vs-freelance-planner',
      excerpt: 'Compare event management companies and freelance planners across pricing, execution depth, and risk handling.',
      content:
        'This is one of the most important hiring decisions in event planning. The right answer depends on execution complexity, not just budget.\n\nEvent management companies are stronger when you need multi-team coordination: production, hospitality, logistics, and vendor integration across multiple days. They usually bring process discipline, redundancy, and standardized reporting.\n\nFreelance planners are often excellent for focused curation, lighter guest volumes, and clients who already have selected key vendors. They can offer flexibility and personalized involvement at lower overhead.\n\nUse this decision matrix before you finalize: number of ceremonies, venue spread, expected guest movement, technical production complexity, and contingency tolerance. If your event scores high on three or more dimensions, a company model generally reduces risk.\n\nCompare commercial models carefully. Company proposals may look expensive initially but include hidden workload coverage that freelancers bill separately. Freelancers can be cost-efficient if your family operations team is strong.\n\nMake your final choice based on operational ownership: who will solve problems at 11 PM when plans change? The best model is the one with the clearest accountability at critical moments.',
      metaTitle: 'Event Management Company vs Freelance Planner | Omnicassion',
      metaDescription: 'Compare event management companies and freelance planners to choose the right fit for your event scale and budget.',
      focusKeyword: 'event management company vs planner',
      keywords: ['event management company', 'freelance event planner', 'event planning comparison'],
      categorySlug: 'vendor-selection-management',
      tags: ['Event Management', 'Budget Planning', 'Vendor Selection'],
      readingTime: 8,
      publishedAt: new Date('2026-01-14T10:00:00.000Z'),
    },
    {
      title: 'Hospitality Planning for Wedding Guests: A Simple Operations Playbook',
      slug: 'hospitality-planning-for-wedding-guests-playbook',
      excerpt: 'A simple hospitality operations playbook covering room blocks, transfers, welcome desks, and guest communication.',
      content:
        'Guest hospitality is the invisible layer that determines whether your event feels premium or chaotic. Planning should begin alongside venue finalization, not after invitations are sent.\n\nBuild a guest segmentation list first: elders, families with children, outstation groups, VIP guests, and special-assistance travelers. Each segment needs a different communication and support style.\n\nFor accommodation, block rooms in at least two price tiers and keep 10 percent buffer inventory for last-minute changes. Share check-in instructions, landmark directions, and support contact details at least one week in advance.\n\nCreate a transport command sheet with pickup windows, vehicle allocations, and route timing buffers. Assign separate leads for airport transfers, hotel desk escalations, and venue shuttle coordination.\n\nDesign a high-clarity welcome desk protocol: printed itinerary cards, QR schedule access, emergency contacts, and real-time update channel. A single communication channel prevents fragmented instructions.\n\nPost-event hospitality closure matters too. Confirm check-outs, lost-and-found handling, and guest feedback collection within 24 hours. Strong closure improves trust and referral potential.',
      metaTitle: 'Wedding Guest Hospitality Planning Playbook | Omnicassion',
      metaDescription: 'Plan better guest hospitality with this wedding operations playbook for hotels, transfers, and on-ground support.',
      focusKeyword: 'wedding guest hospitality planning',
      keywords: ['wedding hospitality', 'guest management', 'hotel room blocks'],
      categorySlug: 'wedding-planning-guides',
      tags: ['Guest Experience', 'Guest Management', 'Hospitality'],
      readingTime: 9,
      publishedAt: new Date('2026-01-17T10:00:00.000Z'),
    },
    {
      title: 'Top Venue Selection Mistakes in Chandigarh (and How to Avoid Them)',
      slug: 'chandigarh-venue-selection-mistakes',
      excerpt: 'Avoid the most common venue selection mistakes that increase costs and create day-of delays.',
      content:
        'Venue selection is the highest-impact decision in your wedding plan because every vendor workflow depends on it. Yet many couples decide using photos and social media highlights alone.\n\nMistake 1: ignoring operational feasibility. Always inspect load-in points, service corridors, parking turnover capacity, and backup power reliability. If the venue cannot support smooth movement, decor and catering quality will suffer regardless of vendor skill.\n\nMistake 2: overlooking season behavior. Winter fog, summer heat, and monsoon unpredictability affect guest comfort and stage design. Ask for climate fallback arrangements, covered pathways, and HVAC readiness in writing.\n\nMistake 3: missing hidden financial clauses. Review overtime rates, corkage rules, cancellation policy, cleaning charges, and external vendor penalties before any advance payment.\n\nMistake 4: poor flow design. Map entry, stage, dining, washrooms, and senior seating access during the site visit. Good guest flow reduces crowding and improves photo and video outcomes.\n\nUse a venue scorecard with weighted criteria and evaluate at least three options. A structured comparison is far more reliable than emotional shortlisting.',
      metaTitle: 'Chandigarh Venue Selection Mistakes to Avoid | Omnicassion',
      metaDescription: 'Learn the top venue selection mistakes in Chandigarh and practical ways to avoid delays, hidden costs, and stress.',
      focusKeyword: 'chandigarh venue selection tips',
      keywords: ['chandigarh wedding venue', 'venue shortlisting', 'venue planning tips'],
      categorySlug: 'chandigarh-event-insights',
      tags: ['Venue Guide', 'Venue Shortlisting', 'Chandigarh Weddings'],
      readingTime: 9,
      publishedAt: new Date('2026-01-20T10:00:00.000Z'),
    },
    {
      title: 'Vendor Contract Checklist Every Couple Should Review Before Signing',
      slug: 'vendor-contract-checklist-before-signing',
      excerpt: 'Use this vendor contract checklist to reduce disputes and protect your event timeline, quality, and budget.',
      content:
        'A vendor contract is an execution blueprint, not a legal formality. When terms are vague, even good vendors struggle to deliver exactly what you expect.\n\nStart with scope precision: quantities, deliverables, service windows, staffing count, and technical requirements. For photography, define output format and delivery schedule. For decor, define setup completion time and teardown ownership.\n\nDefine payment milestones against measurable outcomes, not calendar dates alone. Include refund rules, rescheduling terms, force-majeure handling, and delay penalties where appropriate.\n\nInclude operational clauses that clients often miss: access windows, power responsibilities, permissions, parking arrangements, and damage liability. These details prevent avoidable day-of escalations.\n\nAdd communication governance: one point of contact on each side, escalation hierarchy, and maximum response SLA for urgent updates. Clear communication clauses improve accountability under pressure.\n\nBefore signing, run a final redline review with your planner or coordinator and store the signed copy in your shared planning repository. Contract discipline is one of the strongest predictors of smooth events.',
      metaTitle: 'Vendor Contract Checklist for Weddings | Omnicassion',
      metaDescription: 'Review this practical vendor contract checklist before signing to avoid hidden risks and execution problems.',
      focusKeyword: 'vendor contract checklist wedding',
      keywords: ['vendor contract', 'wedding contract checklist', 'event vendor agreement'],
      categorySlug: 'vendor-selection-management',
      tags: ['Vendor Contracts', 'Negotiation Tips', 'Risk Management'],
      readingTime: 8,
      publishedAt: new Date('2026-01-23T10:00:00.000Z'),
    },
    {
      title: 'Budget-Smart Wedding Planning: How to Prioritize Spend Without Compromise',
      slug: 'budget-smart-wedding-planning-prioritize-spend',
      excerpt: 'A practical budgeting framework to spend smarter and still create a memorable wedding experience.',
      content:
        'Smart wedding budgeting is not about spending less on everything; it is about spending intentionally on what guests actually experience.\n\nBegin by setting non-negotiables and flexible zones. Non-negotiables often include food quality, hospitality comfort, and photo-video capture. Flexible zones may include stage scale, print collateral, or optional add-ons.\n\nUse percentage-based allocation bands to stay adaptable. Maintain a protected contingency reserve for weather risks, guest count drift, and timeline compression. Without contingency, every surprise forces poor decisions.\n\nTrack commitments in three columns: estimated, contracted, and paid. Review this ledger weekly with your planner and decision-makers. This simple ritual prevents duplicate bookings and payment shocks.\n\nNegotiate for value structure, not just discount percentage. Ask vendors for package optimization, bundled logistics, or payment sequencing that matches your cash flow.\n\nBudget confidence comes from visibility and discipline. Couples who review numbers weekly usually make better choices and enjoy the process more.',
      metaTitle: 'Budget Smart Wedding Planning Guide | Omnicassion',
      metaDescription: 'Plan a budget-smart wedding with practical allocation strategies, payment tracking, and contingency planning.',
      focusKeyword: 'budget smart wedding planning',
      keywords: ['wedding budget planning', 'cost saving wedding', 'wedding expense tracker'],
      categorySlug: 'wedding-planning-guides',
      tags: ['Budget Planning', 'Cost Saving', 'Wedding Planning'],
      readingTime: 9,
      publishedAt: new Date('2026-01-26T10:00:00.000Z'),
    },
    {
      title: 'Creating a High-Converting Vendor Profile on Omnicassion',
      slug: 'high-converting-vendor-profile-omnicassion',
      excerpt: 'Improve profile visibility and lead conversion with clear positioning, social proof, and structured packages.',
      content:
        'A high-converting vendor profile answers three buyer questions immediately: what you do, where you serve, and why clients should trust you. If any of these are unclear, inquiry drop-off rises quickly.\n\nStart with positioning clarity. Use a focused headline, category alignment, and location specificity across Chandigarh, Mohali, and nearby service zones. Avoid broad claims that dilute relevance.\n\nStructure portfolio assets by outcome, not chronology. Group work into event types and include context for each gallery: guest size, style goal, and delivery highlight. Buyers convert faster when examples map to their own needs.\n\nDefine package architecture transparently. Mention starting ranges, inclusions, optional add-ons, and expected response times. Price transparency improves lead quality and reduces negotiation friction.\n\nStrengthen trust with proof signals: review snippets, verified credentials, repeat-client indicators, and clear service policies. Specific proof outperforms generic adjectives.\n\nFinally, optimize follow-up behavior. Profiles convert best when vendors reply quickly with structured next steps, not generic one-line responses.',
      metaTitle: 'How to Build a High-Converting Vendor Profile | Omnicassion',
      metaDescription: 'Learn how to optimize your Omnicassion vendor profile for better visibility, trust, and lead conversion.',
      focusKeyword: 'high converting vendor profile',
      keywords: ['vendor profile optimization', 'lead conversion', 'event business growth'],
      categorySlug: 'vendor-selection-management',
      tags: ['Business Growth', 'Conversion Tips', 'Vendor Spotlight'],
      readingTime: 8,
      publishedAt: new Date('2026-01-29T10:00:00.000Z'),
    },
    {
      title: 'Best Areas in Chandigarh and Mohali to Host Different Event Types',
      slug: 'best-areas-chandigarh-mohali-for-events',
      excerpt: 'A locality-wise guide to choosing event areas based on scale, guest convenience, and event style.',
      content:
        'Area selection should be treated as a logistics decision, not just an aesthetic preference. The right locality improves turnout, reduces delays, and lowers hidden transport costs.\n\nFor centrally distributed guest lists, Chandigarh core sectors often provide familiarity, easier navigation, and stronger hospitality access. These zones are practical for ceremonies where punctuality matters.\n\nMohali corridors are often suitable for larger format celebrations and modern venue clusters that need wider movement and parking flexibility. When selecting these zones, validate traffic behavior during your event time window.\n\nIf your audience includes elders or families with children, prioritize short-distance travel arcs over visual novelty. Better proximity usually improves guest comfort and event energy.\n\nBuild a locality score on five dimensions: travel time, parking readiness, vendor accessibility, weather fallback options, and neighborhood restrictions. Compare options using the same scoring logic.\n\nThe best area is where guest convenience and operational reliability meet. A venue in the perfect locality can reduce planning stress more than any single decor upgrade.',
      metaTitle: 'Best Event Areas in Chandigarh & Mohali | Omnicassion',
      metaDescription: 'Discover the best areas in Chandigarh and Mohali for weddings, corporate events, and intimate celebrations.',
      focusKeyword: 'best event areas chandigarh mohali',
      keywords: ['chandigarh event venues', 'mohali venues', 'event locality guide'],
      categorySlug: 'chandigarh-event-insights',
      tags: ['Chandigarh Weddings', 'Venue Guide', 'Event Planning'],
      readingTime: 9,
      publishedAt: new Date('2026-02-01T10:00:00.000Z'),
    },
    {
      title: 'Operational Timeline for a Zero-Stress Wedding Week',
      slug: 'operational-timeline-for-zero-stress-wedding-week',
      excerpt: 'A day-by-day wedding week operational timeline to coordinate vendors, families, and guests with minimal chaos.',
      content:
        'Wedding week success is driven by operational rhythm, not last-minute heroics. A clear command model turns stress into structured execution.\n\nT-7 to T-5: finalize confirmations. Revalidate vendor rosters, payment due items, accommodation occupancy, and travel manifests. Freeze all major scope changes unless they are critical.\n\nT-4 to T-2: run technical rehearsals and movement simulation. Verify stage setup timing, power and audio checks, guest entry flow, and hospitality desk readiness. Confirm backup supplies and emergency contacts.\n\nT-1: issue the final operations brief to all stakeholders. Include ceremony-wise owners, escalation matrix, time buffers, and contingency triggers. Keep this brief short and action-focused.\n\nEvent day: split into two teams. Command team handles decisions and approvals. Ground team handles logistics, vendor coordination, and guest support. Share 2-hourly status updates in one official channel.\n\nT+1 to T+2: close operations with invoice reconciliation, media delivery timeline, vendor feedback notes, and pending issue resolution. Strong post-event closure protects relationships and simplifies documentation.',
      metaTitle: 'Wedding Week Operations Timeline | Omnicassion',
      metaDescription: 'Follow this operational wedding week timeline to coordinate vendors and guests with fewer last-minute issues.',
      focusKeyword: 'wedding week operational timeline',
      keywords: ['wedding operations', 'event execution timeline', 'wedding coordination checklist'],
      categorySlug: 'wedding-planning-guides',
      tags: ['Timeline Guide', 'Day Coordination', 'Operations'],
      readingTime: 9,
      publishedAt: new Date('2026-02-04T10:00:00.000Z'),
    },
  ]

  for (const blog of blogs) {
    const categoryId = blogCategoryMap.get(blog.categorySlug) ?? null

    const post = await prisma.blogPost.upsert({
      where: { slug: blog.slug },
      update: {
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        metaTitle: blog.metaTitle,
        metaDescription: blog.metaDescription,
        focusKeyword: blog.focusKeyword,
        keywords: blog.keywords,
        status: BlogStatus.PUBLISHED,
        publishedAt: blog.publishedAt,
        authorId: author.id,
        categoryId,
        readingTime: blog.readingTime,
      },
      create: {
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        metaTitle: blog.metaTitle,
        metaDescription: blog.metaDescription,
        focusKeyword: blog.focusKeyword,
        keywords: blog.keywords,
        status: BlogStatus.PUBLISHED,
        publishedAt: blog.publishedAt,
        authorId: author.id,
        categoryId,
        readingTime: blog.readingTime,
        featuredImageAlt: blog.title,
      },
    })

    const tagIds: string[] = []
    for (const tagName of blog.tags) {
      const safeName = tagName.slice(0, 50)
      const slug = toSlug(safeName).slice(0, 60)

      if (!slug) continue

      const tag = await prisma.blogTag.upsert({
        where: { slug },
        update: {
          name: safeName,
        },
        create: {
          name: safeName,
          slug,
        },
      })

      tagIds.push(tag.id)
    }

    await prisma.blogPostTag.deleteMany({
      where: { postId: post.id },
    })

    if (tagIds.length > 0) {
      await prisma.blogPostTag.createMany({
        data: tagIds.map((tagId) => ({
          postId: post.id,
          tagId,
        })),
        skipDuplicates: true,
      })
    }
  }
}

async function main() {
  console.log('🚀 Starting launch baseline seed...')

  await upsertSystemConfigAndFlags()
  console.log('✅ System config and feature flags ready')

  await seedIndiaChandigarhLocations()
  console.log('✅ India + Chandigarh/Mohali locations and addresses ready')

  await seedRolesAndUsers()
  console.log('✅ Launch roles and users ready')

  await seedVendorTaxonomy()
  console.log('✅ Vendor categories and service types ready')

  await seedComprehensiveTags()
  console.log('✅ Comprehensive tags ready')

  await seedSeoBlogs()
  console.log('✅ SEO blog categories, tags, and 10 launch blogs ready')

  console.log('')
  console.log('🎉 Launch baseline seed completed')
  console.log('🔑 Default password:', process.env.LAUNCH_SEED_PASSWORD || 'Password123!')
  console.log('   - system.admin@omnicassion.com')
  console.log('   - general.admin@omnicassion.com')
  console.log('   - marketing.admin@omnicassion.com')
  console.log('   - content.writer@omnicassion.com')
  console.log('   - ops.user@omnicassion.com')
  console.log('   - ops.admin@omnicassion.com')
  console.log('   - ops.manager@omnicassion.com')
  console.log('   - ops.assistant@omnicassion.com')
}

main()
  .catch((error) => {
    console.error('❌ Launch seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
