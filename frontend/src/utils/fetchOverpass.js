import { categoriaDesdeTagsOSM } from './categoriasLugares'
import { toast } from 'sonner'

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
]

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let endpointPreferido = 0

async function consultarOverpass(query, { rondas = 1, timeoutMs = 10000 } = {}) {
  let ultimoError = new Error('No se pudo conectar con Overpass')

  for (let ronda = 0; ronda < rondas; ronda++) {
    for (let k = 0; k < ENDPOINTS.length; k++) {
      const idx = (endpointPreferido + k) % ENDPOINTS.length
      const controlador = new AbortController()
      const temporizador = setTimeout(() => controlador.abort(), timeoutMs)

      try {
        const res = await fetch(ENDPOINTS[idx], {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(query),
          signal: controlador.signal
        })

        if (!res.ok) {
          ultimoError = new Error(`Overpass respondió ${res.status}`)
          continue
        }

        const data = await res.json()

        if (data?.remark && /timed out|out of memory|error/i.test(data.remark)) {
          ultimoError = new Error(`Overpass: ${data.remark}`)
          continue
        }

        endpointPreferido = idx
        return data
      } catch (error) {
        ultimoError = error
      } finally {
        clearTimeout(temporizador)
      }
    }

    if (ronda < rondas - 1) await esperar(1500)
  }

  throw ultimoError
}

const TTL_MS = 10 * 60 * 1000
const cacheConsultas = new Map()

function conCacheTTL(clave, crear) {
  const guardado = cacheConsultas.get(clave)
  if (guardado && Date.now() - guardado.t < TTL_MS) return guardado.promesa

  const promesa = crear().catch((error) => {
    cacheConsultas.delete(clave)
    throw error
  })
  cacheConsultas.set(clave, { t: Date.now(), promesa })
  return promesa
}

