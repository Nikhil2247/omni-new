import { fabric } from 'fabric'

/**
 * Fonts used by the e-invite templates (Fraunces, Karla, Caveat).
 * A canvas can only draw a font that the page has already loaded, so templates are
 * loaded onto the canvas only after this resolves. The stylesheet is added once.
 */
let loading: Promise<void> | null = null

export function loadEInviteFonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  if (!loading) {
    loading = (async () => {
      if (!document.getElementById('einvite-fonts')) {
        const link = document.createElement('link')
        link.id = 'einvite-fonts'
        link.rel = 'stylesheet'
        link.href =
          'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Fraunces:wght@400;600;700&family=Karla:wght@400;700&display=swap'
        document.head.appendChild(link)
      }
      try {
        await Promise.all([
          document.fonts.load('400 20px Fraunces'),
          document.fonts.load('600 20px Fraunces'),
          document.fonts.load('700 20px Fraunces'),
          document.fonts.load('400 16px Karla'),
          document.fonts.load('700 16px Karla'),
          document.fonts.load('700 40px Caveat'),
        ])
      } catch {
        // Offline or blocked: the canvas falls back to a system font.
      }
      // Text widths measured before the fonts arrived are stale.
      fabric.util.clearFabricFontCache()
    })()
  }
  return loading
}

/**
 * Loads the fonts, then a canvas JSON, so text is measured with the right font.
 * Returns a function that cancels the load (call it before disposing the canvas).
 */
export function loadCanvasJson(
  canvas: fabric.Canvas | fabric.StaticCanvas,
  json: Record<string, unknown> | string,
  done?: () => void,
): () => void {
  let cancelled = false
  void loadEInviteFonts().then(() => {
    if (cancelled) return
    canvas.loadFromJSON(json, () => {
      if (cancelled) return
      canvas.renderAll()
      done?.()
    })
  })
  return () => {
    cancelled = true
  }
}
