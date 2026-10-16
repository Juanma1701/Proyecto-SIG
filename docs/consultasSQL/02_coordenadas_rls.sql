-- 02_coordenadas_rls.sql
-- Políticas RLS para coordenadas_capturadas y columna coordenada_id en zonas

alter table coordenadas_capturadas enable row level security;

drop policy if exists "Lectura publica de coordenadas" on coordenadas_capturadas;
drop policy if exists "Insercion publica de coordenadas" on coordenadas_capturadas;
drop policy if exists "Borrado publico de coordenadas" on coordenadas_capturadas;

create policy "Lectura publica de coordenadas"
on coordenadas_capturadas
for select
using (true);

create policy "Insercion publica de coordenadas"
on coordenadas_capturadas
for insert
with check (true);

create policy "Borrado publico de coordenadas"
on coordenadas_capturadas
for delete
using (true);

-- Columna que ahora usa el código en zonas
alter table zonas
add column if not exists coordenada_id uuid
references coordenadas_capturadas(id) on delete set null;