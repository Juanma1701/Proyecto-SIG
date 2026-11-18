import assert from 'node:assert/strict'
import { consultarZonaItagui } from '../src/utils/normativa/consultaZonaItagui.js'
import { RESULTADOS } from '../src/utils/normativa/evaluar.js'
import { SITUACIONES, claveMunicipio, esItagui, valorarPunto } from '../src/utils/normativa/evaluarEnPunto.js'
import { describirTarjeta } from '../src/utils/normativa/presentacion.js'

const PROH = 'Todas las no mencionadas en esta ficha'
const ITAGUI = { estado: 'resuelto', nombre: 'Itagüí', slug: 'itagui' }
const PUNTO = { lat: 6.1719, lon: -75.6117 }

const ZU_C_02 = {
  codigo: 'ZU-C-02', uso_ppal: 'Áreas de actividad comercial', sector: 'Sector Las Mercedes', uso_proh: PROH,
  uso_cond: 'C-2, C-9, S-3, S-4, S-6, S-11, S-13*, S-16, S-19, S-22, S-24, S-26, I-5, D-1, D-2, D-3,',
  uso_comp: 'RU, RB, RT, R-M1, RM2, R-M3,, C-1, C-3, C-4, C-11, C-12, C-13, S-5, S-7, S-8, S-9, S-15, S-18, D-5, D-8, D-10,',
  condicion1: '*ZU-C-01 y ZU-C-02 Solo servicios de salas de velación.', condicion2: ' ', condicion3: ' '
}
const ZU_R_23 = {
  codigo: 'ZU-R-23', uso_ppal: 'Áreas de actividad residencial', sector: 'nuevos desarrollos', uso_proh: PROH,
  uso_cond: 'C-2*, C-3*, S-4, S-6*,', uso_comp: 'R-U, R-B, C-1, S-7,',
  condicion1: '*ZU-R-23 solo en áreas comerciales', condicion2: ' ', condicion3: ' '
}
const SOLO_VIVIENDA = { codigo: 'ZU-R-99', uso_ppal: 'Áreas de actividad residencial', uso_comp: 'R-U,', uso_cond: 'S-4,', uso_proh: PROH }
const ESPACIO_PUBLICO = { codigo: ' ', uso_ppal: 'Espacio público', uso_comp: ' ', uso_cond: ' ', uso_proh: ' ', subtipo: 'Espacio público existente' }

const respuesta = (cuerpo, estado = 200) => async () => ({ ok: estado < 400, status: estado, json: async () => cuerpo })
const zonaDe = (atributos, fetchFn) =>
  consultarZonaItagui(PUNTO, { fetchFn: fetchFn ?? respuesta({ features: atributos.map((a) => ({ attributes: a })) }) })
const valorar = async (atributos, actividadId, municipio = ITAGUI) =>
  valorarPunto({ municipio, zonaResultado: await zonaDe(atributos), actividadId })

// 1. Municipio
assert.equal(claveMunicipio({ estado: 'resuelto', slug: 'Itagui' }), 'itagui')
assert.equal(claveMunicipio({ estado: 'resuelto', nombre: 'Itagüí' }), 'itagui')
assert.equal(claveMunicipio({ estado: 'ambiguo', slug: 'itagui' }), null)
assert.equal(esItagui(ITAGUI), true)
assert.equal(esItagui({ estado: 'resuelto', slug: 'medellin', nombre: 'Medellín' }), false)
assert.equal(esItagui(null), false)
console.log('ok  municipio: slug o nombre, con o sin tilde; solo "resuelto" cuenta')

// 2. Itagüí con zona de la capa oficial
let v = await valorar([ZU_C_02], 'licorera')
assert.equal(v.situacion, SITUACIONES.EVALUADA)
assert.equal(v.resultado, RESULTADOS.CONDICIONADA)
assert.equal(v.datos.zonaCodigo, 'ZU-C-02')
assert.equal(v.datos.zonaAreaActividad, 'Áreas de actividad comercial')
assert.equal((await valorar([ZU_C_02], 'restaurante')).resultado, RESULTADOS.COMPATIBLE)
assert.equal((await valorar([ZU_C_02], 'supermercado')).resultado, RESULTADOS.COMPATIBLE)
v = await valorar([SOLO_VIVIENDA], 'licorera')
assert.equal(v.resultado, RESULTADOS.INCOMPATIBLE)
v = await valorar([ZU_R_23], 'licorera')
assert.equal(v.resultado, RESULTADOS.CONDICIONADA)
assert.equal(v.requiereVerificarUbicacion, true)
v = await valorar([ZU_C_02], 'minimercado')
assert.equal(v.resultado, RESULTADOS.INSUFICIENTE)
assert.equal(v.situacion, SITUACIONES.EVALUADA)
console.log('ok  Itagüí: compatible, condicionada, incompatible, verificar ubicación y mapeo inferido (insuficiente)')

