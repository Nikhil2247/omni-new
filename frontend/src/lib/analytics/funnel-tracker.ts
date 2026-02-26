/**
 * Funnel Tracker - Client-side conversion funnel tracking
 *
 * Automatically tracks user progression through predefined conversion funnels
 * Manages session IDs, anonymous tracking, and integrates with backend analytics
 */

import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '../api/client';

/**
 * Funnel event data
 */
export interface FunnelEvent {
  funnelName: string;
  stepIndex: number;
  stepName: string;
  userId?: string;
  sessionId: string;
  anonymousId?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

/**
 * Funnel definition
 */
export interface Funnel {
  name: string;
  steps: Array<{
    index: number;
    name: string;
  }>;
}

/**
 * Predefined funnels matching backend configuration
 */
export const FUNNELS = {
  VENDOR_DISCOVERY: {
    name: 'vendor_discovery',
    steps: [
      { index: 0, name: 'landing' },
      { index: 1, name: 'search' },
      { index: 2, name: 'view_profile' },
      { index: 3, name: 'contact_click' },
      { index: 4, name: 'lead_sent' },
    ],
  },
  USER_SIGNUP: {
    name: 'user_signup',
    steps: [
      { index: 0, name: 'signup_start' },
      { index: 1, name: 'email_entered' },
      { index: 2, name: 'password_created' },
      { index: 3, name: 'account_created' },
      { index: 4, name: 'email_verified' },
      { index: 5, name: 'onboarding_complete' },
    ],
  },
  VENDOR_ONBOARDING: {
    name: 'vendor_onboarding',
    steps: [
      { index: 0, name: 'create_profile_start' },
      { index: 1, name: 'basic_info_complete' },
      { index: 2, name: 'services_added' },
      { index: 3, name: 'portfolio_uploaded' },
      { index: 4, name: 'profile_submitted' },
      { index: 5, name: 'profile_approved' },
    ],
  },
  EVENT_PLANNING: {
    name: 'event_planning',
    steps: [
      { index: 0, name: 'create_event_start' },
      { index: 1, name: 'event_type_selected' },
      { index: 2, name: 'event_details_complete' },
      { index: 3, name: 'budget_set' },
      { index: 4, name: 'vendors_shortlisted' },
      { index: 5, name: 'event_activated' },
    ],
  },
} as const;

/**
 * Session management for funnel tracking
 */
class SessionManager {
  private static SESSION_KEY = 'omni_session_id';
  private static ANONYMOUS_KEY = 'omni_anonymous_id';
  private static SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Get or create session ID
   */
  static getSessionId(): string {
    if (typeof window === 'undefined') return uuidv4();

    const stored = sessionStorage.getItem(this.SESSION_KEY);
    if (stored) {
      return stored;
    }

    const newSessionId = uuidv4();
    sessionStorage.setItem(this.SESSION_KEY, newSessionId);
    return newSessionId;
  }

  /**
   * Get or create anonymous ID (persists across sessions)
   */
  static getAnonymousId(): string {
    if (typeof window === 'undefined') return uuidv4();

    const stored = localStorage.getItem(this.ANONYMOUS_KEY);
    if (stored) {
      return stored;
    }

    const newAnonymousId = uuidv4();
    localStorage.setItem(this.ANONYMOUS_KEY, newAnonymousId);
    return newAnonymousId;
  }

  /**
   * Clear session (for logout)
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Clear all tracking data
   */
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.ANONYMOUS_KEY);
  }
}

/**
 * Funnel Tracker class
 */
export class FunnelTracker {
  private apiEndpoint: string;
  private userId?: string;
  private batchQueue: FunnelEvent[] = [];
  private batchSize = 10;
  private batchTimeout = 5000; // 5 seconds
  private batchTimer?: NodeJS.Timeout;

  constructor(options?: {
    apiEndpoint?: string;
    userId?: string;
    batchSize?: number;
    batchTimeout?: number;
  }) {
    this.apiEndpoint = options?.apiEndpoint || '/api/admin/insights/funnels/track';
    this.userId = options?.userId;
    this.batchSize = options?.batchSize || 10;
    this.batchTimeout = options?.batchTimeout || 5000;
  }

  /**
   * Set authenticated user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Clear user ID (for logout)
   */
  clearUserId(): void {
    this.userId = undefined;
    SessionManager.clearSession();
  }

  /**
   * Track a funnel step
   */
  async track(
    funnelName: string,
    stepName: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Find step index from predefined funnels
    const funnel = Object.values(FUNNELS).find((f) => f.name === funnelName);
    if (!funnel) {
      console.warn(`Unknown funnel: ${funnelName}`);
      return;
    }

    const step = funnel.steps.find((s) => s.name === stepName);
    if (!step) {
      console.warn(`Unknown step "${stepName}" in funnel "${funnelName}"`);
      return;
    }

    const event: FunnelEvent = {
      funnelName,
      stepIndex: step.index,
      stepName,
      userId: this.userId,
      sessionId: SessionManager.getSessionId(),
      anonymousId: SessionManager.getAnonymousId(),
      metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    };

    // Add to batch queue
    this.batchQueue.push(event);

    // Send immediately if batch is full, otherwise schedule batch send
    if (this.batchQueue.length >= this.batchSize) {
      await this.flush();
    } else {
      this.scheduleBatchSend();
    }
  }

