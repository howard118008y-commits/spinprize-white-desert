// Phone-view 選單 on article pages: same open/close, Esc and focus behaviour as the homepage menu.
(() => {
  'use strict';
  const button = document.getElementById('menuBtn'), menu = document.getElementById('menu'), close = document.getElementById('menuClose');
  if (!button || !menu || !close) return;
  let open = false;

  function setMenu(next) {
    open = next;
    document.body.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    for (const element of document.body.children) if (element !== menu) element.inert = open;
    (open ? close : button).focus({ preventScroll: true });
  }

  button.addEventListener('click', () => setMenu(!open));
  close.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); return; }
    if (event.key !== 'Tab') return;
    const items = [...menu.querySelectorAll('a[href],button')].filter(item => item.getClientRects().length);
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || !menu.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !menu.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  });
  // The menu only exists in the phone view; leaving it (or the page) closes the menu.
  window.addEventListener('heycheng:viewchange', event => { if (open && event.detail.mode !== 'mobile') setMenu(false); });
  window.addEventListener('pagehide', () => { if (open) setMenu(false); });
})();
