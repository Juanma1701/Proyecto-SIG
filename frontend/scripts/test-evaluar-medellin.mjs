import assert from 'node:assert/strict'
import { ACTIVIDADES_MEDELLIN, GRUPOS_MATRIZ, tamanoDeActividad } from '../src/utils/normativa/actividadesMedellin.js'
import { RESULTADOS } from '../src/utils/normativa/evaluar.js'
import { evaluarMedellin } from '../src/utils/normativa/evaluarMedellin.js'
import { SITUACIONES, esMedellin, valorarPunto } from '../src/utils/normativa/evaluarEnPunto.js'
import { instrumentoDeMunicipio } from '../src/utils/normativa/index.js'
import { areasDeMixtura } from '../src/utils/normativa/usosMedellin.js'

const instrumento = instrumentoDeMunicipio('Medellin')
const regimen = instrumento.regimenMixtura
const MEDELLIN = { estado: 'resuelto', nombre: 'Medellín', slug: 'medellin' }
const ALTA = ['altaTransformacion', 'altaCentralidades', 'altaPredominanciaEconomica']
const act = (id) => ({ id, nombre: id.replace('_', ' ') })
const evaluar = (areaIds, id, tamano = {}) => evaluarMedellin({ instrumento, areaIds, actividad: act(id), tamano })
const uso = (...registros) => ({ bloques: [{ tipo: 'uso_normativo_pot', registros: registros.map((atributosLimpios) => ({ atributosLimpios })) }] })

// 1. Los patrones de la configuración encuentran exactamente una fila de la matriz
for (const [grupoId, grupo] of Object.entries(GRUPOS_MATRIZ)) {
  for (const r of grupo.rangos) {
    const filas = regimen.matriz.filter((f) => f.actividad.toLowerCase().includes(r.fila))
    assert.equal(filas.length, 1, `${grupoId}: "${r.fila}" encontró ${filas.length} filas`)
  }
}
for (const [id, config] of Object.entries(ACTIVIDADES_MEDELLIN)) {
  assert.ok(GRUPOS_MATRIZ[config.grupo], id)
  for (const p of config.pau) {
    assert.ok(regimen.requierePau.some((x) => x.subcategoria.toLowerCase().includes(p)), `${id}: PAU "${p}"`)
  }
}
assert.equal(tamanoDeActividad('minimercado'), 'area')
assert.equal(tamanoDeActividad('licorera'), 'aforo')
assert.equal(tamanoDeActividad('inventada'), null)
console.log('ok  patrones: cada rango encuentra una sola fila de la matriz y cada actividad su fila de PAU')

// 2. Del registro de la capa al área de mixtura
let a = areasDeMixtura(instrumento, uso({ cod_subcat_uso: 21 }))
assert.deepEqual([a.estado, a.areaIds], ['ok', ['media']])
a = areasDeMixtura(instrumento, uso({ COD_SUBCAT_USO: '32', area_general: 'Áreas y corredores de alta mixtura' }))
assert.deepEqual(a.areaIds, ['altaCentralidades'])
assert.deepEqual(areasDeMixtura(instrumento, uso({ cod_subcat_uso: 11 }, { cod_subcat_uso: 11 })).areaIds, ['baja'])
a = areasDeMixtura(instrumento, uso({ cod_subcat_uso: 60 }))
assert.deepEqual([a.estado, a.categoria], ['sin_regimen', 'dotacional'])
assert.equal(areasDeMixtura(instrumento, uso({ cod_subcat_uso: 41 })).categoria, 'espacioPublicoExistente')
assert.equal(areasDeMixtura(instrumento, uso({ cod_subcat_uso: 50 })).categoria, 'espacioPublicoProyectado')
a = areasDeMixtura(instrumento, uso({ area_general: 'Áreas de baja mixtura' }))
assert.deepEqual([a.areaIds, a.porTexto], [['baja'], true])
assert.deepEqual(areasDeMixtura(instrumento, uso({ AREAGRALUSO: 'Áreas y corredores de alta mixtura' })).areaIds, ALTA)
a = areasDeMixtura(instrumento, uso({ cod_subcat_uso: 11 }, { cod_subcat_uso: 21 }))
assert.deepEqual([a.estado, a.codigos], ['varias_areas', [11, 21]])
assert.equal(areasDeMixtura(instrumento, uso({ otro: 'x' })).estado, 'sin_codigo')
assert.equal(areasDeMixtura(instrumento, uso({ cod_subcat_uso: 99 })).estado, 'sin_codigo')
assert.equal(areasDeMixtura(instrumento, { bloques: [] }).estado, 'sin_registros')
assert.equal(areasDeMixtura(instrumento, { bloques: [{ tipo: 'riesgo', registros: [{ atributosLimpios: { cod_subcat_uso: 11 } }] }] }).estado, 'sin_registros')
assert.equal(areasDeMixtura({}, uso({ cod_subcat_uso: 11 })).estado, 'sin_regimen_cargado')
console.log('ok  área de mixtura: código, texto, alta sin subcategoría, dotacional, espacio público y varias áreas (no elige)')

