/**
 * Server-side data fetching for SEO pages (metadata, JSON-LD, sitemap).
 *
 * The public API throttles each IP (a few requests per second), and every server-rendered request comes from the
 * same IP. When Googlebot crawls several pages at once, some calls get HTTP 429. Treating that as "not found" made
 * valid pages render as `noindex`, which is how hundreds of vendor pages dropped out of Google's index.
 *
 * Rules enforced here:
 *  - 404 means "does not exist"  -> callers return notFound() (a real 404, which is correct for search engines).
 *  - 429 / 5xx / network errors  -> retried with backoff, and if they still fail we THROW. A 5xx makes crawlers
 *    retry later; it never produces a cached noindex page.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export function httpStatusOf(error: unknown): number | undefined {
  const e = error as { response?: { status?: number }; status?: number } | undefined
  return e?.response?.status ?? e?.status
}

/** Runs `task`, retrying transient failures. Throws NotFoundError for 404s, rethrows anything else after retries. */
export async function withRetry<T>(task: () => Promise<T>, attempts = 4, baseDelayMs = 400): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      const status = httpStatusOf(error)
      if (status === 404) throw new NotFoundError()
      // Client errors other than 429 are not going to succeed on retry.
      if (status && status >= 400 && status < 500 && status !== 429) throw error
      if (attempt < attempts - 1) await sleep(baseDelayMs * 2 ** attempt + Math.random() * 150)
    }
  }
  throw lastError
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')

/** GET a public API path with retries and Next's data cache. Unwraps the `{ success, data }` envelope. */
export async function fetchPublicJson<T>(path: string, revalidateSeconds = 3600): Promise<T> {
  return withRetry(async () => {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: revalidateSeconds } })
    if (!response.ok) {
      const error = new Error(`API ${response.status} for ${path}`) as Error & { status?: number }
      error.status = response.status
      throw error
    }
    const json = (await response.json()) as { data?: unknown } | unknown
    const inner = (json as { data?: unknown })?.data
    return (inner !== undefined ? inner : json) as T
  })
}
