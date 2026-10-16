CREATE OR REPLACE FUNCTION public.equipamientos_en_zona(p_lat double precision, p_lng double precision, p_radio_km double precision, p_max integer DEFAULT 5000)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  WITH zona AS (
    SELECT ST_Buffer(
             ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
             least(greatest(p_radio_km, 0.05), 5) * 1000
           )::geometry AS g
  ),
  sel AS (
    SELECT c.id, c.nombre_capa, c.propiedades, c.geom
    FROM capas c, zona z
    WHERE c.geom IS NOT NULL
      AND c.nombre_capa LIKE 'Equipamientos AMVA - %'
      AND c.geom && z.g
      AND ST_Intersects(c.geom, z.g)
    LIMIT least(greatest(p_max, 1), 5000)
  )
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'type', 'Feature',
        'id', s.id::text,
        'geometry', ST_AsGeoJSON(s.geom, 6)::jsonb,
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