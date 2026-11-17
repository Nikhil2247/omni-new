import { cn } from '@/lib/utils'

/** A hand-drawn doodle icon. `d` is the inner SVG markup (static strings only) in a 48x48 box. */
export function Ico({ d, className }: { d: string; className?: string }) {
  return <svg className={cn('sk-ico', className)} viewBox="0 0 48 48" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />
}

/** Doodle paths for the vendor categories and the planning tools. */
export const ICONS = {
  venue: '<path d="M7 41V21L24 8l17 13v20Z"/><path d="M19 41V29a5 5 0 0 1 10 0v12M4 41h40"/>',
  photography: '<path d="M6 16h10l3-5h10l3 5h10v24H6Z"/><circle cx="24" cy="28" r="7"/>',
  catering: '<path d="M5 35h38M9 35a15 15 0 0 1 30 0M24 20v-5M20 15h8M8 40h32"/>',
  decor: '<path d="M24 4v6M16 10h16M14 19a10 10 0 0 1 20 0v13a10 10 0 0 1-20 0ZM15 21h18M15 30h18M20 43h8"/>',
  mehndi: '<circle cx="24" cy="21" r="5"/><path d="M24 10v6M24 26v6M13 21h6M29 21h6M16 13l4 4M28 25l4 4M32 13l-4 4M20 25l-4 4M24 32v11"/>',
  entertainment: '<path d="M18 34V12l20-4v22"/><circle cx="12.5" cy="34" r="5.5"/><circle cx="32.5" cy="30" r="5.5"/>',
  planner: '<rect x="10" y="8" width="28" height="34" rx="3"/><path d="M18 6h12v6H18zM16 24l4 4 7-8M16 34h16"/>',
  makeup: '<path d="M31 5l7 7-17 19-7-7ZM14 31l-5 10 10-5"/>',
  search: '<circle cx="21" cy="21" r="12"/><path d="M30 30l12 12"/>',
  star: '<path d="M24 6l5.5 11.5L42 19l-9 8.8 2.2 12.7L24 34.6 12.8 40.5 15 27.8 6 19l12.5-1.5z"/>',
  calendar: '<rect x="6" y="10" width="36" height="32" rx="3"/><path d="M6 20h36M15 5v9M33 5v9"/>',
  shield: '<path d="M24 5l16 6v12c0 10-7 17-16 20C15 40 8 33 8 23V11z"/><path d="M17 24l5 5 9-10"/>',
  chat: '<path d="M6 10h36v24H22l-9 8v-8H6z"/>',
  tag: '<path d="M6 24L24 6h16v16L22 40z"/><circle cx="33" cy="13" r="2.5"/>',
  wallet: '<rect x="5" y="12" width="38" height="26" rx="3"/><path d="M5 20h38M12 31h8"/>',
  guests: '<circle cx="17" cy="16" r="6"/><circle cx="33" cy="18" r="5"/><path d="M5 40c0-8 5-13 12-13s12 5 12 13M30 29c7 0 13 4 13 11"/>',
  clock: '<circle cx="24" cy="24" r="17"/><path d="M24 13v11l7 5"/>',
  mail: '<rect x="5" y="10" width="38" height="28" rx="3"/><path d="M5 14l19 14 19-14"/>',
  heart: '<path d="M24 41C10 31 6 24 6 17a9 9 0 0 1 18-2 9 9 0 0 1 18 2c0 7-4 14-18 24z"/>',
  chart: '<path d="M6 40V8M6 40h36M12 32l9-9 7 6 12-15"/>',
  phone: '<rect x="14" y="4" width="20" height="40" rx="4"/><path d="M22 38h4"/>',
  gallery: '<rect x="6" y="9" width="36" height="30" rx="3"/><circle cx="17" cy="20" r="3.5"/><path d="M6 34l11-9 8 7 6-5 11 9"/>',
  target: '<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2"/>',
  card: '<rect x="5" y="12" width="38" height="26" rx="3"/><path d="M5 20h38M12 31h8"/>',
} as const

export type IcoName = keyof typeof ICONS
