/**
 * Funnel Tracker - Umami-backed compatibility layer
 */

import { trackFunnelStep } from './umami';

export interface FunnelEvent {
  funnelName: string;
  stepIndex: number;
  stepName: string;
  userId?: string;
  sessionId?: string;
  anonymousId?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

export interface Funnel {
  name: string;
  steps: Array<{
    index: number;
    name: string;
  }>;
}

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

export class FunnelTracker {
  private userId?: string;

  constructor(options?: { userId?: string }) {
    this.userId = options?.userId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  clearUserId(): void {
    this.userId = undefined;
  }

  async track(
    funnelName: string,
    stepName: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const payload = {
      ...metadata,
      user_id: this.userId,
    };
    trackFunnelStep(funnelName, stepName, payload);
  }

  async flush(): Promise<void> {
    return;
  }

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

let globalTracker: FunnelTracker | null = null;

export function initFunnelTracker(options?: { userId?: string }): FunnelTracker {
  globalTracker = new FunnelTracker(options);
  return globalTracker;
}

export function getFunnelTracker(): FunnelTracker {
  if (!globalTracker) {
    globalTracker = new FunnelTracker();
  }
  return globalTracker;
}

export function cleanupFunnelTracker(): void {
  return;
}
