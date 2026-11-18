import assert from 'node:assert/strict'
import {
  ADVERTENCIAS,
  AMBITOS,
  BLOQUES,
  CAPAS_AMVA_AGREGADO,
  MAPEO_CLASIFICACION_SIMBOLOGIA,
  MUNICIPIOS,
  SERVICIOS_EXCLUIDOS,
  capasDeMunicipio,
  claseDesdeSimbologia,
  municipioPorCodigo,
  municipioPorSlug,
  rutaCapa
} from '../src/utils/territorial/registroFuentes.js'
import { MUNICIPIOS_VALLE_ABURRA } from '../src/utils/municipiosValleAburra.js'

// 1. Los 10 municipios coinciden con la lista que ya usa la app (slug y nombre)
assert.equal(MUNICIPIOS.length, 10)
const slugsApp = MUNICIPIOS_VALLE_ABURRA.map((m) => m.slug).sort()
assert.deepEqual(MUNICIPIOS.map((m) => m.slug).sort(), slugsApp)
for (const m of MUNICIPIOS) {
  const app = MUNICIPIOS_VALLE_ABURRA.find((x) => x.slug === m.slug)
  assert.equal(m.nombre, app.nombre, `nombre distinto para ${m.slug}`)
}
console.log('ok  10 municipios, mismos slugs y nombres que municipiosValleAburra.js')

// 2. Códigos verificados en el sondeo, únicos y de 3 dígitos
const CODIGOS = {
  Barbosa: '079', Girardota: '308', Copacabana: '212', Bello: '088', Medellin: '001',
  Envigado: '266', Itagui: '360', Sabaneta: '631', LaEstrella: '380', Caldas: '129'
}
for (const [slug, codigo] of Object.entries(CODIGOS)) {
  assert.equal(municipioPorSlug(slug).codigoMun, codigo, `código de ${slug}`)
  assert.equal(municipioPorCodigo(codigo).slug, slug)
}
assert.equal(new Set(MUNICIPIOS.map((m) => m.codigoMun)).size, 10)
assert.equal(municipioPorCodigo('999'), null)
console.log('ok  códigos CODIGO_MUN verificados y únicos')

// 3. Estructura de cada capa
let total = 0
const vistas = new Set()
for (const m of MUNICIPIOS) {
  for (const c of m.capas) {
    total++
    const llave = `${c.servicio}/${c.id}`
    assert.ok(!vistas.has(llave), `capa repetida: ${llave}`)
    vistas.add(llave)
    assert.ok(BLOQUES.includes(c.bloque), `bloque inválido en ${llave}`)
    assert.ok(AMBITOS.includes(c.ambito), `ámbito inválido en ${llave}`)
    assert.ok(Number.isInteger(c.id) && c.id >= 0, `id inválido en ${llave}`)
    assert.ok(c.camposContenido.length > 0, `sin campos en ${llave}`)
    assert.equal(c.significadoVerificado, false, `${llave} no puede declararse verificada`)
    assert.ok(['probada', 'pendiente'].includes(c.consultaPuntual))
    assert.ok([9377, 3857].includes(c.sridServicio))
    assert.equal(c.maxRegistros, 2000)
    for (const codigo of c.advertencias) {
      assert.ok(ADVERTENCIAS[codigo], `advertencia desconocida ${codigo} en ${llave}`)
    }
    assert.ok(!/_EB$/.test(c.servicio), `servicio excluido en el registro: ${llave}`)
  }
}
assert.equal(total, 78)
console.log(`ok  ${total} capas con estructura válida, sin repetidas ni servicios _EB`)

// 4. Cada municipio: una capa de uso actual, al menos una de clasificación
for (const m of MUNICIPIOS) {
  assert.equal(capasDeMunicipio(m.slug, { bloque: 'uso_actual' }).length, 1, `uso actual de ${m.slug}`)
  assert.ok(capasDeMunicipio(m.slug, { bloque: 'clasificacion_suelo' }).length >= 1, `clasificación de ${m.slug}`)
}
for (const m of MUNICIPIOS) {
  const ua = capasDeMunicipio(m.slug, { bloque: 'uso_actual' })[0]
  assert.equal(ua.id, 1)
  assert.equal(ua.sridServicio, 3857)
  assert.equal(ua.servicio, `${m.slug === 'LaEstrella' ? 'LA_ESTRELLA' : m.slug.toUpperCase()}_Uso_y_Valores_Suelo`)
  assert.deepEqual(ua.camposContenido, ['INDICADOR', 'USO_ACTUAL', 'INPOLY_FID'])
}
console.log('ok  cada municipio tiene su capa de uso actual (mismo esquema) y clasificación')

