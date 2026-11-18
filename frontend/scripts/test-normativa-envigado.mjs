// Pruebas offline de la norma de Envigado (Tabla 27). Sin red. Ejecutar: node scripts/test-normativa-envigado.mjs
import assert from 'node:assert/strict'
import { ENVIGADO } from '../src/utils/normativa/envigado.js'
import { INSTRUMENTOS, erroresDeInstrumentos, instrumentoDeMunicipio, reglaPorCiiu } from '../src/utils/normativa/index.js'
import { validarInstrumento, congelar } from '../src/utils/normativa/esquema.js'
import { ACTIVIDADES, validarCatalogo } from '../src/utils/normativa/actividades.js'
import { evaluarActividad, RESULTADOS } from '../src/utils/normativa/evaluar.js'
import { evaluarPorCiiu } from '../src/utils/normativa/evaluarPorCiiu.js'
import { FILAS, columnaDeZona } from './datos/tabla27-envigado.mjs'

const pruebas = []
const prueba = (nombre, fn) => pruebas.push([nombre, fn])
const ev = (actividadId, zonaCodigo, instrumento = ENVIGADO) =>
  evaluarPorCiiu({ instrumento, municipioSlug: 'Envigado', zonaCodigo, actividadId })

prueba('estructura: el instrumento valida y está registrado', () => {
  assert.deepEqual(validarInstrumento(ENVIGADO), [])
  assert.equal(instrumentoDeMunicipio('Envigado'), ENVIGADO)
  assert.deepEqual(erroresDeInstrumentos(), [])
  assert.equal(ENVIGADO.vigencia.estado, 'por_verificar')
  assert.equal(ENVIGADO.cobertura, 'parcial')
  assert.ok(ENVIGADO.limitaciones.length >= 3)
  assert.equal(ENVIGADO.zonas.length, 9)
})

prueba('Tabla 27 completa: 123 filas con las letras leídas por posición del PDF', () => {
  const codigoDeColumna = new Map(ENVIGADO.zonas.map((z) => [columnaDeZona(z), z.codigo]))
  assert.equal(codigoDeColumna.size, 9)
  assert.equal(FILAS.length, 123)
  assert.equal(ENVIGADO.reglasPorCiiu.length, FILAS.length)
  assert.equal(ENVIGADO.sinInterpretar.length, 0)
  for (const [ciiu, pagina, letras] of FILAS) {
    const regla = reglaPorCiiu('Envigado', ciiu)
    assert.ok(regla, `falta la fila ${ciiu}`)
    const leidas = [...Array(9).keys()].map((i) => regla.porZona[codigoDeColumna.get(i)] ?? '.').join('')
    assert.equal(leidas, letras, `fila ${ciiu}`)
    assert.equal(regla.fuente.paginaPdf, pagina)
    assert.ok(pagina >= 118 && pagina <= 132)
  }
  assert.equal(reglaPorCiiu('Envigado', '552').porZona.RES, 'R')
  assert.equal(reglaPorCiiu('Envigado', '552').porZona.COR1, 'P')
  assert.deepEqual(Object.keys(reglaPorCiiu('Envigado', '553').porZona), ['CT'])
  assert.equal(reglaPorCiiu('Envigado', '521').porZona['IND-LV'], undefined)
})

prueba('caso P: restaurante (552) en corredor tipo 1 => compatible', () => {
  const r = ev('restaurante', 'COR1')
  assert.equal(r.resultado, RESULTADOS.COMPATIBLE)
  assert.equal(r.datos.letra, 'P')
  assert.ok(r.referencias.length >= 2)
})

prueba('caso C: restaurante en industrial Las Vegas => compatible (complementario)', () => {
  const r = ev('restaurante', 'IND-LV')
  assert.equal(r.resultado, RESULTADOS.COMPATIBLE)
  assert.equal(r.datos.letra, 'C')
})

prueba('caso R: restaurante en residencial => condicionado, cita el art. 184', () => {
  const r = ev('restaurante', 'RES')
  assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
  assert.ok(r.condiciones.length >= 5)
  assert.ok(r.referencias.some((x) => x.articulo === '184'))
  assert.match(r.razones[0], /art\. 184/)
})

prueba('caso celda vacía: fila sin letra en la zona => insuficiente, no incompatible', () => {
  const sintetico = congelar({
    ...structuredClone(ENVIGADO),
    reglasPorCiiu: [{ ciiu: '552', descripcion: 'PRUEBA', porZona: { RES: 'R' }, fuente: { articulo: 'x', paginaPdf: 127, verificacion: 'sin_verificar' } }]
  })
  assert.equal(ev('restaurante', 'COR1', sintetico).resultado, RESULTADOS.INSUFICIENTE)
  assert.match(ev('restaurante', 'COR1', sintetico).explicacion, /celda está vacía/)
  assert.equal(ev('restaurante', null, sintetico).resultado, RESULTADOS.INSUFICIENTE)
})

