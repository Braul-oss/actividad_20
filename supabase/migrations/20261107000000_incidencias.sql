-- Configuracion del servicio: bucket privado, tabla de incidencias y reglas de acceso.
-- Se puede ejecutar completo en Supabase > SQL Editor. Es seguro ejecutarlo mas de una vez.

-- 1. Bucket privado: limita tamano y tipo de archivo desde el servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'incidencias-fotos',
  'incidencias-fotos',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. La base de datos guarda la referencia a la imagen, nunca la imagen.
create table if not exists public.incidencias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 120),
  descripcion text not null check (char_length(descripcion) between 5 and 2000),
  ubicacion text check (char_length(ubicacion) <= 120),
  foto_path text not null unique,
  foto_mime text not null check (foto_mime in ('image/jpeg', 'image/png', 'image/webp')),
  foto_tamano_bytes bigint not null check (foto_tamano_bytes > 0),
  creado_en timestamptz not null default now()
);

create index if not exists incidencias_usuario_fecha_idx
  on public.incidencias (usuario_id, creado_en desc);

-- 3. Cada usuario solo ve y crea sus propias incidencias.
alter table public.incidencias enable row level security;

drop policy if exists "incidencias_select_propias" on public.incidencias;
create policy "incidencias_select_propias" on public.incidencias
  for select to authenticated
  using (usuario_id = auth.uid());

drop policy if exists "incidencias_insert_propias" on public.incidencias;
create policy "incidencias_insert_propias" on public.incidencias
  for insert to authenticated
  with check (
    usuario_id = auth.uid()
    and (storage.foldername(foto_path))[1] = auth.uid()::text
  );

-- 4. Cada usuario solo accede a su carpeta: incidencias-fotos/<usuario_id>/archivo
drop policy if exists "fotos_select_propias" on storage.objects;
create policy "fotos_select_propias" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'incidencias-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "fotos_insert_propias" on storage.objects;
create policy "fotos_insert_propias" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'incidencias-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Necesaria para retirar la foto si falla el registro en la base de datos.
drop policy if exists "fotos_delete_propias" on storage.objects;
create policy "fotos_delete_propias" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'incidencias-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
