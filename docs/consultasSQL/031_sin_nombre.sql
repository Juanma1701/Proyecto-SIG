-- 031: "Equipamiento sin nombre (...)" pasa a "Sin nombre".
-- YA EJECUTADO el 7 de noviembre de 2026 (506 filas). No volver a correr.

-- 1) Respaldo de las filas que se modificaron
create table public.capas_respaldo_nombres_030 as
select id, nombre, propiedades
from public.capas
where nombre like 'Equipamiento sin nombre (%';

alter table public.capas_respaldo_nombres_030 enable row level security;

-- 2) Cambio (columna y, si existe, propiedades->nombre)
update public.capas
set nombre = 'Sin nombre',
    propiedades = case
      when propiedades->>'nombre' like 'Equipamiento sin nombre (%'
        then jsonb_set(propiedades, '{nombre}', '"Sin nombre"'::jsonb)
      else propiedades
    end
where nombre like 'Equipamiento sin nombre (%';

-- 3) Verificación (resultado obtenido: 0, 0, 506)
-- select
--   count(*) filter (where nombre like 'Equipamiento sin nombre (%') as quedan_viejos,
--   count(*) filter (where propiedades->>'nombre' like 'Equipamiento sin nombre (%') as quedan_viejos_en_propiedades,
--   count(*) filter (where nombre = 'Sin nombre') as con_sin_nombre
-- from public.capas;

-- REVERSA (mientras exista la tabla de respaldo):
-- update public.capas c
-- set nombre = r.nombre, propiedades = r.propiedades
-- from public.capas_respaldo_nombres_030 r
-- where c.id = r.id;