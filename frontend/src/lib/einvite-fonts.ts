import { fabric } from 'fabric'

/**
 * Fonts used by the e-invite templates: Fraunces, Karla and Caveat, plus the display and script faces some
 * templates use (Playfair Display, Great Vibes, Cormorant Garamond, Dancing Script, Pacifico, Montserrat, Cinzel, Fredoka).
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
          'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Fraunces:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Karla:wght@400;700' +
          '&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700' +
          '&family=Dancing+Script:wght@500;700&family=Pacifico&family=Montserrat:wght@400;600;700&family=Cinzel:wght@500;700&family=Fredoka:wght@500;600;700&display=swap'
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
          document.fonts.load('700 30px "Playfair Display"'),
          document.fonts.load('italic 700 30px "Playfair Display"'),
          document.fonts.load('400 30px "Great Vibes"'),
          document.fonts.load('700 30px "Cormorant Garamond"'),
          document.fonts.load('italic 700 30px "Cormorant Garamond"'),
          document.fonts.load('700 30px "Dancing Script"'),
          document.fonts.load('400 30px Pacifico'),
          document.fonts.load('600 20px Montserrat'),
          document.fonts.load('700 20px Montserrat'),
          document.fonts.load('700 30px Cinzel'),
          document.fonts.load('600 30px Fredoka'),
          document.fonts.load('700 30px Fredoka'),
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
