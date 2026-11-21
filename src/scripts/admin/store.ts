/**
 * Capa de datos del panel de administrador.
 *
 * Hoy: modo demo. Los cambios se guardan en este navegador (localStorage para los datos,
 * IndexedDB para las fotos subidas). Parte de los 73 proyectos reales del sitio.
 *
 * Para producción: implementar la misma interfaz `Store` con supabase-js
 * (tablas y políticas en supabase/schema.sql, fotos en el bucket `proyectos`)
 * y disparar el deploy hook de Vercel al guardar para que la web se regenere.
 */

export type Galeria = 'mosaico' | 'galeria' | 'sueltas';
export interface Foto { id: string; src: string; w: number; h: number }
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
}
export interface Slot { slug: string; foto: string }
/** Carrusel (3) y obras seleccionadas (5) de la home */
export interface Portada { hero: (Slot | null)[]; home: (Slot | null)[] }
export interface Estado { proyectos: P[]; portada: Portada }

export interface Store {
  readonly demo: boolean;
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
