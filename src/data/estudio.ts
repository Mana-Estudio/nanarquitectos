// Textos tomados de nanarquitectos.com (/estudio, /gestion-de-obra/*, /publicaciones, /contacto)

export const contacto = {
  email: 'info@nanarquitectos.com',
  nuevos: { label: 'Nuevos proyectos', tel: '+34 691 563 366', href: 'tel:+34691563366', wa: 'https://wa.me/34691563366' },
  generales: { label: 'Consultas generales', tel: '+34 658 61 74 08', href: 'tel:+34658617408' },
  direccion: ['Plaza de España, 1, 1º Izquierda, oficina 2', '36002 Pontevedra'],
  mapa: 'https://www.google.com/maps/search/?api=1&query=Plaza+de+Espa%C3%B1a+1+36002+Pontevedra',
  redes: [
    { label: 'Instagram', href: 'https://www.instagram.com/nanarquitectos/' },
    { label: 'Pinterest', href: 'https://www.pinterest.es/nanarquitectos/' },
    { label: 'Facebook', href: 'https://www.facebook.com/nanarquitectos/' },
    { label: 'Twitter', href: 'https://twitter.com/nanarquitectos' },
  ],
  titular: 'Nan Arquitectos y Contract S.L. · CIF B94097979',
};

export const socios = ['Alberto F. Reiriz Paz', 'Vicente Pillado Domato'];

export const estudio = {
  intro:
    'NAN ARQUITECTOS es un estudio de arquitectura y diseño nacido en 2013; formado por Alberto F. Reiriz Paz y Vicente Pillado Domato. Con sede en Pontevedra, la firma centra su actividad en proyectos de arquitectura, diseño e interiorismo para viviendas, oficinas y locales comerciales.',
  rasgos: ['Diseño contemporáneo', 'Dominio de la iluminación', 'Juego de volúmenes', 'Contraste de materiales', 'Eficiencia energética'],
  manifiesto:
    'Una arquitectura racional, sincera, que busca mantener el equilibrio entre la funcionalidad, el diseño y la sostenibilidad para que sus espacios no resulten indiferentes.',
  capitulos: [
    {
      titulo: 'Un equipo diverso',
      texto: 'La heterogeneidad formativa de sus socios marca la diversidad de sus inquietudes profesionales que, trasladadas a sus propuestas de trabajo, dan lugar a proyectos de calidad tanto a nivel estético como funcional. Además, el equipo cuenta con una red de colaboradores especializados en diferentes áreas complementarias al mundo del diseño y la arquitectura para ofrecer el mejor resultado y cubrir cualquier tipo de necesidad.',
    },
    {
      titulo: 'Cada proyecto es único',
      texto: 'Aunque sus trabajos tienen un lenguaje propio y bien definido, NAN ARQUITECTOS desarrolla proyectos integrales bajo la máxima personalización y exclusividad con el objetivo de crear propuestas únicas. En este sentido, cada proyecto es diferente y el proceso creativo se convierte en un trabajo colaborativo que involucra al cliente para así entender sus necesidades concretas y garantizar su satisfacción.',
    },
    {
      titulo: 'Diseño eficiente',
      texto: 'Durante este proceso, el equipo propone soluciones que incorporen líneas de diseño específicas para el proyecto, bajo técnicas de construcción adecuadas al mismo y en concordancia con un diseño de instalaciones energéticamente eficiente y de bajo coste de mantenimiento.',
    },
    {
      titulo: 'Diálogo con lo existente',
      texto: 'En definitiva, la firma se caracteriza por crear una arquitectura racional, sincera, que busca mantener el equilibrio entre la funcionalidad, el diseño y la sostenibilidad para que sus espacios no resulten indiferentes. De este modo, busca crear ambientes que evoquen emociones, construcciones que dialoguen con el entorno y la edificación existente de modo que sea posible confrontar el diseño contemporáneo con las preexistencias.',
    },
    {
      titulo: 'Presentes en la obra',
      texto: 'Para lograrlo, el equipo lleva a cabo un seguimiento continuo en todas las fases de ejecución de obra bajo la premisa de garantizar siempre el mejor resultado. La firma ha sido invitada como ponente en varios eventos y recibido diversos reconocimientos a nivel nacional e internacional por la calidad de sus proyectos, tanto a nivel de arquitectura y diseño como en campos más específicos como, por ejemplo, el de la iluminación, un área en la que es considerado un estudio de referencia.',
    },
  ],
};

export interface Servicio { id: string; nombre: string; frase: string; textos: string[]; foto: [string, number, 'L' | 'P'] }

