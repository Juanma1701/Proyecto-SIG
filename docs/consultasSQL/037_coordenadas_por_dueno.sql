-- 037a: agrega el dueño a coordenadas_capturadas y se lo asigna a las que ya tienen zona.
-- El valor por defecto se agrega aparte para que las filas existentes no reciban un valor vacío por error.
alter table public.coordenadas_capturadas
  add column user_id uuid references auth.users(id) on delete cascade;

alter table public.coordenadas_capturadas
  alter column user_id set default auth.uid();

update public.coordenadas_capturadas c
set user_id = z.user_id
from public.zonas z
where z.coordenada_id = c.id;

-- 037b: verificación (solo lectura). Debe dar total = 6; sin_dueno son las que no tienen zona.
select
  (select count(*) from public.coordenadas_capturadas) as total,
  (select count(*) from public.coordenadas_capturadas where user_id is null) as sin_dueno,
  (select count(*) from public.coordenadas_capturadas c
     where not exists (select 1 from public.zonas z where z.coordenada_id = c.id)) as sin_zona;

-- 037c: políticas por dueño (reemplazan a las de "cualquier usuario con sesión")
drop policy coordenadas_lectura_autenticada on public.coordenadas_capturadas;
drop policy coordenadas_insercion_autenticada on public.coordenadas_capturadas;
drop policy coordenadas_borrado_autenticado on public.coordenadas_capturadas;

create policy coordenadas_lectura_propia
  on public.coordenadas_capturadas for select to authenticated
  using (user_id = (select auth.uid()));

create policy coordenadas_insercion_propia
  on public.coordenadas_capturadas for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy coordenadas_borrado_propio
  on public.coordenadas_capturadas for delete to authenticated
  using (user_id = (select auth.uid()));

-- 037d: verificación de políticas (solo lectura). Deben salir 3 filas, todas {authenticated}.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'coordenadas_capturadas'
order by policyname;