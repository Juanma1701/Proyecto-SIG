// scripts/cargarBello.mjs
//
// Descarga UNA sola vez los equipamientos de Bello desde OpenStreetMap (Overpass)
// y genera archivos SQL para guardarlos en Supabase con el nombre de capa
// 'Equipamientos AMVA - Bello'. Así la web deja de consultar Overpass en vivo
// cada vez que una zona toca Bello.
//
// No usa claves ni se conecta a Supabase: solo escribe archivos .sql que luego
// pegas tú en el SQL Editor.
//
// Uso (desde la carpeta del repo, la que contiene la carpeta sql/):
//   node scripts/cargarBello.mjs
// Requiere Node 18 o superior (revisa con: node -v)

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MUNICIPIO = 'Bello'
const CODIGO_MUN = '088'
const NOMBRE_CAPA = 'Equipamientos AMVA - Bello'
const CARPETA_SALIDA = 'sql'
const FILAS_POR_ARCHIVO = 500
// sur, oeste, norte, este: red de seguridad por si el límite administrativo trae algo de más
const BBOX = '6.25,-75.70,6.45,-75.45'
const DESCRIPCION = 'Equipamientos de OpenStreetMap para Bello (el AMVA no publica esta capa)'

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
]

// [clave OSM, valor OSM, categoría de la base de datos]
// Las categorías son las mismas que ya usa la tabla capas para el AMVA.
const REGLAS = [
  ['amenity', 'university', 'EDUCACION'],
  ['amenity', 'college', 'EDUCACION'],
  ['amenity', 'school', 'EDUCACION'],
  ['amenity', 'kindergarten', 'EDUCACION'],
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

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function construirConsulta() {
  const porClave = {}
  REGLAS.forEach(([clave, valor]) => {
    if (!porClave[clave]) porClave[clave] = []
    porClave[clave].push(valor)
  })

  const bloques = Object.entries(porClave)
    .map(([clave, valores]) => `nwr["${clave}"~"^(${valores.join('|')})$"](area.zona)(${BBOX});`)
    .join('\n')

  return `[out:json][timeout:120];
area["boundary"="administrative"]["admin_level"="6"]["name"~"^${MUNICIPIO}$"]->.zona;
(
${bloques}
);
out body center qt;`
}

// Una sola consulta, con reintentos y pausas largas para no cargar el servicio.
async function consultar(query) {
  let ultimoError = null

  for (let ronda = 1; ronda <= 3; ronda++) {
    for (const url of ENDPOINTS) {
      const controlador = new AbortController()
      const temporizador = setTimeout(() => controlador.abort(), 150000)

      try {
        console.log(`Consultando ${url} (ronda ${ronda} de 3)...`)
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'GeoAburra-carga-unica/1.0 (proyecto universitario)'
          },
          body: 'data=' + encodeURIComponent(query),
          signal: controlador.signal
        })

        if (!res.ok) {
          ultimoError = new Error(`respondió ${res.status}`)
          console.log(`  ${ultimoError.message}`)
          continue
        }

        const data = await res.json()
        if (data?.remark && /timed out|out of memory|error/i.test(data.remark)) {
          ultimoError = new Error(data.remark)
          console.log(`  aviso del servidor: ${data.remark}`)
          continue
        }

        return data
      } catch (error) {
        ultimoError = error
        console.log(`  falló: ${error.message}`)
      } finally {
        clearTimeout(temporizador)
      }
    }

    if (ronda < 3) {
      console.log('Esperando 15 segundos antes de reintentar...')
      await esperar(15000)
    }
  }

  throw ultimoError ?? new Error('No se pudo consultar Overpass')
}

function clasificar(tags) {
  for (const [clave, valor, categoria] of REGLAS) {
    if (tags[clave] === valor) return categoria
  }
  return null
}

// 'FUERZA PUBLICA' -> 'Fuerza publica' (como el campo TIPO del AMVA)
function tipoDesdeCategoria(categoria) {
  const minusculas = categoria.toLowerCase()
  return minusculas.charAt(0).toUpperCase() + minusculas.slice(1)
}

