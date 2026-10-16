// scripts/cargar-lugares-osm.mjs
// Descarga de OpenStreetMap los lugares (hoteles, bares, discotecas, gimnasios,
// restaurantes, cafés) de cada municipio del Valle de Aburrá y los guarda en la
// tabla `capas` con el nombre "Lugares OSM - <Municipio>".
//
// Uso (desde la carpeta frontend):
//   node scripts/cargar-lugares-osm.mjs Bello --probar   -> descarga y cuenta, NO escribe
//   node scripts/cargar-lugares-osm.mjs Bello            -> carga un municipio
//   node scripts/cargar-lugares-osm.mjs                  -> carga los 10 municipios
//
// Si Overpass está saturado (errores 504), vuelve a correrlo más tarde: un municipio
// que falla NO deja datos a medias, y los que ya cargaron bien se saltan solos.

import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('No se encontraron VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en frontend/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
]

const USER_AGENT = `Proyecto-SIG-Universidad/1.0 (${process.env.OVERPASS_CONTACTO || 'sin-contacto'})`

const MUNICIPIOS = [
  'Barbosa', 'Girardota', 'Copacabana', 'Bello', 'Medellín',
  'Envigado', 'Itagüí', 'La Estrella', 'Sabaneta', 'Caldas'
]

// Caja que contiene todo el Valle de Aburrá (sur, oeste, norte, este). Sirve para
// no confundir, por ejemplo, el Caldas de Antioquia con el de Boyacá.
const BBOX_VALLE = '5.9,-75.8,6.6,-75.2'

const TAMANO_LOTE = 500
const PAUSA_MS = 3000

// Se piden por grupos para que ninguna consulta sea demasiado pesada
const GRUPOS = [
  { nombre: 'alojamiento', filtros: ['["tourism"~"^(hotel|motel|guest_house)$"]'] },
  { nombre: 'bares y discotecas', filtros: ['["amenity"~"^(bar|pub|nightclub)$"]'] },
  { nombre: 'gimnasios', filtros: ['["leisure"="fitness_centre"]', '["sport"="fitness"]'] },
  { nombre: 'restaurantes', filtros: ['["amenity"="restaurant"]'] },
  { nombre: 'cafés', filtros: ['["amenity"="cafe"]'] }
]

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function categoriaDesdeTags(tags = {}) {
  if (tags.tourism === 'hotel' || tags.tourism === 'guest_house') return 'HOTEL'
  if (tags.tourism === 'motel') return 'MOTEL'
  if (tags.amenity === 'bar' || tags.amenity === 'pub') return 'BAR'
  if (tags.amenity === 'nightclub') return 'DISCOTECA'
  if (tags.leisure === 'fitness_centre' || tags.sport === 'fitness') return 'GIMNASIO'
  if (tags.amenity === 'restaurant') return 'RESTAURANTE'
  if (tags.amenity === 'cafe') return 'CAFE'
  return 'LUGAR DEFAULT'
}

function consulta(municipio, grupo) {
  const nombre = municipio.replace(/[^\p{L}\p{N}\s]/gu, '')
  const bloques = grupo.filtros.map((f) => `nwr${f}(area.zona);`).join('\n')
  return `[out:json][timeout:180];
rel["boundary"="administrative"]["admin_level"="6"]["name"="${nombre}"](${BBOX_VALLE});
map_to_area->.zona;
(
${bloques}
);
out body center qt;`
}

// Prueba los servidores en orden, con varias rondas y esperas largas.
// Si el servidor dice "demasiadas peticiones" (429), respeta el tiempo que pide.
async function pedirOverpass(query, rondas = 4) {
  let ultimoError = new Error('No se pudo conectar con Overpass')

  for (let ronda = 0; ronda < rondas; ronda++) {
    let esperaPedida = 0

    for (const endpoint of ENDPOINTS) {
      const servidor = new URL(endpoint).hostname
      const controlador = new AbortController()
      const temporizador = setTimeout(() => controlador.abort(), 200000)

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': USER_AGENT
          },
          body: 'data=' + encodeURIComponent(query),
          signal: controlador.signal
        })

        if (!res.ok) {
          console.log(`    ${servidor}: respondió ${res.status}`)
          const retryAfter = Number(res.headers.get('retry-after'))
          if (retryAfter) esperaPedida = Math.max(esperaPedida, retryAfter * 1000)
          ultimoError = new Error(`${servidor} respondió ${res.status}`)
          continue
        }

        const data = await res.json()
        if (data?.remark && /timed out|out of memory|error/i.test(data.remark)) {
          console.log(`    ${servidor}: ${data.remark}`)
          ultimoError = new Error(`${servidor}: ${data.remark}`)
          continue
        }

        return data
      } catch (error) {
        console.log(`    ${servidor}: ${error.message}`)
        ultimoError = error
      } finally {
        clearTimeout(temporizador)
      }
    }

    if (ronda < rondas - 1) {
      // 30 s, 60 s, 90 s... o lo que pida el servidor, si es más
      const espera = Math.max(30000 * (ronda + 1), esperaPedida)
      console.log(`    ningún servidor respondió bien; reintentando en ${Math.round(espera / 1000)} s...`)
      await esperar(espera)
    }
  }

  throw ultimoError
}

