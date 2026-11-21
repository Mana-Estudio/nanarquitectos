# Supabase del panel de NAN Arquitectos

Proyecto: `nan-arquitectos` (ref `swdhgitbhpjhszdiypoc`, región eu-west-1).

## Ya hecho

- `schema.sql` aplicado: tablas `proyectos` y `ajustes`, RLS, bucket público `proyectos` y sus políticas.
- Administradores: los usuarios con `app_metadata.role = 'admin'` (ver el final de `schema.sql`).
- Registros públicos desactivados (Authentication → Sign In / Providers).
- Los 73 proyectos importados desde el panel (`/admin/` → «Importar»). `seed.sql` hace lo mismo por SQL.

## Cómo funciona

- El panel (`/admin/`) lee y guarda en Supabase cuando la compilación tiene `PUBLIC_SUPABASE_URL` y
  `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ver `.env.example`). Sin esas variables queda en modo demo.
- La web lee los proyectos publicados **al compilar** (`src/data/proyectos.ts`). Si Supabase no responde o la base
  está vacía, usa `src/data/proyectos.json`.
- Las fotos que ya estaban siguen en `src/assets/proyectos/`; en la base solo se guarda la referencia (`repo`).
  Las fotos nuevas se suben al bucket y Astro las optimiza como imágenes remotas.
- «Publicar cambios en la web» llama a la función `publicar`, que dispara un Deploy Hook de Vercel.

## Falta (lo hace quien administra el proyecto en Vercel)

1. Vercel → Project → Settings → Environment Variables: añadir `PUBLIC_SUPABASE_URL` y
   `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (valores de `.env.example`, son públicos) para Production y Preview.
2. Vercel → Project → Settings → Git → Deploy Hooks: crear uno para la rama `main` y copiar la URL.
3. Supabase → Edge Functions: desplegar `functions/publicar/index.ts` con el nombre `publicar`
   (o `supabase functions deploy publicar`) y, en Edge Functions → Secrets, añadir
   `VERCEL_DEPLOY_HOOK` con la URL del paso 2.
