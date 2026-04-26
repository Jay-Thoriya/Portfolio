/* ==========================================================
   JAY THORIYA — AI/ML PORTFOLIO
   v2.0 · main script
========================================================== */

'use strict';

/* ---------- 0. UTILITY ---------- */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const isMobile = window.matchMedia('(max-width: 1024px)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. LOADER ---------- */
function initLoader() {
  const loader = $('#loader');
  const fill = $('#loaderFill');
  const percent = $('#loaderPercent');

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.add('loaded');
      }, 400);
    }
    fill.style.width = `${progress}%`;
    percent.textContent = Math.floor(progress);
  }, 120);
}

/* ---------- 2. CUSTOM CURSOR ---------- */
function initCursor() {
  if (isMobile) return;

  const dot = $('#cursorDot');
  const ring = $('#cursorRing');
  const cursorText = $('#cursorText');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let dotX = mouseX;
  let dotY = mouseY;
  let ringX = mouseX;
  let ringY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });

  function animate() {
    dotX = lerp(dotX, mouseX, 0.6);
    dotY = lerp(dotY, mouseY, 0.6);
    ringX = lerp(ringX, mouseX, 0.18);
    ringY = lerp(ringY, mouseY, 0.18);

    dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

    requestAnimationFrame(animate);
  }
  animate();

  // Cursor variants
  const linkSelector = 'a, button, [data-cursor="link"], input, textarea';
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-cursor]') || e.target.closest(linkSelector);
    if (!target) return;
    const variant = target.dataset.cursor;
    ring.classList.remove('is-link', 'is-view', 'is-hover');
    cursorText.textContent = '';
    if (variant === 'view') {
      ring.classList.add('is-view');
      cursorText.textContent = 'VIEW';
    } else if (variant === 'hover') {
      ring.classList.add('is-hover');
    } else {
      ring.classList.add('is-link');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-cursor]') || e.target.closest(linkSelector);
    const related = e.relatedTarget && (e.relatedTarget.closest && (e.relatedTarget.closest('[data-cursor]') || e.relatedTarget.closest(linkSelector)));
    if (target && !related) {
      ring.classList.remove('is-link', 'is-view', 'is-hover');
      cursorText.textContent = '';
    }
  });
}

/* ---------- 3. THREE.JS NEURAL NETWORK BG ---------- */
function initNeuralBackground() {
  if (typeof THREE === 'undefined' || prefersReducedMotion) return;

  const canvas = $('#bgCanvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 320;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Particle nodes
  const NODE_COUNT = isMobile ? 60 : 140;
  const positions = new Float32Array(NODE_COUNT * 3);
  const velocities = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 600;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
    velocities.push({
      x: (Math.random() - 0.5) * 0.25,
      y: (Math.random() - 0.5) * 0.25,
      z: (Math.random() - 0.5) * 0.15
    });
  }

  // Points (nodes)
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pointMaterial = new THREE.PointsMaterial({
    color: 0x00ffd1,
    size: 2.4,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  const points = new THREE.Points(pointGeometry, pointMaterial);
  scene.add(points);

  // Lines (connections) — built dynamically each frame
  const lineGeometry = new THREE.BufferGeometry();
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffd1,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });
  const linePositions = new Float32Array(NODE_COUNT * NODE_COUNT * 6);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  // Mouse interaction
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  document.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const MAX_DIST = isMobile ? 65 : 95;
  const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

  function animate() {
    requestAnimationFrame(animate);

    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);

    const pos = pointGeometry.attributes.position.array;

    for (let i = 0; i < NODE_COUNT; i++) {
      pos[i * 3 + 0] += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;

      // bounce
      if (Math.abs(pos[i * 3 + 0]) > 320) velocities[i].x *= -1;
      if (Math.abs(pos[i * 3 + 1]) > 220) velocities[i].y *= -1;
      if (Math.abs(pos[i * 3 + 2]) > 180) velocities[i].z *= -1;
    }
    pointGeometry.attributes.position.needsUpdate = true;

    // Build lines
    let lineIdx = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < MAX_DIST_SQ) {
          linePositions[lineIdx++] = pos[i * 3];
          linePositions[lineIdx++] = pos[i * 3 + 1];
          linePositions[lineIdx++] = pos[i * 3 + 2];
          linePositions[lineIdx++] = pos[j * 3];
          linePositions[lineIdx++] = pos[j * 3 + 1];
          linePositions[lineIdx++] = pos[j * 3 + 2];
        }
      }
    }
    // Zero-out remaining
    for (let i = lineIdx; i < linePositions.length; i++) {
      linePositions[i] = 0;
    }
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.setDrawRange(0, lineIdx / 3);

    // Mouse-driven camera tilt
    camera.position.x = lerp(camera.position.x, mouse.x * 60, 0.03);
    camera.position.y = lerp(camera.position.y, mouse.y * 40, 0.03);
    camera.lookAt(scene.position);

    // Slow rotation
    points.rotation.y += 0.0006;
    points.rotation.x += 0.0003;
    lines.rotation.y = points.rotation.y;
    lines.rotation.x = points.rotation.x;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ---------- 4. SMOOTH SCROLL (LENIS) ---------- */
