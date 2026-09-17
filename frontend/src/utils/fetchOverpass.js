// utils/fetchOverpass.js
// Overpass API (OpenStreetMap): gratis, sin API key. Se usa para dos cosas:
// 1) Traer hoteles/moteles/bares/discotecas dentro de una zona (radio).
// 2) Enriquecer un equipamiento del AMVA buscando si existe un lugar con
//    ese mismo nombre cerca, para sacarle el website si OSM lo tiene.

import { categoriaDesdeTagsOSM } from './categoriasLugares'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

async function consultarOverpass(query) {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query)
  })

  if (!res.ok) throw new Error(`Overpass respondió ${res.status}`)
  return res.json()
}

function elementoAFeature(el) {
  const tags = el.tags || {}
  const lat = el.lat ?? el.center?.lat
  const lon = el.lon ?? el.center?.lon
  if (lat === undefined || lon === undefined) return null

  const categoria = categoriaDesdeTagsOSM(tags)

  return {
    type: 'Feature',
    id: `osm-${el.type}-${el.id}`,
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      NOMBRE: tags.name || null,
      DIRECCION: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' #') || null,
      TELEFONO: tags.phone || tags['contact:phone'] || null,
      WEBSITE: tags.website || tags['contact:website'] || null,
      categoria,
      _origen: 'OSM Overpass'
    }
  }
}

/**
 * Busca hoteles, moteles, bares y discotecas dentro de un radio (km)
 * alrededor de un centro. Devuelve un FeatureCollection GeoJSON.
 */
export async function buscarLugaresCercanos(centro, radioKm) {
  const radioMetros = Math.round(radioKm * 1000)
  const { lat, lng } = centro

  const query = `
    [out:json][timeout:25];
    (
      nwr["tourism"="hotel"](around:${radioMetros},${lat},${lng});
      nwr["tourism"="motel"](around:${radioMetros},${lat},${lng});
      nwr["tourism"="guest_house"](around:${radioMetros},${lat},${lng});
      nwr["amenity"="bar"](around:${radioMetros},${lat},${lng});
      nwr["amenity"="pub"](around:${radioMetros},${lat},${lng});
      nwr["amenity"="nightclub"](around:${radioMetros},${lat},${lng});
      nwr["leisure"="fitness_centre"](around:${radioMetros},${lat},${lng});
      nwr["sport"="fitness"](around:${radioMetros},${lat},${lng});
    );
    out body center;
  `

  const data = await consultarOverpass(query)
  const features = (data.elements || [])
    .map(elementoAFeature)
    .filter(Boolean)
    .filter((f) => f.properties.NOMBRE) // descarta lugares sin nombre, poco útiles en el mapa

  return { type: 'FeatureCollection', features }
}

const cacheWebsitePorNombre = new Map()

/**
 * Busca en OSM, cerca de un punto dado, un lugar con un nombre parecido,
 * para intentar recuperar su website real. Usado para "enriquecer" los
 * equipamientos del AMVA (que no traen website en sus datos).
 * Devuelve el website (string) o null si no se encontró nada.
 */
export async function buscarWebsitePorNombre(nombre, lat, lng) {
  if (!nombre) return null

  const clave = `${nombre}|${lat.toFixed(3)}|${lng.toFixed(3)}`
  if (cacheWebsitePorNombre.has(clave)) return cacheWebsitePorNombre.get(clave)

  // Radio pequeño (500m): solo nos interesa el mismo lugar, no homónimos lejanos.
  const query = `
    [out:json][timeout:15];
    (
      node["name"~"${nombre.replace(/["\\]/g, '')}",i](around:500,${lat},${lng});
      way["name"~"${nombre.replace(/["\\]/g, '')}",i](around:500,${lat},${lng});
    );
    out tags center 3;
  `

  try {
    const data = await consultarOverpass(query)
    const conWebsite = (data.elements || []).find(
      (el) => el.tags?.website || el.tags?.['contact:website']
    )
    const website = conWebsite?.tags?.website || conWebsite?.tags?.['contact:website'] || null
    cacheWebsitePorNombre.set(clave, website)
    return website
  } catch (error) {
    console.warn('[Overpass] no se pudo enriquecer', nombre, error)
    return null
  }
}