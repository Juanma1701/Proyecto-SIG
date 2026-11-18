import assert from 'node:assert/strict'
import { validarInstrumento } from '../src/utils/normativa/esquema.js'
import {
  areaDeMixturaPorCodigo,
  erroresDeInstrumentos,
  filaDeMatriz,
  instrumentoDeMunicipio
} from '../src/utils/normativa/index.js'

const medellin = instrumentoDeMunicipio('Medellin')
const regimen = medellin.regimenMixtura

function prueba(nombre, fn) {
  fn()
  console.log(`ok  ${nombre}`)
}

const permitido = (texto) => filaDeMatriz('Medellin', texto)?.permitido
const pau = (texto) => regimen.requierePau.filter((p) => p.subcategoria.toLowerCase().includes(texto.toLowerCase()))

prueba('instrumento válido, cobertura parcial y sin zonas ni tipologías propias', () => {
  assert.deepEqual(erroresDeInstrumentos(), [])
  assert.equal(medellin.cobertura, 'parcial')
  assert.equal(medellin.vigencia.estado, 'vigente_segun_fuente_municipal')
  assert.deepEqual(medellin.zonas, [])
  assert.deepEqual(medellin.tipologias, [])
  assert.equal(instrumentoDeMunicipio('Bello'), null)
})

prueba('las 5 áreas cubren los 10 códigos de la capa usos_suelo, sin repetir', () => {
  const deAreas = regimen.areas.flatMap((a) => a.codigosSubcategoria)
  const otras = regimen.otrasCategoriasDeLaCapa.flatMap((o) => o.codigosSubcategoria)
  const todos = [...deAreas, ...otras].sort((a, b) => a - b)
  assert.deepEqual(todos, [11, 21, 31, 32, 33, 41, 42, 43, 50, 60])
  assert.equal(areaDeMixturaPorCodigo('Medellin', 11).id, 'baja')
  assert.equal(areaDeMixturaPorCodigo('Medellin', 21).id, 'media')
  assert.equal(areaDeMixturaPorCodigo('Medellin', 31).id, 'altaTransformacion')
  assert.equal(areaDeMixturaPorCodigo('Medellin', 32).id, 'altaCentralidades')
  assert.equal(areaDeMixturaPorCodigo('Medellin', 33).id, 'altaPredominanciaEconomica')
  assert.equal(areaDeMixturaPorCodigo('Medellin', 60), null)
})

prueba('matriz: 53 filas con SI o NO en las 5 columnas y fuente del art. 255', () => {
  assert.equal(regimen.matriz.length, 53)
  for (const f of regimen.matriz) {
    assert.deepEqual(Object.keys(f.permitido), regimen.areas.map((a) => a.id), f.actividad)
    assert.ok(f.fuente.paginaPdf >= 351 && f.fuente.paginaPdf <= 355, f.actividad)
    assert.equal(f.fuente.articulo, '255')
    assert.equal(f.fuente.verificacion, 'extraido_de_texto')
  }
})

prueba('regla de herencia del acuerdo: baja => media => alta, y las dos columnas de centralidades coinciden', () => {
  for (const { actividad, permitido: p } of regimen.matriz) {
    if (p.baja) assert.ok(p.media, `${actividad}: baja sin media`)
    if (p.media) assert.ok(p.altaTransformacion && p.altaCentralidades && p.altaPredominanciaEconomica, `${actividad}: media sin alta`)
    assert.equal(p.altaCentralidades, p.altaPredominanciaEconomica, actividad)
  }
})

