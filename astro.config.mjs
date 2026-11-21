// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  image: {
    // Fotos subidas desde el panel: viven en Supabase Storage y Astro las optimiza al compilar
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
});
