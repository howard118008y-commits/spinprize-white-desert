const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

function focusViewHeading() {
  const heading = document.querySelector('.app-view:not([hidden]) h1, .app-view:not([hidden]) h2');
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function restoreDialogFocus(trigger, dialog) {
  const changedView = dialog.returnValue === 'view-change';
  dialog.returnValue = '';
  if (!changedView && trigger?.getClientRects().length) trigger.focus({ preventScroll: true });
  else focusViewHeading();
}

function closeMenu(returnFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '開啟選單');
  menuButton.querySelector('.menu-label').textContent = '選單';
  navigation.classList.remove('is-open');
  if (returnFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  if (isOpen) return closeMenu();
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', '關閉選單');
  menuButton.querySelector('.menu-label').textContent = '關閉';
  navigation.classList.add('is-open');
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav')) closeMenu();
});

window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

const contactDialog = document.querySelector('#contact-dialog');
let contactTrigger;

document.querySelectorAll('[data-contact-open]').forEach((button) => {
  button.addEventListener('click', () => {
    cancelInteraction();
    contactTrigger = button;
    contactDialog.showModal();
    document.body.classList.add('contact-dialog-open');
  });
});

contactDialog.querySelector('.contact-dialog-close').addEventListener('click', () => contactDialog.close());
contactDialog.addEventListener('click', (event) => {
  const bounds = contactDialog.getBoundingClientRect();
  if (event.target === contactDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) contactDialog.close();
});
contactDialog.addEventListener('close', () => {
  document.body.classList.remove('contact-dialog-open');
  restoreDialogFocus(contactTrigger, contactDialog);
});

document.querySelector('#contact-line-copy').addEventListener('click', async () => {
  const status = document.querySelector('#contact-copy-status');
  try {
    await navigator.clipboard.writeText(document.querySelector('#contact-line-id').textContent);
    status.textContent = '已複製 LINE ID，請貼到 LINE 搜尋。';
  } catch {
    status.textContent = '無法自動複製，請長按或選取上方 LINE ID。';
  }
});

const workDialog = document.querySelector('#work-dialog');
const workImage = document.querySelector('#work-full-image');
const workScroll = workDialog.querySelector('.work-dialog-scroll');
const workStatus = document.querySelector('#work-load-status');
const workZoom = document.querySelector('#work-zoom');
let workTrigger;

function resetWorkZoom() {
  workScroll.classList.remove('is-zoomed');
  workZoom.setAttribute('aria-pressed', 'false');
  workZoom.textContent = '放大細節';
}

workImage.addEventListener('load', () => {
  workStatus.hidden = true;
  workImage.hidden = false;
  workScroll.style.setProperty('--image-width', `${workImage.naturalWidth}px`);
});
workImage.addEventListener('error', () => {
  workStatus.hidden = false;
  workImage.hidden = true;
  workStatus.textContent = '完整畫面暫時無法載入，請點選「前往網站」直接查看。';
});

document.querySelectorAll('[data-work-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const project = document.querySelector(`#work-${button.dataset.workOpen}`);
    const preview = project.querySelector('.work-preview img');
    const name = project.querySelector('h3').textContent;
    workTrigger = button;
    document.querySelector('#work-dialog-title').textContent = name;
    document.querySelector('#work-dialog-caption').textContent = preview.dataset.captureLabel || '完整網站預覽';
    document.querySelector('#work-live-link').href = project.querySelector('.work-domain').href;
    workStatus.hidden = false;
    workStatus.textContent = '正在載入完整網站畫面…';
    workImage.hidden = true;
    workImage.alt = `${name}${preview.dataset.captureLabel ? '響應式' : '網站'}完整頁面，由頁首至頁尾`;
    if (preview.dataset.fullWidth) workImage.width = Number(preview.dataset.fullWidth);
    if (preview.dataset.fullHeight) workImage.height = Number(preview.dataset.fullHeight);
    resetWorkZoom();
    workImage.src = preview.dataset.fullSrc;
    workDialog.showModal();
    document.body.classList.add('work-dialog-open');
    workScroll.scrollTo(0, 0);
  });
});

