import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Entradas publicadas, de la más reciente a la más antigua (los borradores solo se ven en desarrollo) */
export async function posts(): Promise<Post[]> {
  const all = await getCollection('blog', (p: Post) => import.meta.env.DEV || !p.data.borrador);
  return all.sort((a: Post, b: Post) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}

// En UTC: una fecha sin hora es medianoche UTC y en otra zona horaria saldría un día antes
const larga = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fecha = (d: Date) => larga.format(d);
export const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Palabras del cuerpo sin la sintaxis de MDX (componentes, enlaces, marcas) */
export const palabras = (body = '') =>
  body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`[\]|-]/g, ' ')
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w)).length;

/** Minutos de lectura a ~200 palabras por minuto */
export const lectura = (body?: string) => Math.max(1, Math.round(palabras(body) / 200));

/** Tipo de proyecto que se preselecciona en el cotizador desde cada categoría */
export const tipoCotizador: Partial<Record<Post['data']['categoria'], string>> = {
  Comercio: 'Comercio',
  Salud: 'Clínica o salud',
  Hostelería: 'Hostelería',
  Vivienda: 'Vivienda',
  Oficinas: 'Oficina',
};
