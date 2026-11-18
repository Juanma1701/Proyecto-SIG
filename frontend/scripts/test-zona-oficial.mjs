import assert from 'node:assert/strict'
import { parsearListaCodigos, parsearNota, zonaDesdeAtributos } from '../src/utils/normativa/zonaOficial.js'
import { BASE_ITAGUI, consultarZonaItagui, urlConsultaPunto } from '../src/utils/normativa/consultaZonaItagui.js'
import { RESULTADOS, evaluarActividad } from '../src/utils/normativa/evaluar.js'
import { instrumentoDeMunicipio } from '../src/utils/normativa/index.js'

const NBSP = '\u00A0'
const PROH = 'Todas las no mencionadas en esta ficha'

// Registros REALES de la capa (campos recortados)
const ZU_R_23 = {
  codigo: 'ZU-R-23', uso_ppal: 'Áreas de actividad residencial', sector: 'nuevos desarrollos (suelo de expansión Acuerdo 020 de 2007)',
  uso_cond: 'C-2*, C-3*, C-11, C-12, C-13, S-4, S-5, S-6*, S-11, S-16, S-18, S-19, I-5, D-1, D-2, D-3,  D-7,',
  uso_comp: 'R-U, R-B, R-T, R-M1, R-M2, R-M3, C-1, S-8, S-7, S-15, D-5, D-8, D-10,', uso_proh: PROH,
  condicion1: '*ZU-R-23 solo en áreas comerciales\n', condicion2: ' ', condicion3: ' '
}
const ZU_C_02 = {
  codigo: 'ZU-C-02', uso_ppal: 'Áreas de actividad comercial', sector: 'Sector Las Mercedes',
  uso_cond: `C-2, C-9, S-3, S-4, S-6, S-11, S-13*, S-16, S-19, S-22, S-24, S-26, I-5, D-1, D-2, D-3,`,
  uso_comp: 'RU, RB, RT, R-M1, RM2, R-M3,, C-1, C-3, C-4, C-11, C-12, C-13, S-5, S-7, S-8, S-9, S-15, S-18, D-5, D-8, D-10,',
  uso_proh: PROH, condicion1: `*ZU-C-01 y ZU-C-02 Solo servicios de salas de velación.${NBSP}${NBSP}`, condicion2: ' ', condicion3: ' '
}
const ZU_AM_03 = {
  codigo: 'ZU-AM-03', uso_ppal: 'Áreas de actividad múltiple', sector: 'Calle 36 y sectores aledaños, desde la carrera 70 hasta la carrera 50A.',
  uso_cond: `C-2, C-3, C-4, C-5*, C-6*,${NBSP} C-7*, C-8*, C-9, C-11, C-12, C-13, S-3, S-4, S-6***, S-9, S-10*, S-11, S-13**, S-16,${NBSP} S-18, S-19, S-20*, S-24, S-26,${NBSP} I-3*, I-4*, I-5, D-1, D-2, D-3, D-7,`,
  uso_comp: 'R-U, R-B, R-T, R-M1, R-M2, R-M3, C-1, C-9, S-5, S-7, S-8, S-15, D-5, D-8, D-10,', uso_proh: PROH,
  condicion1: '* ZU-AM-03 Solo en bodegas ubicadas entre la calle 35 y calle 36 y las carreras 64 y límite con el polígono ZU-R-18',
  condicion2: '**ZU-AM-03 Solo en bodegas ubicadas entre la calle 35 y calle 36 y solo servicios de salas de velación.',
  condicion3: '*** ZU-AM-03 excepto en locales ubicados en el COMPLEX de Ditaires donde la tipología se considera prohibida.'
}
const ZU_AM_21 = {
  codigo: 'ZU-AM-21', uso_ppal: 'Áreas de actividad múltiple', sector: 'Sector Aluminio Nacional',
  uso_cond: 'C-2, C-5*, C-8, S-4, S-6, S-10, S-11, S-16, S-19, S-24, S-26, I-3, I-4. D-1, D-2, D-3,', uso_proh: PROH,
  uso_comp: `R-U, R-B, R-T, R-M1, R-M2, C-1, C-3,${NBSP}C-4, C-9, C-11, C-12, C-13, S-5, S-7, S-8, S-9 S-15, S-18. I-5, D-5, D-8, D-10,`,
  condicion1: `*ZU-AM-21 (Exceptuando el código${NBSP} el 4661)`, condicion2: ' ', condicion3: ' '
}
const ESPACIO_PUBLICO = { codigo: ' ', uso_ppal: 'Espacio público', uso_comp: ' ', uso_cond: ' ', uso_proh: ' ', sector: ' ', subtipo: 'Espacio público existente' }

