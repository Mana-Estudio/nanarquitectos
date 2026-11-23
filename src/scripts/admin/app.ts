import { r } from '../../lib/ruta';
import { localStore, supabaseStore, type Estado, type Foto, type Galeria, type Mostrar, type P, type Portada, type Slot, type TextoFormato } from './store';

interface Seed { estado: Estado; slots: { label: string; o: 'L' | 'P'; col: string; ar: string; mt: string }[]; categorias: string[]; logo: string; supabase: { url: string; key: string } | null }
const seed: Seed = JSON.parse(document.getElementById('seed')!.textContent!);
const store = seed.supabase
  ? supabaseStore(seed.estado, seed.supabase.url, seed.supabase.key, seed.slots.map((s) => s.o))
  : localStore(seed.estado);
const app = document.getElementById('app')!;

/* ── Estado ───────────────────────────────────────── */
let E: Estado;
let draft: (P & { nuevo?: boolean }) | null = null;
let port: Portada | null = null;
let dirty = false;
let q = '';
let cat = '';
let lastHash = location.hash;
let sesion = false;
/** Hay cambios guardados que todavía no se publicaron en la web */
const PEND = 'nan-admin-pendiente';
const pendiente = (v?: boolean) => {
  try {
    if (v !== undefined) v ? localStorage.setItem(PEND, '1') : localStorage.removeItem(PEND);
    return localStorage.getItem(PEND) === '1';
  } catch { return false; }
};

const GAL: { id: Galeria; t: string; d: string }[] = [
  { id: 'mosaico', t: 'Mosaico', d: 'Retícula densa, poco aire entre fotos' },
  { id: 'galeria', t: 'Galería deslizable', d: 'Tira horizontal que se pasa con el dedo' },
  { id: 'sueltas', t: 'Imágenes sueltas', d: 'Composición editorial, con mucho aire' },
];

/* ── Utilidades ───────────────────────────────────── */
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const isL = (f: Foto) => f.w > f.h;
const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const two = (n: number) => String(n).padStart(2, '0');
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = app) => r.querySelector<T>(s);
const bySlug = (s: string) => E.proyectos.find((p) => p.slug === s);
const enPortada = (s: string) => [...E.portada.hero, ...E.portada.home].some((x) => x?.slug === s);
const authed = () => {
  if (store.auth) return sesion;
  try { return sessionStorage.getItem('nan-admin') === '1'; } catch { return true; }
};
/** Guarda y avisa si falla. Devuelve true si se guardó */
async function persist() {
  try {
    await store.save(E);
    if (store.publish) { pendiente(true); syncPub(); }
    return true;
  } catch (err) {
    toast(`No se pudo guardar: ${(err as Error).message}. Revise la conexión e inténtelo de nuevo.`);
    return false;
  }
}
function syncPub() {
  const b = $('[data-publish]', document);
  if (!b) return;
  const p = pendiente();
  b.classList.toggle('has-pend', p);
  b.querySelector('.pub-t')!.textContent = p ? 'Publicar cambios en la web' : 'La web está al día';
}

function toast(msg: string) {
  const t = $('#toast', document);
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('is-in');
  void t.offsetWidth;
  t.classList.add('is-in');
  window.clearTimeout((t as any)._h);
  (t as any)._h = window.setTimeout(() => t.classList.remove('is-in'), 2600);
}

/** Diálogo de confirmación propio (sustituye a confirm()) */
function ask(msg: string, ok = 'Confirmar', danger = false) {
  return new Promise<boolean>((res) => {
    const d = document.createElement('dialog');
    d.className = 'ask';
    d.innerHTML = `<p class="ask-t">${esc(msg)}</p><div class="ask-a"><button class="b" value="no">Cancelar</button><button class="b ${danger ? 'b-danger' : 'b-pri'}" value="si">${esc(ok)}</button></div>`;
    document.body.appendChild(d);
    d.addEventListener('click', (e) => {
      const v = (e.target as HTMLButtonElement).value;
      if (v || e.target === d) d.close(v || 'no');
    });
    d.addEventListener('close', () => { res(d.returnValue === 'si'); d.remove(); });
    d.showModal();
    d.querySelector<HTMLButtonElement>('[value="si"]')!.focus();
  });
}

/* ── Navegación ───────────────────────────────────── */
const route = () => location.hash.replace(/^#\/?/, '').split('/');

function enter() {
  const [view, arg] = route();
  draft = null;
  port = null;
  dirty = false;
  picking = false;
  if (view === 'nuevo') {
    draft = { slug: '', nombre: '', titulo: '', categoria: 'Vivienda', lugar: '', anio: new Date().getFullYear(), m2: null, texto: [''], publicado: false, fotos: [], planos: [], portada: 0, galeria: 'mosaico', mostrar: { ficha: true, texto: true, galeria: true, planos: true, siguiente: true }, diseno: { texto: 'editorial' }, nuevo: true };
  } else if (view === 'proyectos' && arg) {
    const p = bySlug(arg);
    if (!p) { location.replace('#/proyectos'); return; }
    draft = structuredClone(p);
    draft.diseno ??= { texto: 'editorial' };
  } else if (view === 'portada') {
    port = structuredClone(E.portada);
    heroI = 0;
    target = null;
  }
  render();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', async () => {
  if (dirty) {
    const target = location.hash;
    history.replaceState(null, '', lastHash);
    if (!(await ask('Hay cambios sin guardar. ¿Salir sin guardarlos?', 'Salir sin guardar', true))) return;
    dirty = false;
    location.hash = target;
    return;
  }
  lastHash = location.hash;
  enter();
});
window.addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); });

function markDirty(v = true) {
  dirty = v;
  const s = $('[data-state]');
  if (s) { s.textContent = v ? 'Cambios sin guardar' : 'Todo guardado'; s.classList.toggle('is-dirty', v); }
}

