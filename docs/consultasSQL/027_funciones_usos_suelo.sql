-- C:/Proyectos/Proyecto_SIG/docs/consultasSQL/027_funciones_usos_suelo.sql
-- Solo crea funciones NUEVAS. No reemplaza ninguna existente.
-- Tope de radio: 5 km. Áreas geodésicas (geography).

-- 1) Polígonos de uso recortados a la zona (para dibujar en el mapa)
create or replace function public.usos_en_zona(
  p_lat double precision, p_lng double precision, p_radio_km double precision
)
returns table (
  id bigint, municipio text, area_general text, subcategoria text,
  cod_cat_uso integer, cod_subcat_uso integer,
  area_km2 double precision, geojson jsonb
)
language sql stable as $$
  with z as (
    select st_buffer(
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      least(greatest(p_radio_km, 0.1), 5) * 1000
    )::geometry as g
  ),
  r as (
    select u.id, u.municipio, u.area_general, u.subcategoria,
           u.cod_cat_uso, u.cod_subcat_uso,
           st_collectionextract(st_intersection(u.geom, z.g), 3) as g
    from public.usos_suelo u, z
    where u.geom && z.g and st_intersects(u.geom, z.g)
  )
  select r.id, r.municipio, r.area_general, r.subcategoria,
         r.cod_cat_uso, r.cod_subcat_uso,
         st_area(r.g::geography) / 1e6,
         st_asgeojson(r.g, 5)::jsonb
  from r
  where not st_isempty(r.g);
$$;

-- 2) Estadísticas por zona (km² y % por categoría oficial y subcategoría)
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
  rec as (
    select coalesce(u.area_general, '(sin categoría)') as area_general,
           u.subcategoria,
           st_collectionextract(st_intersection(u.geom, z.g), 3) as g
    from public.usos_suelo u, zona z
    where u.geom && z.g and st_intersects(u.geom, z.g)
  ),
  rec2 as (
    select area_general, subcategoria, g, st_area(g::geography) as a
    from rec where not st_isempty(g)
  ),
  uni as (select coalesce(st_area(st_union(g)::geography), 0) as m2 from rec2),
  cat as (
    select area_general, sum(a) as a, count(*) as n from rec2 group by area_general
  ),
  sub as (
    select area_general, subcategoria, sum(a) as a
    from rec2 group by area_general, subcategoria
  )
  select jsonb_build_object(
    'radio_km', (select r from par),
    'zona_km2', round(((select m2 from zm) / 1e6)::numeric, 4),
    'cubierto_km2', round(((select m2 from uni) / 1e6)::numeric, 4),
    'sin_dato_km2', round((((select m2 from zm) - (select m2 from uni)) / 1e6)::numeric, 4),
    'solape_km2', round((greatest(coalesce((select sum(a) from cat), 0) - (select m2 from uni), 0) / 1e6)::numeric, 4),
    'predominante', (select area_general from cat order by a desc limit 1),
    'por_area', coalesce((
      select jsonb_agg(jsonb_build_object(
        'area_general', area_general,
        'km2', round((a / 1e6)::numeric, 4),
        'pct_zona', round((100 * a / (select m2 from zm))::numeric, 2),
        'pct_cubierto', round((100 * a / nullif((select m2 from uni), 0))::numeric, 2),
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

-- 3) Uso oficial en un punto (atributos ORIGINALES, sin renombrar)
create or replace function public.usos_en_punto(
  p_lat double precision, p_lng double precision
)
returns table (
  id bigint, municipio text, fuente text, capa_origen text, acuerdo text,
  fecha_adopcion date, fecha_actualizacion date,
  area_general text, subcategoria text,
  cod_cat_uso integer, cod_subcat_uso integer, atributos jsonb
)
language sql stable as $$
  select u.id, u.municipio, u.fuente, u.capa_origen, u.acuerdo,
         u.fecha_adopcion, u.fecha_actualizacion,
         u.area_general, u.subcategoria, u.cod_cat_uso, u.cod_subcat_uso, u.atributos
  from public.usos_suelo u
  where st_intersects(u.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326));
$$;

grant execute on function public.usos_en_zona(double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.usos_estadisticas_zona(double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.usos_en_punto(double precision, double precision) to anon, authenticated;

-- REVERSA:
-- drop function public.usos_en_zona(double precision, double precision, double precision);
-- drop function public.usos_estadisticas_zona(double precision, double precision, double precision);
-- drop function public.usos_en_punto(double precision, double precision);