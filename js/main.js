// ─── Live Open / Closed status badge ───
(function initShopStatus() {
  var el   = document.getElementById('shop-status');
  if (!el) return;
  var dot  = el.querySelector('.status-dot');
  var text = el.querySelector('.status-text');

  var schedule = [
    { open:  9, close: 19 },   // Mo
    { open:  9, close: 19 },   // Di
    { open:  9, close: 19 },   // Mi
    { open:  9, close: 19 },   // Do
    { open:  9, close: 19 },   // Fr
    { open:  9, close: 17 },   // Sa
    null                        // So – geschlossen
  ];

  var dayNames = ['So','Mo','Di','Mi','Do','Fr','Sa'];

  function nextOpenInfo(now) {
    for (var d = 0; d < 7; d++) {
      var check = new Date(now.getTime() + d * 86400000);
      var jsDay = check.getDay();
      var idx   = jsDay === 0 ? 6 : jsDay - 1;
      var slot  = schedule[idx];
      if (!slot) continue;
      if (d === 0) {
        var mins = check.getHours() * 60 + check.getMinutes();
        if (mins < slot.open * 60) {
          return 'Öffnet heute um ' + pad(slot.open) + ':00';
        }
        continue;
      }
      return 'Öffnet ' + dayNames[jsDay] + ' um ' + pad(slot.open) + ':00';
    }
    return '';
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function update() {
    var now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
    var jsDay = now.getDay();
    var idx   = jsDay === 0 ? 6 : jsDay - 1;
    var slot  = schedule[idx];
    var mins  = now.getHours() * 60 + now.getMinutes();

    el.classList.remove('is-open', 'is-closing', 'is-closed');

    if (slot && mins >= slot.open * 60 && mins < slot.close * 60) {
      var left = slot.close * 60 - mins;
      if (left <= 30) {
        el.classList.add('is-closing');
        text.textContent = 'Schließt um ' + pad(slot.close) + ':00';
      } else {
        el.classList.add('is-open');
        text.textContent = 'Jetzt geöffnet';
      }
    } else {
      el.classList.add('is-closed');
      var info = nextOpenInfo(now);
      text.textContent = info ? 'Geschlossen · ' + info : 'Geschlossen';
    }

    if (!el.classList.contains('ready')) el.classList.add('ready');
  }

  update();
  setInterval(update, 60000);
})();

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

// Fixed header height for layout (no hamburger — nav is always in the bar)
(function syncHeaderBarHeight() {
  function sync() {
    const inner = document.querySelector('.header-inner');
    if (inner) {
      document.documentElement.style.setProperty('--header-h', `${inner.offsetHeight}px`);
    }
  }
  sync();
  window.addEventListener('resize', sync, { passive: true });
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

// ─── Impressum modal ───
(function initImpressum() {
  var modal    = document.getElementById('impressum-modal');
  var openBtn  = document.getElementById('impressum-open');
  var closeBtn = document.getElementById('impressum-close');
  var backdrop = document.getElementById('impressum-backdrop');
  if (!modal || !openBtn) return;

  function open(e) {
    e.preventDefault();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn && closeBtn.focus();
  }
  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
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

// ─── Gallery: auto-rotating showcase with category tabs ───
(function initGallery() {
  var THUMBS = 6;
  var CYCLE_MS = 3500;

  var allImages = [
    {s:'images/gallery/male1.jpg',     a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male2.jpg',     a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male3.jpg',     a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male4.jpg',     a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male5.jpg',     a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male6.jpg',     a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male7.jpg',     a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male8.jpg',     a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male9.jpg',     a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male10.jpg',    a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/male11.jpg',    a:'Herrenhaarschnitt',  c:'herren'},
    {s:'images/gallery/female1.jpg',   a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female2.jpg',   a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female3.jpg',   a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female4.jpg',   a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female5.jpg',   a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female6.jpg',   a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female7.jpg',   a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female8.jpg',   a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female9.jpg',   a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female10.jpg',  a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female11.jpg',  a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female12.jpg',  a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female13.jpg',  a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female14.jpg',  a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female15.jpg',  a:'Damenhaarschnitt',   c:'damen'},
    {s:'images/gallery/female16.jpg',  a:'Damenhaarschnitt',   c:'damen'}
  ];

  var featEl   = document.getElementById('gal-feat');
  var thumbsEl = document.getElementById('gal-thumbs');
  var tabs     = document.querySelectorAll('.gal-tab');

  var pool = [];
  var shown = [];
  var timer = null;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function filtered(cat) {
    if (cat === 'alle') return allImages.slice();
    return allImages.filter(function(img) { return img.c === cat; });
  }

  function build(cat) {
    clearInterval(timer);
    var imgs = shuffle(filtered(cat));
    var visible = imgs.slice(0, 1 + THUMBS);
    pool = imgs.slice(1 + THUMBS);

    featEl.classList.remove('fading');
    featEl.src = visible[0].s;
    featEl.alt = visible[0].a;

    thumbsEl.innerHTML = '';
    for (var i = 1; i < visible.length; i++) {
      var d = document.createElement('div');
      d.className = 'gal-thumb';
      var im = document.createElement('img');
      im.src = visible[i].s;
      im.alt = visible[i].a;
      im.loading = 'lazy';
      im.decoding = 'async';
      d.appendChild(im);
      thumbsEl.appendChild(d);
    }

    shown = visible.slice();
    timer = setInterval(rotate, CYCLE_MS);
  }

  function rotate() {
    if (pool.length === 0) {
      var srcs = {};
      for (var k = 0; k < shown.length; k++) srcs[shown[k].s] = true;
      pool = shuffle(filtered(activeCat).filter(function(img) { return !srcs[img.s]; }));
      if (pool.length === 0) return;
    }

    var ti = Math.floor(Math.random() * THUMBS);
    var thumbDiv = thumbsEl.children[ti];
    if (!thumbDiv) return;
    var thumbImg = thumbDiv.querySelector('img');

    var newFeat = shown[ti + 1];
    pool.push(shown[0]);
    var newThumb = pool.shift();

    featEl.classList.add('fading');
    setTimeout(function() {
      featEl.src = newFeat.s;
      featEl.alt = newFeat.a;
      setTimeout(function() { featEl.classList.remove('fading'); }, 60);
    }, 700);

    thumbImg.classList.add('fading');
    setTimeout(function() {
      thumbImg.src = newThumb.s;
      thumbImg.alt = newThumb.a;
      setTimeout(function() { thumbImg.classList.remove('fading'); }, 60);
    }, 500);

    shown[0] = newFeat;
    shown[ti + 1] = newThumb;
  }

  var activeCat = 'alle';
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      activeCat = tab.dataset.cat;
      tabs.forEach(function(t) { t.classList.toggle('active', t === tab); });
      build(activeCat);
    });
  });

  // ── Lightbox ──
  var lb      = document.getElementById('lb');
  var lbImg   = document.getElementById('lb-img');
  var lbCount = document.getElementById('lb-counter');
  var lbBg    = lb.querySelector('.lb-bg');
  var lbClose = lb.querySelector('.lb-close');
  var lbPrev  = lb.querySelector('.lb-prev');
  var lbNext  = lb.querySelector('.lb-next');
  var lbList  = [];
  var lbIdx   = 0;

  function lbShow(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    lbImg.src = lbList[lbIdx].s;
    lbImg.alt = lbList[lbIdx].a;
    lbCount.textContent = (lbIdx + 1) + ' / ' + lbList.length;
  }

  function lbOpen(src) {
    lbList = filtered(activeCat);
    var startIdx = 0;
    for (var i = 0; i < lbList.length; i++) {
      if (src.indexOf(lbList[i].s) !== -1) { startIdx = i; break; }
    }
    lbShow(startIdx);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    clearInterval(timer);
  }

  function lbCloseFunc() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbImg.src = '';
    timer = setInterval(rotate, CYCLE_MS);
  }

  lbClose.addEventListener('click', lbCloseFunc);
  lbBg.addEventListener('click', lbCloseFunc);
  lbPrev.addEventListener('click', function() { lbShow(lbIdx - 1); });
  lbNext.addEventListener('click', function() { lbShow(lbIdx + 1); });

  document.addEventListener('keydown', function(e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     lbCloseFunc();
    if (e.key === 'ArrowLeft')  lbShow(lbIdx - 1);
    if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
  });

  var touchX = 0;
  lb.addEventListener('touchstart', function(e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) lbShow(dx < 0 ? lbIdx + 1 : lbIdx - 1);
  }, { passive: true });

  // Click handlers on gallery images
  featEl.style.cursor = 'pointer';
  featEl.addEventListener('click', function() { lbOpen(featEl.src); });

  var galLayout = document.getElementById('gal-layout');
  galLayout.addEventListener('click', function(e) {
    var thumb = e.target.closest('.gal-thumb');
    if (!thumb) return;
    var img = thumb.querySelector('img');
    if (img) lbOpen(img.src);
  });

  build('alle');
})();
