const hasGsap = !!(window.gsap && window.ScrollTrigger);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------- mini mail composer (opens on the same page) ----------
   Messages are delivered by FormSubmit (formsubmit.co). The very first message
   triggers a one-time activation email to the address below — click the link in it. */
const MAIL_TO = 'sulanav02@gmail.com';
const composer = document.getElementById('composer');
const cForm = document.getElementById('composerForm');
const cStatus = document.getElementById('composerStatus');
const cSend = document.getElementById('composerSend');
const cDone = document.getElementById('composerDone');
let lastTrigger = null;

function openComposer(e) {
  e.preventDefault();
  lastTrigger = e.currentTarget;
  composer.hidden = false;
  requestAnimationFrame(() => composer.classList.add('open'));
  setTimeout(() => cForm.name.focus({ preventScroll: true }), 250);
}
function closeComposer() {
  composer.classList.remove('open');
  setTimeout(() => {
    composer.hidden = true;
    cForm.hidden = false; cDone.hidden = true; cStatus.textContent = '';
  }, 300);
  if (lastTrigger) lastTrigger.focus({ preventScroll: true });
}
document.querySelectorAll('a[data-email]').forEach((a) => a.addEventListener('click', openComposer));
document.getElementById('composerClose').addEventListener('click', closeComposer);
document.getElementById('composerAgain').addEventListener('click', closeComposer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !composer.hidden) closeComposer(); });

cForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!cForm.checkValidity()) {
    cStatus.textContent = 'Please add your name, a valid email and a message.';
    cForm.querySelector(':invalid').focus();
    return;
  }
  const data = Object.fromEntries(new FormData(cForm));
  if (data._honey) return;                       // bot
  cSend.disabled = true;
  cStatus.textContent = 'Sending…';
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${MAIL_TO}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...data, _replyto: data.email, _template: 'table', _captcha: 'false' }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || String(json.success) === 'false') throw new Error(json.message || 'failed');
    cForm.reset();
    cStatus.textContent = '';
    cForm.hidden = true; cDone.hidden = false;
  } catch (err) {
    cStatus.innerHTML = `Couldn't send right now. Please email me at <a href="mailto:${MAIL_TO}">${MAIL_TO}</a>.`;
  } finally {
    cSend.disabled = false;
  }
});

/* ---------- project galleries + full-screen viewer ---------- */
document.querySelectorAll('.project').forEach((card) => {
  const main = card.querySelector('.p-main');
  const count = card.querySelector('.p-count');
  const thumbs = [...card.querySelectorAll('.p-thumb')];
  const total = String(thumbs.length).padStart(2, '0');
  card._show = (i) => {
    const t = thumbs[i];
    if (!t || t.classList.contains('on')) return;
    thumbs.forEach((x) => x.classList.toggle('on', x === t));
    main.classList.add('swap');
    const img = new Image();
    img.onload = () => { main.src = t.dataset.src; main.classList.remove('swap'); };
    img.src = t.dataset.src;
    count.textContent = `${String(i + 1).padStart(2, '0')} / ${total}`;
  };
  thumbs.forEach((t, i) => t.addEventListener('click', () => card._show(i)));
  card.querySelector('.p-expand').addEventListener('click', () => openLightbox(card, thumbs.findIndex((t) => t.classList.contains('on'))));
  main.style.cursor = 'zoom-in';
  main.addEventListener('click', () => openLightbox(card, thumbs.findIndex((t) => t.classList.contains('on'))));
});