export const servicios: Servicio[] = [
  {
    id: 'arquitectura', nombre: 'Arquitectura',
    frase: 'Proyectos integrales para viviendas, oficinas y locales comerciales.',
    textos: [
      'NAN ARQUITECTOS desarrolla proyectos integrales bajo la máxima personalización y exclusividad con el objetivo de crear propuestas únicas. Las propuestas del estudio se caracterizan por su diseño contemporáneo, el dominio de la iluminación, el juego de volúmenes, el contraste de materiales y la eficiencia energética.',
      'Construcciones que dialoguen con el entorno y la edificación existente de modo que sea posible confrontar el diseño contemporáneo con las preexistencias.',
    ],
    foto: ['vivienda-parche', 2, 'L'],
  },
  {
    id: 'interiorismo', nombre: 'Interiorismo',
    frase: 'Ambientes que evoquen emociones.',
    textos: [
      'Cada proyecto es diferente y el proceso creativo se convierte en un trabajo colaborativo que involucra al cliente para así entender sus necesidades concretas y garantizar su satisfacción.',
      'El equipo propone soluciones que incorporen líneas de diseño específicas para el proyecto, en concordancia con un diseño de instalaciones energéticamente eficiente y de bajo coste de mantenimiento.',
    ],
    foto: ['marna-restaurante', 2, 'P'],
  },
  {
    id: 'construccion', nombre: 'Construcción',
    frase: 'No solo realizamos proyectos, también los ejecutamos: llave en mano.',
    textos: [
      'En NAN ARQUITECTOS no solo realizamos proyectos, sino que también los ejecutamos. Es por este motivo que nos rodeamos de los mejores profesionales del sector para hacer viable cualquier propuesta.',
      'No es determinante la dimensión del trabajo, ya que estamos acostumbrados a tratar con diferentes especialidades para poder optimizar al máximo los recursos disponibles.',
      'Es muy necesario fusionar el diseño y el proceso constructivo con los conocimientos necesarios que aporta un estudio de arquitectura como el nuestro para que el resultado en la ejecución de la obra sea óptimo y menos costoso que en otras circunstancias.',
      'También tratamos de cotejar diferentes presupuestos con el fin de proporcionar siempre la propuesta más adecuada para cada caso.',
      'Buscamos materiales, profesionales y soluciones a través del diseño que nos ayuden a realizar cualquier tipo de idea de manera eficiente.',
      'Contamos con una gran experiencia en diseño, gestión de presupuestos y ejecución de obra; nuestra misión es que el cliente no se tenga que preocupar en ningún momento de todo este proceso, ya que ofrecemos un «llave en mano».',
    ],
    foto: ['pazo-da-buzaca', 3, 'L'],
  },
  {
    id: 'mobiliario', nombre: 'Mobiliario',
    frase: 'Piezas a medida y un amplio muestrario, integrados desde el primer boceto.',
    textos: [
      'No hay nada más importante a la hora de decorar un espacio que el mobiliario. Nosotros lo enfocamos de una manera integral. Por un lado diseñamos piezas hechas a medida y por otro facilitamos un amplio muestrario, ya que contamos con fabricantes y distribuidores que nos ayudan a encontrar todo tipo de alternativas, tanto en el ámbito doméstico, como en el espacio comercial. Así conseguimos la mejor solución para cada caso, de manera que los elementos se mimeticen o se contrapongan logrando el efecto deseado.',
      'Desde un primer momento se integran en el proyecto, ya que las infografías realizadas incorporan la parte de interiorismo, teniendo en cuenta las necesidades funcionales y estéticas del cliente.',
      'Es importante tener en cuenta, a la hora de escoger muebles, que forma parte de un todo, al igual que la iluminación, en el que cada elemento está integrado dentro de la propia arquitectura.',
      'No entendemos la decoración como una parte independiente del diseño arquitectónico sino que el mobiliario debe seguir la línea conceptual que se haya buscado introducir en todo el proceso para alcanzar espacios con identidad.',
    ],
    foto: ['cafeteria-dorsia', 1, 'L'],
  },
  {
    id: 'iluminacion', nombre: 'Iluminación',
    frase: 'Arquitectura e iluminación deben ir de la mano.',
    textos: [
      'Arquitectura e iluminación deben ir de la mano por eso ponemos un especial énfasis en esta disciplina ya que consideramos que estos dos conceptos tienen que ser pensados desde el inicio, tanto del diseño, como de la obra.',
      'Con la iluminación buscamos generar sensaciones que acompañen a la arquitectura; enfatizar o disminuir texturas en materiales; destacar u ocultar variedades cromáticas en cualquier contexto; crear escenas que se adecuen al momento o a la actividad, etc.',
      'Es importante saber iluminar dependiendo del tipo de proyecto que se está realizando, no es lo mismo un espacio comercial que uno doméstico. Por eso a través de la luz podemos potenciar una posible venta o inundar de paz un hogar.',
      'Colaboramos con las mejores y más variadas marcas para ofrecer los productos que mejor se adapten a cada necesidad. Nuestro objetivo es dar soluciones originales con el fin de optimizar los recursos y convertir los espacios arquitectónicos en sensitivos.',
    ],
    foto: ['restaurante-nantes-en-madrid', 1, 'L'],
  },
];

