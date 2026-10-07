/**
 * QuickLiquid integration for ai.oalfawzan.sa
 * Loads quick-liquid from esm.sh CDN and selectively enhances the page.
 */

import {
  LiquidGlassEngine,
  LiquidButton,
  MATERIAL_PRESETS
} from 'https://cdn.jsdelivr.net/npm/quick-liquid@0.1.2/dist/index.mjs';

const engines = [];
const buttons = [];

/* ── helpers ─────────────────────────────────────────────── */
const isDark = () => document.documentElement.dataset.theme === 'dark';

/**
 * CSS on this page uses !important for backdrop-filter.
 * We must use setProperty with 'important' priority or the engine's
 * internal lens layer would fight with the host's double blur.
 */
const stripBackdrop = (el) => {
  el.style.setProperty('backdrop-filter', 'none', 'important');
  el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
};

/* ── 1. Blackboard diagrams ─────────────────────────────── */
function initBlackboards() {
  document.querySelectorAll('.blackboard').forEach((el, i) => {
    stripBackdrop(el);
    // Each stage has a different accent — pick a material feel that suits it
    const accent = el.closest('[data-accent]')?.dataset.accent;
    const baseCfg = {
      material: 'clear',
      dynamicLighting: true,
      cursorTracking: true,
      hoverLighting: true,
      borderRadius: 24,
      elevation: 1,
      quality: 'high',
      chromaticAberration: 0.18,
      refractionStrength: 22,
      appearance: isDark() ? 'dark' : 'light',
    };
    try {
      const engine = new LiquidGlassEngine(el, baseCfg);
      engine.animateIn(180 + i * 80);
      engines.push(engine);
      // Subtle press feedback when users click inside the diagram
      engine.enableLiquidPress({ scale: 0.985, squish: 0.012 });
    } catch (e) {
      console.warn('[QuickLiquid] blackboard init failed:', e);
    }
  });
}

/* ── 2. Lab cards ───────────────────────────────────────── */
function initLabCards() {
  document.querySelectorAll('.lab-card').forEach((el, i) => {
    stripBackdrop(el);
    try {
      const engine = new LiquidGlassEngine(el, {
        material: 'thin',
        dynamicLighting: true,
        cursorTracking: true,
        hoverLighting: true,
        borderRadius: 20,
        elevation: 1,
        quality: 'medium',
        chromaticAberration: 0.12,
        refractionStrength: 14,
        appearance: isDark() ? 'dark' : 'light',
      });
      engine.animateIn(200 + i * 60);
      engines.push(engine);
    } catch (e) {
      console.warn('[QuickLiquid] lab-card init failed:', e);
    }
  });
}

/* ── 3. System cards in “Same model” section ─────────────── */
function initSystemCards() {
  document.querySelectorAll('.system-card').forEach((el, i) => {
    stripBackdrop(el);
    try {
      const engine = new LiquidGlassEngine(el, {
        material: 'thin',
        dynamicLighting: true,
        hoverLighting: true,
        borderRadius: 20,
        elevation: 1,
        quality: 'medium',
        appearance: isDark() ? 'dark' : 'light',
      });
      engine.animateIn(220 + i * 100);
      engines.push(engine);
    } catch (e) {
      console.warn('[QuickLiquid] system-card init failed:', e);
    }
  });
}

/* ── 4. Interop nodes ───────────────────────────────────── */
function initInteropNodes() {
  document.querySelectorAll('.interop-node').forEach((el, i) => {
    stripBackdrop(el);
    try {
      const engine = new LiquidGlassEngine(el, {
        material: 'thin',
        dynamicLighting: true,
        hoverLighting: true,
        borderRadius: 18,
        elevation: 1,
        quality: 'medium',
        appearance: isDark() ? 'dark' : 'light',
      });
      engine.animateIn(240 + i * 80);
      engines.push(engine);
    } catch (e) {
      console.warn('[QuickLiquid] interop-node init failed:', e);
    }
  });
}

/* ── 5. Source grid links ───────────────────────────────── */
function initSourceLinks() {
  document.querySelectorAll('.source-grid a').forEach((el, i) => {
    stripBackdrop(el);
    try {
      const engine = new LiquidGlassEngine(el, {
        material: 'thin',
        dynamicLighting: true,
        hoverLighting: true,
        borderRadius: 17,
        elevation: 1,
        quality: 'low',
        appearance: isDark() ? 'dark' : 'light',
      });
      engine.animateIn(260 + i * 40);
      engines.push(engine);
    } catch (e) {
      console.warn('[QuickLiquid] source link init failed:', e);
    }
  });
}

/* ── 6. Liquid buttons (press physics) ───────────────────── */
function initButtons() {
  const selectors = '.primary-btn, .lab-btn, .pattern-toggle button, .scenario button';
  document.querySelectorAll(selectors).forEach((btn) => {
    try {
      buttons.push(
        new LiquidButton(btn, {
          pressScale: 0.94,
          pressSquish: 0.025,
          scaleOnPress: true,
          wobbleOnPress: true,
          releaseSpring: 'bouncy',
        })
      );
    } catch (e) {
      console.warn('[QuickLiquid] button init failed:', e);
    }
  });
}

/* ── 7. Theme sync ──────────────────────────────────────── */
function syncTheme() {
  const appearance = isDark() ? 'dark' : 'light';
  engines.forEach((engine) => {
    try { engine.updateConfig({ appearance }); } catch (_) {}
  });
}

function startThemeObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.attributeName === 'data-theme') syncTheme();
    });
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

/* ── bootstrap ──────────────────────────────────────────── */
function init() {
  initBlackboards();
  initLabCards();
  initSystemCards();
  initInteropNodes();
  initSourceLinks();
  initButtons();
  startThemeObserver();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