function initSmoothScroll() {
  if (typeof Lenis === 'undefined' || prefersReducedMotion) return null;

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    touchMultiplier: 1.5
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Hook into GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // Anchor links
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.length > 1) {
        e.preventDefault();
        const target = $(href);
        if (target) lenis.scrollTo(target, { offset: -20 });
      }
    });
  });

  return lenis;
}

/* ---------- 5. NAV ---------- */
function initNav() {
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const menu = $('#navMenu');
  const links = $$('.nav-link');

  // Sticky background on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Mobile toggle
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    menu.classList.toggle('open');
  });

  // Close on link click
  links.forEach((link) => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      menu.classList.remove('open');
    });
  });

  // Active link based on section
  const sections = $$('section[id]');
  function updateActive() {
    const scroll = window.scrollY + window.innerHeight / 3;
    let current = sections[0]?.id;
    sections.forEach((sec) => {
      if (sec.offsetTop <= scroll) current = sec.id;
    });
    links.forEach((link) => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }
  window.addEventListener('scroll', updateActive);
  updateActive();
}

/* ---------- 6. SCROLL PROGRESS ---------- */
function initScrollProgress() {
  const fill = $('#scrollProgress');
  if (!fill) return;
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = (window.scrollY / total) * 100;
    fill.style.width = `${pct}%`;
  });
}

/* ---------- 7. LIVE CLOCK ---------- */
function initLiveClock() {
  const el = $('#liveTime');
  if (!el) return;
  function update() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
  }
  update();
  setInterval(update, 1000);

  // Year in footer
  const year = $('#currentYear');
  if (year) year.textContent = new Date().getFullYear();
}

/* ---------- 8. HERO TYPING ---------- */
function initHeroTyping() {
  const el = $('#heroTyping');
  if (!el) return;

  const phrases = [
    'Lead AI/ML Engineer',
    'LLM & GenAI Architect',
    'RAG Pipeline Builder',
    'Multi-Agent Systems Engineer',
    'Document Intelligence Specialist'
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let pause = 0;

  function tick() {
    const phrase = phrases[phraseIdx];

    if (pause > 0) {
      pause--;
      return setTimeout(tick, 60);
    }

    if (!isDeleting) {
      el.textContent = phrase.slice(0, ++charIdx);
      if (charIdx === phrase.length) {
        isDeleting = true;
        pause = 25;
      }
    } else {
      el.textContent = phrase.slice(0, --charIdx);
      if (charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        pause = 5;
      }
    }
    setTimeout(tick, isDeleting ? 30 : 70);
  }

  setTimeout(tick, 1500);
}

/* ---------- 9. SCROLL REVEAL ---------- */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

  $$('.reveal, .reveal-text, .section-title').forEach((el) => {
    observer.observe(el);
  });
}

