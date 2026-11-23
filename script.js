'use strict';
(() => {
  const root = document.documentElement;
  const themeButtons = document.querySelectorAll('.theme-toggle');
  try { if (localStorage.getItem('ac-portfolio-theme') === 'dark') root.dataset.theme = 'dark'; } catch (_) {}
  const syncTheme = () => {
    const dark = root.dataset.theme === 'dark';
    themeButtons.forEach(btn => {
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    });
  };
  syncTheme();
  themeButtons.forEach(btn => btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ac-portfolio-theme', root.dataset.theme); } catch (_) {}
    syncTheme();
  }));
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }));
  }
  document.querySelectorAll('[data-fallback-on-error]').forEach(img => {
    img.addEventListener('error', () => { img.hidden = true; });
    if (img.complete && img.naturalWidth === 0) img.hidden = true;
  });
  const filters = document.querySelectorAll('.filter-chip');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
    document.querySelectorAll('.project-card[data-category]').forEach(card => { card.hidden = btn.dataset.filter !== 'all' && card.dataset.category !== btn.dataset.filter; });
  }));
  const revealEls = document.querySelectorAll('.reveal');
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px 70px 0px' });
    revealEls.forEach(el => observer.observe(el));
  } else revealEls.forEach(el => el.classList.add('in-view'));
  // Exposed only to enhance new cards added by the CMS content loader.
  window.portfolioRevealNew = () => document.querySelectorAll('.reveal:not(.in-view)').forEach(el => { if ('IntersectionObserver' in window) observer.observe(el); else el.classList.add('in-view'); });
  const progress = document.querySelector('.scroll-progress');
  if (progress) {
    let scheduled = false;
    const update = () => {
      const available = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      progress.style.width = (Math.min(1, scrollY / available) * 100) + '%';
      scheduled = false;
    };
    addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update); update();
  }
  // Guaranteed back-to-top on both homepage and project pages. This does not
  // rely on a URL fragment, sticky-header behavior, or repeated link clicks.
  document.querySelectorAll('.back-to-top').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top: 0, left: 0, behavior: reduced ? 'instant' : 'smooth'});
    });
  });
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