const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCount = document.getElementById('lbCount');
let lbCard = null, lbIndex = 0, lbOpener = null;
function lbSrcs() { return [...lbCard.querySelectorAll('.p-thumb')].map((t) => t.dataset.src); }
function lbRender() {
  const srcs = lbSrcs();
  lbIndex = (lbIndex + srcs.length) % srcs.length;
  lbImg.src = srcs[lbIndex];
  lbImg.alt = lbCard.querySelectorAll('.p-thumb')[lbIndex].getAttribute('aria-label').replace(/^Show /, '');
  lbCount.textContent = `${lbIndex + 1} / ${srcs.length}`;
  lbCard._show(lbIndex);
}
function openLightbox(card, i) {
  lbCard = card; lbIndex = i; lbOpener = document.activeElement;
  lbRender();
  lb.hidden = false;
  requestAnimationFrame(() => lb.classList.add('open'));
  document.documentElement.style.overflow = 'hidden';
  document.getElementById('lbClose').focus({ preventScroll: true });
}
function closeLightbox() {
  lb.classList.remove('open');
  document.documentElement.style.overflow = '';
  setTimeout(() => { lb.hidden = true; }, 300);
  if (lbOpener) lbOpener.focus({ preventScroll: true });
}
document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => { lbIndex--; lbRender(); });
document.getElementById('lbNext').addEventListener('click', () => { lbIndex++; lbRender(); });
lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') { lbIndex--; lbRender(); }
  if (e.key === 'ArrowRight') { lbIndex++; lbRender(); }
});

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
  const marquee = gsap.timeline({ repeat: -1 })
    .to('#marquee', { xPercent: -50, duration: 30, ease: 'none' }, 0)
    .fromTo('#marquee2', { xPercent: -50 }, { xPercent: 0, duration: 30, ease: 'none' }, 0);
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

  /* ---------- projects: heading, card reveal and stacking ---------- */
  gsap.from('.work-title, .work-count', {
    yPercent: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.work-head', start: 'top 85%' },
  });
  const cards = gsap.utils.toArray('.project');
  // a card taller than the screen would hide its bottom while stuck, so let those scroll normally
  const fitSticky = () => cards.forEach((c) => c.classList.toggle('no-stick', c.offsetHeight > innerHeight - 110));
  fitSticky(); addEventListener('resize', fitSticky);
  cards.forEach((card, i) => {
    // content slides in when the card arrives
    gsap.from(card.querySelectorAll('.p-badge, .p-title, .p-desc, .p-sub, .p-feats li, .p-tags, .p-links'), {
      y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05, clearProps: 'opacity,transform',
      scrollTrigger: { trigger: card, start: 'top 75%' },
    });
    gsap.from(card.querySelector('.p-stage'), {
      y: 70, opacity: 0, scale: 0.96, duration: 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 75%' },
    });
    gsap.from(card.querySelector('.p-thumbs'), {
      y: 20, opacity: 0, duration: 0.8, ease: 'expo.out', delay: 0.3, clearProps: 'all',
      scrollTrigger: { trigger: card, start: 'top 75%' },
    });
    // on larger screens the card shrinks and dims as the next one slides over it
    const next = cards[i + 1];
    if (next) {
      ScrollTrigger.matchMedia({
        '(min-width: 761px)': () => {
          gsap.to(card, {
            scale: 0.93, filter: 'brightness(.6)', ease: 'none',
            scrollTrigger: { trigger: next, start: 'top 55%', end: 'top 92px', scrub: true },
          });
        },
      });
    }
  });

  /* ---------- generic reveals ---------- */
  gsap.utils.toArray('.label, .stats > div, .mail, .foot').forEach((el) => {
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
    document.querySelectorAll('a, .theme-btn').forEach((a) => {
      a.addEventListener('mouseenter', () => cursor.classList.add('big'));
      a.addEventListener('mouseleave', () => cursor.classList.remove('big'));
    });
  }
}

/* ---------- dark / light theme ---------- */
(() => {
  const root = document.documentElement;
  const btn = document.getElementById('themeBtn');
  const meta = document.querySelector('meta[name="theme-color"]');
  const sync = () => {
    const light = root.dataset.theme === 'light';
    btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    if (meta) meta.content = light ? '#f3efe8' : '#0d0d0d';
  };
  sync();
  btn.addEventListener('click', () => {
    const light = root.dataset.theme !== 'light';
    root.classList.add('theme-anim');
    if (light) root.dataset.theme = 'light'; else delete root.dataset.theme;
    try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
    sync();
    clearTimeout(btn._t);
    btn._t = setTimeout(() => root.classList.remove('theme-anim'), 600);
  });
})();

