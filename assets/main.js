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
