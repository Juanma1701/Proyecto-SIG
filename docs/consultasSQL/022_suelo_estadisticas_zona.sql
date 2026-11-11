-- 022: estadísticas del suelo por superficie (funciones NUEVAS, no modifican las existentes)

-- Auxiliar: área (m²) de la intersección de dos geometrías; 0 si falta alguna
create or replace function public.suelo_area_interseccion_m2(a geometry, b geometry)
returns double precision
language sql
immutable
as $$
  select case
    when a is null or b is null then 0
    else coalesce(ST_Area(ST_CollectionExtract(ST_Intersection(a, b), 3)::geography), 0)
  end
$$;

create or replace function public.suelo_estadisticas_zona(
  p_lat double precision,
  p_lng double precision,
  p_radio_km double precision
)
returns jsonb
language sql
stable
as $$
  with zona as (
    select ST_Buffer(
             ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
             least(greatest(p_radio_km, 0.05), 5) * 1000
           )::geometry as g
  ),
  base as (
    select s.categoria,
           ST_CollectionExtract(ST_Intersection(s.geom, z.g), 3) as g,
           translate(
             upper(concat_ws(' ',
               s.atributos->>'SIMBOLOGIA',
               s.atributos->>'EVENTO',
               s.atributos->>'TIPO_AMENAZA',
               s.atributos->>'CONDICION')),
             'ÁÉÍÓÚÜ', 'AEIOUU'
           ) as txt
    from public.suelo_pot s, zona z
    where ST_Intersects(s.geom, z.g)
  ),
  clasif as (
    select categoria, g,
           case categoria
             when 'urbano' then
               case when txt like '%EXPANSI%' then 'expansion' else 'urbano' end
             when 'rural' then
               case when txt like '%SUBURBANO%' then 'suburbano'
                    when txt like '%EXPANSI%' then 'expansion'
                    else 'rural' end
             when 'riesgo' then
               case
                 when (txt like '%MOVIMIENTO%' or txt like '%MASA%' or txt like '%DESLIZ%')
                      and txt like '%INUNDACI%' then 'varios_eventos'
                 when txt like '%MOVIMIENTO%' or txt like '%MASA%' or txt like '%DESLIZ%' then 'movimiento_en_masa'
                 when txt like '%INUNDACI%' then 'inundacion'
                 when txt like '%AVENIDA%' then 'avenidas_torrenciales'
                 when txt like '%POLIDUCTO%' then 'poliducto'
                 else 'sin_tipo'
               end
             else null
           end as sub
    from base
    where g is not null and not ST_IsEmpty(g)
  ),
  por_sub as (
    select categoria, sub, count(*) as n_poligonos,
           ST_CollectionExtract(ST_MakeValid(ST_Union(g)), 3) as g
    from clasif
    group by categoria, sub
  ),
  por_cat as (
    select categoria, sum(n_poligonos) as n_poligonos,
           ST_CollectionExtract(ST_MakeValid(ST_Union(g)), 3) as g
    from por_sub
    group by categoria
  ),
  areas as (
    select categoria, n_poligonos, ST_Area(g::geography) as m2
    from por_cat
    where g is not null and not ST_IsEmpty(g)
  ),
  sub_areas as (
    select categoria, sub, n_poligonos, ST_Area(g::geography) as m2
    from por_sub
    where sub is not null and g is not null and not ST_IsEmpty(g)
  ),
  gm as (
    select
      (select g from por_cat where categoria = 'urbano') as urbano,
      (select g from por_cat where categoria = 'rural') as rural,
      (select g from por_cat where categoria = 'proteccion') as proteccion,
      (select g from por_cat where categoria = 'riesgo') as riesgo
  ),
  metricas as (
    select
      ST_Area(z.g::geography) as zona_m2,
      coalesce((select m2 from areas where categoria = 'urbano'), 0) as urb_m2,
      coalesce((select m2 from areas where categoria = 'rural'), 0) as rur_m2,
      public.suelo_area_interseccion_m2(gm.urbano, gm.rural) as urb_rur_m2,
      public.suelo_area_interseccion_m2(gm.urbano, gm.proteccion) as urb_prot_m2,
      public.suelo_area_interseccion_m2(gm.urbano, gm.riesgo) as urb_ries_m2,
      public.suelo_area_interseccion_m2(gm.rural, gm.proteccion) as rur_prot_m2,
      public.suelo_area_interseccion_m2(gm.rural, gm.riesgo) as rur_ries_m2,
      public.suelo_area_interseccion_m2(gm.proteccion, gm.riesgo) as prot_ries_m2
    from zona z, gm
  )
  select jsonb_build_object(
    'zona_km2', round((m.zona_m2 / 1e6)::numeric, 3),
    'clases', coalesce((
      select jsonb_agg(jsonb_build_object(
               'categoria', a.categoria,
               'poligonos', a.n_poligonos,
               'area_km2', round((a.m2 / 1e6)::numeric, 3),
               'porcentaje_zona', round((a.m2 / m.zona_m2 * 100)::numeric, 1)
             ) order by a.categoria)
      from areas a
    ), '[]'::jsonb),
    'subclases', coalesce((
      select jsonb_agg(jsonb_build_object(
               'categoria', sa.categoria,
               'subclase', sa.sub,
               'poligonos', sa.n_poligonos,
               'area_km2', round((sa.m2 / 1e6)::numeric, 3),
               'porcentaje_zona', round((sa.m2 / m.zona_m2 * 100)::numeric, 1)
             ) order by sa.categoria, sa.m2 desc)
      from sub_areas sa
    ), '[]'::jsonb),
    'base', jsonb_build_object(
      'urbano_km2', round((m.urb_m2 / 1e6)::numeric, 3),
      'rural_km2', round((m.rur_m2 / 1e6)::numeric, 3),
      'solape_urbano_rural_km2', round((m.urb_rur_m2 / 1e6)::numeric, 3),
      'clasificada_km2', round((greatest(m.urb_m2 + m.rur_m2 - m.urb_rur_m2, 0) / 1e6)::numeric, 3),
      'sin_clasificar_km2', round((greatest(m.zona_m2 - (m.urb_m2 + m.rur_m2 - m.urb_rur_m2), 0) / 1e6)::numeric, 3),
      'sin_clasificar_pct', round((greatest(m.zona_m2 - (m.urb_m2 + m.rur_m2 - m.urb_rur_m2), 0) / m.zona_m2 * 100)::numeric, 1),
      'predominante', case
        when m.urb_m2 = 0 and m.rur_m2 = 0 then null
        when m.urb_m2 >= m.rur_m2 then 'urbano'
        else 'rural'
      end
    ),
    'combinaciones', coalesce((
      select jsonb_agg(jsonb_build_object(
               'a', c.a, 'b', c.b,
               'area_km2', round((c.m2 / 1e6)::numeric, 3),
               'porcentaje_zona', round((c.m2 / m.zona_m2 * 100)::numeric, 1)
             ) order by c.m2 desc)
      from (values
        ('urbano', 'proteccion', m.urb_prot_m2),
        ('urbano', 'riesgo', m.urb_ries_m2),
        ('rural', 'proteccion', m.rur_prot_m2),
        ('rural', 'riesgo', m.rur_ries_m2),
        ('proteccion', 'riesgo', m.prot_ries_m2)
      ) as c(a, b, m2)
      where c.m2 > 0
    ), '[]'::jsonb)
  )
  from metricas m
$$;

-- REVERSA (por si algo sale mal):
-- drop function public.suelo_estadisticas_zona(double precision, double precision, double precision);
-- drop function public.suelo_area_interseccion_m2(geometry, geometry);