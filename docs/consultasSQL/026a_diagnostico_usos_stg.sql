-- C:/Proyectos/Proyecto_SIG/docs/consultasSQL/026b_cargar_usos_suelo_medellin.sql
-- Inserta en la tabla NUEVA usos_suelo. No toca ninguna otra.
-- Es seguro repetirlo: si ya hay datos de esta capa, no inserta nada.

-- Seguridad: que la tabla temporal no quede expuesta por la API
alter table public.usos_medellin_stg enable row level security;

insert into public.usos_suelo
  (municipio, fuente, capa_origen, acuerdo, fecha_adopcion, fecha_actualizacion,
   area_general, subcategoria, cod_cat_uso, cod_subcat_uso, atributos, geom)
select
  'Medellín',
  'Alcaldía de Medellín – Departamento Administrativo de Planeación (servidor de mapas)',
  'VM_23_Uso_General_Suelo_Urbano / capa 2 UsosGnalesSueloUrbano',
  'Acuerdo 48 de 2014',
  s.fecha_adopcion,
  s.fecha_actualizacion,
  s.areagraluso,
  s.subcategoria,
  s.cod_cat_uso,
  s.cod_subcat_uso,
  to_jsonb(s) - 'geom',
  st_multi(st_collectionextract(st_makevalid(s.geom), 3))
from (
  select distinct on (objectid) *
  from public.usos_medellin_stg
  where geom is not null and not st_isempty(geom)
  order by objectid
) s
where not exists (
  select 1 from public.usos_suelo
  where capa_origen like 'VM_23_Uso_General_Suelo_Urbano%'
);

-- Verificación (debe coincidir con el diagnóstico 026a)
select
  count(*) as filas,
  count(*) filter (where st_isempty(geom)) as vacias,
  count(*) filter (where not st_isvalid(geom)) as invalidas,
  round((sum(st_area(geom::geography)) / 1e6)::numeric, 3) as suma_km2,
  string_agg(distinct coalesce(area_general, '(vacío)'), ' | ') as categorias
from public.usos_suelo
where capa_origen like 'VM_23_Uso_General_Suelo_Urbano%';

-- REVERSA (solo borra lo que insertó este script):
-- delete from public.usos_suelo where capa_origen like 'VM_23_Uso_General_Suelo_Urbano%';

-- LIMPIEZA (solo cuando hayas verificado todo; la temporal se puede recrear con ogr2ogr):
-- drop table public.usos_medellin_stg;