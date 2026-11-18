import assert from 'node:assert/strict'
import { parsearListaCodigos, zonaDesdeAtributos } from '../src/utils/normativa/zonaOficial.js'
import { RESULTADOS } from '../src/utils/normativa/evaluar.js'
import { SITUACIONES, valorarPunto } from '../src/utils/normativa/evaluarEnPunto.js'
import { instrumentoDeMunicipio } from '../src/utils/normativa/index.js'

const NB = '\u00A0'
const ITAGUI = { estado: 'resuelto', nombre: 'Itagüí', slug: 'itagui' }

// 1. Erratas una por una
let r = parsearListaCodigos('R-U, R-B, R-T, R-M1, -M2, C-1, C-9')
assert.ok(r.codigos.includes('R-M2'))
assert.equal(r.corregidas.length, 1)
assert.equal(r.noReconocido, '')
assert.ok(parsearListaCodigos('R-U, R.-B, R-T').codigos.includes('R-B'))
assert.deepEqual(parsearListaCodigos('RM-1, S-4').codigos, ['R-M1', 'S-4'])
assert.deepEqual(parsearListaCodigos('RM-2*, S-4').marcas, { 'R-M2': '*' })
assert.deepEqual(parsearListaCodigos('R-T y R-M1, R-M-2, R-M3').codigos, ['R-T', 'R-M1', 'R-M2', 'R-M3'])
assert.equal(parsearListaCodigos('R-T y R-M1, R-M-2').noReconocido, '')
assert.deepEqual(parsearListaCodigos('S-19, S\u201324, S-26').codigos, ['S-19', 'S-24', 'S-26'])
assert.equal(parsearListaCodigos('R-U*, R-B*, R-T* R-M1*, R-M-2*, C-5****').marcas['R-M2'], '*')
assert.equal(parsearListaCodigos('R-U*, R-B*, R-T* R-M1*, R-M-2*, C-5****').marcas['C-5'], '****')
assert.deepEqual(parsearListaCodigos('RU, RB, RT, R-M1, RM2, R-M3,, C-1').codigos, ['R-U', 'R-B', 'R-T', 'R-M1', 'R-M2', 'R-M3', 'C-1'])
assert.equal(parsearListaCodigos('R-U, ZZZ 99, S-7').noReconocido, 'ZZZ 99')
console.log('ok  erratas: R-M-2, R.-B, RM-1, -M2 sin R, raya larga, "y", asteriscos; lo no entendido se reporta')

