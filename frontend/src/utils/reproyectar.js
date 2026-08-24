import proj4 from 'proj4'

// Definiciones comunes que proj4 no trae por defecto
proj4.defs('EPSG:32618', '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs')
proj4.defs('EPSG:3116', '+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750792 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +units=m +no_defs') // MAGNA-SIRGAS Colombia Bogotá

export function reproyectarGeoJSON(geojson, epsgOrigen, epsgDestino) {
  const origen = `EPSG:${epsgOrigen}`
  const destino = `EPSG:${epsgDestino}`

  function transformarCoords(coords) {
    if (typeof coords[0] === 'number') {
      return proj4(origen, destino, coords)
    }
    return coords.map(transformarCoords)
  }

  const copia = JSON.parse(JSON.stringify(geojson))
  const features = copia.type === 'FeatureCollection' ? copia.features : [copia]

  features.forEach(f => {
    f.geometry.coordinates = transformarCoords(f.geometry.coordinates)
  })

  return copia
}