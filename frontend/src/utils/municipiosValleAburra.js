import { point, distance } from '@turf/turf'

export const MUNICIPIOS_VALLE_ABURRA = [
  { nombre: 'Barbosa',     slug: 'Barbosa',    lat: 6.4378, lng: -75.3308, radioAprox: 8 },
  { nombre: 'Girardota',   slug: 'Girardota',  lat: 6.3775, lng: -75.4453, radioAprox: 7 },
  { nombre: 'Copacabana',  slug: 'Copacabana', lat: 6.3489, lng: -75.5083, radioAprox: 6 },
  { nombre: 'Bello',       slug: 'Bello',      lat: 6.3373, lng: -75.5581, radioAprox: 8 },
  { nombre: 'Medellín',    slug: 'Medellin',   lat: 6.2442, lng: -75.5812, radioAprox: 12 },
  { nombre: 'Envigado',    slug: 'Envigado',   lat: 6.1719, lng: -75.5836, radioAprox: 6 },
  { nombre: 'Itagüí',      slug: 'Itagui',     lat: 6.1719, lng: -75.6117, radioAprox: 5 },
  { nombre: 'Sabaneta',    slug: 'Sabaneta',   lat: 6.1508, lng: -75.6169, radioAprox: 4 },
  { nombre: 'La Estrella', slug: 'LaEstrella', lat: 6.1500, lng: -75.6436, radioAprox: 5 },
  { nombre: 'Caldas',      slug: 'Caldas',     lat: 6.0917, lng: -75.6353, radioAprox: 5 },
]

/**
 * Determina qué municipios del Valle de Aburrá podrían tener
 * datos dentro de la zona (centro + radio) definida por el usuario.
 *
 * Heurística círculo-círculo: compara la distancia entre el centro
 * de la zona y el centroide de cada municipio contra la suma de
 * ambos radios. Es intencionalmente generosa (prefiere consultar
 * un municipio de más, a dejar uno por fuera).
 *
 * @param {{ lat: number, lng: number }} centro
 * @param {number} radioKm
 * @returns {typeof MUNICIPIOS_VALLE_ABURRA} municipios candidatos
 */
export function municipiosEnZona(centro, radioKm) {
  const puntoCentro = point([centro.lng, centro.lat])

  return MUNICIPIOS_VALLE_ABURRA.filter((municipio) => {
    const puntoMunicipio = point([municipio.lng, municipio.lat])
    const d = distance(puntoCentro, puntoMunicipio, { units: 'kilometers' })
    return d <= radioKm + municipio.radioAprox
  })
}