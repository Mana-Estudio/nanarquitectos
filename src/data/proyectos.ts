import type { ImageMetadata } from 'astro';
import raw from './proyectos.json';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/proyectos/*/*.jpg', { eager: true });
// Planos opcionales: src/assets/proyectos/<slug>/planos/*.{jpg,png,webp}
const planosFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/proyectos/*/planos/*.{jpg,jpeg,png,webp}', { eager: true });

function fotos(slug: string, src = files): ImageMetadata[] {
  return Object.entries(src)
    .filter(([path]) => path.includes(`/proyectos/${slug}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, mod]) => mod.default);
}

export type Categoria = 'Clínica' | 'Hostelería' | 'Comercio' | 'Oficina' | 'Vivienda' | 'Otros';

interface Raw {
  slug: string;
  nombre: string;
  titulo: string;
  categoria: Categoria;
  destacado: boolean;
  lugar: string;
  anio: number | null;
  superficie: string | null;
  m2: number | null;
  texto: string[];
  /* ── Campos que gestionará el panel de administrador (todos opcionales) ── */
  /** false = borrador, no se publica */
  publicado?: boolean;
  /** Orden en el listado (menor primero). Sin valor: orden de carga */
  orden?: number;
  /** Índice de la foto destacada dentro de `fotos` */
  portadaFoto?: number;
  /** Cómo se muestran las fotos en la página del proyecto */
  galeria?: Galeria;
  /** Qué bloques se muestran en la página del proyecto */
  mostrar?: Partial<Visibilidad>;
  /** Posición en el carrusel de la home (1–3) y foto elegida (índice en `fotos`) */
  hero?: number;
  heroFoto?: number;
  /** Posición en «Obras seleccionadas» de la home (1–5) y foto elegida */
  home?: number;
  homeFoto?: number;
}

export type Galeria = 'mosaico' | 'galeria' | 'sueltas';
export const galerias: { id: Galeria; label: string }[] = [
  { id: 'mosaico', label: 'Mosaico' },
  { id: 'galeria', label: 'Galería deslizable' },
  { id: 'sueltas', label: 'Imágenes sueltas' },
];
export interface Visibilidad { ficha: boolean; texto: boolean; galeria: boolean; planos: boolean; siguiente: boolean }
const visibleDefault: Visibilidad = { ficha: true, texto: true, galeria: true, planos: true, siguiente: true };

export interface Proyecto extends Omit<Raw, 'mostrar' | 'galeria'> {
  resumen: string;
  fotos: ImageMetadata[];
  planos: ImageMetadata[];
  portada: ImageMetadata;
  galeria: Galeria;
  mostrar: Visibilidad;
}

const capital = (s: string) => (s === s.toLowerCase() ? s.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase()) : s);
const isL = (f: ImageMetadata) => f.width > f.height;
const primeraFrase = (t: string) => (t.match(/^.{40,220}?[.!?](\s|$)/)?.[0] ?? t.slice(0, 200)).trim();

export function ciudad(p: Pick<Proyecto, 'lugar'>) {
  const parts = p.lugar.split(/[,.()\/]|\s[–-]\s|-(?=Galicia|España|Spain)/).map((s) => s.trim()).filter(Boolean);
  const known = parts.reverse().find((s) => !/\d/.test(s) && s.length > 2 && !/^(españa|spain|galicia)$/i.test(s) && !/^(calle|c\/|av|avda|rúa|r[uú]a|plaza|pza|praza|travesía)/i.test(s));
  return (known ?? 'Pontevedra').replace(/^\w/, (c) => c.toUpperCase());
}

export const proyectos: Proyecto[] = (raw as Raw[])
  .filter((p) => p.publicado !== false)
  .map((p, i) => ({ p, i }))
  .sort((a, b) => (a.p.orden ?? 1e6 + a.i) - (b.p.orden ?? 1e6 + b.i))
  .map(({ p }) => {
    const f = fotos(p.slug);
    return {
      ...p,
      galeria: p.galeria ?? 'mosaico',
      mostrar: { ...visibleDefault, ...p.mostrar },
      planos: fotos(p.slug, planosFiles),
      nombre: capital(p.nombre.replace(/\s+/g, ' ').trim()),
      superficie: p.m2 ? `${new Intl.NumberFormat('es-ES').format(p.m2)} m²` : null,
      // Sin texto en la web original: no se inventa un resumen (queda vacío y la página omite el bloque)
      resumen: p.texto[0] ? primeraFrase(p.texto[0]) : '',
      fotos: f,
      portada: (p.portadaFoto != null ? f[p.portadaFoto] : undefined) ?? f.find(isL) ?? f[0],
    };
  })
  .filter((p) => p.fotos.length > 0);

