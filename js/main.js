// Intersection observer for scroll animations
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('vis'); });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.fi').forEach(el => io.observe(el));

// Header border intensity on scroll
const hdr = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  hdr.style.borderBottomColor = scrollY > 60
    ? 'rgba(201,150,43,0.45)' : 'rgba(201,150,43,0.22)';
}, { passive: true });

// Mobile nav toggle + active section link (scroll spy)
(function initHeaderNav() {
  const header = document.getElementById('site-header');
  const nav = document.getElementById('main-nav');
  const toggle = document.getElementById('nav-toggle');
  if (!header || !nav || !toggle) return;

  const mqMobile = window.matchMedia('(max-width: 820px)');

  function syncHeaderHeight() {
    const inner = document.querySelector('.header-inner');
    if (inner) {
      document.documentElement.style.setProperty('--header-h', `${inner.offsetHeight}px`);
    }
  }

  function closeNav() {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menü öffnen');
    syncHeaderHeight();
  }

  function openNav() {
    syncHeaderHeight();
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Menü schließen');
  }

  syncHeaderHeight();
  window.addEventListener('resize', () => {
    syncHeaderHeight();
    if (!mqMobile.matches) closeNav();
  });

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (nav.classList.contains('open')) closeNav();
    else openNav();
  });

  nav.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', () => {
      if (mqMobile.matches) closeNav();
    });
  });

  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('open')) return;
    if (!header.contains(e.target)) closeNav();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) closeNav();
  });
})();

(function initNavActiveLink() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sectionIds = ['home', 'leistungen', 'preise', 'galerie', 'ueber-uns', 'kontakt'];

  function headerOffset() {
    const h = document.getElementById('site-header');
    return h ? h.getBoundingClientRect().height : 96;
  }

  let ticking = false;
  function update() {
    ticking = false;
    const scrollPos = window.scrollY + headerOffset() + 24;
    let current = 'home';
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (scrollPos >= top) current = id;
    }
    links.forEach((link) => {
      const id = link.getAttribute('href').slice(1);
      const on = id === current && current !== 'home';
      link.classList.toggle('active', on);
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { update(); });
  update();
})();

// ─── Google reviews marquee (data from reviews-data.js, no public JSON URL) ───
(function initTestimonialMarquee() {
  const track = document.getElementById('testi-marquee-track');
  const list = typeof window.__ORB_REVIEWS === 'undefined' ? [] : window.__ORB_REVIEWS;
  if (!track || !list.length) return;

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function initialFromName(name) {
    const s = String(name).trim();
    if (!s) return '?';
    return s[0].toUpperCase();
  }

  function starsHtml(rating) {
    const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const cls = i <= n ? 'star star--on' : 'star star--off';
      html += `<span class="${cls}" aria-hidden="true">★</span>`;
    }
    return html;
  }

  function cardHtml(r) {
    const services = Array.isArray(r.services) ? r.services.filter(Boolean) : [];
    const svcBlock = services.length
      ? `<div class="testi-services">${services.map(s => `<span class="testi-svc">${escapeHtml(s)}</span>`).join('')}</div>`
      : '';
    const owner = r.owner_reply
      ? `<div class="testi-owner"><span class="testi-owner-label">Antwort vom Inhaber</span>${escapeHtml(r.owner_reply)}</div>`
      : '';
    return (
      `<article class="testi-card">` +
        `<div class="testi-card-top">` +
          `<div class="testi-av" aria-hidden="true">${escapeHtml(initialFromName(r.name))}</div>` +
          `<div class="testi-card-head">` +
            `<div class="testi-name">${escapeHtml(r.name)}</div>` +
            `<div class="testi-stats">${escapeHtml(r.stats || '')}</div>` +
          `</div>` +
        `</div>` +
        `<div class="testi-row-stars">` +
          `<span class="testi-stars" aria-label="${escapeHtml(String(r.rating))} von 5 Sternen">${starsHtml(r.rating)}</span>` +
          `<span class="testi-time">${escapeHtml(r.timeframe || '')}</span>` +
        `</div>` +
        `<p class="testi-text">${escapeHtml(r.text || '')}</p>` +
        svcBlock +
        owner +
        `<div class="testi-source">Google Bewertung</div>` +
      `</article>`
    );
  }

  const html = list.map(cardHtml).join('');
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setTrackContent() {
    track.innerHTML = mqReduce.matches ? html : html + html;
  }
  setTrackContent();
  mqReduce.addEventListener('change', setTrackContent);
})();
