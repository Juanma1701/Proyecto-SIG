import assert from 'node:assert/strict'
import {
  ESTADOS_MUNICIPIO,
  UMBRAL_BORDE_M_POR_DEFECTO,
  normalizarCodigoMun,
  resolverMunicipio
} from '../src/utils/territorial/resolverMunicipio.js'
import { RESOLUCION_MUNICIPIO } from '../src/utils/territorial/registroFuentes.js'

const PUNTO = { lat: 6.2442, lon: -75.5812 }

const conCodigos = (codigos) => ({
  estado: 'ok',
  registros: codigos.map((c) => ({ CODIGO_MUN: c, MUNICIPIO: 'x', SIMBOLOGIA: 'URBANO' }))
})
const VACIO = { estado: 'sin_resultados', registros: [] }
const FALLA = (estado = 'error_servicio') => ({ estado, registros: [], error: { codigo: 504, mensaje: 'x' } })

// amva = { d0, dD }; suelo = array de códigos | Error
function deps({ d0, dD = d0, suelo = [] } = {}) {
  const llamadas = []
  return {
    llamadas,
    consultarArcGIS: async (p) => {
      llamadas.push(p)
      return p.distanciaM > 0 ? dD : d0
    },
    consultarSuelo: async () => {
      if (suelo instanceof Error) throw suelo
      return { punto: {}, poligonos: suelo.map((c) => ({ atributos: { CODIGO_MUN: c } })) }
    }
  }
}

// 1. Caso normal: Medellín, coinciden las dos fuentes y no hay borde
{
  const d = deps({ d0: conCodigos(['001']), suelo: ['001'] })
  const r = await resolverMunicipio(PUNTO, d)
  assert.equal(r.estado, ESTADOS_MUNICIPIO.RESUELTO)
  assert.equal(r.codigo, '001')
  assert.equal(r.slug, 'Medellin')
  assert.equal(r.nombre, 'Medellín')
  assert.equal(r.metodo, 'amva_pot_clasificacion+suelo_pot')
  assert.equal(r.rotulo, RESOLUCION_MUNICIPIO.rotulo)
  assert.equal(r.cercaDeBorde, false)
  assert.equal(r.distanciaBordeM, null)
  assert.deepEqual(r.candidatos, [])
  assert.deepEqual(r.advertencias, [])
  // Parámetros de las consultas AMVA: capa 5, campos pedidos, d=0 y d=umbral
  assert.equal(d.llamadas.length, 2)
  assert.ok(d.llamadas.every((l) => l.servicio === 'AMVA_POT' && l.capaId === 5))
  assert.equal(d.llamadas[0].outFields, 'CODIGO_MUN,MUNICIPIO,SIMBOLOGIA')
  assert.deepEqual(d.llamadas.map((l) => l.distanciaM).sort((a, b) => a - b), [0, UMBRAL_BORDE_M_POR_DEFECTO])
  console.log('ok  caso normal: resuelto, rótulo, parámetros de consulta')
}

// 2. Borde: aparece otro municipio dentro del umbral -> candidatos, sin elegir
{
  const r = await resolverMunicipio(PUNTO, deps({ d0: conCodigos(['001']), dD: conCodigos(['001', '088']), suelo: ['001'] }))
  assert.equal(r.estado, ESTADOS_MUNICIPIO.AMBIGUO)
  assert.equal(r.codigo, null)
  assert.deepEqual(r.candidatos.map((c) => c.codigo).sort(), ['001', '088'])
  assert.equal(r.candidatos.find((c) => c.codigo === '088').nombre, 'Bello')
  assert.equal(r.cercaDeBorde, true)
  assert.ok(r.advertencias.includes('BORDE_CERCANO'))
  console.log('ok  borde con candidatos: ambiguo, no se elige')
}

// 3. Discrepancia AMVA vs Supabase
{
  const r = await resolverMunicipio(PUNTO, deps({ d0: conCodigos(['001']), suelo: ['088'] }))
  assert.equal(r.estado, ESTADOS_MUNICIPIO.AMBIGUO)
  assert.deepEqual(r.candidatos.map((c) => c.codigo).sort(), ['001', '088'])
  assert.ok(r.advertencias.includes('AMVA_Y_SUELO_DISCREPAN'))
  const r2 = await resolverMunicipio(PUNTO, deps({ d0: VACIO, suelo: ['088'] }))
  assert.equal(r2.estado, ESTADOS_MUNICIPIO.AMBIGUO)
  assert.deepEqual(r2.candidatos.map((c) => c.codigo), ['088'])
  console.log('ok  discrepancia entre fuentes: ambiguo')
}

// 4. Fuera del AMVA
{
  const r = await resolverMunicipio(PUNTO, deps({ d0: VACIO, suelo: [] }))
  assert.equal(r.estado, ESTADOS_MUNICIPIO.FUERA_DE_COBERTURA)
  assert.equal(r.codigo, null)
  const cerca = await resolverMunicipio(PUNTO, deps({ d0: VACIO, dD: conCodigos(['631']), suelo: [] }))
  assert.equal(cerca.estado, ESTADOS_MUNICIPIO.FUERA_DE_COBERTURA)
  assert.ok(cerca.advertencias.includes('FUERA_PERO_CERCA_DEL_AMVA'))
  console.log('ok  fuera del AMVA: fuera_de_cobertura')
}