/* ── Vistas ───────────────────────────────────────── */
function render() {
  if (!authed()) return login();
  const [view] = route();
  const v = view === 'portada' ? 'portada' : 'proyectos';
  const content = draft ? editor() : port ? portadaView() : lista();
  queueMicrotask(syncPub);
  app.innerHTML = `
  <div class="adm">
    <aside class="side">
      <a href="#/proyectos" class="side-brand"><img src="${seed.logo}" alt="NAN Arquitectos" width="76" height="35"><span>Panel</span></a>
      <nav class="side-nav" aria-label="Secciones del panel">
        <a href="#/proyectos" class="${v === 'proyectos' ? 'is-on' : ''}"><span>Proyectos</span><span class="num">${E.proyectos.length}</span></a>
        <a href="#/portada" class="${v === 'portada' ? 'is-on' : ''}"><span>Portada de la web</span></a>
      </nav>
      <div class="side-foot">
        ${store.publish ? `<button class="pub" data-publish><span class="pub-dot" aria-hidden="true"></span><span class="pub-t">La web está al día</span></button>` : ''}
        <a href="${r('/')}" target="_blank" rel="noopener" class="side-link">Ver la web <span class="arr">↗</span></a>
        ${store.demo ? `<p class="demo"><span class="dot"></span>Modo demo: los cambios se guardan solo en este navegador.</p><button class="side-link" data-reset>Restablecer datos de la demo</button>` : ''}
        <button class="side-link" data-logout>Cerrar sesión</button>
      </div>
    </aside>
    <main class="main" id="main">${content}</main>
  </div>
  <div class="toast" id="toast" role="status"></div>`;
  if (draft) bindEditor();
  if (!draft && !port) bindLista();
}

function login() {
  app.innerHTML = `
  <div class="login">
    <form class="login-card" data-login>
      <img src="${seed.logo}" alt="NAN Arquitectos" width="96" height="44">
      <h1 class="login-t">Panel del estudio</h1>
      <label class="fld"><span>Email</span><input class="in" type="email" name="email" autocomplete="username" required></label>
      <label class="fld"><span>Contraseña</span><input class="in" type="password" name="pass" autocomplete="current-password" required></label>
      <p class="login-err" data-login-err role="alert"></p>
      <button class="b b-pri b-block" data-login-btn>Entrar</button>
      ${store.demo ? '<p class="hint">Demo: entra con cualquier email y contraseña. Los cambios se guardan solo en este navegador.</p>' : ''}
    </form>
  </div>`;
  $('[data-login]')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target as HTMLFormElement);
    if (store.auth) {
      const btn = $('[data-login-btn]')!;
      btn.classList.add('is-busy');
      btn.textContent = 'Entrando…';
      const err = await store.auth.signIn(String(f.get('email')), String(f.get('pass')));
      if (err) {
        btn.classList.remove('is-busy');
        btn.textContent = 'Entrar';
        $('[data-login-err]')!.textContent = err;
        return;
      }
      sesion = true;
      if (!(await cargar())) return;
    } else {
      try { sessionStorage.setItem('nan-admin', '1'); } catch {}
    }
    if (!location.hash) history.replaceState(null, '', '#/proyectos');
    lastHash = location.hash;
    enter();
  });
}

/* Listado */
function filtrados() {
  const s = q.toLowerCase();
  return E.proyectos.filter((p) => (!cat || p.categoria === cat) && (!s || `${p.nombre} ${p.lugar}`.toLowerCase().includes(s)));
}
function row(p: P) {
  const f = p.fotos[p.portada] ?? p.fotos[0];
  const pos = E.proyectos.indexOf(p) + 1;
  const drag = !q && !cat;
  return `<li class="row ${p.publicado ? '' : 'is-off'}" data-slug="${p.slug}" draggable="${drag}">
    <span class="grip" aria-hidden="true" ${drag ? '' : 'hidden'}></span>
    <span class="pos num">${two(pos)}</span>
    <a class="thumb" href="#/proyectos/${p.slug}" tabindex="-1">${f ? `<img src="${f.src}" alt="" loading="lazy">` : ''}</a>
    <a class="r-main" href="#/proyectos/${p.slug}">
      <span class="r-name">${esc(p.nombre)}</span>
      <span class="r-meta">${esc([p.categoria, p.lugar, p.anio].filter(Boolean).join(' · '))}</span>
    </a>
    <span class="r-tags">
      ${enPortada(p.slug) ? '<span class="tag tag-y">En portada</span>' : ''}
      <span class="tag">${GAL.find((g) => g.id === p.galeria)!.t}</span>
      <span class="tag tag-q">${p.fotos.length} fotos</span>
    </span>
    <label class="sw"><input type="checkbox" data-pub ${p.publicado ? 'checked' : ''}><span class="sw-ui" aria-hidden="true"></span><span class="sw-l">${p.publicado ? 'Publicado' : 'Borrador'}</span></label>
    <span class="r-move" ${drag ? '' : 'hidden'}>
      <button class="ib" data-move="-1" aria-label="Subir ${esc(p.nombre)}" ${pos === 1 ? 'disabled' : ''}>↑</button>
      <button class="ib" data-move="1" aria-label="Bajar ${esc(p.nombre)}" ${pos === E.proyectos.length ? 'disabled' : ''}>↓</button>
    </span>
  </li>`;
}
function lista() {
  if (!E.proyectos.length && !store.demo) {
    return `
    <header class="top"><div><h1 class="ttl">Proyectos</h1><p class="sub">La base de datos está vacía.</p></div></header>
    <section class="card import">
      <h2 class="card-t">Importar los proyectos de la web actual</h2>
      <p class="hint">Se cargan los ${seed.estado.proyectos.length} proyectos con sus textos, fotos y la portada que tiene hoy la web. Después se pueden editar desde aquí.</p>
      <button type="button" class="b b-pri" data-import>Importar ${seed.estado.proyectos.length} proyectos</button>
    </section>`;
  }
  const pub = E.proyectos.filter((p) => p.publicado).length;
  const list = filtrados();
  return `
  <header class="top">
    <div><h1 class="ttl">Proyectos</h1><p class="sub">${pub} publicados de ${E.proyectos.length}. <span data-hintdrag>${!q && !cat ? 'Arrastre las filas para cambiar el orden en la web.' : 'Quite la búsqueda y el filtro para reordenar.'}</span></p></div>
    <a class="b b-pri" href="#/nuevo"><span class="plus" aria-hidden="true">+</span> Nuevo proyecto</a>
  </header>
  <div class="tools">
    <input class="in" type="search" placeholder="Buscar por nombre o lugar" value="${esc(q)}" data-q aria-label="Buscar proyectos">
    <select class="in" data-cat aria-label="Filtrar por categoría">
      <option value="">Todas las categorías</option>
      ${seed.categorias.map((c) => `<option ${c === cat ? 'selected' : ''}>${c}</option>`).join('')}
    </select>
  </div>
  <ol class="rows" data-rows>${list.map(row).join('') || '<li class="empty">Ningún proyecto coincide con la búsqueda.</li>'}</ol>`;
}
function bindLista() {
  const imp = $('[data-import]');
  if (imp) {
    imp.addEventListener('click', async () => {
      imp.classList.add('is-busy');
      imp.textContent = 'Importando…';
      E = structuredClone(seed.estado);
      if (await persist()) { toast(`${E.proyectos.length} proyectos importados`); render(); }
      else { E = { proyectos: [], portada: { hero: [null, null, null], home: [null, null, null, null, null] } }; render(); }
    });
    return;
  }
  const rows = $('[data-rows]')!;
  const redraw = () => {
    rows.innerHTML = filtrados().map(row).join('') || '<li class="empty">Ningún proyecto coincide con la búsqueda.</li>';
    $('[data-hintdrag]')!.textContent = !q && !cat ? 'Arrastre las filas para cambiar el orden en la web.' : 'Quite la búsqueda y el filtro para reordenar.';
  };
  $('[data-q]')!.addEventListener('input', (e) => { q = (e.target as HTMLInputElement).value; redraw(); });
  $('[data-cat]')!.addEventListener('change', (e) => { cat = (e.target as HTMLSelectElement).value; redraw(); });

  rows.addEventListener('change', async (e) => {
    const t = e.target as HTMLInputElement;
    if (!t.matches('[data-pub]')) return;
    const li = t.closest<HTMLElement>('[data-slug]')!;
    const p = bySlug(li.dataset.slug!)!;
    p.publicado = t.checked;
    li.classList.toggle('is-off', !p.publicado);
    li.querySelector('.sw-l')!.textContent = p.publicado ? 'Publicado' : 'Borrador';
    await persist();
    toast(p.publicado ? `«${p.nombre}» publicado` : `«${p.nombre}» pasó a borrador`);
  });
  rows.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-move]');
    if (!b) return;
    const slug = b.closest<HTMLElement>('[data-slug]')!.dataset.slug!;
    const i = E.proyectos.findIndex((p) => p.slug === slug);
    const j = i + Number(b.dataset.move);
    if (j < 0 || j >= E.proyectos.length) return;
    [E.proyectos[i], E.proyectos[j]] = [E.proyectos[j], E.proyectos[i]];
    await persist();
    redraw();
    rows.querySelector<HTMLButtonElement>(`[data-slug="${slug}"] [data-move="${b.dataset.move}"]`)?.focus();
    rows.querySelector(`[data-slug="${slug}"]`)?.classList.add('is-moved');
  });
  sortable(rows, '[data-slug]', async (order) => {
    E.proyectos = order.map((s) => bySlug(s)!);
    await persist();
    redraw();
    toast('Orden guardado');
  });
}

