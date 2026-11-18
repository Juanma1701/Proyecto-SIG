import assert from 'node:assert/strict'
import {
  ESTADOS_BLOQUE,
  crearBloque,
  crearFuente,
  estadoBloqueDesdeConsulta,
  limpiarAtributos,
  limpiarValor
} from '../src/utils/territorial/modelo.js'
import {
  adaptarClasificacion,
  adaptarGenerico,
  adaptarUsoActual,
  adaptadorPorBloque
} from '../src/utils/territorial/adaptadores/arcgis.js'
import {
  adaptarSueloSupabase,
  adaptarUsosMedellin,
  esCapaClasificacion
} from '../src/utils/territorial/adaptadores/supabase.js'

// 1. Limpieza: recorta, vacío -> null, no toca otros tipos
assert.equal(limpiarValor('  Comercio  '), 'Comercio')
assert.equal(limpiarValor('   '), null)
assert.equal(limpiarValor(''), null)
assert.equal(limpiarValor(undefined), null)
assert.equal(limpiarValor(0), 0)
assert.equal(limpiarValor(null), null)
assert.deepEqual(limpiarAtributos({ a: ' x ', b: '  ', c: 3 }), { a: 'x', b: null, c: 3 })
console.log('ok  limpieza de valores: recorta, vacío -> null')

// 2. Estados de consulta -> estados de bloque
assert.equal(estadoBloqueDesdeConsulta('ok'), 'ok')
assert.equal(estadoBloqueDesdeConsulta('timeout'), 'timeout')
assert.equal(estadoBloqueDesdeConsulta('error_servicio'), 'error_servicio')
assert.equal(estadoBloqueDesdeConsulta('cancelada'), null)
assert.equal(estadoBloqueDesdeConsulta('inventado'), null)
console.log('ok  traducción de estados de consulta a estados de bloque')

// 3. Fábricas validan
{
  const fuente = crearFuente({ origen: 'arcgis_amva', servicio: 'X', capaId: 1 })
  assert.throws(() => crearFuente({ origen: 'otro', servicio: 'X' }), RangeError)
  assert.throws(() => crearBloque({ id: 'a', tipo: 'inventado', estado: 'ok', fuente }), RangeError)
  assert.throws(() => crearBloque({ id: 'a', tipo: 'riesgo', estado: 'permitido', fuente }), RangeError)
  const b = crearBloque({ id: 'a', tipo: 'riesgo', estado: ESTADOS_BLOQUE.OK, fuente, advertencias: ['RIESGOS_SOLO_CAD', 'RIESGOS_SOLO_CAD'] })
  assert.equal(b.advertencias.length, 1)
  assert.ok(b.advertencias[0].texto.length > 20)
  assert.ok(!('permitido' in b) && !('prohibido' in b))
  console.log('ok  fábricas: validan tipo y estado, advertencias con texto, sin campo permitido/prohibido')
}

// 4. Clasificación AMVA: clase desde SIMBOLOGIA; original intacto
{
  const original = { SIMBOLOGIA: '  Suelo   Urbano ', CLASIFICACION: '  ', OBJECTID: 7 }
  const [r] = adaptarClasificacion([original])
  assert.equal(r.atributosOriginales, original)
  assert.equal(original.SIMBOLOGIA, '  Suelo   Urbano ')
  assert.equal(r.normalizado.clase, 'urbano')
  assert.equal(r.normalizado.etiquetaOriginal, 'Suelo   Urbano')
  assert.equal(r.atributosLimpios.CLASIFICACION, null)
  const [raro] = adaptarClasificacion([{ SIMBOLOGIA: 'MIXTO' }, { }])
  assert.equal(raro.normalizado.clase, null)
  assert.equal(adaptarClasificacion([{}])[0].normalizado.etiquetaOriginal, null)
  console.log('ok  clasificación AMVA: clase desde SIMBOLOGIA, resto null, original intacto')
}

