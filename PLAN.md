# NAN Arquitectos — Diagnóstico y plan de rediseño

Estudio de arquitectura e interiorismo en Pontevedra (Galicia). Proyectos de clínicas, hostelería, comercio, oficinas y vivienda.
Web actual: https://www.nanarquitectos.com/ (WordPress, tema "Total" 4.6, versión de 2018).

---

## 1. Diagnóstico

| Aspecto | Problema | Mejora |
|---|---|---|
| **Seguridad** | **La home tiene spam de casinos inyectado** (decenas de enlaces en ruso, polaco, alemán y otros idiomas dentro del contenido). Es típico de un WordPress hackeado o sin actualizar. Google penaliza esto y daña la marca. | Sitio estático (Astro): sin base de datos, sin plugins ni panel que hackear. **Es el mejor argumento de venta.** |
| Primera impresión | La home abre directo en una grilla de miniaturas de 500×350 px. No hay hero, ni mensaje, ni una foto protagonista. El banner de cookies tapa medio viewport. | Hero a pantalla completa con la mejor obra, nombre del estudio y una frase. Banner de cookies discreto, abajo. |
| Calidad de imagen | Miniaturas de 500×350 y fotos de detalle de 867–1300 px, que se ven blandas en pantallas retina. En el servidor están los originales de 2400 px. Hay una imagen subida con nombre "chatgpt-image…". | Usar los originales de 2400 px con AVIF/WebP y `srcset` (640 → 2400). Nitidez en retina con menos peso. |
| Presentación de proyectos | Todas las fotos van apiladas en vertical, sin lightbox ni ritmo. El texto (que es bueno) queda perdido. | Ficha editorial: hero, ficha técnica (lugar, año, m²), texto en columna angosta, galería con ritmo (1 grande / 2 chicas) y lightbox a pantalla completa. |
| Navegación | Seis ítems con submenús ("Gestión de obra" → construcción, mobiliario, iluminación). El filtro por categoría manda a otra página. | Cuatro ítems: Proyectos · Estudio · Servicios · Contacto. Filtro por categoría en el mismo listado, sin recargar. |
| Tipografía | Una sola fuente ("Geogtq") en todo el sitio, con mayúsculas chicas y poca jerarquía. | Par tipográfico: una serif editorial para títulos y una sans neutra para texto e información. Escala con contraste real. |
| Animación | No hay, salvo el lazy load. | Pocas animaciones y bien pensadas (ver sección 3). |
| SEO | No hay H1 ni en la home ni en los proyectos. Los alt están vacíos en la mayoría de las imágenes. Algunos slugs pasan los 150 caracteres (`…interiorismo-diseno-construccion-calidad-obra-iluminacion-galicia…`). Le juega en contra el spam. | H1 por página, alt descriptivos, slugs cortos, datos estructurados (Organization y LocalBusiness), sitemap y Open Graph con la foto del proyecto. |
| Mobile | El tema es responsive, pero la grilla de miniaturas se vuelve una lista larga sin jerarquía. | Diseño pensado primero para mobile: hero en vertical, galería deslizable y lightbox con gestos. |

---

## 2. Referentes y patrones

Estudios con webs que dejan protagonismo a la obra (para mirar en el navegador antes de Claude Design):

- **Norm Architects** (normcph.com): mucho blanco, fotos grandes y tipografía mínima. *Patrón: la interfaz desaparece.*
- **Snøhetta** (snohetta.com): listado de proyectos filtrable con imagen grande. *Patrón: filtro en la misma página.*
- **OMA** (oma.com): índice de proyectos como lista o tabla. *Patrón: vista alternativa "índice" (nombre · tipo · año) para quien busca rápido.*
- **David Chipperfield Architects** (davidchipperfield.com): sobriedad, ficha técnica clara y retícula estricta. *Patrón: ficha editorial.*
- **Mecanoo** (mecanoo.nl): hero inmersivo y transiciones entre proyectos. *Patrón: continuidad de la imagen al entrar a un proyecto.*

**Patrones a tomar:** foto a sangre como protagonista · texto chico y preciso al lado de imágenes enormes · retícula rigurosa con asimetría intencional · transición en la que la miniatura "crece" hasta ser el hero del proyecto.

---

## 3. Plan por secciones

### Arquitectura de información
```
/                  Home
/proyectos         Listado (filtro: Todos · Clínicas · Hostelería · Comercial · Oficina · Vivienda)
/proyectos/[slug]  Detalle de proyecto
/estudio           Equipo, enfoque, publicaciones (absorbe "Publicaciones")
/servicios         Arquitectura · Interiorismo · Gestión de obra (absorbe los 3 submenús)
/contacto          Formulario + mapa + datos
```
El blog queda fuera del prototipo. Si el cliente lo usa, se suma después.

### Home
1. **Hero**: una obra a pantalla completa (cross-fade lento entre 3–4 obras destacadas), logo, menú mínimo y una frase corta. Abajo, el nombre del proyecto y un indicador de scroll.
2. **Obras seleccionadas**: 5–6 proyectos en retícula asimétrica (alternando grande / mediano), cada uno con nombre, tipo y año.
3. **Manifiesto**: 2–3 líneas grandes en serif sobre cómo trabaja el estudio.
4. **Servicios**: tres columnas sobrias.
5. **Cierre / contacto**: CTA "Contanos tu proyecto" + datos + Instagram.

