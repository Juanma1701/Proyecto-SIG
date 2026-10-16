// cargar-equipamientos-amva.mjs
//
// UBICACIÓN: vive en `frontend/scripts/`, un nivel adentro de `frontend/`, donde
// ya existen `node_modules` y el `.env` de Vite. Reutiliza @supabase/supabase-js
// y las mismas variables de entorno que usa el frontend.
//
// Script de UNA SOLA EJECUCIÓN (no forma parte del build del frontend).
//
// Uso (desde la carpeta frontend):
//   node scripts/cargar-equipamientos-amva.mjs Bello --probar
//        -> descarga y cuenta, NO escribe nada en la base de datos
//   node scripts/cargar-equipamientos-amva.mjs Bello
//        -> carga el municipio (se niega si ya tiene filas, para no duplicar)
//   node scripts/cargar-equipamientos-amva.mjs Medellín --temporal
//        -> carga con el nombre "CARGA TEMPORAL - Medellín", para revisar y luego
//           reemplazar las filas viejas con SQL
//   Sin municipios, procesa los 10 del Valle de Aburrá.

import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Resuelve la ruta al .env de frontend/ sin importar desde dónde se
// invoque `node` — siempre un nivel arriba de este archivo (frontend/.env).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(__dirname, '../.env') })

// ---- Configuración ----

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// Este script corre fuera del navegador, así que usa el dominio REAL al que apunta el proxy "/amva".
const AMVA_BASE = 'https://portalidem.metropol.gov.co/server/rest/services'

const MUNICIPIOS_AMVA = [
  'Barbosa', 'Girardota', 'Copacabana', 'Bello', 'Medellín',
  'Envigado', 'Itagüí', 'La Estrella', 'Sabaneta', 'Caldas',
]

const NOMBRE_CAPA_BUSCADA = 'Equipamientos Urbanos'

// Paginación: el servidor corta cada respuesta en su tope (por eso Medellín llegaba con 2000)
const TAMANO_PAGINA = 1000
const MAX_PAGINAS = 60

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('No se encontraron VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en frontend/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ---- Peticiones con reintentos ----

async function pedirJSON(url, intentos = 3) {
  let ultimoError
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return await res.json()
      ultimoError = new Error(`HTTP ${res.status} en ${url}`)
    } catch (error) {
      ultimoError = error
    }
    if (i < intentos - 1) await esperar(1000 * 2 ** i)
  }
  throw ultimoError
}

// ---- Descubrimiento dinámico AMVA (misma lógica que fetchArcGIS.js) ----

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
  const data = await pedirJSON(`${AMVA_BASE}?f=json`)
  catalogoCache = data.services || []
  return catalogoCache
}

async function buscarServiciosPorMunicipio(nombreMunicipio) {
  const catalogo = await obtenerCatalogoServicios()
  const clave = normalizar(nombreMunicipio)
  return catalogo.filter(
    (s) => s.type === 'MapServer' && normalizar(s.name).includes(clave)
  )
}

async function listarCapasDeServicio(nombreServicio) {
  const data = await pedirJSON(`${AMVA_BASE}/${nombreServicio}/MapServer/layers?f=json`)
  return (data.layers || [])
    .filter((l) => l.type !== 'Group Layer')
    .map((l) => ({ id: l.id, nombre: l.name, tipo: l.type }))
}

async function resolverCapasCandidatasPorMunicipio(nombreMunicipio, nombreCapaBuscada) {
  const servicios = await buscarServiciosPorMunicipio(nombreMunicipio)
  if (servicios.length === 0) {
    throw new Error(`No se encontró ningún servicio del AMVA para "${nombreMunicipio}".`)
  }
  const clave = normalizar(nombreCapaBuscada)
  const candidatas = []
  for (const s of servicios) {
    const capas = await listarCapasDeServicio(s.name)
    const capa = capas.find(
      (c) => normalizar(c.nombre).includes(clave) || clave.includes(normalizar(c.nombre))
    )
    if (capa) {
      candidatas.push({ servicio: s.name, idCapa: capa.id, url: `${AMVA_BASE}/${s.name}/MapServer/${capa.id}` })
    }
  }
  if (candidatas.length === 0) {
    throw new Error(`No se encontró una capa parecida a "${nombreCapaBuscada}" para "${nombreMunicipio}".`)
  }
  // Puede haber varios candidatos (ej. servicios duplicados como "Caldas_POT_EB" y
  // "POT_Caldas"): algunos municipios publican una versión interna sin permiso de
  // consulta pública junto a una pública que sí funciona. Se devuelven TODOS para
  // intentarlos uno por uno y quedarse con el primero que responda.
  return candidatas
}

// Cuántos equipamientos dice tener el servicio (para comparar con lo descargado)
async function contarEnServicio(urlBaseCapa) {
  try {
    const data = await pedirJSON(`${urlBaseCapa}/query?where=1=1&returnCountOnly=true&f=json`)
    return data.count ?? null
  } catch {
    return null
  }
}