// 5. Uso actual y genérico
{
  const [u] = adaptarUsoActual([{ USO_ACTUAL: ' Comercio ', INDICADOR: 1 }])
  assert.equal(u.normalizado.etiquetaOriginal, 'Comercio')
  assert.equal(u.normalizado.clase, null)
  const [g] = adaptarGenerico([{ USO: ' x ' }])
  assert.equal(g.normalizado, null)
  assert.equal(g.atributosLimpios.USO, 'x')
  assert.equal(adaptadorPorBloque('clasificacion_suelo'), adaptarClasificacion)
  assert.equal(adaptadorPorBloque('uso_actual'), adaptarUsoActual)
  assert.equal(adaptadorPorBloque('riesgo'), adaptarGenerico)
  assert.equal(adaptadorPorBloque('uso_normativo_pot'), adaptarGenerico)
  console.log('ok  uso actual solo etiqueta; genérico sin normalizar; selector por bloque')
}

// 6. Supabase: agrupa por tipo, clase solo en clasificación, no usa `categoria`
{
  assert.equal(esCapaClasificacion('Clasificación_del_suelo'), true)
  assert.equal(esCapaClasificacion('clasificacion'), true)
  assert.equal(esCapaClasificacion('suelo_proteccion'), false)
  assert.equal(esCapaClasificacion(null), false)
  const poligonos = [
    { id: 1, municipio: 'Medellín', categoria: 'urbano', capa_origen: 'clasificacion_suelo', nombre: 'a', atributos: { CODIGO_MUN: '001', SIMBOLOGIA: 'EXPANSIÓN URBANA' } },
    { id: 2, municipio: 'Medellín', categoria: 'proteccion', capa_origen: 'suelo_proteccion', nombre: 'b', atributos: { SIMBOLOGIA: 'PROTECCIÓN' } },
    { id: 3, municipio: 'Medellín', categoria: 'riesgo', capa_origen: 'riesgos', nombre: 'c', atributos: {} },
    { id: 4, municipio: 'Medellín', categoria: 'urbano', capa_origen: 'otra_capa', nombre: 'd', atributos: { SIMBOLOGIA: 'URBANO' } }
  ]
  const r = adaptarSueloSupabase({ punto: {}, poligonos })
  // categoria='urbano' pero SIMBOLOGIA de expansión: manda SIMBOLOGIA
  assert.equal(r.porTipo.clasificacion_suelo[0].normalizado.clase, 'expansion')
  assert.equal(r.porTipo.clasificacion_suelo[0].meta.categoriaTabla, 'urbano')
  assert.equal(r.porTipo.proteccion.length, 1)
  assert.equal(r.porTipo.proteccion[0].normalizado, null)
  assert.equal(r.porTipo.riesgo.length, 1)
  assert.equal(r.sinBloque, 1)
  assert.equal(r.total, 4)
  assert.equal(r.posibleRecorte, false)
  assert.equal(adaptarSueloSupabase(poligonos).total, 4)
  assert.equal(adaptarSueloSupabase(null).total, 0)
  assert.equal(adaptarSueloSupabase({ poligonos: new Array(15).fill({ categoria: 'riesgo', atributos: {} }) }).posibleRecorte, true)
  console.log('ok  suelo_pot: agrupa por bloque, clase desde SIMBOLOGIA (no categoria), cuenta los sin bloque')
}

// 7. Usos de Medellín: tolera las formas posibles, sin inventar campos
{
  assert.equal(adaptarUsosMedellin(null).length, 0)
  assert.equal(adaptarUsosMedellin([{ a: 1 }, null, { b: 2 }]).length, 2)
  assert.equal(adaptarUsosMedellin({ usos: [{ a: 1 }] }).length, 1)
  assert.deepEqual(adaptarUsosMedellin({ uso: 'x' })[0].atributosOriginales, { uso: 'x' })
  console.log('ok  usos de Medellín: formas posibles toleradas, atributos tal como llegan')
}

console.log('\nTodo correcto.')
