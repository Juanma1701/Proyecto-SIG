-- 028: GeoJSON de usos del suelo para el mapa, UNA feature por categoría oficial.
-- Función NUEVA: no toca ninguna existente. Radio máximo 5 km.

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
  agrupado as (
    select coalesce(u.area_general, '(sin categoría)') as area_general,
           count(*) as fragmentos,
           st_union(u.geom) as g
    from public.usos_suelo u, z
    where u.geom && z.g and st_intersects(u.geom, z.g)
    group by 1
  ),
  recortado as (
    select a.area_general, a.fragmentos,
           st_collectionextract(st_intersection(a.g, z.g), 3) as g
    from agrupado a, z
  )
  select jsonb_build_object(
    'type', 'FeatureCollection',
    'features', coalesce(jsonb_agg(jsonb_build_object(
      'type', 'Feature',
      'properties', jsonb_build_object(
        'area_general', r.area_general,
        'fragmentos', r.fragmentos,
        'km2', round((st_area(r.g::geography) / 1e6)::numeric, 4)
      ),
      'geometry', st_asgeojson(r.g, 5)::jsonb
    )), '[]'::jsonb)
  )
  from recortado r
  where not st_isempty(r.g);
$$;

grant execute on function public.usos_mapa_zona(double precision, double precision, double precision) to anon, authenticated;

-- REVERSA:
-- drop function public.usos_mapa_zona(double precision, double precision, double precision);