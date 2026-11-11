import { supabase } from '../lib/supabaseClient'

const VIGENCIA_CACHE_MS = 10 * 60 * 1000

const cache = new Map()
const enVuelo = new Map()

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const redondear = (numero) => Number(numero).toFixed(5)

export async function llamarRpc(funcion, parametros, mensajeError = 'No se pudo consultar el suelo') {
  let ultimoError
  for (let intento = 0; intento < 2; intento++) {
    const { data, error } = await supabase.rpc(funcion, parametros)
    if (!error) return data
    ultimoError = error
    if (intento === 0) await esperar(800)
  }
  throw new Error(ultimoError?.message || mensajeError)
}

export function conCache(clave, pedir) {
  const guardado = cache.get(clave)
  if (guardado && guardado.hasta > Date.now()) return Promise.resolve(guardado.datos)
  if (enVuelo.has(clave)) return enVuelo.get(clave)

  const promesa = pedir()
    .then((datos) => {
      cache.set(clave, { datos, hasta: Date.now() + VIGENCIA_CACHE_MS })
      return datos
    })
    .finally(() => enVuelo.delete(clave))

  enVuelo.set(clave, promesa)
  return promesa
}

export function consultarSueloEnPunto(punto, zona) {
  const clave =
    `punto|${redondear(punto.lat)},${redondear(punto.lng)}|` +
    `${redondear(zona.centro.lat)},${redondear(zona.centro.lng)},${zona.radioKm}`

  return conCache(clave, () =>
    llamarRpc('suelo_en_punto', {
      p_lat: punto.lat,
      p_lng: punto.lng,
      p_zona_lat: zona.centro.lat,
      p_zona_lng: zona.centro.lng,
      p_radio_km: zona.radioKm
    })
  )
}

export function consultarSueloEnCelda({ zonaCentro, radioKm, ladoM, punto, claveCelda }) {
  const clave =
    `celda|${redondear(zonaCentro.lat)},${redondear(zonaCentro.lng)},${radioKm},${ladoM}|${claveCelda}`

  return conCache(clave, () =>
    llamarRpc('suelo_en_celda', {
      p_lat: zonaCentro.lat,
      p_lng: zonaCentro.lng,
      p_radio_km: radioKm,
      p_lado_m: ladoM,
      p_punto_lat: punto.lat,
      p_punto_lng: punto.lng
    })
  )
}

export function consultarAnillosSuelo(centro, radioKm, anillos = 4) {
  const clave = `anillos|${redondear(centro.lat)},${redondear(centro.lng)},${radioKm},${anillos}`

  return conCache(clave, () =>
    llamarRpc('suelo_anillos_zona', {
      p_lat: centro.lat,
      p_lng: centro.lng,
      p_radio_km: radioKm,
      p_anillos: anillos
    })
  )
}