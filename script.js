/* ═══════════════════════════════════════
   ОПРЕДЕЛЯЕМ ВОЗМОЖНОСТИ УСТРОЙСТВА
   isMobile — отключаем jelly и тяжёлые эффекты
   prefersReduced — уважаем системные настройки
═══════════════════════════════════════ */
const isMobile       = window.matchMedia('(max-width: 900px)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ═══════════════════════════════════════
   1. CURSOR (только десктоп)
═══════════════════════════════════════ */
if (!isMobile) {
  function setCursor(color) {
    const enc = encodeURIComponent(color);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'><path d='M4 2 L4 16 L7.5 12.5 L10 18 L12 17 L9.5 11.5 L14 11.5 Z' fill='${enc}' stroke='%232B1B3A' stroke-width='1.5' stroke-linejoin='round'/></svg>`;
    document.body.style.cursor = `url("data:image/svg+xml,${svg}") 4 2, auto`;
  }
  const cursorMap = [
    ['.sticker-card', '#C9AAFF'],
    ['.btn-main',     '#FF6E6E'],
    ['.btn-sec',      '#FFE566'],
    ['.stat-item',    '#7EEAC0'],
    ['.nav-links a',  '#FF8AC4'],
    ['.filter-btn',   '#FF8AC4'],
    ['.work-card',    '#C9AAFF'],
  ];
  document.querySelectorAll(cursorMap.map(([s]) => s).join(',')).forEach(el => {
    const color = cursorMap.find(([s]) => el.matches(s))?.[1] ?? '#FF8AC4';
    el.addEventListener('mouseenter', () => setCursor(color));
    el.addEventListener('mouseleave', () => setCursor('#FF8AC4'));
  });
}


/* ═══════════════════════════════════════
   2. КАРТОЧКИ HERO — пружинное появление
   anim.onfinish → cancel() → inline style
   чтобы hover работал после анимации
═══════════════════════════════════════ */
if (!isMobile) {
  const baseRots   = [-4, 3.5, 2, -3];
  const heroCards  = document.querySelectorAll('.hero-right .sticker-card');

  heroCards.forEach((card, i) => {
    const rot = baseRots[i];
    card.style.opacity   = '0';
    card.style.transform = `rotate(${rot}deg) translateY(40px) scale(0.88)`;

    setTimeout(() => {
      const anim = card.animate([
        { opacity: 0, transform: `rotate(${rot}deg) translateY(40px) scale(0.88)` },
        { opacity: 1, transform: `rotate(${rot}deg) translateY(0) scale(1.04)` },
        { opacity: 1, transform: `rotate(${rot}deg) translateY(0) scale(1)` }
      ], { duration: prefersReduced ? 0 : 600, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });

      anim.onfinish = () => {
        anim.cancel();
        card.style.opacity   = '1';
        card.style.transform = `rotate(${rot}deg)`;
        // вешаем hover только после завершения появления
        card.addEventListener('mouseenter', () => {
          card.style.transition = 'transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s';
          card.style.transform  = `rotate(0deg) translateY(-8px) scale(1.05)`;
          card.style.boxShadow  = '10px 10px 0 #2B1B3A';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transition = 'transform 0.4s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s';
          card.style.transform  = `rotate(${rot}deg)`;
          card.style.boxShadow  = '6px 6px 0 #2B1B3A';
        });
      };
    }, prefersReduced ? 0 : 800 + i * 130);
  });
}


/* ═══════════════════════════════════════
   3. ЖЕЛЕ на акцентах — только десктоп
   passive:true на mousemove = не блокирует скролл
═══════════════════════════════════════ */
if (!isMobile && !prefersReduced) {
  const accentPink = document.querySelector('h1 .accent-pink');
  const accentMint = document.querySelector('h1 .accent-mint');

  const jelly = {
    pink: { cx: 0, cy: 0, tx: 0, ty: 0, baseRot: -1   },
    mint: { cx: 0, cy: 0, tx: 0, ty: 0, baseRot:  1.2  },
  };
  const RADIUS   = 220;
  const STRENGTH = 0.26;
  const LERP     = 0.07;

  function elCenter(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
  }, { passive: true });

  let jellyRAF = null;
  function jellyLoop() {
    [['pink', accentPink], ['mint', accentMint]].forEach(([k, el]) => {
      if (!el) return;
      const c    = elCenter(el);
      const dx   = mx - c.x, dy = my - c.y;
      const dist = Math.hypot(dx, dy);
      const s    = jelly[k];

      s.tx = dist < RADIUS ? dx * (1 - dist / RADIUS) * STRENGTH : 0;
      s.ty = dist < RADIUS ? dy * (1 - dist / RADIUS) * STRENGTH : 0;
      s.cx += (s.tx - s.cx) * LERP;
      s.cy += (s.ty - s.cy) * LERP;

      // Пропускаем рендер если смещение незначительное (< 0.1px)
      if (Math.abs(s.cx) > 0.1 || Math.abs(s.cy) > 0.1 || Math.abs(s.tx) > 0.1) {
        el.style.transform = `rotate(${s.baseRot + s.cx * 0.055}deg) translate(${s.cx}px, ${s.cy}px)`;
      }
    });
    jellyRAF = requestAnimationFrame(jellyLoop);
  }
  jellyLoop();

  // Останавливаем rAF когда страница в фоне
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(jellyRAF);
    else jellyLoop();
  });
}


