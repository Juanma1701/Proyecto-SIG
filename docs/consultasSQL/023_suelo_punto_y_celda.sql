-- 023: consulta del suelo por punto (F) y por celda del teselado (D). Funciones NUEVAS.
-- Requiere la función auxiliar suelo_area_interseccion_m2 creada en la 022.

create or replace function public.suelo_en_punto(
  p_lat double precision,
  p_lng double precision,
  p_zona_lat double precision,
  p_zona_lng double precision,
  p_radio_km double precision
)
returns jsonb
language sql
stable
as $$
  with punto as (
    select ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326) as g
  ),
  zona as (
    select ST_Buffer(
             ST_SetSRID(ST_MakePoint(p_zona_lng, p_zona_lat), 4326)::geography,
             least(greatest(p_radio_km, 0.05), 5) * 1000
           )::geometry as g
  ),
  hallados as (
    select s.id, s.municipio, s.categoria, s.capa_origen, s.nombre, s.atributos, s.geom
    from public.suelo_pot s, punto p
    where ST_Intersects(s.geom, p.g)
    order by s.id
    limit 15
  )
  select jsonb_build_object(
    'punto', jsonb_build_object(
      'dentro_zona', (select ST_Intersects(z.g, p.g) from zona z, punto p),
      'distancia_centro_m', (
        select round(ST_Distance(
                 p.g::geography,
                 ST_SetSRID(ST_MakePoint(p_zona_lng, p_zona_lat), 4326)::geography
               )::numeric, 0)
        from punto p
      )
    ),
    'poligonos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', h.id,
               'municipio', h.municipio,
               'categoria', h.categoria,
               'capa_origen', h.capa_origen,
               'nombre', h.nombre,
               'atributos', h.atributos,
               'area_total_km2', round((ST_Area(h.geom::geography) / 1e6)::numeric, 3),
               'area_en_zona_km2', round((coalesce(
                  ST_Area(ST_CollectionExtract(ST_Intersection(h.geom, z.g), 3)::geography), 0
                ) / 1e6)::numeric, 3)
             ) order by h.categoria, h.id)
      from hallados h, zona z
    ), '[]'::jsonb)
  )
$$;

create or replace function public.suelo_en_celda(
  p_lat double precision,
  p_lng double precision,
  p_radio_km double precision,
  p_lado_m double precision,
  p_punto_lat double precision,
  p_punto_lng double precision
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
  -- misma celda que dibuja teselado_equipamientos (mismo grid y mismos parámetros)
  celda as (
    select h.geom as gm
    from zona_m z, ST_HexagonGrid(z.lado_m, ST_Envelope(z.g)) as h
    where ST_Intersects(h.geom, z.g)
      and ST_Intersects(h.geom, ST_Transform(ST_SetSRID(ST_MakePoint(p_punto_lng, p_punto_lat), 4326), 3116))
    order by h.i, h.j
    limit 1
  ),
  cz as (
    select ST_Transform(c.gm, 4326) as celda_g,
           ST_CollectionExtract(ST_Intersection(ST_Transform(c.gm, 4326), z.g4326), 3) as g,
           ST_Centroid(ST_Transform(c.gm, 4326)) as centro
    from celda c, zona z
  ),
  recortes as (
    select s.categoria,
           ST_CollectionExtract(ST_Intersection(s.geom, cz.g), 3) as g
    from public.suelo_pot s, cz
    where ST_Intersects(s.geom, cz.g)
  ),
  por_cat as (
    select categoria, count(*) as n_poligonos,
           ST_CollectionExtract(ST_MakeValid(ST_Union(g)), 3) as g
    from recortes
    where g is not null and not ST_IsEmpty(g)
    group by categoria
  ),
  areas as (
    select categoria, n_poligonos, ST_Area(g::geography) as m2
    from por_cat
    where g is not null and not ST_IsEmpty(g)
  ),
  geoms as (
    select (select g from por_cat where categoria = 'urbano') as urbano,
           (select g from por_cat where categoria = 'rural') as rural
  ),
  m as (
    select ST_Area(cz.g::geography) as dentro_m2,
           ST_Area(cz.celda_g::geography) as celda_m2,
           coalesce((select m2 from areas where categoria = 'urbano'), 0) as urb_m2,
           coalesce((select m2 from areas where categoria = 'rural'), 0) as rur_m2,
           public.suelo_area_interseccion_m2(geoms.urbano, geoms.rural) as sol_m2,
           ST_Distance(
             cz.centro::geography,
             ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
           ) as dist_m
    from cz, geoms
  ),
  -- equipamientos AMVA: misma definición que teselado_equipamientos; lugares OSM: puntos dentro de celda ∩ zona
  equip as (
    select coalesce(c.propiedades->>'categoria', 'sin categoría') as categoria,
           (c.nombre_capa like 'Lugares OSM - %') as es_lugar
    from public.capas c, zona z, celda ce, cz
    where c.geom is not null
      and c.geom && ST_Expand(cz.celda_g, 0.001)
      and (
        (c.nombre_capa like 'Equipamientos AMVA - %'
          and ST_Intersects(c.geom, z.g4326)
          and ST_Within(ST_Transform(ST_PointOnSurface(c.geom), 3116), ce.gm))
        or
        (c.nombre_capa like 'Lugares OSM - %'
          and ST_Intersects(c.geom, cz.g))
      )
  )
  select jsonb_build_object(
    'celda_km2', round((m.celda_m2 / 1e6)::numeric, 3),
    'dentro_zona_km2', round((m.dentro_m2 / 1e6)::numeric, 3),
    'dentro_zona_pct', round((m.dentro_m2 / nullif(m.celda_m2, 0) * 100)::numeric, 1),
    'distancia_centro_m', round(m.dist_m::numeric, 0),
    'clases', coalesce((
      select jsonb_agg(jsonb_build_object(
               'categoria', a.categoria,
               'poligonos', a.n_poligonos,
               'area_km2', round((a.m2 / 1e6)::numeric, 3),
               'porcentaje_celda', round((a.m2 / nullif(m.dentro_m2, 0) * 100)::numeric, 1)
             ) order by a.categoria)
      from areas a
    ), '[]'::jsonb),
    'base', jsonb_build_object(
      'predominante', case
        when m.urb_m2 = 0 and m.rur_m2 = 0 then null
        when m.urb_m2 >= m.rur_m2 then 'urbano'
        else 'rural'
      end,
      'sin_clasificar_pct', round((
        greatest(m.dentro_m2 - (m.urb_m2 + m.rur_m2 - m.sol_m2), 0) / nullif(m.dentro_m2, 0) * 100
      )::numeric, 1)
    ),
    'equipamientos', jsonb_build_object(
      'total', (select count(*) from equip where not es_lugar),
      'por_categoria', coalesce((
        select jsonb_agg(jsonb_build_object('categoria', categoria, 'cantidad', n) order by n desc)
        from (select categoria, count(*) as n from equip where not es_lugar group by categoria) t
      ), '[]'::jsonb)
    ),
    'lugares', jsonb_build_object(
      'total', (select count(*) from equip where es_lugar),
      'por_categoria', coalesce((
        select jsonb_agg(jsonb_build_object('categoria', categoria, 'cantidad', n) order by n desc)
        from (select categoria, count(*) as n from equip where es_lugar group by categoria) t
      ), '[]'::jsonb)
    )
  )
  from m
$$;

-- REVERSA (por si algo sale mal):
-- drop function public.suelo_en_celda(double precision, double precision, double precision, double precision, double precision, double precision);
-- drop function public.suelo_en_punto(double precision, double precision, double precision, double precision, double precision);