### Listado de proyectos
Retícula con filtro animado (las tarjetas se reacomodan con FLIP) y la opción de ver como índice en lista. En hover, la imagen hace un zoom leve (scale 1.03) y aparece el nombre.

### Detalle de proyecto
Hero a sangre → ficha (lugar · año · m² · tipo) → texto en columna de 60 caracteres → galería con ritmo variado → lightbox a pantalla completa (teclado, swipe, contador) → "Siguiente proyecto" con su imagen de fondo.

### Dirección visual (propuesta inicial, a validar en Claude Design)
- **Paleta**: casi monocroma y cálida. Blanco hueso `#F5F3EF`, tinta `#1A1A18`, gris piedra `#8C8A85` y **un acento tomado del logo** (el triángulo amarillo de la "A"). La foto aporta el color.
- **Tipografía**: serif editorial para títulos (p. ej. *Fraunces* o *Cormorant*) + sans neutra para texto e información (p. ej. *Inter Tight* o *Manrope*). Todas libres en Google Fonts y alojadas en el propio sitio.
- **Retícula**: 12 columnas, márgenes generosos (6–8 vw en desktop), mucho aire entre bloques.

### Sistema de animaciones
| Momento | Animación | Herramienta |
|---|---|---|
| Carga inicial | Logo y frase aparecen en secuencia, la foto del hero se descubre con un *clip-path* | CSS / GSAP |
| Navegación entre páginas | La miniatura se transforma en el hero del proyecto (shared element) | Astro View Transitions |
| Scroll | Las imágenes se revelan con máscara + leve parallax; los textos suben con fade | GSAP ScrollTrigger |
| Scroll general | Desplazamiento suave | Lenis |
| Hover en proyectos | Zoom 1.03 + aparece el título | CSS |
| Filtro | Las tarjetas se reacomodan (FLIP) | GSAP Flip |

Todo funciona a 60 fps (solo `transform` y `opacity`) y se desactiva con `prefers-reduced-motion`.

### Tratamiento de imágenes
- Fuente: originales de 2400 px descargados de la web actual.
- `astro:assets` genera AVIF + WebP en 640 / 1024 / 1600 / 2400 con `srcset` y `sizes` correctos.
- La foto del hero se carga con prioridad (`fetchpriority="high"`) y el resto en diferido (lazy).
- Placeholder con el color dominante de cada foto: nada de saltos ni cajas grises.
- Lightbox con la versión de 2400 px.

**Meta de rendimiento:** LCP < 2 s en 4G, Lighthouse ≥ 95 en Performance, Accessibility y SEO.

---

## 4. Decisiones

**Tomadas (20/11/2026):** dirección clara y cálida · hero con cross-fade de 3–4 obras · solo español · repo propio con remoto `SantiA21/NanaArquitectos`.

Pendientes: proyectos del prototipo (punto 5) y si se le menciona el spam al cliente (punto 6).

1. **Repositorio**: la carpeta `NanaArquitectos` hoy está dentro de otro repo git (`E:\Proyectos`, remoto FitCore). Propuesta: `git init` propio en esta carpeta con remoto `SantiA21/NanaArquitectos`.
2. **Dirección visual**: claro y cálido (blanco hueso, editorial) **o** oscuro y dramático (fondo negro, las fotos brillan más, sensación de galería).
3. **Hero de la home**: una sola foto fija **o** cross-fade entre 3–4 obras.
4. **Idiomas**: solo español **o** español + inglés (o gallego).
5. **Proyectos del prototipo**: propongo 6 (Marna, Clínica Mercedes Fayos, Carlos Pons, Vivienda DS Pontevedra, Ayuntamiento de Pontevedra, Pazo Buzaca).
6. **El spam**: ¿se lo mencionás al cliente como argumento de venta? (recomendado: sí, con captura).

---

## 5. Brief para Claude Design

> Diseñá la web de **NAN Arquitectos**, estudio de arquitectura e interiorismo de Pontevedra (Galicia). Proyectos de clínicas, restaurantes, comercios, oficinas y viviendas, con fotografía y renders de alta calidad.
>
> **Objetivo:** que la obra sea protagonista absoluta. La interfaz se retira; la foto manda.
> **Tono:** sobrio, editorial, cálido, preciso. Nada de efectos gratuitos.
> **Referentes:** Norm Architects (aire y silencio), Chipperfield (ficha técnica sobria), Snøhetta (listado filtrable).
>
> **Pantallas:** (1) Home con hero a pantalla completa, obras seleccionadas en retícula asimétrica, manifiesto breve, servicios y contacto. (2) Listado de proyectos con filtro por tipo y vista índice. (3) Detalle de proyecto con hero a sangre, ficha (lugar · año · m²), texto en columna angosta, galería con ritmo variado y "siguiente proyecto".
>
> **Sistema:** paleta casi monocroma (blanco hueso #F5F3EF, tinta #1A1A18, gris piedra #8C8A85, acento amarillo del logo usado con moderación). Serif editorial para títulos + sans neutra para texto. Retícula de 12 columnas, márgenes amplios.
>
> **Entregar:** desktop (1440) y mobile (390) de las tres pantallas + una variante en modo oscuro del detalle de proyecto para comparar.
