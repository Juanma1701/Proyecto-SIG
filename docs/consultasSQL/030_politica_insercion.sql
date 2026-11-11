-- 030d-1: quita la política que deja insertar a cualquiera
drop policy "Insercion publica de capas" on public.capas;

-- 030d-2: solo usuarios con sesión pueden insertar, y no pueden usar los nombres
-- reservados que el mapa muestra a todo el mundo como datos oficiales
create policy capas_insercion_autenticada
  on public.capas
  for insert
  to authenticated
  with check (
    nombre_capa not like 'Equipamientos AMVA - %'
    and nombre_capa not like 'Lugares OSM - %'
    and nombre_capa not like 'CARGA TEMPORAL%'
  );