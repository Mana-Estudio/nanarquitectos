import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduced =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !document.documentElement.classList.contains('force-motion');
const ease = 'expo.out';

/* Header: transparente sobre el hero, sólido al bajar */
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const overlay = header.dataset.overlay === 'true';
  const update = () => {
    const limit = overlay ? window.innerHeight * 0.82 : 8;
    header.classList.toggle('is-solid', window.scrollY > limit);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* Menú mobile */
const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
toggle?.addEventListener('click', () => {
  const open = document.documentElement.classList.toggle('menu-open');
  toggle.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('[data-menu] a').forEach((a) =>
  a.addEventListener('click', () => document.documentElement.classList.remove('menu-open')),
);

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
    tl.from(el, { clipPath: 'inset(18% 6% 18% 6%)', duration: 1.6, ease });
    if (img) tl.from(img, { scale: 1.25, duration: 1.8, ease }, 0);
  });

  /* Textos: suben apenas, en cascada */
  gsap.utils.toArray<HTMLElement>('[data-reveal="text"]').forEach((el) => {
    const items = el.children.length ? Array.from(el.children) : [el];
    gsap.from(items, {
      y: 28,
      opacity: 0,
      duration: 1.2,
      stagger: 0.08,
      ease,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  /* Parallax suave dentro del marco */
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const img = el.querySelector('img');
    if (!img) return;
    gsap.set(img, { scale: 1.14 });
    gsap.fromTo(
      img,
      { yPercent: -6 },
      { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

export { gsap, ScrollTrigger, reduced, ease };