/** Reordenar arrastrando (ratón). En táctil se usan los botones ↑ ↓ / ← → */
function sortable(list: HTMLElement, item: string, done: (ids: string[]) => void, key = 'slug') {
  let drag: HTMLElement | null = null;
  list.addEventListener('dragstart', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(item);
    if (!el || el.getAttribute('draggable') !== 'true') return;
    drag = el;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', el.dataset[key]!);
    requestAnimationFrame(() => el.classList.add('is-drag'));
  });
  list.addEventListener('dragover', (e) => {
    if (!drag) return;
    e.preventDefault();
    const over = (e.target as HTMLElement).closest<HTMLElement>(item);
    if (!over || over === drag) return;
    const r = over.getBoundingClientRect();
    // En retículas y tiras (elementos más angostos que la lista) se compara en horizontal
    const horizontal = r.width < list.clientWidth * 0.9;
    const after = horizontal ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2;
    over.parentElement!.insertBefore(drag, after ? over.nextSibling : over);
  });
  list.addEventListener('drop', (e) => { if (drag) e.preventDefault(); });
  list.addEventListener('dragend', () => {
    if (!drag) return;
    drag.classList.remove('is-drag');
    drag = null;
    done(Array.from(list.querySelectorAll<HTMLElement>(item)).map((el) => el.dataset[key]!));
  });
}

/* Editor visual: se edita sobre la plantilla de la página del proyecto */
const TEXTOS: { id: TextoFormato; t: string; d: string }[] = [
  { id: 'editorial', t: 'Editorial', d: 'Entradilla y una columna estrecha' },
  { id: 'columnas', t: 'Dos columnas', d: 'Entradilla a la izquierda y el texto en columnas' },
  { id: 'cita', t: 'Cita', d: 'La entradilla en grande, como una frase destacada' },
];
let device: 'desktop' | 'tablet' | 'mobile' = 'desktop';
let picking = false;

/** Cambios de formato con transición suave (View Transitions) cuando el navegador la soporta */
const vt = (fn: () => void) => {
  const d = document as Document & { startViewTransition?: (f: () => void) => void };
  if (d.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) d.startViewTransition(fn);
  else fn();
};
function sw(name: string, on: boolean, t: string, d?: string) {
  return `<label class="sw sw-row"><span class="sw-txt"><span>${t}</span>${d ? `<span class="hint">${d}</span>` : ''}</span><input type="checkbox" ${name} ${on ? 'checked' : ''}><span class="sw-ui" aria-hidden="true"></span></label>`;
}
/** Barra de opciones de un bloque: nombre, herramientas y el botón de mostrar u ocultar en la web */
function bar(name: string, tools = '', hide?: keyof Mostrar) {
  const on = hide ? draft!.mostrar[hide] : true;
  return `<div class="blk-bar" role="toolbar" aria-label="${name}">
    <span class="blk-name">${name}</span>${tools}
    ${hide ? `<button type="button" class="tb tb-eye ${on ? '' : 'is-off'}" data-toggle="${hide}" aria-pressed="${!on}" title="${on ? 'Ocultar en la web' : 'Mostrar en la web'}">${on ? 'Visible' : 'Oculto'}</button>` : ''}
  </div>`;
}
const seg = (attr: string, opts: { id: string; t: string; d: string }[], cur: string, fig: string) =>
  `<span class="seg" role="radiogroup">${opts.map((o) => `<button type="button" class="seg-b ${o.id === cur ? 'is-on' : ''}" ${attr}="${o.id}" role="radio" aria-checked="${o.id === cur}" title="${o.d}"><span class="mini ${fig}-${o.id}" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${o.t}</span></button>`).join('')}</span>`;
const ce = (field: string, val: unknown, ph: string, cls = '', tag = 'span') =>
  `<${tag} class="ce ${cls}" contenteditable="plaintext-only" spellcheck="true" data-edit="${field}" data-ph="${ph}">${esc(val ?? '')}</${tag}>`;
