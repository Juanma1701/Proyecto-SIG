// Lugar que la persona marca DENTRO de un buffer ya dibujado (consulta puntual, sin crear otro buffer).
// Funciones puras: sin mapa ni React.

const RADIO_TIERRA_M = 6371008.8
const aRad = (grados) => (grados * Math.PI) / 180

export function distanciaM(a, b) {
  const dLat = aRad(b.lat - a.lat)
  const dLng = aRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aRad(a.lat)) * Math.cos(aRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

const esPunto = (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng)

// { dentro: true|false|null, distanciaM }. null = no hay buffer con el que comparar (sin centro o sin radio).
export function dentroDelBuffer(centro, radioKm, punto) {
  const radio = Number(radioKm)
  if (!esPunto(punto)) return { dentro: null, distanciaM: null }
  if (!esPunto(centro) || !Number.isFinite(radio) || radio <= 0) return { dentro: null, distanciaM: null }
  const d = distanciaM(centro, punto)
  return { dentro: d <= radio * 1000, distanciaM: d }
}