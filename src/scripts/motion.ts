import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduced =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !document.documentElement.classList.contains('force-motion');
const ease = 'expo.out';

/* Menú mobile: «Menú» / «Cerrar» */
const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menu = document.querySelector<HTMLElement>('[data-menu]');
const mobile = window.matchMedia('(max-width: 760px)');
const isOpen = () => document.documentElement.classList.contains('menu-open');
// En mobile el menú cerrado queda fuera del orden de tabulación y del árbol de accesibilidad
const syncInert = () => { if (menu) menu.inert = mobile.matches && !isOpen(); };
const setMenu = (open: boolean) => {
  if (open === isOpen()) return;
  document.documentElement.classList.toggle('menu-open', open);
  toggle?.setAttribute('aria-expanded', String(open));
  if (toggle) toggle.textContent = open ? 'Cerrar' : 'Menú';
  syncInert();
  (window as any).__lenis?.[open ? 'stop' : 'start']();
  if (open) menu?.querySelector('a')?.focus();
  else if (mobile.matches) toggle?.focus();
};
syncInert();
mobile.addEventListener('change', () => { if (!mobile.matches) setMenu(false); syncInert(); });
toggle?.addEventListener('click', () => setMenu(!isOpen()));
document.querySelectorAll('[data-menu] a, [data-menu] button').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

if (!reduced) {
  const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  (window as any).__lenis = lenis;

  /* Imágenes: se descubren con una máscara y se asientan desde una escala mayor */
  gsap.utils.toArray<HTMLElement>('[data-reveal="img"]').forEach((el) => {
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    tl.from(el, { clipPath: 'inset(14% 5% 14% 5%)', duration: 1.6, ease });
    if (img) tl.from(img, { scale: 1.2, duration: 1.8, ease, clearProps: 'transform' }, 0);
  });

  /* Textos: suben apenas, en cascada */
  gsap.utils.toArray<HTMLElement>('[data-reveal="text"]').forEach((el) => {
    const items = el.children.length ? Array.from(el.children) : [el];
    gsap.from(items, {
      y: 24, opacity: 0, duration: 1.2, stagger: 0.07, ease,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  /* Máscara sola (para imágenes que además llevan parallax) */
  gsap.utils.toArray<HTMLElement>('[data-reveal="clip"]').forEach((el) => {
    gsap.from(el, { clipPath: 'inset(10% 6% 10% 6%)', duration: 1.5, ease, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });

  /* Manifiesto: las palabras se encienden con el scroll */
  gsap.utils.toArray<HTMLElement>('[data-words]').forEach((el) => {
    el.innerHTML = el.textContent!.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    gsap.fromTo(el.querySelectorAll('.w'), { opacity: 0.14 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });

  /* Parallax de capa: el elemento entero se desplaza a otra velocidad (solo pantallas grandes) */
  gsap.matchMedia().add('(min-width: 761px)', () => {
    gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((el) => {
      const s = Number(el.dataset.speed) || 0.2;
      gsap.fromTo(el, { y: s * 120 }, { y: -s * 120, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* Botones magnéticos */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* Parallax suave dentro del marco */
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const img = el.querySelector('img');
    if (!img) return;
    const k = Number(el.dataset.parallax) || 5;
    gsap.set(img, { scale: 1 + k * 0.025 });
    gsap.fromTo(img, { yPercent: -k }, {
      yPercent: k, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
} else {
  /* Movimiento reducido: sin desplazamientos ni máscaras, solo un fundido corto al entrar en pantalla */
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, { opacity: 0, duration: 0.5, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 95%', once: true } });
  });
}

export { gsap, ScrollTrigger, reduced, ease };
