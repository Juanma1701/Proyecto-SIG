import assert from 'node:assert/strict'
import { LA_ESTRELLA, ZONAS_CON_MATRIZ, avisosDeActividad, categoriaEnZona, estadoEnAreas, lecturaAlterna } from '../src/utils/normativa/laEstrella.js'
import { ACTIVIDADES, TIPOLOGIAS_CANDIDATAS, actividadPorId, validarCatalogo } from '../src/utils/normativa/actividades.js'
import { RESULTADOS, evaluarActividad, evaluarTipologiaElegida } from '../src/utils/normativa/evaluar.js'
import { erroresDeInstrumentos, instrumentoDeMunicipio, codigosSinDefinir } from '../src/utils/normativa/index.js'

const ok = (m) => console.log(`ok ${m}`)
const area = (id) => LA_ESTRELLA.zonas.find((z) => z.codigo === id)
const evaluar = (areaId, actividadId) =>
  evaluarActividad({ instrumento: LA_ESTRELLA, municipioSlug: 'LaEstrella', zona: area(areaId), actividadId })

// Regresión de los otros municipios
assert.deepEqual(erroresDeInstrumentos(), [])
assert.deepEqual(validarCatalogo(), [])
assert.equal(actividadPorId('licorera').mapeos.Itagui.tipologia, 'C-2')
assert.equal(actividadPorId('restaurante').mapeoCiiu.Envigado.ciiu, '552')
assert.deepEqual(TIPOLOGIAS_CANDIDATAS.Itagui.gimnasio, ['S-4', 'S-5', 'S-6', 'D-1'])
assert.equal(instrumentoDeMunicipio('LaEstrella'), LA_ESTRELLA)
assert.deepEqual(codigosSinDefinir('LaEstrella'), [])
ok('regresión: instrumentos y catálogo válidos, ramas de Itagüí y Envigado intactas')

// Datos: 31 tipologías y 15 áreas; cada área reparte los códigos (los no listados se declaran)
const todos = LA_ESTRELLA.tipologias.map((t) => t.codigo)
assert.equal(todos.length, 31)
assert.equal(ZONAS_CON_MATRIZ.length, 15)
const NO_LISTADOS = { IND2: ['C1', 'SRC2'], IND3: ['C9'], COR1: ['C9', 'SRC1', 'SRC2'], COR2: ['SRC1', 'SRC2'], ESP: ['SRC1', 'SRC2'] }
for (const z of LA_ESTRELLA.zonas) {
  const listados = new Set(Object.values(z.categorias).flat())
  assert.deepEqual([...new Set([...listados, ...z.noListados])].sort(), [...todos].sort(), z.codigo)
  assert.equal(z.noListados.some((c) => listados.has(c)), false, z.codigo)
  assert.deepEqual(z.noListados, NO_LISTADOS[z.codigo] ?? [], z.codigo)
}
ok('15 áreas: reparten los 31 códigos y los no listados están declarados')

// Códigos repetidos en dos categorías: lectura más restrictiva y aviso
assert.equal(categoriaEnZona(area('RES2'), 'I3'), 'prohibido')
assert.ok(area('RES2').prohibidosCodigos.includes('I3') && !area('RES2').condicionados.includes('I3'))
assert.equal(categoriaEnZona(area('COR1'), 'S11'), 'prohibido')
assert.equal(categoriaEnZona(area('AAM2'), 'S5'), 'restringido')
assert.ok(area('AAM2').compatibles.includes('S5') && area('AAM2').condicionados.includes('S5'))
assert.ok(area('AAM3').compatibles.includes('S10') && area('AAM3').condicionados.includes('S10'))
assert.equal(area('ESP').compatibles.filter((c) => c === 'C5').length, 1)
for (const [id, codigo] of [['RES2', 'I3'], ['AAM2', 'S5'], ['AAM3', 'S10'], ['COR1', 'S11'], ['ESP', 'C5']]) {
  assert.ok(area(id).observaciones.some((o) => o.includes(`lista ${codigo} como`)), `${id} ${codigo}`)
}
ok('códigos repetidos: se toma la lectura más restrictiva y queda el aviso')