// 2. Las 11 zonas del diagnóstico coinciden con la transcripción del PDF
const COMUN_AM = 'C-1, C-3, C-4, C-5, C-7, C-8, C-9, C-11, C-12, C-13'
const CRUDOS = [
  ['ZU-AM-02', 'compatibles', 'R-U, R-B, R-T, R-M1, -M2, C-1, C-9, S-7, S-8, S-15, D-5, D-8, D-10,'],
  ['ZU-R-25', 'compatibles', `R-U, R.-B, R-T, R-M1, R-M2, R-M3, C-1, S-8, S-7, S-15, D-5, D-8, D-10,${NB}`],
  ['ZU-R-26', 'compatibles', 'R-U, R.-B, R-T, R-M1, R-M2, R-M3, C-1, S-7, S-8, S-15, D-5, D-8, D-10,'],
  ['ZU-R-08', 'compatibles', 'R-U, R-B, R-T, RM-1, C-1, S-7, S-8, S-15, D-5, D-8, D-10,'],
  ['ZU-R-08', 'condicionados', 'RM-2*, S-4, S-5, S-11, S-16, S-19, I-5, D-1, D-2.'],
  ['ZU-AM-13', 'compatibles', `R-U, R-B, R-T y R-M1, R-M-2, R-M3, C-1, C-3, C-4, C-7, C-9, C-11, C-12, C-13, S-5, S-7, S-8, S-9, S-15, S-18.${NB} I-5, D-5, D-8, D-10,`],
  ['ZU-AM-14', 'compatibles', 'R-U, R-B, R-T, R-M1, R-M-2, R-M3, C-1, C-9, C-11, C-12, C-13, S-5, S-7, S-8, S-9, S-15, S-18, D-5, D-8, D-10,'],
  ['ZU-AM-17', 'compatibles', `R-U*, R-B*, R-T* R-M1*, R-M-2*, R-M3*, C-1, C-3, C-4, C-5****, C-7****, C-8****, C-9, C-11, C-12, C-13, S-4,${NB} S-5, S-7, S-8, S-9, S-15, S-18,${NB} I-5, D-5, D-8, D-10,`],
  ['ZU-AM-23', 'condicionados', 'C-2, C-8, S-3, S-4, S-6, S-10, S-11, S-16, S-19, S\u201324, S-26, D-1, D-2, D-3,'],
  ['ZU-AM-26', 'compatibles', `R-U*, R-B*, R-T* y R-M1*, R-M-2*, C-1, C-3, C-4, C-5, C-7, C-8, C-9, C-11, C-12, C-13, S-4, S-5, S-7, S-8, S-9, S-11, S-15, S-18, S-24,${NB} I-5, D-5, D-8, D-10,`],
  ['ZU-AM-27', 'compatibles', `R-U*, R-B*, R-T* R-M1*, R-M-2*, C-1, C-3, C-4, C-5, C-7, C-8, C-9, C-11, C-12, C-13, S-4,${NB} S-5, S-7, S-8, S-9, S-11, S-15, S-18, S-24,${NB} I-5, D-5, D-8, D-10,`],
  ['ZU-AM-28', 'compatibles', `R-U*, R-B*, R-T* y R-M1*, R-M-2*, C-1, C-3, C-4, C-5, C-7, C-8, C-9, C-11, C-12, C-13, S-4,${NB} S-5, S-7, S-8, S-9, S-11, S-15, S-18, S-24,${NB} I-5, D-5, D-8, D-10,`]
]
assert.ok(COMUN_AM.length > 0)
const instrumento = instrumentoDeMunicipio('Itagui')
const ordenada = (lista) => [...lista].sort().join(',')
for (const [codigo, campo, crudo] of CRUDOS) {
  const transcrita = instrumento.zonas.find((z) => z.codigo === codigo)
  assert.ok(transcrita, `${codigo} no está transcrita`)
  const leida = parsearListaCodigos(crudo)
  assert.equal(leida.noReconocido, '', `${codigo} ${campo}: quedó texto sin reconocer`)
  assert.equal(ordenada(leida.codigos), ordenada(transcrita[campo]), `${codigo} ${campo}`)
}
console.log(`ok  ${CRUDOS.length} listas reales de la capa coinciden con la transcripción del PDF`)

// 3. Avisos de lectura y zona dotacional
const PROH = 'Todas las no mencionadas en esta ficha'
const rara = zonaDesdeAtributos({ codigo: 'ZU-X-01', uso_ppal: 'Áreas de actividad comercial', uso_comp: 'R-U, ZZZ 99, S-7,', uso_cond: 'C-2,', uso_proh: PROH })
assert.ok(rara.avisosDeLectura.some((a) => /sin reconocer/.test(a)))
let v = valorarPunto({ municipio: ITAGUI, zonaResultado: { estado: 'ok', zona: rara }, actividadId: 'restaurante' })
assert.equal(v.situacion, SITUACIONES.EVALUADA)
assert.ok(v.advertencias.some((a) => /sin reconocer/.test(a)))

const ZU_D_03 = {
  codigo: 'ZU-D-03', uso_ppal: 'Áreas de actividad dotacional', subtipo: 'Dotacional proyectado', sector: ' ',
  uso_comp: 'D-1, D-2, D-3,', uso_cond: 'C-1, S-8, S-7, S-19,', uso_proh: PROH, cod_ep: 'P_EQ_02'
}
v = valorarPunto({ municipio: ITAGUI, zonaResultado: { estado: 'ok', zona: zonaDesdeAtributos(ZU_D_03) }, actividadId: 'restaurante' })
assert.equal(v.resultado, RESULTADOS.CONDICIONADA)
assert.ok(v.advertencias.some((a) => /Dotacional proyectado/.test(a)))
v = valorarPunto({ municipio: ITAGUI, zonaResultado: { estado: 'ok', zona: zonaDesdeAtributos(ZU_D_03) }, actividadId: 'licorera' })
assert.equal(v.resultado, RESULTADOS.INCOMPATIBLE)
console.log('ok  avisos de lectura y zona dotacional (con tabla de la capa)')

console.log('\nTodo correcto.')