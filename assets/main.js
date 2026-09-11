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
