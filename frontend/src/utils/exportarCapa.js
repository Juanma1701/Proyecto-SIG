// Exportación de capas.
//
// GeoJSON descargado sin más es un archivo mudo: el estándar RFC 7946 obliga a que
// las coordenadas estén en WGS 84 y eliminó el miembro "crs", así que un
// GeoJSON descargado en EPSG:3116 (metros) y luego vuelto a subir llega sin
// ninguna pista de su sistema. Quien lo lea asume 4326 e interpreta metros
// como grados, y la capa aparece en cualquier parte menos donde debe.
//
// Por eso al exportar a un sistema proyectado se escribe el miembro "crs" de
// la versión 2008 del estándar: no es portGeoJSON conforme, pero es lo que leen
// QGIS, ArcGIS y el propio cargador de esta app (detectarCRS.js).

function nombreSeguro(nombre) {
  return String(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._]+/, '')
    .slice(0, 80) || 'capa'
}

export function geojsonConCRS(geojson, epsg) {
  const codigo = Number(epsg)

  if (!Number.isInteger(codigo) || codigo <= 0) {
    throw new Error(`No se puede declarar el sistema de referencia "${epsg}" en el archivo`)
  }

  return {
    ...geojson,
    crs: {
      type: 'name',
      properties: { name: `urn:ogc:def:crs:EPSG::${codigo}` },
    },
  }
}

function descargar(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}

export function nombreArchivo(nombreCapa, epsg, etiqueta = '') {
  const partes = [nombreSeguro(nombreCapa), etiqueta, `EPSG${epsg}`].filter(Boolean)
  return `${partes.join('_')}.geojson`
}

export function descargarGeoJSON(geojson, nombreCapa, epsg, etiqueta = '') {
  const contenido = geojsonConCRS(geojson, epsg)
  descargar(
    new Blob([JSON.stringify(contenido)], { type: 'application/geo+json' }),
    nombreArchivo(nombreCapa, epsg, etiqueta)
  )
}
