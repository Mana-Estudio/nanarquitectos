import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/proyectos/*/*.jpg', { eager: true });

function fotos(slug: string): ImageMetadata[] {
  return Object.entries(files)
    .filter(([path]) => path.includes(`/proyectos/${slug}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, mod]) => mod.default);
}

export type Categoria = 'Clínica' | 'Hostelería' | 'Comercio' | 'Oficina' | 'Vivienda';

export interface Proyecto {
  slug: string;
  nombre: string;
  titulo: string;
  categoria: Categoria;
  lugar: string;
  anio: number;
  superficie: string;
  m2: number;
  /** índice de la foto horizontal usada como portada */
  portada: number;
  resumen: string;
  texto: string[];
  fotos: ImageMetadata[];
}

const data: Omit<Proyecto, 'fotos'>[] = [
  {
    slug: 'marna',
    nombre: 'Marna',
    titulo: 'Restaurante Marna',
    categoria: 'Hostelería',
    lugar: 'Pontevedra',
    anio: 2025,
    superficie: '200 m²',
    m2: 200,
    portada: 2,
    resumen: 'Un restaurante que traduce la tradición franciscana a madera, microcemento y luz cálida.',
    texto: [
      'El restaurante Marna se inspira en la estética y valores de la tradición franciscana. El color marrón, símbolo del hábito de los hermanos menores, domina el espacio en maderas y revestimientos, creando un ambiente cálido y sobrio.',
      'La barra, revestida en microcemento beige, se eleva como un altar contemporáneo, actuando como el centro simbólico y funcional del lugar. Celosías de madera, inspiradas en los confesionarios, dividen y conectan sutilmente los espacios, aportando intimidad y evocación espiritual.',
      'La iluminación cálida, el uso de materiales nobles y una atmósfera contenida hacen de Marna un espacio de contemplación y encuentro, donde la experiencia gastronómica se convierte en un ritual moderno.',
    ],
  },
  {
    slug: 'pazo-buzaca',
    nombre: 'Pazo da Buzaca',
    titulo: 'Espacio para eventos en Pazo da Buzaca',
    categoria: 'Hostelería',
    lugar: 'Moraña, Pontevedra',
    anio: 2022,
    superficie: '4.000 m²',
    m2: 4000,
    portada: 0,
    resumen: 'Un pazo, sus jardines y un pabellón de eventos ordenados por la topografía del lugar.',
    texto: [
      'La actuación está concentrada en el Pazo existente y los espacios en torno al mismo. Todo el conjunto comprende la edificación de un Pazo, jardines, espacios exteriores de acceso, piscina y pabellón de eventos.',
      'El hilo conductor de toda la actuación es la topografía del entorno: se transmite en planos inclinados que se introducen en la fachada y en la accesibilidad mediante escaleras y rampas en el espacio exterior.',
      'La fachada del pabellón es cubierta por una membrana de aluminio microperforado que le aporta un importante volumen de planos inclinados y, al mismo tiempo, no limita la visibilidad ni la luz de dentro a fuera y viceversa. Dentro del pabellón, dos volúmenes dorados configuran espacios de transición y ordenan el resto de la superficie.',
    ],
  },
  {
    slug: 'mercedes-fayos',
    nombre: 'Mercedes Fayos Fons',
    titulo: 'Clínica de ortodoncia Mercedes Fayos Fons',
    categoria: 'Clínica',
    lugar: 'Pontevedra',
    anio: 2024,
    superficie: '200 m²',
    m2: 200,
    portada: 0,
    resumen: 'Una clínica abierta a la ciudad, organizada con volúmenes puros y membranas translúcidas.',
    texto: [
      'Este proyecto de interiorismo parte de un concepto claro: diseñar una clínica especializada en ortodoncia que transmita transparencia, fluidez y cercanía, tanto hacia sus pacientes como hacia el entorno urbano en el que se inserta.',
      'El diseño interior se articula mediante un juego de volúmenes puros y membranas translúcidas que definen los distintos usos sin aislarlos completamente. Estas divisiones permiten que la luz natural fluya por todo el espacio, generando una atmósfera ligera y continua.',
      'La elección de los materiales responde a un equilibrio entre la percepción de limpieza y tecnología, fundamental en un espacio sanitario, y la necesidad de crear un ambiente acogedor y cercano.',
    ],
  },
  {
    slug: 'vivienda-parche',
    nombre: 'Vivienda Parche',
    titulo: 'Vivienda Parche',
    categoria: 'Vivienda',
    lugar: 'Pontevedra',
    anio: 2024,
    superficie: '150 m²',
    m2: 150,
    portada: 0,
    resumen: 'Un apartamento para una ilustradora, con madera oscura y puertas de color.',
    texto: [
      'Un apartamento para una ilustradora. Se buscaba un espacio diáfano con funciones singulares, como un amplio estudio de trabajo versátil donde la propietaria pudiese realizar su actividad profesional.',
      'En cualquier estancia de la vivienda hay una estética común, con la misma paleta de materiales en todos los habitáculos. Se conserva el pavimento existente y se incorpora un aire clásico tiñendo la madera en un color oscuro.',
      'Las notas de color llegan en el mobiliario y en las puertas: amarillo pastel, azul celeste, granate y verde inglés, una gama muy presente en la obra de la propietaria que recuerda a Le Corbusier o Robert Mallet-Stevens.',
    ],
  },
  {
    slug: 'carlos-pons',
    nombre: 'Carlos Pons',
    titulo: 'Centro de belleza Carlos Pons',
    categoria: 'Comercio',
    lugar: 'Pontevedra',
    anio: 2025,
    superficie: '220 m²',
    m2: 220,
    portada: 0,
    resumen: 'Rocas de acero, puestos de roble y cortinas que se mueven como el cabello.',
    texto: [
      'Un espacio funcional, flexible y visualmente inspirador. Las rocas, elementos diferenciadores construidos en acero, actúan como expositores y mostradores de cobro, tanto en la tienda como en el salón de belleza.',
      'Los puestos son bloques simples que organizan de manera eficiente los diferentes usos. Combinan acero y madera de roble, creando un contraste armonioso y una distribución clara que facilita la circulación.',
      'Las cortinas, inspiradas en el movimiento y la voluminosidad del cabello, fluyen suavemente y organizan los recorridos dentro del espacio.',
    ],
  },
  {
    slug: 'ayuntamiento-pontevedra',
    nombre: 'Concello de Pontevedra',
    titulo: 'Reforma de dependencias municipales, Ayuntamiento de Pontevedra',
    categoria: 'Oficina',
    lugar: 'Calle Michelena 30, Pontevedra',
    anio: 2020,
    superficie: '530 m²',
    m2: 530,
    portada: 1,
    resumen: 'Dependencias municipales adaptadas a la nueva normalidad, con metal, madera y aire limpio.',
    texto: [
      'A principios de 2020 el gobierno municipal decide adecuar sus instalaciones a la nueva normalidad. El objetivo, ante todo, es garantizar la seguridad tanto de los trabajadores como de los usuarios.',
      'Un falso techo metálico aloja la ventilación forzada y la climatización, y suma atenuantes acústicos para minimizar la reverberación. Los materiales son de fácil limpieza y sin ornamentación que dificulte su mantenimiento.',
      'Materiales fríos y neutros dan una imagen tecnológica al proyecto, contrarrestada por la madera, que humaniza el espacio.',
    ],
  },
];