workZoom.addEventListener('click', () => {
  const zoomed = workScroll.classList.toggle('is-zoomed');
  workZoom.setAttribute('aria-pressed', String(zoomed));
  workZoom.textContent = zoomed ? '適合寬度' : '放大細節';
});
document.querySelector('#work-close').addEventListener('click', () => workDialog.close());
workDialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  if (event.shiftKey && document.activeElement === workZoom) {
    event.preventDefault();
    workScroll.focus();
  } else if (!event.shiftKey && document.activeElement === workScroll) {
    event.preventDefault();
    workZoom.focus();
  }
});
workDialog.addEventListener('click', (event) => {
  const bounds = workDialog.getBoundingClientRect();
  if (event.target === workDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) workDialog.close();
});
workDialog.addEventListener('close', () => {
  document.body.classList.remove('work-dialog-open');
  restoreDialogFocus(workTrigger, workDialog);
});

const projects = [...document.querySelectorAll('.work-project')].map((project) => ({
  id: project.id.slice(5),
  name: project.querySelector('h3').textContent,
  description: project.querySelector('.work-heading p').textContent,
  link: project.querySelector('.work-domain').href,
  trigger: project.querySelector('[data-work-open]'),
}));
const orbitApp = document.querySelector('.orbit-app');
const stage = document.querySelector('.orbit-stage');
const ring = document.querySelector('.orbit-ring');
const chooser = [...document.querySelectorAll('.work-index a')];
const views = [...document.querySelectorAll('main > .section')];
const viewLinks = [...navigation.querySelectorAll('a[href^="#"]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const step = 360 / projects.length;
let selected = 0;
let rotation = 0;
let gesture = null;
let drawFrame = 0;
let motionFrame = 0;
let suppressClickUntil = 0;

projects.forEach((project, index) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'orbit-card';
  card.style.setProperty('--angle', `${index * step}deg`);
  card.setAttribute('aria-label', `${project.name}，選取或查看完整網站`);
  card.dataset.index = index;
  card.tabIndex = -1;
  const face = document.createElement('span');
  face.className = 'orbit-face';
  face.setAttribute('aria-hidden', 'true');
  const address = document.createElement('span');
  address.className = 'orbit-browser';
  address.textContent = new URL(project.link).hostname;
  const picture = document.createElement('img');
  picture.src = `assets/case-${project.id}.webp`;
  picture.width = 1440;
  picture.height = 900;
  picture.alt = '';
  picture.draggable = false;
  picture.decoding = 'async';
  const caption = document.createElement('span');
  caption.className = 'orbit-caption';
  caption.append(project.name);
  const number = document.createElement('span');
  number.textContent = `${String(index + 1).padStart(2, '0')} / 06`;
  caption.append(number);
  face.append(address, picture, caption);
  const back = face.cloneNode(true);
  back.classList.add('orbit-back');
  card.append(face, back);
  card.addEventListener('click', () => {
    if (performance.now() < suppressClickUntil) return;
    if (selected === index) openSelectedProject(card);
    else selectProject(index, true);
  });
  ring.append(card);
});
const cards = [...ring.children];

function drawRing() {
  cancelAnimationFrame(drawFrame);
  drawFrame = 0;
  ring.style.transform = `rotateY(${rotation}deg)`;
}

function queueDraw() {
  if (!drawFrame) drawFrame = requestAnimationFrame(drawRing);
}

function updateSelection(index, updateHash = false) {
  selected = ((index % projects.length) + projects.length) % projects.length;
  const project = projects[selected];
  document.querySelector('#orbit-current').textContent = String(selected + 1).padStart(2, '0');
  document.querySelector('#orbit-title').textContent = project.name;
  document.querySelector('#orbit-description').textContent = project.description;
  document.querySelector('#orbit-live').href = project.link;
  cards.forEach((card, position) => {
    card.classList.toggle('is-selected', position === selected);
    card.setAttribute('aria-pressed', String(position === selected));
  });
  chooser.forEach((link, position) => {
    if (position === selected) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  const directory = chooser[selected].parentElement;
  const item = chooser[selected];
  if (item.offsetLeft < directory.scrollLeft) directory.scrollLeft = item.offsetLeft;
  else if (item.offsetLeft + item.offsetWidth > directory.scrollLeft + directory.clientWidth) {
    directory.scrollLeft = item.offsetLeft + item.offsetWidth - directory.clientWidth;
  }
  if (updateHash) history.replaceState(null, '', `#work-${project.id}`);
}

function stopMotion() {
  cancelAnimationFrame(motionFrame);
  motionFrame = 0;
  stage.classList.remove('is-moving');
  document.querySelector('.orbit-selection').setAttribute('aria-busy', 'false');
}

function moveRing(target = null, velocity = 0, updateHash = true) {
  stopMotion();
  if (reducedMotion.matches) {
    rotation = target ?? Math.round(rotation / step) * step;
    drawRing();
    updateSelection(Math.round(-rotation / step), updateHash);
    return;
  }
  stage.classList.add('is-moving');
  document.querySelector('.orbit-selection').setAttribute('aria-busy', 'true');
  let previous = performance.now();
  function advance(now) {
    const elapsed = Math.min(now - previous, 32);
    previous = now;
    if (target === null) {
      const decay = Math.exp(-elapsed / 325);
      rotation += velocity * 325 * (1 - decay);
      velocity *= decay;
      if (Math.abs(velocity) < .04) target = Math.round(rotation / step) * step;
    } else {
      velocity += ((target - rotation) * .00025 - velocity * .032) * elapsed;
      rotation += velocity * elapsed;
    }
    drawRing();
    const nearest = Math.round(-rotation / step);
    if (((nearest % projects.length) + projects.length) % projects.length !== selected) updateSelection(nearest);
    if (target !== null && Math.abs(target - rotation) < .08 && Math.abs(velocity) < .003) {
      rotation = target;
      drawRing();
      stopMotion();
      updateSelection(Math.round(-rotation / step), updateHash);
      return;
    }
    motionFrame = requestAnimationFrame(advance);
  }
  motionFrame = requestAnimationFrame(advance);
}

function selectProject(index, updateHash = false, immediate = false) {
  cancelInteraction();
  updateSelection(index);
  const target = rotation + ((-selected * step - rotation + 540) % 360 + 360) % 360 - 180;
  if (immediate || reducedMotion.matches) {
    rotation = target;
    drawRing();
    if (updateHash) updateSelection(selected, true);
  } else moveRing(target, 0, updateHash);
}

function openSelectedProject(trigger) {
  cancelInteraction();
  projects[selected].trigger.click();
  workTrigger = trigger;
}

function endGesture(cancelled = false) {
  if (!gesture) return;
  const ended = gesture;
  gesture = null;
  stage.classList.remove('is-dragging');
  if (stage.hasPointerCapture(ended.id)) stage.releasePointerCapture(ended.id);
  if (!ended.dragged) {
    if (ended.interrupted) suppressClickUntil = performance.now() + 350;
    return;
  }
  suppressClickUntil = performance.now() + 350;
  document.querySelector('.orbit-selection').setAttribute('aria-busy', 'false');
  updateSelection(Math.round(-rotation / step));
  if (cancelled) return;
  const recent = ended.samples.filter((sample) => performance.now() - sample.time < 100);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const velocity = recent.length > 1 && last.time > first.time
    ? Math.max(-1.5, Math.min(1.5, (last.rotation - first.rotation) / (last.time - first.time))) : 0;
  moveRing(Math.abs(velocity) < .04 ? Math.round(rotation / step) * step : null, velocity);
}

function cancelInteraction() {
  endGesture(true);
  stopMotion();
  cancelAnimationFrame(drawFrame);
  drawFrame = 0;
  drawRing();
}

stage.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
    cancelInteraction();
    return;
  }
  const interrupted = !!motionFrame;
  cancelInteraction();
  if (interrupted) suppressClickUntil = performance.now() + 350;
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, rotation, dragged: false, interrupted,
    sensitivity: Math.min(.7, 360 / (stage.clientWidth * 1.45)),
    samples: [{ time: performance.now(), rotation }] };
});
stage.addEventListener('pointermove', (event) => {
  if (!gesture || gesture.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (!gesture.dragged) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) return endGesture(true);
    if (Math.abs(dx) < 7) return;
    gesture.dragged = true;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
    document.querySelector('.orbit-selection').setAttribute('aria-busy', 'true');
  }
  rotation = gesture.rotation + dx * gesture.sensitivity;
  const now = performance.now();
  gesture.samples.push({ time: now, rotation });
  gesture.samples = gesture.samples.filter((sample) => now - sample.time < 100);
  queueDraw();
});
stage.addEventListener('pointerup', (event) => {
  if (gesture?.id === event.pointerId) endGesture();
});
stage.addEventListener('pointercancel', (event) => {
  if (gesture?.id === event.pointerId) cancelInteraction();
});
stage.addEventListener('lostpointercapture', (event) => {
  if (event.target === stage && gesture?.id === event.pointerId) cancelInteraction();
});
stage.addEventListener('dragstart', (event) => event.preventDefault());
stage.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    selectProject(selected + (event.key === 'ArrowRight' ? 1 : -1), true, true);
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    selectProject(event.key === 'Home' ? 0 : projects.length - 1, true, true);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openSelectedProject(stage);
  }
});
document.querySelector('#orbit-previous').addEventListener('click', (event) => selectProject(selected - 1, true, event.detail === 0));
document.querySelector('#orbit-next').addEventListener('click', (event) => selectProject(selected + 1, true, event.detail === 0));
document.querySelector('#orbit-open').addEventListener('click', (event) => openSelectedProject(event.currentTarget));
chooser.forEach((link, index) => link.addEventListener('click', (event) => {
  event.preventDefault();
  selectProject(index, true, event.detail === 0);
}));

