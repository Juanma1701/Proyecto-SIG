import assert from 'node:assert/strict'
import { consultarTerritorio } from '../src/utils/territorial/consultaTerritorial.js'
import { AVISO_ALCANCE, BASE_PUBLICA_AMVA, TEXTOS_ADVERTENCIA } from '../src/utils/territorial/modelo.js'
import { BLOQUES, capasDeMunicipio } from '../src/utils/territorial/registroFuentes.js'

const PUNTO = { lat: 6.2442, lon: -75.5812 }
const AHORA = () => new Date('2026-11-13T12:00:00.000Z')

const conRegistros = (...atributos) => ({ estado: 'ok', registros: atributos })
const VACIO = { estado: 'sin_resultados', registros: [] }
const amva = (...codigos) => conRegistros(...codigos.map((c) => ({ CODIGO_MUN: c, MUNICIPIO: 'x', SIMBOLOGIA: 'URBANO' })))

const POLIGONOS_MEDELLIN = [
  { id: 1, municipio: 'Medellín', categoria: 'urbano', capa_origen: 'clasificacion_suelo', nombre: 'a', atributos: { CODIGO_MUN: '001', SIMBOLOGIA: 'URBANO' } },
  { id: 2, municipio: 'Medellín', categoria: 'proteccion', capa_origen: 'suelo_proteccion', nombre: 'b', atributos: { CODIGO_MUN: '001', SIMBOLOGIA: 'PROTECCIÓN' } },
  { id: 3, municipio: 'Medellín', categoria: 'urbano', capa_origen: 'otra', nombre: 'c', atributos: { CODIGO_MUN: '001' } }
]

// Fábrica de dependencias. `capas`: 'Servicio/id' -> resultado de consulta (por defecto VACIO)
function deps({ codigo = '001', capas = {}, suelo = POLIGONOS_MEDELLIN, usoMedellin, extra = {} } = {}) {
  const estado = { arcgis: [], suelo: 0, uso: 0 }
  return {
    estado,
    consultarArcGIS: async (p) => {
      estado.arcgis.push(p)
      if (p.servicio === 'AMVA_POT' && p.capaId === 5) return codigo ? amva(codigo) : VACIO
      const r = capas[`${p.servicio}/${p.capaId}`]
      return typeof r === 'function' ? r(p) : (r ?? VACIO)
    },
    consultarSuelo: async () => {
      estado.suelo++
      if (suelo instanceof Error) throw suelo
      return { punto: {}, poligonos: suelo }
    },
    consultarUsoMedellin: usoMedellin === undefined
      ? undefined
      : async () => {
          estado.uso++
          if (usoMedellin instanceof Error) throw usoMedellin
          return usoMedellin
        },
    ahora: AHORA,
    ...extra
  }
}

const bloque = (r, id) => r.bloques.find((b) => b.id === id)

