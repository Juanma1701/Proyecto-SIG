import { supabase } from '../lib/supabaseClient'

const RADIO_MAX_KM = 5 // con radios mayores la consulta tarda demasiado
const VIGENCIA_CACHE_MS = 10 * 60 * 1000

const cache = new Map()
const enVuelo = new Map()

const clave = (centro, radioKm) => `${centro.lat.toFixed(5)},${centro.lng.toFixed(5)},${radioKm}`

export async function obtenerRiesgoZona(centro, radioKm) {
  const radio = Number(radioKm)
  if (!Number.isFinite(radio) || radio > RADIO_MAX_KM) return null

  const k = clave(centro, radio)
  const guardado = cache.get(k)
  if (guardado && guardado.hasta > Date.now()) return guardado.datos
  if (enVuelo.has(k)) return enVuelo.get(k)

  const promesa = (async () => {
    const { data, error } = await supabase.rpc('equipamientos_en_riesgo', {
      p_lat: centro.lat,
      p_lng: centro.lng,
      p_radio_km: radio
    })
    if (error) {
      console.error('equipamientos_en_riesgo:', error.message)
      return null
    }
    cache.set(k, { datos: data, hasta: Date.now() + VIGENCIA_CACHE_MS })
    return data
  })().finally(() => enVuelo.delete(k))

  enVuelo.set(k, promesa)
  return promesa
}