const upTile = (kind: 'fotos' | 'planos') =>
  `<label class="cv-up" data-drop="${kind}"><input type="file" accept="image/*" multiple data-up="${kind}" class="sr-only"><span class="drop-plus" aria-hidden="true">+</span><span class="drop-t">${kind === 'fotos' ? 'Subir fotos' : 'Subir planos'}</span><span class="hint">o arrastrarlas aquí</span></label>`;

function canvas() {
  const d = draft!;
  const M = d.mostrar;
  const cover = d.fotos[d.portada] ?? d.fotos[0];
  const rest = d.fotos.filter((f) => f !== cover);
  const i = E.proyectos.findIndex((p) => p.slug === d.slug);
  const next = E.proyectos[(i + 1) % E.proyectos.length];
  const img = (f: Foto) => `<img src="${f.src}" alt="" draggable="false" loading="lazy">`;
  const ph = (f: Foto, kind: 'fotos' | 'planos') => {
    const k = d[kind].indexOf(f);
    return `<figure class="cv-ph ${isL(f) ? 'l' : 'p'}" draggable="true" data-id="${f.id}">${img(f)}
      <span class="ph-act">
        ${kind === 'fotos' ? `<button type="button" class="ib" data-cover="${k}" title="Usar como portada" aria-label="Usar como portada">★</button>` : ''}
        <button type="button" class="ib" data-phmove="-1" data-kind="${kind}" data-i="${k}" aria-label="Mover antes">←</button>
        <button type="button" class="ib" data-phmove="1" data-kind="${kind}" data-i="${k}" aria-label="Mover después">→</button>
        <button type="button" class="ib ib-del" data-phdel="${k}" data-kind="${kind}" aria-label="Quitar foto">×</button>
      </span></figure>`;
  };
  const up = (kind: 'fotos' | 'planos', t: string) => `<label class="tb"><input type="file" accept="image/*" multiple data-up="${kind}" class="sr-only">${t}</label>`;
  return `
  <section class="blk blk-hero">
    ${bar('Portada', `<button type="button" class="tb ${picking ? 'is-on' : ''}" data-pick aria-expanded="${picking}">${picking ? 'Listo' : 'Cambiar foto'}</button>`)}
    <div class="cv-hero">${cover ? img(cover) : '<div class="cv-empty">Suba fotos para elegir la portada</div>'}</div>
    ${picking ? `<div class="pick" role="radiogroup" aria-label="Foto de portada">${d.fotos.map((f, k) => `<button type="button" class="pick-b ${k === d.portada ? 'is-on' : ''}" data-cover="${k}" role="radio" aria-checked="${k === d.portada}">${img(f)}</button>`).join('')}${upTile('fotos')}</div>` : ''}
  </section>

  <section class="blk blk-head">
    ${bar('Título y ficha', '', 'ficha')}
    <div class="cv-head">
      <div class="cv-tcol"><p class="cv-crumb">Proyectos / <span data-crumb>${esc(d.categoria)}</span></p>${ce('nombre', d.nombre, 'Nombre del proyecto', 'cv-title', 'h1')}</div>
      <dl class="cv-ficha ${M.ficha ? '' : 'is-hidden'}">
        <div><dt>Lugar</dt><dd>${ce('lugar', d.lugar, 'Lugar')}</dd></div>
        <div><dt>Año</dt><dd>${ce('anio', d.anio, 'Año')}</dd></div>
        <div><dt>Superficie</dt><dd>${ce('m2', d.m2, '—')} m²</dd></div>
      </dl>
    </div>
  </section>

  <section class="blk blk-text ${M.texto ? '' : 'is-hidden'}">
    ${bar('Texto', seg('data-tfmt', TEXTOS, d.diseno.texto, 'mini-t'), 'texto')}
    <div class="cv-text f-${d.diseno.texto}">
      <p class="ce cv-lead" contenteditable="plaintext-only" data-para="0" data-ph="Escriba la entradilla: una o dos frases que presenten el proyecto">${esc(d.texto[0] ?? '')}</p>
      <div class="cv-rest">
        ${d.texto.slice(1).map((t, k) => `<div class="cv-p"><p class="ce" contenteditable="plaintext-only" data-para="${k + 1}" data-ph="Escriba un párrafo">${esc(t)}</p><button type="button" class="ib ib-del cv-pdel" data-pdel="${k + 1}" aria-label="Quitar párrafo">×</button></div>`).join('')}
        <button type="button" class="cv-add" data-padd>+ Añadir párrafo</button>
      </div>
    </div>
  </section>

  <section class="blk blk-gal ${M.galeria ? '' : 'is-hidden'}" data-dropzone="fotos">
    ${bar('Galería', seg('data-gal', GAL, d.galeria, 'mini-g') + up('fotos', 'Subir fotos'), 'galeria')}
    ${rest.length ? `<div class="cv-g g-${d.galeria}" data-phs="fotos">${rest.map((f) => ph(f, 'fotos')).join('')}</div>` : `<div class="cv-g-empty">${upTile('fotos')}</div>`}
  </section>

  <section class="blk blk-planos ${M.planos ? '' : 'is-hidden'}" data-dropzone="planos">
    ${bar('Planos', up('planos', 'Subir planos'), 'planos')}
    ${d.planos.length ? `<div class="cv-g g-mosaico is-contain" data-phs="planos">${d.planos.map((f) => ph(f, 'planos')).join('')}</div>` : `<div class="cv-g-empty">${upTile('planos')}<p class="hint">Opcional: si no hay planos, este bloque no aparece en la web.</p></div>`}
  </section>

  <section class="blk blk-next ${M.siguiente ? '' : 'is-hidden'}">
    ${bar('Siguiente proyecto', '', 'siguiente')}
    <div class="cv-next"><span class="hint">Siguiente proyecto</span><span class="cv-next-n">${esc(next && next.slug !== d.slug ? next.nombre : 'El primero del listado')}</span></div>
  </section>`;
}