// 1. Parser de listas: erratas reales de la capa
assert.deepEqual(parsearListaCodigos('RU, RB, RT, R-M1, RM2, R-M3,, C-1').codigos, ['R-U', 'R-B', 'R-T', 'R-M1', 'R-M2', 'R-M3', 'C-1'])
assert.deepEqual(parsearListaCodigos('I-3, I-4. D-1, S-9 S-15').codigos, ['I-3', 'I-4', 'D-1', 'S-9', 'S-15'])
assert.deepEqual(parsearListaCodigos('C-2*, S-6***, S-13**').marcas, { 'C-2': '*', 'S-6': '***', 'S-13': '**' })
assert.deepEqual(parsearListaCodigos(' ').codigos, [])
assert.deepEqual(parsearListaCodigos(null).codigos, [])
console.log('ok  listas de códigos: RU/RB/RM2, comas dobles, punto y espacio como separador, asteriscos')

// 2. Notas
const n = parsearNota('** ZU-AM-03 Solo en bodegas. En el resto del polígono se prohíbe.')
assert.equal(n.simbolo, '**')
assert.equal(n.restoDelPoligono, 'prohibido')
assert.ok(!/^ZU-/.test(n.texto))
assert.equal(parsearNota(' '), null)
assert.equal(parsearNota('sin asterisco'), null)
console.log('ok  notas: símbolo, texto sin el prefijo de zona y regla de "resto del polígono"')

// 3. Zonas reales
let z = zonaDesdeAtributos(ZU_R_23)
assert.equal(z.compatibles.length, 13)
assert.equal(z.condicionados.length, 17)
assert.deepEqual(z.marcas, { 'C-2': '*', 'C-3': '*', 'S-6': '*' })
assert.match(z.notasMarcas['*'].texto, /solo en áreas comerciales/)
assert.match(z.prohibidos, /no mencionadas/)
z = zonaDesdeAtributos(ZU_C_02)
assert.ok(z.compatibles.includes('R-U') && z.compatibles.includes('R-M2'))
assert.equal(z.marcas['S-13'], '*')
z = zonaDesdeAtributos(ZU_AM_03)
assert.equal(z.marcas['S-6'], '***')
assert.equal(z.marcas['S-13'], '**')
assert.match(z.notasMarcas['***'].texto, /COMPLEX/)
assert.ok(z.compatibles.includes('C-9') && z.condicionados.includes('C-9'))
z = zonaDesdeAtributos(ZU_AM_21)
assert.ok(z.condicionados.includes('I-4') && z.condicionados.includes('D-1'))
assert.ok(z.compatibles.includes('S-9') && z.compatibles.includes('S-15') && z.compatibles.includes('I-5'))
assert.equal(z.fuente.origen, 'capa_oficial')
assert.equal(zonaDesdeAtributos(ESPACIO_PUBLICO).codigo, null)
console.log('ok  zonas reales ZU-R-23, ZU-C-02, ZU-AM-03 y ZU-AM-21 convertidas; espacio público sin código')

// 4. Consulta de punto (fetch simulado)
const url = new URL(urlConsultaPunto({ lat: 6.1719, lon: -75.6117 }), 'http://x')
assert.equal(url.searchParams.get('geometry'), '-75.61170,6.17190')
assert.equal(url.searchParams.get('inSR'), '4326')
assert.equal(url.searchParams.get('returnGeometry'), 'false')
assert.throws(() => urlConsultaPunto({ lat: NaN, lon: 1 }), RangeError)
const respuesta = (cuerpo, estado = 200) => async () => ({ ok: estado < 400, status: estado, json: async () => cuerpo })
const punto = { lat: 6.1719, lon: -75.6117 }
const consulta = (fetchFn, extra = {}) => consultarZonaItagui(punto, { fetchFn, ...extra })