  /**
   * Schedule batch send
   */
  private scheduleBatchSend(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.flush();
    }, this.batchTimeout);
  }

  /**
   * Flush batch queue immediately
   */
  async flush(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const eventsToSend = [...this.batchQueue];
    this.batchQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Send events to backend
    try {
      const promises = eventsToSend.map((event) =>
        apiClient.post(this.apiEndpoint, event),
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Failed to send funnel events:', error);
      // Silently fail - tracking failures shouldn't break user experience
    }
  }

  /**
   * Track vendor discovery funnel
   */
  vendorDiscovery = {
    landing: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_DISCOVERY.name, 'landing', metadata),
    search: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_DISCOVERY.name, 'search', metadata),
    viewProfile: (vendorId: string, metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_DISCOVERY.name, 'view_profile', {
        vendor_id: vendorId,
        ...metadata,
      }),
    contactClick: (vendorId: string, metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_DISCOVERY.name, 'contact_click', {
        vendor_id: vendorId,
        ...metadata,
      }),
    leadSent: (vendorId: string, leadId: string, metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_DISCOVERY.name, 'lead_sent', {
        vendor_id: vendorId,
        lead_id: leadId,
        ...metadata,
      }),
  };

  /**
   * Track user signup funnel
   */
  userSignup = {
    start: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.USER_SIGNUP.name, 'signup_start', metadata),
    emailEntered: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.USER_SIGNUP.name, 'email_entered', metadata),
    passwordCreated: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.USER_SIGNUP.name, 'password_created', metadata),
    accountCreated: (userId: string, metadata?: Record<string, any>) => {
      this.setUserId(userId);
      return this.track(FUNNELS.USER_SIGNUP.name, 'account_created', metadata);
    },
    emailVerified: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.USER_SIGNUP.name, 'email_verified', metadata),
    onboardingComplete: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.USER_SIGNUP.name, 'onboarding_complete', metadata),
  };

  /**
   * Track vendor onboarding funnel
   */
  vendorOnboarding = {
    start: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_ONBOARDING.name, 'create_profile_start', metadata),
    basicInfoComplete: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_ONBOARDING.name, 'basic_info_complete', metadata),
    servicesAdded: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_ONBOARDING.name, 'services_added', metadata),
    portfolioUploaded: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_ONBOARDING.name, 'portfolio_uploaded', metadata),
    profileSubmitted: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_ONBOARDING.name, 'profile_submitted', metadata),
    profileApproved: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.VENDOR_ONBOARDING.name, 'profile_approved', metadata),
  };

  /**
   * Track event planning funnel
   */
  eventPlanning = {
    start: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.EVENT_PLANNING.name, 'create_event_start', metadata),
    typeSelected: (eventType: string, metadata?: Record<string, any>) =>
      this.track(FUNNELS.EVENT_PLANNING.name, 'event_type_selected', {
        event_type: eventType,
        ...metadata,
      }),
    detailsComplete: (metadata?: Record<string, any>) =>
      this.track(FUNNELS.EVENT_PLANNING.name, 'event_details_complete', metadata),
    budgetSet: (budget: number, metadata?: Record<string, any>) =>
      this.track(FUNNELS.EVENT_PLANNING.name, 'budget_set', {
        budget,
        ...metadata,
      }),
    vendorsShortlisted: (vendorCount: number, metadata?: Record<string, any>) =>
      this.track(FUNNELS.EVENT_PLANNING.name, 'vendors_shortlisted', {
        vendor_count: vendorCount,
        ...metadata,
      }),
    eventActivated: (eventId: string, metadata?: Record<string, any>) =>
      this.track(FUNNELS.EVENT_PLANNING.name, 'event_activated', {
        event_id: eventId,
        ...metadata,
      }),
  };
}

/**
 * Global funnel tracker instance
 */
let globalTracker: FunnelTracker | null = null;

/**
 * Initialize global funnel tracker
 */
export function initFunnelTracker(options?: {
  apiEndpoint?: string;
  userId?: string;
  batchSize?: number;
  batchTimeout?: number;
}): FunnelTracker {
  globalTracker = new FunnelTracker(options);
  return globalTracker;
}

/**
 * Get global funnel tracker
 */
export function getFunnelTracker(): FunnelTracker {
  if (!globalTracker) {
    globalTracker = new FunnelTracker();
  }
  return globalTracker;
}

/**
 * Cleanup function to flush pending events (call on page unload)
 */
export function cleanupFunnelTracker(): void {
  if (globalTracker) {
    globalTracker.flush();
  }
}

// Flush events before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanupFunnelTracker();
  });
}
