-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Cada zona guardada podrá referenciar el punto usado como centro del buffer.
alter table public.zonas
  add column coordenada_id uuid
  references public.coordenadas_capturadas(id)
  on delete set null;

create index zonas_coordenada_id_idx
  on public.zonas (coordenada_id);