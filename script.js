/* ═══════════════════════════════════════
   ФЛАГИ УСТРОЙСТВА — объявляем первыми!
═══════════════════════════════════════ */
const isMobile       = window.matchMedia('(max-width: 900px)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ═══════════════════════════════════════
   0. ЭКРАН ЗАГРУЗКИ
   document.fonts.ready — ждём реально шрифты,
   но не дольше 2.5с (fallback таймер)
═══════════════════════════════════════ */
const loader = document.getElementById("loader");

function hideLoader() {
  loader.classList.add("hidden");
  document.body.classList.remove("loading");
}

// Страховочный таймер — если шрифты не грузятся > 2.5s, показываем всё равно
const loaderTimeout = setTimeout(hideLoader, 2500);

document.fonts.ready.then(() => {
  clearTimeout(loaderTimeout);
  // Небольшая пауза чтобы первый кадр рендера с шрифтами успел нарисоваться
  requestAnimationFrame(() => requestAnimationFrame(hideLoader));
});


/* ═══════════════════════════════════════
   1. TICKER — RAF-анимация, абсолютно бесшовная
   Клонируем оригинальные items один раз,
   двигаем через translateX на каждый кадр,
   сбрасываем когда прошли ровно ширину оригинала.
═══════════════════════════════════════ */
(function initTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track || prefersReduced) return;

  // Ждём layout, чтобы браузер посчитал реальную ширину
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const originalItems = Array.from(track.children);
      const originalCount = originalItems.length;

      // Дублируем пока трек не перекрывает экран минимум в 3 раза
      while (track.scrollWidth < window.innerWidth * 3) {
        originalItems.forEach(item => track.appendChild(item.cloneNode(true)));
      }

      // Ширина одного полного набора оригинальных элементов
      // (суммируем только первые originalCount детей после layout)
      let singleSetWidth = 0;
      Array.from(track.children).slice(0, originalCount).forEach(el => {
        singleSetWidth += el.getBoundingClientRect().width;
      });

      // Если ширина ещё не посчиталась — fallback через scrollWidth
      if (singleSetWidth === 0) {
        singleSetWidth = track.scrollWidth / Math.floor(track.children.length / originalCount);
      }

      let x = 0;
      const speed = 0.6; // px за кадр (~36px/s на 60fps)

      function step() {
        x += speed;
        if (x >= singleSetWidth) x -= singleSetWidth; // сброс без прыжка
        track.style.transform = `translateX(${-x}px)`;
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  });
})();


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
   2. КАРТОЧКИ HERO — только десктоп
   anim.onfinish → cancel() → inline style
   чтобы hover-трансформы работали после
═══════════════════════════════════════ */
if (!isMobile) {
  const baseRots  = [-4, 3.5, 2, -3];
  const heroCards = document.querySelectorAll('.hero-right .sticker-card');

  heroCards.forEach((card, i) => {
    const rot = baseRots[i];
    card.style.opacity   = '0';
    card.style.transform = `rotate(${rot}deg) translateY(36px) scale(0.9)`;

    setTimeout(() => {
      const dur  = prefersReduced ? 0 : 550;
      const anim = card.animate([
        { opacity: 0, transform: `rotate(${rot}deg) translateY(36px) scale(0.9)` },
        { opacity: 1, transform: `rotate(${rot}deg) translateY(0) scale(1.03)` },
        { opacity: 1, transform: `rotate(${rot}deg) translateY(0) scale(1)` }
      ], { duration: dur, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });

      anim.onfinish = () => {
        anim.cancel();
        card.style.opacity   = '1';
        card.style.transform = `rotate(${rot}deg)`;

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
    }, prefersReduced ? 0 : 700 + i * 120);
  });
}


/* ═══════════════════════════════════════
   3. ЖЕЛЕ — только десктоп, passive listener
═══════════════════════════════════════ */
if (!isMobile && !prefersReduced) {
  const apEl = document.querySelector('h1 .accent-pink');
  const amEl = document.querySelector('h1 .accent-mint');

  const J = {
    pink: { cx:0, cy:0, tx:0, ty:0, base:-1   },
    mint: { cx:0, cy:0, tx:0, ty:0, base: 1.2  },
  };
  const R=220, S=0.26, L=0.07;

  let mx=0, my=0;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; }, { passive:true });

  let raf;
  function loop() {
    [[J.pink, apEl],[J.mint, amEl]].forEach(([s, el]) => {
      if (!el) return;
      const r  = el.getBoundingClientRect();
      const dx = mx-(r.left+r.width/2), dy = my-(r.top+r.height/2);
      const d  = Math.hypot(dx,dy);
      s.tx = d<R ? dx*(1-d/R)*S : 0;
      s.ty = d<R ? dy*(1-d/R)*S : 0;
      s.cx += (s.tx-s.cx)*L;
      s.cy += (s.ty-s.cy)*L;
      el.style.transform = `rotate(${s.base+s.cx*0.055}deg) translate(${s.cx}px,${s.cy}px)`;
    });
    raf = requestAnimationFrame(loop);
  }
  loop();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf); else loop();
  });
}


