// Consulta de punto a la capa oficial de áreas de actividad de Itagüí. Base y fetch inyectables, sin caché.
// Estados: ok, sin_codigo (espacio público u otra área sin código), sin_poligono (fuera de la capa),
// varias_zonas (no se elige en silencio), error_servicio, error_red, timeout, cancelada.

import { zonaDesdeAtributos } from './zonaOficial.js'
import { aplicarCorreccionesCapa } from './correccionesCapaItagui.js'

// Ruta relativa por el proxy /itagui (vite.config.js y vercel.json).
export const BASE_ITAGUI = '/itagui/waserver/rest/services/Formulacion/26_FU_Areas_Actividad/MapServer/0'

const CAMPOS = 'codigo,uso_ppal,uso_comp,uso_cond,uso_proh,sector,subtipo,condicion1,condicion2,condicion3,cod_ep'
const redondear = (n) => Number(n).toFixed(5)

export function urlConsultaPunto({ lat, lon }, base = BASE_ITAGUI) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new RangeError('Coordenadas inválidas')
  const parametros = new URLSearchParams({
    geometry: `${redondear(lon)},${redondear(lat)}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: CAMPOS,
    returnGeometry: 'false',
    f: 'json'
  })
  return `${base}/query?${parametros}`
}

function crearSenal(externa, timeoutMs) {
  const control = new AbortController()
  let vencio = false
  const temporizador = setTimeout(() => {
    vencio = true
    control.abort()
  }, timeoutMs)
  const alAbortar = () => control.abort()
  if (externa?.aborted) control.abort()
  else externa?.addEventListener('abort', alAbortar, { once: true })
  return {
    signal: control.signal,
    vencio: () => vencio,
    limpiar: () => {
      clearTimeout(temporizador)
      externa?.removeEventListener('abort', alAbortar)
    }
  }
}

export async function consultarZonaItagui(punto, { base = BASE_ITAGUI, fetchFn = globalThis.fetch, signal, timeoutMs = 15000 } = {}) {
  const url = urlConsultaPunto(punto, base)
  const senal = crearSenal(signal, timeoutMs)
  try {
    let respuesta
    try {
      respuesta = await fetchFn(url, { signal: senal.signal })
    } catch (error) {
      if (signal?.aborted) return { estado: 'cancelada' }
      if (senal.vencio()) return { estado: 'timeout' }
      return { estado: 'error_red', mensaje: error?.message ?? 'Sin conexión' }
    }
    if (!respuesta.ok) return { estado: 'error_servicio', mensaje: `El servidor respondió ${respuesta.status}` }

    let datos
    try {
      datos = await respuesta.json()
    } catch {
      return { estado: 'error_servicio', mensaje: 'La respuesta no es JSON' }
    }
    // ArcGIS responde HTTP 200 con {error} cuando falla una consulta
    if (datos?.error) return { estado: 'error_servicio', mensaje: datos.error.message ?? 'El servicio devolvió un error' }
    if (!Array.isArray(datos?.features)) return { estado: 'error_servicio', mensaje: 'Forma de respuesta inesperada' }
    if (datos.features.length === 0) return { estado: 'sin_poligono' }

    const zonas = datos.features.map((f) => aplicarCorreccionesCapa(zonaDesdeAtributos(f.attributes)))
    const conCodigo = zonas.filter((z) => z.codigo)
    if (conCodigo.length === 0) {
      return { estado: 'sin_codigo', areaActividad: zonas[0].areaActividad, subtipo: zonas[0].subtipo }
    }
    const codigos = [...new Set(conCodigo.map((z) => z.codigo))]
    if (codigos.length > 1) return { estado: 'varias_zonas', codigos }
    return { estado: 'ok', zona: conCodigo[0] }
  } finally {
    senal.limpiar()
  }
}