(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const meta = document.querySelector('meta[name="theme-color"]');
  const storageKey = 'oalfawzan-theme';

  const sync = (theme, persist = true) => {
    const next = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = next;
    if (meta) meta.content = next === 'light' ? '#e7eff8' : '#1b2942';
    if (toggle) {
      const target = next === 'light' ? 'dark' : 'light';
      toggle.setAttribute('aria-label', `Switch to ${target} theme`);
      toggle.setAttribute('title', `Switch to ${target} theme`);
      toggle.setAttribute('aria-pressed', String(next === 'light'));
    }
    if (persist) {
      try { localStorage.setItem(storageKey, next); } catch (_) {}
    }
  };

  sync(root.dataset.theme, false);
  toggle?.addEventListener('click', () => sync(root.dataset.theme === 'light' ? 'dark' : 'light'));
})();
