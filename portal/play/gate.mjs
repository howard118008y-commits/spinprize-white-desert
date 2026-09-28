if (window.parent === window) {
  location.replace(new URL('../#play',location.href).href);
} else {
  const start = event => {
    if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'heycheng-play-start') return;
    window.removeEventListener('message',start);
    for (const link of document.querySelectorAll('a[href="/portal/"]')) link.addEventListener('click',event => {event.preventDefault(); window.parent.postMessage({type:'heycheng-play-close'},location.origin);});
    document.body.hidden = false;
    import('./app.mjs');
  };
  window.addEventListener('message',start);
}
