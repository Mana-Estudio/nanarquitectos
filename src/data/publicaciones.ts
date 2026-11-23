// Hemeroteca de nanarquitectos.com/publicaciones (2 páginas, leída el 23/11/2026).
// Limpieza respecto a la web actual: se corrigen erratas («Cínica», «Worls», «Desing»), se quitan
// las entradas duplicadas que apuntaban al mismo PDF y los parámetros de seguimiento (?fbclid) de los enlaces.

export type Formato = 'Revista' | 'Digital';

export interface Publicacion {
  obra: string;
  medio: string;
  formato: Formato;
  /** ISO. Las revistas impresas solo tienen año fiable (la web vieja las fechó todas el día que se subieron) */
  fecha: string;
  /** Titular del artículo, cuando el medio lo tituló */
  titular?: string;
  /** Artículo original en el medio (prensa digital) */
  url?: string;
  /** Ficha del proyecto en esta web */
  slug?: string;
}

const R = (obra: string, medio: string, anio: number, slug?: string): Publicacion => ({ obra, medio, formato: 'Revista', fecha: String(anio), slug });
const D = (fecha: string, obra: string, medio: string, url: string, slug?: string, titular?: string): Publicacion => ({ obra, medio, formato: 'Digital', fecha, url, slug, titular });

export const publicaciones: Publicacion[] = [
  // Revistas impresas
  R('Restaurante Nantes', 'Proyecto Contract', 2019, 'restaurante-nantes-en-madrid'),
  R('Unitec', 'Revista Idea (Suiza)', 2018, 'unitec'),
  R('Unitec', 'Proyecto Contract', 2018, 'unitec'),
  R('Sana Sana Pilates', 'iCandela nº 26', 2018, 'sana-sana-pilates'),
  R('Restaurante Sal de Allo', 'Proyecto Contract', 2018, 'restaurante-sal-de-allo'),
  R('Gabinete Jurídico Peregrina', 'On Diseño nº 374', 2018, 'gabinete-juridico-peregrina'),
  R('La Torta, Maisquepan, A Seca e Inshopnia', 'Small Cafe & Shop · Archiworld', 2018),
  R('Cafetería La Piadina', 'Proyecto Contract', 2018, 'reforma-cafeteria-la-piadina'),
  R('Oficina Iconweb', 'MD Office', 2018, 'oficina-iconweb'),
  R('Cafetería Dorsia', 'Proyecto Contract', 2018, 'cafeteria-dorsia'),
  R('NAN Arquitectos', 'DImagazine nº 270', 2018),
  R('Clínica Dental Pablo Sieiro', 'IW Magazine', 2018, 'clinica-dental-pablo-sieiro'),
  R('Concept Habitat Studio', 'Casa Viva', 2018, 'showroom-concept-habitat-studio'),
  R('Concept Habitat Studio', 'On Diseño nº 368', 2018, 'showroom-concept-habitat-studio'),
  R('NAN Arquitectos y NanContract', 'Entrevista en prensa', 2016),
  R('Estanco Calvario', 'Proyecto Contract', 2015, 'estanco-calvario'),
  R('NAN Arquitectos', 'Interior Worlds · Design & Detail', 2015),
  R('Panadería Maisquepan', 'Casa Viva', 2014, 'panaderia-maisquepan'),

  // Prensa digital
  D('2019-05-15', 'Restaurante Nantes', 'Arqa', 'https://arqa.com/arquitectura/restaurante-nantes.html', 'restaurante-nantes-en-madrid'),
  D('2018-12-07', 'Peluquería Sonia Portela', 'Plataforma Arquitectura', 'https://www.plataformaarquitectura.cl/cl/907119/peluqueria-sonia-portela-nan-arquitectos', 'peluqueria-sonia-portela'),
  D('2018-12-03', 'Peluquería Sonia Portela', 'Interiores Minimalistas', 'http://interioresminimalistas.com/2018/12/03/una-peluqueria-para-todos-los-publicos-nan-arquitectos/', 'peluqueria-sonia-portela', 'Una peluquería para todos los públicos'),
  D('2014-12-23', 'Clínica Dental Pablo Sieiro', 'ArchDaily', 'http://www.archdaily.com/566713/clinica-dental-dr-pablo-sieiro-nan-arquitectos/', 'clinica-dental-pablo-sieiro', 'Dental Clinic / NAN Arquitectos'),
  D('2014-11-05', 'Casa Villagarcía', 'Arqa', 'http://arqa.com/arquitectura/internacional/vivienda-villagarcia-en-galicia.html', 'casa-villagarcia', 'Vivienda Villagarcía, en Galicia'),
  D('2014-11-04', 'Clínica Dental Pablo Sieiro', 'Interiores Minimalistas', 'http://www.interioresminimalistas.com/2014/11/04/clinica-dental-por-nan-arquitectos/', 'clinica-dental-pablo-sieiro', 'Una moderna clínica dental ligada al pasado'),
  D('2014-11-04', 'Café Retail Inshopnia', 'Architizer', 'http://architizer.com/projects/cafe-retail-inshopnia/', 'cafe-retail-inshopnia'),
  D('2014-10-28', 'Café Retail Inshopnia', 'ArchDaily', 'http://www.archdaily.com/559016/inshopnia-nan-arquitectos/', 'cafe-retail-inshopnia', 'Inshopnia / Nan Arquitectos'),
  D('2014-10-27', 'Cafetería La Piadina', 'Architizer', 'http://architizer.com/projects/restaurant-bar-la-piadina-cambados/', 'reforma-cafeteria-la-piadina'),
  D('2014-10-15', 'Café Retail Inshopnia', 'Arqa', 'http://arqa.com/arquitectura/internacional/inshopnia.html', 'cafe-retail-inshopnia'),
  D('2014-10-14', 'Café Retail Inshopnia', 'Interiores Minimalistas', 'http://www.interioresminimalistas.com/2014/10/14/inshopnia/', 'cafe-retail-inshopnia', 'Un local donde comprar ropa y degustar un café'),
  D('2014-10-13', 'Café Retail Inshopnia', 'Diario Design', 'http://diariodesign.com/2014/11/inshopnia-imposible-conciliar-el-sueno-en-esta-casa-tienda-de-vigo/', 'cafe-retail-inshopnia', 'Imposible conciliar el sueño en esta casa-tienda de Vigo'),
  D('2014-10-02', 'Panadería Maisquepan', 'Diario Design', 'http://diariodesign.com/2014/10/maisquepan-en-galicia-panaderia-con-coraza-de-acero/', 'panaderia-maisquepan', 'Panadería con coraza de acero'),
  D('2014-09-15', 'Panadería Maisquepan', 'Architizer', 'http://architizer.com/projects/bakery-maisquepan/', 'panaderia-maisquepan'),
  D('2014-08-30', 'Reforma de apartamento en Poio', 'Architizer', 'http://architizer.com/projects/reforma-de-vivienda-1/'),
  D('2014-08-27', 'Bocatería A Seca', 'Architizer', 'http://architizer.com/projects/restaurant-bar-a-seca/', 'bocateria-a-seca'),
  D('2014-08-18', 'Cafetería La Piadina', 'Interiores Minimalistas', 'http://www.interioresminimalistas.com/2014/08/18/la-piadina-restaurante-y-heladeria-proyectada-por-nan-arquitectos/', 'reforma-cafeteria-la-piadina', 'La Piadiña, cafetería y heladería'),
  D('2014-08-15', 'Casa Villagarcía', 'Architizer', 'http://architizer.com/projects/vivienda-en-villagarcia/', 'casa-villagarcia'),
  D('2014-08-10', 'Vivienda en Rubianes', 'ArchDaily', 'http://www.archdaily.com/532417/renovacion-de-vivienda-en-rubianes-nan-arquitectos/', undefined, 'House in Rubianes Refurbishment'),
  D('2014-07-24', 'Bocatería A Seca', 'Interiores Minimalistas', 'http://www.interioresminimalistas.com/2014/07/24/relevo-generacional-y-estetico-en-la-bocateria-seca-por-nan-arquitectos/', 'bocateria-a-seca', 'Relevo generacional y estético en la bocatería A Seca'),
  D('2014-07-17', 'Panadería Maisquepan', 'Interiores Minimalistas', 'http://www.interioresminimalistas.com/2014/06/17/maisquepan-panaderia-multifuncional-disenada-por-nan-arquitectos/', 'panaderia-maisquepan', 'Maisquepan, panadería multifuncional'),
  D('2014-06-13', 'Panadería Maisquepan', 'Arqa', 'http://arqa.com/arquitectura/interiorismo/panaderia-maisquepan-en-galicia-espana.html', 'panaderia-maisquepan', 'Panadería Maisquepan, en Galicia, España'),
];