// Resultados concluyentes cuando se conoce el área (la lectura de la tabla)
assert.equal(evaluar('RES1', 'supermercado').resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(evaluar('RES6', 'supermercado').resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(evaluar('RES2', 'supermercado').resultado, RESULTADOS.CONDICIONADA)
assert.equal(evaluar('AAM3', 'supermercado').resultado, RESULTADOS.COMPATIBLE)
assert.equal(evaluar('IND1', 'supermercado').resultado, RESULTADOS.COMPATIBLE)
assert.equal(evaluar('COR2', 'supermercado').resultado, RESULTADOS.COMPATIBLE)
assert.equal(evaluar('ESP', 'supermercado').resultado, RESULTADOS.COMPATIBLE)
assert.equal(evaluar('RES1', 'discoteca').resultado, RESULTADOS.CONDICIONADA)
assert.equal(evaluar('RES6', 'discoteca').resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(evaluar('IND3', 'discoteca').resultado, RESULTADOS.INCOMPATIBLE)
const contradictoria = evaluar('AAM2', 'discoteca')
assert.equal(contradictoria.resultado, RESULTADOS.CONDICIONADA)
assert.ok(contradictoria.advertencias.some((a) => a.includes('se contradice')))
assert.equal(evaluar('RES4', 'farmacia').resultado, RESULTADOS.COMPATIBLE)
assert.equal(evaluar('AAM3', 'farmacia').resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(evaluar('RES1', 'gimnasio').resultado, RESULTADOS.CONDICIONADA)
assert.equal(evaluar('RES2', 'gimnasio').resultado, RESULTADOS.COMPATIBLE)
assert.equal(evaluar('RES1', 'licorera').resultado, RESULTADOS.COMPATIBLE)
assert.equal(evaluar('RES6', 'licorera').resultado, RESULTADOS.CONDICIONADA)
ok('resultados de la tabla por área coinciden con la Tabla 160')

// Prohibido, no listado y restringido se explican distinto
assert.match(evaluar('RES1', 'supermercado').razones[0], /clasifica la tipología C7.*prohibido/)
const noListado = evaluar('IND2', 'farmacia')
assert.equal(noListado.resultado, RESULTADOS.INCOMPATIBLE)
assert.match(noListado.razones[0], /no lista la tipología C1/)
assert.match(noListado.razones[0], /Decreto 1077 de 2015/)
assert.ok(evaluar('RES1', 'discoteca').condiciones.some((c) => c.includes('controles espaciales y ambientales')))
ok('prohibido, no listado y restringido se explican con su regla')

// No concluyentes y tipología elegida
for (const id of ['minimercado', 'restaurante', 'tienda_tecnologia']) {
  const r = evaluar('AAM3', id)
  assert.equal(r.resultado, RESULTADOS.INSUFICIENTE, id)
  assert.ok(r.hipotesis, id)
}
const elegidaProhibida = evaluarTipologiaElegida({ instrumento: LA_ESTRELLA, zona: area('AAM3'), tipologiaCodigo: 'C1' })
assert.equal(elegidaProhibida.estadoEnZona, 'prohibida')
assert.equal(evaluarTipologiaElegida({ instrumento: LA_ESTRELLA, zona: area('RES4'), tipologiaCodigo: 'C1' }).estadoEnZona, 'compatible')
assert.equal(evaluarTipologiaElegida({ instrumento: LA_ESTRELLA, zona: area('IND2'), tipologiaCodigo: 'C1' }).estadoEnZona, 'no_listada')
assert.equal(evaluarTipologiaElegida({ instrumento: LA_ESTRELLA, zona: area('AAM2'), tipologiaCodigo: 'S5' }).estadoEnZona, 'contradictoria')
ok('no concluyentes: actividades inferidas y estados de la tipología elegida')

// Marcas (asteriscos) con su nota
for (const id of ['RES1', 'RES2', 'AAM3']) {
  for (const simbolo of new Set(Object.values(area(id).marcas))) {
    assert.ok(area(id).notasMarcas[simbolo].texto.length > 10, `${id} ${simbolo}`)
  }
}
ok('los asteriscos de la tabla tienen su nota')

// Lecturas alternas y avisos por actividad
assert.equal(lecturaAlterna(area('RES1'), 'licorera').categoria, 'restringido')
assert.equal(lecturaAlterna(area('AAM3'), 'licorera').categoria, 'principal')
assert.equal(lecturaAlterna(area('RES1'), 'supermercado').categoria, 'prohibido')
assert.equal(lecturaAlterna(area('RES4'), 'farmacia'), null)
assert.match(lecturaAlterna(area('COR1'), 'gimnasio').texto, /SRC2 no está listado/)
assert.ok(avisosDeActividad('licorera').some((a) => a.includes('200 metros')))
assert.ok(avisosDeActividad('supermercado').some((a) => a.includes('600 m²')))
assert.deepEqual(avisosDeActividad('farmacia'), [])
ok('lecturas alternas y avisos de licor y gran formato')

// Por área: la lista de las 15 áreas
const lista = estadoEnAreas('C7')
assert.equal(lista.length, 15)
assert.equal(lista.find((e) => e.areaId === 'RES1').categoria, 'prohibido')
assert.equal(lista.find((e) => e.areaId === 'AAM3').categoria, 'principal')
assert.equal(estadoEnAreas('C1').find((e) => e.areaId === 'IND2').categoria, null)
assert.equal(estadoEnAreas('S5').find((e) => e.areaId === 'AAM2').contradictoria, true)
ok('estadoEnAreas cubre las 15 áreas')

// Advertencias de cobertura, vigencia y transcripción
const adv = evaluar('RES4', 'farmacia').advertencias.join(' ')
assert.match(adv, /parcial/)
assert.match(adv, /vigencia/)
assert.match(adv, /PDF escaneado/)
assert.match(adv, /área de actividad/)
ok('la tarjeta advierte cobertura parcial, vigencia, transcripción y que no hay mapa del área')

// Sin marcas internas
const sinMarcas = (x) => assert.ok(!JSON.stringify(x).includes('[verificar]'))
sinMarcas(LA_ESTRELLA)
for (const a of ACTIVIDADES) sinMarcas(a.mapeos.LaEstrella)
for (const id of ['licorera', 'minimercado', 'restaurante', 'discoteca']) sinMarcas(evaluar('RES1', id))
ok('ninguna marca [verificar] llega a la tarjeta')

// Inmutabilidad
assert.throws(() => LA_ESTRELLA.zonas[0].compatibles.push('X'))
assert.throws(() => { LA_ESTRELLA.zonas[0].categorias.principal = [] })
assert.throws(() => { LA_ESTRELLA.tipologias[0].nombre = 'otro' })
ok('el instrumento es inmutable')

console.log('Todo correcto.')