let r = await consulta(respuesta({ features: [{ attributes: ZU_C_02 }] }))
assert.equal(r.estado, 'ok')
assert.equal(r.zona.codigo, 'ZU-C-02')
assert.equal((await consulta(respuesta({ features: [{ attributes: ESPACIO_PUBLICO }] }))).estado, 'sin_codigo')
assert.equal((await consulta(respuesta({ features: [] }))).estado, 'sin_poligono')
r = await consulta(respuesta({ features: [{ attributes: ZU_C_02 }, { attributes: ZU_R_23 }] }))
assert.equal(r.estado, 'varias_zonas')
assert.deepEqual(r.codigos, ['ZU-C-02', 'ZU-R-23'])
assert.equal((await consulta(respuesta({ features: [{ attributes: ZU_C_02 }, { attributes: ZU_C_02 }] }))).estado, 'ok')
console.log('ok  consulta: zona, espacio público sin código, fuera de la capa y varias zonas')

assert.equal((await consulta(respuesta({ error: { code: 400, message: 'x' } }))).estado, 'error_servicio')
assert.equal((await consulta(respuesta({}, 504))).estado, 'error_servicio')
assert.equal((await consulta(respuesta({ algo: 1 }))).estado, 'error_servicio')
assert.equal((await consulta(async () => ({ ok: true, status: 200, json: async () => { throw new Error('no json') } }))).estado, 'error_servicio')
assert.equal((await consulta(async () => { throw new Error('caído') })).estado, 'error_red')
const colgado = (_u, { signal }) => new Promise((_, rechazar) => signal.addEventListener('abort', () => rechazar(new Error('abortado'))))
assert.equal((await consulta(colgado, { timeoutMs: 20 })).estado, 'timeout')
const controlador = new AbortController()
const pendiente = consulta(colgado, { signal: controlador.signal, timeoutMs: 5000 })
controlador.abort()
assert.equal((await pendiente).estado, 'cancelada')
assert.ok(BASE_ITAGUI.startsWith('/itagui/'))
console.log('ok  errores: HTTP 200 con {error}, 504, no JSON, red caída, timeout y cancelación')

// 5. Motor con zonas de la capa oficial y los datos reales de Itagüí
const instrumento = instrumentoDeMunicipio('Itagui')
const evaluar = (atributos, actividadId, catalogo) =>
  evaluarActividad({ instrumento, municipioSlug: 'Itagui', zona: zonaDesdeAtributos(atributos), actividadId, catalogo })

r = evaluar(ZU_R_23, 'licorera')
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.equal(r.requiereVerificarUbicacion, true)
assert.ok(r.condiciones.some((c) => /áreas comerciales/.test(c)))
assert.ok(r.advertencias.some((a) => /capa oficial/.test(a)))
assert.ok(r.referencias.some((x) => x.url?.includes('arcgis.itagui.gov.co')))

r = evaluar(ZU_C_02, 'licorera')
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.equal(r.requiereVerificarUbicacion, false)
assert.equal(evaluar(ZU_C_02, 'restaurante').resultado, RESULTADOS.COMPATIBLE)

const galeria = [{ id: 'galeria', nombre: 'Galería comercial', terminosNorma: [], mapeos: { Itagui: { tipologia: 'C-9', confianza: 'explicita', fuente: { articulo: '175', paginaPdf: 123 } } } }]
r = evaluar(ZU_AM_03, 'galeria', galeria)
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.match(r.razones[0], /compatible y también como condicionada/)
assert.ok(r.advertencias.some((a) => /se contradice/.test(a)))

r = evaluar(ESPACIO_PUBLICO, 'licorera')
assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
assert.match(r.razones[0], /no trae una lista de usos/)
console.log('ok  motor con la capa oficial: asteriscos, lectura restrictiva ante contradicción y zonas sin lista de usos')

console.log('\nTodo correcto.')