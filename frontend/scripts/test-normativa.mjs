import assert from 'node:assert/strict'
import { validarInstrumento } from '../src/utils/normativa/esquema.js'
import {
  INSTRUMENTOS,
  codigosSinDefinir,
  erroresDeInstrumentos,
  instrumentoDeMunicipio,
  tipologiaPorCodigo,
  zonaPorCodigo
} from '../src/utils/normativa/index.js'
import { MUNICIPIOS } from '../src/utils/territorial/registroFuentes.js'

// 1. Estructura válida y cobertura honesta
assert.deepEqual(erroresDeInstrumentos(), [])
const itagui = instrumentoDeMunicipio('Itagui')
assert.equal(itagui.cobertura, 'parcial')
assert.equal(instrumentoDeMunicipio('Bello'), null)
assert.equal(instrumentoDeMunicipio('__proto__'), null)
console.log('ok  instrumento de Itagüí válido y marcado como cobertura parcial')

// 2. Los slugs coinciden con el registro territorial
for (const slug of Object.keys(INSTRUMENTOS)) {
  assert.ok(MUNICIPIOS.some((m) => m.slug === slug), `municipio desconocido: ${slug}`)
}
console.log('ok  los slugs coinciden con el registro territorial')

// 3. Tipologías leídas: 61 en total, sin repetidas
const codigos = itagui.tipologias.map((t) => t.codigo)
assert.equal(new Set(codigos).size, codigos.length)
for (let n = 1; n <= 14; n++) assert.ok(codigos.includes(`C-${n}`), `falta C-${n}`)
for (let n = 1; n <= 26; n++) assert.ok(codigos.includes(`S-${n}`), `falta S-${n}`)
for (let n = 1; n <= 12; n++) assert.ok(codigos.includes(`D-${n}`), `falta D-${n}`)
for (const c of ['R-U', 'R-B', 'R-T', 'R-M1', 'R-M2', 'R-M3', 'I-3', 'I-4', 'I-5']) assert.ok(codigos.includes(c), c)
assert.equal(codigos.length, 61)
console.log('ok  61 tipologías: C-1..14, S-1..26, D-1..12, residenciales R y industriales I-3..5')

// 4. Datos clave leídos del acuerdo
const c2 = tipologiaPorCodigo('Itagui', 'C-2')
assert.match(c2.nombre, /licoreras/i)
assert.equal(c2.areaMinimaM2, 20)
assert.ok(c2.retiros.length === 2 && c2.retiros.every((r) => r.metros === 40))
assert.equal(tipologiaPorCodigo('Itagui', 'S-7').variantes[0].areaMinimaM2, 30)
assert.equal(tipologiaPorCodigo('Itagui', 'C-11').areaMinimaM2, 500)
assert.deepEqual(tipologiaPorCodigo('Itagui', 'C-14').restricciones, ['No se permite.'])
assert.equal(tipologiaPorCodigo('Itagui', 'S-16').retiros[0].metros, 40)
assert.match(tipologiaPorCodigo('Itagui', 'S-16').retiros[0].destino, /C-2/)
assert.equal(tipologiaPorCodigo('Itagui', 'S-26').retiros[0].metros, 80)
assert.equal(tipologiaPorCodigo('Itagui', 'I-5').fuente.paginaPdf, 127)
assert.equal(tipologiaPorCodigo('Itagui', 'C-99'), null)
console.log('ok  C-2, S-7, C-11, C-14, S-16, S-26 e I-5 con sus datos y página')

// 5. Zonas leídas; las pendientes siguen ausentes
for (const z of ['ZU-AM-01', 'ZU-AM-02', 'ZU-AM-03', 'ZU-AM-04', 'ZU-AM-28', 'ZU-R-01', 'ZU-R-02', 'ZU-R-03', 'ZU-R-04', 'ZU-R-23']) {
  assert.ok(zonaPorCodigo('Itagui', z), z)
}
assert.equal(itagui.zonas.length, 62)
assert.equal(new Set(itagui.zonas.map((z) => z.codigo)).size, 62)
assert.equal(zonaPorCodigo('Itagui', 'ZU-D-01'), null) // dotacionales (art. 184): pendientes de leer
assert.ok(!zonaPorCodigo('Itagui', 'ZU-AM-02').condicionados.includes('C-2'))
assert.ok(zonaPorCodigo('Itagui', 'ZU-R-01').condicionados.includes('C-2'))
assert.deepEqual(zonaPorCodigo('Itagui', 'ZU-R-01').marcas, { 'C-2': '*', 'S-6': '*' })
assert.ok(!zonaPorCodigo('Itagui', 'ZU-R-02').condicionados.includes('C-2'))
console.log('ok  62 zonas cargadas (AM, residenciales, expansión, comerciales); ZU-D pendientes; asteriscos en `marcas`')

// 6. Toda tipología citada por una zona tiene definición
assert.deepEqual(codigosSinDefinir('Itagui'), [])
console.log('ok  ningún código citado en las zonas queda sin definición')

// 7. Ruido: las actividades nombradas están en la fila correcta y no se asignan a una sola tipología
const sectorC = itagui.estandaresRuido.find((e) => e.dbDia === 70)
assert.equal(sectorC.dbNoche, 60)
for (const a of ['gimnasios', 'restaurantes', 'bares', 'tabernas', 'discotecas', 'bingos', 'casinos']) {
  assert.ok(sectorC.actividadesNombradas.includes(a), a)
}
assert.ok(sectorC.tipologias.length > 1, 'la norma no asigna una sola tipología a las discotecas')
assert.ok(sectorC.tipologias.includes('S-6') && sectorC.tipologias.includes('S-7'))
assert.equal(itagui.estandaresRuido.length, 9)
console.log('ok  tabla de ruido: gimnasios, restaurantes, bares y discotecas en el sector C (70/60 dB)')

// 8. Disposiciones generales
const temas = itagui.disposicionesGenerales.map((d) => d.tema)
for (const t of ['licencia para uso comercial', 'licencia para uso de servicios', 'antejardín con aprovechamiento económico']) {
  assert.ok(temas.includes(t), t)
}
assert.ok(temas.includes('Antejardín de restaurantes en áreas de actividad múltiple'))
assert.ok(temas.includes('Industrias con Programa de Prevención de Accidentes Mayores (PPAM)'))
console.log('ok  disposiciones generales (licencias, antejardín, parqueaderos, áreas saturadas)')

// 9. El validador detecta errores
const malo = structuredClone(itagui)
malo.tipologias.push({ ...malo.tipologias[0] })
malo.tipologias[1].uso = 'inventado'
malo.zonas[0].fuente.paginaPdf = 0
malo.zonas[3].marcas = { 'X-9': '*' }
malo.estandaresRuido[0].dbDia = 0
delete malo.vigencia.fuente
const errores = validarInstrumento(malo)
for (const patron of [/repetida/, /uso inválido/, /página/, /vigencia/, /marca/, /ruido/]) {
  assert.ok(errores.some((e) => patron.test(e)), String(patron))
}
console.log('ok  el validador rechaza duplicados, usos, páginas, vigencia, marcas y ruido inválidos')

// 10. Inmutabilidad
assert.ok(Object.isFrozen(itagui))
assert.ok(Object.isFrozen(itagui.tipologias[40].retiros))
assert.ok(Object.isFrozen(itagui.estandaresRuido))
assert.throws(() => { itagui.nombre = 'otro' }, TypeError)
console.log('ok  los datos normativos son inmutables')

console.log('\nTodo correcto.')