/**
 * Umami Analytics — Comprehensive client
 *
 * Covers every capability Umami exposes:
 *  • Auto pageview (handled by the script tag)
 *  • Manual pageview override
 *  • Custom event tracking with typed payloads
 *  • Session / identity enrichment
 *  • Scroll-depth, engagement, form, error tracking helpers
 *
 * Configure via environment variables:
 *   NEXT_PUBLIC_UMAMI_SCRIPT_URL  – URL of your self-hosted script.js
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID  – Website ID from your Umami dashboard
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type UmamiPayload = Record<string, string | number | boolean | null | undefined>;

export interface UmamiPageData {
  url?: string;
  referrer?: string;
  title?: string;
  website?: string;
}

/** Full Umami v2 instance API (self-hosted) */
export interface UmamiInstance {
  /** Track a named custom event, optionally with data */
  track(eventName: string, eventData?: UmamiPayload): void;
  /** Manually track a pageview with custom page data */
  track(pageData: UmamiPageData): void;
  /** Track pageview via callback that receives auto-detected props */
  track(callback: (props: UmamiPageData) => UmamiPageData): void;
  /** Enrich the current session with persistent key/value data */
  identify(sessionData: UmamiPayload): void;
}

declare global {
  interface Window {
    umami?: UmamiInstance;
  }
}

// ─── Guards ───────────────────────────────────────────────────────────────────

const isClient = () => typeof window !== 'undefined';

