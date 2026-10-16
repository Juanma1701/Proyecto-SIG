create or replace function public.equipamientos_en_riesgo(
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
  equip as (
    select c.id,
           coalesce(c.propiedades->>'categoria', 'sin categoría') as categoria,
           ST_PointOnSurface(c.geom) as p
    from public.capas c, zona z
    where c.geom is not null
      and (c.nombre_capa like 'Equipamientos AMVA - %'
           or c.nombre_capa like 'Lugares OSM - %')
      and c.geom && z.g
      and ST_Intersects(c.geom, z.g)
  ),
  cruce as (
    select distinct e.id, e.categoria, s.categoria as suelo
    from equip e
    join public.suelo_pot s
      on s.categoria in ('proteccion', 'riesgo')
     and ST_Intersects(s.geom, e.p)
  )
  select jsonb_build_object(
    'total_equipamientos', (select count(*) from equip),
    'en_proteccion', (select count(distinct id) from cruce where suelo = 'proteccion'),
    'en_riesgo', (select count(distinct id) from cruce where suelo = 'riesgo'),
    'detalle', coalesce((
      select jsonb_agg(jsonb_build_object(
               'suelo', suelo, 'categoria', categoria, 'cantidad', cantidad))
      from (
        select suelo, categoria, count(*) as cantidad
        from cruce
        group by 1, 2
        order by 3 desc
      ) d
    ), '[]'::jsonb)
  )
$$;