function editor() {
  const d = draft!;
  const devs = [['desktop', 'Escritorio'], ['tablet', 'Tablet'], ['mobile', 'Móvil']];
  return `
  <header class="top top-ed">
    <div class="top-l">
      <a class="back" href="#/proyectos"><span class="arr-l">←</span> Proyectos</a>
      <h1 class="ttl" data-ttl>${esc(d.nombre || 'Nuevo proyecto')}</h1>
    </div>
    <div class="top-act">
      <span class="dev" role="radiogroup" aria-label="Tamaño de la vista previa">${devs.map(([k, t]) => `<button type="button" class="dev-b ${device === k ? 'is-on' : ''}" data-dev="${k}" role="radio" aria-checked="${device === k}">${t}</button>`).join('')}</span>
      <span class="state" data-state>${d.nuevo ? 'Sin guardar' : 'Todo guardado'}</span>
      <button type="button" class="b b-ghost" data-drawer>Ajustes</button>
      ${d.nuevo ? '' : `<a class="b b-ghost b-web" href="${r(`/proyectos/${d.slug}/`)}" target="_blank" rel="noopener">Ver en la web <span class="arr">↗</span></a>`}
      <button type="button" class="b b-pri" data-save><span data-save-t>${d.nuevo ? 'Crear proyecto' : 'Guardar'}</span></button>
    </div>
  </header>
  <p class="ed-hint hint">Así se verá la página. Pase el ratón sobre cada bloque para ver sus opciones y escriba los textos directamente encima.</p>
  <div class="stage"><div class="cv cv-${device}" data-cv>${canvas()}</div></div>
  <div class="drawer-bg" data-drawer-close hidden></div>
  <aside class="drawer" aria-label="Ajustes del proyecto" data-drawer-panel>
    <div class="drawer-h"><h2 class="card-t">Ajustes</h2><button type="button" class="ib" data-drawer-close aria-label="Cerrar ajustes">×</button></div>
    <label class="fld"><span>Categoría</span><select class="in" data-f="categoria">${seed.categorias.map((c) => `<option ${c === d.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    <label class="fld"><span>Título completo <em>aparece en Google y en la pestaña</em></span><input class="in" data-f="titulo" value="${esc(d.titulo)}" placeholder="${esc(d.nombre || 'Igual que el nombre')}"></label>
    <div class="sws">${sw('data-f-pub', d.publicado, 'Publicado en la web', 'Apagado, el proyecto queda como borrador')}</div>
    ${d.nuevo ? '' : '<button type="button" class="b b-danger-ghost" data-del>Eliminar proyecto</button>'}
  </aside>`;
}
function redraw(focusSel?: string, anim = false) {
  const go = () => {
    $('[data-cv]')!.innerHTML = canvas();
    if (focusSel) {
      const el = $(focusSel);
      el?.focus();
      if (el?.isContentEditable) { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); getSelection()?.removeAllRanges(); getSelection()?.addRange(r); }
    }
  };
  if (anim) vt(go); else go();
}
function setDrawer(open: boolean) {
  $('[data-drawer-panel]')!.classList.toggle('is-open', open);
  $('.drawer-bg')!.hidden = !open;
  if (open) $<HTMLElement>('[data-drawer-panel] select')!.focus();
}

async function subir(kind: 'fotos' | 'planos', files: FileList | File[]) {
  const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (!imgs.length) return;
  app.querySelectorAll<HTMLElement>(`[data-drop="${kind}"]`).forEach((z) => {
    z.classList.add('is-busy');
    z.querySelector('.drop-t')!.textContent = `Subiendo ${imgs.length} ${imgs.length === 1 ? 'imagen' : 'imágenes'}…`;
  });
  toast(`Subiendo ${imgs.length} ${imgs.length === 1 ? 'imagen' : 'imágenes'}…`);
  let fallos = 0;
  for (const f of imgs) {
    try { draft![kind].push(await store.upload(f)); } catch { fallos++; }
  }
  markDirty();
  redraw(undefined, true);
  toast(fallos ? `${fallos} ${fallos === 1 ? 'imagen no se pudo' : 'imágenes no se pudieron'} subir. Pruebe con JPG o PNG.` : `${imgs.length} ${imgs.length === 1 ? 'imagen añadida' : 'imágenes añadidas'}`);
}

async function guardar() {
  const d = draft!;
  if (!d.nombre.trim()) {
    toast('Escriba el nombre del proyecto para guardarlo.');
    $('[data-edit="nombre"]')?.focus();
    return;
  }
  const btn = $('[data-save]')!;
  btn.classList.add('is-busy');
  const { nuevo, ...p } = d;
  p.nombre = p.nombre.trim();
  p.titulo = p.titulo.trim() || p.nombre;
  p.texto = p.texto.map((t) => t.trim()).filter(Boolean);
  if (nuevo) {
    let s = slugify(p.nombre) || 'proyecto';
    for (let n = 2; bySlug(s); n++) s = `${slugify(p.nombre)}-${n}`;
    p.slug = s;
    E.proyectos.unshift(p);
  } else {
    E.proyectos[E.proyectos.findIndex((x) => x.slug === p.slug)] = p;
  }
  if (!(await persist())) {
    if (nuevo) E.proyectos.shift();
    btn.classList.remove('is-busy');
    return;
  }
  dirty = false;
  draft = { ...structuredClone(p) };
  btn.classList.remove('is-busy');
  if (nuevo) {
    history.replaceState(null, '', `#/proyectos/${p.slug}`);
    lastHash = location.hash;
    render();
    toast('Proyecto creado. Aparece primero en el listado.');
  } else {
    markDirty(false);
    $('[data-save-t]')!.textContent = 'Guardado';
    btn.classList.add('is-ok');
    window.setTimeout(() => { btn.classList.remove('is-ok'); const t = $('[data-save-t]'); if (t) t.textContent = 'Guardar'; }, 1600);
    toast('Cambios guardados');
  }
}

function moveIn<T>(arr: T[], i: number, dir: number) {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return false;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return true;
}
/** Reordena fotos manteniendo cuál es la destacada */
function reorderFotos(kind: 'fotos' | 'planos', fn: () => void) {
  const d = draft!;
  const coverId = d.fotos[d.portada]?.id;
  fn();
  if (kind === 'fotos') d.portada = Math.max(0, d.fotos.findIndex((f) => f.id === coverId));
}

