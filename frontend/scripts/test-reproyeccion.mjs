import assert from 'node:assert/strict'
import { reproyectarGeoJSON, normalizarGeoJSON } from '../src/utils/reproyectarGeoJSON.js'
import { detectarCRS } from '../src/utils/detectarCRS.js'
import { geojsonConCRS } from '../src/utils/exportarCapa.js'

const PUNTO_MEDELLIN = [-75.5636, 6.2442]

const ANILLO_CERRADO = [
  [-75.57, 6.24], [-75.55, 6.24], [-75.55, 6.25], [-75.57, 6.25], [-75.57, 6.24],
]

function envolver(geometria) {
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: geometria }],
  }
}

// Compara geometrías enteras (no solo coordinates) para que la prueba también
// cubra GeometryCollection. Se redondea porque el viaje de ida y vuelta por
// proyección no es bit a bit idéntico.
function recuperar(valor) {
  if (typeof valor === 'number') return Math.round(valor * 1e7) / 1e7
  if (Array.isArray(valor)) return valor.map(recuperar)
  if (valor && typeof valor === 'object') {
    const salida = {}
    for (const [clave, dato] of Object.entries(valor)) {
      salida[clave] = recuperar(dato)
    }
    return salida
  }
  return valor
}

// 1. Regresión: un Polygon sin huecos tiene coordinates = [[anillo]], longitud 1.
//    La validación exigía length >= 2 en todos los niveles del árbol y lo
//    rechazaba como "coordenadas inválidas", rompiendo la reproyección de
//    cualquier capa de polígonos (p. ej. uso de suelo recortado con turf).
const DEBEN_ENTRAR = {
  'Polygon sin huecos': { type: 'Polygon', coordinates: [ANILLO_CERRADO] },
  'Polygon con hueco': {
    type: 'Polygon',
    coordinates: [
      ANILLO_CERRADO,
      [[-75.565, 6.243], [-75.56, 6.243], [-75.56, 6.245], [-75.565, 6.245], [-75.565, 6.243]],
    ],
  },
  'MultiPolygon de un solo polígono': { type: 'MultiPolygon', coordinates: [[ANILLO_CERRADO]] },
  'LineString': { type: 'LineString', coordinates: [PUNTO_MEDELLIN, [-75.6, 6.3]] },
  'MultiPoint': { type: 'MultiPoint', coordinates: [PUNTO_MEDELLIN, [-75.6, 6.3]] },
}

for (const [nombre, geometria] of Object.entries(DEBEN_ENTRAR)) {
  assert.doesNotThrow(
    () => normalizarGeoJSON(envolver(geometria)),
    `${nombre} debe aceptarse`
  )
  console.log(`ok  se acepta: ${nombre}`)
}

// 2. Los siete tipos de geometría sobreviven ida y vuelta contra un sistema
//    en metros, sin perder ni deformar vértices.
const TIPOS = {
  Point: { type: 'Point', coordinates: PUNTO_MEDELLIN },
  MultiPoint: { type: 'MultiPoint', coordinates: [PUNTO_MEDELLIN, [-75.6, 6.3]] },
  LineString: { type: 'LineString', coordinates: [PUNTO_MEDELLIN, [-75.6, 6.3]] },
  MultiLineString: { type: 'MultiLineString', coordinates: [[PUNTO_MEDELLIN, [-75.6, 6.3]]] },
  Polygon: { type: 'Polygon', coordinates: [ANILLO_CERRADO] },
  MultiPolygon: { type: 'MultiPolygon', coordinates: [[ANILLO_CERRADO]] },
  GeometryCollection: {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: PUNTO_MEDELLIN },
      { type: 'Polygon', coordinates: [ANILLO_CERRADO] },
    ],
  },
}

for (const destino of [3116, 31119, 9377, 3857, 32618, 32619]) {
  for (const [nombre, geometria] of Object.entries(TIPOS)) {
    const ida = reproyectarGeoJSON(envolver(geometria), 4326, destino)
    const vuelta = reproyectarGeoJSON(ida, destino, 4326)

    assert.deepEqual(
      recuperar(geometria),
      recuperar(vuelta.features[0].geometry),
      `${nombre} no vuelve igual desde EPSG:${destino}`
    )
  }
  console.log(`ok  ida y vuelta 4326 <-> EPSG:${destino} en los 7 tipos`)
}

// 3. El destino en metros debe quedar en metros y devolver el punto a su sitio.
//    Comparar contra una constante memorizada sería comprob circular
//    (proj4 contra proj4), así que se mide el desplazamiento en el suelo.
const punto3116 = reproyectarGeoJSON(envolver(TIPOS.Point), 4326, 3116)
const [x3116, y3116] = punto3116.features[0].geometry.coordinates

assert.ok(x3116 > 100000 && x3116 < 5000000, `X no parece metros: ${x3116}`)
assert.ok(y3116 > 1000000 && y3116 < 3000000, `Y no parece metros: ${y3116}`)
console.log(`ok  Medellín en EPSG:3116 = (${x3116.toFixed(1)}, ${y3116.toFixed(1)}) metros`)

