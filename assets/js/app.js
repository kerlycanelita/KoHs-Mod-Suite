/* KoHs Mod Suite */
(() => {
  'use strict';

  const CONFIG = {
    user: 'zymery_dria',
    api: 'https://api.modrinth.com/v2',
    snapshot: 'assets/data/projects.json',
    discord: 'https://discord.gg/9t2VxEF7UU',
    discordCode: '9t2VxEF7UU',
    // Public GitHub repositories for projects whose Modrinth page doesn't link one.
    repos: {
      'healt-alert-tweaks': 'https://github.com/kerlycanelita/Alert-Tweaks-KoHs',
      'keyboard-place-fix': 'https://github.com/kerlycanelita/KoHs-Keyboard-Place-Fix',
      'kohs-offhand-whitelist': 'https://github.com/kerlycanelita/KoHs-Offhand-Whitelist',
    },
    typer: ['crystal PvP', 'snappier hotbars', 'cleaner inventories', 'epic death effects', 'Bedrock crossplay', 'low-health alerts'],
    showcaseStep: 10,
    // Self-hosted copy of the Discord server icon; the CDN is only used if the server changes it.
    discordIcon: 'a73690eeefc7e15b668e726d9fa848b9',
    // Request form endpoint (FormSubmit). The address is kept encoded so it never appears in the page;
    // after confirming FormSubmit's activation email, replace it with the random string FormSubmit sends.
    formEndpoint: `https://formsubmit.co/${atob('enltZWtvaEBnbWFpbC5jb20=')}`,
    upload: {
      maxFiles: 5,
      maxBytes: 10 * 1000 * 1000,
      types: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'txt', 'log', 'md', 'yml', 'yaml', 'json', 'toml', 'properties', 'cfg', 'conf', 'csv'],
    },
  };

  const PLUGIN_LOADERS = new Set(['paper', 'spigot', 'bukkit', 'purpur', 'folia', 'sponge', 'velocity', 'bungeecord', 'waterfall']);
  const NAMES = {
    fabric: 'Fabric', quilt: 'Quilt', forge: 'Forge', neoforge: 'NeoForge', paper: 'Paper', spigot: 'Spigot',
    bukkit: 'Bukkit', purpur: 'Purpur', folia: 'Folia', velocity: 'Velocity', mod: 'Mod', plugin: 'Plugin',
    resourcepack: 'Resource pack', shader: 'Shader', modpack: 'Modpack', datapack: 'Data pack',
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  // Only absolute https URLs from API data ever reach href/src attributes; plain http is upgraded.
  const safeUrl = (u) => {
    const url = typeof u === 'string' ? u.trim().replace(/^http:\/\//i, 'https://') : '';
    return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : '';
  };
  const label = (key) => NAMES[key] || String(key).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const motionOK = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  const plain = new Intl.NumberFormat('en');
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const dateFmt = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' });

  const state = {
    projects: [],
    bySlug: new Map(),
    source: 'loading',
    generated: null,
    ready: false,
    filter: 'all',
    query: '',
    sort: 'downloads',
    showcase: [],
    showcaseKey: '',
    showcaseFilter: 'all',
    showcaseList: [],
    showcaseShown: 0,
    sizes: {},
    readmes: new Map(),
    current: null,
  };

  function timeAgo(date) {
    const diff = (date.getTime() - Date.now()) / 1000;
    const steps = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, secs] of steps) {
      if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
    }
    return 'just now';
  }

  function cmpVersion(a, b) {
    const pa = a.split(/[.-]/).map(Number);
    const pb = b.split(/[.-]/).map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d) return d;
    }
    return 0;
  }

  const versionRange = (v) => (v.length > 1 ? `${v[0]} – ${v[v.length - 1]}` : v[0] || '');

  async function request(url, timeout, read) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await read(res);
    } finally {
      clearTimeout(timer);
    }
  }

  const fetchJSON = (url, timeout = 10000) => request(url, timeout, (res) => res.json());
  const fetchText = (url, timeout = 10000) => request(url, timeout, (res) => res.text());

  // GitHub repository helpers (READMEs are read straight from raw.githubusercontent.com).
  function repoOf(url) {
    const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i.exec(url || '');
    return m ? { owner: m[1], name: m[2] } : null;
  }
  const rawBase = (r) => `https://raw.githubusercontent.com/${r.owner}/${r.name}/HEAD/`;
  const blobBase = (r) => `https://github.com/${r.owner}/${r.name}/blob/HEAD/`;

  // Same image referenced from Modrinth and GitHub (any branch) counts once.
  function mediaKey(url) {
    const hash = url.match(/[0-9a-f]{40}/);
    if (hash) return hash[0];
    const gh = /raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/[^/]+\/(.+)$/i.exec(url)
      || /github\.com\/([^/]+)\/([^/]+)\/(?:raw|blob)\/[^/]+\/(.+)$/i.exec(url);
    return gh ? `${gh[1]}/${gh[2]}/${gh[3]}`.toLowerCase() : url;
  }

  // Resolves README-relative paths; root-relative ones are relative to the repository root.
  function resolveUrl(value, base) {
    if (!value || !base || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return value;
    try { return new URL(value.replace(/^\/+/, ''), base).href; } catch (err) { return value; }
  }

  /* ---------- Data ---------- */

  const IMG_RE = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)[^)]*\)|<img\b[^>]*>/gi;
  const cleanAlt = (t) => (t && !/replace this with a description/i.test(t) ? t.trim() : '');
  const worthy = (m) => !m.w || (m.w >= 200 && m.h >= 150 && m.w / m.h <= 3.2 && m.h / m.w <= 3.2);

  // Images referenced by Markdown/HTML text, resolved against `base` when relative.
  function imagesIn(text, base) {
    const found = [];
    for (const m of String(text || '').matchAll(IMG_RE)) {
      if (m[2]) {
        found.push([resolveUrl(m[2], base), m[1]]);
      } else {
        const src = /\bsrc=["']([^"']+)/i.exec(m[0]);
        const alt = /\balt=["']([^"']*)/i.exec(m[0]);
        if (src) found.push([resolveUrl(src[1], base), alt && alt[1]]);
      }
    }
    return found;
  }

  function mediaList(entries, sizes, seen = new Set()) {
    const out = [];
    for (const [thumbRaw, fullRaw, title] of entries) {
      const full = safeUrl(fullRaw);
      const thumb = safeUrl(thumbRaw) || full;
      if (!full || /shields\.io|\.svg(\?|$)|\/icon\.png$/i.test(full)) continue;
      const key = mediaKey(full);
      if (seen.has(key)) continue;
      seen.add(key);
      const size = sizes[full] || sizes[thumb];
      out.push({ thumb, full, title: cleanAlt(title), w: size ? size[0] : 0, h: size ? size[1] : 0 });
    }
    return out;
  }

  function collectMedia(p, sizes) {
    const gallery = [...(p.gallery || [])]
      .sort((a, b) => (b.featured - a.featured) || ((a.ordering ?? 0) - (b.ordering ?? 0)))
      .map((g) => [g.url, g.raw_url || g.url, g.title || g.description]);
    const body = imagesIn(p.body).map(([url, alt]) => [url, url, alt]);
    return mediaList([...gallery, ...body], sizes);
  }

  // Modrinth media first, then any extra screenshots from the GitHub README.
  function allMedia(p) {
    const text = state.readmes.get(p.slug);
    if (!text || !p.repo) return p.media;
    const seen = new Set(p.media.map((m) => mediaKey(m.full)));
    const extra = imagesIn(text, rawBase(p.repo)).map(([url, alt]) => [url, url, alt]);
    return [...p.media, ...mediaList(extra, state.sizes, seen)];
  }

  function envLabel(client, server) {
    const c = client !== 'unsupported';
    const s = server !== 'unsupported';
    if (c && !s) return 'Client-side';
    if (s && !c) return 'Server-side';
    return 'Client & server';
  }

  function licenseName(l) {
    if (!l || !l.id) return 'Unknown';
    if (/all-rights-reserved/i.test(l.id)) return 'All rights reserved';
    if (l.id.startsWith('LicenseRef-')) return l.name || 'Custom';
    return l.id;
  }

  function normalize(p, sizes) {
    const loaders = p.loaders || [];
    const type = loaders.some((l) => PLUGIN_LOADERS.has(l)) ? 'plugin' : (p.project_type || 'mod');
    const mapped = Object.hasOwn(CONFIG.repos, p.slug) ? CONFIG.repos[p.slug] : null;
    const github = safeUrl((p.source_url || '').replace(/\.git$/, '').replace(/\/$/, '')) || mapped;
    return {
      slug: String(p.slug),
      title: String(p.title || p.slug),
      summary: p.description || '',
      body: p.body || '',
      icon: safeUrl(p.icon_url) || 'assets/img/favicon.svg',
      type,
      loaders,
      categories: p.categories || [],
      env: envLabel(p.client_side, p.server_side),
      versions: [...(p.game_versions || [])].sort(cmpVersion),
      downloads: p.downloads || 0,
      followers: p.followers || 0,
      releases: Array.isArray(p.versions) ? p.versions.length : Number(p.versions) || 0,
      published: new Date(p.published),
      updated: new Date(p.updated),
      license: p.license,
      url: `https://modrinth.com/${encodeURIComponent(type)}/${encodeURIComponent(p.slug)}`,
      github,
      repo: repoOf(github),
      issues: safeUrl(p.issues_url) || null,
      wiki: safeUrl(p.wiki_url) || null,
      media: collectMedia(p, sizes),
    };
  }

  async function loadData() {
    const snapshotReq = fetchJSON(CONFIG.snapshot).catch(() => null);
    const liveReq = fetchJSON(`${CONFIG.api}/user/${CONFIG.user}/projects`, 9000).catch(() => null);
    const snapshot = await snapshotReq;
    const sizes = (snapshot && snapshot.images) || {};
    state.sizes = sizes;
    if (snapshot && snapshot.readmes) {
      for (const [slug, text] of Object.entries(snapshot.readmes)) {
        if (typeof text === 'string') state.readmes.set(slug, text);
      }
    }
    const early = await Promise.race([liveReq, wait(1200).then(() => undefined)]);

    if (early) {
      apply(early, sizes, 'live');
    } else if (snapshot) {
      apply(snapshot.projects, sizes, 'snapshot', snapshot.generated);
      liveReq.then((live) => live && apply(live, sizes, 'live'));
    } else {
      const live = await liveReq;
      if (!live) { showLoadError(); return; }
      apply(live, sizes, 'live');
    }
    loadReadmes();
  }

  // Pulls each public README live so README edits show up without touching the site.
  async function loadReadmes() {
    const jobs = state.projects.filter((p) => p.repo).map(async (p) => {
      try {
        const text = await fetchText(`${rawBase(p.repo)}README.md`, 9000);
        if (text.length > 400000 || text === state.readmes.get(p.slug)) return;
        state.readmes.set(p.slug, text);
        if (state.current === p.slug) renderReadme(p);
      } catch (err) {
        /* keep the snapshot copy */
      }
    });
    await Promise.all(jobs);
    renderShowcase(state.projects.slice().sort((a, b) => b.downloads - a.downloads));
    const open = state.current && state.bySlug.get(state.current);
    if (open) renderGallery(open);
  }

  function apply(raw, sizes, source, generated) {
    const list = raw.filter((p) => !p.status || p.status === 'approved').map((p) => normalize(p, sizes));
    state.projects = list;
    state.bySlug = new Map(list.map((p) => [p.slug, p]));
    state.source = source;
    state.generated = generated || null;

    renderStatus();
    renderStats();
    renderFilters();
    renderGrid(false);
    const byDownloads = list.slice().sort((a, b) => b.downloads - a.downloads);
    renderTapes(byDownloads);
    renderOrbit(byDownloads);
    renderShowcase(byDownloads);
    hidePreloader();

    if (!state.ready) {
      state.ready = true;
      route();
    }
  }

  function showLoadError() {
    state.source = 'error';
    const pill = $('#data-status');
    pill.dataset.state = 'error';
    $('.live-pill__text', pill).textContent = 'Could not reach Modrinth';
    $('#mod-grid').innerHTML = '';
    const empty = $('#mod-empty');
    empty.hidden = false;
    empty.innerHTML = `<p>The projects could not be loaded right now.</p>
      <a class="btn btn--primary btn--sm" href="https://modrinth.com/user/${CONFIG.user}" target="_blank" rel="noopener">${icon('modrinth')}See them on Modrinth</a>`;
    hidePreloader();
  }

  /* ---------- Stats & status ---------- */

  function renderStatus() {
    const pill = $('#data-status');
    pill.dataset.state = state.source;
    $('.live-pill__text', pill).textContent = state.source === 'live'
      ? `Live from Modrinth · ${state.projects.length} projects`
      : `Offline snapshot · ${state.generated ? dateFmt.format(new Date(state.generated)) : 'cached'}`;
  }

  const counterIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.dataset.seen = '1';
      counterIO.unobserve(entry.target);
      animateCounter(entry.target);
    }
  }, { threshold: 0.4 });

  function animateCounter(el) {
    const to = Number(el.dataset.target || 0);
    const from = Number(el.dataset.value || 0);
    const fmt = (v) => (el.dataset.format === 'compact' ? compact.format(Math.round(v)) : plain.format(Math.round(v)));
    cancelAnimationFrame(el.rafId);
    if (!motionOK() || from === to) {
      el.dataset.value = to;
      el.textContent = fmt(to);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1800);
      el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - t, 4)));
      if (t < 1) el.rafId = requestAnimationFrame(step);
      else el.dataset.value = to;
    };
    el.rafId = requestAnimationFrame(step);
  }

  function renderStats() {
    const list = state.projects;
    const totals = {
      downloads: list.reduce((n, p) => n + p.downloads, 0),
      projects: list.length,
      releases: list.reduce((n, p) => n + p.releases, 0),
      versions: new Set(list.flatMap((p) => p.versions)).size,
    };
    for (const [key, value] of Object.entries(totals)) {
      $$(`[data-stat="${key}"]`).forEach((el) => {
        el.dataset.target = value;
        if (el.dataset.seen) animateCounter(el);
      });
    }
  }

  /* ---------- Filters & grid ---------- */

  function renderFilters() {
    const counts = new Map();
    const bump = (k) => counts.set(k, (counts.get(k) || 0) + 1);
    for (const p of state.projects) {
      bump(`type:${p.type}`);
      p.categories.forEach((c) => bump(`cat:${c}`));
    }
    const options = [['all', 'All', state.projects.length]];
    for (const t of ['mod', 'plugin', 'resourcepack', 'shader', 'datapack', 'modpack']) {
      if (counts.has(`type:${t}`)) options.push([`type:${t}`, `${label(t)}s`, counts.get(`type:${t}`)]);
    }
    [...counts.keys()]
      .filter((k) => k.startsWith('cat:'))
      .sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b))
      .forEach((k) => options.push([k, label(k.slice(4)), counts.get(k)]));
    if (!options.some(([k]) => k === state.filter)) state.filter = 'all';

    $('#filters').innerHTML = options.map(([key, text, n]) => `
      <button class="chip" type="button" data-filter="${esc(key)}" aria-pressed="${key === state.filter}">
        ${esc(text)}<span class="chip__count">${n}</span>
      </button>`).join('');
  }

  function visibleProjects() {
    const q = state.query.trim().toLowerCase();
    const [kind, value] = state.filter.split(':');
    const sorters = {
      downloads: (a, b) => b.downloads - a.downloads,
      updated: (a, b) => b.updated - a.updated,
      published: (a, b) => b.published - a.published,
      name: (a, b) => a.title.localeCompare(b.title),
    };
    return state.projects
      .filter((p) => {
        if (kind === 'type' && p.type !== value) return false;
        if (kind === 'cat' && !p.categories.includes(value)) return false;
        if (!q) return true;
        const hay = [p.title, p.summary, p.slug, label(p.type), ...p.categories.map(label), ...p.loaders.map(label)];
        return hay.join(' ').toLowerCase().includes(q);
      })
      .sort(sorters[state.sort] || sorters.downloads);
  }

  const cards = new Map();

  function cardInner(p) {
    const tags = [
      `<li>${icon('monitor')}${esc(p.env)}</li>`,
      p.versions.length ? `<li>${icon('layers')}${esc(versionRange(p.versions))}</li>` : '',
      ...p.categories.slice(0, 2).map((c) => `<li>${esc(label(c))}</li>`),
    ].join('');
    return `
      <div class="card__inner">
        <header class="card__head">
          <div class="card__icon"><img src="${esc(p.icon)}" alt="" width="72" height="72" loading="lazy" decoding="async"></div>
          <div class="card__meta">
            <span class="card__type">${icon(p.type === 'plugin' ? 'puzzle' : 'package')}${esc(label(p.type))} · ${esc(p.loaders.map(label).join(' / '))}</span>
            <h3 class="card__title"><a class="card__link" href="#mod/${esc(p.slug)}">${esc(p.title)}</a></h3>
          </div>
        </header>
        <p class="card__desc">${esc(p.summary)}</p>
        <ul class="card__tags">${tags}</ul>
        <footer class="card__foot">
          <span class="card__stat" title="Downloads">${icon('download')}<b data-field="downloads"></b></span>
          <span class="card__stat" title="Followers">${icon('heart')}<b data-field="followers"></b></span>
          <span class="card__stat">${icon('clock')}<b data-field="updated"></b></span>
          <span class="card__links">
            <a class="icon-btn" href="${esc(p.url)}" target="_blank" rel="noopener" title="Modrinth" aria-label="${esc(p.title)} on Modrinth">${icon('modrinth')}</a>
            ${p.github ? `<a class="icon-btn" href="${esc(p.github)}" target="_blank" rel="noopener" title="GitHub" aria-label="${esc(p.title)} source code on GitHub">${icon('github')}</a>` : ''}
          </span>
        </footer>
      </div>`;
  }

  function updateCard(el, p) {
    const sig = [p.title, p.summary, p.icon, p.env, p.versions.join(), p.categories.join(), p.loaders.join(), p.github].join('|');
    if (el.dataset.sig !== sig) {
      el.dataset.sig = sig;
      el.innerHTML = cardInner(p);
    }
    $('[data-field="downloads"]', el).textContent = compact.format(p.downloads);
    $('[data-field="followers"]', el).textContent = plain.format(p.followers);
    const updated = $('[data-field="updated"]', el);
    updated.textContent = timeAgo(p.updated);
    updated.parentElement.title = `Updated ${dateFmt.format(p.updated)}`;
  }

  function renderGrid(animate) {
    const grid = $('#mod-grid');
    $$('.card--skeleton', grid).forEach((el) => el.remove());
    const list = visibleProjects();
    const flip = animate && motionOK();
    const before = new Map();
    if (flip) cards.forEach((el) => { if (!el.hidden && el.isConnected) before.set(el, el.getBoundingClientRect()); });

    for (const p of state.projects) {
      let el = cards.get(p.slug);
      if (!el) {
        el = document.createElement('article');
        el.className = 'card reveal';
        cards.set(p.slug, el);
        reveal(el);
      }
      updateCard(el, p);
    }
    for (const [slug, el] of cards) {
      if (!state.bySlug.has(slug)) { el.remove(); cards.delete(slug); }
    }

    const shown = new Set(list.map((p) => p.slug));
    list.forEach((p, i) => {
      const el = cards.get(p.slug);
      el.hidden = false;
      el.style.setProperty('--d', `${Math.min(i, 8) * 70}ms`);
      grid.append(el);
    });
    state.projects.forEach((p) => {
      if (shown.has(p.slug)) return;
      const el = cards.get(p.slug);
      el.hidden = true;
      grid.append(el);
    });

    if (flip) {
      const easing = 'cubic-bezier(.22, 1, .36, 1)';
      list.forEach((p) => {
        const el = cards.get(p.slug);
        const prev = before.get(el);
        if (!prev) {
          el.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing });
          return;
        }
        const now = el.getBoundingClientRect();
        const dx = prev.left - now.left;
        const dy = prev.top - now.top;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 550, easing });
      });
    }

    const total = state.projects.length;
    $('#mod-empty').hidden = list.length > 0 || total === 0;
    $('#results').textContent = state.query || state.filter !== 'all'
      ? `${list.length} of ${total} projects match`
      : `Showing all ${total} projects`;
  }

  function initControls() {
    const search = $('#search');
    let timer = 0;
    search.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.query = search.value; renderGrid(true); }, 120);
    });
    $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(true); });
    $('#filters').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      state.filter = chip.dataset.filter;
      $$('[data-filter]', e.currentTarget).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      renderGrid(true);
    });
    $('#reset-filters').addEventListener('click', () => {
      state.filter = 'all';
      state.query = '';
      search.value = '';
      $$('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === 'all')));
      renderGrid(true);
    });
    document.addEventListener('keydown', (e) => {
      const typing = /^(input|textarea|select)$/i.test(document.activeElement.tagName);
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !$('dialog[open]')) {
        e.preventDefault();
        search.focus({ preventScroll: true });
        search.scrollIntoView({ block: 'center', behavior: motionOK() ? 'smooth' : 'auto' });
      }
    });
  }

  function initCardFx() {
    const grid = $('#mod-grid');
    let target = null;
    let raf = 0;
    let px = 0;
    let py = 0;
    const reset = (card) => {
      const inner = card.firstElementChild;
      if (inner) { inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '0deg'); }
      card.classList.remove('is-tilting');
    };
    const update = () => {
      raf = 0;
      if (!target) return;
      const inner = target.firstElementChild;
      const r = target.getBoundingClientRect();
      const x = (px - r.left) / r.width;
      const y = (py - r.top) / r.height;
      inner.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      inner.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      if (!motionOK()) return;
      target.classList.add('is-tilting');
      inner.style.setProperty('--rx', `${((0.5 - y) * 7).toFixed(2)}deg`);
      inner.style.setProperty('--ry', `${((x - 0.5) * 9).toFixed(2)}deg`);
    };
    grid.addEventListener('pointermove', (e) => {
      if (!finePointer.matches) return;
      const card = e.target.closest('.card:not(.card--skeleton)');
      if (target && target !== card) reset(target);
      target = card;
      px = e.clientX;
      py = e.clientY;
      if (card && !raf) raf = requestAnimationFrame(update);
    });
    grid.addEventListener('pointerleave', () => { if (target) reset(target); target = null; });
  }

  /* ---------- Hero ---------- */

  function renderTapes(list) {
    const a = $('#tape-a');
    const b = $('#tape-b');
    const key = list.map((p) => p.slug).join();
    if (!a || a.dataset.key === key) return;
    a.dataset.key = key;
    const versions = [...new Set(list.flatMap((p) => p.versions))].sort(cmpVersion);
    const words = ['Fabric', 'Paper', 'Client-side', 'Crystal PvP', 'Fair play',
      versions.length ? `MC ${versions[0]} → ${versions[versions.length - 1]}` : '', 'Open source', 'Made by Zymery Dria'].filter(Boolean);
    const strip = (items) => items.map((t) => `<span class="tape__item">${esc(t)}<span class="tape__star">✦</span></span>`).join('').repeat(2);
    const halfA = strip(list.map((p) => p.title));
    const halfB = strip(words);
    a.innerHTML = halfA + halfA;
    b.innerHTML = halfB + halfB;
  }

  const orbit = { items: [], raf: 0, angle: 0, last: 0, w: 0, h: 0, visible: true, slow: false };

  function placeOrbit() {
    const n = orbit.items.length;
    if (!n) return;
    const rx = orbit.w * 0.47;
    const ry = orbit.h * 0.15;
    const tilt = -0.28;
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    orbit.items.forEach((item, i) => {
      const a = orbit.angle + (i / n) * Math.PI * 2;
      const x0 = Math.cos(a) * rx;
      const y0 = Math.sin(a) * ry;
      const depth = Math.sin(a);
      const scale = 0.7 + (depth + 1) * 0.17;
      item.style.transform = `translate3d(${(x0 * cos - y0 * sin).toFixed(1)}px, ${(x0 * sin + y0 * cos).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      item.style.zIndex = depth > 0 ? 3 : 1;
      item.style.opacity = (0.45 + (depth + 1) * 0.275).toFixed(2);
    });
  }

  function startOrbit() {
    if (orbit.raf || !orbit.items.length || !motionOK()) return;
    orbit.last = performance.now();
    const loop = (now) => {
      const dt = Math.min(64, now - orbit.last);
      orbit.last = now;
      orbit.angle += dt * (orbit.slow ? 0.00005 : 0.00017);
      placeOrbit();
      orbit.raf = requestAnimationFrame(loop);
    };
    orbit.raf = requestAnimationFrame(loop);
  }

  function stopOrbit() {
    cancelAnimationFrame(orbit.raf);
    orbit.raf = 0;
  }

  function renderOrbit(list) {
    const el = $('#orbit');
    const key = list.map((p) => p.slug).join();
    if (!el || el.dataset.key === key) return;
    el.dataset.key = key;
    el.innerHTML = list.map((p) => `
      <a class="orbit__item" href="#mod/${esc(p.slug)}" tabindex="-1">
        <img src="${esc(p.icon)}" alt="" width="60" height="60" decoding="async">
        <span class="orbit__tip">${esc(p.title)}</span>
      </a>`).join('');
    orbit.items = $$('.orbit__item', el);
    placeOrbit();
    if (orbit.visible && !document.hidden) startOrbit();
  }

  function initOrbit() {
    const el = $('#orbit');
    if (!el) return;
    const measure = () => { orbit.w = el.clientWidth; orbit.h = el.clientHeight; placeOrbit(); };
    measure();
    new ResizeObserver(measure).observe(el);
    new IntersectionObserver(([entry]) => {
      orbit.visible = entry.isIntersecting;
      if (orbit.visible && !document.hidden) startOrbit(); else stopOrbit();
    }).observe(el);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopOrbit(); else if (orbit.visible) startOrbit();
    });
    el.addEventListener('pointerenter', () => { orbit.slow = true; });
    el.addEventListener('pointerleave', () => { orbit.slow = false; });
  }

  function initTyper() {
    const el = $('#typer');
    const words = CONFIG.typer;
    if (!el || !motionOK()) return;
    let word = 0;
    let chars = words[0].length;
    let deleting = true;
    const tick = () => {
      if (deleting) {
        chars -= 1;
        el.textContent = words[word].slice(0, chars);
        if (chars > 0) return setTimeout(tick, 36);
        deleting = false;
        word = (word + 1) % words.length;
        return setTimeout(tick, 260);
      }
      chars += 1;
      el.textContent = words[word].slice(0, chars);
      if (chars < words[word].length) return setTimeout(tick, 68);
      deleting = true;
      return setTimeout(tick, 2300);
    };
    setTimeout(tick, 2800);
  }

  function initParticles() {
    const canvas = $('#particles');
    if (!canvas || !motionOK()) return;
    const ctx = canvas.getContext('2d');
    const colors = ['#c084fc', '#f472b6', '#ff4fb8', '#a855f7', '#e9d5ff'];
    const mouse = { x: -1e4, y: -1e4 };
    let w = 0;
    let h = 0;
    let parts = [];
    let raf = 0;
    let visible = true;

    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 12,
      s: 1.5 + Math.random() * 3.5,
      vy: 0.15 + Math.random() * 0.5,
      vx: (Math.random() - 0.5) * 0.25,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.02,
      c: colors[(Math.random() * colors.length) | 0],
      p: Math.random() * Math.PI * 2,
      shard: Math.random() < 0.3,
    });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(80, (w * h) / 14000));
      parts = Array.from({ length: count }, () => spawn(true));
    };
    const frame = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const q of parts) {
        const dx = q.x - mouse.x;
        const dy = q.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const d = Math.sqrt(d2) || 1;
          const f = ((14000 - d2) / 14000) * 1.8;
          q.x += (dx / d) * f;
          q.y += (dy / d) * f;
        }
        q.y -= q.vy;
        q.x += q.vx + Math.sin((q.y + q.p * 40) / 70) * 0.2;
        q.r += q.vr;
        if (q.y < -12 || q.x < -20 || q.x > w + 20) Object.assign(q, spawn(false));
        ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t / 700 + q.p));
        ctx.fillStyle = q.c;
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.r);
        if (q.shard) {
          ctx.beginPath();
          ctx.moveTo(0, -q.s * 1.7);
          ctx.lineTo(q.s * 0.8, q.s);
          ctx.lineTo(-q.s * 0.8, q.s);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-q.s / 2, -q.s / 2, q.s, q.s);
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    resize();
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = -1e4; mouse.y = -1e4; });
    start();
  }

  /* ---------- Showcase ---------- */

  function tileHTML(m, index) {
    const ratio = m.w && m.h ? m.w / m.h : 1.4;
    let size = '';
    if (index === 0 && ratio >= 1.1) size = 'tile--big';
    else if (ratio >= 1.7) size = 'tile--wide';
    else if (ratio <= 0.75) size = 'tile--tall';
    const big = size === 'tile--big' || size === 'tile--wide';
    const srcset = m.thumb !== m.full
      ? ` srcset="${esc(m.thumb)} 350w, ${esc(m.full)} ${m.w || 1200}w" sizes="${big ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'}"`
      : '';
    const title = m.title || m.project.title;
    return `
      <figure class="tile reveal ${size}" style="--d: ${(index % 6) * 60}ms">
        <button class="tile__btn" type="button" aria-label="View ${esc(title)} (${esc(m.project.title)})">
          <img class="tile__img" src="${esc(m.full)}"${srcset} alt="" loading="lazy" decoding="async">
          <span class="tile__cap"><img src="${esc(m.project.icon)}" alt="" width="24" height="24" loading="lazy"><span>${esc(title)}</span></span>
        </button>
      </figure>`;
  }

  function wireTile(tile, item) {
    const img = $('.tile__img', tile);
    $('.tile__btn', tile).item = item;
    const done = () => {
      if (item && !item.w && (!img.naturalWidth || !worthy({ w: img.naturalWidth, h: img.naturalHeight }))) {
        item.bad = true;
        tile.remove();
        return;
      }
      tile.classList.add('is-loaded');
    };
    if (img.complete && img.naturalWidth) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', () => { if (item) item.bad = true; tile.remove(); }, { once: true });
    }
  }

  function appendTiles(count) {
    const grid = $('#showcase-grid');
    const next = state.showcaseList.slice(state.showcaseShown, state.showcaseShown + count);
    const html = next.map((m, i) => tileHTML(m, state.showcaseShown + i)).join('');
    grid.insertAdjacentHTML('beforeend', html);
    const tiles = $$('.tile', grid).slice(-next.length);
    tiles.forEach((tile, i) => { wireTile(tile, next[i]); reveal(tile); });
    state.showcaseShown += next.length;
    $('#showcase-more').hidden = state.showcaseShown >= state.showcaseList.length;
  }

  function drawShowcase() {
    $('#showcase-grid').innerHTML = '';
    state.showcaseList = state.showcase.filter((m) => state.showcaseFilter === 'all' || m.project.slug === state.showcaseFilter);
    state.showcaseShown = 0;
    appendTiles(CONFIG.showcaseStep);
  }

  function renderShowcase(list) {
    const lists = list.map((p) => allMedia(p).filter(worthy).map((m) => ({ ...m, project: p })));
    const items = [];
    for (let i = 0; lists.some((l) => i < l.length); i++) {
      for (const l of lists) if (l[i]) items.push(l[i]);
    }
    const key = items.map((m) => m.full).join('|');
    if (key === state.showcaseKey) return;
    state.showcaseKey = key;
    state.showcase = items;

    const withMedia = list.filter((p) => items.some((m) => m.project.slug === p.slug));
    if (!withMedia.some((p) => p.slug === state.showcaseFilter)) state.showcaseFilter = 'all';
    $('#showcase-filters').innerHTML = [
      `<button class="chip" type="button" data-shot="all" aria-pressed="${state.showcaseFilter === 'all'}">All<span class="chip__count">${items.length}</span></button>`,
      ...withMedia.map((p) => `
        <button class="chip" type="button" data-shot="${esc(p.slug)}" aria-pressed="${state.showcaseFilter === p.slug}">
          <img src="${esc(p.icon)}" alt="" width="22" height="22" loading="lazy">${esc(p.title)}
        </button>`),
    ].join('');
    drawShowcase();
  }

  function initShowcase() {
    $('#showcase-filters').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-shot]');
      if (!chip) return;
      state.showcaseFilter = chip.dataset.shot;
      $$('[data-shot]', e.currentTarget).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      drawShowcase();
    });
    $('#showcase-more').addEventListener('click', () => appendTiles(CONFIG.showcaseStep));
    $('#showcase-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('.tile__btn');
      if (!btn || !btn.item) return;
      const items = state.showcaseList.filter((m) => !m.bad);
      openLightbox(items.map((m) => ({ full: m.full, title: m.title, project: m.project })), Math.max(0, items.indexOf(btn.item)));
    });
  }

  /* ---------- Overlays ---------- */

  let lastFocus = null;
  let pushedByClick = false;

  function syncLock() {
    const open = $('#project-dialog').open || $('#lightbox').open || document.body.classList.contains('menu-open');
    document.documentElement.classList.toggle('is-locked', open);
  }

  let purifyHooked = false;
  const EMBED_RE = /^https:\/\/(www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)[\w-]+/;

  function hookPurify(DOMPurify) {
    if (purifyHooked) return;
    purifyHooked = true;
    DOMPurify.addHook('uponSanitizeElement', (node, data) => {
      if (data.tagName !== 'iframe') return;
      const src = (node.getAttribute('src') || '').replace(/^https:\/\/(www\.)?youtube\.com\/embed\//, 'https://www.youtube-nocookie.com/embed/');
      if (EMBED_RE.test(src)) node.setAttribute('src', src);
      else if (node.parentNode) node.parentNode.removeChild(node);
    });
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'IFRAME') {
        node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups');
        node.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
        node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        node.setAttribute('loading', 'lazy');
      }
    });
  }

  function renderMarkdown(md) {
    const { marked, DOMPurify } = window;
    if (!marked || !DOMPurify) return null;
    hookPurify(DOMPurify);
    // Every Discord link points to the current community invite.
    const source = String(md || '').replace(/https?:\/\/(?:www\.)?discord(?:\.gg|(?:app)?\.com\/invite)\/[\w-]+/gi, CONFIG.discord);
    const html = marked.parse(source, { gfm: true, breaks: false });
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allowfullscreen', 'frameborder', 'target'],
      FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'object', 'embed', 'base', 'meta', 'link'],
      FORBID_ATTR: ['style'],
      SANITIZE_NAMED_PROPS: true,
    });
  }

  const slugify = (t) => String(t).toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  // Post-processes sanitized Markdown: resolves repo-relative URLs, hardens links, makes images zoomable.
  function enhanceMarkdown(root, p, bases = {}) {
    root.querySelectorAll('a[href]').forEach((a) => {
      const raw = a.getAttribute('href');
      if (raw.startsWith('#')) {
        let id = raw.slice(1);
        try { id = decodeURIComponent(id); } catch (err) { /* keep it encoded */ }
        a.dataset.anchor = slugify(id);
        a.setAttribute('href', '#');
        return;
      }
      const href = safeUrl(resolveUrl(raw, bases.blob));
      if (!href) { a.removeAttribute('href'); return; }
      a.setAttribute('href', href);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => { h.dataset.anchorId = slugify(h.textContent); });
    root.querySelectorAll('source[srcset], img[srcset]').forEach((s) => {
      const set = s.getAttribute('srcset').split(',').map((part) => {
        const [url, ...rest] = part.trim().split(/\s+/);
        return [safeUrl(resolveUrl(url, bases.raw)), ...rest].join(' ');
      });
      if (set.every((entry) => entry && !entry.startsWith(' '))) s.setAttribute('srcset', set.join(', '));
      else if (s.tagName === 'IMG') s.removeAttribute('srcset');
      else s.remove();
    });
    root.querySelectorAll('table').forEach((table) => {
      const wrap = document.createElement('div');
      wrap.className = 'md-table';
      table.replaceWith(wrap);
      wrap.append(table);
    });

    const items = [];
    const originals = new Map(allMedia(p).map((m) => [mediaKey(m.full), m.full]));
    root.querySelectorAll('img').forEach((img) => {
      const src = safeUrl(resolveUrl(img.getAttribute('src') || '', bases.raw));
      if (!src) { img.remove(); return; }
      img.setAttribute('src', src);
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      if (/shields\.io/i.test(src)) { img.classList.add('md-badge'); return; }
      const title = cleanAlt(img.getAttribute('alt'));
      img.alt = title;
      if (img.closest('a')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'md-zoom';
      btn.dataset.index = String(items.length);
      btn.setAttribute('aria-label', title ? `Enlarge image: ${title}` : 'Enlarge image');
      img.replaceWith(btn);
      btn.append(img);
      items.push({ full: originals.get(mediaKey(src)) || src, title, project: p });
    });
    root.media = items;
  }

  function renderReadme(p) {
    const panel = $('#pd-readme');
    if (!p.repo) { panel.innerHTML = ''; panel.media = []; return; }
    const text = state.readmes.get(p.slug);
    const source = `${blobBase(p.repo)}README.md`;
    const link = `<p class="md-source"><a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${icon('github')}View this README on GitHub</a></p>`;
    const html = text ? renderMarkdown(text) : null;
    if (html == null) {
      panel.innerHTML = `<p class="md-fallback">${text ? 'The README could not be displayed here.' : 'Loading the README…'}</p>${link}`;
      panel.media = [];
      return;
    }
    panel.innerHTML = html + link;
    enhanceMarkdown(panel, p, { raw: rawBase(p.repo), blob: blobBase(p.repo) });
  }

  function renderGallery(p) {
    const media = allMedia(p).filter(worthy);
    const gallery = $('#pd-gallery');
    $('#pd-gallery-count').textContent = media.length;
    $('#tab-gallery').hidden = media.length === 0;
    gallery.innerHTML = media.map((m, i) => `
      <figure class="tile">
        <button class="tile__btn" type="button" data-index="${i}" aria-label="${esc(m.title ? `View ${m.title}` : 'View screenshot')}">
          <img class="tile__img" src="${esc(m.thumb)}" alt="" loading="lazy" decoding="async">
        </button>
      </figure>`).join('');
    $$('.tile', gallery).forEach((tile) => wireTile(tile, null));
    gallery.media = media.map((m) => ({ full: m.full, title: m.title, project: p }));
  }

  const TABS = { desc: ['#tab-desc', '#pd-desc'], readme: ['#tab-readme', '#pd-readme'], gallery: ['#tab-gallery', '#pd-gallery'] };

  function selectTab(which) {
    for (const [name, [tabSel, panelSel]] of Object.entries(TABS)) {
      const on = name === which;
      const tab = $(tabSel);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      $(panelSel).hidden = !on;
    }
  }

  function showProject(p) {
    const d = $('#project-dialog');
    $('.pd__hero-bg', d).style.backgroundImage = `url("${p.icon.replace(/"/g, '%22')}")`;
    const iconEl = $('#pd-icon');
    iconEl.src = p.icon;
    iconEl.alt = `${p.title} icon`;
    $('#pd-title').textContent = p.title;
    $('#pd-summary').textContent = p.summary;
    $('#pd-badges').innerHTML = [
      `<span class="badge">${icon(p.type === 'plugin' ? 'puzzle' : 'package')}${esc(label(p.type))}</span>`,
      ...p.loaders.map((l) => `<span class="badge">${esc(label(l))}</span>`),
      `<span class="badge">${icon('monitor')}${esc(p.env)}</span>`,
    ].join('');

    const ext = 'target="_blank" rel="noopener noreferrer"';
    $('#pd-actions').innerHTML = [
      `<a class="btn btn--primary" href="${esc(p.url)}" ${ext}>${icon('download')}Download on Modrinth</a>`,
      p.github ? `<a class="btn btn--ghost" href="${esc(p.github)}" ${ext}>${icon('github')}Source code</a>` : '',
      p.wiki ? `<a class="btn btn--ghost" href="${esc(p.wiki)}" ${ext}>${icon('book-open')}Wiki</a>` : '',
      p.issues ? `<a class="btn btn--ghost" href="${esc(p.issues)}" ${ext}>${icon('bug')}Report a bug</a>` : '',
      `<a class="btn btn--ghost" href="${CONFIG.discord}" ${ext}>${icon('discord')}Discord</a>`,
    ].join('');

    const stats = [
      ['download', 'Downloads', plain.format(p.downloads)],
      ['heart', 'Followers', plain.format(p.followers)],
      ['package', 'Releases', plain.format(p.releases)],
      ['clock', 'Updated', timeAgo(p.updated)],
      ['calendar', 'Published', dateFmt.format(p.published)],
      ['scale', 'License', licenseName(p.license)],
    ];
    $('#pd-stats').innerHTML = stats.map(([ic, k, v]) => `<div><dt>${icon(ic)}${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    $('#pd-versions').innerHTML = p.versions.map((v) => `<li>${esc(v)}</li>`).join('') || '<li>—</li>';

    state.current = p.slug;
    const desc = $('#pd-desc');
    const html = renderMarkdown(p.body);
    if (html != null) {
      desc.innerHTML = html;
      enhanceMarkdown(desc, p);
    } else {
      desc.innerHTML = `<p>${esc(p.summary)}</p><p class="md-fallback"><a href="${esc(p.url)}" ${ext}>Read the full description on Modrinth</a></p>`;
      desc.media = [];
    }

    $('#tab-readme').hidden = !p.repo;
    renderReadme(p);
    renderGallery(p);

    selectTab('desc');
    if (!d.open) {
      lastFocus = document.activeElement;
      d.showModal();
      syncLock();
    }
    $('.pd__scroll', d).scrollTop = 0;
    document.title = `${p.title} — KoHs Mod Suite`;
  }

  function closeDialogUI() {
    const d = $('#project-dialog');
    if (!d.open || d.classList.contains('is-closing')) return;
    if (!motionOK()) { d.close(); return; }
    d.classList.add('is-closing');
    setTimeout(() => { d.classList.remove('is-closing'); d.close(); }, 280);
  }

  function closeProject() {
    if (/^#mod\//.test(location.hash)) {
      if (pushedByClick) {
        pushedByClick = false;
        history.back();
        return;
      }
      history.replaceState(null, '', location.pathname + location.search);
    }
    closeDialogUI();
  }

  function route() {
    const match = /^#mod\/([\w.-]+)$/.exec(location.hash);
    if (match) {
      const p = state.bySlug.get(decodeURIComponent(match[1]));
      if (p) showProject(p);
      else if (state.ready) history.replaceState(null, '', location.pathname + location.search);
      return;
    }
    pushedByClick = false;
    closeDialogUI();
  }

  const lb = { items: [], index: 0, swiped: false };

  function showLightbox(index) {
    const n = lb.items.length;
    lb.index = (index + n) % n;
    const it = lb.items[lb.index];
    const img = $('#lb-img');
    const same = img.getAttribute('src') === it.full;
    img.classList.add('is-loading');
    img.onload = () => img.classList.remove('is-loading');
    img.onerror = () => img.classList.remove('is-loading');
    img.src = it.full;
    if (same && img.complete) img.classList.remove('is-loading');
    img.alt = it.title || `${it.project.title} screenshot`;
    $('#lb-title').textContent = it.title || it.project.title;
    $('#lb-counter').textContent = n > 1 ? `${lb.index + 1} / ${n}` : '';
    const link = $('#lb-project');
    link.hidden = $('#project-dialog').open;
    link.href = `#mod/${it.project.slug}`;
    link.textContent = `Open ${it.project.title}`;
    $$('.lb__nav').forEach((b) => { b.hidden = n < 2; });
    if (n > 1) [1, -1].forEach((step) => { new Image().src = lb.items[(lb.index + step + n) % n].full; });
  }

  function openLightbox(items, index) {
    if (!items.length) return;
    lb.items = items;
    showLightbox(index || 0);
    const d = $('#lightbox');
    if (!d.open) {
      if (!$('#project-dialog').open) lastFocus = document.activeElement;
      d.showModal();
      syncLock();
    }
  }

  function initDialogs() {
    const d = $('#project-dialog');
    const baseTitle = document.title;
    const box = $('#lightbox');

    document.addEventListener('click', (e) => {
      if (e.target.closest('a[href^="#mod/"]')) pushedByClick = true;
    }, true);
    addEventListener('hashchange', route);

    d.addEventListener('cancel', (e) => { e.preventDefault(); closeProject(); });
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]')) { closeProject(); return; }
      const anchor = e.target.closest('a[data-anchor]');
      if (anchor) {
        e.preventDefault();
        const panel = anchor.closest('.md');
        const target = panel && $$('[data-anchor-id]', panel).find((h) => h.dataset.anchorId === anchor.dataset.anchor);
        if (target) target.scrollIntoView({ block: 'start', behavior: motionOK() ? 'smooth' : 'auto' });
        return;
      }
      const zoom = e.target.closest('.md-zoom');
      if (zoom) openLightbox(zoom.closest('.md').media || [], Number(zoom.dataset.index));
      const tileBtn = e.target.closest('#pd-gallery .tile__btn');
      if (tileBtn) openLightbox($('#pd-gallery').media || [], Number(tileBtn.dataset.index));
    });
    d.addEventListener('close', () => {
      state.current = null;
      document.title = baseTitle;
      syncLock();
      if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
    });

    const tabs = Object.entries(TABS).map(([name, [tabSel]]) => [name, $(tabSel)]);
    tabs.forEach(([name, tab]) => {
      tab.addEventListener('click', () => selectTab(name));
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const visible = tabs.filter(([, t]) => !t.hidden);
        const at = visible.findIndex(([, t]) => t === tab);
        const [nextName, nextTab] = visible[(at + (e.key === 'ArrowRight' ? 1 : -1) + visible.length) % visible.length];
        nextTab.focus();
        selectTab(nextName);
      });
    });

    box.addEventListener('click', (e) => {
      if (lb.swiped) { lb.swiped = false; return; }
      const step = e.target.closest('[data-step]');
      if (step) { showLightbox(lb.index + Number(step.dataset.step)); return; }
      if (e.target.closest('[data-close]') || e.target === box || e.target.classList.contains('lb__stage')) box.close();
      if (e.target.closest('#lb-project')) box.close();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') showLightbox(lb.index + 1);
      if (e.key === 'ArrowLeft') showLightbox(lb.index - 1);
    });
    box.addEventListener('close', () => {
      syncLock();
      if (!d.open && lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
    });
    let startX = null;
    const stage = $('.lb__stage', box);
    stage.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50 && lb.items.length > 1) {
        lb.swiped = true;
        showLightbox(lb.index + (dx < 0 ? 1 : -1));
      }
    });
  }

  /* ---------- Page chrome ---------- */

  function hidePreloader() {
    const el = $('#preloader');
    if (!el || el.classList.contains('is-done')) return;
    el.classList.add('is-done');
    setTimeout(() => el.remove(), 800);
  }

  const revealIO = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 })
    : null;

  function reveal(el) {
    if (revealIO && motionOK()) revealIO.observe(el);
    else el.classList.add('is-in');
  }

  function initTheme() {
    const btn = $('#theme-toggle');
    const root = document.documentElement;
    const sync = () => btn.setAttribute('aria-label', root.dataset.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    sync();
    btn.addEventListener('click', (e) => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      const applyTheme = () => {
        root.dataset.theme = next;
        try { localStorage.setItem('kohs-theme', next); } catch (err) { /* storage unavailable */ }
        sync();
      };
      if (!document.startViewTransition || !motionOK()) { applyTheme(); return; }
      const rect = btn.getBoundingClientRect();
      const x = e.clientX || rect.left + rect.width / 2;
      const y = e.clientY || rect.top + rect.height / 2;
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(applyTheme).ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(.65, 0, .35, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      }).catch(() => {});
    });
  }

  function initNav() {
    const nav = $('#nav');
    const toggle = $('#nav-toggle');
    const menu = $('#nav-menu');
    const toTop = $('#to-top');
    const bar = $('.scroll-progress');

    const setMenu = (open) => {
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      syncLock();
    };
    toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });
    matchMedia('(min-width: 1100px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle('is-scrolled', y > 8);
      bar.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : '0');
      toTop.classList.toggle('is-visible', y > innerHeight * 1.2);
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: motionOK() ? 'smooth' : 'auto' }));

    const links = $$('[data-nav]');
    const spy = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === entry.target.id));
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['mods', 'soon', 'showcase', 'about', 'services', 'discord'].forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
    spy.observe($('.hero'));
  }

  function initMagnetic() {
    if (!finePointer.matches || !motionOK()) return;
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--tx', `${(((e.clientX - r.left) / r.width) - 0.5) * 10}px`);
        el.style.setProperty('--ty', `${(((e.clientY - r.top) / r.height) - 0.5) * 8}px`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--tx', '0px');
        el.style.setProperty('--ty', '0px');
      });
    });
  }

  async function loadDiscord() {
    try {
      const data = await fetchJSON(`https://discord.com/api/v10/invites/${CONFIG.discordCode}?with_counts=true`, 8000);
      const guild = data.guild || {};
      if (typeof guild.name === 'string' && guild.name) $$('[data-discord="name"]').forEach((el) => { el.textContent = guild.name; });
      if (Number.isFinite(data.approximate_member_count)) {
        $('[data-discord="members"]').textContent = plain.format(data.approximate_member_count);
        $('[data-discord="online"]').textContent = plain.format(Number(data.approximate_presence_count) || 0);
        $('#discord-live').hidden = false;
      }
      // Only switch away from the bundled icon if the server changed it (ids validated before use).
      if (/^\d+$/.test(guild.id || '') && /^(a_)?[0-9a-f]{32}$/.test(guild.icon || '') && guild.icon !== CONFIG.discordIcon) {
        const img = $('#discord-icon');
        const next = new Image();
        next.onload = () => { img.src = next.src; };
        next.src = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'webp'}?size=256`;
      }
    } catch (err) {
      /* Discord unreachable: the static invite still works. */
    }
  }

  /* ---------- Services & request form ---------- */

  const fmtBytes = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
  const extOf = (name) => (name.includes('.') ? name.split('.').pop() : '').toLowerCase();

  function initOrder() {
    const form = $('#order-form');
    if (!form) return;
    const select = $('#f-service');
    const message = $('#f-message');
    const counter = $('#f-message-count');
    const picker = $('#f-files');
    const drop = $('#drop');
    const list = $('#files');
    const error = $('#order-error');
    const submit = $('#order-submit');
    const done = $('#order-done');
    const limits = CONFIG.upload;
    const canAttach = (() => { try { return Boolean(new DataTransfer().items); } catch (err) { return false; } })();
    let files = [];

    $$('[data-service]').forEach((btn) => btn.addEventListener('click', () => {
      select.value = btn.dataset.service;
      $('#request').scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'start' });
      setTimeout(() => message.focus({ preventScroll: true }), motionOK() ? 700 : 0);
    }));

    const showError = (text) => { error.textContent = text; error.hidden = !text; };
    const count = () => { counter.textContent = `${message.value.length} / ${message.maxLength}`; };
    message.addEventListener('input', count);
    count();

    const renderFiles = () => {
      list.replaceChildren(...files.map((file, i) => {
        const li = document.createElement('li');
        li.className = 'file';
        if (/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
          const img = document.createElement('img');
          img.alt = '';
          img.src = URL.createObjectURL(file);
          img.onload = () => URL.revokeObjectURL(img.src);
          li.append(img);
        } else {
          li.insertAdjacentHTML('beforeend', icon('file-text'));
        }
        const name = document.createElement('span');
        name.className = 'file__name';
        name.textContent = file.name;
        const size = document.createElement('small');
        size.textContent = fmtBytes(file.size);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'file__remove';
        remove.setAttribute('aria-label', `Remove ${file.name}`);
        remove.insertAdjacentHTML('beforeend', icon('trash-2'));
        remove.addEventListener('click', () => { files.splice(i, 1); renderFiles(); showError(''); });
        li.append(name, size, remove);
        return li;
      }));
      drop.classList.toggle('has-files', files.length > 0);
    };

    const addFiles = (incoming) => {
      const problems = [];
      for (const file of incoming) {
        const total = files.reduce((n, f) => n + f.size, 0);
        if (!limits.types.includes(extOf(file.name))) problems.push(`${file.name}: this file type is not allowed`);
        else if (files.some((f) => f.name === file.name && f.size === file.size)) continue;
        else if (files.length >= limits.maxFiles) problems.push(`You can attach up to ${limits.maxFiles} files`);
        else if (total + file.size > limits.maxBytes) problems.push(`${file.name}: attachments are limited to 10 MB in total`);
        else files.push(file);
      }
      renderFiles();
      showError([...new Set(problems)].join(' · '));
    };

    if (canAttach) {
      picker.addEventListener('change', () => { addFiles([...picker.files]); picker.value = ''; });
      ['dragenter', 'dragover'].forEach((type) => drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
      ['dragleave', 'drop'].forEach((type) => drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
      drop.addEventListener('drop', (e) => addFiles([...((e.dataTransfer && e.dataTransfer.files) || [])]));
    } else {
      picker.name = 'attachment';
      picker.multiple = false;
    }

    const setBusy = (busy) => {
      submit.disabled = busy;
      submit.classList.toggle('is-busy', busy);
      $('span', submit).textContent = busy ? 'Sending…' : 'Send request';
    };
    addEventListener('pageshow', (e) => { if (e.persisted) setBusy(false); });

    const problemWith = (field) => {
      if (field.id === 'f-name') return 'Please enter your name.';
      if (field.id === 'f-email') return 'Please enter a valid email so Zymekoh can reply.';
      return field.validity.tooShort ? 'Please describe your request in at least 20 characters.' : 'Please write a message.';
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showError('');
      const fields = [$('#f-name'), $('#f-email'), message];
      fields.forEach((f) => {
        f.value = f.value.trim();
        f.setAttribute('aria-invalid', String(!f.checkValidity()));
      });
      const invalid = fields.find((f) => !f.checkValidity());
      if (invalid) { showError(problemWith(invalid)); invalid.focus(); return; }
      // Browsers without DataTransfer submit the picker itself, so its file is checked here instead.
      const single = !canAttach && picker.files[0];
      if (single && !limits.types.includes(extOf(single.name))) { showError(`${single.name}: this file type is not allowed`); return; }
      if (single && single.size > limits.maxBytes) { showError(`${single.name}: attachments are limited to 10 MB in total`); return; }
      if (form.elements.namedItem('_honey').value) return;

      let last = 0;
      try { last = Number(sessionStorage.getItem('kohs-order-at')) || 0; } catch (err) { /* storage unavailable */ }
      if (Date.now() - last < 60000) { showError('Please wait a minute before sending another request.'); return; }

      $$('.order__attachment', form).forEach((el) => el.remove());
      if (canAttach) {
        files.forEach((file, i) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.name = i ? `attachment_${i + 1}` : 'attachment';
          input.className = 'order__attachment';
          input.hidden = true;
          const dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;
          form.append(input);
        });
      }

      const page = `${location.origin}${location.pathname}`;
      form.elements.namedItem('_next').value = `${page}?sent=1#request`;
      form.elements.namedItem('_url').value = page;
      form.action = CONFIG.formEndpoint;
      setBusy(true);
      try { sessionStorage.setItem('kohs-order-at', String(Date.now())); } catch (err) { /* storage unavailable */ }
      HTMLFormElement.prototype.submit.call(form);
    });

    if (new URLSearchParams(location.search).get('sent') === '1') {
      form.hidden = true;
      done.hidden = false;
      history.replaceState(null, '', location.pathname + location.hash);
      requestAnimationFrame(() => done.focus({ preventScroll: true }));
    }
    $('#order-again').addEventListener('click', () => {
      form.reset();
      files = [];
      renderFiles();
      count();
      showError('');
      setBusy(false);
      done.hidden = true;
      form.hidden = false;
      $('#f-name').focus();
    });
  }

  function init() {
    $('#year').textContent = String(new Date().getFullYear());
    initTheme();
    initNav();
    initControls();
    initCardFx();
    initShowcase();
    initDialogs();
    initOrbit();
    initTyper();
    initParticles();
    initMagnetic();
    initOrder();
    $$('.reveal').forEach(reveal);
    $$('.counter').forEach((el) => counterIO.observe(el));
    setTimeout(hidePreloader, 1800);
    loadData();
    loadDiscord();
  }

  init();
})();
