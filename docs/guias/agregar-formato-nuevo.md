# Cómo agregar soporte para un formato de archivo nuevo

Ejemplo de referencia: agregar soporte para `.gpx`.

## 1. Identifica una librería de parseo a GeoJSON

Busca en npm una librería que convierta tu formato a GeoJSON (para GPX: `togpx`/`gpx-to-geojson`, o usa la librería `@tmcw/togeojson` que ya tienes instalada — soporta GPX además de KML).

```bash
npm install gpx-to-geojson   # si eliges una librería específica
```

## 2. Agrega la extensión al input

En `components/CargarCapa.jsx`:

```jsx
<input type="file" accept=".geojson,.json,.zip,.kml,.gpx" onChange={manejarArchivo} disabled={cargando} />
```

## 3. Agrega el caso de parseo

En la misma función `manejarArchivo`, agrega un bloque `if (extension === 'gpx')`:

```javascript
if (extension === 'gpx') {
  const texto = await archivo.text()
  const parser = new DOMParser()
  const gpxDom = parser.parseFromString(texto, 'text/xml')
  geojson = gpx(gpxDom) // usando la función correspondiente de tu librería
  crsDetectado = { epsg: 4326, fuente: 'especificación GPX' }
}
```

## 4. (Opcional) Detección de CRS específica

Si el formato nuevo puede traer un CRS distinto a 4326, agrega la lógica correspondiente en `utils/detectarCRS.js`, siguiendo el mismo patrón que `detectarCRSShapefile`.

## 5. Prueba

Sube un archivo `.gpx` de ejemplo y confirma que se dibuja correctamente en ambos modos de renderizado (Estándar y Alto rendimiento) y que se puede reproyectar y guardar igual que los demás formatos.

No es necesario tocar `Mapa.jsx`, `MapaGeoLibre.jsx` ni `utils/reproyectar.js` — todos trabajan sobre GeoJSON ya parseado, sin importar el formato de origen.