/**
 * Capa de datos del panel de administrador.
 *
 * - localStore: modo demo. Guarda en este navegador (localStorage + IndexedDB para las fotos).
 * - supabaseStore: producción. Datos en las tablas `proyectos` y `ajustes`, fotos nuevas en el
 *   bucket `proyectos` (supabase/schema.sql). «Publicar» llama a la función `publicar`, que
 *   dispara el deploy hook de Vercel para regenerar la web con los datos nuevos.
 * Se usa Supabase si la compilación tiene PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_PUBLISHABLE_KEY.
 */
import { createClient } from '@supabase/supabase-js';

export type Galeria = 'mosaico' | 'galeria' | 'sueltas';
export type TextoFormato = 'editorial' | 'columnas' | 'cita';
export interface Diseno { texto: TextoFormato }
/** `repo`: foto que vive en el repositorio · `path`: foto subida al bucket */
export interface Foto { id: string; src: string; w: number; h: number; repo?: string; path?: string }
export interface Mostrar { ficha: boolean; texto: boolean; galeria: boolean; planos: boolean; siguiente: boolean }
export interface P {
  slug: string;
  nombre: string;
  titulo: string;
  categoria: string;
  lugar: string;
  anio: number | null;
  m2: number | null;
  texto: string[];
  publicado: boolean;
  fotos: Foto[];
  planos: Foto[];
  /** índice de la foto destacada en `fotos` */
  portada: number;
  galeria: Galeria;
  mostrar: Mostrar;
  diseno: Diseno;
}
export interface Slot { slug: string; foto: string }
/** Carrusel (3) y obras seleccionadas (5) de la home */
export interface Portada { hero: (Slot | null)[]; home: (Slot | null)[] }
export interface Estado { proyectos: P[]; portada: Portada }

export interface Store {
  readonly demo: boolean;
  auth?: {
    session(): Promise<boolean>;
    /** Devuelve el mensaje de error, o null si entró */
    signIn(email: string, password: string): Promise<string | null>;
    signOut(): Promise<void>;
  };
  /** Regenera la web pública con los datos guardados */
  publish?(): Promise<void>;
  load(): Promise<Estado>;
  save(e: Estado): Promise<void>;
  upload(file: File): Promise<Foto>;
  reset(): Promise<void>;
}

const KEY = 'nan-admin-demo-v1';
const DB = 'nan-admin';
const OS = 'fotos';

function idb() {
  return new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(OS);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await idb();
  return new Promise<T>((res, rej) => {
    const q = fn(db.transaction(OS, mode).objectStore(OS));
    q.onsuccess = () => res(q.result as T);
    q.onerror = () => rej(q.error);
  });
}

/** Reduce la foto a 2000 px como máximo antes de guardarla (en producción lo haría el servidor) */
async function reducir(file: File) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error('No se pudo leer la imagen'))), 'image/jpeg', 0.85));
  return { blob, w: c.width, h: c.height };
}

export function localStore(seed: Estado): Store {
  return {
    demo: true,
    async load() {
      let e: Estado = structuredClone(seed);
      try {
        const saved = localStorage.getItem(KEY);
        if (saved) e = JSON.parse(saved);
      } catch {}
      // Las fotos subidas viven en IndexedDB: se vuelven a enlazar en cada sesión
      const subidas = e.proyectos.flatMap((p) => [...p.fotos, ...p.planos]).filter((f) => f.id.startsWith('u-'));
      await Promise.all(subidas.map(async (f) => {
        try {
          const b = await tx<Blob | undefined>('readonly', (s) => s.get(f.id));
          if (b) f.src = URL.createObjectURL(b);
        } catch {}
      }));
      return e;
    },
    async save(e) {
      localStorage.setItem(KEY, JSON.stringify(e));
    },
    async upload(file) {
      const { blob, w, h } = await reducir(file);
      const id = `u-${crypto.randomUUID()}`;
      await tx('readwrite', (s) => s.put(blob, id));
      return { id, src: URL.createObjectURL(blob), w, h };
    },
    async reset() {
      localStorage.removeItem(KEY);
      try { await tx('readwrite', (s) => s.clear()); } catch {}
    },
  };
}

/* ── Supabase ─────────────────────────────────────── */
type Fila = Record<string, any>;

