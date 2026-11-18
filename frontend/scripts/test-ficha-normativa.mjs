import assert from 'node:assert/strict'
import { construirFichaNormativa } from '../src/utils/normativa/fichaNormativa.js'

function prueba(nombre, fn) {
  fn()
  console.log(`ok  ${nombre}`)
}

const fila = (cod, extra = {}) => ({ cod_subcat_uso: cod, subcategoria: null, area_general: null, ...extra })
const nombres = (tablas) => tablas.flatMap((t) => t.grupos.flatMap((g) => g.subcategorias)).join(' | ')
const buscar = (ficha, texto) => ficha.areas[0].matriz.flatMap((g) => g.filas).find((f) => f.actividad.includes(texto))

prueba('baja mixtura (código 11): matriz propia, sin herencia, tiendas de barrio y sin gimnasios', () => {
  const ficha = construirFichaNormativa('Medellin', [fila(11, { area_general: 'Áreas de baja mixtura' })])
  assert.equal(ficha.estado, 'ok')
  assert.equal(ficha.areas.length, 1)
  const a = ficha.areas[0]
  assert.equal(a.id, 'baja')
  assert.deepEqual(a.actividadesHeredadas, [])
  assert.equal(buscar(ficha, 'COMERCIO PEQUEÑO').permitido, true)
  assert.equal(buscar(ficha, 'COMERCIO MEDIANO').permitido, false)
  assert.equal(a.resumenMatriz.total, 53)
  assert.equal(a.resumenMatriz.permitidas + a.resumenMatriz.noPermitidas, 53)
  assert.match(nombres(a.actividadesPropias), /Tiendas de barrio/)
  assert.doesNotMatch(nombres(a.actividadesPropias), /Gimnasios/)
})

prueba('media mixtura (21): hereda las actividades de baja y nombra gimnasios y licor como propias', () => {
  const a = construirFichaNormativa('Medellin', [fila(21)]).areas[0]
  assert.equal(a.id, 'media')
  assert.deepEqual(a.actividadesHeredadas.map((h) => h.desdeAreaId), ['baja'])
  assert.match(nombres(a.actividadesPropias), /Gimnasios/)
  assert.match(nombres(a.actividadesHeredadas[0].tablas), /Droguerías/)
  assert.equal(a.matriz.flatMap((g) => g.filas).find((f) => f.actividad.includes('COMERCIO MEDIANO')).permitido, true)
})

prueba('alta mixtura: transformación incluye grandes superficies; centralidades y predominancia comparten tabla', () => {
  const t = construirFichaNormativa('Medellin', [fila(31)]).areas[0]
  assert.equal(t.id, 'altaTransformacion')
  assert.deepEqual(t.actividadesHeredadas.map((h) => h.desdeAreaId), ['baja', 'media'])
  assert.match(nombres(t.actividadesPropias), /Grandes superficies/)
  assert.equal(t.matriz.flatMap((g) => g.filas).find((f) => f.actividad.includes('GRANDES SUPERFICIES')).permitido, true)
  const c = construirFichaNormativa('Medellin', [fila(32)]).areas[0]
  const p = construirFichaNormativa('Medellin', [fila(33)]).areas[0]
  assert.equal(c.id, 'altaCentralidades')
  assert.equal(p.id, 'altaPredominanciaEconomica')
  assert.deepEqual(c.actividadesPropias, p.actividadesPropias)
  assert.equal(c.matriz.flatMap((g) => g.filas).find((f) => f.actividad.includes('GRANDES SUPERFICIES')).permitido, false)
})

prueba('códigos como texto se aceptan; repetidos se cuentan una sola vez', () => {
  const ficha = construirFichaNormativa('Medellin', [fila('11'), fila(11), fila(' 11 ')])
  assert.equal(ficha.areas.length, 1)
  assert.equal(ficha.areas[0].codigoSubcategoria, 11)
  assert.ok(!ficha.advertencias.some((x) => /varios polígonos/.test(x)))
})

prueba('espacio público y dotacional no tienen área de mixtura: se informan con su norma', () => {
  const ficha = construirFichaNormativa('Medellin', [fila(60), fila(41)])
  assert.equal(ficha.estado, 'sin_area_de_mixtura')
  assert.deepEqual(ficha.areas, [])
  assert.deepEqual(ficha.otrasCategorias.map((o) => o.id), ['dotacional', 'espacioPublicoExistente'])
  assert.match(ficha.otrasCategorias[0].norma, /art\. 252/)
  assert.ok(ficha.advertencias.some((x) => /varios polígonos/.test(x)))
})

prueba('un punto en mixtura y espacio público muestra ambos y avisa', () => {
  const ficha = construirFichaNormativa('Medellin', [fila(11), fila(41)])
  assert.equal(ficha.estado, 'ok')
  assert.equal(ficha.areas.length, 1)
  assert.equal(ficha.otrasCategorias.length, 1)
  assert.ok(ficha.advertencias.some((x) => /varios polígonos/.test(x)))
})

prueba('código desconocido o vacío: no se inventa nada y se avisa', () => {
  const ficha = construirFichaNormativa('Medellin', [fila(99, { subcategoria: 'X' }), fila(null)])
  assert.equal(ficha.estado, 'codigo_no_reconocido')
  assert.equal(ficha.noReconocidas.length, 2)
  assert.ok(ficha.advertencias.some((x) => /código de subcategoría 99/.test(x)))
  assert.ok(ficha.advertencias.some((x) => /\(vacío\)/.test(x)))
})

prueba('sin filas (punto fuera del suelo urbano o en un vacío): estado propio y aviso', () => {
  for (const entrada of [[], null, undefined]) {
    const ficha = construirFichaNormativa('Medellin', entrada)
    assert.equal(ficha.estado, 'sin_filas')
    assert.deepEqual(ficha.areas, [])
    assert.ok(ficha.advertencias.some((x) => /ningún polígono/.test(x)))
  }
})

prueba('municipio sin régimen de mixtura cargado: no hay ficha', () => {
  assert.equal(construirFichaNormativa('Itagui', [fila(11)]).estado, 'sin_regimen_cargado')
  assert.equal(construirFichaNormativa('Envigado', [fila(11)]).estado, 'sin_regimen_cargado')
})

prueba('la ficha informa, no decide: sin veredicto, con advertencias, reglas, PAU y limitaciones', () => {
  const ficha = construirFichaNormativa('Medellin', [fila(21)])
  for (const campo of ['veredicto', 'resultado', 'permitido', 'compatible']) assert.ok(!(campo in ficha), campo)
  assert.ok(ficha.advertencias.some((x) => /no autoriza ninguna actividad/.test(x)))
  assert.ok(ficha.advertencias.some((x) => /aproximación técnica/.test(x)))
  assert.ok(ficha.advertencias.some((x) => /Proyecto de Acuerdo 104 de 2026/.test(x)))
  assert.ok(ficha.advertencias.some((x) => /reglas? r1|regla r1/.test(x)))
  assert.equal(ficha.reglas.length, 7)
  assert.ok(ficha.pau.filas === 79 && ficha.pau.requiere.length > 0 && ficha.pau.noRequiere.length > 0)
  assert.ok(ficha.pau.requiere.includes('Gimnasio') && ficha.pau.noRequiere.includes('Droguerías'))
  assert.ok(ficha.limitaciones.length >= 8)
  assert.match(ficha.instrumento.nombre, /Acuerdo 48 de 2014/)
})

console.log('Todo correcto.')