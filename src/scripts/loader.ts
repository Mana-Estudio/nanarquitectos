/**
 * Intro con fotos (markup y estilos en components/Loader.astro).
 * Va con Web Animations y no con GSAP: mientras dura, la línea de tiempo de GSAP está en pausa
 * para que las animaciones de entrada de cada página arranquen al descubrirse la página.
 */

const EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
const IN_OUT = 'cubic-bezier(0.76, 0, 0.24, 1)';
/** Entre foto y foto: como mucho 3 cambios por segundo en un área grande (WCAG 2.3.1, destellos) */
const STEP = 340;
const MAX = 7000;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const inset = (t: number, r: number, b: number, l: number) => `inset(${t}px ${r}px ${b}px ${l}px)`;
const FULL = 'inset(0px 0px 0px 0px)';
const keep = { fill: 'forwards' as const };

/** Ejecuta la intro. `onReveal` se llama justo cuando empieza a verse la página */
export async function runLoader(onReveal: () => void): Promise<void> {
  const html = document.documentElement;
  const root = document.querySelector<HTMLElement>('[data-loader]');
  const tpl = root?.querySelector<HTMLTemplateElement>('[data-ld-tpl]');
  if (!root || !tpl) {
    html.classList.remove('is-loading');
    onReveal();
    return;
  }
  root.dataset.run = '';
  root.style.display = 'block';
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const frame = $('[data-ld-frame]');
  const cap = $('[data-ld-cap]');
  const name = $('[data-ld-name]');
  const meta = $('[data-ld-meta]');
  const count = $('[data-ld-count]');
  const line = $('[data-ld-line]');
  frame.append(tpl.content.cloneNode(true));
  let plates = Array.from(frame.querySelectorAll<HTMLElement>('[data-ld-plate]'));

  // Home: la última foto es una ventana a la imagen del carrusel, en su posición real
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const heroImg = hero?.querySelector<HTMLImageElement>('[data-slide].is-active img');
  let win: HTMLElement | null = null;
  let start = '';
  let rect = '';
  if (hero && heroImg) {
    const h = hero.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const [T, R, B, L] = [f.top - h.top, h.right - f.right, h.bottom - f.bottom, f.left - h.left];
    if (Math.min(T, R, B, L) >= 0) {
      win = document.createElement('div');
      win.className = 'ld-window';
      start = inset(f.bottom - h.top, R, B, L);
      rect = inset(T, R, B, L);
      Object.assign(win.style, { left: `${h.left}px`, top: `${h.top}px`, width: `${h.width}px`, height: `${h.height}px`, clipPath: start });
      // Mismo srcset y sizes que la del carrusel: el navegador reutiliza la descarga
      const img = heroImg.cloneNode() as HTMLImageElement;
      img.removeAttribute('fetchpriority');
      img.alt = '';
      win.append(img);
      const slide = heroImg.closest<HTMLElement>('[data-slide]');
      win.dataset.name = slide?.dataset.name ?? '';
      win.dataset.meta = slide?.dataset.meta ?? '';
      root.insertBefore(win, root.querySelector('.ld-foot'));
      plates.slice(4).forEach((p) => p.remove());
      plates = plates.slice(0, 4);
    }
  }
  const items = win ? [...plates, win] : plates;

  // Contador y línea: siguen al progreso con un poco de inercia
  let target = 0;
  let cur = 0;
  let raf = 0;
  const tick = () => {
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.002) cur = target;
    count.textContent = String(Math.round(cur * 100)).padStart(2, '0');
    line.style.transform = `scaleX(${cur})`;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // Un clic o una tecla saltan la intro: cortan en el acto la espera en curso
  let skip = false;
  let wake = () => {};
  const pause = (ms: number) => new Promise<void>((r) => { const t = setTimeout(r, ms); wake = () => { clearTimeout(t); r(); }; });
  const onSkip = () => { skip = true; wake(); };
  addEventListener('pointerdown', onSkip);
  addEventListener('keydown', onSkip);

  const label = (n: string, m: string) =>
    cap.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-35%)' }], { duration: 140, easing: 'ease-in', ...keep }).finished.then(() => {
      name.textContent = n;
      meta.textContent = m;
      cap.animate([{ opacity: 0, transform: 'translateY(35%)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: EXPO, ...keep });
    });
  const ready = (el: HTMLElement, ms: number) => {
    const img = el.querySelector('img');
    return img ? Promise.race([img.decode().catch(() => {}), pause(ms)]) : Promise.resolve();
  };
  const reveal = (el: HTMLElement) => {
    const w = el === win;
    el.animate([{ clipPath: w ? start : 'inset(100% 0% 0% 0%)' }, { clipPath: w ? rect : 'inset(0% 0% 0% 0%)' }], { duration: 900, easing: EXPO, ...keep });
    el.querySelector('img')?.animate([{ transform: 'scale(1.16)' }, { transform: 'none' }], { duration: 1300, easing: EXPO, ...keep });
  };

  const t0 = performance.now();
  await Promise.race([document.fonts.ready, pause(600)]);
  for (let i = 0; i < items.length && !skip && performance.now() - t0 < MAX; i++) {
    const last = i === items.length - 1;
    await ready(items[i], last && win ? 1500 : 800);
    if (skip) break;
    reveal(items[i]);
    label(items[i].dataset.name ?? '', items[i].dataset.meta ?? '');
    target = (i + 1) / items.length;
    await pause(last ? 520 : STEP);
  }
  removeEventListener('pointerdown', onSkip);
  removeEventListener('keydown', onSkip);
  target = 1;

  const fade = (el: Element, d = 320) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: d, easing: 'ease-out', ...keep });
  root.querySelectorAll('.ld-foot, .ld-line, .ld-tag').forEach((el) => fade(el, skip ? 200 : 320));

  if (win) {
    // La ventana crece hasta ocupar el sitio del carrusel; debajo está la misma foto en la página
    win.getAnimations({ subtree: true }).forEach((a) => a.finish());
    if (!win.getAnimations().length) win.style.clipPath = rect;
    await win.animate([{ clipPath: rect }, { clipPath: FULL }], { duration: skip ? 650 : 1150, easing: IN_OUT, ...keep }).finished;
    frame.style.visibility = 'hidden';
    html.classList.remove('is-loading');
    onReveal();
    await fade(root, skip ? 350 : 600).finished;
  } else {
    // Resto de páginas: la cortina se levanta
    html.classList.remove('is-loading');
    onReveal();
    const d = skip ? 700 : 1000;
    frame.animate([{ translate: '-50% -50%' }, { translate: '-50% -90%' }], { duration: d, easing: IN_OUT, ...keep });
    await root.animate([{ clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)' }], { duration: d, easing: IN_OUT, ...keep }).finished;
  }
  cancelAnimationFrame(raf);
  root.remove();
}
