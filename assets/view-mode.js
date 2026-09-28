(() => {
  'use strict';
  const key = 'heycheng:view-mode';
  const valid = new Set(['auto', 'desktop', 'mobile']);
  const screen = window.matchMedia('(max-width: 900px)');
  let preference = 'auto';
  try {
    const saved = localStorage.getItem(key);
    if (valid.has(saved)) preference = saved;
  } catch { /* Private browsing can make storage unavailable. */ }

  function apply() {
    const mode = preference === 'auto' ? (screen.matches ? 'mobile' : 'desktop') : preference;
    const root = document.documentElement;
    const changed = root.dataset.view !== mode || root.dataset.viewPreference !== preference;
    root.dataset.view = mode;
    root.dataset.viewPreference = preference;
    document.querySelectorAll('[data-view-mode-select]').forEach(select => { select.value = preference; });
    document.querySelectorAll('[data-view-mode-status]').forEach(status => {
      status.textContent = preference === 'auto' ? `目前：${mode === 'mobile' ? '手機' : '電腦'}版` : '';
    });
    if (changed) window.dispatchEvent(new CustomEvent('heycheng:viewchange', { detail: { mode, preference } }));
  }

  function mount() {
    document.querySelectorAll('[data-view-mode-host]').forEach(host => {
      if (host.querySelector('[data-view-mode-select]')) return;
      const label = document.createElement('label');
      label.className = 'view-mode-control';
      const title = document.createElement('span');
      title.textContent = '顯示模式';
      const select = document.createElement('select');
      select.dataset.viewModeSelect = '';
      select.setAttribute('aria-label', '顯示模式');
      [['auto', '自動'], ['desktop', '電腦版'], ['mobile', '手機版']].forEach(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.append(option);
      });
      select.addEventListener('change', () => {
        if (!valid.has(select.value)) return;
        preference = select.value;
        try { localStorage.setItem(key, preference); } catch { /* The current page still switches. */ }
        apply();
      });
      const status = document.createElement('small');
      status.dataset.viewModeStatus = '';
      status.setAttribute('aria-live', 'polite');
      label.append(title, select, status);
      host.append(label);
    });
    apply();
  }

  screen.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid.has(event.newValue) ? event.newValue : 'auto';
    apply();
  });
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