export const filtros: { label: string; cat: Categoria | null }[] = [
  { label: 'Todos', cat: null },
  { label: 'Clínicas', cat: 'Clínica' },
  { label: 'Hostelería', cat: 'Hostelería' },
  { label: 'Comercios', cat: 'Comercio' },
  { label: 'Oficinas', cat: 'Oficina' },
  { label: 'Viviendas', cat: 'Vivienda' },
];

export const portada = (p: Proyecto) => p.portada;
export const tipo = (p: Proyecto) => (p.categoria === 'Otros' ? 'Proyecto' : p.categoria);

const bySlug = (slug: string) => proyectos.find((x) => x.slug === slug)!;
/** Foto n de un proyecto, opcionalmente filtrando por orientación (para páginas de Estudio y Servicios) */
export const foto = (slug: string, n = 0, o?: 'L' | 'P') => {
  const p = bySlug(slug);
  const list = o ? p.fotos.filter((f) => (o === 'L') === isL(f)) : p.fotos;
  return list[n] ?? list[0] ?? p.portada;
};
/** Todos los proyectos tal como están cargados (incluye borradores): los usa el panel */
export const cargados = raw as Raw[];
export const fotosDe = (slug: string) => fotos(slug);
export const planosDe = (slug: string) => fotos(slug, planosFiles);

/** «Obras seleccionadas»: 5 posiciones fijas del diseño. El panel decide qué proyecto y qué foto va en cada una */
export const homeSlots = [
  { col: '1 / span 7', ar: '4 / 3', mt: '0', o: 'L', label: 'Horizontal grande' },
  { col: '9 / span 4', ar: '3 / 4', mt: '220px', o: 'P', label: 'Vertical alta' },
  { col: '2 / span 4', ar: '4 / 5', mt: '0', o: 'P', label: 'Vertical' },
  { col: '7 / span 6', ar: '3 / 2', mt: '260px', o: 'L', label: 'Horizontal' },
  { col: '1 / -1', ar: '21 / 9', mt: '0', o: 'L', label: 'Panorámica a todo el ancho' },
] as const;

// Sin foto elegida: la n-ésima de la orientación que pide el hueco
const conFoto = (p: Proyecto, idx: number | undefined, o: 'L' | 'P', n = 0) => ({
  proyecto: p,
  imagen: (idx != null ? p.fotos[idx] : undefined) ?? foto(p.slug, n, o),
});

/** Carrusel de la home: hasta 3 obras, en horizontal */
export const heroSlides = proyectos
  .filter((p) => p.hero)
  .sort((a, b) => a.hero! - b.hero!)
  .slice(0, 3)
  .map((p) => conFoto(p, p.heroFoto, 'L', 1));

/** Obras seleccionadas: posición en la retícula según el diseño */
export const obrasHome = homeSlots.flatMap((s, i) => {
  const p = proyectos.find((x) => x.home === i + 1);
  return p ? [{ ...conFoto(p, p.homeFoto, s.o), col: s.col, ar: s.ar, mt: s.mt }] : [];
});

/** Prensa (de nanarquitectos.com/publicaciones) */
export const publicaciones = [
  ['Restaurante Nantes', 'Proyecto Contract · Arqa'],
  ['Unitec', 'Revista suiza Idea · Proyecto Contract'],
  ['Sana Sana Pilates', 'ICANDELA Nº 26'],
  ['Sal de Allo', 'Proyecto Contract'],
  ['Oficina Peregrina', 'On Diseño Nº 374'],
  ['La Torta, Maisquepan, A Seca, Inshopnia', 'Small Cafe & Shop, Archiworld'],
  ['La Piadina', 'Proyecto Contract · Architizer'],
  ['Iconweb', 'MD Office'],
  ['Dorsia', 'Proyecto Contract'],
  ['Clínica Dental Pablo Sieiro', 'IW · Interiores Minimalistas'],
  ['Peluquería Sonia Portela', 'Plataforma Arquitectura · Interiores Minimalistas'],
  ['Vivienda Villagarcía', 'Arqa'],
  ['Inshopnia', 'Arqa · Architizer'],
] as const;