/* ---------- interactive terminal (easter egg) ---------- */
(() => {
  const term = document.getElementById('term');
  const launch = document.getElementById('termLaunch');
  const out = document.getElementById('termOut');
  const body = document.getElementById('termBody');
  const form = document.getElementById('termForm');
  const input = document.getElementById('termIn');
  const canvas = document.getElementById('termMatrix');
  const LINKS = { github: 'https://github.com/Sulana-UX', linkedin: 'https://www.linkedin.com/in/sulana-uduwana' };
  const history = []; let hIdx = 0; let booted = false; let busy = false;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (s, n) => esc(s) + '&nbsp;'.repeat(Math.max(1, n - s.length));
  const print = (html = '', cls = '') => {
    const p = document.createElement('div');
    p.className = 'tl' + (cls ? ' ' + cls : '');
    p.innerHTML = html || '&nbsp;';
    out.appendChild(p);
    body.scrollTop = body.scrollHeight;
    return p;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const typeOut = async (lines, delay = 45) => { for (const l of lines) { print(l); await sleep(delay); } };

  /* project data is read from the page, so the terminal stays in sync with the cards */
  const projects = () => [...document.querySelectorAll('.project')].map((c) => ({
    name: c.querySelector('.p-title').lastChild.textContent.trim(),
    tag: c.querySelector('.p-tagline').textContent.trim(),
    tags: [...c.querySelectorAll('.p-tags li')].map((t) => t.textContent),
    links: [...c.querySelectorAll('.p-link')].map((a) => ({ label: a.firstChild.textContent.trim(), href: a.href })),
    el: c,
  }));
  const link = (href, label) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;
  const k = (s) => `<span class="k">${s}</span>`;

  const COMMANDS = {
    help: 'list all commands',
    whoami: 'who is Sulana?',
    projects: 'list my projects',
    open: 'open a project, e.g. open 1',
    skills: 'tech I work with',
    contact: 'send me a message',
    github: 'open my GitHub',
    linkedin: 'open my LinkedIn',
    theme: 'switch dark / light',
    hack: 'try it ;)',
    'sudo hire-me': '...',
    clear: 'clear the screen',
    exit: 'close the terminal',
  };

  function openMail() {
    setTimeout(() => { close(); openComposer({ preventDefault() {}, currentTarget: launch }); }, 650);
  }

  const run = {
    help() {
      print('Available commands:', 'dim');
      Object.entries(COMMANDS).forEach(([c, d]) => print('  ' + k(pad(c, 15)) + `<span class="dim">${d}</span>`));
    },
    async whoami() {
      await typeOut([
        '<span class="hl">Sulana Uduwana</span> — Software Engineer, Sri Lanka',
        'Full-stack web &amp; mobile apps, built with a <span class="hl">security-first</span> mindset.',
        'React · Node.js · Python · Flutter · Firebase · FastAPI',
        `<span class="ok">●</span> Available for work — type ${k('contact')} to say hi.`,
      ], 90);
    },
    projects() {
      projects().forEach((p, i) => print(`  ${k('[' + (i + 1) + ']')} <span class="hl">${esc(p.name)}</span> <span class="dim">— ${esc(p.tag)}</span>`));
      print(`Type ${k('open &lt;number&gt;')} to jump to one.`, 'dim');
    },
    open(arg) {
      const list = projects();
      const n = parseInt(arg, 10);
      const p = list[n - 1] || (arg && list.find((x) => x.name.toLowerCase().startsWith(arg.toLowerCase())));
      if (!p) { print(`open: project not found. Try ${k('open 1')} to ${k('open ' + list.length)}.`, 'err'); return; }
      print(`Opening <span class="hl">${esc(p.name)}</span> …`);
      print('  stack: ' + p.tags.map(esc).join(', '), 'dim');
      print('  ' + p.links.map((l) => link(l.href, l.label + ' ↗')).join('   '));
      setTimeout(() => { close(); p.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 1400);
    },
    skills() {
      const bar = (n) => '<span class="ok">' + '█'.repeat(n) + '</span><span class="dim">' + '░'.repeat(10 - n) + '</span>';
      [['Frontend', 'React, Vite, Flutter, GSAP', 9], ['Backend', 'Node.js, Express, FastAPI, Python', 8],
       ['Data', 'Firebase, Firestore, Supabase, SQLAlchemy', 8], ['Security', 'JWT, Argon2, OWASP, forensics', 9]]
        .forEach(([g, t, n]) => print('  ' + k(pad(g, 10)) + bar(n) + `&nbsp;&nbsp;<span class="dim">${t}</span>`));
      const all = new Set(projects().flatMap((p) => p.tags));
      print(`  ${all.size} technologies across my projects.`, 'dim');
    },
    contact() { print('Opening a new message … <span class="ok">✓</span>'); openMail(); },
    github() { print('→ ' + link(LINKS.github, LINKS.github)); window.open(LINKS.github, '_blank', 'noopener'); },
    linkedin() { print('→ ' + link(LINKS.linkedin, LINKS.linkedin)); window.open(LINKS.linkedin, '_blank', 'noopener'); },
    theme(arg) {
      const light = document.documentElement.dataset.theme === 'light';
      const want = arg === 'light' || arg === 'dark' ? arg : (light ? 'dark' : 'light');
      if ((want === 'light') !== light) document.getElementById('themeBtn').click();
      print(`Theme set to <span class="hl">${want}</span>.`);
    },
    async hack() {
      await typeOut([
        '<span class="dim">$ nmap -sV sulana-portfolio.local</span>',
        'Scanning 1 host … ports 22, 80, 443 open',
        '<span class="dim">$ ./exploit --target mainframe</span>',
        'Bypassing firewall ██████████ 100%',
      ], 320);
      await matrix(2600);
      print('<span class="ok">ACCESS GRANTED.</span> Just kidding — this site is hardened 😎', 'win');
      print(`Real security work: ${k('open traceMind')} or ${k('open expensewise')}.`, 'dim');
    },
    async 'sudo hire-me'() {
      print('[sudo] password for recruiter: ********', 'dim');
      await sleep(700);
      await typeOut([
        '<span class="ok">✓</span> Permission granted.',
        '<span class="ok">✓</span> Coffee ready ☕',
        '<span class="ok">✓</span> Opening a message to Sulana …',
      ], 400);
      openMail();
    },
    sudo() { print(`Nice try. Did you mean ${k('sudo hire-me')}?`, 'err'); },
    clear() { out.innerHTML = ''; },
    exit() { close(); },
    ls() { print(`${k('about/')}&nbsp;&nbsp;${k('projects/')}&nbsp;&nbsp;${k('skills.txt')}&nbsp;&nbsp;${k('contact.sh')}&nbsp;&nbsp;<span class="dim">secret.txt</span>`); },
    cat(arg) {
      if (arg && arg.toLowerCase() === 'secret.txt') print(`🥚 You found the easter egg! Now type ${k('sudo hire-me')}.`);
      else if (arg) print(`cat: ${esc(arg)}: no such file. Try ${k('cat secret.txt')}`, 'err');
      else print('usage: cat &lt;file&gt;', 'dim');
    },
    date() { print(esc(new Date().toString())); },
    echo(arg) { print(esc(arg || '')); },
  };
  const aliases = { about: 'whoami', '?': 'help', cls: 'clear', quit: 'exit', mail: 'contact', email: 'contact', dir: 'ls', work: 'projects' };

  async function exec(raw) {
    const line = raw.trim();
    print(`<span class="ps"><b>sulana@portfolio</b>:<em>~</em>$</span> ${esc(line)}`);
    if (!line) return;
    history.push(line); hIdx = history.length;
    const lower = line.toLowerCase().replace(/\s+/g, ' ');
    if (run[lower] && lower.includes(' ')) return run[lower]();
    const parts = line.split(/\s+/);
    const cmd = aliases[parts[0].toLowerCase()] || parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ') || undefined;
    if (Object.prototype.hasOwnProperty.call(run, cmd)) return run[cmd](arg);
    print(`command not found: ${esc(parts[0])} — type ${k('help')}`, 'err');
  }

  /* green "matrix" rain over the terminal */
  function matrix(ms) {
    return new Promise((resolve) => {
      const ctx = canvas.getContext('2d');
      canvas.hidden = false;
      const w = (canvas.width = body.clientWidth), h = (canvas.height = body.clientHeight);
      const fs = 15, drops = Array.from({ length: Math.ceil(w / fs) }, () => Math.random() * -25);
      const chars = 'アイウエオカキクケコサシスセソ01SULANA<>/{}#$';
      const t0 = performance.now();
      (function frame(t) {
        ctx.fillStyle = 'rgba(8,10,9,.16)'; ctx.fillRect(0, 0, w, h);
        ctx.font = fs + 'px monospace';
        drops.forEach((y, i) => {
          ctx.fillStyle = Math.random() > 0.95 ? '#eaffea' : '#39ff7a';
          ctx.fillText(chars[(Math.random() * chars.length) | 0], i * fs, y * fs);
          drops[i] = y * fs > h && Math.random() > 0.95 ? 0 : y + 1;
        });
        if (t - t0 < ms) requestAnimationFrame(frame);
        else { canvas.hidden = true; ctx.clearRect(0, 0, w, h); resolve(); }
      })(t0);
    });
  }

  async function boot() {
    booted = true;
    await typeOut([
      `<span class="dim">Last login: ${esc(new Date().toDateString())} on ttys001</span>`,
      'Welcome to <span class="hl">Sulana\'s portfolio</span> terminal.',
      `Type ${k('help')} to see what I can do. Try ${k('hack')} or ${k('sudo hire-me')} 😉`,
      '',
    ], 140);
  }

  function open() {
    term.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => term.classList.add('open'));
    setTimeout(() => input.focus({ preventScroll: true }), 60);
    if (!booted) { busy = true; boot().then(() => { busy = false; }); }
  }
  function close() {
    if (term.hidden) return;
    term.classList.remove('open');
    document.documentElement.style.overflow = '';
    setTimeout(() => { term.hidden = true; }, 260);
    launch.focus({ preventScroll: true });
  }

  launch.addEventListener('click', open);
  document.getElementById('termClose').addEventListener('click', close);
  term.addEventListener('click', (e) => { if (e.target === term) close(); });
  body.addEventListener('click', (e) => { if (e.target.tagName !== 'A' && !getSelection().toString()) input.focus({ preventScroll: true }); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const v = input.value; input.value = '';
    busy = true;
    try { await exec(v); } finally { busy = false; }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ''; }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.toLowerCase();
      if (!v) return;
      const hit = Object.keys(COMMANDS).filter((c) => c.startsWith(v));
      if (hit.length === 1) input.value = hit[0];
      else if (hit.length > 1) print(hit.join('&nbsp;&nbsp;&nbsp;'), 'dim');
    } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
  });
  document.addEventListener('keydown', (e) => {
    if (!term.hidden && e.key === 'Escape') { close(); return; }
    const el = document.activeElement;
    const typing = el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
    if (term.hidden && !typing && (e.key === '`' || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)))) { e.preventDefault(); open(); }
  });
})();