/* ═══════════════════════════════════════
   4. STATS — scroll reveal + счётчик
═══════════════════════════════════════ */
const statsEl  = document.querySelector('.stats');
const statData = [
  { end:200, suffix:'+' },
  { end:3,   suffix:' г' },
  { end:98,  suffix:'%' },
  { end:null },
];

function animCount(el, end, suffix) {
  if (prefersReduced) { el.textContent = end+suffix; return; }
  const t0=performance.now(), dur=850;
  (function step(now){
    const p=Math.min((now-t0)/dur,1);
    const e=1-Math.pow(2,-10*p);
    el.textContent=Math.round(e*end)+suffix;
    if(p<1) requestAnimationFrame(step);
  })(t0);
}

let statsHit=false;
new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting && !statsHit){
    statsHit=true;
    statsEl.classList.add('in-view');
    document.querySelectorAll('.stat-item').forEach((item,i)=>{
      const d=statData[i];
      if(d.end!==null)
        setTimeout(()=>animCount(item.querySelector('.stat-num'),d.end,d.suffix), i*110);
    });
  }
},{threshold:0.25}).observe(statsEl);


/* ═══════════════════════════════════════
   5. ПОРТФОЛИО — stagger через data-delay,
   надёжно работает в columns layout
═══════════════════════════════════════ */
const workCards = document.querySelectorAll('.work-card');

// Расставляем data-delay по колонкам: 0,1,2,0,1,2...
// На мобиле grid — stagger по позиции в ряду (колонка 0 или 1)
workCards.forEach((card,i) => {
  const delay = isMobile ? i % 2 : i % 6;
  card.setAttribute('data-delay', delay);
});

// Scroll-reveal — очень щедрый rootMargin чтобы карточки успевали появиться
const workObs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in-view');
      workObs.unobserve(e.target);
    }
  });
},{threshold: 0, rootMargin:'0px 0px 60px 0px'});
workCards.forEach(c=>workObs.observe(c));

// Страховка: если карточки уже в viewport при загрузке — показываем сразу
// (актуально когда пользователь перезагружает страницу с якорем #works)
setTimeout(() => {
  workCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight + 60) {
      card.classList.add('in-view');
    }
  });
}, 100);

// Фильтры
document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tag=btn.dataset.filter;
    let vi=0;
    workCards.forEach(card=>{
      const match=tag==='all'||card.dataset.tags.includes(tag);
      card.style.display=match?'':'none';
      if(match && !prefersReduced){
        card.animate(
          [{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],
          {duration:300, delay:vi*30, easing:'cubic-bezier(.22,1,.36,1)', fill:'forwards'}
        );
        vi++;
      }
    });
  });
});


/* ═══════════════════════════════════════
   6. МОБИЛЬНОЕ МЕНЮ
═══════════════════════════════════════ */
const burger     = document.querySelector('.burger');
const mobileMenu = document.querySelector('.mobile-menu');
const menuClose  = document.querySelector('.mobile-menu-close');

function closeMenu(){
  burger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  document.body.style.overflow='';
}
burger?.addEventListener('click',()=>{
  burger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow=mobileMenu.classList.contains('open')?'hidden':'';
});
menuClose?.addEventListener('click',closeMenu);
mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));