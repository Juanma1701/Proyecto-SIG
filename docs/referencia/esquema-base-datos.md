# Esquema de base de datos

## Extensión requerida

```sql
create extension if not exists postgis;
```

## Tabla `capas`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Identificador generado automáticamente |
| `nombre` | text | Nombre del archivo original |
| `descripcion` | text | Opcional |
| `srid_original` | integer | EPSG con el que llegó el archivo |
| `tipo_geometria` | text | Point, LineString, Polygon, etc. |
| `geom` | geometry(Geometry, 4326) | Geometría normalizada a WGS84 |
| `archivo_original` | text | Ruta en Supabase Storage |
| `formato_origen` | text | geojson \| shapefile \| kml |
| `creado_en` | timestamptz | Fecha de creación |

Índice espacial: `gist (geom)`.

## Tabla `coordenadas_capturadas`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Identificador generado automáticamente |
| `nombre` | text | Opcional |
| `geom` | geometry(Point, 4326) | Punto capturado por click en el mapa |
| `srid_mostrado` | integer | Por defecto 4326 |
| `creado_en` | timestamptz | Fecha de captura |

## Funciones RPC

### `insertar_capa(p_nombre, p_geojson, p_srid_original, p_formato) → uuid`
Inserta una capa reproyectando su geometría desde `p_srid_original` a 4326. Devuelve el `id` insertado.

### `obtener_capa_reproyectada(p_id, p_srid_salida) → jsonb`
Devuelve el GeoJSON de una capa reproyectado al SRID de salida solicitado.

### `obtener_srid_original(p_id) → integer`
Devuelve el SRID original guardado como metadato de una capa.

## Políticas RLS

```sql
alter table capas enable row level security;

create policy "Lectura pública de capas" on capas for select using (true);
create policy "Insercion publica de capas" on capas for insert with check (true);
```

Storage (bucket `archivos-capas`):
```sql
create policy "Subida publica de archivos" on storage.objects for insert
  with check (bucket_id = 'archivos-capas');
create policy "Lectura publica de archivos" on storage.objects for select
  using (bucket_id = 'archivos-capas');
```