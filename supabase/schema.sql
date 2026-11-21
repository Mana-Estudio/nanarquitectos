-- NAN Arquitectos · esquema del panel de administrador
-- Ejecutar una vez en el SQL Editor del proyecto (o con la MCP de Supabase), después seed.sql.
--
-- Fotos: cada proyecto guarda la lista ordenada en `fotos` (jsonb):
--   { "id": "marna-restaurante-0", "repo": "marna-restaurante/01.jpg" }   foto que vive en el repositorio
--   { "id": "u-…", "path": "u-….jpg", "w": 2000, "h": 1333 }             foto subida desde el panel (bucket «proyectos»)
-- Quién puede editar: usuarios con app_metadata.role = 'admin' (ver el final del archivo).

create table if not exists public.proyectos (
  slug        text primary key check (slug ~ '^[a-z0-9-]+$'),
  nombre      text not null,
  titulo      text not null,
  categoria   text not null check (categoria in ('Clínica', 'Hostelería', 'Comercio', 'Oficina', 'Vivienda', 'Otros')),
  lugar       text not null default '',
  anio        int,
  m2          int,
  texto       text[] not null default '{}',
  publicado   boolean not null default false,
  orden       int not null default 0,
  galeria     text not null default 'mosaico' check (galeria in ('mosaico', 'galeria', 'sueltas')),
  mostrar     jsonb not null default '{"ficha":true,"texto":true,"galeria":true,"planos":true,"siguiente":true}',
  fotos       jsonb not null default '[]',
  planos      jsonb not null default '[]',
  portada     text,          -- id de la foto destacada; null = la primera horizontal
  diseno      jsonb not null default '{}',   -- formatos elegidos en el panel: { "texto": "editorial" | "columnas" | "cita" }
  updated_at  timestamptz not null default now()
);
create index if not exists proyectos_orden_idx on public.proyectos (orden);

-- Ajustes generales. Clave 'portada': { "hero": [{slug, foto}|null ×3], "home": [{slug, foto}|null ×5] }
create table if not exists public.ajustes (
  clave       text primary key,
  valor       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.proyectos enable row level security;
alter table public.ajustes enable row level security;

grant select on public.proyectos, public.ajustes to anon, authenticated;
grant insert, update, delete on public.proyectos, public.ajustes to authenticated;

-- Lectura: la web ve lo publicado; el administrador ve también los borradores
create policy "proyectos: leer" on public.proyectos for select to anon, authenticated
  using (publicado or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "proyectos: crear" on public.proyectos for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "proyectos: editar" on public.proyectos for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "proyectos: borrar" on public.proyectos for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "ajustes: leer" on public.ajustes for select to anon, authenticated using (true);
create policy "ajustes: crear" on public.ajustes for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "ajustes: editar" on public.ajustes for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Fotos subidas desde el panel: bucket público de lectura, escritura solo del administrador
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proyectos', 'proyectos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "fotos: ver (admin)" on storage.objects for select to authenticated
  using (bucket_id = 'proyectos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "fotos: subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'proyectos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "fotos: reemplazar" on storage.objects for update to authenticated
  using (bucket_id = 'proyectos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'proyectos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "fotos: borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'proyectos' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Dar permisos de administrador a un usuario (crearlo antes en Authentication → Users):
--   update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}') || '{"role":"admin"}'
--   where email = 'correo@del-estudio.com';
-- Y desactivar los registros públicos en Authentication → Sign In / Providers → «Allow new users to sign up».
