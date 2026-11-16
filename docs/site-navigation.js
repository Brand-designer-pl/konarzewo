(() => {
  const host = document.querySelector('[data-site-header]');
  if (!host) return;

  const root = new URL('.', document.currentScript.src).pathname;
  const investments = [
    ['Konarzewo', 'konarzewo'],
    ['Kamionki', 'kamionki'],
    ['Sierniki', 'sierniki'],
    ['Mosina', 'mosina'],
  ];
  const active = investments.find(([, slug]) => location.pathname.startsWith(root + slug + '/'));
  const home = location.pathname === root || location.pathname === root + 'index.html';

  host.innerHTML = `
    <a class="site-brand" href="${root}" aria-label="Mario-Bud — strona główna">
      <img src="${root}assets/mario-bud-logo.svg?v=brand9" alt="Mario-Bud" width="567" height="270">
    </a>
    <button type="button" class="site-menu-toggle" aria-expanded="false" aria-controls="site-main-menu">
      <span>Menu</span><span class="site-menu-lines" aria-hidden="true"></span>
    </button>
    <nav id="site-main-menu" aria-label="Menu główne">
      <a href="${root}"${home ? ' aria-current="page"' : ''}>Strona główna</a>
      <div class="site-investments">
        <button class="site-investments-toggle${active ? ' is-current' : ''}" type="button" aria-expanded="false" aria-controls="site-investments-menu">
          Inwestycje
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m2 4 4 4 4-4" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <div id="site-investments-menu" class="site-investments-menu" hidden>
          <a href="${root}#inwestycje">Wszystkie inwestycje</a>
          ${investments.map(([name, slug]) => `
            <a href="${root + slug}/"${active?.[1] === slug ? ' aria-current="page"' : ''}>${name}</a>
          `).join('')}
        </div>
      </div>
      <a href="${root}#kontakt">Kontakt</a>
    </nav>`;

  const menuToggle = host.querySelector('.site-menu-toggle');
  const group = host.querySelector('.site-investments');
  const investmentsToggle = group.querySelector('button');
  const submenu = group.querySelector('.site-investments-menu');

  function setInvestments(open) {
    investmentsToggle.setAttribute('aria-expanded', String(open));
    submenu.hidden = !open;
  }

  function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    host.classList.toggle('is-menu-open', open);
    if (!open) setInvestments(false);
  }

  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  investmentsToggle.addEventListener('click', () => setInvestments(submenu.hidden));
  group.addEventListener('focusout', event => {
    if (event.relatedTarget && !group.contains(event.relatedTarget)) setInvestments(false);
  });
  host.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => {
    if (submenu.contains(link)) investmentsToggle.focus();
    setMenu(false);
    if (getComputedStyle(menuToggle).display !== 'none') menuToggle.focus();
  }));
  document.addEventListener('click', event => {
    if (!host.contains(event.target)) setMenu(false);
    else if (!group.contains(event.target)) setInvestments(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!submenu.hidden) {
      setInvestments(false);
      investmentsToggle.focus();
    } else if (host.classList.contains('is-menu-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  const update = () => host.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
