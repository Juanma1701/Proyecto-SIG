-- 029_usos_consolidado.sql
-- Estado final de los usos del suelo oficiales (Medellín, POT 48 de 2014) tras 025-028.
-- Se puede ejecutar varias veces sin romper nada (cada paso comprueba si ya está hecho).
-- Reemplaza 029a-029e y reemplaza usos_mapa_zona de 028.
-- Requiere: 025 (tabla usos_suelo) y 026b (datos cargados).
-- Notas del diagnóstico: 1141 pares de polígonos se solapan (0.01508 km², 0.016 % de la capa);
-- por eso 'solape_km2' se devuelve como null (no se calcula por zona).

set statement_timeout = '15min';

-- 1) Área de cada polígono, calculada una sola vez (geodésica, m²)
alter table public.usos_suelo add column if not exists area_m2 double precision;
update public.usos_suelo set area_m2 = st_area(geom::geography) where area_m2 is null;

-- 2) Geometría para DIBUJAR: una por categoría, disuelta, simplificada (~4 m) y partida en trozos
create table if not exists public.usos_suelo_mapa (
  id bigserial primary key,
  area_general text not null,
  geom geometry(Geometry, 4326) not null
);
create index if not exists usos_suelo_mapa_geom_idx on public.usos_suelo_mapa using gist (geom);
create index if not exists usos_suelo_mapa_area_idx on public.usos_suelo_mapa (area_general);

alter table public.usos_suelo_mapa enable row level security;
drop policy if exists "Lectura publica de usos_suelo_mapa" on public.usos_suelo_mapa;
create policy "Lectura publica de usos_suelo_mapa" on public.usos_suelo_mapa for select using (true);

-- Solo se llena si está vacía (para rehacerla: truncate public.usos_suelo_mapa; y volver a correr esto)
insert into public.usos_suelo_mapa (area_general, geom)
select d.area_general, st_subdivide(d.g, 256)
from (
  select coalesce(area_general, '(sin categoría)') as area_general,
         st_simplifypreservetopology(st_unaryunion(st_collect(geom)), 0.00004) as g
  from public.usos_suelo
  group by 1
) d
where not exists (select 1 from public.usos_suelo_mapa);

-- 3) Estadísticas por zona (geometría ORIGINAL; solo se recortan los polígonos del borde)
create or replace function public.usos_estadisticas_zona(
  p_lat double precision, p_lng double precision, p_radio_km double precision
)
returns jsonb
language sql stable as $$
  with par as (select least(greatest(p_radio_km, 0.1), 5) as r),
  zona as (
    select st_buffer(
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, par.r * 1000
    )::geometry as g
    from par
  ),
  zm as (select st_area(g::geography) as m2 from zona),
  cand as (
    select coalesce(u.area_general, '(sin categoría)') as area_general,
           u.subcategoria, u.area_m2, u.geom,
           st_covers(z.g, u.geom) as dentro
    from public.usos_suelo u, zona z
    where u.geom && z.g
  ),
  piezas as (
    select area_general, subcategoria, area_m2 as a
    from cand where dentro
    union all
    select c.area_general, c.subcategoria,
           st_area(st_collectionextract(st_intersection(c.geom, z.g), 3)::geography) as a
    from cand c, zona z
    where not c.dentro and st_intersects(c.geom, z.g)
  ),
  pos as (select * from piezas where a > 0),
  cat as (
    select area_general, sum(a) as a, count(*) as n from pos group by area_general
  ),
  sub as (
    select area_general, subcategoria, sum(a) as a from pos group by area_general, subcategoria
  ),
  tot as (select coalesce(sum(a), 0) as m2 from pos)
  select jsonb_build_object(
    'radio_km', (select r from par),
    'zona_km2', round(((select m2 from zm) / 1e6)::numeric, 4),
    'cubierto_km2', round(((select m2 from tot) / 1e6)::numeric, 4),
    'sin_dato_km2', round((greatest((select m2 from zm) - (select m2 from tot), 0) / 1e6)::numeric, 4),
    'solape_km2', null,
    'predominante', (select area_general from cat order by a desc limit 1),
    'por_area', coalesce((
      select jsonb_agg(jsonb_build_object(
        'area_general', area_general,
        'km2', round((a / 1e6)::numeric, 4),
        'pct_zona', round((100 * a / (select m2 from zm))::numeric, 2),
        'pct_cubierto', round((100 * a / nullif((select m2 from tot), 0))::numeric, 2),
        'fragmentos', n
      ) order by a desc) from cat
    ), '[]'::jsonb),
    'por_subcategoria', coalesce((
      select jsonb_agg(jsonb_build_object(
        'area_general', area_general,
        'subcategoria', subcategoria,
        'km2', round((a / 1e6)::numeric, 4),
        'pct_zona', round((100 * a / (select m2 from zm))::numeric, 2)
      ) order by a desc) from sub
    ), '[]'::jsonb)
  );
$$;

-- 4) GeoJSON para el mapa (usa el dibujo simplificado; solo se recortan los trozos del borde)
-- Nota: el MultiPolygon resultante tiene trozos pegados (técnicamente no es válido),
-- pero Leaflet lo dibuja sin problema; solo se usa para mostrar.
create or replace function public.usos_mapa_zona(
  p_lat double precision, p_lng double precision, p_radio_km double precision
)
returns jsonb
language sql stable as $$
  with par as (select least(greatest(p_radio_km, 0.1), 5) as r),
  z as (
    select st_buffer(
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, par.r * 1000
    )::geometry as g
    from par
  ),
  piezas as (
    select m.area_general,
           case when st_covers(z.g, m.geom) then m.geom
                else st_collectionextract(st_intersection(m.geom, z.g), 3)
           end as g
    from public.usos_suelo_mapa m, z
    where m.geom && z.g and st_intersects(m.geom, z.g)
  ),
  por_cat as (
    select p.area_general, st_collectionextract(st_collect(p.g), 3) as g
    from piezas p
    where not st_isempty(p.g)
    group by p.area_general
  )
  select jsonb_build_object(
    'type', 'FeatureCollection',
    'features', coalesce(jsonb_agg(jsonb_build_object(
      'type', 'Feature',
      'properties', jsonb_build_object('area_general', c.area_general),
      'geometry', st_asgeojson(c.g, 5)::jsonb
    )), '[]'::jsonb)
  )
  from por_cat c
  where not st_isempty(c.g);
$$;

grant execute on function public.usos_estadisticas_zona(double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.usos_mapa_zona(double precision, double precision, double precision) to anon, authenticated;

-- REVERSA (en este orden):
-- drop table public.usos_suelo_mapa;
-- alter table public.usos_suelo drop column area_m2;
-- (después hay que volver a correr 027 y 028 para recuperar las funciones lentas anteriores)