// 3. Situaciones que no concluyen
const casos = [
  ['sin_codigo', [ESPACIO_PUBLICO], SITUACIONES.ZONA_SIN_IDENTIFICAR, /Espacio público existente/],
  ['sin_poligono', [], SITUACIONES.ZONA_SIN_IDENTIFICAR, /no cae en ningún polígono/],
  ['varias_zonas', [ZU_C_02, ZU_R_23], SITUACIONES.VARIAS_ZONAS, /ZU-C-02, ZU-R-23/]
]
for (const [nombre, atributos, situacion, patron] of casos) {
  v = await valorar(atributos, 'licorera')
  assert.equal(v.resultado, RESULTADOS.INSUFICIENTE, nombre)
  assert.equal(v.situacion, situacion, nombre)
  assert.match(v.razones[0], patron, nombre)
  assert.ok(v.queFalta, nombre)
}
for (const fetchFn of [respuesta({}, 504), async () => { throw new Error('caído') }, respuesta({ error: { message: 'x' } })]) {
  v = valorarPunto({ municipio: ITAGUI, zonaResultado: await zonaDe([], fetchFn), actividadId: 'licorera' })
  assert.equal(v.situacion, SITUACIONES.ERROR_ZONA)
  assert.equal(v.resultado, RESULTADOS.INSUFICIENTE)
}
console.log('ok  zona sin código, fuera de la capa, varias zonas (no elige) y errores de servicio, red y 504')

// 4. Otros municipios y municipio sin resolver
v = valorarPunto({ municipio: { estado: 'resuelto', nombre: 'Medellín', slug: 'medellin' }, actividadId: 'licorera' })
assert.equal(v.resultado, RESULTADOS.INSUFICIENTE)
assert.ok([SITUACIONES.NORMA_NO_CARGADA, SITUACIONES.ZONA_SIN_IDENTIFICAR].includes(v.situacion))
assert.match(v.razones[0], /Medellín/)
v = valorarPunto({ municipio: { estado: 'ambiguo', candidatos: [] }, actividadId: 'licorera' })
assert.equal(v.situacion, SITUACIONES.MUNICIPIO_SIN_DETERMINAR)
v = valorarPunto({ municipio: { estado: 'fuera_de_cobertura' }, actividadId: 'licorera' })
assert.equal(v.situacion, SITUACIONES.FUERA_DE_COBERTURA)
v = valorarPunto({ municipio: { estado: 'error' }, actividadId: 'licorera' })
assert.equal(v.situacion, SITUACIONES.MUNICIPIO_SIN_DETERMINAR)
v = valorarPunto({ municipio: ITAGUI, actividadId: '' })
assert.equal(v.situacion, SITUACIONES.ACTIVIDAD_NO_ELEGIDA)
console.log('ok  otros municipios, ambiguo, fuera de cobertura, error y actividad sin elegir')

// 5. Texto de la tarjeta
let t = describirTarjeta(await valorar([ZU_C_02], 'restaurante'))
assert.equal(t.clase, 'compatible')
assert.match(t.zona, /^Zona ZU-C-02 · Áreas de actividad comercial$/)
assert.ok(t.requisitos.length > 0 || t.tipologia)

t = describirTarjeta(await valorar([ZU_R_23], 'licorera'))
assert.equal(t.clase, 'condicionada')
assert.ok(t.verificarUbicacion)
assert.ok(t.condiciones.some((c) => /áreas comerciales/.test(c)))
assert.ok(t.referencias.some((r) => /Tabla de la zona ZU-R-23/.test(r.texto) && r.url?.includes('arcgis.itagui.gov.co')))
assert.ok(t.advertencias.length > 0)

t = describirTarjeta(await valorar([SOLO_VIVIENDA], 'licorera'))
assert.equal(t.clase, 'incompatible')

t = describirTarjeta(await valorar([], 'licorera'))
assert.equal(t.clase, 'insuficiente')
assert.equal(t.titulo, 'Información normativa insuficiente')
assert.ok(t.queFalta)

for (const [atributos, actividad] of [[[ZU_C_02], 'licorera'], [[SOLO_VIVIENDA], 'licorera'], [[], 'restaurante'], [[ZU_R_23], 'licorera']]) {
  const tarjeta = describirTarjeta(await valorar(atributos, actividad))
  assert.doesNotMatch(`${tarjeta.titulo} ${tarjeta.bajada}`, /autorizad/i)
  assert.match(tarjeta.aviso, /no es un concepto de uso del suelo/i)
}
console.log('ok  tarjeta: título, condiciones, referencias con url, qué falta, sin "autorizado" y aviso fijo')

console.log('\nTodo correcto.')