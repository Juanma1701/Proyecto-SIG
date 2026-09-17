// utils/fetchSuelo.js
// Reutiliza el descubrimiento dinámico de servicios que ya existe en
// fetchArcGIS.js: en vez de asumir un nombre fijo de servicio/capa, busca
// entre TODOS los servicios/capas del municipio cuál tiene que ver con
// clasificación de suelo, riesgo, protección o patrimonio.
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

/**
 * Busca, dentro de TODOS los servicios descubiertos para un municipio,
 * TODAS las capas que tengan que ver con uso/clasificación de suelo,
 * riesgo, protección o patrimonio — no solo la primera que encuentre
 * (un mismo municipio puede publicar varias capas separadas: una de
 * clasificación urbano/rural, otra de riesgo, otra de patrimonio...).
 */
export async function resolverCapasSueloPorMunicipio(nombreMunicipio) {
  const servicios = await buscarServiciosPorMunicipio(nombreMunicipio)
  const encontradas = []

  for (const servicio of servicios) {
    let capas
    try {
      capas = await listarCapasDeServicio(servicio.name)
    } catch {
      continue // este servicio en particular falló, prueba el siguiente
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

/**
 * Consulta la capa "Áreas Protegidas" del AMVA (cubre TODO el Valle de
 * Aburrá en un solo servicio, no hay que buscar por municipio), filtrada
 * espacialmente al radio de la zona para no traer todo el valle de una vez.
 */
export async function fetchAreasProtegidasEnZona(centro, radioKm) {
  const gradosPorKm = 1 / 111 // aproximación simple, suficiente para el envelope de consulta
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