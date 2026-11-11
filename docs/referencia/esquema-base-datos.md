# Esquema de base de datos

Base: Supabase (PostgreSQL + PostGIS 3.3). La geometría se guarda en WGS84 (EPSG:4326). Local y producción usan **la misma base**: cualquier cambio queda en vivo para los dos.

Los scripts SQL numerados están en `docs/consultasSQL/` y **ya están aplicados**. No los vuelvas a ejecutar sin leerlos antes: algunos reemplazan datos o funciones. Para cambios nuevos, crea funciones NUEVAS en lugar de reemplazar las existentes.

## Extensión requerida

```sql
create extension if not exists postgis;
```

## Tablas

### `capas`

Guarda los equipamientos del AMVA, los lugares de OpenStreetMap y las capas que suben los usuarios (una fila por elemento). Al 7 de noviembre de 2026: 3.487 equipamientos AMVA y 1.813 lugares OSM.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Identificador |
| `nombre` | text | Nombre del elemento ("Sin nombre" si la fuente no lo trae) |
| `descripcion` | text | Opcional |
| `srid_original` | integer | EPSG con el que llegó el dato |
| `tipo_geometria` | text | Point, LineString, Polygon, etc. |
| `geom` | geometry | Geometría en WGS84 |
| `archivo_original` | text | Ruta del archivo original, si se guardó |
| `formato_origen` | text | geojson, shapefile, kml… |
| `creado_en` | timestamptz | Fecha de creación |
| `propiedades` | jsonb | Atributos originales y los que agrega la carga (`categoria`, `direccion`, `telefono`, `website`, `municipio`) |
| `nombre_capa` | text | Grupo de la fila: `Equipamientos AMVA - <Municipio>`, `Lugares OSM - <Municipio>` o el nombre de una capa de usuario |
| `user_id` | uuid | Dueño de la fila (por defecto, `auth.uid()`) |

Índices: `capas_pkey` (id), `capas_geom_idx` (gist sobre `geom`) y `capas_geog_idx` (gist sobre `geom::geography`).

### `suelo_pot`

Clasificación del suelo del POT para los 10 municipios (copia de las capas del POT del AMVA). 12.095 polígonos MULTIPOLYGON: protección 7.862, riesgo 2.989, rural 950, urbano 294. Geometría simplificada (~5 m).

Columnas usadas por la aplicación: `id`, `municipio`, `categoria` (urbano, rural, protección, riesgo), `capa_origen`, `nombre`, `atributos` (atributos originales, entre ellos `SIMBOLOGIA`) y `geom`.

Índices: gist sobre `geom`, btree sobre `(municipio, categoria)` y la clave primaria.

Es **clasificación** del suelo, no uso. Las clases se superponen: protección y riesgo cubren parte del suelo urbano y rural.

Compilación del AMVA de septiembre de 2022, con datos de las alcaldías.

### `usos_suelo`

Usos generales del suelo urbano de Medellín (POT, Acuerdo 48 de 2014). 25.434 polígonos en seis categorías oficiales. Fuente: Alcaldía de Medellín, servicio `VM_23_Uso_General_Suelo_Urbano`, capa 2. Fecha de adopción de la capa: 17 de diciembre de 2014. Descargada el 4 de noviembre de 2026.

Columnas: `id`, `municipio`, `fuente`, `capa_origen`, `acuerdo`, `fecha_adopcion`, `fecha_actualizacion`, `area_general`, `subcategoria`, `cod_cat_uso`, `cod_subcat_uso`, `atributos`, `geom` (MultiPolygon, 4326), `creado_en` y `area_m2` (área precalculada).

Índices: gist sobre `geom`, btree sobre `(municipio, area_general)` y la clave primaria.

Licencia: CC BY-SA 4.0.

### `usos_suelo_mapa`

Versión disuelta por categoría y simplificada (~4 m) de `usos_suelo`, solo para **dibujar** el mapa rápido (24.749 trozos). Las cifras (km², porcentajes) se calculan con la geometría original de `usos_suelo`.

Índices: gist sobre `geom`, btree sobre `area_general` y la clave primaria.

### `zonas`

Zonas que un usuario guarda desde Estadísticas.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Identificador |
| `user_id` | uuid | Dueño. Referencia a `auth.users(id)` con `ON DELETE CASCADE` |
| `nombre` | text | Nombre de la zona |
| `centro_lat`, `centro_lng` | double precision | Centro |
| `radio_km` | double precision | Radio |
| `geojson_equipamientos`, `geojson_lugares` | jsonb | Resultados guardados |
| `creado_en` | timestamptz | Fecha de creación |
| `coordenada_id` | uuid | Punto asociado. Referencia a `coordenadas_capturadas(id)` con `ON DELETE SET NULL` |

### `zona_capas`

Relación entre una zona guardada y las capas que la componen.

| Columna | Tipo | Descripción |
|---|---|---|
| `zona_id` | uuid | Referencia a `zonas(id)` con `ON DELETE CASCADE` |
| `capa_id` | uuid | Referencia a `capas(id)` con `ON DELETE CASCADE` |
| `total_features` | integer | Cantidad de elementos de esa capa en la zona |

