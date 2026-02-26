// ============================================================================
// SENTRY CONFIGURATION - Error Monitoring & Performance Tracking
// ============================================================================

import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initializeSentry(dsn: string, environment: string) {
  if (!dsn) {
    console.warn('Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      // Performance monitoring
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Profiling
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (environment === 'development' && !process.env.SENTRY_DEV_ENABLED) {
        return null;
      }
      return event;
    },
    // Release tracking
    release: process.env.SENTRY_RELEASE || 'unknown',
    // Ignore common non-critical errors
    ignoreErrors: [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      // Add other errors to ignore
    ],
  });

  console.log(`✓ Sentry initialized for environment: ${environment}`);
}
