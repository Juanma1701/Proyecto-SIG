import assert from 'node:assert/strict'
import {
  ESTADOS_CONSULTA,
  construirUrlConsulta,
  consultarPuntoArcGIS,
  redondearCoordenada
} from '../src/utils/territorial/consultaPuntoArcGIS.js'

const BASE = 'https://ejemplo.test/rest/services'
const PUNTO = { lat: 6.244212345, lon: -75.581234567 }

function respuesta(cuerpo, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => cuerpo }
}

function fetchQueEspera() {
  return (_url, { signal }) =>
    new Promise((_resolver, rechazar) => {
      signal.addEventListener('abort', () => {
        const e = new Error('abortado')
        e.name = 'AbortError'
        rechazar(e)
      })
    })
}

const base = { servicio: 'AMVA_POT', capaId: 5, ...PUNTO, base: BASE }

// 1. URL: parámetros verificados, coordenadas a 5 decimales, sin distance si es 0
{
  assert.equal(redondearCoordenada(6.244212345), 6.24421)
  const u = new URL(construirUrlConsulta(base))
  assert.ok(u.pathname.endsWith('/AMVA_POT/MapServer/5/query'))
  assert.equal(u.searchParams.get('geometry'), '-75.58123,6.24421')
  assert.equal(u.searchParams.get('geometryType'), 'esriGeometryPoint')
  assert.equal(u.searchParams.get('inSR'), '4326')
  assert.equal(u.searchParams.get('spatialRel'), 'esriSpatialRelIntersects')
  assert.equal(u.searchParams.get('outFields'), '*')
  assert.equal(u.searchParams.get('returnGeometry'), 'false')
  assert.equal(u.searchParams.get('f'), 'json')
  assert.equal(u.searchParams.has('distance'), false)
  const d = new URL(construirUrlConsulta({ ...base, distanciaM: 250, outFields: 'CODIGO_MUN' }))
  assert.equal(d.searchParams.get('distance'), '250')
  assert.equal(d.searchParams.get('units'), 'esriSRUnit_Meter')
  assert.equal(d.searchParams.get('outFields'), 'CODIGO_MUN')
  assert.throws(() => construirUrlConsulta({ ...base, lat: NaN }), RangeError)
  assert.throws(() => construirUrlConsulta({ ...base, lat: 91 }), RangeError)
  assert.throws(() => construirUrlConsulta({ ...base, distanciaM: -1 }), RangeError)
  console.log('ok  URL de consulta: parámetros verificados y validación de entrada')
}

// 2. Caso normal
{
  let urlVista
  const r = await consultarPuntoArcGIS({
    ...base,
    fetchFn: async (url) => {
      urlVista = url
      return respuesta({ features: [{ attributes: { CODIGO_MUN: '001', SIMBOLOGIA: 'URBANO' } }] })
    }
  })
  assert.equal(r.estado, ESTADOS_CONSULTA.OK)
  assert.deepEqual(r.registros, [{ CODIGO_MUN: '001', SIMBOLOGIA: 'URBANO' }])
  assert.equal(r.url, urlVista)
  assert.equal(r.truncado, false)
  console.log('ok  respuesta normal: atributos intactos')
}

// 3. Vacío y truncado
{
  const vacio = await consultarPuntoArcGIS({ ...base, fetchFn: async () => respuesta({ features: [] }) })
  assert.equal(vacio.estado, ESTADOS_CONSULTA.SIN_RESULTADOS)
  assert.deepEqual(vacio.registros, [])
  const cortado = await consultarPuntoArcGIS({
    ...base,
    fetchFn: async () => respuesta({ features: [{ attributes: { a: 1 } }], exceededTransferLimit: true })
  })
  assert.equal(cortado.truncado, true)
  console.log('ok  vacío = sin_resultados (no error); truncado señalado')
}

// 4. HTTP 200 con {error}
{
  const r = await consultarPuntoArcGIS({
    ...base,
    fetchFn: async () =>
      respuesta({ error: { code: 400, message: 'Requested operation is not supported by this service' } })
  })
  assert.equal(r.estado, ESTADOS_CONSULTA.ERROR_SERVICIO)
  assert.equal(r.error.codigo, 400)
  assert.deepEqual(r.registros, [])
  console.log('ok  HTTP 200 con {error} -> error_servicio')
}

// 5. HTTP 504, respuesta no JSON, forma inesperada
{
  const r504 = await consultarPuntoArcGIS({ ...base, fetchFn: async () => respuesta({}, 504) })
  assert.equal(r504.estado, ESTADOS_CONSULTA.ERROR_SERVICIO)
  assert.equal(r504.httpStatus, 504)
  const html = await consultarPuntoArcGIS({
    ...base,
    fetchFn: async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <')
      }
    })
  })
  assert.equal(html.estado, ESTADOS_CONSULTA.ERROR_SERVICIO)
  const raro = await consultarPuntoArcGIS({ ...base, fetchFn: async () => respuesta({ algo: 1 }) })
  assert.equal(raro.estado, ESTADOS_CONSULTA.ERROR_SERVICIO)
  console.log('ok  504, respuesta no JSON y forma inesperada -> error_servicio')
}

// 6. Error de red
{
  const r = await consultarPuntoArcGIS({
    ...base,
    fetchFn: async () => {
      throw new TypeError('fetch failed')
    }
  })
  assert.equal(r.estado, ESTADOS_CONSULTA.ERROR_RED)
  assert.match(r.error.mensaje, /fetch failed/)
  console.log('ok  fallo de red -> error_red')
}

// 7. Timeout
{
  const r = await consultarPuntoArcGIS({ ...base, fetchFn: fetchQueEspera(), timeoutMs: 30 })
  assert.equal(r.estado, ESTADOS_CONSULTA.TIMEOUT)
  console.log('ok  timeout -> timeout')
}

// 8. Cancelación externa (otro clic)
{
  const controlador = new AbortController()
  setTimeout(() => controlador.abort(), 20)
  const r = await consultarPuntoArcGIS({
    ...base,
    fetchFn: fetchQueEspera(),
    timeoutMs: 5000,
    signal: controlador.signal
  })
  assert.equal(r.estado, ESTADOS_CONSULTA.CANCELADA)

  const yaAbortada = new AbortController()
  yaAbortada.abort()
  let llamadas = 0
  const r2 = await consultarPuntoArcGIS({
    ...base,
    signal: yaAbortada.signal,
    fetchFn: async () => {
      llamadas++
      return respuesta({ features: [] })
    }
  })
  assert.equal(r2.estado, ESTADOS_CONSULTA.CANCELADA)
  assert.equal(llamadas, 0)
  console.log('ok  cancelación con AbortSignal (en vuelo y previa)')
}

// 9. Sin caché: dos llamadas = dos fetch; un error no se recuerda
{
  let n = 0
  const fetchFn = async () => {
    n++
    return n === 1 ? respuesta({ error: { code: 500, message: 'x' } }) : respuesta({ features: [{ attributes: { a: 1 } }] })
  }
  const a = await consultarPuntoArcGIS({ ...base, fetchFn })
  const b = await consultarPuntoArcGIS({ ...base, fetchFn })
  assert.equal(a.estado, ESTADOS_CONSULTA.ERROR_SERVICIO)
  assert.equal(b.estado, ESTADOS_CONSULTA.OK)
  assert.equal(n, 2)
  console.log('ok  sin caché: un error no se memoriza')
}

console.log('\nTodo correcto.')