### `coordenadas_capturadas`

Punto asociado a cada zona guardada. Se inserta al guardar la zona.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Identificador |
| `nombre` | text | Opcional |
| `geom` | geometry | Punto |
| `srid_mostrado` | integer | SRID con el que se mostró |
| `creado_en` | timestamptz | Fecha de captura |
| `user_id` | uuid | Dueño. Por defecto `auth.uid()`; referencia a `auth.users(id)` con `ON DELETE CASCADE` |

Al borrar una zona guardada, su punto no se borra: queda sin zona asociada.

### `capas_respaldo_nombres_030`

Respaldo temporal de los nombres que cambiaron a "Sin nombre" (script 031). Se puede borrar. Su RLS está activo y no tiene políticas, así que no se puede leer desde la API pública.

## Funciones (RPC) que usa el visor

| Función | Script | Para qué |
|---|---|---|
| `insertar_capa(p_nombre, p_geojson, p_srid_original, p_formato)` | — | Inserta una capa; devuelve `uuid[]` |
| `suelo_en_zona` | 011 | Suelo dentro de una zona (tope 5 km) |
| `equipamientos_en_riesgo` | 012 | Equipamientos en suelo de protección o riesgo |
| `equipamientos_cercanos`, `equipamientos_cercanos_total` | 013 | "¿Qué hay cerca?" |
| Cobertura de un servicio | 014 | Parte de la zona a cierta distancia de un servicio |
| `equipamientos_en_zona` | 015 | Equipamientos de una zona |
| `lugares_en_zona` | 016 | Lugares OSM de una zona |
| `teselado_equipamientos` | 017 | Teselado en hexágonos |
| `equipamientos_puntos_en_zona`, `equipamiento_geometria` | 020, 021 | Puntos y geometría de equipamientos |
| `suelo_estadisticas_zona`, `suelo_area_interseccion_m2` | 022 | Estadísticas de la clasificación del suelo |
| `suelo_en_punto`, `suelo_en_celda` | 023 | Suelo en un punto y en una celda del teselado |
| `suelo_anillos_zona` | 024 | Suelo por anillos de distancia al centro |
| `usos_en_zona`, `usos_estadisticas_zona`, `usos_en_punto` | 027 | Usos de Medellín (zona, estadísticas y punto) |
| `usos_mapa_zona` | 028, 029 | GeoJSON de usos para dibujar |

### `insertar_capa(p_nombre text, p_geojson jsonb, p_srid_original integer, p_formato text) → uuid[]`

Recibe un `FeatureCollection` (o una geometría suelta), transforma cada geometría de `p_srid_original` a 4326 y la inserta. El nombre de cada fila sale de `properties.nombre` (si no viene, de `p_nombre`); `nombre_capa` es `p_nombre` y `propiedades` guarda las propiedades del elemento. **No** es `security definer`: se ejecuta con los permisos de quien la llama, así que la política de inserción de `capas` sí se aplica.

## Seguridad: políticas RLS

RLS está activo en las tablas del esquema `public`.

| Tabla | Política | Operación | Quién | Regla |
|---|---|---|---|---|
| `capas` | `capas_lectura_publica` | SELECT | público | Solo filas con `nombre_capa` que empieza por `Equipamientos AMVA - ` o `Lugares OSM - ` |
| `capas` | `capas_lectura_propia` | SELECT | usuarios con sesión | Solo filas cuyo `user_id` es el suyo |
| `capas` | `capas_insercion_autenticada` | INSERT | usuarios con sesión | No permite los nombres reservados (`Equipamientos AMVA - `, `Lugares OSM - `, `CARGA TEMPORAL`) |
| `zonas` | ver / insertar / borrar propias | SELECT, INSERT, DELETE | usuarios | Solo las filas cuyo `user_id` es `auth.uid()` |
| `zona_capas` | select / insert / delete propias | SELECT, INSERT, DELETE | usuarios | Solo si la zona pertenece al usuario |
| `coordenadas_capturadas` | `coordenadas_lectura_propia`, `coordenadas_insercion_propia`, `coordenadas_borrado_propio` | SELECT, INSERT, DELETE | usuarios con sesión | Solo las filas cuyo `user_id` es `auth.uid()` |
| `usos_suelo`, `usos_suelo_mapa`, `suelo_pot` | — | SELECT | público | Solo lectura |

Las políticas anteriores `Insercion publica de capas` y las tres públicas de `coordenadas_capturadas` fueron eliminadas (scripts 030, 036 y 037).

**Storage:** el bucket `archivos-capas` ya no se usa y no tiene políticas públicas (script 036).

**Límites del plan gratuito:** las consultas del rol `anon` se cortan a los 3 segundos y las de `authenticated` a los 8. El rol `anon` aparece con muchos permisos de tabla (es el valor por defecto de Supabase): lo que protege los datos es RLS, no esos permisos.