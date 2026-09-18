import proj4 from 'proj4'
import { point, distance, circle, booleanIntersects } from '@turf/turf'
import { asegurarDefinicionEPSG } from './reproyectar'

/**
 * Convierte un centro (lat/lng en EPSG:4326) y un radio en km
 * a un "envelope" (bounding box) en el EPSG que necesite el
 * servicio ArcGIS de destino (por defecto 9377, el usado por el AMVA).
 *
 * Es async porque puede necesitar traer la definición desde epsg.io
 * si aún no está registrada localmente (ver asegurarDefinicionEPSG).
 *
 * @param {{ lat: number, lng: number }} centro
 * @param {number} radioKm
 * @param {number} epsgDestino
 * @returns {Promise<{ xmin: number, ymin: number, xmax: number, ymax: number }>}
 */
export async function envelopeEnUTM(centro, radioKm, epsgDestino = 9377) {
  await asegurarDefinicionEPSG(epsgDestino)

  const [xCenter, yCenter] = proj4('EPSG:4326', `EPSG:${epsgDestino}`, [centro.lng, centro.lat])
  const radioM = radioKm * 1000

  return {
    xmin: xCenter - radioM,
    ymin: yCenter - radioM,
    xmax: xCenter + radioM,
    ymax: yCenter + radioM
  }
}

/**
 * Determina si un Feature GeoJSON (ya en EPSG:4326) cae dentro
 * del radio real (círculo) definido por el usuario.
 *
 * Es necesario porque el envelope es un rectángulo, así que trae
 * resultados "de más" en las esquinas. Esta función filtra con
 * precisión usando la geometría circular real.
 *
 * @param {GeoJSON.Feature} feature
 * @param {{ lat: number, lng: number }} centro
 * @param {number} radioKm
 * @returns {boolean}
 */
export function caeEnZona(feature, centro, radioKm) {
  if (!feature?.geometry) return false

  const centroPunto = point([centro.lng, centro.lat])

  if (feature.geometry.type === 'Point') {
    const d = distance(point(feature.geometry.coordinates), centroPunto, { units: 'kilometers' })
    return d <= radioKm
  }

  if (feature.geometry.type === 'MultiPoint') {
    return feature.geometry.coordinates.some(coords => {
      const d = distance(point(coords), centroPunto, { units: 'kilometers' })
      return d <= radioKm
    })
  }

  try {
    const zona = circle(centroPunto, radioKm, { units: 'kilometers', steps: 64 })
    return booleanIntersects(feature, zona)
  } catch (error) {
    console.warn('No se pudo evaluar intersección para un feature:', error)
    return false
  }
}

/**
 * Filtra una FeatureCollection completa, dejando solo los features
 * que caen dentro del radio real.
 *
 * @param {GeoJSON.FeatureCollection} featureCollection
 * @param {{ lat: number, lng: number }} centro
 * @param {number} radioKm
 * @returns {GeoJSON.Feature[]}
 */
export function filtrarPorZona(featureCollection, centro, radioKm) {
  if (!featureCollection?.features) return []
  return featureCollection.features.filter(f => caeEnZona(f, centro, radioKm))
}