# Primeros pasos

Esta guía te lleva de cero a tener tu primera capa geográfica visualizada, reproyectada y guardada.

## 1. Abrir el visor

Al abrir la aplicación verás un mapa centrado en Medellín y un panel lateral con las opciones de carga.

## 2. Elegir el modo de visualización

En "Modo de visualización" puedes alternar entre:
- **Estándar** — Leaflet, ideal para uso normal
- **Alto rendimiento** — MapLibre GL (WebGL), ideal para datasets grandes

Puedes cambiar entre ambos en cualquier momento sin perder las capas cargadas.

## 3. Cargar tu primer archivo

Haz clic en "Elegir archivo" y selecciona:
- Un `.geojson` o `.json`, o
- Un `.zip` con tu shapefile completo (`.shp`, `.shx`, `.dbf`, `.prj`), o
- Un `.kml`

La capa aparecerá dibujada en el mapa automáticamente, y una tarjeta con su nombre aparecerá en "Capas cargadas".

## 4. Ver el sistema de referencia detectado

Cada capa muestra su EPSG detectado y de dónde se obtuvo esa información (por ejemplo, del archivo `.prj`, o del estándar GeoJSON).

## 5. Reproyectar una capa

En la tarjeta de la capa, escribe el código EPSG destino (por ejemplo `3116` para MAGNA-SIRGAS Bogotá) y haz clic en "Reproyectar". El mapa se actualiza al instante.

## 6. Mostrar u ocultar capas

Cada capa tiene un checkbox "Mostrar en el mapa" — desmárcalo para ocultarla sin eliminarla.

## 7. Guardar en la nube

Haz clic en "Guardar en la nube" para subir el archivo original a Supabase Storage y registrar la capa (ya reproyectada a EPSG:4326) en la base de datos.

## 8. Capturar coordenadas

Haz clic en cualquier punto del mapa para ver su latitud/longitud en el panel lateral.

## 9. Probar el rendimiento

Usa el botón "⚡ Generar capa de prueba (5,000 puntos)" para comparar visualmente la fluidez entre el modo Estándar y Alto rendimiento.