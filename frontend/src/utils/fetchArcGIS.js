// utils/fetchArcGIS.js
// Descubrimiento dinámico: no hay tabla ni URL fija por municipio.
// Se consulta el catálogo real del servidor ArcGIS del AMVA y se busca
// el servicio + la capa por nombre.

const AMVA_BASE = '/amva/server/rest/services'

let catalogoCache = null

// Quita tildes, pasa a mayúsculas y normaliza espacios, para poder comparar
// "Itagüí" con "ITAGUI_POT_EB" sin fallar por acentos/mayúsculas.
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

// Busca dentro de un servicio la capa cuyo nombre coincide (parcial) con el buscado.
// Devuelve el id numérico de la capa, o null si no está en ese servicio.
export async function obtenerIdCapaPorNombre(nombreServicio, nombreCapaBuscada) {
  const res = await fetch(`${AMVA_BASE}/${nombreServicio}/MapServer/layers?f=json`)
  if (!res.ok) throw new Error(`No se pudo listar las capas de ${nombreServicio}: ${res.status}`)

  const data = await res.json()
  const clave = normalizar(nombreCapaBuscada)
  const capa = data.layers?.find((l) => normalizar(l.name).includes(clave))

  return capa ? capa.id : null
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

// Función principal: dado un municipio, resuelve servicio + capa + EPSG
// probando cada servicio candidato hasta encontrar uno que tenga la capa buscada.
export async function resolverCapaPorMunicipio(nombreMunicipio, nombreCapa = 'Equipamientos Urbanos') {
  const candidatos = await buscarServiciosPorMunicipio(nombreMunicipio)

  if (candidatos.length === 0) {
    throw new Error(`No se encontró ningún servicio del AMVA que contenga "${nombreMunicipio}" en el nombre.`)
  }

  for (const candidato of candidatos) {
    const idCapa = await obtenerIdCapaPorNombre(candidato.name, nombreCapa)
    if (idCapa !== null) {
      const url = `${AMVA_BASE}/${candidato.name}/MapServer/${idCapa}`
      const epsg = await obtenerEpsgDeCapa(url)
      return { url, servicio: candidato.name, idCapa, epsg }
    }
  }

  const nombresProbados = candidatos.map((c) => c.name).join(', ')
  throw new Error(
    `Ninguno de los servicios encontrados para "${nombreMunicipio}" (${nombresProbados}) tiene una capa llamada "${nombreCapa}".`
  )
}

// Consulta un servicio ArcGIS REST (FeatureServer/MapServer) y devuelve GeoJSON listo para usar
export async function fetchCapaArcGIS(urlBaseCapa) {
  const url = `${urlBaseCapa}/query?where=1=1&outFields=*&f=geojson`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error al consultar el servicio: ${res.status}`)

  const geojson = await res.json()

  if (geojson.error) {
    throw new Error(geojson.error.message || 'El servicio devolvió un error')
  }

  return geojson
}