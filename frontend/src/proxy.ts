import { NextResponse, type NextRequest } from 'next/server'

/**
 * Canonical-URL redirects, done before rendering so crawlers get a clean 308 and no duplicate pages exist.
 *
 *  - www.omnicassion.com/...        -> omnicassion.com/...      (Search Console listed www URLs as separate pages)
 *  - /vendors/The-Oberoi-Spa-Resort -> /vendors/the-oberoi-spa-resort (slugs are lowercase; mixed case = duplicate)
 *
 * No API calls happen here, so it cannot be rate limited.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  let changed = false

  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4)
    changed = true
  }

  if (url.pathname.startsWith('/vendors/') && url.pathname !== url.pathname.toLowerCase()) {
    url.pathname = url.pathname.toLowerCase()
    changed = true
  }

  if (changed) {
    return NextResponse.redirect(url, 308)
  }
  return NextResponse.next()
}

export const config = {
  // Pages only: skip API routes, Next internals and any file with an extension (images, fonts, scripts).
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
