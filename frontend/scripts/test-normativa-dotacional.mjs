import assert from 'node:assert/strict'
import { validarInstrumento } from '../src/utils/normativa/esquema.js'
import {
  erroresDeInstrumentos,
  instrumentoDeMunicipio,
  reglaDotacionalDeTipo,
  tipologiaPorCodigo
} from '../src/utils/normativa/index.js'

const itagui = instrumentoDeMunicipio('Itagui')
const reglas = itagui.reglasDotacionales

function prueba(nombre, fn) {
  fn()
  console.log(`ok  ${nombre}`)
}

prueba('12 tipos dotacionales, sin repetidos, instrumento válido', () => {
  assert.deepEqual(erroresDeInstrumentos(), [])
  assert.equal(reglas.length, 12)
  assert.equal(new Set(reglas.map((r) => r.tipo)).size, 12)
  for (const t of ['Educación', 'Deportivo y Recreativo', 'Cultura', 'Salud', 'Transporte', 'Seguridad', 'Bienestar social', 'Comunitario', 'Servicios Públicos', 'Institucional', 'Multipropósito', 'Sanitario']) {
    assert.ok(reglaDotacionalDeTipo('Itagui', t), t)
  }
  assert.equal(reglaDotacionalDeTipo('Itagui', 'Inventado'), null)
  assert.equal(reglaDotacionalDeTipo('Medellin', 'Salud'), null)
})

prueba('todos los códigos citados tienen definición cargada', () => {
  for (const r of reglas) {
    for (const c of [...r.compatibles, ...r.condicionados]) assert.ok(tipologiaPorCodigo('Itagui', c), `${r.tipo}: ${c}`)
  }
})

prueba('regla común y variaciones por tipo', () => {
  assert.deepEqual(reglaDotacionalDeTipo('Itagui', 'Educación').compatibles, ['D-1', 'D-2', 'D-3'])
  assert.deepEqual(reglaDotacionalDeTipo('Itagui', 'Educación').condicionados, ['C-1', 'S-8', 'S-7', 'S-19'])
  assert.deepEqual(reglaDotacionalDeTipo('Itagui', 'Transporte').compatibles, ['D-1', 'D-2', 'D-3', 'D-7'])
  assert.deepEqual(reglaDotacionalDeTipo('Itagui', 'Seguridad').compatibles, ['D-1', 'D-2', 'D-3', 'D-6'])
  assert.deepEqual(reglaDotacionalDeTipo('Itagui', 'Bienestar social').compatibles, ['D-1', 'D-2', 'D-3', 'D-4'])
  assert.deepEqual(reglaDotacionalDeTipo('Itagui', 'Institucional').compatibles, ['D-1', 'D-2', 'D-3', 'D-5'])
  assert.deepEqual(reglaDotacionalDeTipo('Itagui', 'Multipropósito').compatibles, ['D-1', 'D-2', 'D-3', 'R-M2'])
  const sanitario = reglaDotacionalDeTipo('Itagui', 'Sanitario')
  assert.deepEqual(sanitario.compatibles, ['D-2', 'D-3'])
  assert.ok(sanitario.condicionados.includes('S-13'))
  const conS13 = reglas.filter((r) => r.condicionados.includes('S-13')).map((r) => r.tipo)
  assert.deepEqual(conS13, ['Sanitario'])
})

prueba('la tabla no trae prohibidos: ninguna regla inventa ese campo', () => {
  for (const r of reglas) assert.ok(!('prohibidos' in r), r.tipo)
})

prueba('fuente: art. 184, páginas 155-164, transcrito de imagen; casos con observación', () => {
  for (const r of reglas) {
    assert.equal(r.fuente.articulo, '184')
    assert.ok(r.fuente.paginaPdf >= 155 && r.fuente.paginaPdf <= 164, r.tipo)
    assert.equal(r.fuente.verificacion, 'transcrito_de_imagen')
  }
  for (const t of ['Transporte', 'Bienestar social', 'Institucional', 'Multipropósito', 'Sanitario']) {
    assert.ok(reglaDotacionalDeTipo('Itagui', t).observaciones.length > 0, t)
  }
})

prueba('disposiciones de los arts. 184 a 187 con su fuente', () => {
  const porArticulo = (a) => itagui.disposicionesGenerales.filter((d) => d.fuente.articulo === a)
  assert.equal(porArticulo('184').length, 2)
  assert.match(porArticulo('185')[0].resumen, /ZU-AM-16/)
  assert.match(porArticulo('186')[0].resumen, /Acuerdo 020 de 2007/)
  assert.match(porArticulo('187')[0].resumen, /80%/)
  assert.deepEqual(['184', '185', '186', '187'].map((a) => porArticulo(a)[0].fuente.paginaPdf), [144, 164, 164, 165])
})

prueba('el validador rechaza reglas dotacionales inválidas', () => {
  const malo = structuredClone(itagui)
  malo.reglasDotacionales[0].compatibles = []
  malo.reglasDotacionales[1].condicionados = ['xx']
  malo.reglasDotacionales[2].fuente.paginaPdf = 0
  delete malo.reglasDotacionales[3].tipo
  const errores = validarInstrumento(malo)
  for (const patron of [/falta compatibles/, /código de tipología inválido/, /página/, /falta el tipo/]) {
    assert.ok(errores.some((e) => patron.test(e)), String(patron))
  }
})

prueba('inmutabilidad y cobertura parcial', () => {
  assert.ok(Object.isFrozen(itagui.reglasDotacionales))
  assert.ok(Object.isFrozen(itagui.reglasDotacionales[0].compatibles))
  assert.equal(itagui.cobertura, 'parcial')
})

prueba('limitaciones documentadas: rural, inventario ZU-D y geometría', () => {
  const l = itagui.limitaciones.join(' ')
  for (const patron of [/rural/i, /275 equipamientos/, /geometr/i]) assert.match(l, patron)
})

console.log('Todo correcto.')