function claveZona(tipo, centro, radioKm) {
  return `${tipo}|${centro.lat.toFixed(3)}|${centro.lng.toFixed(3)}|${radioKm}`
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

const RADIO_MAX_COMIDA_KM = 3

export async function buscarLugaresCercanos(centro, radioKm) {
  const geojson = await conCacheTTL(claveZona('lugares', centro, radioKm), async () => {
    const radioMetros = Math.round(radioKm * 1000)
    const { lat, lng } = centro

    const consultaBase = `
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
      out body center qt;
    `

    const dataBase = await consultarOverpass(consultaBase)
    let elementos = dataBase.elements || []

    if (radioKm <= RADIO_MAX_COMIDA_KM) {
      try {
        const consultaComida = `
          [out:json][timeout:25];
          (
            nwr["amenity"="restaurant"](around:${radioMetros},${lat},${lng});
            nwr["amenity"="cafe"](around:${radioMetros},${lat},${lng});
          );
          out body center qt;
        `
        const dataComida = await consultarOverpass(consultaComida, { rondas: 1 })
        elementos = elementos.concat(dataComida.elements || [])
      } catch (error) {
        console.warn('[Overpass] no se pudieron traer restaurantes/cafés', error)
        toast.info('No se pudieron cargar restaurantes y cafés (servidor saturado). El resto de lugares sí.')
      }
    } else {
      toast.info(`Restaurantes y cafés solo se cargan con radios de hasta ${RADIO_MAX_COMIDA_KM} km`)
    }

    const features = elementos
      .map(elementoAFeature)
      .filter(Boolean)
      .filter((f) => f.properties.NOMBRE) 

    return { type: 'FeatureCollection', features }
  })

  return structuredClone(geojson)
}

const cacheWebsitePorNombre = new Map()

export async function buscarWebsitePorNombre(nombre, lat, lng) {
  if (!nombre) return null

  const clave = `${nombre}|${lat.toFixed(3)}|${lng.toFixed(3)}`
  if (cacheWebsitePorNombre.has(clave)) return cacheWebsitePorNombre.get(clave)

  const nombreLimpio = nombre.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!nombreLimpio) return null

  const query = `
    [out:json][timeout:15];
    (
      node["name"~"${nombreLimpio}",i](around:500,${lat},${lng});
      way["name"~"${nombreLimpio}",i](around:500,${lat},${lng});
    );
    out tags center 3;
  `

  try {
    const data = await consultarOverpass(query, { rondas: 1, timeoutMs: 15000 })
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

const REGLAS_EQUIPAMIENTO = [
  ['amenity', 'university', 'EDUCACION_UNIVERSIDAD'],
  ['amenity', 'college', 'EDUCACION_FORMACION'],
  ['amenity', 'school', 'EDUCACION_COLEGIO'],
  ['amenity', 'kindergarten', 'EDUCACION_JARDIN'],
  ['amenity', 'hospital', 'SALUD'],
  ['amenity', 'clinic', 'SALUD'],
  ['amenity', 'doctors', 'SALUD'],
  ['amenity', 'place_of_worship', 'CULTO'],
  ['amenity', 'police', 'FUERZA PUBLICA'],
  ['amenity', 'fire_station', 'FUERZA PUBLICA'],
  ['amenity', 'library', 'CULTURA'],
  ['amenity', 'theatre', 'CULTURA'],
  ['amenity', 'arts_centre', 'CULTURA'],
  ['amenity', 'community_centre', 'BASICO COMUNITARIO'],
  ['amenity', 'townhall', 'INSTITUCIONAL'],
  ['amenity', 'courthouse', 'ADMINISTRACION DE JUSTICIA'],
  ['amenity', 'bus_station', 'TRANSPORTE'],
  ['tourism', 'museum', 'CULTURA'],
  ['railway', 'station', 'TRANSPORTE'],
  ['leisure', 'park', 'RECREACION'],
  ['leisure', 'sports_centre', 'RECREACION'],
  ['leisure', 'stadium', 'RECREACION']
]

function categoriaEquipamientoOSM(tags) {
  for (const [clave, valor, categoria] of REGLAS_EQUIPAMIENTO) {
    if (tags[clave] === valor) {
      if (categoria === 'EDUCACION_COLEGIO') {
        const nombre = String(tags.name || '').toLowerCase()
        if (/jard[ií]n|infantil|preescolar|primera infancia/.test(nombre)) return 'EDUCACION_JARDIN'
        if (/escuela/.test(nombre)) return 'EDUCACION_ESCUELA'
      }
      return categoria
    }
  }
  return null
}

function consultaEquipamientos(radioMetros, lat, lng, municipios) {
  const porClave = {}
  REGLAS_EQUIPAMIENTO.forEach(([clave, valor]) => {
    if (!porClave[clave]) porClave[clave] = []
    porClave[clave].push(valor)
  })

  const hayMunicipios = Array.isArray(municipios) && municipios.length > 0
  const filtroArea = hayMunicipios ? '(area.zona)' : ''
  const nombres = hayMunicipios
    ? municipios.map((m) => String(m).replace(/[^\p{L}\p{N}\s]/gu, '').trim()).join('|')
    : ''
  const preludio = hayMunicipios
    ? `area["boundary"="administrative"]["admin_level"="6"]["name"~"^(${nombres})$"]->.zona;\n`
    : ''

  const bloques = Object.entries(porClave)
    .map(([clave, valores]) =>
      `nwr["${clave}"~"^(${valores.join('|')})$"](around:${radioMetros},${lat},${lng})${filtroArea};`
    )
    .join('\n')

  return `[out:json][timeout:25];\n${preludio}(\n${bloques}\n);\nout body center qt;`
}

export async function buscarEquipamientosOSM(centro, radioKm, municipios = null) {
  const sufijo = Array.isArray(municipios) && municipios.length > 0 ? `:${municipios.join(',')}` : ''

  const geojson = await conCacheTTL(claveZona(`equipamientos${sufijo}`, centro, radioKm), async () => {
    const radioMetros = Math.round(radioKm * 1000)
    const query = consultaEquipamientos(radioMetros, centro.lat, centro.lng, municipios)
    const data = await consultarOverpass(query)

    const features = (data.elements || [])
      .map((el) => {
        const tags = el.tags || {}
        const lat = el.lat ?? el.center?.lat
        const lon = el.lon ?? el.center?.lon
        if (lat === undefined || lon === undefined) return null

        const categoria = categoriaEquipamientoOSM(tags)
        if (!categoria || !tags.name) return null

        return {
          type: 'Feature',
          id: `osm-${el.type}-${el.id}`,
          geometry: { type: 'Point', coordinates: [lon, lat] },
          properties: {
            NOMBRE: tags.name,
            DIRECCION: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' #') || null,
            TELEFONO: tags.phone || tags['contact:phone'] || null,
            WEBSITE: tags.website || tags['contact:website'] || null,
            categoria,
            _origen: 'OSM Overpass'
          }
        }
      })
      .filter(Boolean)

    return { type: 'FeatureCollection', features }
  })

  return structuredClone(geojson)
}