prueba('casos de la matriz: comercio, hospedaje, licor, casinos, grandes superficies', () => {
  assert.deepEqual(Object.values(permitido('COMERCIO PEQUEÑO')), [true, true, true, true, true])
  assert.deepEqual(Object.values(permitido('COMERCIO MEDIANO')), [false, true, true, true, true])
  assert.deepEqual(Object.values(permitido('COMERCIO GRANDE')), [false, false, true, true, true])
  assert.deepEqual(Object.values(permitido('GRANDES SUPERFICIES')), [false, false, true, false, false])
  assert.equal(permitido('HOSPEDAJE PEQUEÑO').baja, false)
  assert.equal(permitido('HOSPEDAJE PEQUEÑO').media, true)
  assert.equal(permitido('LICOR Aforo tipo 1').baja, false)
  assert.equal(permitido('LICOR Aforo tipo 1').media, true)
  assert.equal(permitido('LICOR aforo tipo 2, 3 y 4').media, false)
  assert.ok(Object.values(permitido('CASINOS')).every((v) => v === false))
  assert.equal(permitido('Restaurantes, panaderías, reposterías cafeterías y similares Aforo tipo 1').baja, true)
  assert.deepEqual(Object.values(permitido('HORNOS CREMATORIOS')), [false, false, true, false, false])
})

prueba('las filas de la p. 355 no inventan categoría y están documentadas', () => {
  const sin = regimen.matriz.filter((f) => f.fuente.paginaPdf === 355)
  assert.equal(sin.length, 7)
  for (const f of sin) {
    assert.equal(f.categoria, null)
    assert.equal(f.observaciones.length, 1)
  }
  assert.ok(regimen.matriz.find((f) => f.actividad.startsWith('INDUSTRIA ARTESANAL Superiores')).observaciones.length === 1)
})

prueba('4 tablas de actividades por área, cada una con comercio, servicios e industria', () => {
  assert.equal(regimen.actividadesPorArea.length, 4)
  const ids = regimen.actividadesPorArea.map((t) => t.areaIds.join('+'))
  assert.deepEqual(ids, ['baja', 'media', 'altaCentralidades+altaPredominanciaEconomica', 'altaTransformacion'])
  for (const t of regimen.actividadesPorArea) {
    assert.equal(t.grupos.length, 3, t.titulo)
    assert.equal(t.grupos[2].categoria, 'Industria')
    assert.ok(t.fuente.paginaPdf >= 356 && t.fuente.paginaPdf <= 358)
  }
})

prueba('actividades nombradas: tiendas de barrio en baja, licor y gimnasios en media', () => {
  const sub = (i) => regimen.actividadesPorArea[i].grupos.flatMap((g) => g.subcategorias).join(' | ')
  assert.match(sub(0), /Tiendas de barrio y\/o Mini mercados/)
  assert.match(sub(0), /Droguerías/)
  assert.doesNotMatch(sub(0), /Gimnasios/)
  assert.match(sub(1), /Gimnasios/)
  assert.match(sub(1), /bebidas alcohólicas/)
  assert.match(sub(2), /Hipermercados/)
  assert.match(sub(3), /Grandes superficies/)
  const servicios = regimen.actividadesPorArea[1].grupos[1]
  assert.equal(servicios.categoria, 'Servicios de mediano impacto y de alto impacto en bajo aforo')
  assert.equal(servicios.observaciones.length, 1)
  assert.equal(servicios.subcategorias.length, 20)
})

prueba('PAU: 79 filas; tiendas y droguerías no lo requieren; licor, gimnasios, restaurantes e industria sí', () => {
  assert.equal(regimen.requierePau.length, 79)
  for (const p of regimen.requierePau) assert.ok(p.fuente.paginaPdf >= 362 && p.fuente.paginaPdf <= 364)
  assert.ok(pau('Tiendas De Barrio').every((p) => p.requiere === false))
  assert.ok(pau('Droguerías').every((p) => p.requiere === false))
  assert.ok(pau('Peluquerías').every((p) => p.requiere === true))
  assert.ok(pau('Gimnasio').every((p) => p.requiere === true) && pau('Gimnasio').length === 1)
  const licor = pau('Venta Y Consume De Licor')
  assert.equal(licor.length, 4)
  assert.ok(licor.every((p) => p.requiere === true))
  assert.ok(pau('Restaurantes').every((p) => p.requiere === true))
  const industria = regimen.requierePau.filter((p) => p.categoria === 'Industria')
  assert.equal(industria.length, 5)
  assert.ok(industria.every((p) => p.requiere === true && p.relacionadoCon === ''))
})

