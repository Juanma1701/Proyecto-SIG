import { llamarRpc, conCache } from './consultasSuelo'

// Reutiliza el mismo patrón del suelo: reintento + caché de 10 minutos.
// Todas las consultas son SOLO a Supabase (nada en vivo contra la Alcaldía).

const redondear = (numero) => Number(numero).toFixed(5)
const MENSAJE_ERROR = 'No se pudieron consultar los usos del suelo'

// GeoJSON para dibujar: una feature por categoría oficial, recortada a la zona
export function obtenerUsosMapa(centro, radioKm) {
  const clave = `usosmapa|${redondear(centro.lat)},${redondear(centro.lng)},${radioKm}`

  return conCache(clave, () =>
    llamarRpc(
      'usos_mapa_zona',
      { p_lat: centro.lat, p_lng: centro.lng, p_radio_km: radioKm },
      MENSAJE_ERROR
    )
  )
}

// Superficies y porcentajes por categoría y subcategoría oficial
export function obtenerEstadisticasUsos(centro, radioKm) {
  const clave = `usosestad|${redondear(centro.lat)},${redondear(centro.lng)},${radioKm}`

  return conCache(clave, () =>
    llamarRpc(
      'usos_estadisticas_zona',
      { p_lat: centro.lat, p_lng: centro.lng, p_radio_km: radioKm },
      MENSAJE_ERROR
    )
  )
}

export function consultarUsoEnPunto(punto) {
  const clave = `usospunto|${redondear(punto.lat)},${redondear(punto.lng)}`

  return conCache(clave, () =>
    llamarRpc(
      'usos_en_punto',
      { p_lat: punto.lat, p_lng: punto.lng },
      MENSAJE_ERROR
    )
  )
}