// 1. Medellín completo
{
  const d = deps({
    capas: {
      'DISTRITO_MEDELLIN_POT/0': conRegistros({ SIMBOLOGIA: '  Suelo Urbano ', NOMBRE: ' x ', CLASE_SUELO: '' }),
      'DISTRITO_MEDELLIN_POT/1': conRegistros({ SUBCATEGORIA: 'algo' }),
      'DISTRITO_MEDELLIN_POT/5': conRegistros({ TRATAMIENTO: 'T1' }),
      'MEDELLIN_Uso_y_Valores_Suelo/1': conRegistros({ USO_ACTUAL: ' Comercio ', INDICADOR: 1 })
    },
    usoMedellin: [{ uso: 'u' }]
  })
  const r = await consultarTerritorio(PUNTO, d)
  assert.equal(r.estado, 'ok')
  assert.deepEqual(r.punto, { lat: PUNTO.lat, lon: PUNTO.lon, srid: 4326 })
  assert.equal(r.fechaConsulta, '2026-11-13T12:00:00.000Z')
  assert.equal(r.municipio.codigo, '001')
  assert.equal(r.municipio.nombre, 'Medellín')
  assert.equal(r.aviso, AVISO_ALCANCE)
  assert.ok(!('permitido' in r) && !('prohibido' in r))

  // una consulta por capa del municipio (7) + resolver (2 llamadas AMVA_POT/5) ; Supabase UNA sola vez
  const nCapas = capasDeMunicipio('Medellin').length
  assert.equal(d.estado.arcgis.filter((p) => p.servicio !== 'AMVA_POT').length, nCapas)
  assert.equal(d.estado.suelo, 1)
  assert.equal(d.estado.uso, 1)

  // clasificación REST: clase desde SIMBOLOGIA, original intacto
  const clas = bloque(r, 'arcgis_amva:DISTRITO_MEDELLIN_POT/0')
  assert.equal(clas.estado, 'ok')
  assert.equal(clas.registros[0].normalizado.clase, 'urbano')
  assert.equal(clas.registros[0].atributosOriginales.SIMBOLOGIA, '  Suelo Urbano ')
  assert.equal(clas.registros[0].atributosLimpios.CLASE_SUELO, null)
  assert.equal(clas.fuente.url, `${BASE_PUBLICA_AMVA}/DISTRITO_MEDELLIN_POT/MapServer/0`)

  // uso actual en su propio bloque
  const ua = bloque(r, 'arcgis_amva:MEDELLIN_Uso_y_Valores_Suelo/1')
  assert.equal(ua.tipo, 'uso_actual')
  assert.equal(ua.registros[0].normalizado.etiquetaOriginal, 'Comercio')

  // uso_normativo_pot: nunca ok ni sin_resultados
  const usos = r.bloques.filter((b) => b.tipo === 'uso_normativo_pot')
  assert.ok(usos.length >= 3)
  assert.ok(usos.every((b) => b.estado === 'capa_no_verificada'))
  assert.ok(usos.every((b) => b.advertencias.some((a) => a.codigo === 'USO_POT_NO_VERIFICADO')))
  assert.equal(bloque(r, 'arcgis_amva:DISTRITO_MEDELLIN_POT/1').registros.length, 1)
  assert.equal(bloque(r, 'arcgis_amva:DISTRITO_MEDELLIN_POT/2').registros.length, 0)

  // tratamiento genérico, sin normalizar
  assert.equal(bloque(r, 'arcgis_amva:DISTRITO_MEDELLIN_POT/5').registros[0].normalizado, null)

  // Supabase: clasificación y protección separadas; el original no se fusiona con el REST
  const sc = bloque(r, 'supabase:suelo_pot:clasificacion_suelo')
  assert.equal(sc.registros[0].normalizado.clase, 'urbano')
  assert.ok(sc.advertencias.some((a) => a.codigo === 'EXPANSION_DENTRO_DE_URBANO'))
  assert.ok(sc.advertencias.some((a) => a.codigo === 'POLIGONOS_SUPABASE_SIN_BLOQUE'))
  assert.equal(sc.fuente.fechaDatosDeclarada, '2022-09')
  assert.ok(bloque(r, 'supabase:suelo_pot:proteccion'))
  assert.equal(bloque(r, 'supabase:suelo_pot:riesgo'), undefined)

  // usos de Medellín (Acuerdo 48/2014) en su propio bloque
  const um = bloque(r, 'supabase:usos_suelo')
  assert.equal(um.estado, 'capa_no_verificada')
  assert.equal(um.fuente.instrumentoNormativo, 'Acuerdo 48 de 2014 (solo suelo urbano de Medellín)')
  assert.equal(um.registros.length, 1)

  // orden de bloques según BLOQUES
  const indices = r.bloques.map((b) => BLOQUES.indexOf(b.tipo))
  assert.deepEqual(indices, [...indices].sort((a, b) => a - b))

  // toda advertencia usada tiene texto registrado
  for (const b of r.bloques) for (const a of b.advertencias) assert.ok(Object.hasOwn(TEXTOS_ADVERTENCIA, a.codigo), a.codigo)
  for (const a of r.municipio.advertencias) assert.ok(Object.hasOwn(TEXTOS_ADVERTENCIA, a), a)
  console.log('ok  Medellín: bloques por capa, uso no verificado, Supabase una sola vez, fuentes separadas')
}

