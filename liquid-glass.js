/* quickLiquid integration — real Apple-style liquid glass for ai.oalfawzan.sa
   Applies the quickLiquid engine (vendored ESM, no build step) to the site's key
   glass surfaces. Surfaces keep their existing CSS glass as a graceful fallback:
   the engine layers real SVG backdrop refraction, rim lighting and chromatic
   dispersion on top in supporting engines (Chromium), and does nothing harmful
   elsewhere (frost/tint/shadow layers remain from ecosystem.css). */

(() => {
  'use strict';

  const supportsImport = 'noModule' in HTMLScriptElement.prototype;

  function init(LiquidGlassEngine, SPRING_PRESETS) {
    if (typeof LiquidGlassEngine !== 'function') return;

    const motionOK = !matchMedia('(prefers-reduced-motion: reduce)').matches;

    const engines = [];

    const make = (el, config) => {
      if (!el) return;
      try {
        const glass = new LiquidGlassEngine(el, config);
        engines.push(glass);
        return glass;
      } catch (_) { /* keep CSS fallback */ }
    };

    /* 1. Floating site header — the primary nav surface. 'clear' preset keeps
       text readable while adding a true refractive bezel around the pill. */
    const header = document.querySelector('.site-header');
    const headerGlass = make(header, {
      material: 'regular',
      borderRadius: 28,
      refractionStrength: 18,
      bezelWidth: 30,
      chromaticAberration: 0.16,
      dynamicLighting: motionOK,
      quality: 'high',
      appearance: 'auto'
    });

    /* 2. Hero primary button — dock-like control with press physics. */
    const heroBtn = document.querySelector('.hero-actions .primary-btn');
    const heroGlass = make(heroBtn, {
      material: 'clear',
      borderRadius: 22,
      refractionStrength: 24,
      bezelWidth: 26,
      chromaticAberration: 0.22,
      dynamicLighting: motionOK,
      quality: 'high'
    });
    if (heroGlass && heroGlass.enableLiquidPress) {
      heroGlass.enableLiquidPress({ scale: 0.92, squish: 0.03, preset: 'snappy' });
    }

    /* 3. Lab cards — droplet-style merge when cards approach. */
    const labCards = [...document.querySelectorAll('.lab-card')];
    labCards.forEach(card => {
      const g = make(card, {
        material: 'thin',
        borderRadius: 24,
        refractionStrength: 16,
        bezelWidth: 24,
        chromaticAberration: 0.12,
        dynamicLighting: motionOK,
        quality: 'medium'
      });
      if (g && g.enableLiquidPress) {
        g.enableLiquidPress({ scale: 0.96, squish: 0.02, preset: 'snappy' });
      }
    });
    if (typeof LiquidGlassEngine.group === 'function' || LiquidGlassEngine.group) {
      try {
        const group = new LiquidGlassEngine.group(labCards.filter(Boolean), {});
        if (group && typeof group.enableLiquidMerge === 'function') group.enableLiquidMerge({ radius: 90 });
      } catch (_) { /* merging is decorative */ }
    }

    /* 4. Sticky timeline shell — deep glass for the journey navigator. */
    make(document.querySelector('.timeline-shell'), {
      material: 'regular',
      borderRadius: 26,
      refractionStrength: 16,
      bezelWidth: 28,
      chromaticAberration: 0.14,
      dynamicLighting: motionOK,
      quality: 'medium'
    });

    /* 5. System cards in the "Same model" comparison. */
    document.querySelectorAll('.system-card').forEach(card => {
      const g = make(card, {
        material: 'regular',
        borderRadius: 24,
        refractionStrength: 14,
        bezelWidth: 26,
        chromaticAberration: 0.10,
        dynamicLighting: motionOK,
        quality: 'medium'
      });
    });

    /* 6. Interop diagram nodes. */
    document.querySelectorAll('.interop-node').forEach(node => {
      make(node, {
        material: 'thin',
        borderRadius: 22,
        refractionStrength: 14,
        bezelWidth: 22,
        chromaticAberration: 0.10,
        dynamicLighting: motionOK,
        quality: 'low'
      });
    });

    /* 7. Theme toggle — small glass control. */
    const themeBtn = document.querySelector('.theme-toggle');
    const themeGlass = make(themeBtn, {
      material: 'clear',
      borderRadius: 16,
      refractionStrength: 20,
      bezelWidth: 18,
      chromaticAberration: 0.18,
      dynamicLighting: motionOK,
      quality: 'high'
    });
    if (themeGlass && themeGlass.enableLiquidPress) {
      themeGlass.enableLiquidPress({ scale: 0.88, squish: 0.04, preset: 'bouncy' });
    }

    /* Rebuild the header when the theme flips: rim lighting depends on scheme. */
    let themeTimer;
    const watchTheme = () => {
      clearTimeout(themeTimer);
      themeTimer = setTimeout(() => {
        engines.forEach(e => { try { e.updateTint && e.updateTint(); e.bakeLight && e.bakeLight(); } catch (_) {} });
      }, 60);
    };
    new MutationObserver(watchTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /* Keep main content above the header's new SVG layer if needed */
    try {
      if (header) header.style.isolation = 'isolate';
    } catch (_) {}

    window.__QUICK_LIQUID_SITE__ = { engines, count: engines.length };
  }

  if (supportsImport) {
    import('./vendor/quick-liquid/index.mjs')
      .then(mod => init(mod.LiquidGlassEngine, mod.SPRING_PRESETS))
      .catch(err => console.warn('quickLiquid failed to load; CSS glass fallback remains.', err));
  }
})();