function bindEditor() {
  const main = $('#main')!;
  const d = draft!;
  const num = (v: string) => { const n = parseInt(v.replace(/\D/g, ''), 10); return Number.isFinite(n) ? n : null; };

  // Textos escritos sobre la página: se guardan en el borrador sin redibujar (no se pierde el cursor)
  main.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.dataset.edit) {
      const k = t.dataset.edit;
      const v = t.textContent!.trim();
      if (k === 'anio' || k === 'm2') d[k] = num(v);
      else (d as unknown as Record<string, string>)[k] = v;
      if (k === 'nombre') $('[data-ttl]')!.textContent = v || 'Nuevo proyecto';
    } else if (t.dataset.para) {
      d.texto[Number(t.dataset.para)] = t.textContent!;
    } else if (t.dataset.f === 'titulo') {
      d.titulo = (t as HTMLInputElement).value;
    } else return;
    markDirty();
  });
  main.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.up) { subir(t.dataset.up as 'fotos' | 'planos', t.files!); return; }
    if (t.dataset.f === 'categoria') { d.categoria = t.value; const c = $('[data-crumb]'); if (c) c.textContent = t.value; }
    else if (t.matches('[data-f-pub]')) d.publicado = t.checked;
    else return;
    markDirty();
  });
  // Enter: en el título o la ficha termina la edición; en un párrafo crea el siguiente
  main.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.key === 'Escape' && $('[data-drawer-panel]')!.classList.contains('is-open')) { setDrawer(false); return; }
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (t.dataset.edit) { e.preventDefault(); t.blur(); }
    else if (t.dataset.para) {
      e.preventDefault();
      const i = Number(t.dataset.para);
      d.texto.splice(i + 1, 0, '');
      markDirty();
      redraw(`[data-para="${i + 1}"]`);
    }
  });
  // Pegar: siempre texto plano; varios párrafos pegados se convierten en varios párrafos
  main.addEventListener('paste', (e) => {
    const t = e.target as HTMLElement;
    const box = t.closest<HTMLElement>('[contenteditable]');
    if (!box) return;
    e.preventDefault();
    const txt = e.clipboardData?.getData('text/plain') ?? '';
    if (box.dataset.para && /\n\s*\n/.test(txt)) {
      const parts = txt.split(/\n\s*\n/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
      const i = Number(box.dataset.para);
      document.execCommand('insertText', false, parts.shift()!);
      d.texto[i] = box.textContent!;
      d.texto.splice(i + 1, 0, ...parts);
      markDirty();
      redraw(`[data-para="${i + parts.length}"]`);
      return;
    }
    document.execCommand('insertText', false, txt.replace(/\s+/g, ' '));
  });

  main.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button, [data-drawer-close]');
    if (!b) return;
    const kind = b.dataset.kind as 'fotos' | 'planos';
    if (b.matches('[data-save]')) return guardar();
    if (b.dataset.dev) {
      device = b.dataset.dev as typeof device;
      vt(() => {
        $('[data-cv]')!.className = `cv cv-${device}`;
        main.querySelectorAll('.dev-b').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', String(x === b)); });
      });
      return;
    }
    if (b.matches('[data-drawer]')) return setDrawer(true);
    if (b.matches('[data-drawer-close]')) return setDrawer(false);
    if (b.matches('[data-pick]')) { picking = !picking; return redraw(undefined, true); }
    if (b.dataset.cover) {
      d.portada = Number(b.dataset.cover);
      toast('Foto de portada cambiada');
    } else if (b.dataset.toggle) {
      const k = b.dataset.toggle as keyof Mostrar;
      d.mostrar[k] = !d.mostrar[k];
    } else if (b.dataset.tfmt) {
      d.diseno.texto = b.dataset.tfmt as TextoFormato;
    } else if (b.dataset.gal) {
      d.galeria = b.dataset.gal as Galeria;
    } else if (b.dataset.phdel) {
      reorderFotos(kind, () => d[kind].splice(Number(b.dataset.phdel), 1));
    } else if (b.dataset.phmove) {
      reorderFotos(kind, () => moveIn(d[kind], Number(b.dataset.i), Number(b.dataset.phmove)));
      markDirty();
      return redraw();
    } else if (b.matches('[data-padd]')) {
      d.texto.push('');
      markDirty();
      return redraw(`[data-para="${d.texto.length - 1}"]`);
    } else if (b.dataset.pdel) {
      d.texto.splice(Number(b.dataset.pdel), 1);
      markDirty();
      return redraw();
    } else if (b.matches('[data-del]')) {
      if (!(await ask(`¿Eliminar «${d.nombre}»? Se quitará de la web y no se puede deshacer.`, 'Eliminar', true))) return;
      E.proyectos = E.proyectos.filter((p) => p.slug !== d.slug);
      E.portada.hero = E.portada.hero.map((s) => (s?.slug === d.slug ? null : s));
      E.portada.home = E.portada.home.map((s) => (s?.slug === d.slug ? null : s));
      await persist();
      dirty = false;
      location.hash = '#/proyectos';
      toast('Proyecto eliminado');
      return;
    } else return;
    markDirty();
    redraw(undefined, true);
  });

  // Fotos: soltar archivos sobre la galería o los planos para subirlos
  main.addEventListener('dragover', (e) => {
    const z = (e.target as HTMLElement).closest<HTMLElement>('[data-drop], [data-dropzone]');
    if (z && e.dataTransfer?.types.includes('Files')) { e.preventDefault(); z.classList.add('is-over'); }
  });
  main.addEventListener('dragleave', (e) => (e.target as HTMLElement).closest('[data-drop], [data-dropzone]')?.classList.remove('is-over'));
  main.addEventListener('drop', (e) => {
    const z = (e.target as HTMLElement).closest<HTMLElement>('[data-drop], [data-dropzone]');
    if (!z || !e.dataTransfer?.files.length) return;
    e.preventDefault();
    z.classList.remove('is-over');
    subir((z.dataset.drop ?? z.dataset.dropzone) as 'fotos' | 'planos', e.dataTransfer.files);
  });
  // Arrastrar fotos dentro de la galería para ordenarlas (tras cada redibujado se vuelven a enlazar)
  const bindSort = () => (['fotos', 'planos'] as const).forEach((kind) => {
    const box = $(`[data-phs="${kind}"]`);
    if (!box || box.dataset.bound) return;
    box.dataset.bound = '1';
    sortable(box, '.cv-ph', (ids) => {
      if (kind === 'fotos') {
        const cover = d.fotos[d.portada];
        const rest = ids.map((id) => d.fotos.find((f) => f.id === id)!);
        d.fotos = cover ? [cover, ...rest] : rest;
        d.portada = 0;
      } else d.planos = ids.map((id) => d.planos.find((f) => f.id === id)!);
      markDirty();
      redraw();
    }, 'id');
  });
  bindSort();
  new MutationObserver(bindSort).observe($('[data-cv]')!, { childList: true });

  document.onkeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && draft) { e.preventDefault(); guardar(); }
  };
}