export const proyectos: Proyecto[] = data.map((p) => ({ ...p, fotos: fotos(p.slug) }));

export const filtros: { label: string; cat: Categoria | null }[] = [
  { label: 'Todos', cat: null },
  { label: 'Clínicas', cat: 'Clínica' },
  { label: 'Hostelería', cat: 'Hostelería' },
  { label: 'Comercios', cat: 'Comercio' },
  { label: 'Oficinas', cat: 'Oficina' },
  { label: 'Viviendas', cat: 'Vivienda' },
];

export const ciudad = (p: Proyecto) => p.lugar.split(',').pop()!.trim();

export const portada = (p: Proyecto) => p.fotos[p.portada] ?? p.fotos[0];

const pick = (slug: string, foto: number) => {
  const p = proyectos.find((x) => x.slug === slug)!;
  return { proyecto: p, imagen: p.fotos[foto] };
};

/** Hero de la home: 3 obras, todas en horizontal */
export const heroSlides = [pick('marna', 5), pick('pazo-buzaca', 3), pick('vivienda-parche', 1)];

/** Obras seleccionadas: posición en la retícula según el diseño */
export const obrasHome = [
  { ...pick('marna', 2), col: '1 / span 7', ar: '4 / 3', mt: '0' },
  { ...pick('mercedes-fayos', 0), col: '9 / span 4', ar: '3 / 4', mt: '220px' },
  { ...pick('carlos-pons', 0), col: '2 / span 4', ar: '4 / 5', mt: '0' },
  { ...pick('vivienda-parche', 0), col: '7 / span 6', ar: '3 / 2', mt: '260px' },
  { ...pick('pazo-buzaca', 0), col: '1 / -1', ar: '21 / 9', mt: '0' },
];
