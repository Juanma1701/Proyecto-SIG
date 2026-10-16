create or replace function public.suelo_en_zona(
  p_lat double precision,
  p_lng double precision,
  p_radio_km double precision
) returns jsonb
language sql
stable
as $$
  with zona as (
    select ST_Buffer(
             ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
             least(greatest(p_radio_km, 0.05), 5) * 1000
           )::geometry as g
  ),
  recortes as (
    select s.categoria,
           ST_CollectionExtract(ST_Intersection(s.geom, z.g), 3) as g
    from public.suelo_pot s, zona z
    where ST_Intersects(s.geom, z.g)
  ),
  por_categoria as (
    select categoria,
           count(*) as n_poligonos,
           ST_CollectionExtract(ST_MakeValid(ST_Union(g)), 3) as g
    from recortes
    where g is not null and not ST_IsEmpty(g)
    group by categoria
  ),
  con_area as (
    select p.categoria, p.n_poligonos, p.g,
           ST_Area(p.g::geography) as area_m2,
           ST_Area(z.g::geography) as zona_m2
    from por_categoria p, zona z
    where p.g is not null and not ST_IsEmpty(p.g)
  )
  select jsonb_build_object(
    'type', 'FeatureCollection',
    'zona_km2', round((max(zona_m2) / 1e6)::numeric, 3),
    'features', coalesce(jsonb_agg(jsonb_build_object(
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(g, 5)::jsonb,
      'properties', jsonb_build_object(
        'categoria', categoria,
        'poligonos', n_poligonos,
        'area_km2', round((area_m2 / 1e6)::numeric, 3),
        'porcentaje_zona', round((area_m2 / zona_m2 * 100)::numeric, 1)
      )
    )), '[]'::jsonb)
  )
  from con_area
$$;