import assert from 'node:assert/strict'
import { erroresDeInstrumentos, instrumentoDeMunicipio } from '../src/utils/normativa/index.js'
import { RESULTADOS } from '../src/utils/normativa/evaluar.js'
import { evaluarSabaneta } from '../src/utils/normativa/evaluarSabaneta.js'
import { zonaDeSabaneta } from '../src/utils/normativa/sabaneta.js'
import { SITUACIONES, valorarPunto } from '../src/utils/normativa/evaluarEnPunto.js'

const S = instrumentoDeMunicipio('Sabaneta')
const ev = (zonaId, actividadId, tamano = {}) => evaluarSabaneta({ instrumento: S, zonaId, actividadId, tamano })

assert.deepEqual(erroresDeInstrumentos(), [])
console.log('ok  los instrumentos validan, incluido Sabaneta')

assert.equal(ev('BAJA', 'farmacia').resultado, RESULTADOS.COMPATIBLE)
assert.equal(ev('BAJA', 'tienda_tecnologia').resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(ev('MEDIA_AREA_T2', 'tienda_tecnologia').resultado, RESULTADOS.COMPATIBLE)
assert.equal(ev('BAJA', 'gimnasio').resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(ev('ALTA_COR', 'gimnasio').resultado, RESULTADOS.CONDICIONADA)
let r = ev('MEDIA_AREA_T2', 'licorera')
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.ok(r.condiciones.some((c) => /consumo de licor/.test(c)))
console.log('ok  farmacia, tecnología, gimnasio y licorera por zona')

assert.equal(ev('BAJA', 'discoteca').resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(ev('MEDIA_AREA_T2', 'discoteca').resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(ev('MEDIA_COR_T1', 'discoteca').resultado, RESULTADOS.CONDICIONADA)
r = ev('ALTA_COR', 'discoteca')
assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
assert.match(r.explicacion, /taxativ|no listado|prohibido/i)
console.log('ok  discoteca: no permitida en baja y media T2, condicionada en media, por verificar en alta')

r = ev('BAJA', 'supermercado')
assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
assert.match(r.queFalta, /área/)
assert.equal(ev('BAJA', 'supermercado', { areaM2: 1000 }).resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(ev('BAJA', 'supermercado', { areaM2: 300 }).resultado, RESULTADOS.CONDICIONADA)
assert.equal(ev('BAJA', 'minimercado', { areaM2: 800 }).resultado, RESULTADOS.INCOMPATIBLE)
assert.equal(ev('BAJA', 'minimercado').resultado, RESULTADOS.CONDICIONADA)
assert.equal(ev('ALTA_T1', 'supermercado').resultado, RESULTADOS.CONDICIONADA)
console.log('ok  supermercado y minimercado según el área del local (600 m²)')

assert.equal(ev('BAJA', 'restaurante').resultado, RESULTADOS.CONDICIONADA)
assert.equal(ev('MEDIA_AREA_T2', 'restaurante').resultado, RESULTADOS.CONDICIONADA)
assert.equal(ev('MEDIA_COR_T1', 'restaurante').resultado, RESULTADOS.COMPATIBLE)
assert.equal(ev('ALTA_COR', 'restaurante').resultado, RESULTADOS.COMPATIBLE)
assert.ok(ev('BAJA', 'restaurante').condiciones.some((c) => /venta y el consumo de licor/.test(c)))
assert.equal(ev('MEDIA_COR_T1', 'restaurante').referencias[0].paginaPdf, 261)
assert.equal(ev('INVENTADA', 'farmacia').resultado, RESULTADOS.INSUFICIENTE)
assert.equal(ev(null, 'farmacia').resultado, RESULTADOS.INSUFICIENTE)
for (const z of S.modeloMezcla.zonas) {
  for (const id of ['licorera', 'minimercado', 'supermercado', 'tienda_tecnologia', 'gimnasio', 'farmacia', 'discoteca', 'restaurante']) {
    const x = ev(z.codigo, id, { areaM2: 100 })
    assert.ok(x.aviso && x.advertencias.length > 0)
    assert.doesNotMatch(JSON.stringify(x), /autorizad(?!ión|ion)/i)
  }
}
console.log('ok  zona inválida o sin zona => insuficiente; nunca dice autorizado')
const bloque = (uso) => ({ bloques: [{ tipo: 'uso_normativo_pot', registros: [{ atributosLimpios: { USO: uso } }] }] })
assert.equal(zonaDeSabaneta(bloque('Corredor Media Mezcla de Usos Tipo 2')).zonaId, 'MEDIA_AREA_T1_COR_T2')
assert.equal(zonaDeSabaneta(bloque('Corredor Media Mezcla de Usos Tipo 1')).zonaId, 'MEDIA_COR_T1')
assert.equal(zonaDeSabaneta(bloque('Área de Baja Mezcla de Usos')).zonaId, 'BAJA')
assert.equal(zonaDeSabaneta(bloque('Corredor Alta Mezcla de Usos')).zonaId, 'ALTA_COR')
assert.equal(zonaDeSabaneta(bloque('Mezcla rara')).estado, 'sin_equivalencia')
assert.equal(zonaDeSabaneta({ bloques: [] }).estado, 'sin_registros')
const SAB = { estado: 'resuelto', nombre: 'Sabaneta', slug: 'Sabaneta' }
const punto = (actividadId, uso = 'Corredor Media Mezcla de Usos Tipo 2') => valorarPunto({ municipio: SAB, resultadoTerritorial: bloque(uso), actividadId })
let v = punto('licorera')
assert.equal(v.situacion, SITUACIONES.EVALUADA)
assert.equal(v.resultado, RESULTADOS.CONDICIONADA)
assert.equal(punto('farmacia').resultado, RESULTADOS.COMPATIBLE)
assert.equal(punto('discoteca').resultado, RESULTADOS.CONDICIONADA)
assert.equal(valorarPunto({ municipio: SAB, resultadoTerritorial: null, actividadId: 'farmacia' }).situacion, SITUACIONES.ZONA_SIN_IDENTIFICAR)
console.log('ok  zona del pin y valorarPunto en Sabaneta')
const ESPERADO = {
  'Área de baja mezcla de usos': 'BAJA',
  'Área Media Mezcla de Usos Tipo 2': 'MEDIA_AREA_T2',
  'Área Media Mezcla de Usos Tipo 1': 'MEDIA_AREA_T1_COR_T2',
  'Corredor Media Mezcla de Usos Tipo 2': 'MEDIA_AREA_T1_COR_T2',
  'Corredor Media Mezcla de Usos Tipo 1': 'MEDIA_COR_T1',
  'Área de Alta Mezcla de Usos Tipo 2': 'ALTA_T2',
  'Área de Alta Mezcla de Usos Tipo 1': 'ALTA_T1',
  'Corredor de Alta Mezcla de Usos': 'ALTA_COR'
}
for (const [uso, zona] of Object.entries(ESPERADO)) assert.equal(zonaDeSabaneta(bloque(uso)).zonaId, zona, uso)
for (const uso of ['Espacio Público Existente', 'Espacio Público Proyectado', 'Dotacional Existente', 'Dotacional  Proyectado', 'Forestal Protector Tipo I']) {
  assert.equal(zonaDeSabaneta(bloque(uso)).estado, 'sin_regimen', uso)
}
console.log('ok  los 13 valores reales de USO: 8 zonas de mezcla y 5 sin régimen')
console.log('\nTodo correcto.')