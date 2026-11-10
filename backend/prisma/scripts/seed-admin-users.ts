// ============================================================================
// PRISMA SCRIPT - Seed Admin Users Only
// ============================================================================
// Creates/upserts admin users for each role without deleting existing data
// Run: npx ts-node prisma/scripts/seed-admin-users.ts
// ============================================================================

import 'dotenv/config'
import { PrismaClient, UserStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'

// Initialize Prisma with adapter
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

// Default password for all admin users (change in production!)
const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'Password123!'

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

const roles = [
  { name: 'ADMIN_SYSTEM', displayName: 'System Administrator', description: 'Full system access', level: 100 },
  { name: 'ADMIN', displayName: 'Administrator', description: 'Full access except system administration', level: 90 },
  { name: 'OPERATIONAL_ADMIN', displayName: 'Operations Admin', description: 'Operations team administrator', level: 80 },
  { name: 'OPERATIONAL_MANAGER', displayName: 'Operations Manager', description: 'Manages assigned events and tasks', level: 70, parentRole: 'OPERATIONAL_ADMIN' },
  { name: 'OPERATIONAL_ASSISTANT', displayName: 'Operations Assistant', description: 'Assists with event coordination', level: 60, parentRole: 'OPERATIONAL_MANAGER' },
  { name: 'MARKETING_SERVICES_ADMIN', displayName: 'Marketing Admin', description: 'Marketing services administrator', level: 70 },
  { name: 'CONTENT_WRITER', displayName: 'Content Writer', description: 'Creates and edits draft marketing content', level: 60, parentRole: 'MARKETING_SERVICES_ADMIN' },
]

// ============================================================================
// USER DEFINITIONS
// ============================================================================

const adminUsers = [
  // System Admin
  {
    email: 'admin@omnicassion.com',
    firstName: 'System',
    lastName: 'Admin',
    role: 'ADMIN_SYSTEM',
  },
  // General Admin
  {
    email: 'alex.admin@omnicassion.com',
    firstName: 'Alex',
    lastName: 'Thompson',
    role: 'ADMIN',
  },
  // Operations Team
  {
    email: 'ops.admin@omnicassion.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'OPERATIONAL_ADMIN',
  },
  {
    email: 'ops.manager@omnicassion.com',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'OPERATIONAL_MANAGER',
  },
  {
    email: 'ops.assistant@omnicassion.com',
    firstName: 'Emily',
    lastName: 'Davis',
    role: 'OPERATIONAL_ASSISTANT',
  },
  // Marketing Team
  {
    email: 'marketing@omnicassion.com',
    firstName: 'Jessica',
    lastName: 'Williams',
    role: 'MARKETING_SERVICES_ADMIN',
  },
  {
    email: 'writer@omnicassion.com',
    firstName: 'Taylor',
    lastName: 'Writer',
    role: 'CONTENT_WRITER',
  },
]

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function seedAdminUsers() {
  console.log('Starting: Seed admin users...\n')

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  // Step 1: Upsert all roles
  console.log('Creating/updating roles...')
  const roleMap: Record<string, string> = {}

  for (const role of roles) {
    const parentRoleId = role.parentRole ? roleMap[role.parentRole] : null

    const upsertedRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        displayName: role.displayName,
        description: role.description,
        isSystem: true,
        level: role.level,
        ...(parentRoleId && { parentRoleId }),
      },
      create: {
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSystem: true,
        level: role.level,
        ...(parentRoleId && { parentRoleId }),
      },
    })

    roleMap[role.name] = upsertedRole.id
    console.log(`  - ${role.displayName} (${role.name})`)
  }

  console.log(`\nRoles ready: ${Object.keys(roleMap).length}\n`)

  // Step 2: Upsert all users
  console.log('Creating/updating admin users...')

  for (const user of adminUsers) {
    const roleId = roleMap[user.role]

    if (!roleId) {
      console.error(`  ERROR: Role not found for ${user.email}: ${user.role}`)
      continue
    }

    // Upsert user
    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        hasCompletedOnboarding: true,
      },
      create: {
        email: user.email,
        passwordHash: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        hasCompletedOnboarding: true,
      },
    })

    // Upsert role assignment
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId: {
          userId: upsertedUser.id,
          roleId: roleId,
        },
      },
      update: {},
      create: {
        userId: upsertedUser.id,
        roleId: roleId,
      },
    })

    console.log(`  - ${user.firstName} ${user.lastName} <${user.email}> [${user.role}]`)
  }

  console.log('\n========================================')
  console.log('Admin users seeding completed!')
  console.log('========================================')
  console.log(`\nDefault password: ${DEFAULT_PASSWORD}`)
  console.log('(Set ADMIN_DEFAULT_PASSWORD env var to change)\n')

  // Summary table
  console.log('Users created/updated:')
  console.log('----------------------------------------')
  console.log('| Role                    | Email                        |')
  console.log('|-------------------------|------------------------------|')
  for (const user of adminUsers) {
    const rolePadded = user.role.padEnd(23)
    const emailPadded = user.email.padEnd(28)
    console.log(`| ${rolePadded} | ${emailPadded} |`)
  }
  console.log('----------------------------------------')
}

// ============================================================================
// EXECUTE
// ============================================================================

seedAdminUsers()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\nPrisma disconnected.')
  })
