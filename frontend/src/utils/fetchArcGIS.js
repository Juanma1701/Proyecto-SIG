const AMVA_BASE = '/amva/server/rest/services'
const TAMANO_PAGINA_CONSULTA = 1000

let catalogoCache = null


function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_')
}

async function obtenerCatalogoServicios() {
  if (catalogoCache) return catalogoCache

  const res = await fetch(`${AMVA_BASE}?f=json`)
  if (!res.ok) throw new Error(`No se pudo listar los servicios del AMVA: ${res.status}`)

  const data = await res.json()
  // data.services trae [{ name: "Barbosa_POT_EB", type: "MapServer" }, ...]
  catalogoCache = data.services || []
  return catalogoCache
}

// Devuelve todos los servicios cuyo nombre "contiene" el municipio buscado.
// Puede haber más de uno (ej. un municipio con varios servicios separados).
export async function buscarServiciosPorMunicipio(nombreMunicipio) {
  const catalogo = await obtenerCatalogoServicios()
  const clave = normalizar(nombreMunicipio)

  return catalogo.filter(
    (s) => s.type === 'MapServer' && normalizar(s.name).includes(clave)
  )
}

/**
 * Lista TODAS las capas reales (con datos) de un servicio.
 * Se descartan las "Group Layer": son carpetas contenedoras sin
 * geometrías propias, y llamarles /query siempre falla con
 * "Invalid or missing input parameters".
 */
export async function listarCapasDeServicio(nombreServicio) {
  const res = await fetch(`${AMVA_BASE}/${nombreServicio}/MapServer/layers?f=json`)
  if (!res.ok) throw new Error(`No se pudo listar las capas de ${nombreServicio}: ${res.status}`)

  const data = await res.json()

  return (data.layers || [])
    .filter((l) => l.type !== 'Group Layer')
    .map((l) => ({ id: l.id, nombre: l.name, tipo: l.type }))
}

/**
 * Dado un municipio, devuelve todos los servicios candidatos junto con
 * sus capas reales (id + nombre), para que la UI arme el select con
 * opciones que SÍ existen y SÍ tienen datos consultables.
 */
export async function listarCapasDisponiblesPorMunicipio(nombreMunicipio) {
  const servicios = await buscarServiciosPorMunicipio(nombreMunicipio)
  if (servicios.length === 0) {
    throw new Error(`No se encontró ningún servicio del AMVA para "${nombreMunicipio}".`)
  }

  const resultados = await Promise.all(
    servicios.map(async (s) => ({
      servicio: s.name,
      capas: await listarCapasDeServicio(s.name)
    }))
  )

  return resultados
}

// Lee el sistema de coordenadas real de una capa en vez de asumirlo fijo (ej. 9377).
async function obtenerEpsgDeCapa(urlCapa) {
  const res = await fetch(`${urlCapa}?f=json`)
  if (!res.ok) return null
  const data = await res.json()
  return (
    data?.sourceSpatialReference?.wkid ||
    data?.extent?.spatialReference?.wkid ||
    null
  )
}

/**
 * Construye la URL final de una capa ya elegida (por el usuario en el
 * select, o por código) y su EPSG. No valida "qué tan útil" es el
 * contenido — esa decisión ahora es del usuario, no del código.
 */
export async function resolverCapaElegida(nombreServicio, idCapa) {
  const url = `${AMVA_BASE}/${nombreServicio}/MapServer/${idCapa}`
  const epsg = await obtenerEpsgDeCapa(url)
  return { url, servicio: nombreServicio, idCapa, epsg }
}

// Consulta todas las entidades de una capa ArcGIS REST y devuelve GeoJSON en WGS 84.
export async function fetchCapaArcGIS(urlBaseCapa) {
  const features = []
  let resultOffset = 0
  let primeraRespuesta = null

  while (true) {
    const parametros = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      outSR: '4326',
      f: 'geojson',
      resultOffset: String(resultOffset),
      resultRecordCount: String(TAMANO_PAGINA_CONSULTA),
    })
    const url = `${urlBaseCapa}/query?${parametros}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Error al consultar el servicio: ${res.status}`)

    const geojson = await res.json()

    if (geojson.error) {
      console.error('[AMVA] error de ArcGIS', { url, error: geojson.error })
      throw new Error(`${geojson.error.message || 'El servicio devolvió un error'} (capa: ${urlBaseCapa})`)
    }

    if (!Array.isArray(geojson.features)) {
      throw new Error(`El servicio no devolvió entidades GeoJSON válidas (capa: ${urlBaseCapa})`)
    }

    if (!primeraRespuesta) primeraRespuesta = geojson
    features.push(...geojson.features)

    if (!geojson.exceededTransferLimit) break
    if (geojson.features.length === 0) {
      throw new Error(`La consulta quedó truncada y no pudo recuperar más entidades (capa: ${urlBaseCapa})`)
    }

    resultOffset += geojson.features.length
  }

  return { ...primeraRespuesta, features }
}

/**
 * Versión simple para "Mapear una zona" (capaDesdeZona.js): busca la
 * primera capa cuyo nombre se parezca al buscado, sin heurísticas de
 * contenido ni descartes por porcentaje de categorías.
 */
export async function resolverCapaPorMunicipio(nombreMunicipio, nombreCapaBuscada = 'Equipamientos Urbanos') {
  const resultados = await listarCapasDisponiblesPorMunicipio(nombreMunicipio)
  const clave = normalizar(nombreCapaBuscada)

  for (const { servicio, capas } of resultados) {
    const capa = capas.find((c) => normalizar(c.nombre).includes(clave) || clave.includes(normalizar(c.nombre)))
    if (capa) {
      return resolverCapaElegida(servicio, capa.id)
    }
  }

  throw new Error(`No se encontró una capa parecida a "${nombreCapaBuscada}" para "${nombreMunicipio}".`)
}