/* ---------- 10. STATS COUNTER ---------- */
function initStatsCounter() {
  const counters = $$('.stat-num[data-count], .skill-percent[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((c) => observer.observe(c));

  function animateCounter(el) {
    const target = parseInt(el.dataset.count || el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    function step(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(eased * target);
      el.textContent = el.classList.contains('skill-percent')
        ? `${value}%`
        : `${value}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
}

/* ---------- 11. SKILL BARS ---------- */
function initSkillBars() {
  const bars = $$('.skill-bar-fill');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const fill = entry.target.dataset.fill;
        entry.target.style.width = `${fill}%`;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach((b) => observer.observe(b));
}

/* ---------- 12. PROJECT FILTER ---------- */
function initProjectFilter() {
  const buttons = $$('.filter-btn');
  const cards = $$('.project-card');
  const grid = $('#projectsGrid');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      cards.forEach((card, i) => {
        const cat = card.dataset.category;
        const match = filter === 'all' || cat === filter;
        if (match) {
          card.classList.remove('hidden');
          card.style.transitionDelay = `${i * 30}ms`;
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => card.classList.add('hidden'), 300);
        }
      });
    });
  });
}

/* ---------- 13. 3D TILT ---------- */
function initTilt() {
  if (isMobile) return;

  $$('[data-tilt]').forEach((el) => {
    let rect;
    let isHover = false;

    el.addEventListener('mouseenter', () => {
      rect = el.getBoundingClientRect();
      isHover = true;
    });

    el.addEventListener('mousemove', (e) => {
      if (!isHover || !rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotY = ((x - cx) / cx) * 6;
      const rotX = -((y - cy) / cy) * 6;
      el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
    });

    el.addEventListener('mouseleave', () => {
      isHover = false;
      el.style.transform = '';
    });
  });
}

/* ---------- 14. MAGNETIC BUTTONS ---------- */
function initMagnetic() {
  if (isMobile) return;

  $$('[data-magnetic]').forEach((el) => {
    let rect;

    el.addEventListener('mouseenter', () => {
      rect = el.getBoundingClientRect();
    });

    el.addEventListener('mousemove', (e) => {
      if (!rect) return;
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

/* ---------- 15. CONTACT FORM ---------- */
function initContactForm() {
  const form = $('#contactForm');
  const status = $('#formStatus');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    if (!data.name || !data.email || !data.message) {
      status.textContent = '> ERROR: Please fill required fields.';
      status.classList.add('error');
      return;
    }

    // Disable button during submission
    const submitBtn = form.querySelector('.form-submit');
    const submitText = form.querySelector('.form-submit-text');
    const originalText = submitText.textContent;
    submitBtn.disabled = true;
    submitText.textContent = 'Transmitting...';

    status.classList.remove('error');
    status.textContent = '> Transmitting...';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        status.classList.remove('error');
        status.textContent = `> Message transmitted successfully! I'll get back to you soon.`;
        form.reset();
      } else {
        status.classList.add('error');
        status.textContent = '> ERROR: Transmission failed. Please try again or email directly.';
      }
    } catch (err) {
      status.classList.add('error');
      status.textContent = '> ERROR: Network issue. Please try again or email directly.';
    } finally {
      submitBtn.disabled = false;
      submitText.textContent = originalText;
    }
  });
}

/* ---------- 16. SITA MODAL ---------- */
function initSitaModal() {
  const overlay = $('#sitaModal');
  if (!overlay) return;

  // Close on clicking overlay background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* ---------- 17. INIT ALL ---------- */
function init() {
  initLoader();
  initCursor();
  initNeuralBackground();
  initSmoothScroll();
  initNav();
  initScrollProgress();
  initLiveClock();
  initHeroTyping();
  initScrollReveal();
  initStatsCounter();
  initSkillBars();
  initProjectFilter();
  initTilt();
  initMagnetic();
  initContactForm();
  initSitaModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