export function supabaseStore(seed: Estado, url: string, key: string, orient: ('L' | 'P')[]): Store {
  const sb = createClient(url, key);
  const BUCKET = 'proyectos';
  // Fotos del repositorio: la miniatura y las medidas salen de la compilación
  const repo = new Map(seed.proyectos.flatMap((p) => [...p.fotos, ...p.planos]).map((f) => [f.id, f]));
  const pub = (path: string) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const toFoto = (x: Fila): Foto | undefined => (x.path ? { id: x.id, src: pub(x.path), w: x.w, h: x.h, path: x.path } : repo.get(x.id));
  const fromFoto = (f: Foto) => (f.path ? { id: f.id, path: f.path, w: f.w, h: f.h } : { id: f.id, repo: f.repo });
  const row = (p: P, i: number) => ({
    slug: p.slug, nombre: p.nombre, titulo: p.titulo, categoria: p.categoria, lugar: p.lugar, anio: p.anio, m2: p.m2,
    texto: p.texto, publicado: p.publicado, orden: i, galeria: p.galeria, mostrar: p.mostrar, diseno: p.diseno,
    fotos: p.fotos.map(fromFoto), planos: p.planos.map(fromFoto), portada: p.fotos[p.portada]?.id ?? null,
  });
  // Lo último guardado, para enviar solo las filas que cambiaron
  let last = new Map<string, string>();
  let lastPortada = '';
  const check = ({ error }: { error: { message: string } | null }) => { if (error) throw new Error(error.message); };

  return {
    demo: false,
    auth: {
      async session() { return !!(await sb.auth.getSession()).data.session; },
      async signIn(email, password) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (!error) return null;
        return /invalid/i.test(error.message) ? 'Email o contraseña incorrectos.' : error.message;
      },
      async signOut() { await sb.auth.signOut(); },
    },
    async load() {
      const [r, a] = await Promise.all([
        sb.from('proyectos').select('*').order('orden'),
        sb.from('ajustes').select('valor').eq('clave', 'portada').maybeSingle(),
      ]);
      check(r);
      const proyectos: P[] = (r.data as Fila[]).map((x) => {
        const fotos = (x.fotos as Fila[]).map(toFoto).filter(Boolean) as Foto[];
        const k = fotos.findIndex((f) => f.id === x.portada);
        return {
          slug: x.slug, nombre: x.nombre, titulo: x.titulo, categoria: x.categoria, lugar: x.lugar, anio: x.anio, m2: x.m2,
          texto: x.texto, publicado: x.publicado, galeria: x.galeria, mostrar: x.mostrar, fotos,
          diseno: { texto: 'editorial', ...x.diseno },
          planos: (x.planos as Fila[]).map(toFoto).filter(Boolean) as Foto[],
          portada: k >= 0 ? k : Math.max(0, fotos.findIndex((f) => f.w > f.h)),
        };
      });
      // Posición sin foto elegida (null): la que usaría la web según la orientación del hueco
      const auto = (s: Fila | null, o: 'L' | 'P', n = 0) => {
        const p = s && proyectos.find((x) => x.slug === s.slug);
        if (!p) return null;
        const m = p.fotos.filter((f) => (o === 'L') === f.w > f.h);
        return { slug: p.slug, foto: s!.foto ?? (m[n] ?? m[0] ?? p.fotos[0])?.id ?? '' };
      };
      const v = (a.data?.valor ?? {}) as Fila;
      const portada: Portada = {
        hero: [0, 1, 2].map((i) => auto(v.hero?.[i] ?? null, 'L', 1)),
        home: orient.map((o, i) => auto(v.home?.[i] ?? null, o)),
      };
      last = new Map(proyectos.map((p, i) => [p.slug, JSON.stringify(row(p, i))]));
      lastPortada = JSON.stringify(portada);
      return { proyectos, portada };
    },
    async save(e) {
      const rows = e.proyectos.map(row);
      const changed = rows.filter((x) => last.get(x.slug) !== JSON.stringify(x));
      const gone = [...last.keys()].filter((s) => !rows.some((x) => x.slug === s));
      const now = new Date().toISOString();
      if (changed.length) check(await sb.from('proyectos').upsert(changed.map((x) => ({ ...x, updated_at: now }))));
      if (gone.length) check(await sb.from('proyectos').delete().in('slug', gone));
      const pj = JSON.stringify(e.portada);
      if (pj !== lastPortada) check(await sb.from('ajustes').upsert({ clave: 'portada', valor: e.portada, updated_at: now }));
      // Fotos subidas que ya no usa ningún proyecto: se borran del bucket para no acumular archivos
      const paths = (list: string[]) => new Set(list.flatMap((j) => { const x = JSON.parse(j); return [...x.fotos, ...x.planos].map((f: Fila) => f.path).filter(Boolean); }));
      const antes = paths([...last.values()]);
      const ahora = paths(rows.map((x) => JSON.stringify(x)));
      const sobran = [...antes].filter((p) => !ahora.has(p));
      if (sobran.length) await sb.storage.from(BUCKET).remove(sobran);
      last = new Map(rows.map((x) => [x.slug, JSON.stringify(x)]));
      lastPortada = pj;
    },
    async upload(file) {
      const { blob, w, h } = await reducir(file);
      const id = `u-${crypto.randomUUID()}`;
      const path = `${id}.jpg`;
      check(await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' }));
      return { id, src: pub(path), w, h, path };
    },
    async reset() {},
    async publish() {
      const { error } = await sb.functions.invoke('publicar', { method: 'POST' });
      if (error) throw new Error(error.message);
    },
  };
}
