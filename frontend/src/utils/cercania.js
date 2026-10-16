import { supabase } from '../lib/supabaseClient'

const TTL_MS = 10 * 60 * 1000       // cuánto vive una respuesta en el caché
const MAX_ENTRADAS = 40             // cuántas respuestas distintas se guardan
const MAX_INTENTOS = 2              // 1 petición + 1 reintento
const ESPERA_REINTENTO_MS = 700

const MAX_EQUIPAMIENTOS = 5000
const MAX_LUGARES = 3000

export const MENSAJE_SATURADO =
  'El servicio está ocupado o sin conexión. Espera unos segundos e intenta de nuevo.'

const ESTADOS_SOBRECARGA = new Set([0, 402, 429, 502, 503, 504])
const CODIGOS_SOBRECARGA = new Set(['57014', '53300'])

export function esSobrecarga(error) {
  if (!error) return false
  if (CODIGOS_SOBRECARGA.has(String(error.code))) return true
  return ESTADOS_SOBRECARGA.has(error.httpStatus)
}

const cache = new Map()   
const enVuelo = new Map() 

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const redondear = (n) => Math.round(Number(n) * 1e5) / 1e5

function copiar(datos) {
  if (datos === null || datos === undefined) return datos
  return typeof structuredClone === 'function'
    ? structuredClone(datos)
    : JSON.parse(JSON.stringify(datos))
}

async function llamarRpc(nombre, parametros) {
  for (let intento = 1; ; intento++) {
    const { data, error, status } = await supabase.rpc(nombre, parametros)
    if (!error) return data

    const sinReintento = CODIGOS_SOBRECARGA.has(String(error.code))
    const transitorio = !sinReintento && (status === 429 || status >= 500 || status === 0)

    if (!transitorio || intento >= MAX_INTENTOS) {
      try {
        error.httpStatus = status
      } catch {
        // el objeto de error no admite cambios: se sigue igual
      }
      console.error(`Error en ${nombre}:`, error)
      throw error
    }
    await esperar(ESPERA_REINTENTO_MS * intento + Math.random() * 300)
  }
}

function rpcConCache(nombre, parametros) {
  const clave = `${nombre}|${JSON.stringify(parametros)}`

  const guardado = cache.get(clave)
  if (guardado && Date.now() - guardado.t < TTL_MS) {
    return Promise.resolve(copiar(guardado.datos))
  }

  if (enVuelo.has(clave)) {
    return enVuelo.get(clave).then(copiar)
  }

  const promesa = llamarRpc(nombre, parametros)
    .then((datos) => {
      cache.set(clave, { t: Date.now(), datos })
      if (cache.size > MAX_ENTRADAS) cache.delete(cache.keys().next().value)
      return datos
    })
    .finally(() => enVuelo.delete(clave))

  enVuelo.set(clave, promesa)
  return promesa.then(copiar)
}

export function limpiarCacheCercania() {
  cache.clear()
}

export async function buscarCercanos(lat, lng, radioM = 1000, limite = 20) {
  const data = await rpcConCache('equipamientos_cercanos', {
    p_lat: redondear(lat),
    p_lng: redondear(lng),
    p_radio_m: radioM,
    p_limite: limite,
  })
  return data || []
}

export async function contarCercanos(lat, lng, radioM = 1000) {
  const data = await rpcConCache('equipamientos_cercanos_total', {
    p_lat: redondear(lat),
    p_lng: redondear(lng),
    p_radio_m: radioM,
  })
  return typeof data === 'number' ? data : null
}

export function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no soporta geolocalización'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

export async function equipamientosEnZona(centro, radioKm) {
  const parametros = {
    p_lat: redondear(centro.lat),
    p_lng: redondear(centro.lng),
    p_radio_km: radioKm,
    p_max: MAX_EQUIPAMIENTOS,
  }

  let data
  try {
    data = await rpcConCache('equipamientos_puntos_en_zona', parametros)
  } catch (error) {
    if (esSobrecarga(error)) throw error
    console.warn('[Supabase] equipamientos_puntos_en_zona no disponible, se usa la versión con polígonos', error)
    data = await rpcConCache('equipamientos_en_zona', parametros)
  }
  return data || { type: 'FeatureCollection', features: [], municipiosDisponibles: [] }
}

export async function geometriaEquipamiento(id) {
  if (!id) return null
  const data = await rpcConCache('equipamiento_geometria', { p_id: String(id) })
  return data || null
}

export async function lugaresEnZona(centro, radioKm) {
  const data = await rpcConCache('lugares_en_zona', {
    p_lat: redondear(centro.lat),
    p_lng: redondear(centro.lng),
    p_radio_km: radioKm,
    p_max: MAX_LUGARES,
  })
  return data || { type: 'FeatureCollection', features: [], municipiosCargados: [] }
}