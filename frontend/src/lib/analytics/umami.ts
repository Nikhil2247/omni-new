/**
 * Umami Analytics Helpers
 */

const hasWindow = () => typeof window !== 'undefined';

type UmamiPayload = Record<string, string | number | boolean | null | undefined>;

function hasUmami() {
  return hasWindow() && typeof window.umami?.track === 'function';
}

export function trackUmamiEvent(eventName: string, payload?: UmamiPayload) {
  if (!hasUmami()) return;
  window.umami?.track(eventName, payload);
}

export function trackFunnelStep(
  funnelName: string,
  stepName: string,
  metadata?: UmamiPayload,
) {
  trackUmamiEvent(`funnel:${funnelName}:${stepName}`, metadata);
}

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: UmamiPayload) => void;
    };
  }
}
