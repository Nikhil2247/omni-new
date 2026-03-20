// ============================================================================
// PRISMA SEED - Consent Definitions
// ============================================================================
// Seeds the consent definitions table with all required and optional consents
// Run: npx ts-node prisma/seed-consents.ts
// ============================================================================

import 'dotenv/config'
import { PrismaClient, ConsentType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Initialize Prisma with adapter
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

// ============================================================================
// CONSENT DEFINITIONS DATA
// ============================================================================

interface ConsentDefinitionData {
  consentType: ConsentType
  version: string
  title: string
  description: string
  content: string
  summary: string
  documentUrl?: string
  isRequired: boolean
  isActive: boolean
  appliesToUsers: boolean
  appliesToVendors: boolean
  displayOrder: number
}

const consentDefinitions: ConsentDefinitionData[] = [
  // ==================== REQUIRED CONSENTS ====================
  {
    consentType: 'TERMS_OF_SERVICE',
    version: '1.0',
    title: 'Terms of Service',
    description: 'I agree to the Terms of Service and understand my rights and responsibilities as a platform user.',
    content: `# Terms of Service

## 1. Acceptance of Terms

By accessing or using the Omnicassion platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.

## 2. Description of Service

Omnicassion is an event planning and vendor management platform that connects event planners with vendors, facilitates event coordination, and provides tools for managing event-related tasks.

## 3. User Accounts

### 3.1 Account Creation
- You must provide accurate and complete information when creating an account
- You are responsible for maintaining the confidentiality of your account credentials
- You must be at least 18 years old to use this Service

### 3.2 Account Responsibilities
- You are responsible for all activities that occur under your account
- You must notify us immediately of any unauthorized use of your account
- We reserve the right to suspend or terminate accounts that violate these Terms

## 4. User Conduct

You agree not to:
- Use the Service for any illegal purpose
- Harass, abuse, or harm other users
- Submit false or misleading information
- Attempt to interfere with the proper functioning of the Service
- Copy, modify, or distribute content without authorization

## 5. Intellectual Property

All content on the platform, including text, graphics, logos, and software, is the property of Omnicassion or its licensors and is protected by intellectual property laws.

## 6. Limitation of Liability

Omnicassion shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.

## 7. Changes to Terms

We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or platform notification.

## 8. Contact Information

For questions about these Terms, please contact us at legal@omnicassion.com

**Effective Date: January 1, 2024**`,
    summary: 'By accepting, you agree to follow our platform rules, use the service responsibly, and understand that we may update these terms with notice.',
    documentUrl: '/legal/terms-of-service',
    isRequired: true,
    isActive: true,
    appliesToUsers: true,
    appliesToVendors: true,
    displayOrder: 1,
  },
  {
    consentType: 'PRIVACY_POLICY',
    version: '1.0',
    title: 'Privacy Policy',
    description: 'I have read and understand how my personal data will be collected, used, and protected.',
    content: `# Privacy Policy

## 1. Introduction

This Privacy Policy describes how Omnicassion ("we", "us", or "our") collects, uses, and protects your personal information when you use our platform.

## 2. Information We Collect

### 2.1 Information You Provide
- **Account Information**: Name, email address, phone number, profile picture
- **Business Information**: Company name, business address, tax ID (for vendors)
- **Event Information**: Event details, guest lists, vendor preferences
- **Payment Information**: Billing address, payment method details (processed by secure third parties)

### 2.2 Information Collected Automatically
- **Usage Data**: Pages visited, features used, time spent on platform
- **Device Information**: Browser type, device type, operating system
- **Location Data**: IP address, approximate location (with consent)

## 3. How We Use Your Information

We use your information to:
- Provide and maintain our Service
- Process transactions and send related notifications
- Send promotional communications (with your consent)
- Improve and personalize your experience
- Ensure platform security and prevent fraud
- Comply with legal obligations

## 4. Information Sharing

We may share your information with:
- **Service Providers**: Companies that help us operate the platform
- **Vendors/Clients**: When you engage in transactions
- **Legal Requirements**: When required by law or to protect our rights

We never sell your personal information to third parties.

## 5. Data Security

We implement industry-standard security measures including:
- Encryption of data in transit and at rest
- Regular security audits
- Access controls and authentication
- Secure data centers

## 6. Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Export your data
- Opt-out of marketing communications
- Withdraw consent at any time

## 7. Data Retention

We retain your data for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for legal compliance.

## 8. Cookies

We use cookies and similar technologies to enhance your experience. See our Cookie Policy for details.

## 9. Children's Privacy

Our Service is not intended for users under 18 years of age.

## 10. Changes to This Policy

We will notify you of any material changes to this Privacy Policy via email or platform notification.

## 11. Contact Us

For privacy-related inquiries, contact our Data Protection Officer at privacy@omnicassion.com

**Effective Date: January 1, 2024**`,
    summary: 'We collect your account info, usage data, and transaction details to provide our services. We protect your data with encryption and never sell it. You can access, correct, or delete your data at any time.',
    documentUrl: '/legal/privacy-policy',
    isRequired: true,
    isActive: true,
    appliesToUsers: true,
    appliesToVendors: true,
    displayOrder: 2,
  },
  {
    consentType: 'DATA_PROCESSING',
    version: '1.0',
    title: 'Data Processing Agreement',
    description: 'I consent to the processing of my personal data as described in the Data Processing Agreement.',
    content: `# Data Processing Agreement

## 1. Purpose

This Data Processing Agreement ("DPA") governs the processing of personal data by Omnicassion on your behalf in connection with your use of our platform.

## 2. Definitions

- **Personal Data**: Any information relating to an identified or identifiable natural person
- **Processing**: Any operation performed on personal data, including collection, storage, and transmission
- **Data Subject**: The individual whose personal data is being processed

## 3. Data Processing Details

### 3.1 Categories of Data
- Contact information (name, email, phone)
- Event-related data
- Communication records
- Payment information

### 3.2 Purpose of Processing
- Service delivery
- Communication facilitation
- Analytics and improvement
- Legal compliance

## 4. Security Measures

We implement appropriate technical and organizational measures to protect personal data, including:
- Access controls
- Encryption
- Regular backups
- Incident response procedures

## 5. Sub-processors

We may engage third-party sub-processors to assist in providing our services. A list of current sub-processors is available upon request.

## 6. Data Subject Rights

We will assist you in responding to data subject requests including:
- Access requests
- Rectification requests
- Erasure requests
- Data portability requests

## 7. Data Breach Notification

We will notify you of any personal data breach within 72 hours of becoming aware of it.

## 8. International Transfers

If we transfer data outside your jurisdiction, we will ensure appropriate safeguards are in place.

**Effective Date: January 1, 2024**`,
    summary: 'This agreement explains how we process your data on your behalf, the security measures we use, and how we handle data breaches and international transfers.',
    documentUrl: '/legal/data-processing-agreement',
    isRequired: true,
    isActive: true,
    appliesToUsers: true,
    appliesToVendors: true,
    displayOrder: 3,
  },

  // ==================== VENDOR-SPECIFIC REQUIRED CONSENTS ====================
  {
    consentType: 'PLATFORM_COMMISSION',
    version: '1.0',
    title: 'Platform Commission Agreement',
    description: 'I agree to the platform commission structure and understand that fees will be deducted from my earnings.',
    content: `# Platform Commission Agreement

## 1. Commission Structure

By using Omnicassion as a vendor, you agree to the following commission structure:

### 1.1 Standard Commission
- **Service Fee**: 10% of each completed transaction
- **Payment Processing Fee**: 2.9% + $0.30 per transaction

### 1.2 Commission Calculation
Commission is calculated on the final transaction amount after any discounts or promotions.

## 2. Payment Terms

### 2.1 Payout Schedule
- Payouts are processed weekly
- Minimum payout threshold: $50
- Processing time: 3-5 business days

### 2.2 Payment Methods
- Bank transfer (ACH/Wire)
- PayPal (where available)

## 3. Refunds and Cancellations

### 3.1 Client Cancellations
- Full refund: More than 30 days before event
- 50% refund: 15-30 days before event
- No refund: Less than 15 days before event

### 3.2 Commission on Refunds
Commission is refunded proportionally with the client refund.

## 4. Disputes

### 4.1 Dispute Resolution
Disputes are handled through our mediation process. Commission is held in escrow until resolution.

### 4.2 Chargebacks
Vendors are responsible for legitimate chargebacks. Fraudulent chargebacks are contested on your behalf.

## 5. Changes to Commission

We reserve the right to modify the commission structure with 30 days advance notice.

**Effective Date: January 1, 2024**`,
    summary: 'You agree to a 10% service fee plus payment processing fees on transactions. Payouts are weekly with a $50 minimum. Refund commissions are handled proportionally.',
    documentUrl: '/legal/commission-agreement',
    isRequired: true,
    isActive: true,
    appliesToUsers: false,
    appliesToVendors: true,
    displayOrder: 4,
  },

  // ==================== OPTIONAL CONSENTS ====================
  {
    consentType: 'MARKETING_EMAIL',
    version: '1.0',
    title: 'Email Marketing',
    description: 'I would like to receive promotional emails about new features, special offers, and platform updates.',
    content: `# Email Marketing Consent

## What You'll Receive

By opting in, you'll receive:
- New feature announcements
- Special offers and promotions
- Tips and best practices for event planning
- Vendor highlights and success stories
- Platform updates and improvements

## Frequency

We typically send 2-4 marketing emails per month. We respect your inbox.

## Unsubscribe

You can unsubscribe at any time by:
- Clicking the unsubscribe link in any email
- Updating your preferences in account settings
- Contacting support@omnicassion.com

## Data Usage

Your email address will only be used for communications from Omnicassion. We never sell or share your email with third parties for marketing purposes.`,
    summary: 'Receive 2-4 emails monthly about features, offers, and tips. Unsubscribe anytime.',
    documentUrl: undefined,
    isRequired: false,
    isActive: true,
    appliesToUsers: true,
    appliesToVendors: true,
    displayOrder: 10,
  },
  {
    consentType: 'MARKETING_SMS',
    version: '1.0',
    title: 'SMS Notifications',
    description: 'I would like to receive promotional text messages about special offers and important updates.',
    content: `# SMS Marketing Consent

## What You'll Receive

By opting in, you'll receive text messages about:
- Limited-time offers and flash sales
- Important service updates
- Event reminders (if applicable)
- Exclusive vendor deals

## Frequency

We send a maximum of 4 SMS messages per month for marketing purposes.

## Standard Rates Apply

Message and data rates may apply depending on your carrier and plan.

## Opt-Out

Reply STOP to any message to unsubscribe. Reply HELP for assistance.

## Privacy

Your phone number will only be used for Omnicassion communications. We never share your number with third parties.`,
    summary: 'Get up to 4 texts/month about offers and updates. Standard rates apply. Reply STOP to opt out.',
    documentUrl: undefined,
    isRequired: false,
    isActive: true,
    appliesToUsers: true,
    appliesToVendors: true,
    displayOrder: 11,
  },
  {
    consentType: 'MARKETING_PUSH',
    version: '1.0',
    title: 'Push Notifications',
    description: 'I would like to receive push notifications about updates, messages, and promotional offers.',
    content: `# Push Notification Consent

## What You'll Receive

By enabling push notifications, you'll get alerts for:
- New messages and inquiries
- Booking confirmations and updates
- Payment notifications
- Promotional offers and announcements
- System alerts and reminders

## Customization

You can customize notification types in your account settings:
- Transactional notifications (messages, bookings)
- Promotional notifications (offers, features)
- Reminder notifications (events, tasks)

## Managing Notifications

You can disable push notifications at any time through:
- Your account settings
- Your device settings
- Your browser settings`,
    summary: 'Get instant alerts for messages, bookings, and offers. Customize or disable in settings.',
    documentUrl: undefined,
    isRequired: false,
    isActive: true,
    appliesToUsers: true,
    appliesToVendors: true,
    displayOrder: 12,
  },

  // ==================== COOKIE CONSENTS ====================
  {
    consentType: 'COOKIE_ESSENTIAL',
    version: '1.0',
    title: 'Essential Cookies',
    description: 'Essential cookies are required for the platform to function properly.',
    content: `# Essential Cookies

## Purpose

Essential cookies are necessary for the basic functionality of our platform. They enable:
- User authentication and session management
- Security features and fraud prevention
- Load balancing and performance optimization
- Remembering your preferences (language, region)

## Cookies We Use

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| session_id | User authentication | Session |
| csrf_token | Security protection | Session |
| preferences | User preferences | 1 year |

## Cannot Be Disabled

These cookies are strictly necessary and cannot be disabled while using our platform.`,
    summary: 'Required for login, security, and basic platform features. Cannot be disabled.',
    documentUrl: '/legal/cookie-policy#essential',
    isRequired: true,
    isActive: true,
    appliesToUsers: true,
    appliesToVendors: true,
    displayOrder: 20,
  },
  {
    consentType: 'COOKIE_ANALYTICS',
    version: '1.0',
    title: 'Analytics Cookies',
    description: 'Help us understand how you use our platform to improve your experience.',
    content: `# Analytics Cookies

## Purpose

Analytics cookies help us understand how visitors interact with our platform. This information is used to:
- Improve platform performance
- Identify popular features
- Fix usability issues
- Measure marketing effectiveness

## Data Collected

- Pages visited and time spent
- Click patterns and navigation paths
- Device and browser information
- Approximate location (country/city level)

## Third-Party Services

We use the following analytics services:
- Google Analytics (anonymized IP)
- Mixpanel (for product analytics)
- Hotjar (for heatmaps and recordings)

## Data Retention

Analytics data is retained for 26 months and then automatically deleted.

## Opting Out

You can opt out at any time through your privacy settings or by using browser privacy tools.`,
    summary: 'Helps us improve the platform by understanding how it\'s used. Data is anonymized.',
    documentUrl: '/legal/cookie-policy#analytics',
    isRequired: false,
    isActive: true,
    appliesToUsers: true,
    appliesToVendors: true,
    displayOrder: 21,
  },
  {
    consentType: 'COOKIE_MARKETING',
    version: '1.0',
    title: 'Marketing Cookies',
    description: 'Allow us to show you relevant advertisements and measure their effectiveness.',
    content: `# Marketing Cookies

## Purpose

Marketing cookies are used to:
- Show you relevant advertisements
- Limit how often you see an ad
- Measure the effectiveness of advertising campaigns
- Build user profiles for targeted marketing

## Third-Party Services

We partner with the following advertising platforms:
- Google Ads
- Facebook/Meta Pixel
- LinkedIn Insight Tag

## Cross-Site Tracking

These cookies may track your activity across different websites to build a profile of your interests.

## Your Choices

You can:
- Opt out through our privacy settings
- Use browser "Do Not Track" settings
- Adjust ad preferences through platform-specific tools (Google, Facebook, etc.)
- Use browser extensions that block tracking

## Impact of Opting Out

You'll still see ads, but they won't be personalized to your interests.`,
    summary: 'Used for personalized advertising. You can opt out while still seeing non-personalized ads.',
    documentUrl: '/legal/cookie-policy#marketing',
    isRequired: false,
    isActive: true,
    appliesToUsers: true,
    appliesToVendors: true,
    displayOrder: 22,
  },
]

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedConsentDefinitions() {
  console.log('🌱 Seeding consent definitions...')

  for (const definition of consentDefinitions) {
    const existing = await prisma.consentDefinition.findUnique({
      where: {
        consentType_version: {
          type: definition.consentType as any,
          version: definition.version,
        },
      },
    })

    if (existing) {
      // Update existing
      await prisma.consentDefinition.update({
        where: { id: existing.id },
        data: {
          title: definition.title,
          description: definition.description,
          content: definition.content,
          summary: definition.summary,
          documentUrl: definition.documentUrl,
          isRequired: definition.isRequired,
          isActive: definition.isActive,
          appliesToUsers: definition.appliesToUsers,
          appliesToVendors: definition.appliesToVendors,
          displayOrder: definition.displayOrder,
        },
      })
      console.log(`  ✅ Updated: ${definition.title} v${definition.version}`)
    } else {
      // Create new - map consentType to type
      await prisma.consentDefinition.create({
        data: {
          type: definition.consentType as any,
          version: definition.version,
          title: definition.title,
          description: definition.description,
          content: definition.content,
          summary: definition.summary,
          documentUrl: definition.documentUrl,
          isRequired: definition.isRequired,
          isActive: definition.isActive,
          appliesToUsers: definition.appliesToUsers,
          appliesToVendors: definition.appliesToVendors,
          displayOrder: definition.displayOrder,
        },
      })
      console.log(`  ✅ Created: ${definition.title} v${definition.version}`)
    }
  }

  console.log(`\n✨ Seeded ${consentDefinitions.length} consent definitions`)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    await seedConsentDefinitions()
  } catch (error) {
    console.error('❌ Error seeding consent definitions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
