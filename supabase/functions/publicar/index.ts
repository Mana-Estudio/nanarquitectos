// Publicar: regenera la web en Vercel con los datos guardados en el panel.
// Solo la pueden llamar usuarios con app_metadata.role = 'admin'.
// Secreto necesario (Edge Functions → Secrets): VERCEL_DEPLOY_HOOK = URL del Deploy Hook de Vercel.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Falta la sesión' }, 401);
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data, error } = await sb.auth.getUser(token);
  if (error || data.user?.app_metadata?.role !== 'admin') return json({ error: 'Solo el administrador puede publicar' }, 403);

  const hook = Deno.env.get('VERCEL_DEPLOY_HOOK');
  if (!hook) return json({ error: 'Falta configurar VERCEL_DEPLOY_HOOK en Supabase' }, 500);
  const r = await fetch(hook, { method: 'POST' });
  if (!r.ok) return json({ error: `Vercel respondió ${r.status}` }, 502);
  return json({ ok: true });
});