function showView(moveFocus = false) {
  cancelInteraction();
  const hash = location.hash.slice(1);
  const projectIndex = projects.findIndex((project) => `work-${project.id}` === hash);
  const target = views.find((view) => view.id === hash)?.id || 'works';
  views.forEach((view) => { view.hidden = view.id !== target; });
  document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close('view-change'));
  viewLinks.forEach((link) => {
    const current = link.hash === `#${target}`;
    link.classList.toggle('is-current', current);
    if (current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (projectIndex >= 0) selectProject(projectIndex, false, true);
  closeMenu();
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (moveFocus) focusViewHeading();
  });
}

const originalHeading = document.querySelector('#works-title');
const appHeading = document.createElement('h1');
appHeading.id = originalHeading.id;
appHeading.append(...originalHeading.childNodes);
originalHeading.replaceWith(appHeading);
views.forEach((view) => view.classList.add('app-view'));
orbitApp.hidden = false;
document.body.classList.add('app-enhanced');
selectProject(0, false, true);
showView();
window.addEventListener('hashchange', () => showView(true));
window.addEventListener('resize', cancelInteraction);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelInteraction();
});
reducedMotion.addEventListener('change', cancelInteraction);
viewLinks.forEach((link) => link.addEventListener('click', () => {
  if (location.hash === link.hash) showView(true);
}));

const installButton = document.querySelector('#app-install');
const installDialog = document.querySelector('#install-dialog');
const standalone = window.matchMedia('(display-mode: standalone)');
const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let installPrompt;
function updateInstallButton() {
  installButton.hidden = standalone.matches || navigator.standalone === true || (!installPrompt && !isAppleMobile);
  installButton.textContent = installPrompt ? '安裝 App' : '加入主畫面';
}
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  updateInstallButton();
});
installButton.addEventListener('click', async () => {
  cancelInteraction();
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = null;
    await prompt.prompt();
    updateInstallButton();
  } else if (isAppleMobile) installDialog.showModal();
});
installDialog.querySelector('.install-close').addEventListener('click', () => installDialog.close());
installDialog.addEventListener('close', () => restoreDialogFocus(installButton, installDialog));
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton.hidden = true;
});
standalone.addEventListener('change', updateInstallButton);
updateInstallButton();
