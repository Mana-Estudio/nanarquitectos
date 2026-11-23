import type { APIRoute } from 'astro';
import { posts } from '../../data/blog';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Feed RSS del blog (sin dependencias): lectores de noticias, newsletters y Google Discover */
export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? url;
  const all = await posts();
  const items = all
    .map((p) => {
      const link = new URL(`/blog/${p.id}/`, base).href;
      return `<item><title>${esc(p.data.titulo)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${p.data.fecha.toUTCString()}</pubDate><category>${esc(p.data.categoria)}</category><description>${esc(p.data.descripcion)}</description></item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Blog de NAN Arquitectos</title><link>${new URL('/blog/', base).href}</link><description>Arquitectura, interiorismo, iluminación y obra desde Pontevedra.</description><language>es-es</language>${all[0] ? `<lastBuildDate>${all[0].data.fecha.toUTCString()}</lastBuildDate>` : ''}${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
