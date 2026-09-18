-- ============================================================================
-- 10 consultas PostGIS/SQL — Equipamientos AMVA (Proyecto-SIG)
-- Tabla base: capas (una fila por feature, propiedades en jsonb)
-- Todas las consultas filtran por nombre_capa like 'Equipamientos AMVA - %'
-- para no mezclar con otras capas que se carguen a futuro en la misma tabla.
-- ============================================================================


-- 1) Conteo total de equipamientos por categoría (toda la región metropolitana)
select
  propiedades->>'categoria' as categoria,
  count(*) as total
from capas
where nombre_capa like 'Equipamientos AMVA - %'
group by categoria
order by total desc;


-- 2) Conteo de equipamientos por municipio
select
  propiedades->>'municipio' as municipio,
  count(*) as total
from capas
where nombre_capa like 'Equipamientos AMVA - %'
group by municipio
order by total desc;


-- 3) Equipamientos por categoría dentro de una zona guardada por el usuario
--    (join espacial con la tabla `zonas` existente de la app).
--    Las zonas de esta app NO son polígonos: se definen como un círculo
--    (centro_lat, centro_lng, radio_km). Por eso el join usa ST_DWithin
--    contra el centro, en vez de ST_Within contra un polígono — es más
--    preciso, porque no depende de aproximar el círculo con un buffer.
select
  z.nombre as zona,
  c.propiedades->>'categoria' as categoria,
  count(*) as total
from capas c
join zonas z
  on st_dwithin(
    c.geom::geography,
    st_setsrid(st_makepoint(z.centro_lng, z.centro_lat), 4326)::geography,
    z.radio_km * 1000  -- radio_km está en kilómetros, ST_DWithin en geography espera metros
  )
where c.nombre_capa like 'Equipamientos AMVA - %'
group by z.nombre, categoria
order by z.nombre, total desc;


-- 4) Los 10 equipamientos más cercanos a un punto dado
--    (ejemplo: Parque Berrío, Medellín — reemplazar coordenadas según el caso)
--    Usa el operador <-> que aprovecha el índice GiST (capas_geom_idx),
--    mucho más eficiente que calcular ST_Distance para todas las filas.
select
  propiedades->>'nombre' as nombre,
  propiedades->>'categoria' as categoria,
  propiedades->>'municipio' as municipio,
  round(
    st_distance(geom::geography, referencia.punto::geography)
  ) as distancia_metros
from capas,
  (select st_setsrid(st_makepoint(-75.5698, 6.2518), 4326) as punto) as referencia
where nombre_capa like 'Equipamientos AMVA - %'
order by geom <-> referencia.punto
limit 10;


-- 5) Equipamientos dentro de un radio de 500 metros de un punto
--    ST_DWithin con cast a geography para que la distancia esté en metros
--    reales (y no en grados, que sería el caso si se usara geometry directo).
select
  propiedades->>'nombre' as nombre,
  propiedades->>'categoria' as categoria,
  round(
    st_distance(
      geom::geography,
      st_setsrid(st_makepoint(-75.5698, 6.2518), 4326)::geography
    )
  ) as distancia_metros
from capas
where nombre_capa like 'Equipamientos AMVA - %'
  and st_dwithin(
    geom::geography,
    st_setsrid(st_makepoint(-75.5698, 6.2518), 4326)::geography,
    500
  )
order by distancia_metros;


-- 6) Vecino más cercano de la MISMA categoría, para cada equipamiento
--    (LATERAL JOIN: por cada fila de `a`, busca en `b` el más cercano
--    que no sea ella misma y que comparta categoría).
--    Se limita a 20 filas para que el resultado sea legible en el informe.
select
  a.propiedades->>'nombre' as equipamiento,
  a.propiedades->>'categoria' as categoria,
  vecino.nombre as vecino_mas_cercano,
  round(vecino.distancia) as distancia_metros
from capas a
cross join lateral (
  select
    b.propiedades->>'nombre' as nombre,
    st_distance(a.geom::geography, b.geom::geography) as distancia
  from capas b
  where b.nombre_capa like 'Equipamientos AMVA - %'
    and b.id <> a.id
    and b.propiedades->>'categoria' = a.propiedades->>'categoria'
  order by a.geom <-> b.geom
  limit 1
) as vecino
where a.nombre_capa like 'Equipamientos AMVA - %'
order by distancia_metros desc
limit 20;


-- 7) Densidad de equipamientos por municipio
--    Área aproximada = envolvente convexa de los puntos del municipio
--    (proxy razonable ya que aún no tenemos los polígonos reales de
--    límite municipal cargados en la BD).
select
  propiedades->>'municipio' as municipio,
  count(*) as total_equipamientos,
  round((st_area(st_convexhull(st_collect(geom))::geography) / 1000000)::numeric, 2) as area_aprox_km2,
  round(
    (count(*) / (st_area(st_convexhull(st_collect(geom))::geography) / 1000000))::numeric,
    2
  ) as densidad_por_km2
from capas
where nombre_capa like 'Equipamientos AMVA - %'
group by municipio
order by densidad_por_km2 desc;


-- 8) Centroide espacial de cada categoría
--    (el "centro de gravedad" geográfico de cada tipo de equipamiento
--    en toda el área metropolitana)
select
  propiedades->>'categoria' as categoria,
  st_astext(st_centroid(st_collect(geom))) as centroide_wkt,
  count(*) as total
from capas
where nombre_capa like 'Equipamientos AMVA - %'
group by categoria
order by total desc;


-- 9) Envolvente convexa y área total cubierta por el conjunto de datos
select
  st_astext(st_convexhull(st_collect(geom))) as envolvente_wkt,
  round((st_area(st_convexhull(st_collect(geom))::geography) / 1000000)::numeric, 2) as area_total_km2,
  count(*) as total_equipamientos
from capas
where nombre_capa like 'Equipamientos AMVA - %';


-- 10) Calidad de datos: equipamientos sin nombre identificado
--     (el script de carga marca con "Equipamiento sin nombre (...)"
--     cuando el AMVA no trae ningún campo reconocible de nombre)
select
  propiedades->>'municipio' as municipio,
  propiedades->>'categoria' as categoria,
  count(*) as total_sin_nombre
from capas
where nombre_capa like 'Equipamientos AMVA - %'
  and propiedades->>'nombre' like 'Equipamiento sin nombre%'
group by municipio, categoria
order by total_sin_nombre desc;