export const anio = (p: Publicacion) => Number(p.fecha.slice(0, 4));

/** Medios distintos, ordenados por número de apariciones */
export const medios = Object.entries(
  publicaciones.reduce<Record<string, number>>((acc, p) => {
    if (p.medio === 'Entrevista en prensa') return acc;
    const m = p.medio.replace(/ nº.*$/, '').replace(/ \(.*\)$/, '').replace(/ · .*$/, '');
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {}),
)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([medio, n]) => ({ medio, n }));

/** Destacadas: un medio de referencia por obra, para la cabecera de /publicaciones */
export const destacadas = [
  { obra: 'Café Retail Inshopnia', slug: 'cafe-retail-inshopnia', medio: 'ArchDaily', anio: 2014, url: 'http://www.archdaily.com/559016/inshopnia-nan-arquitectos/', tambien: 'Arqa · Architizer · Diario Design · Interiores Minimalistas' },
  { obra: 'Restaurante Nantes', slug: 'restaurante-nantes-en-madrid', medio: 'Arqa', anio: 2019, url: 'https://arqa.com/arquitectura/restaurante-nantes.html', tambien: 'Proyecto Contract' },
  { obra: 'Peluquería Sonia Portela', slug: 'peluqueria-sonia-portela', medio: 'Plataforma Arquitectura', anio: 2018, url: 'https://www.plataformaarquitectura.cl/cl/907119/peluqueria-sonia-portela-nan-arquitectos', tambien: 'Interiores Minimalistas' },
] as const;

// En UTC: las fechas ISO sin hora son medianoche UTC y en Argentina o Canarias saldrían un día antes
const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });
/** «7 dic» para prensa digital (el año ya lo da el grupo), «Impresa» para revistas */
export const fechaCorta = (p: Publicacion) => (p.fecha.length > 4 ? fmt.format(new Date(p.fecha)).replace('.', '') : 'Impresa');

/** De la más reciente a la más antigua */
export const recientes = [...publicaciones].sort((a, b) => b.fecha.localeCompare(a.fecha));
