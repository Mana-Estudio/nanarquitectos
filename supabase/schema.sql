-- Esquema para el panel de NAN Arquitectos (todavía sin aplicar).
-- Refleja la interfaz de src/scripts/admin/store.ts. Fotos en Storage, bucket público "proyectos".

create table public.proyectos (
  slug        text primary key,
  nombre      text not null,
  titulo      text not null,
  categoria   text not null check (categoria in ('Clínica','Hostelería','Comercio','Oficina','Vivienda','Otros')),
  lugar       text not null default '',
  anio        int,
  m2          int,
  texto       text[] not null default '{}',
  publicado   boolean not null default false,
  orden       int not null default 0,
  galeria     text not null default 'mosaico' check (galeria in ('mosaico','galeria','sueltas')),
  mostrar     jsonb not null default '{"ficha":true,"texto":true,"galeria":true,"planos":true,"siguiente":true}',
  portada_id  uuid,
  hero        smallint check (hero between 1 and 3),
  home        smallint check (home between 1 and 5),
  hero_foto   uuid,
  home_foto   uuid,
  updated_at  timestamptz not null default now()
);
create unique index proyectos_hero_uq on public.proyectos (hero) where hero is not null;
create unique index proyectos_home_uq on public.proyectos (home) where home is not null;

create table public.fotos (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null references public.proyectos (slug) on update cascade on delete cascade,
  tipo     text not null default 'foto' check (tipo in ('foto','plano')),
  path     text not null,            -- ruta en Storage: proyectos/<slug>/<archivo>
  ancho    int not null,
  alto     int not null,
  orden    int not null default 0
);
create index fotos_slug_idx on public.fotos (slug, tipo, orden);

-- Lectura pública solo de lo publicado; escritura solo para el equipo del estudio (usuarios autenticados)
alter table public.proyectos enable row level security;
alter table public.fotos enable row level security;
create policy "leer publicados" on public.proyectos for select using (publicado or (select auth.role()) = 'authenticated');
create policy "editar proyectos" on public.proyectos for all to authenticated using (true) with check (true);
create policy "leer fotos" on public.fotos for select using (true);
create policy "editar fotos" on public.fotos for all to authenticated using (true) with check (true);
