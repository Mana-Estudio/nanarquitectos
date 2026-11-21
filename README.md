# NAN Arquitectos — propuesta de rediseño

Prototipo de la nueva web de [NAN Arquitectos](https://www.nanarquitectos.com/) (Pontevedra). Diagnóstico y plan en [PLAN.md](PLAN.md).

**Stack:** Astro · `astro:assets` (AVIF/WebP + srcset) · View Transitions nativas · GSAP (ScrollTrigger, Flip) · Lenis.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # sitio estático en dist/
```

- Las animaciones respetan `prefers-reduced-motion`. Para forzarlas en una demo: agregar `?motion=1` a la URL.
- Fotos y textos tomados de la web actual del cliente (solo para el prototipo), en `src/assets/proyectos/` y `src/data/proyectos.ts`.