prueba('sin zona o sin CIIU explícito => insuficiente (zona sin identificar)', () => {
  const r = ev('restaurante', null)
  assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
  assert.match(r.explicacion, /Zona sin identificar/)
  assert.equal(ev('minimercado', 'RES').resultado, RESULTADOS.INSUFICIENTE) // CIIU inferido
  assert.equal(ev('licorera', 'CT').resultado, RESULTADOS.INSUFICIENTE)
  assert.equal(ev('inexistente', 'CT').resultado, RESULTADOS.INSUFICIENTE)
})

prueba('CIIU explícito con fila completa: supermercado (521) en Centro tradicional => compatible (P)', () => {
  const explicito = ACTIVIDADES.map((a) => ({ ...a, mapeoCiiu: { Envigado: { ...a.mapeoCiiu.Envigado, ciiu: '521', confianza: 'explicita' } } }))
  const r = evaluarPorCiiu({ instrumento: ENVIGADO, municipioSlug: 'Envigado', zonaCodigo: 'CT', actividadId: 'supermercado', catalogo: explicito })
  assert.equal(r.resultado, RESULTADOS.COMPATIBLE)
  assert.equal(r.datos.letra, 'P')
})

prueba('nunca dice autorizado y siempre trae aviso y advertencias', () => {
  for (const a of ACTIVIDADES) for (const z of ENVIGADO.zonas) {
    const r = ev(a.id, z.codigo)
    assert.ok(Object.values(RESULTADOS).includes(r.resultado))
    assert.ok(r.aviso && r.advertencias.some((x) => /vigencia/i.test(x)))
    assert.notEqual(r.resultado, 'autorizado')
  }
})

prueba('inmutabilidad: el instrumento y el catálogo están congelados', () => {
  assert.ok(Object.isFrozen(ENVIGADO) && Object.isFrozen(ENVIGADO.reglasPorCiiu[0].porZona))
  assert.throws(() => { ENVIGADO.reglasPorCiiu[0].porZona.RES = 'P' }, TypeError)
  assert.throws(() => { ENVIGADO.cobertura = 'completa' }, TypeError)
  assert.ok(Object.isFrozen(ACTIVIDADES[0].mapeoCiiu))
})

prueba('catálogo: las 8 actividades tienen mapeo Envigado; restaurante y discoteca son explícitos', () => {
  assert.deepEqual(validarCatalogo(), [])
  assert.equal(ACTIVIDADES.length, 8)
  for (const a of ACTIVIDADES) assert.ok(a.mapeoCiiu?.Envigado, a.id)
  assert.deepEqual(ACTIVIDADES.filter((a) => a.mapeoCiiu.Envigado.confianza === 'explicita').map((a) => a.id), ['restaurante', 'discoteca'])
})

prueba('Itagüí no cambió: mapeos y evaluarActividad siguen igual', () => {
  assert.ok(INSTRUMENTOS.Itagui && INSTRUMENTOS.Medellin)
  assert.deepEqual(validarInstrumento(INSTRUMENTOS.Itagui), [])
  const m = Object.fromEntries(ACTIVIDADES.map((a) => [a.id, a.mapeos.Itagui?.tipologia ?? null]))
  assert.deepEqual(m, { licorera: 'C-2', restaurante: 'S-7', supermercado: 'C-11', minimercado: 'C-1', discoteca: 'S-6', gimnasio: 'S-5', farmacia: 'C-1', tienda_tecnologia: 'C-3' })
  const r = evaluarActividad({ instrumento: INSTRUMENTOS.Itagui, municipioSlug: 'Itagui', zonaCodigo: null, actividadId: 'minimercado' })
  assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
  assert.equal(r.datos.tipologia.sugerida, true)
})

prueba('discoteca (553): Centro tradicional => condicionada; residencial => celda vacía => insuficiente', () => {
  const ct = ev('discoteca', 'CT')
  assert.equal(ct.resultado, RESULTADOS.CONDICIONADA)
  assert.ok(ct.referencias.some((x) => x.articulo === '184'))
  assert.equal(ev('discoteca', 'RES').resultado, RESULTADOS.INSUFICIENTE)
})

let fallos = 0
for (const [nombre, fn] of pruebas) {
  try { fn(); console.log(`ok ${nombre}`) } catch (e) { fallos++; console.error(`FALLA ${nombre}\n  ${e.message}`) }
}
if (fallos) { console.error(`${fallos} prueba(s) fallaron.`); process.exit(1) }
console.log('Todo correcto.')
