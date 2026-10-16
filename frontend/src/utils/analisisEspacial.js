import * as turf from '@turf/turf'
import { obtenerCategoria } from './categoriasEquipamiento'

export function calcularAreaZonaKm2(centro, radioKm) {
  const circulo = turf.circle([centro.lng, centro.lat], radioKm, { units: 'kilometers' })
  const areaM2 = turf.area(circulo)
  return areaM2 / 1_000_000
}

export function contarPorCategoriaEnZona(zona, capas) {
  if (!zona?.id) return { total: 0, porCategoria: {}, equipamientos: 0, lugares: 0 }

  const conteo = {}
  let total = 0
  let equipamientos = 0
  let lugares = 0

  capas.forEach((capa) => {
    if (capa.esZonaVisual || capa.tipo === 'zona' || capa.tipo === 'suelo') return
    if (capa.zonaId !== zona.id) return

    const features = (capa.geojsonOriginal || capa.geojson)?.features || []
    features.forEach((feature) => {
      const categoria = obtenerCategoria(feature)
      conteo[categoria] = (conteo[categoria] || 0) + 1
      total++
      if (capa.tipo === 'lugares') lugares++
      else equipamientos++
    })
  })

  return { total, porCategoria: conteo, equipamientos, lugares }
}

export function analizarZonaGuardada(fila) {
  const conteo = {}
  let total = 0

  const featuresEq = fila.geojson_equipamientos?.features || []
  const featuresLu = fila.geojson_lugares?.features || []

  ;[...featuresEq, ...featuresLu].forEach((feature) => {
    const categoria = obtenerCategoria(feature)
    conteo[categoria] = (conteo[categoria] || 0) + 1
    total++
  })

  const areaKm2 = calcularAreaZonaKm2({ lat: fila.centro_lat, lng: fila.centro_lng }, fila.radio_km)

  return { total, porCategoria: conteo, areaKm2 }
}

export function contarEquipamientosCercanos(puntoCentro, radioMetros, capas) {
  const centroTurf = turf.point([puntoCentro[1], puntoCentro[0]])
  const conteo = {}
  let total = 0

  capas.forEach((capa) => {
    if (capa.esZonaVisual || capa.tipo === 'zona') return
    const features = (capa.geojsonOriginal || capa.geojson)?.features || []

    features.forEach((feature) => {
      if (feature.geometry?.type !== 'Point') return
      const [lng, lat] = feature.geometry.coordinates
      const distancia = turf.distance(centroTurf, turf.point([lng, lat]), { units: 'meters' })

      if (distancia <= radioMetros && distancia > 0.5) {
        const categoria = obtenerCategoria(feature)
        conteo[categoria] = (conteo[categoria] || 0) + 1
        total++
      }
    })
  })

  return { total, porCategoria: conteo }
}