-- 032: borra la tabla temporal de la carga de usos.
-- YA EJECUTADO el 7 de noviembre de 2026. No volver a correr.
-- Antes: usos_suelo = 25.434 filas, usos_suelo_mapa = 24.749, base = 181 MB.
-- Después: mismas filas, base = 149 MB.
-- Sin reversa: si hiciera falta, los 255 archivos pagina_NNNN.geojson siguen en
-- data/usos_medellin y se pueden volver a cargar con ogr2ogr.

drop table public.usos_medellin_stg;