export function isUmamiReady(): boolean {
  return isClient() && typeof window.umami?.track === 'function';
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Track a custom event.
 * Safe to call server-side (no-op) or before script loads.
 */
export function trackEvent(eventName: string, payload?: UmamiPayload): void {
  if (!isUmamiReady()) return;
  window.umami!.track(eventName, payload);
}

/** Backward-compatible alias */
export const trackUmamiEvent = trackEvent;

/**
 * Manually send a pageview.
 * Useful for SPA route changes or when auto-tracking is disabled.
 */
export function trackPageView(url?: string, referrer?: string, title?: string): void {
  if (!isUmamiReady()) return;
  if (url) {
    window.umami!.track({ url, referrer, title });
  } else {
    // Let Umami auto-resolve current page data
    window.umami!.track((props) => ({ ...props }));
  }
}

/**
 * Enrich the visitor's session with persistent data (user role, plan, etc.).
 * Shows up as session properties in Umami reports.
 */
export function identifyUser(sessionData: UmamiPayload): void {
  if (!isUmamiReady() || typeof window.umami!.identify !== 'function') return;
  window.umami!.identify(sessionData);
}

// ─── Funnel helpers ───────────────────────────────────────────────────────────

export function trackFunnelStep(
  funnelName: string,
  stepName: string,
  metadata?: UmamiPayload,
): void {
  trackEvent(`funnel:${funnelName}:${stepName}`, metadata);
}

// ─── Auth events ──────────────────────────────────────────────────────────────

export const trackAuth = {
  signUp: (method: string, role?: string) =>
    trackEvent('auth:sign_up', { method, role }),
  signIn: (method: string, role?: string) =>
    trackEvent('auth:sign_in', { method, role }),
  signOut: () => trackEvent('auth:sign_out'),
  emailVerified: () => trackEvent('auth:email_verified'),
  passwordReset: () => trackEvent('auth:password_reset'),
  oauthConnect: (provider: string) =>
    trackEvent('auth:oauth_connect', { provider }),
};

// ─── Onboarding events ────────────────────────────────────────────────────────

export const trackOnboarding = {
  start: (role: string) => trackEvent('onboarding:start', { role }),
  stepComplete: (step: number, stepName: string, role?: string) =>
    trackEvent('onboarding:step_complete', { step, step_name: stepName, role }),
  complete: (role: string) => trackEvent('onboarding:complete', { role }),
  skip: (step: number, stepName: string) =>
    trackEvent('onboarding:skip', { step, step_name: stepName }),
};

// ─── Vendor events ────────────────────────────────────────────────────────────

export const trackVendor = {
  view: (vendorId: string, vendorName?: string, category?: string) =>
    trackEvent('vendor:view', { vendor_id: vendorId, vendor_name: vendorName, category }),
  search: (query: string, filters?: UmamiPayload, resultCount?: number) =>
    trackEvent('vendor:search', { query, result_count: resultCount, ...filters }),
  filterApply: (filterType: string, filterValue: string) =>
    trackEvent('vendor:filter_apply', { filter_type: filterType, filter_value: filterValue }),
  contactClick: (vendorId: string, contactType: string, source?: string) =>
    trackEvent('vendor:contact_click', { vendor_id: vendorId, contact_type: contactType, source }),
  shortlist: (vendorId: string, eventId?: string) =>
    trackEvent('vendor:shortlist', { vendor_id: vendorId, event_id: eventId }),
  removeShortlist: (vendorId: string) =>
    trackEvent('vendor:remove_shortlist', { vendor_id: vendorId }),
  compare: (vendorIds: string[]) =>
    trackEvent('vendor:compare', { vendor_ids: vendorIds.join(','), count: vendorIds.length }),
  share: (vendorId: string, shareMethod: string) =>
    trackEvent('vendor:share', { vendor_id: vendorId, share_method: shareMethod }),
  reviewStart: (vendorId: string) =>
    trackEvent('vendor:review_start', { vendor_id: vendorId }),
  reviewSubmit: (vendorId: string, rating: number) =>
    trackEvent('vendor:review_submit', { vendor_id: vendorId, rating }),
  portfolioView: (vendorId: string, mediaType: string) =>
    trackEvent('vendor:portfolio_view', { vendor_id: vendorId, media_type: mediaType }),
  packageView: (vendorId: string, packageId: string) =>
    trackEvent('vendor:package_view', { vendor_id: vendorId, package_id: packageId }),
};

// ─── Quote / Inquiry events ───────────────────────────────────────────────────

export const trackQuote = {
  start: (vendorId: string, source?: string) =>
    trackEvent('quote:start', { vendor_id: vendorId, source }),
  stepComplete: (step: number, stepName: string) =>
    trackEvent('quote:step_complete', { step, step_name: stepName }),
  submit: (vendorId: string, eventType?: string) =>
    trackEvent('quote:submit', { vendor_id: vendorId, event_type: eventType }),
  complete: (vendorId: string, leadId: string) =>
    trackEvent('quote:complete', { vendor_id: vendorId, lead_id: leadId }),
  abandon: (vendorId: string, atStep: number) =>
    trackEvent('quote:abandon', { vendor_id: vendorId, at_step: atStep }),
};

export const trackInquiry = {
  send: (vendorId: string, inquiryType?: string) =>
    trackEvent('inquiry:send', { vendor_id: vendorId, inquiry_type: inquiryType }),
  view: (inquiryId: string) =>
    trackEvent('inquiry:view', { inquiry_id: inquiryId }),
  respond: (inquiryId: string) =>
    trackEvent('inquiry:respond', { inquiry_id: inquiryId }),
};

// ─── Event Planning events ────────────────────────────────────────────────────

export const trackEventPlanning = {
  createStart: () => trackEvent('event_planning:create_start'),
  typeSelected: (eventType: string) =>
    trackEvent('event_planning:type_selected', { event_type: eventType }),
  detailsComplete: (eventId: string) =>
    trackEvent('event_planning:details_complete', { event_id: eventId }),
  budgetSet: (eventId: string, budget?: number, currency?: string) =>
    trackEvent('event_planning:budget_set', { event_id: eventId, budget, currency }),
  vendorsShortlisted: (eventId: string, count: number) =>
    trackEvent('event_planning:vendors_shortlisted', { event_id: eventId, count }),
  activate: (eventId: string, eventType: string) =>
    trackEvent('event_planning:activate', { event_id: eventId, event_type: eventType }),
  update: (eventId: string, field: string) =>
    trackEvent('event_planning:update', { event_id: eventId, field }),
  delete: (eventId: string) =>
    trackEvent('event_planning:delete', { event_id: eventId }),
};

// ─── Wishlist events ──────────────────────────────────────────────────────────

export const trackWishlist = {
  create: (name: string) => trackEvent('wishlist:create', { name }),
  delete: (wishlistId: string) => trackEvent('wishlist:delete', { wishlist_id: wishlistId }),
  addItem: (wishlistId: string, vendorId: string) =>
    trackEvent('wishlist:add_item', { wishlist_id: wishlistId, vendor_id: vendorId }),
  removeItem: (wishlistId: string, vendorId: string) =>
    trackEvent('wishlist:remove_item', { wishlist_id: wishlistId, vendor_id: vendorId }),
  share: (wishlistId: string, shareMethod: string) =>
    trackEvent('wishlist:share', { wishlist_id: wishlistId, share_method: shareMethod }),
  view: (wishlistId: string) =>
    trackEvent('wishlist:view', { wishlist_id: wishlistId }),
};

// ─── Search events ────────────────────────────────────────────────────────────

export const trackSearch = {
  perform: (query: string, category?: string, resultCount?: number) =>
    trackEvent('search:perform', { query, category, result_count: resultCount }),
  resultClick: (query: string, resultId: string, position: number) =>
    trackEvent('search:result_click', { query, result_id: resultId, position }),
  filterApply: (filterType: string, filterValue: string) =>
    trackEvent('search:filter_apply', { filter_type: filterType, filter_value: filterValue }),
  noResults: (query: string) =>
    trackEvent('search:no_results', { query }),
  globalSearch: (query: string) =>
    trackEvent('search:global', { query }),
};

// ─── Message events ───────────────────────────────────────────────────────────

export const trackMessages = {
  conversationStart: (withRole: 'vendor' | 'user' | 'admin') =>
    trackEvent('message:conversation_start', { with_role: withRole }),
  send: (conversationId: string, hasAttachment?: boolean) =>
    trackEvent('message:send', { conversation_id: conversationId, has_attachment: hasAttachment }),
  view: (conversationId: string) =>
    trackEvent('message:view', { conversation_id: conversationId }),
};

// ─── Blog / Content events ────────────────────────────────────────────────────

export const trackContent = {
  articleView: (slug: string, category?: string) =>
    trackEvent('content:article_view', { slug, category }),
  articleShare: (slug: string, shareMethod: string) =>
    trackEvent('content:article_share', { slug, share_method: shareMethod }),
  articleComment: (slug: string) =>
    trackEvent('content:article_comment', { slug }),
  scrollDepth: (url: string, depth: 25 | 50 | 75 | 100) =>
    trackEvent('content:scroll_depth', { url, depth_percent: depth }),
  videoPlay: (videoId: string, videoTitle?: string) =>
    trackEvent('content:video_play', { video_id: videoId, video_title: videoTitle }),
  videoComplete: (videoId: string) =>
    trackEvent('content:video_complete', { video_id: videoId }),
  fileDownload: (fileName: string, fileType?: string) =>
    trackEvent('content:file_download', { file_name: fileName, file_type: fileType }),
};

// ─── Budget events ────────────────────────────────────────────────────────────

export const trackBudget = {
  set: (eventId: string, totalBudget: number, currency?: string) =>
    trackEvent('budget:set', { event_id: eventId, total_budget: totalBudget, currency }),
  update: (eventId: string, field: string) =>
    trackEvent('budget:update', { event_id: eventId, field }),
  itemAdd: (eventId: string, category: string, amount?: number) =>
    trackEvent('budget:item_add', { event_id: eventId, category, amount }),
  itemDelete: (eventId: string, category: string) =>
    trackEvent('budget:item_delete', { event_id: eventId, category }),
  export: (eventId: string, format: string) =>
    trackEvent('budget:export', { event_id: eventId, format }),
};

// ─── Checklist events ─────────────────────────────────────────────────────────

export const trackChecklist = {
  create: (eventId: string) =>
    trackEvent('checklist:create', { event_id: eventId }),
  itemAdd: (eventId: string, category?: string) =>
    trackEvent('checklist:item_add', { event_id: eventId, category }),
  itemComplete: (eventId: string, category?: string) =>
    trackEvent('checklist:item_complete', { event_id: eventId, category }),
  itemDelete: (eventId: string) =>
    trackEvent('checklist:item_delete', { event_id: eventId }),
  export: (eventId: string) =>
    trackEvent('checklist:export', { event_id: eventId }),
};

// ─── Guest list events ────────────────────────────────────────────────────────

export const trackGuestList = {
  addGuest: (eventId: string) =>
    trackEvent('guestlist:add_guest', { event_id: eventId }),
  import: (eventId: string, source: string, count?: number) =>
    trackEvent('guestlist:import', { event_id: eventId, source, count }),
  rsvpView: (eventId: string) =>
    trackEvent('guestlist:rsvp_view', { event_id: eventId }),
  sendInvite: (eventId: string, method: string, count?: number) =>
    trackEvent('guestlist:send_invite', { event_id: eventId, method, count }),
  export: (eventId: string, format: string) =>
    trackEvent('guestlist:export', { event_id: eventId, format }),
};

// ─── Timeline events ──────────────────────────────────────────────────────────

export const trackTimeline = {
  view: (eventId: string) =>
    trackEvent('timeline:view', { event_id: eventId }),
  eventAdd: (eventId: string, itemType: string) =>
    trackEvent('timeline:event_add', { event_id: eventId, item_type: itemType }),
  eventUpdate: (eventId: string) =>
    trackEvent('timeline:event_update', { event_id: eventId }),
  eventDelete: (eventId: string) =>
    trackEvent('timeline:event_delete', { event_id: eventId }),
  export: (eventId: string, format: string) =>
    trackEvent('timeline:export', { event_id: eventId, format }),
};

// ─── Pricing / Upgrade events ─────────────────────────────────────────────────

export const trackPricing = {
  view: (source?: string) => trackEvent('pricing:view', { source }),
  planSelect: (plan: string, billingCycle: string) =>
    trackEvent('pricing:plan_select', { plan, billing_cycle: billingCycle }),
  upgradeClick: (currentPlan: string, targetPlan: string) =>
    trackEvent('pricing:upgrade_click', { current_plan: currentPlan, target_plan: targetPlan }),
  checkoutStart: (plan: string) =>
    trackEvent('pricing:checkout_start', { plan }),
};

// ─── Form engagement events ───────────────────────────────────────────────────

export const trackForm = {
  start: (formId: string, formName?: string) =>
    trackEvent('form:start', { form_id: formId, form_name: formName }),
  fieldFocus: (formId: string, fieldName: string) =>
    trackEvent('form:field_focus', { form_id: formId, field_name: fieldName }),
  complete: (formId: string, formName?: string) =>
    trackEvent('form:complete', { form_id: formId, form_name: formName }),
  abandon: (formId: string, lastField?: string) =>
    trackEvent('form:abandon', { form_id: formId, last_field: lastField }),
  error: (formId: string, fieldName: string, errorType?: string) =>
    trackEvent('form:error', { form_id: formId, field_name: fieldName, error_type: errorType }),
  submit: (formId: string, success: boolean) =>
    trackEvent('form:submit', { form_id: formId, success }),
};

// ─── Navigation / UI events ───────────────────────────────────────────────────

export const trackUI = {
  buttonClick: (buttonId: string, label?: string, section?: string) =>
    trackEvent('ui:button_click', { button_id: buttonId, label, section }),
  externalLink: (url: string, label?: string) =>
    trackEvent('ui:external_link', { url, label }),
  modalOpen: (modalId: string) =>
    trackEvent('ui:modal_open', { modal_id: modalId }),
  modalClose: (modalId: string) =>
    trackEvent('ui:modal_close', { modal_id: modalId }),
  tabSwitch: (tabGroup: string, tabName: string) =>
    trackEvent('ui:tab_switch', { tab_group: tabGroup, tab_name: tabName }),
  accordionOpen: (itemId: string) =>
    trackEvent('ui:accordion_open', { item_id: itemId }),
  sidebarToggle: (isOpen: boolean) =>
    trackEvent('ui:sidebar_toggle', { is_open: isOpen }),
  themeChange: (theme: string) =>
    trackEvent('ui:theme_change', { theme }),
  notificationClick: (notificationId: string, type?: string) =>
    trackEvent('ui:notification_click', { notification_id: notificationId, type }),
};

// ─── Error events ─────────────────────────────────────────────────────────────

export const trackError = {
  notFound: (url: string) =>
    trackEvent('error:404', { url }),
  apiError: (endpoint: string, statusCode: number, message?: string) =>
    trackEvent('error:api', { endpoint, status_code: statusCode, message }),
  jsError: (errorMessage: string, componentStack?: string) =>
    trackEvent('error:js', { message: errorMessage, component_stack: componentStack }),
  formValidation: (formId: string, fieldCount: number) =>
    trackEvent('error:form_validation', { form_id: formId, field_count: fieldCount }),
};

// ─── Dashboard events ─────────────────────────────────────────────────────────

export const trackDashboard = {
  view: (role: 'user' | 'vendor' | 'admin' | 'ops') =>
    trackEvent('dashboard:view', { role }),
  sectionView: (section: string, role?: string) =>
    trackEvent('dashboard:section_view', { section, role }),
  exportData: (dataType: string, format: string) =>
    trackEvent('dashboard:export', { data_type: dataType, format }),
  filterApply: (section: string, filter: string) =>
    trackEvent('dashboard:filter_apply', { section, filter }),
};

// ─── Engagement / Retention helpers ──────────────────────────────────────────

/**
 * Install a scroll-depth tracker on the document.
 * Fires events at 25%, 50%, 75%, 100% thresholds.
 * Call once per page mount; pass a cleanup return to useEffect.
 */
export function installScrollDepthTracker(url?: string): () => void {
  if (!isClient()) return () => {};
  const milestones = [25, 50, 75, 100] as const;
  const fired = new Set<number>();

  const onScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const percent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    milestones.forEach((m) => {
      if (percent >= m && !fired.has(m)) {
        fired.add(m);
        trackContent.scrollDepth(url ?? window.location.pathname, m);
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}

/**
 * Track time spent on a page (session retention).
 * Call on page mount. Returns a cleanup that fires the event.
 */
export function installTimeOnPageTracker(pageName?: string): () => void {
  if (!isClient()) return () => {};
  const start = Date.now();
  return () => {
    const seconds = Math.round((Date.now() - start) / 1000);
    if (seconds > 1) {
      trackEvent('engagement:time_on_page', {
        page: pageName ?? window.location.pathname,
        seconds,
      });
    }
  };
}
