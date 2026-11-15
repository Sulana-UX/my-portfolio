const hasGsap = !!(window.gsap && window.ScrollTrigger);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------- split text helpers ---------- */
document.querySelectorAll('.name .word').forEach((w) => {
  w.innerHTML = [...w.textContent].map((c) => `<span class="ch">${c}</span>`).join('');
});
const statement = document.getElementById('statement');
statement.innerHTML = statement.textContent.trim().split(/\s+/)
  .map((w) => `<span class="w">${w}</span>`).join(' ');

/* ---------- make the big name fill the screen width ---------- */
const hero = document.getElementById('home');
const nameEl = document.querySelector('.name-fill');
function fitName() {
  hero.style.setProperty('--name-size', '100px');
  nameEl.style.display = 'inline-block';           // shrink-wrap to measure the real text width
  const ratio = (window.innerWidth * 0.94) / nameEl.offsetWidth;
  nameEl.style.display = '';
  hero.style.setProperty('--name-size', `${100 * ratio}px`);
}
fitName();
addEventListener('resize', fitName);

/* ---------- no GSAP (offline)? show everything plainly ---------- */
if (!hasGsap || reduceMotion) {
  document.getElementById('loader').remove();
  document.querySelectorAll('.statement .w').forEach((w) => (w.style.opacity = 1));
  document.fonts && document.fonts.ready.then(fitName);
} else {
  gsap.registerPlugin(ScrollTrigger);
  initAnimations();
}

function initAnimations() {
  /* hide hero pieces until the loader leaves */
  gsap.set('.name .ch', { yPercent: 110 });
  gsap.set('.photo img', { yPercent: 35, opacity: 0 });
  gsap.set('.nav > *, .hero-meta > *', { y: 24, opacity: 0 });

  const counter = { v: 0 };
  const countEl = document.getElementById('loaderCount');
  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => {
      const img = document.querySelector('.photo img');
      img.complete ? r() : (img.onload = img.onerror = r);
    }),
  ]);

  gsap.timeline()
    .to(counter, {
      v: 100, duration: 1.6, ease: 'power2.inOut',
      onUpdate: () => (countEl.textContent = Math.round(counter.v)),
    })
    .add(() => ready.then(() => { fitName(); intro(); }));

  function intro() {
    gsap.timeline()
      .to('#loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' })
      .to('.name .ch', { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.045 }, '-=0.45')
      .to('.photo img', { yPercent: 0, opacity: 1, duration: 1.5, ease: 'expo.out' }, '-=1.1')
      .to('.nav > *, .hero-meta > *', { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, '-=1.1')
      .add(() => document.getElementById('loader').remove());
  }

  /* ---------- mouse parallax: name & photo move in opposite directions ---------- */
  if (finePointer) {
    const nameX = gsap.quickTo('.name', 'x', { duration: 1, ease: 'power3' });
    const nameY = gsap.quickTo('.name', 'y', { duration: 1, ease: 'power3' });
    const photoX = gsap.quickTo('#photo', 'x', { duration: 1.2, ease: 'power3' });
    hero.addEventListener('mousemove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      nameX(nx * -40); nameY(ny * -20);
      photoX(nx * 25);
    });
    hero.addEventListener('mouseleave', () => { nameX(0); nameY(0); photoX(0); });
  }

  /* ---------- nav gets a frosted background after leaving the top ---------- */
  ScrollTrigger.create({
    start: 80,
    onToggle: (self) => document.querySelector('.nav').classList.toggle('scrolled', self.isActive),
  });

  /* ---------- scroll: hero depth parallax ---------- */
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .to('.name-wrap', { yPercent: 60, scale: 0.9, ease: 'none' }, 0)
    .to('#photo', { yPercent: 12, scale: 1.08, ease: 'none' }, 0)
    .to('.hero-meta', { opacity: 0, y: -40, ease: 'none' }, 0);

  /* ---------- marquee: direction follows scroll ---------- */
  const marquee = gsap.to('#marquee', { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    onUpdate: (self) => {
      gsap.to(marquee, { timeScale: self.direction * 3, duration: 0.2, overwrite: true });
      gsap.to(marquee, { timeScale: self.direction, duration: 1, delay: 0.25 });
    },
  });

  /* ---------- about: words light up while scrolling ---------- */
  gsap.to('.statement .w', {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.statement', start: 'top 80%', end: 'bottom 45%', scrub: true },
  });

  /* ---------- generic reveals ---------- */
  gsap.utils.toArray('.label, .stats > div, .row, .mail, .foot').forEach((el) => {
    gsap.from(el, {
      y: 50, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 98%' },
    });
  });
  gsap.from('.big', {
    yPercent: 30, opacity: 0, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: '.big', start: 'top 85%' },
  });

  /* ---------- custom cursor ---------- */
  const cursor = document.getElementById('cursor');
  if (finePointer) {
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('mousemove', (e) => { cursor.style.opacity = 1; cx(e.clientX); cy(e.clientY); });
    document.querySelectorAll('a').forEach((a) => {
      a.addEventListener('mouseenter', () => cursor.classList.add('big'));
      a.addEventListener('mouseleave', () => cursor.classList.remove('big'));
    });
  }
}