/** Proceso de trabajo (secuencia real, resumida de los textos del estudio) */
export const proceso = [
  { t: 'Escuchar', d: 'Un trabajo colaborativo que involucra al cliente para entender sus necesidades concretas.' },
  { t: 'Proyectar', d: 'Líneas de diseño específicas e infografías que ya incorporan el interiorismo y el mobiliario.' },
  { t: 'Presupuestar', d: 'Cotejamos diferentes presupuestos para proporcionar la propuesta más adecuada para cada caso.' },
  { t: 'Construir', d: 'Seguimiento continuo en todas las fases de la obra, con entrega llave en mano.' },
];

type Pub = [obra: string, medio: string, anio: number, slug?: string];
/** Revistas impresas y prensa digital (nanarquitectos.com/publicaciones) */
export const revistas: Pub[] = [
  ['Restaurante Nantes', 'Proyecto Contract', 2019, 'restaurante-nantes-en-madrid'],
  ['Unitec', 'Revista suiza Idea', 2018, 'unitec'],
  ['Unitec', 'Proyecto Contract', 2018, 'unitec'],
  ['Sana Sana Pilates', 'ICANDELA Nº 26', 2018, 'sana-sana-pilates'],
  ['Sal de Allo', 'Proyecto Contract', 2018, 'restaurante-sal-de-allo'],
  ['Oficina Peregrina', 'On Diseño Nº 374', 2018, 'gabinete-juridico-peregrina'],
  ['La Torta, Maisquepan, A Seca, Inshopnia', 'Small Cafe & Shop, Archiworld', 2018],
  ['La Piadina', 'Proyecto Contract', 2018, 'reforma-cafeteria-la-piadina'],
  ['Iconweb', 'MD Office', 2018, 'oficina-iconweb'],
  ['Dorsia', 'Proyecto Contract', 2018, 'cafeteria-dorsia'],
  ['NAN Arquitectos', 'DImagazine Nº 270', 2018],
  ['Clínica Dental Pablo Sieiro', 'IW', 2018, 'clinica-dental-pablo-sieiro'],
  ['Concept Habitat', 'Casa Viva', 2018, 'showroom-concept-habitat-studio'],
  ['Concept Habitat', 'On Diseño Nº 368', 2018, 'showroom-concept-habitat-studio'],
  ['NAN Arquitectos y NanContract', 'Prensa', 2016],
  ['Estanco Calvario', 'Proyecto Contract', 2015, 'estanco-calvario'],
  ['NAN Arquitectos', 'Interior Worlds Design & Detail', 2015],
  ['Maisquepan', 'Casa Viva', 2014, 'panaderia-maisquepan'],
];
export const prensa: Pub[] = [
  ['Restaurante Nantes', 'Arqa', 2019, 'restaurante-nantes-en-madrid'],
  ['Peluquería Sonia Portela', 'Plataforma Arquitectura', 2018, 'peluqueria-sonia-portela'],
  ['Peluquería Sonia Portela', 'Interiores Minimalistas', 2018, 'peluqueria-sonia-portela'],
  ['Dental Clinic', 'ArchDaily', 2014, 'clinica-dental-pablo-sieiro'],
  ['Vivienda Villagarcía', 'Arqa', 2014, 'casa-villagarcia'],
  ['Clínica dental', 'Interiores Minimalistas', 2014, 'clinica-dental-pablo-sieiro'],
  ['Café Retail Inshopnia', 'Architizer', 2014, 'cafe-retail-inshopnia'],
  ['Inshopnia', 'ArchDaily', 2014, 'cafe-retail-inshopnia'],
  ['La Piadina', 'Architizer', 2014, 'reforma-cafeteria-la-piadina'],
  ['Inshopnia', 'Arqa', 2014, 'cafe-retail-inshopnia'],
  ['Inshopnia', 'Diario Design', 2014, 'cafe-retail-inshopnia'],
  ['Bakery Maisquepán', 'Architizer', 2014, 'panaderia-maisquepan'],
  ['Reforma Apartamento Poio', 'Architizer', 2014],
  ['La Seca', 'Architizer', 2014, 'bocateria-a-seca'],
  ['Vivienda en Villagarcía', 'Architizer', 2014, 'casa-villagarcia'],
  ['House in Rubianes Refurbishment', 'ArchDaily', 2014],
  ['Panadería Maisquepan', 'Arqa', 2014, 'panaderia-maisquepan'],
];