// 5. Vacío del AMVA sin poder contrastar NO es "fuera de cobertura"
{
  const r = await resolverMunicipio(PUNTO, deps({ d0: VACIO, suelo: new Error('rpc timeout') }))
  assert.equal(r.estado, ESTADOS_MUNICIPIO.ERROR)
  assert.ok(r.advertencias.includes('AMVA_VACIO_NO_CONCLUYENTE'))
  console.log('ok  AMVA vacío + Supabase caída: error, no fuera_de_cobertura')
}

// 6. AMVA con HTTP 200 + {error}, 504 o timeout: se usa Supabase si da un solo código
{
  for (const falla of [FALLA('error_servicio'), FALLA('timeout'), FALLA('error_red')]) {
    const r = await resolverMunicipio(PUNTO, deps({ d0: falla, suelo: ['380'] }))
    assert.equal(r.estado, ESTADOS_MUNICIPIO.RESUELTO)
    assert.equal(r.slug, 'LaEstrella')
    assert.equal(r.metodo, 'suelo_pot_supabase')
    assert.ok(r.advertencias.includes('AMVA_NO_DISPONIBLE'))
  }
  const ambas = await resolverMunicipio(PUNTO, deps({ d0: FALLA(), suelo: new Error('x') }))
  assert.equal(ambas.estado, ESTADOS_MUNICIPIO.ERROR)
  const sinNada = await resolverMunicipio(PUNTO, deps({ d0: FALLA(), suelo: [] }))
  assert.equal(sinNada.estado, ESTADOS_MUNICIPIO.ERROR)
  console.log('ok  fallo del AMVA (200 con error, 504, timeout): respaldo en Supabase o error')
}

// 7. Supabase falla pero el AMVA responde: resuelto con advertencia
{
  const r = await resolverMunicipio(PUNTO, deps({ d0: conCodigos(['266']), suelo: new Error('boom') }))
  assert.equal(r.estado, ESTADOS_MUNICIPIO.RESUELTO)
  assert.equal(r.slug, 'Envigado')
  assert.equal(r.metodo, 'amva_pot_clasificacion')
  assert.ok(r.advertencias.includes('SIN_CONTRASTE_SUPABASE'))
  const sinPoligonos = await resolverMunicipio(PUNTO, deps({ d0: conCodigos(['266']), suelo: [] }))
  assert.equal(sinPoligonos.estado, ESTADOS_MUNICIPIO.RESUELTO)
  assert.ok(sinPoligonos.advertencias.includes('SUELO_POT_SIN_POLIGONOS_EN_PUNTO'))
  console.log('ok  Supabase caída o sin polígonos: resuelto con advertencia')
}

// 8. Consulta de borde fallida: resuelto, pero se avisa
{
  const r = await resolverMunicipio(PUNTO, deps({ d0: conCodigos(['360']), dD: FALLA('timeout'), suelo: ['360'] }))
  assert.equal(r.estado, ESTADOS_MUNICIPIO.RESUELTO)
  assert.equal(r.cercaDeBorde, null)
  assert.ok(r.advertencias.includes('BORDE_NO_VERIFICADO'))
  console.log('ok  consulta de borde fallida: resuelto con BORDE_NO_VERIFICADO')
}

// 9. Umbral 0: no hay segunda consulta
{
  const d = deps({ d0: conCodigos(['129']), suelo: ['129'] })
  const r = await resolverMunicipio(PUNTO, { ...d, umbralBordeM: 0 })
  assert.equal(r.estado, ESTADOS_MUNICIPIO.RESUELTO)
  assert.equal(d.llamadas.length, 1)
  assert.equal(r.cercaDeBorde, null)
  assert.ok(!r.advertencias.includes('BORDE_NO_VERIFICADO'))
  console.log('ok  umbral 0: una sola consulta al AMVA')
}

// 10. Cancelación
{
  const c = new AbortController()
  c.abort()
  const r = await resolverMunicipio(PUNTO, { ...deps({ d0: conCodigos(['001']), suelo: ['001'] }), signal: c.signal })
  assert.equal(r.estado, ESTADOS_MUNICIPIO.CANCELADA)
  console.log('ok  cancelación')
}

// 11. Códigos: normalización y código fuera del registro
{
  assert.equal(normalizarCodigoMun(1), '001')
  assert.equal(normalizarCodigoMun(' 88 '), '088')
  assert.equal(normalizarCodigoMun('   '), null)
  assert.equal(normalizarCodigoMun(null), null)
  const num = await resolverMunicipio(PUNTO, deps({ d0: conCodigos([1]), suelo: [1] }))
  assert.equal(num.estado, ESTADOS_MUNICIPIO.RESUELTO)
  assert.equal(num.codigo, '001')
  const raro = await resolverMunicipio(PUNTO, deps({ d0: conCodigos(['999']), suelo: ['999'] }))
  assert.equal(raro.estado, ESTADOS_MUNICIPIO.ERROR)
  assert.ok(raro.advertencias.includes('CODIGO_NO_REGISTRADO'))
  console.log('ok  códigos normalizados a 3 dígitos; código desconocido -> error')
}

// 12. Dependencias obligatorias
{
  await assert.rejects(() => resolverMunicipio(PUNTO, {}), TypeError)
  console.log('ok  exige consultarArcGIS y consultarSuelo')
}

console.log('\nTodo correcto.')