// 5. Casos especiales documentados
assert.equal(capasDeMunicipio('Copacabana', { bloque: 'riesgo' }).length, 0)
assert.deepEqual(municipioPorSlug('Copacabana').capasAusentes, ['riesgo', 'tratamiento_rural'])
assert.ok(capasDeMunicipio('Girardota', { bloque: 'riesgo' })[0].advertencias.includes('RIESGOS_SOLO_CAD'))
assert.ok(capasDeMunicipio('Envigado', { bloque: 'uso_normativo_pot' }).some((c) => c.advertencias.includes('PLACEHOLDER_ZONA_URBANA')))
assert.ok(capasDeMunicipio('Itagui', { bloque: 'uso_normativo_pot' })[0].camposContenido.includes('USO_PROH'))
for (const m of MUNICIPIOS) {
  for (const c of capasDeMunicipio(m.slug, { bloque: 'uso_normativo_pot' })) {
    assert.ok(c.advertencias.includes('USO_POT_NO_VERIFICADO'), `${m.slug}/${c.id} debe avisar que el uso no está verificado`)
  }
}
console.log('ok  casos especiales y advertencia de uso no verificado')

// 6. Solo una capa quedó pendiente (el 504 de Sabaneta)
const pendientes = MUNICIPIOS.flatMap((m) => m.capas.filter((c) => c.consultaPuntual === 'pendiente'))
assert.equal(pendientes.length, 1)
assert.equal(pendientes[0].servicio, 'POT_Sabaneta')
assert.equal(pendientes[0].id, 7)
assert.equal(capasDeMunicipio('Sabaneta', { soloProbadas: true }).length, capasDeMunicipio('Sabaneta').length - 1)
console.log('ok  solo POT_Sabaneta/7 queda pendiente de reprobar')

// 7. Servicios excluidos y capas del agregado
assert.deepEqual(SERVICIOS_EXCLUIDOS.map((s) => s.servicio).sort(), ['Barbosa_POT_EB', 'Bello_POT_EB'])
assert.deepEqual(CAPAS_AMVA_AGREGADO.map((c) => c.id).sort(), [3, 4, 5, 7])
assert.ok(!CAPAS_AMVA_AGREGADO.some((c) => c.id === 0), 'AMVA_POT/0 no es límite de los 10 municipios')
console.log('ok  _EB excluidos y AMVA_POT/0 descartada como límite')

// 8. Ruta relativa de capa
assert.equal(rutaCapa('AMVA_POT', 5), 'AMVA_POT/MapServer/5')
console.log('ok  rutaCapa')

// 9. Clase de suelo desde SIMBOLOGIA: los 13 valores vistos en suelo_pot más los del REST
const ESPERADOS = {
  'URBANO': 'urbano', 'SUELO URBANO': 'urbano',
  'RURAL': 'rural', 'SUELO RURAL': 'rural',
  'SUBURBANO': 'suburbano', 'SUELO SUBURBANO': 'suburbano',
  'EXPANSION': 'expansion', 'EXPANSIÓN': 'expansion', 'EXPANSIÓN URBANA': 'expansion',
  'SUELO DE EXPANSION': 'expansion', 'SUELO DE EXPANSIÓN': 'expansion',
  'PROTECCIÓN': 'proteccion', 'SUELO DE PROTECCIÓN': 'proteccion',
  '  Suelo   Urbano ': 'urbano'
}
for (const [entrada, salida] of Object.entries(ESPERADOS)) {
  assert.equal(claseDesdeSimbologia(entrada), salida, `"${entrada}"`)
}
for (const raro of ['MIXTO', 'COMERCIO/SERVICIOS', '', '   ', null, undefined, 5, 'toString', '__proto__']) {
  assert.equal(claseDesdeSimbologia(raro), null, `debe ser null: ${String(raro)}`)
}
assert.ok(Object.keys(MAPEO_CLASIFICACION_SIMBOLOGIA).length > 0)
console.log('ok  claseDesdeSimbologia: valores vistos mapeados, el resto devuelve null')

// 10. Inmutabilidad
assert.ok(Object.isFrozen(MUNICIPIOS))
assert.ok(Object.isFrozen(MUNICIPIOS[0].capas[0]))
assert.ok(Object.isFrozen(MUNICIPIOS[0].capas[0].camposContenido))
assert.throws(() => { MUNICIPIOS[0].nombre = 'otro' }, TypeError)
console.log('ok  el registro es inmutable')

console.log('\nTodo correcto.')