// 2. Errores aislados: una capa cae y las demás siguen
{
  const d = deps({
    codigo: '266',
    suelo: [],
    capas: {
      'POT_Envigado/0': { estado: 'error_servicio', registros: [], error: { codigo: 400, mensaje: 'x' } },
      'POT_Envigado/9': { estado: 'timeout', registros: [], error: { codigo: null, mensaje: 't' } },
      'POT_Envigado/7': () => {
        throw new Error('boom')
      },
      'POT_Envigado/11': { estado: 'error_servicio', registros: [], error: { codigo: 504, mensaje: 'x' } },
      'ENVIGADO_Uso_y_Valores_Suelo/1': conRegistros({ USO_ACTUAL: 'Residencial' })
    }
  })
  const r = await consultarTerritorio(PUNTO, d)
  assert.equal(r.municipio.slug, 'Envigado')
  assert.equal(bloque(r, 'arcgis_amva:POT_Envigado/0').estado, 'error_servicio')
  assert.equal(bloque(r, 'arcgis_amva:POT_Envigado/9').estado, 'timeout')
  assert.equal(bloque(r, 'arcgis_amva:POT_Envigado/7').estado, 'error_red')
  // el error de servicio en una capa de uso normativo se conserva (no se disfraza)
  assert.equal(bloque(r, 'arcgis_amva:POT_Envigado/11').estado, 'error_servicio')
  assert.equal(bloque(r, 'arcgis_amva:ENVIGADO_Uso_y_Valores_Suelo/1').estado, 'ok')
  assert.equal(bloque(r, 'supabase:suelo_pot:clasificacion_suelo').estado, 'sin_resultados')
  // Medellín solo: la consulta de usos no se llama en Envigado
  assert.equal(d.estado.uso, 0)
  console.log('ok  errores por capa aislados; error de servicio en uso normativo se conserva')
}

// 3. Capa pendiente (Sabaneta/7) se consulta y se avisa; truncado se avisa
{
  const d = deps({
    codigo: '631',
    suelo: [],
    capas: { 'POT_Sabaneta/1': { estado: 'ok', registros: [{ USO: 'x' }], truncado: true, error: null } }
  })
  const r = await consultarTerritorio(PUNTO, d)
  const pend = bloque(r, 'arcgis_amva:POT_Sabaneta/7')
  assert.ok(pend)
  assert.ok(pend.advertencias.some((a) => a.codigo === 'CAPA_PENDIENTE_DE_PRUEBA'))
  assert.ok(pend.notasVerificacion.length > 0)
  assert.ok(d.estado.arcgis.some((p) => p.servicio === 'POT_Sabaneta' && p.capaId === 7))
  const trunc = bloque(r, 'arcgis_amva:POT_Sabaneta/1')
  assert.ok(trunc.advertencias.some((a) => a.codigo === 'RESULTADO_TRUNCADO'))
  assert.equal(trunc.truncado, true)
  console.log('ok  capa pendiente se consulta y se avisa; truncado se avisa')
}

// 4. Fuera de cobertura: sin bloques
{
  const r = await consultarTerritorio(PUNTO, deps({ codigo: null, suelo: [] }))
  assert.equal(r.estado, 'fuera_de_cobertura')
  assert.deepEqual(r.bloques, [])
  assert.equal(r.aviso, AVISO_ALCANCE)
  console.log('ok  fuera del AMVA: estado fuera_de_cobertura, sin bloques')
}

