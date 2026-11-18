import assert from 'node:assert/strict'
import { RESULTADOS } from '../src/utils/normativa/evaluar.js'
import { SITUACIONES, esLaEstrella, valorarPunto } from '../src/utils/normativa/evaluarEnPunto.js'
import { describirTarjeta } from '../src/utils/normativa/presentacion.js'

const ok = (m) => console.log(`ok ${m}`)
const LE = { estado: 'resuelto', slug: 'LaEstrella', nombre: 'La Estrella' }
const valorar = (actividadId, extra = {}) => valorarPunto({ municipio: LE, resultadoTerritorial: null, actividadId, ...extra })

assert.equal(esLaEstrella(LE), true)

// Sin área elegida: nunca concluye, no elige área en silencio y muestra las 15 áreas
const sinArea = valorar('supermercado')
assert.equal(sinArea.resultado, RESULTADOS.INSUFICIENTE)
assert.equal(sinArea.situacion, SITUACIONES.ZONA_SIN_IDENTIFICAR)
assert.match(sinArea.explicacion, /no elige el área por ti/)
assert.match(sinArea.queFalta, /Elige el área de actividad/)
assert.equal(sinArea.porArea.length, 15)
assert.ok(sinArea.porArea.includes('Residencial tipo 1: uso prohibido'))
assert.ok(sinArea.porArea.includes('Área de actividad múltiple 3: uso principal'))
assert.equal(sinArea.lecturaElegida, null)
assert.equal(sinArea.datos.zonaCodigo, null)
assert.equal(describirTarjeta(sinArea).zona, null)
ok('sin área: no concluye y muestra cómo trata cada una de las 15 áreas')

// Área elegida: lectura marcada "(no concluye)"
const conArea = valorar('supermercado', { areaElegida: 'RES2' })
assert.equal(conArea.resultado, RESULTADOS.INSUFICIENTE)
assert.equal(conArea.lecturaElegida.estadoEnZona, 'condicionada')
assert.ok(conArea.lecturaElegida.condiciones.some((c) => c.includes('controles espaciales y ambientales')))
const lectura = describirTarjeta(conArea).lectura
assert.equal(lectura.titulo, 'Lectura según el área que elegiste (no concluye)')
assert.match(lectura.texto, /Residencial tipo 2 lista la tipología C7 como condicionada/)
assert.match(lectura.aviso, /no puede comprobarlo desde el punto/)
assert.equal(describirTarjeta(valorar('supermercado', { areaElegida: 'RES1' })).lectura.texto.includes('prohibida'), true)
assert.equal(valorar('farmacia', { areaElegida: 'IND2' }).lecturaElegida.estadoEnZona, 'no_listada')
assert.equal(valorar('discoteca', { areaElegida: 'AAM2' }).lecturaElegida.estadoEnZona, 'contradictoria')
ok('con área elegida: lectura "según el área que elegiste (no concluye)"')

// Área desconocida: se ignora, no se adivina
const desconocida = valorar('supermercado', { areaElegida: 'XXX' })
assert.equal(desconocida.lecturaElegida, null)
assert.equal(desconocida.porArea.length, 15)
ok('un área desconocida se ignora')

// Actividades que la norma no nombra: elige tipología y, opcionalmente, área
const sinTipologia = valorar('minimercado')
assert.match(sinTipologia.explicacion, /no nombra/)
assert.deepEqual(sinTipologia.porArea, [])
assert.match(sinTipologia.queFalta, /Elige la tipología/)
const conTipologia = valorar('minimercado', { tipologiaElegida: 'C1' })
assert.equal(conTipologia.porArea.length, 15)
assert.equal(conTipologia.lecturaElegida, null)
const ambas = valorar('minimercado', { tipologiaElegida: 'C1', areaElegida: 'AAM3' })
assert.equal(ambas.resultado, RESULTADOS.INSUFICIENTE)
assert.equal(ambas.lecturaElegida.estadoEnZona, 'prohibida')
assert.equal(describirTarjeta(ambas).lectura.titulo, 'Lectura según la tipología y el área que elegiste (no concluye)')
const noCandidata = valorar('minimercado', { tipologiaElegida: 'C7' })
assert.deepEqual(noCandidata.porArea, [])
assert.equal(describirTarjeta(valorar('minimercado', { tipologiaElegida: 'C1' })).tipologia, null)
ok('inferidas: la persona elige tipología y área, y la lectura no concluye')

// Avisos de la norma
assert.ok(valorar('licorera').advertencias.some((a) => a.includes('200 metros')))
assert.ok(valorar('licorera').advertencias.some((a) => a.includes('S5')))
assert.ok(valorar('discoteca').advertencias.some((a) => a.includes('200 metros')))
assert.ok(valorar('supermercado').advertencias.some((a) => a.includes('600 m²')))
assert.ok(valorar('supermercado', { areaElegida: 'RES6' }).advertencias.some((a) => a.includes('SU_CN3_10')))
assert.ok(valorar('farmacia', { areaElegida: 'AAM2' }).advertencias.some((a) => a.includes('lista S5 como') || a.includes('parcial')))
assert.ok(valorar('farmacia').advertencias.some((a) => a.includes('área de actividad')))
ok('avisos de licor, gran formato, notas del área y que no hay mapa del área')

// Tarjeta: sin marcas internas y con límites visibles
for (const actividad of ['licorera', 'minimercado', 'restaurante', 'discoteca', 'supermercado', 'gimnasio', 'farmacia', 'tienda_tecnologia']) {
  for (const extra of [{}, { areaElegida: 'RES1' }, { areaElegida: 'AAM2', tipologiaElegida: 'C2' }]) {
    const t = describirTarjeta(valorar(actividad, extra))
    assert.ok(!JSON.stringify(t).includes('[verificar]'), actividad)
    assert.ok(t.advertencias.length > 0, actividad)
    assert.equal(t.clase, 'insuficiente', actividad)
  }
}
ok('la tarjeta no muestra [verificar] y siempre trae advertencias')

// El punto ya no depende de la capa de tratamientos
assert.equal(valorarPunto({ municipio: LE, resultadoTerritorial: { bloques: [{ tipo: 'tratamiento', registros: [{ atributosOriginales: { CODIGO: 'ZU13 CN08' } }] }] }, actividadId: 'farmacia' }).porArea.length, 15)
ok('el resultado no depende de los códigos viejos de polígono')

// Regresión de los otros municipios
const itagui = valorarPunto({ municipio: { estado: 'resuelto', slug: 'Itagui', nombre: 'Itagüí' }, zonaResultado: { estado: 'sin_poligono' }, actividadId: 'farmacia' })
assert.equal(itagui.situacion, SITUACIONES.ZONA_SIN_IDENTIFICAR)
for (const [slug, nombre] of [['Envigado', 'Envigado'], ['Sabaneta', 'Sabaneta']]) {
  const v = valorarPunto({ municipio: { estado: 'resuelto', slug, nombre }, resultadoTerritorial: null, actividadId: 'farmacia' })
  assert.equal(v.situacion, SITUACIONES.ZONA_SIN_IDENTIFICAR, slug)
}
const caldas = valorarPunto({ municipio: { estado: 'resuelto', slug: 'Caldas', nombre: 'Caldas' }, actividadId: 'farmacia' })
assert.equal(caldas.situacion, SITUACIONES.NORMA_NO_CARGADA)
ok('regresión: Itagüí, Envigado, Sabaneta y municipios sin norma se comportan igual')

console.log('Todo correcto.')