/* Portada de la web: maqueta editable de la home */
let heroI = 0;
let target: { kind: 'hero' | 'home'; i: number } | null = null;
let pq = '';

const devHTML = () => `<span class="dev" role="radiogroup" aria-label="Tamaño de la vista previa">${[['desktop', 'Escritorio'], ['tablet', 'Tablet'], ['mobile', 'Móvil']].map(([k, t]) => `<button type="button" class="dev-b ${device === k ? 'is-on' : ''}" data-dev="${k}" role="radio" aria-checked="${device === k}">${t}</button>`).join('')}</span>`;
const slotImg = (s: Slot | null) => {
  const p = s ? bySlug(s.slug) : undefined;
  if (!p) return null;
  return { p, f: p.fotos.find((f) => f.id === s!.foto) ?? p.fotos[0] };
};
const slotO = (kind: 'hero' | 'home', i: number) => (kind === 'hero' ? 'L' : seed.slots[i].o);

function homeCanvas() {
  const P = port!;
  const h = slotImg(P.hero[heroI]);
  const tabs = P.hero.map((s, k) => {
    const x = slotImg(s);
    return `<button type="button" class="hp-tab ${k === heroI ? 'is-on' : ''}" data-hero-i="${k}" aria-pressed="${k === heroI}"><span class="hp-tab-img">${x?.f ? `<img src="${x.f.src}" alt="">` : ''}</span><span class="num">${two(k + 1)}</span></button>`;
  }).join('');
  return `
  <section class="blk hp-hero">
    ${bar(`Carrusel · foto ${two(heroI + 1)} de 03`, `<button type="button" class="tb" data-slot-open="hero:${heroI}">${h ? 'Cambiar obra o foto' : 'Elegir obra'}</button>${h ? `<button type="button" class="tb" data-slot-clear="hero:${heroI}">Quitar</button>` : ''}`)}
    <button type="button" class="hp-media" data-slot-open="hero:${heroI}" aria-label="Cambiar la foto ${heroI + 1} del carrusel">${h?.f ? `<img src="${h.f.src}" alt="">` : '<span class="hp-empty">Elegir la obra de esta foto</span>'}</button>
    <div class="hp-cap">
      <p><span class="hp-name">${h ? esc(h.p.nombre) : 'Sin obra'}</span><span class="hint">${h ? esc([h.p.lugar, h.p.anio].filter(Boolean).join(' · ')) : ''}</span></p>
      <div class="hp-tabs" role="group" aria-label="Fotos del carrusel">${tabs}</div>
    </div>
  </section>
  <section class="blk hp-works">
    ${bar('Obras seleccionadas', '<span class="blk-name">Haga clic en una foto para cambiarla</span>')}
    <div class="hp-head"><h2 class="hp-h2">Obras seleccionadas</h2><span class="hint">Todos los proyectos →</span></div>
    <div class="hp-grid">${seed.slots.map((sl, k) => {
      const x = slotImg(P.home[k]);
      return `<div class="hp-slot" style="--col:${sl.col};--mt:${(parseInt(sl.mt, 10) || 0) / 14.4}">
        <button type="button" class="hp-frame ${x ? '' : 'is-empty'}" style="aspect-ratio:${sl.ar}" data-slot-open="home:${k}" aria-label="Cambiar la obra de la posición ${k + 1}">
          ${x?.f ? `<img src="${x.f.src}" alt="">` : '<span class="hp-empty">Elegir obra</span>'}
          <span class="hp-pos"><span class="num">${two(k + 1)}</span> · ${sl.label}</span>
        </button>
        <p class="hp-wcap"><span class="hp-wname">${x ? esc(x.p.nombre) : 'Posición libre'}</span><span class="hint">${x ? esc([x.p.categoria, x.p.anio].filter(Boolean).join(' · ')) : ''}</span></p>
      </div>`;
    }).join('')}</div>
  </section>
  <p class="hp-rest hint">Debajo siguen Estudio, Publicaciones, Servicios y Contacto, que no cambian desde aquí.</p>`;
}

function pkList() {
  const { kind, i } = target!;
  const s = port![kind][i];
  const used = new Map(port![kind].map((x, k) => [x?.slug, k] as const).filter(([sl, k]) => sl && k !== i));
  const q = pq.toLowerCase();
  const list = E.proyectos.filter((p) => p.publicado && (!q || `${p.nombre} ${p.lugar}`.toLowerCase().includes(q)));
  return list.map((p) => {
    const f = p.fotos[p.portada] ?? p.fotos[0];
    const u = used.get(p.slug);
    return `<li><button type="button" class="pk-item ${p.slug === s?.slug ? 'is-on' : ''}" data-pk-slug="${p.slug}" ${u !== undefined ? 'disabled' : ''}>
      <span class="pk-th">${f ? `<img src="${f.src}" alt="" loading="lazy">` : ''}</span>
      <span class="pk-t"><span>${esc(p.nombre)}</span><span class="hint">${u !== undefined ? `Ya está en la posición ${two(u + 1)}` : esc([p.categoria, p.anio].filter(Boolean).join(' · '))}</span></span>
    </button></li>`;
  }).join('') || '<li class="hint pk-none">Ningún proyecto publicado coincide.</li>';
}
function pickerHTML() {
  const { kind, i } = target!;
  const s = port![kind][i];
  const o = slotO(kind, i);
  const cur = s ? bySlug(s.slug) : undefined;
  const where = kind === 'hero' ? `Carrusel · foto ${two(i + 1)}` : `Obras seleccionadas · posición ${two(i + 1)} (${seed.slots[i].label.toLowerCase()})`;
  return `
  <div class="drawer-h"><h2 class="card-t">Elegir obra</h2><button type="button" class="ib" data-picker-close aria-label="Cerrar">×</button></div>
  <p class="hint">${esc(where)}</p>
  ${cur ? `<div class="pk-cur">
    <p class="pk-lbl">Foto de «${esc(cur.nombre)}» <span class="hint">· mejor ${o === 'L' ? 'horizontal' : 'vertical'}</span></p>
    <div class="pk-ph" role="radiogroup" aria-label="Foto">${cur.fotos.map((f) => `<button type="button" class="sp ${f.id === s!.foto ? 'is-on' : ''} ${(o === 'L') === isL(f) ? '' : 'is-dim'}" data-pk-foto="${f.id}" role="radio" aria-checked="${f.id === s!.foto}" aria-label="${isL(f) ? 'Horizontal' : 'Vertical'}"><img src="${f.src}" alt="" loading="lazy"></button>`).join('')}</div>
  </div>` : ''}
  <input class="in" type="search" placeholder="Buscar proyecto" value="${esc(pq)}" data-pk-q aria-label="Buscar proyecto">
  <ul class="pk-list" data-pk-list>${pkList()}</ul>
  ${s ? `<button type="button" class="b b-danger-ghost" data-slot-clear="${kind}:${i}">Quitar de esta posición</button>` : ''}`;
}

