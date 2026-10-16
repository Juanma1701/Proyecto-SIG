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
