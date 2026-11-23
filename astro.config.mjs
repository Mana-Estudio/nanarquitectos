// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // Dominio para canonical, Open Graph, RSS y datos estructurados. Al publicar en el dominio del
  // estudio: SITE_URL=https://www.nanarquitectos.com (mientras tanto, el prototipo no se indexa)
  site: process.env.SITE_URL ?? 'https://nan-arquitectos.vercel.app',
  image: {
    // Fotos subidas desde el panel: viven en Supabase Storage y Astro las optimiza al compilar
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  // Blog en MDX: permite usar <Figura>, <Obra>… dentro de los artículos
  integrations: [mdx()],
});
