import { buscarServiciosPorMunicipio, listarCapasDeServicio, fetchCapaArcGIS } from './fetchArcGIS'

const AMVA_BASE = '/amva/server/rest/services'
const SIM_BASE = '/sim/arcgis/rest/services'

const PALABRAS_CLAVE_SERVICIO_SUELO = ['pot', 'suelo', 'riesgo', 'proteccion', 'patrimonio', 'ecologica']

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

export async function resolverCapasSueloPorMunicipio(nombreMunicipio) {
  const servicios = await buscarServiciosPorMunicipio(nombreMunicipio)
  const encontradas = []

  for (const servicio of servicios) {
    let capas
    try {
      capas = await listarCapasDeServicio(servicio.name)
    } catch {
      continue 
    }

    capas
      .filter((c) => PALABRAS_CLAVE_SERVICIO_SUELO.some((p) => normalizar(c.nombre).includes(normalizar(p))))
      .forEach((capaSuelo) => {
        encontradas.push({
          url: `${AMVA_BASE}/${servicio.name}/MapServer/${capaSuelo.id}`,
          servicio: servicio.name,
          idCapa: capaSuelo.id,
          nombreCapa: capaSuelo.nombre
        })
      })
  }

  return encontradas
}

export async function fetchAreasProtegidasEnZona(centro, radioKm) {
  const gradosPorKm = 1 / 111 
  const delta = radioKm * gradosPorKm

  const envelope = {
    xmin: centro.lng - delta,
    ymin: centro.lat - delta,
    xmax: centro.lng + delta,
    ymax: centro.lat + delta,
    spatialReference: { wkid: 4326 }
  }

  const url = `${SIM_BASE}/Areas_Protegidas/Areas_Protegidas/MapServer/0/query`
    + `?where=1=1&outFields=*&f=geojson`
    + `&geometry=${encodeURIComponent(JSON.stringify(envelope))}`
    + `&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Áreas Protegidas respondió ${res.status}`)

  const geojson = await res.json()
  if (geojson.error) throw new Error(geojson.error.message || 'Error consultando Áreas Protegidas')

  return geojson
}

export { fetchCapaArcGIS }