-- 024: clasificación del suelo por anillos de distancia al centro de la zona. Función NUEVA.

create or replace function public.suelo_anillos_zona(
  p_lat double precision,
  p_lng double precision,
  p_radio_km double precision,
  p_anillos integer default 4
)
returns jsonb
language sql
stable
as $$
  with ajustes as (
    select least(greatest(p_radio_km, 0.05), 5) * 1000 as radio_m,
           least(greatest(p_anillos, 2), 6) as n
  ),
  centro as (
    select ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography as g
  ),
  zona as (
    select ST_Buffer(c.g, a.radio_m)::geometry as g
    from centro c, ajustes a
  ),
  anillos as (
    select k,
           a.radio_m * (k - 1) / a.n as desde_m,
           a.radio_m * k / a.n as hasta_m,
           case when k = 1
                then ST_Buffer(c.g, a.radio_m * k / a.n)::geometry
                else ST_Difference(
                       ST_Buffer(c.g, a.radio_m * k / a.n)::geometry,
                       ST_Buffer(c.g, a.radio_m * (k - 1) / a.n)::geometry)
           end as g
    from ajustes a, centro c, generate_series(1, a.n) as k
  ),
  anillos_a as (
    select k, desde_m, hasta_m, g, ST_Area(g::geography) as m2
    from anillos
  ),
  recortes as (
    select s.categoria,
           ST_CollectionExtract(ST_Intersection(s.geom, z.g), 3) as g
    from public.suelo_pot s, zona z
    where ST_Intersects(s.geom, z.g)
  ),
  por_cat as (
    select categoria,
           ST_CollectionExtract(ST_MakeValid(ST_Union(g)), 3) as g
    from recortes
    where g is not null and not ST_IsEmpty(g)
    group by categoria
  ),
  solape as (
    select ST_CollectionExtract(
             ST_Intersection(
               (select g from por_cat where categoria = 'urbano'),
               (select g from por_cat where categoria = 'rural')), 3) as g
  ),
  cruce as (
    select an.k, p.categoria,
           coalesce(ST_Area(ST_CollectionExtract(ST_Intersection(p.g, an.g), 3)::geography), 0) as m2
    from anillos_a an, por_cat p
  ),
  cruce_sol as (
    select an.k,
           coalesce(ST_Area(ST_CollectionExtract(ST_Intersection(s.g, an.g), 3)::geography), 0) as m2
    from anillos_a an, solape s
  ),
  resumen as (
    select an.k, an.desde_m, an.hasta_m, an.m2 as anillo_m2,
           coalesce((select c.m2 from cruce c where c.k = an.k and c.categoria = 'urbano'), 0) as urb_m2,
           coalesce((select c.m2 from cruce c where c.k = an.k and c.categoria = 'rural'), 0) as rur_m2,
           coalesce((select c.m2 from cruce_sol c where c.k = an.k), 0) as sol_m2
    from anillos_a an
  )
  select jsonb_build_object(
    'radio_km', round(((select radio_m from ajustes) / 1000)::numeric, 3),
    'anillos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'desde_m', round(b.desde_m::numeric, 0),
               'hasta_m', round(b.hasta_m::numeric, 0),
               'area_km2', round((b.anillo_m2 / 1e6)::numeric, 3),
               'predominante', case
                 when b.urb_m2 = 0 and b.rur_m2 = 0 then null
                 when b.urb_m2 >= b.rur_m2 then 'urbano'
                 else 'rural'
               end,
               'sin_clasificar_pct', round((
                 greatest(b.anillo_m2 - (b.urb_m2 + b.rur_m2 - b.sol_m2), 0) / b.anillo_m2 * 100
               )::numeric, 1),
               'clases', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'categoria', c.categoria,
                          'area_km2', round((c.m2 / 1e6)::numeric, 3),
                          'porcentaje_anillo', round((c.m2 / b.anillo_m2 * 100)::numeric, 1)
                        ) order by c.categoria)
                 from cruce c
                 where c.k = b.k and c.m2 > 0
               ), '[]'::jsonb)
             ) order by b.k)
      from resumen b
    ), '[]'::jsonb)
  )
$$;

-- REVERSA (por si algo sale mal):
-- drop function public.suelo_anillos_zona(double precision, double precision, double precision, integer);