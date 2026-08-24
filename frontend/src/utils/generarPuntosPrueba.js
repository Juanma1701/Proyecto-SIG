// Genera un GeoJSON de puntos aleatorios alrededor de un centro dado
export function generarPuntosPrueba(cantidad = 5000, centro = [-75.56, 6.25], radioGrados = 0.3) {
  const features = []

  for (let i = 0; i < cantidad; i++) {
    const lng = centro[0] + (Math.random() - 0.5) * radioGrados
    const lat = centro[1] + (Math.random() - 0.5) * radioGrados

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { id: i }
    })
  }

  return { type: 'FeatureCollection', features }
}