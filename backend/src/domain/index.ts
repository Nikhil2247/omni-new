// ============================================================================
// DOMAIN MODULES - Main Barrel Export
// ============================================================================
// All domain modules following DDD (Domain-Driven Design) patterns
// Each module is self-contained with services, repositories, DTOs, and events
// ============================================================================

// Catalog Domain - Vendor profiles, portfolios, services
export * from './catalog';

// Leads Domain - Lead management and messaging
export * from './leads';

// Messaging Domain - Standalone conversations and messages
export * from './messaging';

// Planning Domain - Event planning, checklists, budgets, guests
export * from './planning';

// Operations Domain - Active events, KYC, billing, disputes
export * from './operations';

// Content Domain - Blog posts, content management
export * from './content';

// Insights Domain - Analytics, metrics, engagement tracking
export * from './insights';

// Subscription Domain - Plans, billing, feature gating
// Note: Subscription exports may conflict with Operations (BillingService)
// Import directly from './subscription' module when needed
// export * from './subscription'