function portadaView() {
  queueMicrotask(bindPortada);
  return `
  <header class="top top-ed">
    <div class="top-l"><h1 class="ttl">Portada de la web</h1></div>
    <div class="top-act">
      ${devHTML()}
      <span class="state" data-state>Todo guardado</span>
      <a class="b b-ghost b-web" href="${r('/')}" target="_blank" rel="noopener">Ver la web <span class="arr">↗</span></a>
      <button type="button" class="b b-pri" data-psave><span data-save-t>Guardar portada</span></button>
    </div>
  </header>
  <p class="ed-hint hint">Así se ve el inicio de la web. Haga clic en cualquier foto para elegir qué obra va ahí y con qué imagen.</p>
  <div class="stage"><div class="cv cv-${device}" data-cv>${homeCanvas()}</div></div>
  <div class="drawer-bg" data-picker-close hidden></div>
  <aside class="drawer pk" aria-label="Elegir obra" data-picker></aside>`;
}

function bindPortada() {
  const main = $('#main')!;
  const P = port!;
  const drawerEl = $('[data-picker]')!;
  const bg = main.querySelector<HTMLElement>('.drawer-bg')!;
  const redrawHome = () => vt(() => { $('[data-cv]')!.innerHTML = homeCanvas(); });
  const refreshPicker = () => { if (target) drawerEl.innerHTML = pickerHTML(); };
  const openPicker = (kind: 'hero' | 'home', i: number) => {
    target = { kind, i };
    pq = '';
    drawerEl.innerHTML = pickerHTML();
    drawerEl.classList.add('is-open');
    bg.hidden = false;
    $<HTMLInputElement>('[data-pk-q]')?.focus({ preventScroll: true });
  };
  const closePicker = () => { target = null; drawerEl.classList.remove('is-open'); bg.hidden = true; };
  const parse = (v: string) => { const [k, i] = v.split(':'); return [k as 'hero' | 'home', Number(i)] as const; };

  main.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button, [data-picker-close]');
    if (!b) return;
    if (b.dataset.dev) {
      device = b.dataset.dev as typeof device;
      vt(() => {
        $('[data-cv]')!.className = `cv cv-${device}`;
        main.querySelectorAll('.dev-b').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', String(x === b)); });
      });
    } else if (b.dataset.heroI) {
      heroI = Number(b.dataset.heroI);
      redrawHome();
    } else if (b.dataset.slotOpen) {
      const [k, i] = parse(b.dataset.slotOpen);
      if (k === 'hero' && heroI !== i) { heroI = i; redrawHome(); }
      openPicker(k, i);
    } else if (b.matches('[data-picker-close]')) {
      closePicker();
    } else if (b.dataset.slotClear) {
      const [k, i] = parse(b.dataset.slotClear);
      P[k][i] = null;
      markDirty();
      redrawHome();
      closePicker();
      toast('Posición vaciada');
    } else if (b.dataset.pkSlug && target) {
      const p = bySlug(b.dataset.pkSlug)!;
      const o = slotO(target.kind, target.i);
      P[target.kind][target.i] = { slug: p.slug, foto: (p.fotos.find((f) => (o === 'L') === isL(f)) ?? p.fotos[0])?.id ?? '' };
      markDirty();
      redrawHome();
      refreshPicker();
    } else if (b.dataset.pkFoto && target) {
      P[target.kind][target.i]!.foto = b.dataset.pkFoto;
      markDirty();
      redrawHome();
      refreshPicker();
    } else if (b.matches('[data-psave]')) {
      const antes = E.portada;
      E.portada = structuredClone(P);
      if (!(await persist())) { E.portada = antes; return; }
      markDirty(false);
      $('[data-save-t]')!.textContent = 'Guardada';
      b.classList.add('is-ok');
      window.setTimeout(() => { b.classList.remove('is-ok'); const t = $('[data-save-t]'); if (t) t.textContent = 'Guardar portada'; }, 1600);
      toast('Portada guardada');
    }
  });
  main.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (!t.matches('[data-pk-q]') || !target) return;
    pq = t.value;
    $('[data-pk-list]')!.innerHTML = pkList();
  });
  main.addEventListener('keydown', (e) => { if (e.key === 'Escape' && target) closePicker(); });
}

/* ── Acciones globales ────────────────────────────── */
app.addEventListener('click', async (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-logout], [data-reset], [data-publish]');
  if (!b) return;
  if (b.matches('[data-publish]')) {
    if (dirty) { toast('Guarde los cambios del proyecto antes de publicar.'); return; }
    b.classList.add('is-busy');
    try {
      await store.publish!();
      pendiente(false);
      toast('Publicando: la web se actualiza en unos minutos.');
    } catch (err) {
      toast(`No se pudo publicar: ${(err as Error).message}`);
    }
    b.classList.remove('is-busy');
    syncPub();
  } else if (b.matches('[data-logout]')) {
    if (dirty && !(await ask('Hay cambios sin guardar. ¿Cerrar sesión igualmente?', 'Cerrar sesión', true))) return;
    dirty = false;
    try { sessionStorage.removeItem('nan-admin'); } catch {}
    await store.auth?.signOut();
    sesion = false;
    login();
  } else if (await ask('Se borrarán todos los cambios hechos en esta demo y se volverá a los datos reales del sitio.', 'Restablecer', true)) {
    await store.reset();
    E = await store.load();
    dirty = false;
    enter();
    toast('Demo restablecida');
  }
});

async function cargar() {
  try {
    E = await store.load();
    return true;
  } catch (err) {
    app.innerHTML = `<div class="login"><div class="login-card"><h1 class="login-t">No se pudieron cargar los proyectos</h1><p class="hint">${esc((err as Error).message)}</p><button class="b b-pri b-block" onclick="location.reload()">Reintentar</button></div></div>`;
    return false;
  }
}
(async () => {
  if (store.auth) {
    sesion = await store.auth.session();
    if (!sesion) return login();
  }
  if (!(await cargar())) return;
  if (!location.hash) history.replaceState(null, '', '#/proyectos');
  lastHash = location.hash;
  enter();
})();
