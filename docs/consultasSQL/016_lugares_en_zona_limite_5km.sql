CREATE OR REPLACE FUNCTION public.lugares_en_zona(p_lat double precision, p_lng double precision, p_radio_km double precision, p_max integer DEFAULT 3000)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  WITH origen AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS g
  ),
  sel AS (
    SELECT c.id, c.propiedades, c.geom
    FROM capas c, origen o
    WHERE c.geom IS NOT NULL
      AND c.nombre_capa LIKE 'Lugares OSM - %'
      AND ST_DWithin(c.geom::geography, o.g, least(greatest(p_radio_km, 0.05), 5) * 1000)
    LIMIT least(greatest(p_max, 1), 3000)
  )
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'type', 'Feature',
        'id', s.id::text,
        'geometry', ST_AsGeoJSON(s.geom, 6)::jsonb,
        'properties', COALESCE(s.propiedades, '{}'::jsonb)
      ))
      FROM sel s
    ), '[]'::jsonb),
    'municipiosCargados', COALESCE((
      SELECT jsonb_agg(DISTINCT btrim(split_part(nombre_capa, ' - ', 2)))
      FROM capas
      WHERE nombre_capa LIKE 'Lugares OSM - %'
    ), '[]'::jsonb)
  );
$function$;