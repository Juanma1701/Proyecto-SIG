# Componentes

## `Mapa.jsx`
Renderizador con Leaflet.

| Prop | Tipo | Descripción |
|---|---|---|
| `capas` | array | Capas a dibujar; cada una con `id`, `geojson`, `visible` |
| `onMapReady` | function | Se llama con la instancia del mapa al inicializarse |
| `onClickMapa` | function | Se llama con `{lat, lng}` al hacer click sobre el mapa |

## `MapaGeoLibre.jsx`
Renderizador con MapLibre GL (WebGL). Misma interfaz de props que `Mapa.jsx` — intercambiable con él (ver principio de Sustitución de Liskov en `principios-solid.md`).

## `CargarCapa.jsx`
Maneja la carga de archivos (`.geojson`, `.zip`, `.kml`), detección de CRS, y guardado en Supabase.

| Prop | Tipo | Descripción |
|---|---|---|
| `capas` | array | Estado actual de capas cargadas |
| `setCapas` | function | Setter de React para actualizar el array |

## `PanelCapas.jsx`
Lista las capas cargadas con su CRS, checkbox de visibilidad, y control de reproyección.

| Prop | Tipo | Descripción |
|---|---|---|
| `capas` | array | Estado actual de capas |
| `setCapas` | function | Setter de React |

## `InfoCRS.jsx`
Muestra el EPSG y la fuente de detección de una capa.

| Prop | Tipo | Descripción |
|---|---|---|
| `crs` | object | `{ epsg, fuente }` |

## Estructura de una capa en el estado `capas`

```javascript
{
  id: string,              // uuid generado en cliente
  nombre: string,
  archivoOriginal: File | null,
  geojson: object,
  crs: { epsg: number, fuente: string },
  visible: boolean,
  guardadaEnNube: boolean
}
```