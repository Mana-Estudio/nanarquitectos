import { localStore, type Estado, type Foto, type Galeria, type Mostrar, type P, type Portada } from './store';

interface Seed { estado: Estado; slots: { label: string; o: 'L' | 'P' }[]; categorias: string[]; logo: string }
const seed: Seed = JSON.parse(document.getElementById('seed')!.textContent!);
const store = localStore(seed.estado);
const app = document.getElementById('app')!;

/* ── Estado ───────────────────────────────────────── */
let E: Estado;
let draft: (P & { nuevo?: boolean }) | null = null;
let port: Portada | null = null;
let dirty = false;
let q = '';
let cat = '';
let showPrev = false;
let lastHash = location.hash;

const GAL: { id: Galeria; t: string; d: string }[] = [
  { id: 'mosaico', t: 'Mosaico', d: 'Retícula densa, poco aire entre fotos' },
  { id: 'galeria', t: 'Galería deslizable', d: 'Tira horizontal que se pasa con el dedo' },
  { id: 'sueltas', t: 'Imágenes sueltas', d: 'Composición editorial, con mucho aire' },
];
const BLOQUES: { k: keyof Mostrar; t: string; d: string }[] = [
  { k: 'ficha', t: 'Ficha técnica', d: 'Lugar, año y superficie junto al título' },
  { k: 'texto', t: 'Texto', d: 'Los párrafos de descripción' },
  { k: 'galeria', t: 'Galería', d: 'Todas las fotos salvo la destacada' },
  { k: 'planos', t: 'Planos', d: 'Solo aparece si se subió alguno' },
  { k: 'siguiente', t: 'Siguiente proyecto', d: 'Enlace al proyecto que sigue al final' },
];

