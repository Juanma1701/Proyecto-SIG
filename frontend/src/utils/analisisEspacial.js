// utils/analisisEspacial.js
// Funciones de análisis espacial reales usando Turf.js — no solo mostrar
// datos, sino calcular cosas sobre ellos (área, densidad, proximidad).
import * as turf from '@turf/turf'
import { obtenerCategoria } from './categoriasEquipamiento'

/**
 * Área real (geodésica, en km²) de una zona circular definida por
 * centro + radio. Usa Turf en vez de la fórmula simple πr² porque
 * calcula sobre la esfera terrestre, más preciso a estas escalas.
 */
export function calcularAreaZonaKm2(centro, radioKm) {
  const circulo = turf.circle([centro.lng, centro.lat], radioKm, { units: 'kilometers' })
  const areaM2 = turf.area(circulo)
  return areaM2 / 1_000_000
}

/**
 * Cuenta cuántas features hay por categoría, sumando SOLO las capas
 * que fueron creadas junto con esta zona específica (identificadas por
 * `zonaId`) — así las estadísticas siempre coinciden exactamente con
 * lo que el mapa muestra para esa zona, sin volver a calcular
 * distancias ni depender de qué tan preciso sea el filtro interno de
 * cada fuente de datos (AMVA vs Overpass).
 */
export function contarPorCategoriaEnZona(zona, capas) {
  if (!zona?.id) return { total: 0, porCategoria: {} }

  const conteo = {}
  let total = 0

  capas.forEach((capa) => {
    if (capa.esZonaVisual || capa.tipo === 'zona' || capa.tipo === 'suelo') return
    if (capa.zonaId !== zona.id) return

    const features = (capa.geojsonOriginal || capa.geojson)?.features || []
    features.forEach((feature) => {
      const categoria = obtenerCategoria(feature)
      conteo[categoria] = (conteo[categoria] || 0) + 1
      total++
    })
  })

  return { total, porCategoria: conteo }
}

/**
 * Analiza una fila de zona GUARDADA (de Supabase) directamente desde
 * su geojson de equipamientos/lugares, sin depender de que esté
 * cargada en el mapa en ese momento — necesario para comparar dos
 * zonas guardadas que quizás ni siquiera están abiertas ahora mismo.
 */
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

/**
 * Cuenta cuántas features de punto hay dentro de un radio (metros)
 * alrededor de un punto específico. Se deja disponible por si se
 * necesita en otro contexto, pero ya no se usa en el popup del mapa.
 * `puntoCentro` es [lat, lng].
 */
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

      // distancia > 0.5 para no contar el propio punto que originó la búsqueda
      if (distancia <= radioMetros && distancia > 0.5) {
        const categoria = obtenerCategoria(feature)
        conteo[categoria] = (conteo[categoria] || 0) + 1
        total++
      }
    })
  })

  return { total, porCategoria: conteo }
}