// 5. Ambiguo (borde): solo clasificación agregada + Supabase; elegir un candidato activa las capas
{
  const ambiguo = () =>
    deps({
      suelo: [],
      capas: {},
      extra: {}
    })
  const d = ambiguo()
  d.consultarArcGIS = async (p) => {
    d.estado.arcgis.push(p)
    if (p.servicio === 'AMVA_POT' && p.capaId === 5) return p.distanciaM > 0 ? amva('001', '088') : amva('001')
    return VACIO
  }
  const r = await consultarTerritorio(PUNTO, d)
  assert.equal(r.estado, 'ambiguo')
  assert.equal(r.municipio.codigo, null)
  assert.deepEqual(r.municipio.candidatos.map((c) => c.slug).sort(), ['Bello', 'Medellin'])
  assert.ok(r.advertencias.some((a) => a.codigo === 'MUNICIPIO_AMBIGUO_SIN_CAPAS_MUNICIPALES'))
  assert.ok(bloque(r, 'arcgis_amva:AMVA_POT/5'))
  assert.ok(bloque(r, 'supabase:suelo_pot:clasificacion_suelo'))
  assert.ok(!r.bloques.some((b) => /POT_Bello|DISTRITO_MEDELLIN/.test(b.id)))

  const d2 = ambiguo()
  d2.consultarArcGIS = d.consultarArcGIS
  const elegido = await consultarTerritorio(PUNTO, { ...d2, municipioElegido: 'Bello' })
  assert.equal(elegido.estado, 'ok')
  assert.equal(elegido.municipio.slug, 'Bello')
  assert.equal(elegido.municipio.metodo, 'elegido_por_el_usuario')
  assert.ok(elegido.municipio.advertencias.includes('MUNICIPIO_ELEGIDO_POR_USUARIO'))
  assert.ok(elegido.bloques.some((b) => b.id.startsWith('arcgis_amva:Bello_POT/')))
  assert.equal(elegido.municipio.candidatos.length, 2)

  const noCandidato = await consultarTerritorio(PUNTO, { ...ambiguo(), consultarArcGIS: d.consultarArcGIS, municipioElegido: 'Caldas' })
  assert.equal(noCandidato.estado, 'ambiguo')
  console.log('ok  ambiguo: sin capas municipales; elegir un candidato válido las activa; uno inválido se ignora')
}

// 6. Supabase caído: el municipio sale del AMVA y el bloque de suelo marca error
{
  const r = await consultarTerritorio(PUNTO, deps({ codigo: '360', suelo: new Error('rpc caído') }))
  assert.equal(r.estado, 'ok')
  assert.ok(r.municipio.advertencias.includes('SIN_CONTRASTE_SUPABASE'))
  const s = bloque(r, 'supabase:suelo_pot:clasificacion_suelo')
  assert.equal(s.estado, 'error_servicio')
  assert.match(s.error.mensaje, /rpc caído/)
  console.log('ok  Supabase caído: resuelto por AMVA, bloque de suelo con error_servicio')
}

// 7. Usos de Medellín con error, y sin función inyectada
{
  const conError = await consultarTerritorio(PUNTO, deps({ usoMedellin: new Error('x') }))
  assert.equal(bloque(conError, 'supabase:usos_suelo').estado, 'error_servicio')
  const sin = await consultarTerritorio(PUNTO, deps())
  assert.equal(bloque(sin, 'supabase:usos_suelo'), undefined)
  console.log('ok  usos de Medellín: error aislado; sin función inyectada no hay bloque')
}

// 8. Cancelación
{
  const c = new AbortController()
  c.abort()
  const r = await consultarTerritorio(PUNTO, { ...deps(), signal: c.signal })
  assert.equal(r.estado, 'cancelada')
  assert.deepEqual(r.bloques, [])

  const c2 = new AbortController()
  const d = deps()
  const original = d.consultarArcGIS
  d.consultarArcGIS = async (p) => {
    const res = await original(p)
    if (p.servicio !== 'AMVA_POT') c2.abort()
    return res
  }
  const tarde = await consultarTerritorio(PUNTO, { ...d, signal: c2.signal })
  assert.equal(tarde.estado, 'cancelada')
  console.log('ok  cancelación previa y durante las consultas')
}

// 9. Parámetros enviados a cada capa y dependencias obligatorias
{
  const d = deps({ extra: { timeoutMs: 1234 } })
  await consultarTerritorio(PUNTO, d)
  const p = d.estado.arcgis.find((x) => x.servicio === 'DISTRITO_MEDELLIN_POT' && x.capaId === 0)
  assert.equal(p.lat, PUNTO.lat)
  assert.equal(p.lon, PUNTO.lon)
  assert.equal(p.timeoutMs, 1234)
  await assert.rejects(() => consultarTerritorio(PUNTO, {}), TypeError)
  console.log('ok  parámetros por capa (punto, timeout) y dependencias obligatorias')
}

console.log('\nTodo correcto.')
