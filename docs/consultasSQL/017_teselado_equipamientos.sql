create or replace function public.teselado_equipamientos(
  p_lat double precision,
  p_lng double precision,
  p_radio_km double precision,
  p_lado_m double precision default 500,
  p_categoria text default null
)
returns jsonb
language sql
stable
as $$
  with ajustes as (
    select least(greatest(p_radio_km, 0.05), 5) * 1000 as radio_m,
           least(greatest(p_lado_m, 200), 2000) as lado_m
  ),
  zona as (
    select ST_Buffer(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, a.radio_m)::geometry as g4326,
           a.lado_m
    from ajustes a
  ),
  zona_m as (
    select ST_Transform(g4326, 3116) as g, lado_m from zona
  ),
  celdas as (
    select h.i, h.j, h.geom
    from zona_m z, ST_HexagonGrid(z.lado_m, ST_Envelope(z.g)) as h
    where ST_Intersects(h.geom, z.g)
  ),
  equip as (
    select ST_Transform(ST_PointOnSurface(c.geom), 3116) as p
    from public.capas c, zona z
    where c.geom is not null
      and c.nombre_capa like 'Equipamientos AMVA - %'
      and c.geom && z.g4326
      and ST_Intersects(c.geom, z.g4326)
      and (p_categoria is null or c.propiedades->>'categoria' = p_categoria)
  ),
  conteo as (
    select ce.i, ce.j, ce.geom, count(e.p) as cantidad
    from celdas ce
    left join equip e on ST_Within(e.p, ce.geom)
    group by ce.i, ce.j, ce.geom
  )
  select jsonb_build_object(
    'type', 'FeatureCollection',
    'celdas_total', (select count(*) from conteo),
    'total_equipamientos', (select count(*) from equip),
    'max_cantidad', coalesce((select max(cantidad) from conteo), 0),
    'lado_m', (select lado_m from ajustes),
    'features', coalesce((
      select jsonb_agg(jsonb_build_object(
        'type', 'Feature',
        'geometry', ST_AsGeoJSON(ST_Transform(geom, 4326), 5)::jsonb,
        'properties', jsonb_build_object('cantidad', cantidad)
      ))
      from conteo where cantidad > 0
    ), '[]'::jsonb)
  )
$$;