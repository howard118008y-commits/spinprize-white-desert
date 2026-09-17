const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

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
  contactTrigger.focus();
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
  workTrigger.focus({ preventScroll: true });
});
