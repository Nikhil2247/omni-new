/**
 * Analytics module — central exports
 *
 * Everything Umami-related lives in this directory.
 * Import from '@/lib/analytics' to access all helpers.
 *
 * Quick-start:
 *   import { trackVendor, trackAuth, VENDOR } from '@/lib/analytics';
 *   trackVendor.view('vendor-123', 'Elegant Décor', 'Decorator');
 */

// Core Umami client + all domain helpers
export * from './umami';

// Typed event name constants  (e.g. VENDOR.VIEW, AUTH.SIGN_IN)
export * from './events';

// Funnel tracker (compatible layer on top of Umami)
export * from './funnel-tracker';
export * from './use-funnel-tracker';

