-- 020: versión ligera (puntos) de equipamientos_en_zona + geometría bajo demanda.
-- No modifica ni borra funciones existentes.

CREATE OR REPLACE FUNCTION public.equipamientos_puntos_en_zona(
  p_lat double precision,
  p_lng double precision,
  p_radio_km double precision,
  p_max integer DEFAULT 5000
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $function$
  WITH origen AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS g
  ),
  sel AS (
    SELECT c.id, c.nombre_capa, c.propiedades, c.geom
    FROM capas c, origen o
    WHERE c.geom IS NOT NULL
      AND c.nombre_capa LIKE 'Equipamientos AMVA - %'
      AND ST_DWithin(c.geom::geography, o.g, least(greatest(p_radio_km, 0.05), 5) * 1000)
    LIMIT least(greatest(p_max, 1), 5000)
  )
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'type', 'Feature',
        'id', s.id::text,
        'geometry', ST_AsGeoJSON(ST_PointOnSurface(s.geom), 6)::jsonb,
        'properties', COALESCE(s.propiedades, '{}'::jsonb)
                      || jsonb_build_object('municipio', btrim(split_part(s.nombre_capa, ' - ', 2)))
      ))
      FROM sel s
    ), '[]'::jsonb),
    'municipiosDisponibles', COALESCE((
      SELECT jsonb_agg(DISTINCT btrim(split_part(nombre_capa, ' - ', 2)))
      FROM capas
      WHERE nombre_capa LIKE 'Equipamientos AMVA - %'
    ), '[]'::jsonb)
  );
$function$;

CREATE OR REPLACE FUNCTION public.equipamiento_geometria(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $function$
  SELECT jsonb_build_object(
    'type', 'Feature',
    'id', c.id::text,
    'geometry', ST_AsGeoJSON(c.geom, 6)::jsonb,
    'properties', COALESCE(c.propiedades, '{}'::jsonb)
  )
  FROM capas c
  WHERE c.id = p_id
    AND c.nombre_capa LIKE 'Equipamientos AMVA - %';
$function$;

GRANT EXECUTE ON FUNCTION public.equipamientos_puntos_en_zona(double precision, double precision, double precision, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.equipamiento_geometria(uuid) TO anon, authenticated;