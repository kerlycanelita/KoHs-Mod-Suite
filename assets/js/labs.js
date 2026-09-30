/* KoHs Mod Suite — Labs */
(() => {
  'use strict';

  const DATA_URL = 'assets/data/labs.json';
  const INTRO_KEY = 'kohs-labs-intro';
  const LANG_KEY = 'kohs-lang';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOK = () => !reduceMotion.matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- Strings ---------- */

  const STR = {
    en: {
      'doc.title': 'KoHs Laboratories — tests, figures and charts of the new KoHs mods',
      skip: 'Skip to the labs',
      'intro.eyebrow': '// restricted area · access granted',
      'intro.msg': 'Here you will find complete tests — with documentation, figures and charts — of the new generation of KoHs mods.',
      'intro.enter': 'Enter the lab',
      'intro.skip': 'Skip intro',
      'intro.lines': [
        ['> booting the KoHs lab rig', ''],
        ['> server 26.2 · Grim Anticheat 2.3.74 ', '[OK]'],
        ["> latency · Ravenclaw's Ping Equalizer · +0…150 ms ", '[OK]'],
        ['> calibration probe → BadPacketsA ', '[SEEN]'],
        ['> 3 labs · 7,860+ cycles · 0 alerts on shipped builds', ''],
      ],
      'nav.mods': 'Mods', 'nav.showcase': 'Showcase', 'nav.about': 'About', 'nav.services': 'Services', 'nav.community': 'Community',
      'hero.lead': 'Complete tests — with documentation, figures and charts — of the new generation of KoHs mods.',
      'hero.sub': ['Every number comes from a real run against ', { b: 'Grim Anticheat' }, ', with latency from ', { b: "Ravenclaw's Ping Equalizer" }, '.'],
      'hero.cta': 'Open the labs',
      'hero.replay': 'Replay the entry',
      'stat.labs': 'Labs', 'stat.cycles': 'Cycles', 'stat.lag': 'Lag tested', 'stat.alerts': 'Grim alerts',
      'labs.eyebrow': '// on the bench',
      'labs.title': 'The labs',
      'labs.sub': 'One lab per mod of the new generation. Pick a chart, read the note under it, and open the full write-up for the method and the raw numbers.',
      'labs.loading': 'Warming up the rig…',
      'labs.error': 'The lab data could not be loaded. The write-ups are still one click away:',
      'lab.pending': 'This lab has run, and its write-up is still in the forge. Its figures and charts land here the day it is public.',
      'lab.figures': 'Key figures',
      'rig.eyebrow': '// the rig',
      'rig.title': 'How a lab runs',
      'rig.sub': 'A real client and a real server on one machine, one clock for both, and nothing trusted until the anticheat proves it is listening.',
      'rig.caption': "Keys go in through Minecraft's own keyboard and mouse handlers; packets and Grim's alerts come out in one trace, stamped by the same microsecond clock.",
      'gate.local.t': 'Local only',
      'gate.local.p': 'The bench refuses any server that is not on the same machine, and does nothing unless the game was started for the lab.',
      'gate.probe.t': 'Calibrated',
      'gate.probe.p': 'Every session sends one deliberately wrong packet. If Grim does not flag it, the session\'s "no alerts" does not count.',
      'gate.fair.t': 'Fair play first',
      'gate.fair.p': 'Nothing a mod ships may create, repeat or send a click early. An idea that trips the anticheat is measured, written up — and dropped.',
      'gate.open.t': 'Written up',
      'gate.open.p': "Each lab ends in a public write-up in the mod's repository: the setup, the tables, what failed and why.",
      'tools.eyebrow': '// open source on the bench',
      'tools.title': 'Tools we test with',
      'tools.sub': 'Public projects the labs are built on. They belong to their authors and keep their own licenses — go give them a star.',
      'cta.title': 'Found something odd?',
      'cta.text': 'Bring it to the Discord. A good report becomes the next bench — and the next chart on this page.',
      'cta.discord': 'Join the Discord',
      'cta.mods': 'Browse the mods',
      'footer.tag': 'Minecraft mods & plugins by Zymery Dria.',
      'footer.explore': 'Explore', 'footer.mods': 'Mods & plugins', 'footer.soon': 'Coming soon', 'footer.elsewhere': 'Elsewhere',
      'footer.data': 'Lab figures from the write-ups linked on each lab.',
      'footer.legal': 'Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.',
      'tape': ['KoHs Laboratories', 'Grim Anticheat', "Ravenclaw's Ping Equalizer", '7,860+ cycles', '0 alerts shipped', 'Herzium', "KoHs Anchor's", 'Inventory Tweaks', 'every click traced'],
      'x.latency': 'added latency',
      'chart.aria': 'Chart',
      'link.github': 'GitHub',
      'link.modrinth': 'Modrinth',
      'flow.client': 'CLIENT', 'flow.c1': 'KoHs mod', 'flow.c3': 'bench · real keys',
      'flow.server': 'SERVER 26.2', 'flow.s2': 'verbose alerts', 'flow.s3': 'µs packet trace',
      'flow.analysis': 'ANALYSIS', 'flow.a1': 'item per click', 'flow.a2': 'packets per tick', 'flow.a3': 'alerts · charts',
    },
    es: {
      'doc.title': 'KoHs Laboratories — pruebas, cifras y gráficas de los nuevos mods de KoHs',
      skip: 'Saltar a los laboratorios',
      'intro.eyebrow': '// zona restringida · acceso concedido',
      'intro.msg': 'Aquí encontrarás pruebas completas —con documentación, cifras y gráficas— de los mods de la nueva generación de KoHs.',
      'intro.enter': 'Entrar al laboratorio',
      'intro.skip': 'Saltar intro',
      'intro.lines': [
        ['> arrancando el rig de laboratorio KoHs', ''],
        ['> servidor 26.2 · Grim Anticheat 2.3.74 ', '[OK]'],
        ["> latencia · Ravenclaw's Ping Equalizer · +0…150 ms ", '[OK]'],
        ['> sonda de calibración → BadPacketsA ', '[VISTA]'],
        ['> 3 laboratorios · 7860+ ciclos · 0 alertas en lo publicado', ''],
      ],
      'nav.mods': 'Mods', 'nav.showcase': 'Galería', 'nav.about': 'Sobre mí', 'nav.services': 'Servicios', 'nav.community': 'Comunidad',
      'hero.lead': 'Pruebas completas —con documentación, cifras y gráficas— de los mods de la nueva generación de KoHs.',
      'hero.sub': ['Cada número sale de una ejecución real contra ', { b: 'Grim Anticheat' }, ', con la latencia de ', { b: "Ravenclaw's Ping Equalizer" }, '.'],
      'hero.cta': 'Abrir los laboratorios',
      'hero.replay': 'Repetir la entrada',
      'stat.labs': 'Laboratorios', 'stat.cycles': 'Ciclos', 'stat.lag': 'Lag probado', 'stat.alerts': 'Alertas de Grim',
      'labs.eyebrow': '// en el banco de pruebas',
      'labs.title': 'Los laboratorios',
      'labs.sub': 'Un laboratorio por cada mod de la nueva generación. Elige una gráfica, lee la nota de abajo y abre el informe completo para ver el método y los números en bruto.',
      'labs.loading': 'Calentando el rig…',
      'labs.error': 'No se pudieron cargar los datos del laboratorio. Los informes siguen a un clic:',
      'lab.pending': 'Este laboratorio ya se ejecutó y su informe sigue en la forja. Sus cifras y gráficas llegan aquí el día que sea público.',
      'lab.figures': 'Cifras clave',
      'rig.eyebrow': '// el rig',
      'rig.title': 'Cómo funciona un laboratorio',
      'rig.sub': 'Un cliente real y un servidor real en la misma máquina, un solo reloj para los dos, y nada se da por bueno hasta que el anticheat demuestra que está escuchando.',
      'rig.caption': 'Las teclas entran por los propios manejadores de teclado y ratón de Minecraft; los paquetes y las alertas de Grim salen en una sola traza, marcada por el mismo reloj de microsegundos.',
      'gate.local.t': 'Solo en local',
      'gate.local.p': 'El banco rechaza cualquier servidor que no esté en la misma máquina, y no hace nada si el juego no se abrió para el laboratorio.',
      'gate.probe.t': 'Calibrado',
      'gate.probe.p': 'Cada sesión envía un paquete incorrecto a propósito. Si Grim no lo marca, el «sin alertas» de esa sesión no cuenta.',
      'gate.fair.t': 'Juego limpio primero',
      'gate.fair.p': 'Nada de lo que publica un mod puede crear, repetir ni adelantar un clic. Una idea que dispara el anticheat se mide, se documenta… y se descarta.',
      'gate.open.t': 'Documentado',
      'gate.open.p': 'Cada laboratorio termina en un informe público en el repositorio del mod: el montaje, las tablas, lo que falló y por qué.',
      'tools.eyebrow': '// código abierto en el banco',
      'tools.title': 'Herramientas con las que probamos',
      'tools.sub': 'Proyectos públicos sobre los que se montan los laboratorios. Son de sus autores y mantienen sus propias licencias: pásate a darles una estrella.',
      'cta.title': '¿Encontraste algo raro?',
      'cta.text': 'Tráelo al Discord. Un buen reporte se convierte en el próximo banco de pruebas… y en la próxima gráfica de esta página.',
      'cta.discord': 'Únete al Discord',
      'cta.mods': 'Ver los mods',
      'footer.tag': 'Mods y plugins de Minecraft por Zymery Dria.',
      'footer.explore': 'Explorar', 'footer.mods': 'Mods y plugins', 'footer.soon': 'Próximamente', 'footer.elsewhere': 'En otros sitios',
      'footer.data': 'Las cifras de los laboratorios salen de los informes enlazados en cada uno.',
      'footer.legal': 'No es un producto oficial de Minecraft. No está aprobado ni asociado con Mojang ni Microsoft.',
      'tape': ['KoHs Laboratories', 'Grim Anticheat', "Ravenclaw's Ping Equalizer", '7860+ ciclos', '0 alertas publicadas', 'Herzium', "KoHs Anchor's", 'Inventory Tweaks', 'cada clic rastreado'],
      'x.latency': 'latencia añadida',
      'chart.aria': 'Gráfica',
      'link.github': 'GitHub',
      'link.modrinth': 'Modrinth',
      'flow.client': 'CLIENTE', 'flow.c1': 'mod de KoHs', 'flow.c3': 'banco · teclas reales',
      'flow.server': 'SERVIDOR 26.2', 'flow.s2': 'alertas detalladas', 'flow.s3': 'traza en µs',
      'flow.analysis': 'ANÁLISIS', 'flow.a1': 'objeto por clic', 'flow.a2': 'paquetes por tick', 'flow.a3': 'alertas · gráficas',
    },
  };

  function detectLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch (err) { /* storage unavailable */ }
    const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    return langs.some((l) => /^es\b/i.test(l)) ? 'es' : 'en';
  }

  let lang = detectLang();
  let data = null;
  const t = (key) => (STR[lang] && key in STR[lang] ? STR[lang][key] : STR.en[key] ?? key);
  const tx = (value) => (value == null ? '' : typeof value === 'string' ? value : (value[lang] ?? value.en ?? ''));
  const nf = (value, decimals = 0) => new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: Math.abs(value) >= 10000 || lang !== 'es' ? true : false,
  }).format(value);

  /* ---------- DOM helpers ---------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function svg(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  function icon(id, className = 'icon') {
    const s = svg('svg', { class: className, 'aria-hidden': 'true' });
    s.append(svg('use', { href: `#${id}` }));
    return s;
  }

  function safeUrl(url) {
    try {
      const u = new URL(url, location.href);
      return u.protocol === 'https:' ? u.href : null;
    } catch (err) { return null; }
  }

  /* ---------- Language ---------- */

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t('doc.title');
    $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    // Only this page's own strings, never data from elsewhere.
    $$('[data-i18n-html]').forEach((node) => {
      node.textContent = '';
      for (const part of t(node.dataset.i18nHtml)) {
        node.append(typeof part === 'string' ? document.createTextNode(part) : el('strong', null, part.b));
      }
    });
    $$('[data-lang-label]').forEach((node) => { node.textContent = lang === 'en' ? 'ES' : 'EN'; });
    $$('[data-lang-toggle]').forEach((btn) => btn.setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English'));
    renderTapes();
    if (data) renderData();
  }

  function initLang() {
    $$('[data-lang-toggle]').forEach((btn) => btn.addEventListener('click', () => {
      lang = lang === 'en' ? 'es' : 'en';
      try { localStorage.setItem(LANG_KEY, lang); } catch (err) { /* storage unavailable */ }
      btn.classList.remove('is-flip');
      void btn.offsetWidth;
      btn.classList.add('is-flip');
      applyLang();
      if (!$('#lab-intro').hidden) typeIntro(true);
    }));
  }

  /* ---------- Theme & navigation ---------- */

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

  function syncLock() {
    const locked = document.body.classList.contains('menu-open');
    document.documentElement.classList.toggle('is-locked', locked);
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
  }

  function initMagnetic(root = document) {
    if (!finePointer.matches || !motionOK()) return;
    $$('.magnetic', root).forEach((node) => {
      if (node.dataset.magnetic) return;
      node.dataset.magnetic = '1';
      node.addEventListener('pointermove', (e) => {
        const r = node.getBoundingClientRect();
        node.style.setProperty('--tx', `${(((e.clientX - r.left) / r.width) - 0.5) * 10}px`);
        node.style.setProperty('--ty', `${(((e.clientY - r.top) / r.height) - 0.5) * 8}px`);
      });
      node.addEventListener('pointerleave', () => {
        node.style.setProperty('--tx', '0px');
        node.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ---------- Reveal, counters and charts on screen ---------- */

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target;
        if (target.classList.contains('reveal')) target.classList.add('is-in');
        if (target.classList.contains('counter')) countUp(target);
        if (target.classList.contains('chart') && !target.hidden) playChart(target);
        obs.unobserve(target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    : null;

  function watch(node) {
    if (io && motionOK()) { io.observe(node); return; }
    if (node.classList.contains('reveal')) node.classList.add('is-in');
    if (node.classList.contains('counter')) countUp(node, true);
    if (node.classList.contains('chart') && !node.hidden) playChart(node, true);
  }

  function countUp(node, instant = false) {
    const target = Number(node.dataset.count);
    const decimals = Number(node.dataset.decimals || 0);
    if (!Number.isFinite(target)) return;
    if (instant || !motionOK() || target === 0) { node.textContent = nf(target, decimals); return; }
    const start = performance.now();
    const duration = 1400;
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      node.textContent = nf(target * eased, p < 1 ? decimals : decimals);
      if (p < 1) requestAnimationFrame(step);
      else node.textContent = nf(target, decimals);
    };
    requestAnimationFrame(step);
  }

  function playChart(chart, instant = false) {
    if (chart.classList.contains('is-played')) return;
    chart.classList.add('is-played');
    $$('.ledger__value', chart).forEach((node) => countUp(node, instant));
    if (instant || !motionOK()) return;
    // A burst of sparks where a bar reaches the top.
    $$('.bar--hot', chart).forEach((bar) => {
      if (Number(bar.dataset.v) < 1) return;
      const delay = parseFloat(getComputedStyle(bar).getPropertyValue('--bd')) || 0;
      setTimeout(() => {
        const fill = $('.bar__fill', bar);
        const r = fill.getBoundingClientRect();
        if (r.width > 0 && r.top < innerHeight && r.bottom > 0) sparks(r.right, r.top + r.height / 2, 7);
      }, delay + 1050);
    });
  }

  /* ---------- Sparks ---------- */

  const SPARK_COLORS = ['#ff4fb8', '#e879f9', '#a855f7', '#d8b4fe', '#ffffff'];

  function sparks(x, y, count = 14, spread = 70) {
    if (!motionOK()) return;
    for (let i = 0; i < count; i++) {
      const s = el('span', 'spark');
      const angle = Math.random() * Math.PI * 2;
      const dist = spread * (0.45 + Math.random() * 0.75);
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      s.style.setProperty('--dy', `${Math.sin(angle) * dist - 12}px`);
      s.style.setProperty('--r', `${Math.round(Math.random() * 540 - 270)}deg`);
      s.style.setProperty('--c', SPARK_COLORS[i % SPARK_COLORS.length]);
      document.body.append(s);
      s.addEventListener('animationend', () => s.remove(), { once: true });
    }
  }

  /* ---------- Entry notice ---------- */

  let typing = 0;

  function typeIntro(instant = false) {
    const term = $('#lab-intro-term');
    const intro = $('#lab-intro');
    const lines = t('intro.lines');
    const run = ++typing;
    term.textContent = '';
    intro.classList.remove('is-ready');
    const finish = () => {
      if (run !== typing) return;
      const cursor = el('span', 'cursor');
      term.append(cursor);
      intro.classList.add('is-ready');
      if (document.activeElement === document.body || !intro.contains(document.activeElement)) $('#lab-intro-enter').focus({ preventScroll: true });
    };
    const writeLine = (index) => {
      const [text, badge] = lines[index];
      const line = el('span');
      term.append(line);
      if (instant || !motionOK()) {
        line.textContent = text;
        if (badge) line.append(el('span', badge.startsWith('[OK') ? 'ok' : 'hot', badge));
        term.append('\n');
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        let i = 0;
        const tick = () => {
          if (run !== typing) return;
          line.textContent = text.slice(0, i);
          if (i++ < text.length) { setTimeout(tick, 11 + Math.random() * 16); return; }
          if (badge) line.append(el('span', badge.startsWith('[OK') ? 'ok' : 'hot', badge));
          term.append('\n');
          setTimeout(resolve, 120);
        };
        tick();
      });
    };
    lines.reduce((p, _, i) => p.then(() => (run === typing ? writeLine(i) : null)), Promise.resolve()).then(finish);
  }

  function openIntro() {
    const intro = $('#lab-intro');
    intro.classList.remove('is-opening');
    intro.hidden = false;
    document.documentElement.classList.add('labs-intro-open');
    typeIntro();
  }

  function closeIntro(origin) {
    const intro = $('#lab-intro');
    if (intro.hidden || intro.classList.contains('is-opening')) return;
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch (err) { /* storage unavailable */ }
    typing++;
    if (!motionOK()) {
      intro.hidden = true;
      document.documentElement.classList.remove('labs-intro-open');
      return;
    }
    if (origin) {
      const r = origin.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const shock = el('span', 'lab-intro__shock');
      shock.style.left = `${cx}px`;
      shock.style.top = `${cy}px`;
      document.body.append(shock);
      shock.addEventListener('animationend', () => shock.remove(), { once: true });
      sparks(cx, cy, 26, 150);
    }
    intro.classList.add('is-opening');
    setTimeout(() => {
      intro.hidden = true;
      intro.classList.remove('is-opening');
      document.documentElement.classList.remove('labs-intro-open');
      const title = $('.labs-hero .hero__kohs');
      if (title) {
        title.classList.remove('is-burst');
        void title.offsetWidth;
        title.classList.add('is-burst');
      }
    }, 1000);
  }

  function initIntro() {
    const intro = $('#lab-intro');
    const enter = $('#lab-intro-enter');
    enter.addEventListener('click', () => closeIntro(enter));
    $('#lab-intro-skip').addEventListener('click', () => closeIntro(null));
    $('#replay-intro').addEventListener('click', openIntro);
    intro.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeIntro(null); return; }
      if (e.key !== 'Tab') return;
      const focusables = $$('button', intro).filter((b) => b.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_KEY) === '1'; } catch (err) { /* storage unavailable */ }
    if (!seen || new URLSearchParams(location.search).has('intro')) openIntro();
  }

  /* ---------- Hero: bubbles and orbit ---------- */

  function initBubbles() {
    const canvas = $('#bubbles');
    if (!canvas || !motionOK()) return;
    const ctx = canvas.getContext('2d');
    let w = 0; let h = 0; let dpr = 1; let raf = 0; let visible = true;
    const bubbles = [];
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 1.2 + Math.random() * 3.6,
      v: 0.25 + Math.random() * 0.7,
      wob: Math.random() * Math.PI * 2,
      a: 0.15 + Math.random() * 0.45,
    });
    resize();
    const count = Math.round(Math.min(46, w / 26));
    for (let i = 0; i < count; i++) bubbles.push(spawn(true));
    const frame = () => {
      raf = 0;
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const b of bubbles) {
        b.y -= b.v; b.wob += 0.02;
        const x = b.x + Math.sin(b.wob) * 6;
        if (b.y < -10) Object.assign(b, spawn(false));
        ctx.beginPath();
        ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 121, 249, ${b.a})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    addEventListener('resize', resize, { passive: true });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(canvas);
  }

  function renderOrbit() {
    const orbit = $('#labs-orbit');
    if (!orbit || !data) return;
    orbit.textContent = '';
    const items = data.labs.map((lab) => {
      const item = el('div', 'labs-orbit__item');
      const img = el('img');
      img.alt = '';
      img.width = 56; img.height = 56;
      img.loading = 'lazy';
      img.src = lab.icon;
      img.addEventListener('error', () => item.remove(), { once: true });
      item.append(img);
      orbit.append(item);
      return item;
    });
    let angle = 0; let last = performance.now(); let raf = 0; let visible = true;
    const place = () => {
      const rx = orbit.clientWidth * 0.44;
      const ry = orbit.clientHeight * 0.36;
      items.forEach((item, i) => {
        const a = angle + (i / items.length) * Math.PI * 2;
        const depth = (Math.sin(a) + 1) / 2;
        item.style.transform = `translate(${Math.cos(a) * rx}px, ${Math.sin(a) * ry}px) scale(${0.78 + depth * 0.32})`;
        item.style.zIndex = String(depth > 0.5 ? 4 : 1);
        item.style.opacity = String(0.55 + depth * 0.45);
      });
    };
    const frame = (now) => {
      raf = 0;
      if (!visible) return;
      angle += ((now - last) / 1000) * 0.32;
      last = now;
      place();
      raf = requestAnimationFrame(frame);
    };
    place();
    if (!motionOK()) return;
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      last = performance.now();
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(orbit);
  }

  function renderTapes() {
    const words = t('tape');
    for (const [id, list] of [['#tape-a', words], ['#tape-b', [...words].reverse()]]) {
      const track = $(id);
      if (!track) continue;
      track.textContent = '';
      for (let copy = 0; copy < 2; copy++) {
        for (const word of list) {
          const item = el('span', 'tape__item', word);
          item.append(el('span', 'tape__star', ' ✦'));
          track.append(item);
        }
      }
    }
  }

  /* ---------- Charts ---------- */

  let uid = 0;

  function legend(series) {
    const ul = el('ul', 'chart__legend');
    for (const s of series) {
      const li = el('li');
      li.append(el('span', `chart__swatch chart__swatch--${s.tone}`), document.createTextNode(tx(s.name)));
      ul.append(li);
    }
    return ul;
  }

  function fmt(value, unit) {
    const decimals = Number.isInteger(value) ? 0 : 1;
    return `${nf(value, decimals)}${unit || ''}`;
  }

  function tipFor(node, label, value) {
    node.dataset.tip = label;
    node.dataset.tipValue = value;
  }

  function barsChart(chart) {
    const frag = document.createDocumentFragment();
    frag.append(legend(chart.series));
    const list = el('ul', 'bars');
    chart.rows.forEach((row, ri) => {
      const li = el('li', 'bars__row');
      li.append(el('span', 'bars__label', tx(row.label)));
      const set = el('div', 'bars__set');
      row.values.forEach((value, si) => {
        const s = chart.series[si];
        const ratio = Math.max(0, Math.min(1, value / (chart.max || 100)));
        const bar = el('div', `bar bar--${s.tone}${value === 0 ? ' is-zero' : ''}`);
        bar.dataset.v = String(ratio);
        bar.style.setProperty('--v', ratio.toFixed(4));
        bar.style.setProperty('--bd', `${ri * 90 + si * 70}ms`);
        const track = el('div', 'bar__track');
        track.append(el('div', 'bar__fill'));
        bar.append(track, el('span', 'bar__value', fmt(value, chart.unit)));
        tipFor(bar, tx(s.name), fmt(value, chart.unit));
        set.append(bar);
      });
      li.append(set);
      list.append(li);
    });
    frag.append(list);
    return frag;
  }

  function lineChart(chart) {
    const id = ++uid;
    const W = 640; const H = 300;
    const m = { l: 52, r: 18, t: 16, b: 42 };
    const iw = W - m.l - m.r; const ih = H - m.t - m.b;
    const max = chart.max || 100;
    const xs = chart.x;
    const px = (i) => m.l + (xs.length === 1 ? iw / 2 : (i / (xs.length - 1)) * iw);
    const py = (v) => m.t + ih - (Math.max(0, Math.min(max, v)) / max) * ih;
    const root = svg('svg', { class: 'line', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': tx(chart.title) });
    const defs = svg('defs');
    const lg = svg('linearGradient', { id: `lg-${id}`, x1: '0', x2: '1' });
    lg.append(svg('stop', { offset: '0', 'stop-color': '#a855f7' }), svg('stop', { offset: '.6', 'stop-color': '#e879f9' }), svg('stop', { offset: '1', 'stop-color': '#ff4fb8' }));
    const ag = svg('linearGradient', { id: `ag-${id}`, x1: '0', y1: '0', x2: '0', y2: '1' });
    ag.append(svg('stop', { offset: '0', 'stop-color': '#ff4fb8', 'stop-opacity': '.35' }), svg('stop', { offset: '1', 'stop-color': '#7c3aed', 'stop-opacity': '0' }));
    defs.append(lg, ag);
    root.append(defs);
    for (let g = 0; g <= 4; g++) {
      const v = (max / 4) * g;
      const y = py(v);
      root.append(svg('line', { class: 'line__grid', x1: m.l, x2: W - m.r, y1: y, y2: y }));
      const label = svg('text', { class: 'line__axis', x: m.l - 10, y: y + 4, 'text-anchor': 'end' });
      label.textContent = `${nf(v)}${(chart.unit || '').trim() === '%' ? '%' : ''}`;
      root.append(label);
    }
    xs.forEach((x, i) => {
      const label = svg('text', { class: 'line__axis', x: px(i), y: H - 14, 'text-anchor': 'middle' });
      label.textContent = x === 0 ? '+0' : `+${x}`;
      root.append(label);
    });
    const xl = svg('text', { class: 'line__axis', x: W - m.r, y: H - 0, 'text-anchor': 'end' });
    xl.textContent = `${t('x.latency')} (${chart.xUnit || 'ms'})`;
    root.append(xl);
    chart.series.forEach((s, si) => {
      const pts = s.values.map((v, i) => [px(i), py(v)]);
      const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
      if (s.tone === 'hot') {
        const area = svg('path', { class: 'line__area', d: `${d} L${px(xs.length - 1)} ${py(0)} L${px(0)} ${py(0)} Z` });
        area.style.fill = `url(#ag-${id})`;
        root.append(area);
      }
      const path = svg('path', { class: `line__path line__path--${s.tone}`, d });
      if (s.tone === 'hot') path.style.stroke = `url(#lg-${id})`;
      path.style.setProperty('--ld', `${si * 220}ms`);
      root.append(path);
      s.values.forEach((v, i) => {
        const dot = svg('circle', { class: `line__dot line__dot--${s.tone}`, cx: pts[i][0], cy: pts[i][1], r: 5, tabindex: '0' });
        dot.style.setProperty('--ld', `${si * 220}ms`);
        tipFor(dot, `${tx(s.name)} · +${xs[i]} ${chart.xUnit || 'ms'}`, fmt(v, chart.unit));
        root.append(dot);
      });
    });
    const frag = document.createDocumentFragment();
    frag.append(legend(chart.series), root);
    return frag;
  }

  function ledgerChart(chart) {
    const list = el('ul', 'ledger');
    for (const row of chart.rows) {
      const li = el('li', `ledger__row${row.bad ? ' is-bad' : ''}`);
      const mark = el('span', 'ledger__mark');
      mark.append(icon(row.bad ? 'i-zap' : 'i-shield-check'));
      const label = el('span', 'ledger__label', tx(row.label));
      if (row.detail) label.append(el('span', 'ledger__detail', row.detail));
      const value = el('span', 'ledger__value counter', '0');
      value.dataset.count = String(row.value);
      li.append(mark, label, value);
      list.append(li);
    }
    return list;
  }

  function measurePaths(chartNode) {
    $$('.line__path', chartNode).forEach((path) => {
      try { path.style.setProperty('--len', String(Math.ceil(path.getTotalLength()) + 2)); } catch (err) { /* not rendered */ }
    });
  }

  function chartPanel(chart, labId, index) {
    const panel = el('div', 'chart');
    panel.id = `chart-${labId}-${chart.id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${labId}-${chart.id}`);
    panel.hidden = index !== 0;
    panel.append(el('h4', 'chart__title', tx(chart.title)));
    if (chart.type === 'bars') panel.append(barsChart(chart));
    else if (chart.type === 'line') panel.append(lineChart(chart));
    else if (chart.type === 'ledger') panel.append(ledgerChart(chart));
    if (chart.note) panel.append(el('p', 'chart__note', tx(chart.note)));
    return panel;
  }

  const TAB_ICONS = { bars: 'i-activity', line: 'i-activity', ledger: 'i-shield-check' };

  function chartsBlock(lab) {
    const block = el('div', 'lab__charts');
    const bar = el('div', 'tabsbar');
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', `${lab.name} — ${t('chart.aria')}`);
    const ink = el('span', 'tabsbar__ink');
    bar.append(ink);
    const panels = lab.charts.map((chart, i) => chartPanel(chart, lab.id, i));
    const buttons = lab.charts.map((chart, i) => {
      const btn = el('button', 'tabsbar__btn');
      btn.type = 'button';
      btn.id = `tab-${lab.id}-${chart.id}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', panels[i].id);
      btn.setAttribute('aria-selected', String(i === 0));
      btn.tabIndex = i === 0 ? 0 : -1;
      btn.append(icon(TAB_ICONS[chart.type] || 'i-activity'), document.createTextNode(tx(chart.tab)));
      bar.append(btn);
      return btn;
    });
    const moveInk = (btn) => {
      ink.style.width = `${btn.offsetWidth}px`;
      ink.style.transform = `translateX(${btn.offsetLeft}px)`;
    };
    const select = (i, focus) => {
      buttons.forEach((b, j) => {
        b.setAttribute('aria-selected', String(i === j));
        b.tabIndex = i === j ? 0 : -1;
      });
      panels.forEach((p, j) => {
        const show = i === j;
        if (show && p.hidden) {
          p.hidden = false;
          measurePaths(p);
          p.classList.remove('is-played', 'is-entering');
          void p.offsetWidth;
          p.classList.add('is-entering');
          requestAnimationFrame(() => playChart(p));
        } else if (!show) {
          p.hidden = true;
        }
      });
      moveInk(buttons[i]);
      if (focus) buttons[i].focus();
    };
    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => select(i, false));
      btn.addEventListener('keydown', (e) => {
        const n = buttons.length;
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % n, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + n) % n, true); }
        if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        if (e.key === 'End') { e.preventDefault(); select(n - 1, true); }
      });
    });
    block.append(bar, ...panels);
    requestAnimationFrame(() => {
      moveInk(buttons[0]);
      panels.forEach(measurePaths);
    });
    addEventListener('resize', () => {
      const current = buttons.find((b) => b.getAttribute('aria-selected') === 'true');
      if (current) moveInk(current);
    }, { passive: true });
    return { block, panels };
  }

  /* ---------- Labs & tools ---------- */

  const LINK_ICONS = { doc: 'i-file-text', github: 'i-github', modrinth: 'i-modrinth' };

  function labCard(lab, index) {
    const card = el('article', 'lab reveal');
    card.id = `lab-${lab.id}`;
    card.dataset.state = lab.state || 'live';
    card.style.setProperty('--d', `${index * 80}ms`);

    const head = el('header', 'lab__head');
    const iconWrap = el('div', 'lab__icon');
    const img = el('img');
    img.alt = `${lab.name} icon`;
    img.width = 84; img.height = 84;
    img.loading = 'lazy';
    img.src = lab.icon;
    iconWrap.append(img);
    const titles = el('div');
    titles.append(el('p', 'lab__kicker', tx(lab.kicker)), el('h3', 'lab__name', lab.name), el('span', 'lab__status', tx(lab.status)));
    head.append(iconWrap, titles);
    card.append(head, el('p', 'lab__tagline', tx(lab.tagline)));

    const rig = el('ul', 'lab__rig');
    tx(lab.rig).split(' · ').forEach((part) => rig.append(el('li', null, part)));
    card.append(rig);

    const panels = [];
    if (lab.figures && lab.figures.length) {
      const figs = el('dl', 'figs');
      figs.setAttribute('aria-label', t('lab.figures'));
      for (const f of lab.figures) {
        const fig = el('div', 'fig');
        const dd = el('dd', 'fig__value');
        const num = el('span', 'counter', '0');
        num.dataset.count = String(f.value);
        if (f.decimals) num.dataset.decimals = String(f.decimals);
        dd.append(num);
        if (f.suffix) dd.append(el('small', null, f.suffix));
        const dt = el('dt', 'fig__label', tx(f.label));
        fig.append(dd, dt);
        figs.append(fig);
      }
      card.append(figs);
    }

    if (lab.charts && lab.charts.length) {
      const { block, panels: chartPanels } = chartsBlock(lab);
      panels.push(...chartPanels);
      card.append(block);
    } else {
      const pending = el('div', 'lab__pending');
      pending.append(el('p', null, t('lab.pending')));
      const red = el('div', 'lab__redacted');
      red.setAttribute('aria-hidden', 'true');
      red.append(el('span'), el('span'), el('span'));
      pending.append(red);
      card.append(pending);
    }

    const links = el('div', 'lab__links');
    for (const link of lab.links || []) {
      const href = safeUrl(link.url);
      if (!href) continue;
      const a = el('a', link.kind === 'doc' ? 'btn btn--primary btn--sm magnetic' : 'btn btn--ghost btn--sm magnetic');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.append(icon(LINK_ICONS[link.kind] || 'i-external-link'), document.createTextNode(tx(link.label)));
      links.append(a);
    }
    card.append(links);
    return { card, panels };
  }

  function toolCard(tool, index) {
    const card = el('article', 'tool reveal');
    card.style.setProperty('--d', `${index * 70}ms`);
    const img = el('img', 'tool__icon');
    img.alt = '';
    img.width = 56; img.height = 56;
    img.loading = 'lazy';
    img.src = tool.icon;
    const head = el('div');
    head.append(el('h3', 'tool__name', tool.name));
    const by = el('p', 'tool__by', `@${tool.by}`);
    if (tool.license) by.append(el('span', 'tool__license', tool.license));
    head.append(by);
    const links = el('div', 'tool__links');
    const repo = safeUrl(tool.repo);
    const modrinth = safeUrl(tool.modrinth);
    if (repo) {
      const a = el('a', 'btn btn--ghost btn--sm');
      a.href = repo; a.target = '_blank'; a.rel = 'noopener';
      a.append(icon('i-github'), document.createTextNode(t('link.github')));
      links.append(a);
    }
    if (modrinth) {
      const a = el('a', 'btn btn--ghost btn--sm');
      a.href = modrinth; a.target = '_blank'; a.rel = 'noopener';
      a.append(icon('i-modrinth'), document.createTextNode(t('link.modrinth')));
      links.append(a);
    }
    card.append(img, head, el('p', 'tool__role', tx(tool.role)), links);
    if (finePointer.matches) {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }
    return card;
  }

  function renderData() {
    const list = $('#labs-list');
    list.textContent = '';
    const allPanels = [];
    data.labs.forEach((lab, i) => {
      const { card, panels } = labCard(lab, i);
      list.append(card);
      allPanels.push(...panels);
    });
    const tools = $('#tools-list');
    tools.textContent = '';
    data.tools.forEach((tool, i) => tools.append(toolCard(tool, i)));
    $$('.reveal, .counter', list).forEach(watch);
    $$('.reveal', tools).forEach(watch);
    allPanels.forEach((p) => { if (!p.hidden) watch(p); });
    requestAnimationFrame(() => allPanels.forEach(measurePaths));
    initMagnetic(list);
    renderOrbit();
  }

  function renderError() {
    const list = $('#labs-list');
    list.textContent = '';
    const box = el('div', 'lab lab--error');
    box.dataset.state = 'pending';
    box.append(el('p', 'lab__tagline', t('labs.error')));
    const links = el('div', 'lab__links');
    for (const [label, url] of [
      ['Herzium lab', 'https://github.com/kerlycanelita/Herzium/blob/main/docs/audits/LAB-1.11-burst-options.md'],
      ["KoHs Anchor's server lab", 'https://github.com/kerlycanelita/KoHs-Anchors/blob/main/docs/research/server-lab-0.2.0.md'],
    ]) {
      const a = el('a', 'btn btn--ghost btn--sm');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.append(icon('i-file-text'), document.createTextNode(label));
      links.append(a);
    }
    box.append(links);
    list.append(box);
  }

  async function loadData() {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      renderData();
    } catch (err) {
      renderError();
    }
  }

  /* ---------- Tooltip ---------- */

  function initTips() {
    const tip = $('#chart-tip');
    let current = null;
    const show = (node, x, y) => {
      current = node;
      tip.textContent = `${node.dataset.tip} · `;
      tip.append(el('b', null, node.dataset.tipValue || ''));
      tip.hidden = false;
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    };
    const hide = () => { current = null; tip.hidden = true; };
    document.addEventListener('pointerover', (e) => {
      const node = e.target.closest('[data-tip]');
      if (!node) { if (current) hide(); return; }
      const r = node.getBoundingClientRect();
      show(node, e.clientX || r.left + r.width / 2, r.top);
    });
    document.addEventListener('pointermove', (e) => {
      if (!current) return;
      const r = current.getBoundingClientRect();
      tip.style.left = `${e.clientX}px`;
      tip.style.top = `${Math.min(e.clientY, r.top + 4)}px`;
    }, { passive: true });
    document.addEventListener('focusin', (e) => {
      const node = e.target.closest && e.target.closest('[data-tip]');
      if (!node) return;
      const r = node.getBoundingClientRect();
      show(node, r.left + r.width / 2, r.top);
    });
    document.addEventListener('focusout', hide);
    addEventListener('scroll', () => { if (current) hide(); }, { passive: true });
  }

  /* ---------- Init ---------- */

  function init() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
    initTheme();
    initNav();
    initLang();
    applyLang();
    initIntro();
    initTips();
    initBubbles();
    initMagnetic();
    $$('.reveal').forEach(watch);
    $$('.stats .counter').forEach(watch);
    loadData();
  }

  init();
})();