for (const destino of [3116, 31119, 9377, 3857, 32618, 32619]) {
  const ida = reproyectarGeoJSON(envolver(TIPOS.Point), 4326, destino)
  const [lng, lat] = reproyectarGeoJSON(ida, destino, 4326).features[0].geometry.coordinates
  const metros = Math.hypot(
    (lng - PUNTO_MEDELLIN[0]) * 111320 * Math.cos((lat * Math.PI) / 180),
    (lat - PUNTO_MEDELLIN[1]) * 110540
  )
  assert.ok(metros < 1, `vuelta desde EPSG:${destino} se desplazó ${metros.toFixed(4)} m`)
  console.log(`ok  vuelta desde EPSG:${destino}, error de ${metros.toFixed(6)} m`)
}

// 4. Lo que sí debe seguir rechazándose.
const DEBEN_FALLAR = {
  'posición con un solo número': { type: 'Point', coordinates: [1] },
  'posición vacía': { type: 'Point', coordinates: [] },
  'polígono con anillo vacío': { type: 'Polygon', coordinates: [[]] },
  'polígono sin anillos': { type: 'Polygon', coordinates: [] },
  'coordenadas no numéricas': { type: 'Point', coordinates: ['a', 'b'] },
  'coordenadas infinitas': { type: 'Point', coordinates: [Infinity, 1] },
  'tipo de geometría desconocido': { type: 'Wormhole', coordinates: [0, 0] },
}

for (const [nombre, geometria] of Object.entries(DEBEN_FALLAR)) {
  assert.throws(
    () => normalizarGeoJSON(envolver(geometria)),
    `${nombre} debe rechazarse`
  )
  console.log(`ok  se rechaza: ${nombre}`)
}

// 5. Ciclo completo: subir equipamientos en 4326, reproyectar a metros,
//    descargar, volver a subir. El archivo descargado tiene que declararse a sí
//    mismo, y la recarga tiene que devolver los mismos equipamientos en grados.
//
//    Sin el miembro "crs" el archivo descargado llega mudo, la detección asume
//    4326 e interpreta metros como grados: la capa se dibuja fuera del planeta
//    y los puntos simplemente no aparecen.
const EQUIPAMIENTOS = envolver({
  type: 'MultiPoint',
  coordinates: [PUNTO_MEDELLIN, [-75.58, 6.25], [-75.55, 6.24]],
})

for (const destino of [3116, 31119, 9377, 3857, 32618]) {
  const enMetros = reproyectarGeoJSON(EQUIPAMIENTOS, 4326, destino)
  const descargado = JSON.parse(JSON.stringify(geojsonConCRS(enMetros, destino)))

  const recargado = detectarCRS(descargado, 'geojson')
  assert.equal(recargado.epsg, destino, `al re-subir deberia detectarse EPSG:${destino}`)

  const devuelto = reproyectarGeoJSON(normalizarGeoJSON(descargado), destino, 4326)
  assert.deepEqual(
    recuperar(EQUIPAMIENTOS.features[0].geometry.coordinates),
    recuperar(devuelto.features[0].geometry.coordinates),
    `los equipamientos no vuelven a su sitio desde EPSG:${destino}`
  )
  console.log(`ok  ida y vuelta por archivo: 4326 -> EPSG:${destino} -> 4326`)
}

// 6. Un GeoJSON de metros sin miembro "crs" ya no debe aceptarse en silencio
//    como 4326: se rechaza con una explicación, para que el error diga algo.
const mudo = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [835525.79, 1182474.92] },
  }],
}

const detectadoMudo = detectarCRS(mudo, 'geojson')
assert.equal(detectadoMudo.epsg, null, 'un archivo en metros sin crs no puede darse por 4326')
assert.match(detectadoMudo.fuente, /proyectado/i)
console.log(`ok  archivo mudo en metros se rechaza: ${detectadoMudo.fuente}`)

// 7. Pero un GeoJSON en grados legítimo, sin crs, sigue siendo 4326.
const enGrados = envolver({ type: 'Point', coordinates: PUNTO_MEDELLIN })
delete enGrados.crs
assert.equal(detectarCRS(enGrados, 'geojson').epsg, 4326)
console.log('ok  archivo en grados sin crs se sigue tomando como 4326')

// 8. Los miembros ajenos del GeoJSON sobreviven a la exportación.
const conExtras = { ...EQUIPAMIENTOS, name: 'Equipamientos', crs: { type: 'name', properties: { name: 'x' } } }
const exportado = geojsonConCRS(conExtras, 3116)
assert.equal(exportado.name, 'Equipamientos')
assert.equal(exportado.crs.properties.name, 'urn:ogc:def:crs:EPSG::3116')
assert.throws(() => geojsonConCRS(EQUIPAMIENTOS, 'no-es-un-numero'), 'debe rechazar un EPSG inválido')
console.log('ok  la exportación conserva los demás miembros y valida el EPSG')

console.log('\nTodo correcto.')
