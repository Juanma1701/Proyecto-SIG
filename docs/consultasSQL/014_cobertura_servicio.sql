create or replace function public.cobertura_servicio(
  p_lat double precision,
  p_lng double precision,
  p_radio_km double precision,
  p_categoria text,
  p_buffer_m integer default 1000
) returns jsonb
language sql
stable
as $$
  with params as (
    select least(greatest(p_radio_km, 0.05), 5) as r,
           least(greatest(p_buffer_m, 100), 3000) as b
  ),
  zona as (
    select ST_Buffer(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
                     r * 1000)::geometry as g,
           b
    from params
  ),
  puntos as (
    select ST_PointOnSurface(c.geom) as p
    from public.capas c, zona z
    where c.geom is not null
      and (c.nombre_capa like 'Equipamientos AMVA - %'
           or c.nombre_capa like 'Lugares OSM - %')
      and upper(c.propiedades->>'categoria') = upper(p_categoria)
      and ST_DWithin(c.geom::geography, z.g::geography, z.b)
  ),
  cobertura as (
    select ST_Union(ST_Buffer(p::geography, (select b from params))::geometry) as g
    from puntos
  ),
  resultado as (
    select z.g as zona,
           ST_CollectionExtract(coalesce(ST_Difference(z.g, c.g), z.g), 3) as deficit,
           (select count(*) from puntos) as n
    from zona z, cobertura c
  )
  select jsonb_build_object(
    'n_servicios', n,
    'zona_km2', round((ST_Area(zona::geography) / 1e6)::numeric, 3),
    'deficit_km2', round((ST_Area(deficit::geography) / 1e6)::numeric, 3),
    'cobertura_pct', round((100 - ST_Area(deficit::geography) / ST_Area(zona::geography) * 100)::numeric, 1),
    'geometry', case when ST_IsEmpty(deficit) then null else ST_AsGeoJSON(deficit, 5)::jsonb end
  )
  from resultado
$$;