/* ── Utilidades ───────────────────────────────────── */
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const isL = (f: Foto) => f.w > f.h;
const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const two = (n: number) => String(n).padStart(2, '0');
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = app) => r.querySelector<T>(s);
const bySlug = (s: string) => E.proyectos.find((p) => p.slug === s);
const enPortada = (s: string) => [...E.portada.hero, ...E.portada.home].some((x) => x?.slug === s);
const authed = () => { try { return sessionStorage.getItem('nan-admin') === '1'; } catch { return true; } };
const persist = () => store.save(E);

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
  showPrev = false;
  if (view === 'nuevo') {
    draft = { slug: '', nombre: '', titulo: '', categoria: 'Vivienda', lugar: '', anio: new Date().getFullYear(), m2: null, texto: [''], publicado: false, fotos: [], planos: [], portada: 0, galeria: 'mosaico', mostrar: { ficha: true, texto: true, galeria: true, planos: true, siguiente: true }, nuevo: true };
  } else if (view === 'proyectos' && arg) {
    const p = bySlug(arg);
    if (!p) { location.replace('#/proyectos'); return; }
    draft = structuredClone(p);
  } else if (view === 'portada') {
    port = structuredClone(E.portada);
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
  app.innerHTML = `
  <div class="adm">
    <aside class="side">
      <a href="#/proyectos" class="side-brand"><img src="${seed.logo}" alt="NAN Arquitectos" width="76" height="35"><span>Panel</span></a>
      <nav class="side-nav" aria-label="Secciones del panel">
        <a href="#/proyectos" class="${v === 'proyectos' ? 'is-on' : ''}"><span>Proyectos</span><span class="num">${E.proyectos.length}</span></a>
        <a href="#/portada" class="${v === 'portada' ? 'is-on' : ''}"><span>Portada de la web</span></a>
      </nav>
      <div class="side-foot">
        <a href="/" target="_blank" rel="noopener" class="side-link">Ver la web <span class="arr">↗</span></a>
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
      <button class="b b-pri b-block">Entrar</button>
      ${store.demo ? '<p class="hint">Demo: entra con cualquier email y contraseña. Los cambios se guardan solo en este navegador.</p>' : ''}
    </form>
  </div>`;
  $('[data-login]')!.addEventListener('submit', (e) => {
    e.preventDefault();
    try { sessionStorage.setItem('nan-admin', '1'); } catch {}
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
    const horizontal = getComputedStyle(list).display.includes('grid') && r.width < list.clientWidth / 2;
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

/* Editor */
function photos(kind: 'fotos' | 'planos') {
  const d = draft!;
  const list = d[kind];
  return `<div class="phs" data-phs="${kind}">
    ${list.map((f, i) => `
      <figure class="ph ${kind === 'fotos' && i === d.portada ? 'is-cover' : ''}" draggable="true" data-id="${f.id}">
        <img src="${f.src}" alt="" loading="lazy" draggable="false">
        <span class="ph-o">${isL(f) ? 'Horizontal' : 'Vertical'}</span>
        ${kind === 'fotos' ? `<button type="button" class="ph-star" data-cover="${i}" aria-pressed="${i === d.portada}" aria-label="${i === d.portada ? 'Foto destacada' : 'Usar como foto destacada'}" title="Foto destacada">★</button>` : ''}
        <span class="ph-act">
          <button type="button" class="ib" data-phmove="-1" data-kind="${kind}" data-i="${i}" aria-label="Mover antes" ${i === 0 ? 'disabled' : ''}>←</button>
          <button type="button" class="ib" data-phmove="1" data-kind="${kind}" data-i="${i}" aria-label="Mover después" ${i === list.length - 1 ? 'disabled' : ''}>→</button>
          <button type="button" class="ib ib-del" data-phdel="${i}" data-kind="${kind}" aria-label="Quitar foto">×</button>
        </span>
      </figure>`).join('')}
    <label class="drop" data-drop="${kind}">
      <input type="file" accept="image/*" multiple data-up="${kind}" class="sr-only">
      <span class="drop-plus" aria-hidden="true">+</span>
      <span class="drop-t">${kind === 'fotos' ? 'Subir fotos' : 'Subir planos'}</span>
      <span class="drop-d">Arrastre aquí o haga clic</span>
    </label>
  </div>`;
}
function sw(name: string, on: boolean, t: string, d?: string) {
  return `<label class="sw sw-row"><span class="sw-txt"><span>${t}</span>${d ? `<span class="hint">${d}</span>` : ''}</span><input type="checkbox" ${name} ${on ? 'checked' : ''}><span class="sw-ui" aria-hidden="true"></span></label>`;
}
function form() {
  const d = draft!;
  return `
  <section class="card">
    <h2 class="card-t">Datos del proyecto</h2>
    <div class="grid2">
      <label class="fld fld-wide"><span>Nombre</span><input class="in in-lg" data-f="nombre" value="${esc(d.nombre)}" required placeholder="Ej.: Vivienda en Poio"></label>
      <label class="fld fld-wide"><span>Título completo <em>aparece en Google y en la pestaña del navegador</em></span><input class="in" data-f="titulo" value="${esc(d.titulo)}" placeholder="${esc(d.nombre || 'Igual que el nombre')}"></label>
      <label class="fld"><span>Categoría</span><select class="in" data-f="categoria">${seed.categorias.map((c) => `<option ${c === d.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="fld"><span>Lugar</span><input class="in" data-f="lugar" value="${esc(d.lugar)}" placeholder="Pontevedra"></label>
      <label class="fld"><span>Año</span><input class="in" type="number" inputmode="numeric" data-f="anio" value="${d.anio ?? ''}" min="1990" max="2100"></label>
      <label class="fld"><span>Superficie (m²)</span><input class="in" type="number" inputmode="numeric" data-f="m2" value="${d.m2 ?? ''}" min="0"></label>
    </div>
  </section>

  <section class="card">
    <h2 class="card-t">Fotos <span class="num mut">${d.fotos.length}</span></h2>
    <p class="hint">La estrella marca la foto destacada: es la portada del proyecto y la de su tarjeta en el listado. Arrastre para ordenar.</p>
    ${photos('fotos')}
  </section>

  <section class="card">
    <h2 class="card-t">Cómo se muestran las fotos</h2>
    <div class="modes" role="radiogroup" aria-label="Presentación de las fotos">
      ${GAL.map((g) => `
        <label class="mode ${d.galeria === g.id ? 'is-on' : ''}">
          <input type="radio" name="galeria" value="${g.id}" ${d.galeria === g.id ? 'checked' : ''} data-gal class="sr-only">
          <span class="mode-fig mode-${g.id}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
          <span class="mode-t">${g.t}</span><span class="hint">${g.d}</span>
        </label>`).join('')}
    </div>
  </section>

  <section class="card">
    <h2 class="card-t">Textos</h2>
    <p class="hint">El primer párrafo se destaca como entradilla. Los demás se leen debajo.</p>
    <div class="paras">
      ${d.texto.map((t, i) => `
        <div class="para">
          <span class="para-n num">${two(i + 1)}</span>
          <textarea class="in" rows="${Math.min(8, Math.max(2, Math.ceil(t.length / 90)))}" data-para="${i}" aria-label="Párrafo ${i + 1}">${esc(t)}</textarea>
          <span class="para-act">
            <button type="button" class="ib" data-pmove="-1" data-i="${i}" aria-label="Subir párrafo" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="ib" data-pmove="1" data-i="${i}" aria-label="Bajar párrafo" ${i === d.texto.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="ib ib-del" data-pdel="${i}" aria-label="Quitar párrafo">×</button>
          </span>
        </div>`).join('')}
    </div>
    <button type="button" class="b b-ghost" data-padd><span class="plus" aria-hidden="true">+</span> Añadir párrafo</button>
  </section>

  <section class="card">
    <h2 class="card-t">Planos <span class="num mut">${d.planos.length}</span></h2>
    <p class="hint">Opcional. Se muestran sobre fondo blanco, sin recortar.</p>
    ${photos('planos')}
  </section>

  <section class="card">
    <h2 class="card-t">Qué se muestra en la página</h2>
    <div class="sws">${BLOQUES.map((b) => sw(`data-show="${b.k}"`, d.mostrar[b.k], b.t, b.d)).join('')}</div>
  </section>

  <section class="card">
    <h2 class="card-t">Publicación</h2>
    <div class="sws">${sw('data-f-pub', d.publicado, 'Publicado en la web', 'Si está apagado, el proyecto queda como borrador y no aparece')}</div>
    ${d.nuevo ? '' : '<button type="button" class="b b-danger-ghost" data-del>Eliminar proyecto</button>'}
  </section>`;
}
function preview() {
  const d = draft!;
  const cover = d.fotos[d.portada] ?? d.fotos[0];
  const rest = d.fotos.filter((f) => f !== cover);
  const M = d.mostrar;
  const textos = d.texto.filter((t) => t.trim());
  const img = (f: Foto) => `<img src="${f.src}" alt="" class="${isL(f) ? 'l' : 'p'}" loading="lazy">`;
  return `
    <div class="pv-hero">${cover ? img(cover) : '<span>Sin fotos todavía</span>'}</div>
    <div class="pv-head">
      <p class="pv-name">${esc(d.nombre || 'Nombre del proyecto')}</p>
      ${M.ficha ? `<dl class="pv-ficha"><div><dt>Lugar</dt><dd>${esc(d.lugar || '—')}</dd></div><div><dt>Año</dt><dd>${d.anio ?? '—'}</dd></div><div><dt>Superficie</dt><dd>${d.m2 ? `${d.m2} m²` : '—'}</dd></div></dl>` : ''}
    </div>
    ${M.texto && textos.length ? `<div class="pv-text">${textos.slice(0, 2).map((t, i) => `<p class="${i ? '' : 'pv-lead'}">${esc(t.length > 200 ? `${t.slice(0, 200)}…` : t)}</p>`).join('')}</div>` : ''}
    ${M.galeria && rest.length ? `<div class="pv-g pv-${d.galeria}">${rest.map(img).join('')}</div>` : ''}
    ${M.planos && d.planos.length ? `<p class="pv-lbl">Planos</p><div class="pv-g pv-mosaico pv-planos">${d.planos.map(img).join('')}</div>` : ''}
    ${M.siguiente ? '<p class="pv-next"><span>Siguiente proyecto</span><span>→</span></p>' : ''}`;
}
function editor() {
  const d = draft!;
  return `
  <header class="top top-ed">
    <div class="top-l">
      <a class="back" href="#/proyectos"><span class="arr-l">←</span> Proyectos</a>
      <h1 class="ttl" data-ttl>${esc(d.nombre || 'Nuevo proyecto')}</h1>
    </div>
    <div class="top-act">
      <span class="state" data-state>${d.nuevo ? 'Sin guardar' : 'Todo guardado'}</span>
      ${d.nuevo ? '' : `<a class="b b-ghost" href="/proyectos/${d.slug}/" target="_blank" rel="noopener">Ver en la web <span class="arr">↗</span></a>`}
      <button type="button" class="b b-pri" data-save><span data-save-t>${d.nuevo ? 'Crear proyecto' : 'Guardar'}</span></button>
    </div>
  </header>
  <div class="ed ${showPrev ? 'show-prev' : ''}">
    <div class="ed-form" data-form>${form()}</div>
    <aside class="ed-prev" aria-label="Vista previa">
      <div class="prev-head"><span>Vista previa</span><span class="hint" data-prev-mode>${GAL.find((g) => g.id === d.galeria)!.t}</span></div>
      <div class="prev" data-prev>${preview()}</div>
    </aside>
  </div>
  <button type="button" class="prev-toggle" data-prevtoggle aria-pressed="${showPrev}">${showPrev ? 'Volver a editar' : 'Ver vista previa'}</button>`;
}
function refreshForm(focusSel?: string) {
  $('[data-form]')!.innerHTML = form();
  refreshPrev();
  if (focusSel) $(focusSel)?.focus();
}
function refreshPrev() {
  $('[data-prev]')!.innerHTML = preview();
  $('[data-prev-mode]')!.textContent = GAL.find((g) => g.id === draft!.galeria)!.t;
}

async function subir(kind: 'fotos' | 'planos', files: FileList | File[]) {
  const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (!imgs.length) return;
  const drop = $(`[data-drop="${kind}"]`);
  drop?.classList.add('is-busy');
  if (drop) drop.querySelector('.drop-t')!.textContent = `Subiendo ${imgs.length} ${imgs.length === 1 ? 'imagen' : 'imágenes'}…`;
  let fallos = 0;
  for (const f of imgs) {
    try { draft![kind].push(await store.upload(f)); } catch { fallos++; }
  }
  markDirty();
  refreshForm();
  toast(fallos ? `${fallos} ${fallos === 1 ? 'imagen no se pudo' : 'imágenes no se pudieron'} leer. Pruebe con JPG o PNG.` : `${imgs.length - fallos} ${imgs.length === 1 ? 'imagen añadida' : 'imágenes añadidas'}`);
}

async function guardar() {
  const d = draft!;
  if (!d.nombre.trim()) {
    toast('Escriba el nombre del proyecto para guardarlo.');
    $('[data-f="nombre"]')?.focus();
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
  await persist();
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

  main.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.f) {
      const k = t.dataset.f as 'nombre' | 'titulo' | 'categoria' | 'lugar' | 'anio' | 'm2';
      (d as any)[k] = k === 'anio' || k === 'm2' ? (t.value ? Number(t.value) : null) : t.value;
      if (k === 'nombre') $('[data-ttl]')!.textContent = t.value || 'Nuevo proyecto';
    } else if (t.dataset.para) {
      d.texto[Number(t.dataset.para)] = t.value;
    } else return;
    markDirty();
    refreshPrev();
  });
  main.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.matches('[data-gal]')) {
      d.galeria = t.value as Galeria;
      main.querySelectorAll('.mode').forEach((m) => m.classList.toggle('is-on', m.contains(t)));
    } else if (t.dataset.show) d.mostrar[t.dataset.show as keyof Mostrar] = t.checked;
    else if (t.matches('[data-f-pub]')) d.publicado = t.checked;
    else if (t.dataset.up) { subir(t.dataset.up as 'fotos' | 'planos', t.files!); return; }
    else if (t.dataset.f === 'categoria') d.categoria = t.value;
    else return;
    markDirty();
    refreshPrev();
  });
  main.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b) return;
    const kind = b.dataset.kind as 'fotos' | 'planos';
    if (b.matches('[data-save]')) return guardar();
    if (b.matches('[data-prevtoggle]')) {
      showPrev = !showPrev;
      $('.ed')!.classList.toggle('show-prev', showPrev);
      b.textContent = showPrev ? 'Volver a editar' : 'Ver vista previa';
      b.setAttribute('aria-pressed', String(showPrev));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (b.dataset.cover) {
      d.portada = Number(b.dataset.cover);
      main.querySelectorAll('[data-phs="fotos"] .ph').forEach((f, i) => {
        f.classList.toggle('is-cover', i === d.portada);
        f.querySelector('.ph-star')?.setAttribute('aria-pressed', String(i === d.portada));
      });
      b.classList.add('is-pop');
    } else if (b.dataset.phdel) {
      reorderFotos(kind, () => d[kind].splice(Number(b.dataset.phdel), 1));
      refreshForm();
    } else if (b.dataset.phmove) {
      reorderFotos(kind, () => moveIn(d[kind], Number(b.dataset.i), Number(b.dataset.phmove)));
      refreshForm(`[data-phs="${kind}"] [data-phmove="${b.dataset.phmove}"][data-i="${Number(b.dataset.i) + Number(b.dataset.phmove)}"]`);
    } else if (b.matches('[data-padd]')) {
      d.texto.push('');
      refreshForm(`[data-para="${d.texto.length - 1}"]`);
    } else if (b.dataset.pdel) {
      d.texto.splice(Number(b.dataset.pdel), 1);
      if (!d.texto.length) d.texto.push('');
      refreshForm();
    } else if (b.dataset.pmove) {
      moveIn(d.texto, Number(b.dataset.i), Number(b.dataset.pmove));
      refreshForm(`[data-pmove="${b.dataset.pmove}"][data-i="${Number(b.dataset.i) + Number(b.dataset.pmove)}"]`);
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
    refreshPrev();
  });

  // Fotos: arrastrar archivos para subir y arrastrar miniaturas para ordenar
  main.addEventListener('dragover', (e) => {
    const z = (e.target as HTMLElement).closest<HTMLElement>('[data-drop]');
    if (z && e.dataTransfer?.types.includes('Files')) { e.preventDefault(); z.classList.add('is-over'); }
  });
  main.addEventListener('dragleave', (e) => (e.target as HTMLElement).closest('[data-drop]')?.classList.remove('is-over'));
  main.addEventListener('drop', (e) => {
    const z = (e.target as HTMLElement).closest<HTMLElement>('[data-drop]');
    if (!z || !e.dataTransfer?.files.length) return;
    e.preventDefault();
    z.classList.remove('is-over');
    subir(z.dataset.drop as 'fotos' | 'planos', e.dataTransfer.files);
  });
  const sortPhotos = () => (['fotos', 'planos'] as const).forEach((kind) => {
    const box = $(`[data-phs="${kind}"]`);
    if (box && !box.dataset.bound) {
      box.dataset.bound = '1';
      sortable(box, '.ph', (ids) => {
        reorderFotos(kind, () => { d[kind] = ids.map((id) => d[kind].find((f) => f.id === id)!); });
        markDirty();
        refreshForm();
        sortPhotos();
      }, 'id');
    }
  });
  sortPhotos();
  // tras cada refreshForm las cajas son nuevas: se vuelven a enlazar
  new MutationObserver(sortPhotos).observe($('[data-form]')!, { childList: true });

  document.onkeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && draft) { e.preventDefault(); guardar(); }
  };
}

/* Portada de la web */
function slotCard(kind: 'hero' | 'home', i: number) {
  const s = port![kind][i];
  const p = s ? bySlug(s.slug) : undefined;
  const o = kind === 'hero' ? 'L' : seed.slots[i].o;
  const label = kind === 'hero' ? 'Foto horizontal a pantalla completa' : seed.slots[i].label;
  const usados = new Set(port![kind].filter((x, k) => x && k !== i).map((x) => x!.slug));
  return `
  <div class="slot ${p ? '' : 'is-empty'}">
    <div class="slot-h"><span class="slot-n num">${two(i + 1)}</span><span class="hint">${label}</span></div>
    <div class="slot-cover ${o === 'P' ? 'is-p' : ''}">${p && s ? `<img src="${p.fotos.find((f) => f.id === s.foto)?.src ?? p.fotos[0]?.src}" alt="">` : '<span>Vacío</span>'}</div>
    <select class="in" data-slot="${kind}:${i}" aria-label="Proyecto en la posición ${i + 1}">
      <option value="">Sin proyecto</option>
      ${E.proyectos.filter((x) => x.publicado).map((x) => `<option value="${x.slug}" ${x.slug === s?.slug ? 'selected' : ''} ${usados.has(x.slug) ? 'disabled' : ''}>${esc(x.nombre)}</option>`).join('')}
    </select>
    ${p && s ? `<div class="slot-ph" role="radiogroup" aria-label="Foto para esta posición">${p.fotos.map((f) => `<button type="button" class="sp ${f.id === s.foto ? 'is-on' : ''} ${(o === 'L') === isL(f) ? '' : 'is-dim'}" data-slotfoto="${kind}:${i}:${f.id}" role="radio" aria-checked="${f.id === s.foto}" aria-label="${isL(f) ? 'Horizontal' : 'Vertical'}"><img src="${f.src}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
  </div>`;
}
function portadaView() {
  const draw = () => `
  <header class="top">
    <div><h1 class="ttl">Portada de la web</h1><p class="sub">Elija qué proyectos se destacan en la home, en qué posición y con qué foto.</p></div>
    <div class="top-act"><span class="state" data-state>Todo guardado</span><button type="button" class="b b-pri" data-psave><span data-save-t>Guardar portada</span></button></div>
  </header>
  <section class="card">
    <h2 class="card-t">Carrusel principal</h2>
    <p class="hint">Las fotos que pasan a pantalla completa al abrir la web. Mejor en horizontal: las verticales aparecen atenuadas.</p>
    <div class="slots slots-3">${[0, 1, 2].map((i) => slotCard('hero', i)).join('')}</div>
  </section>
  <section class="card">
    <h2 class="card-t">Obras seleccionadas</h2>
    <p class="hint">Las cinco obras bajo el carrusel. Cada posición tiene una forma fija en el diseño.</p>
    <div class="slots slots-5">${[0, 1, 2, 3, 4].map((i) => slotCard('home', i)).join('')}</div>
  </section>`;
  queueMicrotask(() => {
    const main = $('#main')!;
    const redraw = () => { main.innerHTML = draw(); markDirty(true); };
    main.addEventListener('change', (e) => {
      const t = e.target as HTMLSelectElement;
      if (!t.dataset.slot) return;
      const [kind, i] = t.dataset.slot.split(':') as ['hero' | 'home', string];
      const p = bySlug(t.value);
      const o = kind === 'hero' ? 'L' : seed.slots[Number(i)].o;
      port![kind][Number(i)] = p ? { slug: p.slug, foto: (p.fotos.find((f) => (o === 'L') === isL(f)) ?? p.fotos[0])?.id ?? '' } : null;
      redraw();
      $(`[data-slot="${t.dataset.slot}"]`)?.focus();
    });
    main.addEventListener('click', async (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!b) return;
      if (b.dataset.slotfoto) {
        const [kind, i, id] = b.dataset.slotfoto.split(':');
        port![kind as 'hero' | 'home'][Number(i)]!.foto = id;
        redraw();
        $(`[data-slotfoto="${b.dataset.slotfoto}"]`)?.focus();
      } else if (b.matches('[data-psave]')) {
        E.portada = structuredClone(port!);
        await persist();
        markDirty(false);
        toast('Portada guardada');
      }
    });
  });
  return draw();
}

/* ── Acciones globales ────────────────────────────── */
app.addEventListener('click', async (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-logout], [data-reset]');
  if (!b) return;
  if (b.matches('[data-logout]')) {
    if (dirty && !(await ask('Hay cambios sin guardar. ¿Cerrar sesión igualmente?', 'Cerrar sesión', true))) return;
    dirty = false;
    try { sessionStorage.removeItem('nan-admin'); } catch {}
    login();
  } else if (await ask('Se borrarán todos los cambios hechos en esta demo y se volverá a los datos reales del sitio.', 'Restablecer', true)) {
    await store.reset();
    E = await store.load();
    dirty = false;
    enter();
    toast('Demo restablecida');
  }
});

store.load().then((e) => {
  E = e;
  if (!location.hash) history.replaceState(null, '', '#/proyectos');
  lastHash = location.hash;
  enter();
});
