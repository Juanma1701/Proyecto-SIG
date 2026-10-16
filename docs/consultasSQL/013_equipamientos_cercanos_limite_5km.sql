CREATE OR REPLACE FUNCTION public.equipamientos_cercanos(p_lat double precision, p_lng double precision, p_radio_m integer DEFAULT 1000, p_limite integer DEFAULT 20)
 RETURNS TABLE(id text, nombre_capa text, propiedades jsonb, tipo_geom text, distancia_m double precision, lat double precision, lng double precision, geojson jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  WITH origen AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326) AS g
  )
  SELECT
    c.id::text,
    c.nombre_capa,
    c.propiedades,
    GeometryType(c.geom),
    ST_Distance(c.geom::geography, o.g::geography),
    ST_Y(ST_PointOnSurface(c.geom)),
    ST_X(ST_PointOnSurface(c.geom)),
    CASE
      WHEN GeometryType(c.geom) LIKE '%POINT' THEN NULL
      ELSE ST_AsGeoJSON(ST_SimplifyPreserveTopology(c.geom, 0.00002))::jsonb
    END
  FROM capas c, origen o
  WHERE c.geom IS NOT NULL
    AND (c.nombre_capa LIKE 'Equipamientos AMVA - %'
         OR c.nombre_capa = 'Lugares OSM - Bello')
    AND ST_DWithin(c.geom::geography, o.g::geography, least(greatest(p_radio_m, 1), 5000))
  ORDER BY 5
  LIMIT least(greatest(p_limite, 1), 200);
$function$;