// 3. Comercio por tamaño
let r = evaluar(['baja'], 'minimercado', { areaM2: 100 })
assert.equal(r.resultado, RESULTADOS.COMPATIBLE)
assert.ok(r.referencias.some((x) => x.articulo === '255' && x.paginaPdf === 351))
r = evaluar(['baja'], 'minimercado', { areaM2: 200 })
assert.equal(r.resultado, RESULTADOS.INCOMPATIBLE)
assert.match(r.razones[0], /hasta 200 m² y de 200 a 400 m²/)
assert.equal(evaluar(['media'], 'minimercado', { areaM2: 399 }).resultado, RESULTADOS.COMPATIBLE)
assert.equal(evaluar(['baja'], 'farmacia', { areaM2: 150 }).resultado, RESULTADOS.COMPATIBLE)
assert.equal(evaluar(['baja'], 'tienda_tecnologia', { areaM2: 150 }).resultado, RESULTADOS.COMPATIBLE)
r = evaluar(['baja'], 'supermercado', { areaM2: 1000 })
assert.equal(r.resultado, RESULTADOS.INCOMPATIBLE)
assert.match(r.razones[1], /Alta mixtura – áreas de actividad económica en transformación/)
assert.doesNotMatch(r.razones[1], /baja mixtura/)
r = evaluar(['media'], 'supermercado', { areaM2: 300 })
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.match(r.condiciones[0], /no nombra esta actividad/)
assert.equal(evaluar(['altaCentralidades'], 'supermercado', { areaM2: 3000 }).resultado, RESULTADOS.INCOMPATIBLE)
r = evaluar(['altaTransformacion'], 'supermercado', { areaM2: 3000 })
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.match(r.condiciones[0], /PAU/)
assert.ok(r.referencias.some((x) => x.articulo === '256'))
console.log('ok  comercio: tamaño, corte justo en 200 m² (lectura restrictiva), supermercado y PAU por más de 2.500 m²')

