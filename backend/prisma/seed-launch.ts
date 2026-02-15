import 'dotenv/config'
import { PrismaClient, UserStatus } from '@prisma/client'
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

  const flags = [
    {
      key: 'CORE_LAUNCH_ENABLED',
      description: 'Enable launch baseline modules',
      enabled: true,
    },
    {
      key: 'VENDOR_ONBOARDING_ENABLED',
      description: 'Enable vendor onboarding flows',
      enabled: true,
    },
    {
      key: 'MARKETING_BLOG_ENABLED',
      description: 'Enable blog and content workflows',
      enabled: true,
    },
    {
      key: 'OPS_DASHBOARD_ENABLED',
      description: 'Enable operations dashboard',
      enabled: true,
    },
  ]

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        description: flag.description,
        enabled: flag.enabled,
      },
      create: flag,
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

  let chandigarhCity = await prisma.city.findFirst({
    where: {
      stateId: chandigarhState.id,
      name: 'Chandigarh',
    },
  })

  if (!chandigarhCity) {
    chandigarhCity = await prisma.city.create({
      data: {
        stateId: chandigarhState.id,
        name: 'Chandigarh',
        isActive: true,
      },
    })
  }

  const chandigarhAddresses = [
    { addressLine1: 'SCO 12, Sector 17C', postalCode: '160017' },
    { addressLine1: 'SCO 98, Sector 35C', postalCode: '160022' },
    { addressLine1: 'SCO 41, Sector 22D', postalCode: '160022' },
    { addressLine1: 'Booth 21, Sector 8C', postalCode: '160009' },
    { addressLine1: 'SCO 8, Sector 26', postalCode: '160019' },
    { addressLine1: 'SCO 301, Sector 40D', postalCode: '160036' },
    { addressLine1: 'SCO 55, Sector 44C', postalCode: '160047' },
    { addressLine1: 'SCO 22, Sector 15D', postalCode: '160015' },
    { addressLine1: 'SCO 77, Sector 34A', postalCode: '160022' },
    { addressLine1: 'SCO 102, Sector 9D', postalCode: '160009' },
    { addressLine1: 'SCO 19, Sector 7C', postalCode: '160019' },
    { addressLine1: 'SCO 66, Sector 18D', postalCode: '160018' },
    { addressLine1: 'SCO 5, Sector 33D', postalCode: '160020' },
    { addressLine1: 'SCO 150, Sector 37C', postalCode: '160036' },
    { addressLine1: 'SCO 23, Sector 45C', postalCode: '160047' },
  ]

  for (const entry of chandigarhAddresses) {
    const existingAddress = await prisma.address.findFirst({
      where: {
        cityId: chandigarhCity.id,
        addressLine1: entry.addressLine1,
        postalCode: entry.postalCode,
      },
    })

    if (!existingAddress) {
      await prisma.address.create({
        data: {
          cityId: chandigarhCity.id,
          addressLine1: entry.addressLine1,
          postalCode: entry.postalCode,
        },
      })
    }
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
      level: 55,
      parentRoleName: 'ADMIN',
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
    {
      name: 'Photography',
      slug: 'photography',
      description: 'Professional photography services',
      icon: 'camera',
      sortOrder: 1,
      serviceTypes: [
        { name: 'Wedding Photography', slug: 'wedding-photography', description: 'Full-day wedding photo coverage' },
        { name: 'Pre-Wedding Shoot', slug: 'pre-wedding-shoot', description: 'Pre-wedding portrait sessions' },
        { name: 'Candid Photography', slug: 'candid-photography', description: 'Natural and candid storytelling photography' },
      ],
    },
    {
      name: 'Videography',
      slug: 'videography',
      description: 'Professional cinematic video services',
      icon: 'video',
      sortOrder: 2,
      serviceTypes: [
        { name: 'Wedding Film', slug: 'wedding-film', description: 'Cinematic wedding film production' },
        { name: 'Highlight Reel', slug: 'highlight-reel', description: 'Short event highlight edits' },
        { name: 'Documentary Edit', slug: 'documentary-edit', description: 'Long-form event documentary edit' },
      ],
    },
    {
      name: 'Catering',
      slug: 'catering',
      description: 'Food and beverage services',
      icon: 'utensils',
      sortOrder: 3,
      serviceTypes: [
        { name: 'Wedding Catering', slug: 'wedding-catering', description: 'Full-course wedding catering' },
        { name: 'Buffet Catering', slug: 'buffet-catering', description: 'Multi-cuisine buffet setup' },
        { name: 'Live Counters', slug: 'live-counters', description: 'Live food stations and chef counters' },
      ],
    },
    {
      name: 'Venues',
      slug: 'venues',
      description: 'Event venues and destination spaces',
      icon: 'building',
      sortOrder: 4,
      serviceTypes: [
        { name: 'Banquet Hall', slug: 'banquet-hall', description: 'Indoor banquet hall venue' },
        { name: 'Farmhouse Venue', slug: 'farmhouse-venue', description: 'Open farmhouse celebration spaces' },
        { name: 'Resort Venue', slug: 'resort-venue', description: 'Resort and destination venue options' },
      ],
    },
    {
      name: 'Entertainment',
      slug: 'entertainment',
      description: 'Music and live entertainment',
      icon: 'music',
      sortOrder: 5,
      serviceTypes: [
        { name: 'DJ Services', slug: 'dj-services', description: 'Professional DJ and sound setup' },
        { name: 'Live Band', slug: 'live-band', description: 'Live band performances for events' },
        { name: 'Emcee Services', slug: 'emcee-services', description: 'Anchoring and event host services' },
      ],
    },
    {
      name: 'Decor & Design',
      slug: 'decor-design',
      description: 'Theme design and event decor',
      icon: 'palette',
      sortOrder: 6,
      serviceTypes: [
        { name: 'Stage Decor', slug: 'stage-decor', description: 'Stage and backdrop decor solutions' },
        { name: 'Theme Decor', slug: 'theme-decor', description: 'Concept and themed decor planning' },
        { name: 'Lighting Decor', slug: 'lighting-decor', description: 'Ambient and decorative lighting setups' },
      ],
    },
    {
      name: 'Florist',
      slug: 'florist',
      description: 'Floral arrangements and design',
      icon: 'flower',
      sortOrder: 7,
      serviceTypes: [
        { name: 'Bridal Bouquets', slug: 'bridal-bouquets', description: 'Custom bridal bouquet design' },
        { name: 'Venue Florals', slug: 'venue-florals', description: 'Event venue floral decoration' },
        { name: 'Car Decor Florals', slug: 'car-decor-florals', description: 'Vehicle floral styling' },
      ],
    },
    {
      name: 'Makeup & Hair',
      slug: 'makeup-hair',
      description: 'Bridal beauty and grooming services',
      icon: 'sparkles',
      sortOrder: 8,
      serviceTypes: [
        { name: 'Bridal Makeup', slug: 'bridal-makeup', description: 'Complete bridal makeup package' },
        { name: 'Hair Styling', slug: 'hair-styling', description: 'Event hairstyling services' },
        { name: 'Groom Styling', slug: 'groom-styling', description: 'Groom grooming and styling' },
      ],
    },
    {
      name: 'Mehndi & Artists',
      slug: 'mehndi-artists',
      description: 'Mehndi and traditional artists',
      icon: 'brush',
      sortOrder: 9,
      serviceTypes: [
        { name: 'Bridal Mehndi', slug: 'bridal-mehndi', description: 'Intricate bridal mehndi design' },
        { name: 'Guest Mehndi', slug: 'guest-mehndi', description: 'Quick mehndi for guests' },
        { name: 'Arabic Mehndi', slug: 'arabic-mehndi', description: 'Arabic style mehndi patterns' },
      ],
    },
    {
      name: 'Wedding Planning',
      slug: 'wedding-planning',
      description: 'Event planning and coordination',
      icon: 'clipboard-list',
      sortOrder: 10,
      serviceTypes: [
        { name: 'Full Planning', slug: 'full-planning', description: 'End-to-end event planning support' },
        { name: 'Day Coordination', slug: 'day-coordination', description: 'On-day coordination and execution' },
        { name: 'Vendor Management', slug: 'vendor-management', description: 'Vendor sourcing and management' },
      ],
    },
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
  const tags = [
    'Wedding',
    'Engagement',
    'Reception',
    'Haldi',
    'Mehndi',
    'Sangeet',
    'Destination',
    'Luxury',
    'Budget-Friendly',
    'Premium',
    'Outdoor',
    'Indoor',
    'Rooftop',
    'Garden',
    'Farmhouse',
    'Beach',
    'Traditional',
    'Modern',
    'Minimalist',
    'Bohemian',
    'Royal',
    'Classic',
    'Cinematic',
    'Candid',
    'Editorial',
    'Drone',
    'North Indian',
    'South Indian',
    'Punjabi',
    'Gujarati',
    'Rajasthani',
    'Multi-Cuisine',
    'Vegetarian',
    'Vegan',
    'Jain Menu',
    'Live Counter',
    'Cocktail Party',
    'Corporate Event',
    'Birthday',
    'Anniversary',
    'Intimate Event',
    'Large Gatherings',
    'Bridal Entry',
    'Baraat',
    'Fireworks',
    'Sustainable',
    'Eco-Friendly',
    'Premium Decor',
    'Floral Luxury',
    'Custom Theme',
  ]

  for (const tagName of tags) {
    const slug = tagName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

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
}

async function main() {
  console.log('🚀 Starting launch baseline seed...')

  await upsertSystemConfigAndFlags()
  console.log('✅ System config and feature flags ready')

  await seedIndiaChandigarhLocations()
  console.log('✅ India + Chandigarh locations and addresses ready')

  await seedRolesAndUsers()
  console.log('✅ Launch roles and users ready')

  await seedVendorTaxonomy()
  console.log('✅ Vendor categories and service types ready')

  await seedComprehensiveTags()
  console.log('✅ Comprehensive tags ready')

  console.log('')
  console.log('🎉 Launch baseline seed completed')
  console.log('🔑 Default password:', process.env.LAUNCH_SEED_PASSWORD || 'Password123!')
  console.log('   - system.admin@omnicassion.com')
  console.log('   - general.admin@omnicassion.com')
  console.log('   - marketing.admin@omnicassion.com')
  console.log('   - content.writer@omnicassion.com')
  console.log('   - ops.user@omnicassion.com')
}

main()
  .catch((error) => {
    console.error('❌ Launch seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
