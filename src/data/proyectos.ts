import type { ImageMetadata } from 'astro';
import raw from './proyectos.json';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/proyectos/*/*.jpg', { eager: true });

function fotos(slug: string): ImageMetadata[] {
  return Object.entries(files)
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
}

export interface Proyecto extends Raw {
  resumen: string;
  fotos: ImageMetadata[];
  portada: ImageMetadata;
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
  .map((p) => {
    const f = fotos(p.slug);
    return {
      ...p,
      nombre: capital(p.nombre.replace(/\s+/g, ' ').trim()),
      superficie: p.m2 ? `${new Intl.NumberFormat('es-ES').format(p.m2)} m²` : null,
      resumen: p.texto[0] ? primeraFrase(p.texto[0]) : `${p.categoria === 'Otros' ? 'Proyecto' : p.categoria} en ${ciudad(p)}${p.anio ? `, ${p.anio}` : ''}.`,
      fotos: f,
      portada: f.find(isL) ?? f[0],
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
const pick = (slug: string, n = 0) => {
  const p = bySlug(slug);
  const h = p.fotos.filter(isL);
  return { proyecto: p, imagen: h[n] ?? h[0] ?? p.portada };
};
const vertical = (slug: string) => {
  const p = bySlug(slug);
  return { proyecto: p, imagen: p.fotos.find((f) => !isL(f)) ?? p.portada };
};

/** Hero de la home: 3 obras destacadas, todas en horizontal */
export const heroSlides = [pick('marna-restaurante', 1), pick('pazo-da-buzaca', 1), pick('vivienda-parche', 1)];

/** Obras seleccionadas: posición en la retícula según el diseño */
export const obrasHome = [
  { ...pick('marna-restaurante'), col: '1 / span 7', ar: '4 / 3', mt: '0' },
  { ...vertical('clinica-mercedes-fayos-fons'), col: '9 / span 4', ar: '3 / 4', mt: '220px' },
  { ...vertical('carlos-pons'), col: '2 / span 4', ar: '4 / 5', mt: '0' },
  { ...pick('vivienda-parche'), col: '7 / span 6', ar: '3 / 2', mt: '260px' },
  { ...pick('pazo-da-buzaca'), col: '1 / -1', ar: '21 / 9', mt: '0' },
];

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