function elementoAFeature(el, municipio) {
  const tags = el.tags || {}
  const lat = el.lat ?? el.center?.lat
  const lon = el.lon ?? el.center?.lon
  if (lat === undefined || lon === undefined || !tags.name) return null

  return {
    type: 'Feature',
    id: `osm-${el.type}-${el.id}`,
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      NOMBRE: tags.name,
      nombre: tags.name, // insertar_capa usa este campo como columna `nombre`
      DIRECCION: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' #') || null,
      TELEFONO: tags.phone || tags['contact:phone'] || null,
      WEBSITE: tags.website || tags['contact:website'] || null,
      categoria: categoriaDesdeTags(tags),
      municipio,
      _origen: 'OSM Overpass'
    }
  }
}

async function cargarMunicipio(municipio, { probar }) {
  const nombreCapa = `Lugares OSM - ${municipio}`
  console.log(`\n→ ${municipio}`)

  if (!probar) {
    const { count, error } = await supabase
      .from('capas')
      .select('id', { count: 'exact', head: true })
      .eq('nombre_capa', nombreCapa)
    if (error) throw new Error(`No se pudo revisar la tabla: ${error.message}`)
    if (count > 0) {
      console.log(`  ya tiene ${count} filas, se salta. (Para rehacerlo: DELETE FROM capas WHERE nombre_capa = '${nombreCapa}' AND user_id IS NULL;)`)
      return { municipio, descargados: count, insertados: 0, nota: 'ya cargado' }
    }
  }

  // Se descarga TODO primero; si algún grupo falla, no se escribe nada de este municipio
  const vistos = new Set()
  const features = []

  for (const grupo of GRUPOS) {
    console.log(`  descargando ${grupo.nombre}...`)
    const data = await pedirOverpass(consulta(municipio, grupo))
    let nuevos = 0
    for (const el of data.elements || []) {
      const clave = `${el.type}-${el.id}`
      if (vistos.has(clave)) continue
      const feature = elementoAFeature(el, municipio)
      if (!feature) continue
      vistos.add(clave)
      features.push(feature)
      nuevos++
    }
    console.log(`    ${nuevos} lugares con nombre`)
    await esperar(PAUSA_MS)
  }

  console.log(`  Total para ${municipio}: ${features.length}`)
  if (features.length === 0) {
    console.warn('  AVISO: 0 lugares. Puede que OSM no tenga bien etiquetado el límite de este municipio.')
    return { municipio, descargados: 0, insertados: 0 }
  }

  if (probar) {
    console.log('  Modo --probar: no se escribió nada en la base de datos.')
    return { municipio, descargados: features.length, insertados: 0 }
  }

  let insertados = 0
  for (let i = 0; i < features.length; i += TAMANO_LOTE) {
    const lote = features.slice(i, i + TAMANO_LOTE)
    const { data, error } = await supabase.rpc('insertar_capa', {
      p_nombre: nombreCapa,
      p_geojson: { type: 'FeatureCollection', features: lote },
      p_srid_original: 4326,
      p_formato: 'geojson'
    })
    if (error) {
      console.error(`  ✗ Error insertando. Para limpiar lo que alcanzó a entrar, corre en Supabase:`)
      console.error(`    DELETE FROM capas WHERE nombre_capa = '${nombreCapa}' AND user_id IS NULL;`)
      throw new Error(error.message)
    }
    insertados += data.length
    console.log(`  insertados ${insertados} / ${features.length}`)
  }

  return { municipio, descargados: features.length, insertados }
}

async function main() {
  const args = process.argv.slice(2)
  const probar = args.includes('--probar')
  const pedidos = args.filter((a) => !a.startsWith('--'))
  const municipios = pedidos.length > 0 ? pedidos : MUNICIPIOS

  const resumen = []
  for (const municipio of municipios) {
    try {
      resumen.push(await cargarMunicipio(municipio, { probar }))
    } catch (error) {
      console.error(`  ✗ ${municipio} falló:`, error.message)
      resumen.push({ municipio, descargados: 0, insertados: 0, error: error.message })
    }
  }

  console.log('\n=== Resumen ===')
  console.table(resumen)
}

main()