// 4. Servicios por aforo, con PAU
r = evaluar(['baja'], 'licorera', { aforo: 1 })
assert.equal(r.resultado, RESULTADOS.INCOMPATIBLE)
r = evaluar(['media'], 'licorera', { aforo: 1 })
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.match(r.condiciones[0], /protocolo ambiental y urbanístico/)
assert.ok(r.advertencias.some((x) => /venta y el consumo de licor/.test(x)))
assert.equal(evaluar(['media'], 'licorera', { aforo: 2 }).resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(evaluar(['altaCentralidades'], 'discoteca', { aforo: 4 }).resultado, RESULTADOS.CONDICIONADA)
assert.equal(evaluar(['baja'], 'gimnasio', { aforo: 1 }).resultado, RESULTADOS.CONDICIONADA)
assert.equal(evaluar(['baja'], 'gimnasio', { aforo: 2 }).resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(evaluar(['media'], 'gimnasio', { aforo: 2 }).resultado, RESULTADOS.CONDICIONADA)
assert.equal(evaluar(['baja'], 'restaurante', { aforo: 1 }).resultado, RESULTADOS.CONDICIONADA)
assert.equal(evaluar(['baja'], 'restaurante', { aforo: 2 }).resultado, RESULTADOS.INCOMPATIBLE)
console.log('ok  servicios: aforo, licor, discoteca, gimnasio y restaurante con la exigencia de PAU')

// 5. Sin tamaño: concluye solo si todos los rangos coinciden; si no, muestra la tabla por rangos
r = evaluar(['media'], 'minimercado')
assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
assert.equal(r.rangos.length, 4)
assert.deepEqual(r.rangos.map((x) => x.permitido), [true, true, false, false])
assert.match(r.queFalta, /el área del local/)
r = evaluar(['baja'], 'licorera')
assert.equal(r.resultado, RESULTADOS.INCOMPATIBLE)
assert.match(r.razones[0], /para cualquier aforo/)
assert.equal(evaluar(['altaCentralidades'], 'restaurante').resultado, RESULTADOS.CONDICIONADA)
r = evaluar(['media'], 'gimnasio')
assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
assert.match(r.queFalta, /el aforo/)
assert.equal(evaluar(['baja'], 'minimercado', { areaM2: 0 }).resultado, RESULTADOS.INSUFICIENTE)
assert.equal(evaluar(['baja'], 'licorera', { aforo: 7 }).resultado, RESULTADOS.INCOMPATIBLE)
console.log('ok  sin tamaño: tabla por rangos y qué falta; tamaño inválido se trata como no informado')

// 6. Alta mixtura sin subcategoría: no se concluye si las tres columnas no coinciden
r = evaluar(ALTA, 'supermercado', { areaM2: 500 })
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.equal(r.datos.areaMixtura.id, null)
assert.ok(r.advertencias.some((x) => /sin precisar la subcategoría/.test(x)))
r = evaluar(ALTA, 'supermercado', { areaM2: 3000 })
assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
assert.match(r.queFalta, /subcategoría de alta mixtura/)
assert.deepEqual(r.rangos.at(-1).permitido, null)
console.log('ok  alta mixtura sin subcategoría: concluye solo si las tres coinciden')

// 7. Límites del motor
assert.equal(evaluar([], 'licorera', { aforo: 1 }).resultado, RESULTADOS.INSUFICIENTE)
assert.equal(evaluar(['inventada'], 'licorera', { aforo: 1 }).resultado, RESULTADOS.INSUFICIENTE)
r = evaluarMedellin({ instrumento, areaIds: ['baja'], actividad: { id: 'zapateria', nombre: 'zapatería' } })
assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
assert.equal(evaluarMedellin({ instrumento: {}, areaIds: ['baja'], actividad: act('licorera') }).resultado, RESULTADOS.INSUFICIENTE)
for (const id of Object.keys(ACTIVIDADES_MEDELLIN)) {
  for (const areaIds of [['baja'], ['media'], ALTA]) {
    const x = evaluar(areaIds, id, { areaM2: 150, aforo: 2 })
    assert.match(x.aviso, /no es un concepto de uso del suelo/i)
    assert.doesNotMatch(JSON.stringify(x), /autorizad(?!ión|ion)/i)
    assert.ok(x.advertencias.some((t) => /extrajeron del texto del PDF/.test(t)))
    assert.ok(x.advertencias.some((t) => /Proyecto de Acuerdo 104 de 2026/.test(t) && !/\[verificar\]/.test(t)))
  }
}
const copia = JSON.stringify(regimen)
evaluar(['media'], 'licorera', { aforo: 1 })
assert.equal(JSON.stringify(regimen), copia)
console.log('ok  actividad desconocida, áreas inválidas, aviso fijo, vigencia sin [verificar] y datos sin mutar')

// 8. Integrado con valorarPunto
assert.equal(esMedellin(MEDELLIN), true)
assert.equal(esMedellin({ estado: 'resuelto', slug: 'itagui' }), false)
const valorar = (resultadoTerritorial, actividadId, tamano, municipio = MEDELLIN) =>
  valorarPunto({ municipio, resultadoTerritorial, actividadId, tamano })
let v = valorar(uso({ cod_subcat_uso: 11 }), 'minimercado', { areaM2: 100 })
assert.equal(v.situacion, SITUACIONES.EVALUADA)
assert.equal(v.resultado, RESULTADOS.COMPATIBLE)
v = valorar(uso({ area_general: 'Áreas de baja mixtura' }), 'minimercado', { areaM2: 100 })
assert.equal(v.resultado, RESULTADOS.COMPATIBLE)
assert.ok(v.advertencias.some((x) => /nombre del área general/.test(x)))
v = valorar(uso({ cod_subcat_uso: 60 }), 'licorera', { aforo: 1 })
assert.equal(v.situacion, SITUACIONES.ZONA_SIN_IDENTIFICAR)
assert.match(v.razones[0], /art\. 252/)
v = valorar(uso({ cod_subcat_uso: 11 }, { cod_subcat_uso: 21 }), 'licorera', { aforo: 1 })
assert.equal(v.situacion, SITUACIONES.VARIAS_ZONAS)
assert.equal(v.resultado, RESULTADOS.INSUFICIENTE)
v = valorar(null, 'licorera', {})
assert.equal(v.situacion, SITUACIONES.ZONA_SIN_IDENTIFICAR)
assert.match(v.razones[0], /Medellín/)
assert.ok(v.queFalta)
v = valorar(uso({ otro: 'x' }), 'licorera', {})
assert.equal(v.situacion, SITUACIONES.ZONA_SIN_IDENTIFICAR)
v = valorar(uso({ cod_subcat_uso: 11 }), '', {})
assert.equal(v.situacion, SITUACIONES.ACTIVIDAD_NO_ELEGIDA)
v = valorar(uso({ cod_subcat_uso: 11 }), 'licorera', {}, { estado: 'resuelto', nombre: 'Bello', slug: 'bello' })
assert.equal(v.situacion, SITUACIONES.NORMA_NO_CARGADA)
v = valorar(uso({ cod_subcat_uso: 21 }), 'gimnasio', {})
assert.equal(v.resultado, RESULTADOS.INSUFICIENTE)
assert.equal(v.situacion, SITUACIONES.EVALUADA)
assert.ok(v.rangos.length > 0)
console.log('ok  valorarPunto en Medellín: evaluada, por texto, sin régimen, varias áreas, sin datos, sin actividad y otro municipio')

console.log('\nTodo correcto.')