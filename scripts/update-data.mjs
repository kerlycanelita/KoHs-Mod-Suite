// Refreshes assets/data/projects.json, the offline snapshot the site shows
// before (or instead of) the live Modrinth API response.
// Usage: node scripts/update-data.mjs
import { writeFile } from 'node:fs/promises';

const USER = 'zymery_dria';
const API = 'https://api.modrinth.com/v2';
const OUT = new URL('../assets/data/projects.json', import.meta.url);
const HEADERS = { 'User-Agent': 'kerlycanelita/KoHs-Mod-Suite' };

const FIELDS = [
  'id', 'slug', 'title', 'description', 'body', 'icon_url', 'project_type', 'categories',
  'loaders', 'game_versions', 'client_side', 'server_side', 'downloads', 'followers',
  'published', 'updated', 'license', 'gallery', 'versions', 'source_url', 'issues_url',
  'wiki_url', 'discord_url', 'status',
];

const IMAGE_RE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)|<img[^>]+src=["']([^"']+)/gi;

async function api(path) {
  const res = await fetch(API + path, { headers: HEADERS });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

// Width/height from the first bytes of a PNG, GIF, WebP or JPEG file.
function imageSize(b) {
  const u16be = (i) => (b[i] << 8) | b[i + 1];
  const u32be = (i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const u16le = (i) => b[i] | (b[i + 1] << 8);
  const u24le = (i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  const ascii = (i, n) => String.fromCharCode(...b.slice(i, i + n));

  if (b[0] === 0x89 && ascii(1, 3) === 'PNG') return [u32be(16), u32be(20)];
  if (ascii(0, 3) === 'GIF') return [u16le(6), u16le(8)];
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const chunk = ascii(12, 4);
    if (chunk === 'VP8 ') return [u16le(26) & 0x3fff, u16le(28) & 0x3fff];
    if (chunk === 'VP8L') {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
    if (chunk === 'VP8X') return [u24le(24) + 1, u24le(27) + 1];
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length; ) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return [u16be(i + 7), u16be(i + 5)];
      }
      i += 2 + u16be(i + 2);
    }
  }
  return null;
}

async function probe(url) {
  try {
    const res = await fetch(url, { headers: { ...HEADERS, Range: 'bytes=0-65535' } });
    if (!res.ok) return null;
    return imageSize(new Uint8Array(await res.arrayBuffer()));
  } catch {
    return null;
  }
}

// Public repositories for projects whose Modrinth page has no source link
// (keep in sync with CONFIG.repos in assets/js/app.js).
const REPOS = {
  'healt-alert-tweaks': 'https://github.com/kerlycanelita/Alert-Tweaks-KoHs',
  'keyboard-place-fix': 'https://github.com/kerlycanelita/KoHs-Keyboard-Place-Fix',
  'kohs-offhand-whitelist': 'https://github.com/kerlycanelita/KoHs-Offhand-Whitelist',
};

function rawBase(p) {
  const url = (p.source_url || '').replace(/\.git$/, '') || REPOS[p.slug] || '';
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)\/?$/i.exec(url);
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/HEAD/` : null;
}

function resolve(url, base) {
  if (!base || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) return url;
  try { return new URL(url.replace(/^\/+/, ''), base).href; } catch { return url; }
}

const projects = (await api(`/user/${USER}/projects`))
  .filter((p) => p.status === 'approved')
  .map((p) => Object.fromEntries(FIELDS.map((key) => [key, p[key] ?? null])));

const urls = new Set();
const readmes = {};
for (const p of projects) {
  for (const g of p.gallery) urls.add(g.raw_url || g.url);
  for (const m of (p.body || '').matchAll(IMAGE_RE)) urls.add(m[1] || m[2]);

  const base = rawBase(p);
  if (!base) continue;
  const res = await fetch(`${base}README.md`, { headers: HEADERS });
  if (!res.ok) continue;
  readmes[p.slug] = await res.text();
  for (const m of readmes[p.slug].matchAll(IMAGE_RE)) urls.add(resolve(m[1] || m[2], base));
}

const images = {};
for (const url of urls) {
  if (/shields\.io|\.svg(\?|$)/i.test(url)) continue;
  const size = await probe(url);
  if (size) images[url] = size;
}

const data = { generated: new Date().toISOString(), user: USER, projects, readmes, images };
await writeFile(OUT, JSON.stringify(data, null, 2) + '\n');
console.log(`Saved ${projects.length} approved projects, ${Object.keys(readmes).length} READMEs and ${Object.keys(images).length} image sizes.`);
