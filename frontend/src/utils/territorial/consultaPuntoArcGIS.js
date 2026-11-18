// Consulta puntual a una capa ArcGIS del AMVA (etapa 1).
//
// - No importa red ni Supabase: `fetchFn` y `base` se inyectan (en Node hay que dar la base completa).
// - Un solo intento, con timeout y AbortSignal externo. NO reintenta y NO guarda caché:
//   un error nunca debe quedar memorizado.
// - ArcGIS responde HTTP 200 con `{ error }` cuando falla: se trata como `error_servicio`.
// - El servidor reproyecta con inSR=4326 (verificado en capas 9377 y 3857): no se convierte nada aquí.
// - Las coordenadas se redondean a 5 decimales (~1 m) para mejorar los aciertos de caché del borde.

import {
  PARAMETROS_CONSULTA_PUNTUAL,
  PARAMETROS_DISTANCIA,
  rutaCapa
} from './registroFuentes.js'

export const BASE_AMVA_POR_DEFECTO = '/amva/server/rest/services'
export const TIMEOUT_MS_POR_DEFECTO = 15000

export const ESTADOS_CONSULTA = Object.freeze({
  OK: 'ok',
  SIN_RESULTADOS: 'sin_resultados',
  ERROR_SERVICIO: 'error_servicio',
  ERROR_RED: 'error_red',
  TIMEOUT: 'timeout',
  // Técnico: la consulta se canceló (otro clic). El orquestador la descarta, no se muestra.
  CANCELADA: 'cancelada'
})

export function redondearCoordenada(valor) {
  return Number(valor.toFixed(5))
}

function validarPunto(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new RangeError(`Coordenadas inválidas: lat=${lat}, lon=${lon}`)
  }
}

export function construirUrlConsulta({
  servicio,
  capaId,
  lat,
  lon,
  distanciaM = 0,
  base = BASE_AMVA_POR_DEFECTO,
  outFields
}) {
  validarPunto(lat, lon)
  if (!Number.isFinite(distanciaM) || distanciaM < 0) {
    throw new RangeError(`Distancia inválida: ${distanciaM}`)
  }
  const params = new URLSearchParams({
    geometry: `${redondearCoordenada(lon)},${redondearCoordenada(lat)}`,
    ...PARAMETROS_CONSULTA_PUNTUAL
  })
  if (outFields) params.set('outFields', outFields)
  if (distanciaM > 0) {
    params.set('distance', String(distanciaM))
    params.set('units', PARAMETROS_DISTANCIA.units)
  }
  return `${base.replace(/\/+$/, '')}/${rutaCapa(servicio, capaId)}/query?${params.toString()}`
}

// Devuelve siempre un objeto (no lanza por fallos de red o del servicio):
// { estado, registros: [atributos], url, httpStatus, error: {codigo, mensaje}|null, truncado }
// Lanza RangeError solo si las coordenadas o la distancia son inválidas (error de programación).
export async function consultarPuntoArcGIS({
  servicio,
  capaId,
  lat,
  lon,
  distanciaM = 0,
  base = BASE_AMVA_POR_DEFECTO,
  outFields,
  fetchFn = (...args) => globalThis.fetch(...args),
  timeoutMs = TIMEOUT_MS_POR_DEFECTO,
  signal
}) {
  const url = construirUrlConsulta({ servicio, capaId, lat, lon, distanciaM, base, outFields })
  const salida = (estado, extra = {}) => ({
    estado,
    registros: [],
    url,
    httpStatus: null,
    error: null,
    truncado: false,
    ...extra
  })

  if (signal?.aborted) return salida(ESTADOS_CONSULTA.CANCELADA)

  const controlador = new AbortController()
  let porTimeout = false
  const temporizador = setTimeout(() => {
    porTimeout = true
    controlador.abort()
  }, timeoutMs)
  const alAbortar = () => controlador.abort()
  signal?.addEventListener('abort', alAbortar, { once: true })

  try {
    const respuesta = await fetchFn(url, {
      signal: controlador.signal,
      headers: { Accept: 'application/json' }
    })

    if (!respuesta.ok) {
      return salida(ESTADOS_CONSULTA.ERROR_SERVICIO, {
        httpStatus: respuesta.status,
        error: { codigo: respuesta.status, mensaje: `HTTP ${respuesta.status}` }
      })
    }

    let datos
    try {
      datos = await respuesta.json()
    } catch (e) {
      // Si la causa fue un abort (timeout o cancelación) se trata abajo, no como "no JSON"
      if (controlador.signal.aborted) throw e
      return salida(ESTADOS_CONSULTA.ERROR_SERVICIO, {
        httpStatus: respuesta.status,
        error: { codigo: null, mensaje: 'La respuesta no es JSON (¿el proxy devolvió HTML?).' }
      })
    }

    if (datos && datos.error) {
      return salida(ESTADOS_CONSULTA.ERROR_SERVICIO, {
        httpStatus: respuesta.status,
        error: {
          codigo: datos.error.code ?? null,
          mensaje: datos.error.message ?? 'Error de ArcGIS sin mensaje.'
        }
      })
    }

    if (!datos || !Array.isArray(datos.features)) {
      return salida(ESTADOS_CONSULTA.ERROR_SERVICIO, {
        httpStatus: respuesta.status,
        error: { codigo: null, mensaje: 'Respuesta inesperada: no trae "features".' }
      })
    }

    const registros = datos.features.map((f) => f?.attributes ?? {})
    return salida(registros.length ? ESTADOS_CONSULTA.OK : ESTADOS_CONSULTA.SIN_RESULTADOS, {
      registros,
      httpStatus: respuesta.status,
      truncado: datos.exceededTransferLimit === true
    })
  } catch (e) {
    if (porTimeout) {
      return salida(ESTADOS_CONSULTA.TIMEOUT, {
        error: { codigo: null, mensaje: `Sin respuesta en ${timeoutMs} ms.` }
      })
    }
    if (signal?.aborted) return salida(ESTADOS_CONSULTA.CANCELADA)
    return salida(ESTADOS_CONSULTA.ERROR_RED, {
      error: { codigo: null, mensaje: e?.message ?? 'Error de red.' }
    })
  } finally {
    clearTimeout(temporizador)
    signal?.removeEventListener('abort', alAbortar)
  }
}
