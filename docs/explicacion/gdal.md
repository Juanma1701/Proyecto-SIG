LISTA DE COMANDOS PARA EL ANALISIS CON GDAL

cd /d C:\Proyectos\Proyecto_SIG

set PGPASSWORD=password

ogr2ogr -f GPKG cobertura_salud.gpkg PG:"host=HOST port=5432 dbname=postgres user=USER sslmode=require" -sql "select ST_GeomFromGeoJSON((cobertura_servicio(6.25,-75.56,2,'SALUD',500)->'geometry')::text) as geom, 'sin cobertura de salud a 500 m' as descripcion" -nln deficit_salud -nlt PROMOTE_TO_MULTI -a_srs EPSG:4326

ogrinfo -so cobertura_salud.gpkg deficit_salud