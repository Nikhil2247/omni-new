/**
 * Visual preview of the e-invite templates, rendered with the real Fabric.js (the same engine as the editor).
 * No database needed.
 *
 *   npm run einvite:preview            -> http://localhost:4545  (contact sheet of every template)
 *   http://localhost:4545/?t=7         -> one template at full size (index from the contact sheet)
 *   http://localhost:4545/?cat=BIRTHDAY -> only one category
 *
 * Re-generates the templates on every request, so edit the seed files and just refresh the page.
 */
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

const PORT = Number(process.env.PREVIEW_PORT || 4545);
const FABRIC = path.resolve(__dirname, '../../frontend/node_modules/fabric/dist/fabric.min.js');

const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Fraunces:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Karla:wght@400;700' +
  '&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700' +
  '&family=Dancing+Script:wght@500;700&family=Pacifico&family=Montserrat:wght@400;600;700&family=Cinzel:wght@500;700&family=Fredoka:wght@500;600;700&display=swap';

function loadTemplates() {
  // Fresh copy of the seed modules on every request, so edits show up on refresh.
  for (const key of Object.keys(require.cache)) {
    if (key.includes(`${path.sep}seeds${path.sep}`)) delete require.cache[key];
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../prisma/seeds/einvite-templates.seed');
  return mod.einviteTemplateDefinitions() as Array<{ name: string; category: string; canvasJson: unknown }>;
}

const page = (templates: ReturnType<typeof loadTemplates>, only: number | null, cat: string | null, list: number[] | null = null) => {
  const items = templates
    .map((t, i) => ({ ...t, i }))
    .filter((t) => (only === null || t.i === only) && (!cat || t.category === cat) && (!list || list.includes(t.i)));
  const scale = only !== null ? 1 : list && list.length <= 4 ? 0.85 : 0.5;
  return `<!doctype html><html><head><meta charset="utf-8"><title>E-invite preview</title>
<link rel="stylesheet" href="${FONT_CSS}">
<style>
body{margin:0;background:#e9e7e1;font-family:system-ui,sans-serif}
h1{font-size:14px;margin:10px 14px;color:#333}
.grid{display:flex;flex-wrap:wrap;gap:14px;padding:0 14px 30px}
.card{background:#fff;padding:6px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.card b{display:block;font-size:12px;margin:2px 2px 6px;color:#222}
canvas{display:block}
</style></head><body>
<h1>${items.length} template(s) &middot; ${cat ?? 'all categories'}</h1>
<div class="grid" id="grid"></div>
<script src="/fabric.js"></script>
<script>
const items = ${JSON.stringify(items)};
const scale = ${scale};
(async () => {
  try {
    await Promise.all([
      document.fonts.load('700 30px Caveat'), document.fonts.load('600 30px Fraunces'), document.fonts.load('400 20px Karla'),
      document.fonts.load('700 30px "Playfair Display"'), document.fonts.load('400 30px "Great Vibes"'),
      document.fonts.load('700 30px "Cormorant Garamond"'), document.fonts.load('700 30px "Dancing Script"'),
      document.fonts.load('400 30px Pacifico'), document.fonts.load('700 20px Montserrat'),
      document.fonts.load('700 30px Cinzel'), document.fonts.load('700 30px Fredoka'),
    ]);
  } catch (e) {}
  fabric.util.clearFabricFontCache();
  const grid = document.getElementById('grid');
  for (const t of items) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<b>' + t.i + '. ' + t.name + ' <small>(' + t.category + ')</small></b>';
    const el = document.createElement('canvas');
    el.width = 600; el.height = 800;
    card.appendChild(el);
    grid.appendChild(card);
    const c = new fabric.StaticCanvas(el, { width: 600, height: 800 });
    c.setZoom(scale); c.setWidth(600 * scale); c.setHeight(800 * scale);
    await new Promise((res) => c.loadFromJSON(t.canvasJson, () => { c.renderAll(); res(); }));
  }
  document.title = 'ready';
})();
</script></body></html>`;
};

http
  .createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', `http://localhost:${PORT}`);
      if (url.pathname === '/fabric.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        return res.end(fs.readFileSync(FABRIC));
      }
      if (url.pathname === '/') {
        const only = url.searchParams.get('t');
        const html = page(loadTemplates(), only === null ? null : Number(only), url.searchParams.get('cat'), url.searchParams.get('ts') ? url.searchParams.get('ts')!.split(',').map(Number) : null);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      }
      res.writeHead(404);
      res.end();
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(String((error as Error).stack || error));
    }
  })
  .listen(PORT, '127.0.0.1', () => console.log(`E-invite preview: http://localhost:${PORT}`));
