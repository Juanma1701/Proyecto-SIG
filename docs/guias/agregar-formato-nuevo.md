# Cómo agregar soporte para un formato de archivo nuevo

Ejemplo de referencia: agregar soporte para `.gpx`.

Los archivos se cargan en `frontend/src/components/CargarGeoJSON.jsx`. Todos los formatos terminan convertidos a GeoJSON, y desde ahí el resto de la aplicación no se entera del formato de origen.

## 1. Identifica una librería de parseo a GeoJSON

Busca en npm una librería que convierta tu formato a GeoJSON. Para GPX sirve `@tmcw/togeojson`, que ya está instalada (también convierte KML).

Las librerías pesadas **no se importan arriba** del archivo: se descargan con `import()` solo cuando se sube un archivo de ese tipo, igual que `shpjs` y `@tmcw/togeojson`. Así no engordan la carga inicial de la app.

## 2. Acepta la extensión

En `CargarGeoJSON.jsx`:

```javascript
const EXTENSIONES_VALIDAS = ['geojson', 'json', 'zip', 'kml', 'gpx']
```

Y en el `<input>`:

```jsx
<input type="file" accept=".geojson,.json,.zip,.kml,.gpx" ... />
```

Actualiza también el mensaje de "Formato no soportado" y los textos de la zona de carga.

## 3. Agrega el caso de parseo

En la función `procesarArchivo`, junto a los otros formatos:

```javascript
if (extension === 'gpx') {
  const texto = await archivo.text()
  const gpxDom = new DOMParser().parseFromString(texto, 'text/xml')

  if (gpxDom.getElementsByTagName('parsererror').length > 0) {
    throw new Error('El archivo GPX no es un XML válido')
  }

  // La librería se descarga solo ahora
  const { gpx } = await import('@tmcw/togeojson')
  geojsonOriginal = normalizarGeoJSON(gpx(gpxDom))
  crsOrigen = { epsg: 4326, fuente: 'especificación GPX' }
  geojsonRender = geojsonOriginal
}
```

Las tres variables que debes dejar listas son:
- `geojsonOriginal`: el GeoJSON tal como llegó, normalizado con `normalizarGeoJSON`.
- `crsOrigen`: `{ epsg, fuente }` con el sistema de referencia del archivo.
- `geojsonRender`: el GeoJSON en WGS84 que se dibuja. Si el formato ya viene en grados (como GPX y KML), es el mismo `geojsonOriginal`. Si no, se reproyecta con `reproyectarGeoJSON` (después de `asegurarDefinicionEPSG`).

## 4. (Opcional) Detección de CRS específica

Si el formato puede traer un CRS distinto de 4326, agrega la lógica en `utils/detectarCRS.js`, siguiendo el patrón de `detectarCRSShapefile`.

## 5. Prueba

Sube un `.gpx` de ejemplo: debe dibujarse en el mapa y aparecer en el panel **Capas**. Luego corre `npm run build` y revisa que no haya errores.

No hace falta tocar `Mapa.jsx` ni las utilidades de reproyección: trabajan sobre GeoJSON ya parseado.