prueba('reglas de interpretación: 5 reglas y 2 parágrafos, con el solapamiento r1/r5 documentado', () => {
  const efectos = regimen.reglasInterpretacion.map((r) => r.efecto)
  assert.deepEqual(efectos, [
    'no_listado_prohibido',
    'permitido_en_baja_vale_en_media_y_alta',
    'permitido_en_media_vale_en_alta',
    'alta_solo_en_alta',
    'no_listado_consultar_matriz',
    'establecidas_exentas_de_localizacion',
    'mineria_prohibida'
  ])
  for (const id of ['r1', 'r5']) assert.equal(regimen.reglasInterpretacion.find((r) => r.id === id).observaciones.length, 1)
})

prueba('disposiciones y limitaciones documentadas, con vigencia (art. 614) y nuevo POT sin verificar', () => {
  const temas = medellin.disposicionesGenerales.map((d) => d.tema)
  for (const t of ['Zonificación de los usos urbanos', 'Aforo de los servicios', 'Actividades económicas singulares', 'Vigencias del plan']) {
    assert.ok(temas.includes(t), t)
  }
  assert.equal(medellin.disposicionesGenerales.find((d) => d.tema === 'Vigencias del plan').fuente.articulo, '614')
  assert.match(medellin.vigencia.nota, /Proyecto de Acuerdo 104 de 2026/)
  const l = medellin.limitaciones.join(' ')
  for (const patron of [/rural/, /Título III/, /r1 y r5/, /curadurías/]) assert.match(l, patron)
})

prueba('el validador rechaza un régimen de mixtura inválido', () => {
  const malo = structuredClone(medellin)
  malo.regimenMixtura.matriz[0].permitido = { baja: true }
  malo.regimenMixtura.areas[0].codigosSubcategoria = []
  malo.regimenMixtura.actividadesPorArea[0].areaIds = ['inventada']
  malo.regimenMixtura.requierePau[0].requiere = 'si'
  malo.regimenMixtura.reglasInterpretacion[0].efecto = ''
  const errores = validarInstrumento(malo)
  for (const patron of [/falta SI o NO/, /subcategoría inválidos/, /áreas inválidas/, /PAU .*falta SI o NO/, /falta id, efecto o texto/]) {
    assert.ok(errores.some((e) => patron.test(e)), String(patron))
  }
})

prueba('herencia entre áreas (reglas r2 y r3) y valor de municipio en la capa', () => {
  const heredan = Object.fromEntries(regimen.areas.map((a) => [a.id, a.heredaDe]))
  assert.deepEqual(heredan, {
    baja: [],
    media: ['baja'],
    altaTransformacion: ['baja', 'media'],
    altaCentralidades: ['baja', 'media'],
    altaPredominanciaEconomica: ['baja', 'media']
  })
  assert.equal(medellin.geometria.valorMunicipioEnCapa, 'Medellín')
  const malo = structuredClone(medellin)
  malo.regimenMixtura.areas[1].heredaDe = ['inventada']
  malo.regimenMixtura.areas[0].heredaDe = ['baja']
  const errores = validarInstrumento(malo)
  assert.equal(errores.filter((e) => /hereda de un área inválida/.test(e)).length, 2)
})

prueba('datos inmutables', () => {
  assert.ok(Object.isFrozen(medellin))
  assert.ok(Object.isFrozen(regimen.matriz[0].permitido))
  assert.throws(() => {
    regimen.matriz[0].actividad = 'otra'
  }, TypeError)
})

console.log('Todo correcto.')