// Descarga TODA la capa, de a 1000 registros por página
async function fetchCapaGeoJSON(urlBaseCapa) {
  const urlSimple = `${urlBaseCapa}/query?where=1=1&outFields=*&f=geojson`
  const todas = []
  const vistos = new Set()

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const url = `${urlSimple}&resultOffset=${todas.length}&resultRecordCount=${TAMANO_PAGINA}`
    const data = await pedirJSON(url)

    if (data.error) {
      // Si la capa no soporta paginación, se vuelve al método simple de antes
      if (pagina === 0) {
        const simple = await pedirJSON(urlSimple)
        if (simple.error) {
          throw new Error(`${simple.error.message || 'El servicio devolvió un error'} (capa: ${urlBaseCapa})`)
        }
        console.log('  (la capa no admite paginación: se descargó en una sola consulta)')
        return simple
      }
      break
    }

    const lote = data.features || []
    let nuevos = 0
    for (const f of lote) {
      const clave = f.id ?? JSON.stringify(f.properties)
      if (!vistos.has(clave)) {
        vistos.add(clave)
        todas.push(f)
        nuevos++
      }
    }

    console.log(`  página ${pagina + 1}: ${lote.length} recibidos, ${todas.length} acumulados`)

    const hayMas = data.exceededTransferLimit || data.properties?.exceededTransferLimit
    // Se detiene si no llegó nada nuevo (el servidor ignoró el offset) o si ya no hay más
    if (nuevos === 0 || (!hayMas && lote.length < TAMANO_PAGINA)) break
  }

  return { type: 'FeatureCollection', features: todas }
}

// ---- Categorización / extracción de campos (misma lógica que categoriasEquipamiento.js) ----

