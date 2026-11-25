(() => {
  const root = document.documentElement;
  const languageToggle = document.querySelector('.language-toggle');
  const themeToggle = document.querySelector('.theme-toggle');
  if (document.body.classList.contains('relay-page')) {
    document.querySelector('.footer-controls').append(languageToggle, themeToggle);
  }
  const solutions = document.querySelector('.site-header .nav-group');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const fallback = {
    it: { 'ui.nav': 'Navigazione principale', 'ui.skip': 'Vai al contenuto', 'ui.switchTo': "Passa all'inglese", 'ui.footerHome': "Tetravise, torna all'inizio", 'ui.footerSiteHome': 'Tetravise, vai alla home', 'ui.brandTop': 'Tetravise, inizio pagina', 'ui.brandHome': 'Tetravise, vai alla home', 'ui.backToTop': 'Torna in cima', 'ui.themeLight': 'Attiva tema chiaro', 'ui.themeDark': 'Attiva tema scuro', 'ui.linkedinNewTab': '(apre una nuova scheda)' },
    en: { 'ui.nav': 'Main navigation', 'ui.skip': 'Skip to content', 'ui.switchTo': 'Switch to Italian', 'ui.footerHome': 'Tetravise, back to top', 'ui.footerSiteHome': 'Tetravise, go to home page', 'ui.brandTop': 'Tetravise, back to top', 'ui.brandHome': 'Tetravise, go to home page', 'ui.backToTop': 'Back to top', 'ui.themeLight': 'Switch to light theme', 'ui.themeDark': 'Switch to dark theme', 'ui.linkedinNewTab': '(opens a new tab)' },
  };
  let translations = fallback;
  languageToggle.disabled = true;

  function applyTheme(preference) {
    const theme = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    const label = (translations[root.dataset.language] || fallback.it)[theme === 'dark' ? 'ui.themeLight' : 'ui.themeDark'];
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#111B18' : '#F5F6F2';
  }

  function applyLanguage(language) {
    const labels = translations[language] || fallback[language];
    root.dataset.language = language;
    root.lang = language;
    document.querySelector('.site-header .nav').setAttribute('aria-label', labels['ui.nav']);
    document.querySelector('.skip-link').textContent = labels['ui.skip'];
    const brand = document.querySelector('.site-header .brand');
    brand.setAttribute('aria-label', labels[brand.getAttribute('href') === '#top' ? 'ui.brandTop' : 'ui.brandHome']);
    const footerBrand = document.querySelector('.footer-brand');
    footerBrand.setAttribute('aria-label', labels[footerBrand.getAttribute('href') === '#top' ? 'ui.footerHome' : 'ui.footerSiteHome']);
    const backToTop = document.querySelector('.back-to-top');
    backToTop.setAttribute('aria-label', labels['ui.backToTop']);
    backToTop.title = labels['ui.backToTop'];
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const value = labels[element.dataset.i18n];
      if (value) element.textContent = value;
    });
    document.querySelectorAll('.linkedin-link').forEach(link => {
      const name = link.closest('.person').querySelector('h3').textContent;
      link.setAttribute('aria-label', `${name} ${labels['ui.linkedinNewTab']}`);
    });
    const teamBios = {
      'giovanni-cioli-puviani.webp': 'team.giovanni.bio',
      'alex-mengoli.webp': 'team.alex.bio',
      'riccardo-siena.webp': 'team.riccardo.bio',
      'azmi-hamdi.webp': 'team.azmi.bio',
    };
    document.querySelectorAll('.team .person').forEach(person => {
      const image = person.querySelector('img')?.getAttribute('src')?.split('/').pop();
      const value = labels[teamBios[image]];
      if (value) person.querySelector('.bio').textContent = value;
    });
    languageToggle.textContent = language.toUpperCase();
    languageToggle.setAttribute('aria-label', labels['ui.switchTo']);
    languageToggle.title = labels['ui.switchTo'];
    applyTheme(root.dataset.themePreference || 'system');
    document.dispatchEvent(new CustomEvent('tetravise:language', { detail: { language, labels } }));
  }

  document.addEventListener('click', event => {
    if (!solutions.contains(event.target) || event.target.closest('a')) solutions.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && solutions.open) {
      solutions.open = false;
      solutions.querySelector('summary').focus();
    }
  });
  themeToggle.addEventListener('click', () => {
    const preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(preference);
    try { localStorage.setItem('tetravise-theme', preference); } catch {}
  });
  systemTheme.addEventListener('change', () => {
    if (root.dataset.themePreference === 'system') applyTheme('system');
  });
  languageToggle.addEventListener('click', () => {
    const language = root.dataset.language === 'en' ? 'it' : 'en';
    applyLanguage(language);
    try { localStorage.setItem('tetravise-language', language); } catch {}
  });

  const backToTop = document.querySelector('.back-to-top');
  const footer = document.querySelector('.site-footer');
  backToTop.classList.add('is-floating');
  function updateBackToTop() {
    const footerRect = footer.getBoundingClientRect();
    const footerVisible = footerRect.top < window.innerHeight && footerRect.bottom > 0;
    const visible = window.scrollY > 480 && !footerVisible;
    if (!visible && document.activeElement === backToTop) document.querySelector(document.body.classList.contains('relay-page') ? '.site-header .home-link' : '.site-header .brand').focus({ preventScroll: true });
    backToTop.classList.toggle('is-visible', visible);
    backToTop.inert = !visible;
    backToTop.setAttribute('aria-hidden', String(!visible));
  }
  updateBackToTop();
  new IntersectionObserver(updateBackToTop).observe(footer);
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  window.addEventListener('resize', updateBackToTop);
  window.addEventListener('pageshow', updateBackToTop);

  applyTheme(root.dataset.themePreference || 'system');
  fetch(new URL('i18n.json', document.currentScript.src), { cache: 'no-store' })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => { translations = data; languageToggle.disabled = false; applyLanguage(root.dataset.language || 'it'); })
    .catch(() => { applyLanguage('it'); });
})();