/* ═══════════════════════════════════════
   4. STATS — scroll reveal + счётчик
═══════════════════════════════════════ */
const statsEl  = document.querySelector('.stats');
const statData = [
  { end: 200, suffix: '+' },
  { end: 3,   suffix: ' г' },
  { end: 98,  suffix: '%' },
  { end: null },
];

function animCount(el, end, suffix, dur = 900) {
  if (prefersReduced) { el.textContent = end + suffix; return; }
  const t0 = performance.now();
  (function step(now) {
    const p    = Math.min((now - t0) / dur, 1);
    const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    el.textContent = Math.round(ease * end) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

let statsAnimated = false;
new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !statsAnimated) {
    statsAnimated = true;
    statsEl.classList.add('in-view');
    document.querySelectorAll('.stat-item').forEach((item, i) => {
      const d = statData[i];
      if (d.end !== null)
        setTimeout(() => animCount(item.querySelector('.stat-num'), d.end, d.suffix), i * 120);
    });
  }
}, { threshold: 0.3 }).observe(statsEl);


/* ═══════════════════════════════════════
   5. ПОРТФОЛИО — фильтры
═══════════════════════════════════════ */
const filterBtns = document.querySelectorAll('.filter-btn');
const workCards  = document.querySelectorAll('.work-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tag = btn.dataset.filter;
    let visIdx = 0;
    workCards.forEach(card => {
      const match = tag === 'all' || card.dataset.tags.includes(tag);
      if (match) {
        card.style.display = '';
        if (!prefersReduced) {
          card.animate(
            [{ opacity: 0, transform: 'translateY(14px) scale(0.97)' },
             { opacity: 1, transform: 'translateY(0) scale(1)' }],
            { duration: 320, delay: visIdx * 35, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
          );
        }
        visIdx++;
      } else {
        card.style.display = 'none';
      }
    });
  });
});

/* Scroll-reveal карточек портфолио */
const workObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in-view'); workObs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
workCards.forEach(c => workObs.observe(c));


/* ═══════════════════════════════════════
   6. МОБИЛЬНОЕ МЕНЮ
═══════════════════════════════════════ */
const burger     = document.querySelector('.burger');
const mobileMenu = document.querySelector('.mobile-menu');
const menuClose  = document.querySelector('.mobile-menu-close');

function closeMenu() {
  burger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  document.body.style.overflow = '';
}
burger?.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});
menuClose?.addEventListener('click', closeMenu);
mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));