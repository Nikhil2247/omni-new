/**
 * Umami Event Name Constants
 *
 * Canonical list of every event tracked on Omnicassion.
 * Use these constants instead of raw strings to prevent typos
 * and make refactoring safe.
 *
 * Each constant follows the pattern:  CATEGORY__ACTION
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const AUTH = {
  SIGN_UP:        'auth:sign_up',
  SIGN_IN:        'auth:sign_in',
  SIGN_OUT:       'auth:sign_out',
  EMAIL_VERIFIED: 'auth:email_verified',
  PASSWORD_RESET: 'auth:password_reset',
  OAUTH_CONNECT:  'auth:oauth_connect',
} as const;

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const ONBOARDING = {
  START:         'onboarding:start',
  STEP_COMPLETE: 'onboarding:step_complete',
  COMPLETE:      'onboarding:complete',
  SKIP:          'onboarding:skip',
} as const;

// ─── Vendor ───────────────────────────────────────────────────────────────────
export const VENDOR = {
  VIEW:             'vendor:view',
  SEARCH:           'vendor:search',
  FILTER_APPLY:     'vendor:filter_apply',
  CONTACT_CLICK:    'vendor:contact_click',
  SHORTLIST:        'vendor:shortlist',
  REMOVE_SHORTLIST: 'vendor:remove_shortlist',
  COMPARE:          'vendor:compare',
  SHARE:            'vendor:share',
  REVIEW_START:     'vendor:review_start',
  REVIEW_SUBMIT:    'vendor:review_submit',
  PORTFOLIO_VIEW:   'vendor:portfolio_view',
  PACKAGE_VIEW:     'vendor:package_view',
} as const;

// ─── Quote ────────────────────────────────────────────────────────────────────
export const QUOTE = {
  START:         'quote:start',
  STEP_COMPLETE: 'quote:step_complete',
  SUBMIT:        'quote:submit',
  COMPLETE:      'quote:complete',
  ABANDON:       'quote:abandon',
} as const;

// ─── Inquiry ──────────────────────────────────────────────────────────────────
export const INQUIRY = {
  SEND:    'inquiry:send',
  VIEW:    'inquiry:view',
  RESPOND: 'inquiry:respond',
} as const;

// ─── Event Planning ───────────────────────────────────────────────────────────
export const EVENT_PLANNING = {
  CREATE_START:        'event_planning:create_start',
  TYPE_SELECTED:       'event_planning:type_selected',
  DETAILS_COMPLETE:    'event_planning:details_complete',
  BUDGET_SET:          'event_planning:budget_set',
  VENDORS_SHORTLISTED: 'event_planning:vendors_shortlisted',
  ACTIVATE:            'event_planning:activate',
  UPDATE:              'event_planning:update',
  DELETE:              'event_planning:delete',
} as const;

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const WISHLIST = {
  CREATE:      'wishlist:create',
  DELETE:      'wishlist:delete',
  ADD_ITEM:    'wishlist:add_item',
  REMOVE_ITEM: 'wishlist:remove_item',
  SHARE:       'wishlist:share',
  VIEW:        'wishlist:view',
} as const;

// ─── Search ───────────────────────────────────────────────────────────────────
export const SEARCH = {
  PERFORM:      'search:perform',
  RESULT_CLICK: 'search:result_click',
  FILTER_APPLY: 'search:filter_apply',
  NO_RESULTS:   'search:no_results',
  GLOBAL:       'search:global',
} as const;

// ─── Messages ─────────────────────────────────────────────────────────────────
export const MESSAGE = {
  CONVERSATION_START: 'message:conversation_start',
  SEND:               'message:send',
  VIEW:               'message:view',
} as const;

// ─── Content / Blog ───────────────────────────────────────────────────────────
export const CONTENT = {
  ARTICLE_VIEW:    'content:article_view',
  ARTICLE_SHARE:   'content:article_share',
  ARTICLE_COMMENT: 'content:article_comment',
  SCROLL_DEPTH:    'content:scroll_depth',
  VIDEO_PLAY:      'content:video_play',
  VIDEO_COMPLETE:  'content:video_complete',
  FILE_DOWNLOAD:   'content:file_download',
} as const;

// ─── Budget ───────────────────────────────────────────────────────────────────
export const BUDGET = {
  SET:         'budget:set',
  UPDATE:      'budget:update',
  ITEM_ADD:    'budget:item_add',
  ITEM_DELETE: 'budget:item_delete',
  EXPORT:      'budget:export',
} as const;

// ─── Checklist ────────────────────────────────────────────────────────────────
export const CHECKLIST = {
  CREATE:        'checklist:create',
  ITEM_ADD:      'checklist:item_add',
  ITEM_COMPLETE: 'checklist:item_complete',
  ITEM_DELETE:   'checklist:item_delete',
  EXPORT:        'checklist:export',
} as const;

// ─── Guest List ───────────────────────────────────────────────────────────────
export const GUEST_LIST = {
  ADD_GUEST:   'guestlist:add_guest',
  IMPORT:      'guestlist:import',
  RSVP_VIEW:   'guestlist:rsvp_view',
  SEND_INVITE: 'guestlist:send_invite',
  EXPORT:      'guestlist:export',
} as const;

// ─── Timeline ─────────────────────────────────────────────────────────────────
export const TIMELINE = {
  VIEW:         'timeline:view',
  EVENT_ADD:    'timeline:event_add',
  EVENT_UPDATE: 'timeline:event_update',
  EVENT_DELETE: 'timeline:event_delete',
  EXPORT:       'timeline:export',
} as const;

// ─── Pricing ──────────────────────────────────────────────────────────────────
export const PRICING = {
  VIEW:           'pricing:view',
  PLAN_SELECT:    'pricing:plan_select',
  UPGRADE_CLICK:  'pricing:upgrade_click',
  CHECKOUT_START: 'pricing:checkout_start',
} as const;

// ─── Forms ────────────────────────────────────────────────────────────────────
export const FORM = {
  START:       'form:start',
  FIELD_FOCUS: 'form:field_focus',
  COMPLETE:    'form:complete',
  ABANDON:     'form:abandon',
  ERROR:       'form:error',
  SUBMIT:      'form:submit',
} as const;

// ─── UI interactions ──────────────────────────────────────────────────────────
export const UI = {
  BUTTON_CLICK:       'ui:button_click',
  EXTERNAL_LINK:      'ui:external_link',
  MODAL_OPEN:         'ui:modal_open',
  MODAL_CLOSE:        'ui:modal_close',
  TAB_SWITCH:         'ui:tab_switch',
  ACCORDION_OPEN:     'ui:accordion_open',
  SIDEBAR_TOGGLE:     'ui:sidebar_toggle',
  THEME_CHANGE:       'ui:theme_change',
  NOTIFICATION_CLICK: 'ui:notification_click',
} as const;

// ─── Errors ───────────────────────────────────────────────────────────────────
export const ERROR = {
  NOT_FOUND:       'error:404',
  API:             'error:api',
  JS:              'error:js',
  FORM_VALIDATION: 'error:form_validation',
} as const;

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const DASHBOARD = {
  VIEW:         'dashboard:view',
  SECTION_VIEW: 'dashboard:section_view',
  EXPORT:       'dashboard:export',
  FILTER_APPLY: 'dashboard:filter_apply',
} as const;

// ─── Engagement / Retention ───────────────────────────────────────────────────
export const ENGAGEMENT = {
  TIME_ON_PAGE: 'engagement:time_on_page',
  SCROLL_DEPTH: 'content:scroll_depth',
} as const;

// ─── Funnels ──────────────────────────────────────────────────────────────────
export const FUNNEL_NAMES = {
  VENDOR_DISCOVERY: 'vendor_discovery',
  USER_SIGNUP:      'user_signup',
  VENDOR_ONBOARDING: 'vendor_onboarding',
  EVENT_PLANNING:   'event_planning',
  QUOTE_FLOW:       'quote_flow',
} as const;
