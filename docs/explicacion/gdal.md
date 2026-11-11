# GDAL en el proyecto

GDAL (`ogr2ogr` y `ogrinfo`) se usa **fuera de la aplicación**, en Windows con la OSGeo4W Shell, para dos cosas:

1. **Cargar datos oficiales a Supabase** (los usos del suelo de Medellín).
2. **Exportar un resultado de PostGIS a un archivo GeoPackage** para mostrarlo en QGIS.

El flujo de análisis es: **PostGIS calcula, `ogr2ogr` exporta a GeoPackage y QGIS lo muestra.**

## Exportar un resultado a GeoPackage

Ejemplo: la parte de una zona que no queda a 500 m de un servicio de salud (función `cobertura_servicio`, centro 6.25, -75.56, radio 2 km).

```
cd /d C:\Proyectos\Proyecto_SIG

set PGPASSWORD=password

ogr2ogr -f GPKG cobertura_salud.gpkg PG:"host=HOST port=5432 dbname=postgres user=USER sslmode=require" -sql "select ST_GeomFromGeoJSON((cobertura_servicio(6.25,-75.56,2,'SALUD',500)->'geometry')::text) as geom, 'sin cobertura de salud a 500 m' as descripcion" -nln deficit_salud -nlt PROMOTE_TO_MULTI -a_srs EPSG:4326

ogrinfo -so cobertura_salud.gpkg deficit_salud
```

Qué hace cada parte:

| Parte | Para qué |
|---|---|
| `set PGPASSWORD=...` | Entrega la contraseña de la base sin escribirla en el comando. Sustituye `password`, `HOST` y `USER` por los datos de la conexión de Supabase |
| `-f GPKG cobertura_salud.gpkg` | Formato y nombre del archivo de salida |
| `PG:"..."` | Conexión a la base (`sslmode=require` es obligatorio en Supabase) |
| `-sql "select ..."` | La consulta: llama a la función de PostGIS y convierte su GeoJSON en geometría |
| `-nln deficit_salud` | Nombre de la capa dentro del GeoPackage |
| `-nlt PROMOTE_TO_MULTI` | Guarda las geometrías como multi-polígono |
| `-a_srs EPSG:4326` | Sistema de referencia de la salida |
| `ogrinfo -so ...` | Muestra un resumen de la capa (tipo de geometría, número de elementos y extensión) para comprobar que salió bien |

Después se abre `cobertura_salud.gpkg` en QGIS (Capa → Añadir capa → Añadir capa vectorial).

**Seguridad:** la contraseña no se escribe en archivos ni se sube al repositorio. Se define con `set PGPASSWORD=` en la sesión de la consola, que se pierde al cerrarla.

## Carga de los usos del suelo de Medellín

Los 25.434 polígonos de usos se cargaron en cuatro pasos:

1. **Descarga:** `docs/scripts/descargar-usos-medellin.ps1` baja el servicio de la Alcaldía por páginas y las guarda como `data/usos_medellin/pagina_NNNN.geojson` (255 archivos). Reanuda si se corta, y pide registro por registro las páginas que fallan. Quedaron 12 polígonos sin descargar, porque el servidor devolvió error al pedirlos.
2. **Carga a una tabla temporal:** `ogr2ogr` carga cada página en `usos_medellin_stg`. Supabase no da superusuario, así que `ogr2ogr` mostró un aviso del event trigger `ogr_system_tables`, pero la carga se completó.
3. **Inserción final:** el script SQL `026b_cargar_usos_suelo_medellin.sql` copia la tabla temporal a `usos_suelo` reparando geometrías (`st_makevalid`) y validando que no haya duplicados.
4. **Limpieza:** se verifican las 25.434 filas y se borra la tabla temporal (`032_borrar_temporal_usos.sql`).

`docs/scripts/diagnosticar-usos-medellin.ps1` sirve para revisar la descarga antes de cargarla. El resto del proceso está en `docs/consultasSQL/` (scripts 025 a 029).

## Qué se sube al repositorio y qué no

- Los archivos descargados (`data/usos_medellin`) **no** se suben (están en `.gitignore`): se pueden volver a generar con `docs/scripts/descargar-usos-medellin.ps1`.
- Los GeoPackage de ejemplo (`cobertura_salud.gpkg`, `riesgo_sabaneta.gpkg` y `suelo_sabaneta.gpkg`, de 0,1 a 1,25 MB cada uno) **sí** están en el repositorio, para abrirlos directamente en QGIS.