function construirFilas(data) {
  const filas = []
  const vistos = new Set()

  for (const el of data.elements || []) {
    const tags = el.tags || {}
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (!tags.name) continue // igual que la web: sin nombre no sirve en el mapa

    const categoria = clasificar(tags)
    if (!categoria) continue

    const idOsm = `${el.type}/${el.id}`
    if (vistos.has(idOsm)) continue
    vistos.add(idOsm)

    const direccion = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' #') || null

    filas.push({
      nombre: tags.name,
      lat,
      lng,
      propiedades: {
        TIPO: tipoDesdeCategoria(categoria),
        FUENTE: 'OpenStreetMap',
        NOMBRE: tags.name,
        nombre: tags.name,
        website: tags.website || tags['contact:website'] || null,
        OBJECTID: filas.length + 1,
        telefono: tags.phone || tags['contact:phone'] || null,
        MUNICIPIO: MUNICIPIO,
        categoria,
        direccion,
        municipio: MUNICIPIO,
        CODIGO_MUN,
        SIMBOLOGIA: categoria,
        OSM_ID: idOsm
      }
    })
  }

  return filas
}

const escapar = (texto) => String(texto).replace(/'/g, "''")

function sqlParte(filas, esPrimera, numero, totalPartes) {
  const valores = filas
    .map((f) => `('${escapar(f.nombre)}', ${f.lng}, ${f.lat}, '${escapar(JSON.stringify(f.propiedades))}')`)
    .join(',\n')

  const borrado = esPrimera
    ? `-- OJO: borra SOLO las filas de esta capa (sirve si repites la carga).
-- Antes de correrlo, esta consulta debe dar 0:
--   select count(*) from capas where nombre_capa = '${NOMBRE_CAPA}';
delete from capas where nombre_capa = '${NOMBRE_CAPA}';

`
    : ''

  return `-- Equipamientos de ${MUNICIPIO} desde OpenStreetMap. Parte ${numero} de ${totalPartes}.
-- Ejecutar las partes en orden. Cada parte es una transacción independiente.
begin;

${borrado}insert into capas
  (id, nombre, descripcion, srid_original, tipo_geometria, geom, archivo_original, formato_origen, creado_en, propiedades, nombre_capa, user_id)
select
  gen_random_uuid(),
  v.nombre,
  '${escapar(DESCRIPCION)}',
  t.srid_original,
  t.tipo_geometria,
  ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326),
  t.archivo_original,
  t.formato_origen,
  now(),
  v.propiedades::jsonb,
  '${NOMBRE_CAPA}',
  t.user_id
from (values
${valores}
) as v(nombre, lng, lat, propiedades)
cross join (select * from capas where nombre_capa = 'Lugares OSM - ${MUNICIPIO}' limit 1) t;

commit;

-- Verificación: debe mostrar las filas guardadas hasta esta parte.
select count(*) as filas_guardadas from capas where nombre_capa = '${NOMBRE_CAPA}';
`
}

async function principal() {
  console.log('Pidiendo equipamientos de Bello a Overpass (una sola consulta)...')
  const data = await consultar(construirConsulta())
  const filas = construirFilas(data)

  if (filas.length === 0) {
    console.error('\nNo salió ningún equipamiento. No se escribió nada.')
    console.error('Puede ser que Overpass respondiera vacío o que el límite de Bello no se encontró. Vuelve a intentarlo en unos minutos.')
    process.exit(1)
  }

  // Resumen para revisar a ojo antes de guardar
  const porCategoria = {}
  filas.forEach((f) => {
    porCategoria[f.propiedades.categoria] = (porCategoria[f.propiedades.categoria] || 0) + 1
  })
  const lats = filas.map((f) => f.lat)
  const lngs = filas.map((f) => f.lng)

  console.log(`\nEquipamientos con nombre encontrados: ${filas.length}`)
  console.table(porCategoria)
  console.log(`Latitud entre ${Math.min(...lats).toFixed(4)} y ${Math.max(...lats).toFixed(4)}`)
  console.log(`Longitud entre ${Math.min(...lngs).toFixed(4)} y ${Math.max(...lngs).toFixed(4)}`)

  mkdirSync(CARPETA_SALIDA, { recursive: true })

  const partes = []
  for (let i = 0; i < filas.length; i += FILAS_POR_ARCHIVO) {
    partes.push(filas.slice(i, i + FILAS_POR_ARCHIVO))
  }

  const archivos = partes.map((parte, i) => {
    const archivo = join(CARPETA_SALIDA, `018_equipamientos_bello_${i + 1}.sql`)
    writeFileSync(archivo, sqlParte(parte, i === 0, i + 1, partes.length), 'utf8')
    return archivo
  })

  console.log('\nArchivos escritos (córrelos en este orden en el SQL Editor de Supabase):')
  archivos.forEach((a) => console.log('  ' + a))
}

principal().catch((error) => {
  console.error('\nNo se pudo completar:', error.message)
  process.exit(1)
})
