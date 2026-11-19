'use client'

import { useEffect } from 'react'
import { trackError } from '@/lib/analytics/umami'

// This screen replaces the whole page (including the layout), so the site's stylesheet is not loaded.
// It is styled inline, using the same paper, ink and cobalt colours as the rest of the site.
const C = { paper: '#f7f6f1', card: '#fffdf8', ink: '#1c2757', soft: '#4b5684', blue: '#2748c4', wash: '#a9bbf0', rose: '#c0595a' }

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)

    // Track global error with Umami
    trackError.jsError(error.message || error.toString(), error.stack)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: C.paper, color: C.ink, fontFamily: 'Georgia, "Times New Roman", serif' }}>
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '48px 16px' }}>
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              background: C.card,
              border: `2px solid ${C.ink}`,
              borderRadius: '16px 22px 18px 24px',
              boxShadow: `6px 6px 0 ${C.wash}`,
              padding: '36px 28px',
              textAlign: 'center',
            }}
          >
            <svg viewBox="0 0 48 48" width={56} height={56} fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M24 6L44 40H4Z" />
              <path d="M24 19v10M24 34v1" />
            </svg>
            <h1 style={{ margin: '12px 0 8px', fontSize: 30, lineHeight: 1.1 }}>Application error</h1>
            <p style={{ margin: '0 0 24px', color: C.soft, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
              A critical error occurred. Please refresh the page to continue.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div style={{ margin: '0 0 24px', padding: 12, textAlign: 'left', border: `2px dashed ${C.wash}`, borderRadius: 10 }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, fontFamily: 'system-ui, sans-serif' }}>Error details (development only)</p>
                <pre style={{ margin: 0, overflow: 'auto', fontSize: 12, color: C.rose, whiteSpace: 'pre-wrap' }}>{error.message || error.toString()}</pre>
              </div>
            )}

            <button
              onClick={reset}
              style={{
                cursor: 'pointer',
                background: C.blue,
                color: '#fff',
                border: `2px solid ${C.ink}`,
                borderRadius: '12px 16px 12px 18px',
                padding: '11px 24px',
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Refresh page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