const PALABRAS_CLAVE = [
  ['SALUD', ['hospital', 'salud', 'clinica', 'clínica', 'puesto de salud', 'centro de salud', 'ese ', 'ips', 'eps']],
  ['EDUCACION', ['educ', 'colegio', 'escuela', 'institucion educativa', 'institución educativa', 'jardin', 'jardín', 'universidad', 'ie ']],
  ['CULTO', ['iglesia', 'templo', 'parroquia', 'culto', 'capilla', 'catedral']],
  ['RECREACION', ['parque', 'recreac', 'deportivo', 'polideportivo', 'coliseo', 'cancha', 'estadio']],
  ['CULTURA', ['cultura', 'biblioteca', 'museo', 'teatro', 'casa de la cultura']],
  ['TRANSPORTE', ['transporte', 'terminal', 'estacion', 'estación', 'paradero']],
  ['SANITARIO', ['sanitario', 'relleno', 'residuos', 'reciclaje', 'aseo']],
  ['FUERZA PUBLICA', ['policia', 'policía', 'estacion de policia', 'fuerza publica', 'ejercito', 'ejército', 'bomberos', 'cai']],
  ['ALMACENAMIENTO DEL SECTOR PRIMARIO', ['almacenamiento', 'silo', 'centro de acopio', 'sector primario']],
  ['BASICO COMUNITARIO', ['comunitario', 'salon comunal', 'salón comunal', 'accion comunal', 'acción comunal']],
  ['PREVENCION Y ATENCION DE DESASTRES', ['desastre', 'emergencia', 'gestion del riesgo', 'gestión del riesgo', 'prevencion']],
  ['SERVICIOS PUBLICOS', ['acueducto', 'alcantarillado', 'energia', 'energía', 'servicios publicos', 'servicios públicos', 'epm']],
  ['ADMINISTRACION DE JUSTICIA', ['justicia', 'juzgado', 'fiscalia', 'fiscalía', 'notaria', 'notaría', 'inspeccion', 'inspección']],
  ['INSTITUCIONAL', ['institucional', 'alcaldia', 'alcaldía', 'administrativo', 'gobernacion', 'gobernación']],
]

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return ''
  return String(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function obtenerCategoria(feature) {
  const properties = feature?.properties || {}
  const textoCompleto = normalizarTexto(
    Object.values(properties).filter((v) => typeof v === 'string' || typeof v === 'number').join(' ')
  )
  for (const [categoria, palabras] of PALABRAS_CLAVE) {
    if (palabras.some((p) => textoCompleto.includes(p))) return categoria
  }
  return 'DEFAULT'
}

// 'TEXT' al final: algunos municipios (ej. Girardota) guardan ahí el nombre
const CAMPOS_NOMBRE = ['NMG', 'NOMBRE', 'NOMBRE_EQUIP', 'NOM_EQUIP', 'NOMBRE_SITIO', 'NOMBRE_INSTITUCION', 'NOM', 'TEXT']
const CAMPOS_DIRECCION = ['DIRECCION', 'DIRECCCION', 'DIR']
const CAMPOS_TELEFONO = ['NO_TELEFONO', 'TELEFONO', 'TEL']
const CAMPOS_WEBSITE = ['WEBSITE', 'SITIO_WEB', 'URL', 'PAGINA_WEB']

function buscarCampo(properties, candidatos) {
  const claves = Object.keys(properties || {})
  for (const candidato of candidatos) {
    const clave = claves.find((k) => k.toUpperCase() === candidato)
    if (clave && properties[clave] !== null && properties[clave] !== undefined) {
      const valor = String(properties[clave]).trim()
      if (valor !== '') return valor
    }
  }
  return null
}

// ---- Carga principal ----

async function cargarMunicipio(municipio, { probar, temporal }) {
  console.log(`\n→ ${municipio}: buscando capa "${NOMBRE_CAPA_BUSCADA}"...`)
  const candidatas = await resolverCapasCandidatasPorMunicipio(municipio, NOMBRE_CAPA_BUSCADA)

  let geojson = null
  let urlUsada = null
  const erroresPorCandidata = []

  for (const candidata of candidatas) {
    try {
      geojson = await fetchCapaGeoJSON(candidata.url)
      urlUsada = candidata.url
      break
    } catch (err) {
      erroresPorCandidata.push(`${candidata.url} → ${err.message}`)
    }
  }

  if (!geojson) {
    throw new Error(
      `Ninguno de los ${candidatas.length} servicio(s) candidato(s) respondió correctamente:\n  ` +
      erroresPorCandidata.join('\n  ')
    )
  }

  if (candidatas.length > 1 && urlUsada !== candidatas[0].url) {
    console.log(`  (el primer candidato falló, se usó el respaldo: ${urlUsada})`)
  }

  const total = geojson.features?.length || 0
  const reportado = await contarEnServicio(urlUsada)
  console.log(`  Descargados: ${total} | El servicio reporta: ${reportado ?? 'desconocido'}`)
  if (reportado !== null && total < reportado) {
    console.warn(`  AVISO: faltan ${reportado - total} equipamientos respecto a lo que reporta el servicio.`)
  }
  if (total === 0) return { municipio, descargados: 0, reportado, insertados: 0 }

  if (probar) {
    console.log('  Modo --probar: no se escribió nada en la base de datos.')
    return { municipio, descargados: total, reportado, insertados: 0 }
  }

  const nombreFinal = `Equipamientos AMVA - ${municipio}`

  // Evita duplicar: si el municipio ya tiene filas, hay que usar --temporal y reemplazar con SQL
  if (!temporal) {
    const { count, error: errorConteo } = await supabase
      .from('capas')
      .select('id', { count: 'exact', head: true })
      .eq('nombre_capa', nombreFinal)
    if (errorConteo) throw new Error(`No se pudo revisar la tabla: ${errorConteo.message}`)
    if (count > 0) {
      throw new Error(
        `${municipio} ya tiene ${count} filas en la base. Para reemplazarlas sin duplicar, corre de nuevo agregando --temporal`
      )
    }
  }

  // Enriquecer cada feature ANTES de insertar, para no tener que
  // recalcular categoría/nombre/etc. después en SQL.
  for (const feature of geojson.features) {
    const categoria = obtenerCategoria(feature)
    const nombreEquip = buscarCampo(feature.properties, CAMPOS_NOMBRE)
    feature.properties = {
      ...feature.properties,
      categoria,
      // `nombre` es el campo que insertar_capa usa como columna `nombre`
      // de cada fila (coalesce con p_nombre si no viene).
      nombre: nombreEquip || `Equipamiento sin nombre (${categoria})`,
      direccion: buscarCampo(feature.properties, CAMPOS_DIRECCION),
      telefono: buscarCampo(feature.properties, CAMPOS_TELEFONO),
      website: buscarCampo(feature.properties, CAMPOS_WEBSITE),
      municipio,
    }
  }

  const nombreCapa = temporal ? `CARGA TEMPORAL - ${municipio}` : nombreFinal

  const { data, error } = await supabase.rpc('insertar_capa', {
    p_nombre: nombreCapa,
    p_geojson: geojson,
    // El endpoint del AMVA con f=geojson ya devuelve WGS84 (EPSG:4326)
    // por especificación del formato GeoJSON, así que no hace falta
    // reproyectar antes de insertar.
    p_srid_original: 4326,
    p_formato: 'geojson',
  })

  if (error) {
    console.error(`  ✗ Error insertando ${municipio}:`, error.message)
    return { municipio, descargados: total, reportado, insertados: 0, error: error.message }
  }

  console.log(`  ✓ ${data.length} filas insertadas como "${nombreCapa}".`)
  return { municipio, descargados: total, reportado, insertados: data.length }
}

async function main() {
  const args = process.argv.slice(2)
  const probar = args.includes('--probar')
  const temporal = args.includes('--temporal')
  const municipiosArg = args.filter((a) => !a.startsWith('--'))
  const municipios = municipiosArg.length > 0 ? municipiosArg : MUNICIPIOS_AMVA

  const resumen = []
  for (const municipio of municipios) {
    try {
      resumen.push(await cargarMunicipio(municipio, { probar, temporal }))
    } catch (err) {
      console.error(`  ✗ ${municipio} falló:`, err.message)
      resumen.push({ municipio, descargados: 0, insertados: 0, error: err.message })
    }
  }

  console.log('\n=== Resumen de carga ===')
  console.table(resumen)
}

main()