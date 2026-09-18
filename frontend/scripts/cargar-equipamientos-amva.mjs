// cargar-equipamientos-amva.mjs
//
// UBICACIÓN: se asume que este archivo vive en `frontend/scripts/`, es
// decir, un nivel adentro de la carpeta `frontend/` donde ya existen
// `node_modules` y el `.env` de Vite. Así reutiliza lo que ya está
// instalado (@supabase/supabase-js) y las mismas variables de entorno
// que usa el frontend — sin crear un package.json ni un .env aparte.
//
// Script de UNA SOLA EJECUCIÓN (no forma parte del build del frontend,
// Vite nunca lo toca porque no está en src/).
//
// Uso:
//   1. cd frontend
//   2. Si "@supabase/supabase-js" no está en tu package.json, instálalo:
//        npm install @supabase/supabase-js
//      Si "dotenv" no está, instálalo también (dependencia mínima):
//        npm install --save-dev dotenv
//   3. node scripts/cargar-equipamientos-amva.mjs
//      (lee automáticamente el .env que ya tienes en frontend/)

import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Resuelve la ruta al .env de frontend/ sin importar desde dónde se
// invoque `node` — siempre un nivel arriba de este archivo (frontend/.env).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(__dirname, '../.env') })

// ---- Configuración ----

// Mismas variables que ya usa el frontend (prefijo VITE_ de Vite).
// Se aceptan también sin el prefijo, por si algún día corres esto con
// variables exportadas manualmente en la terminal en vez del .env.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// OJO: en el frontend esto se llama vía el proxy "/amva" (vite.config.js /
// vercel.json), pero este script corre fuera del navegador y necesita el
// dominio REAL al que apunta ese proxy. Confirmar si no es este.
const AMVA_BASE = 'https://portalidem.metropol.gov.co/server/rest/services'

const MUNICIPIOS_AMVA = [
  'Barbosa', 'Girardota', 'Copacabana', 'Bello', 'Medellín',
  'Envigado', 'Itagüí', 'La Estrella', 'Sabaneta', 'Caldas',
]

const NOMBRE_CAPA_BUSCADA = 'Equipamientos Urbanos'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('No se encontraron VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en frontend/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
  const res = await fetch(`${AMVA_BASE}?f=json`)
  if (!res.ok) throw new Error(`No se pudo listar los servicios del AMVA: ${res.status}`)
  const data = await res.json()
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
  const res = await fetch(`${AMVA_BASE}/${nombreServicio}/MapServer/layers?f=json`)
  if (!res.ok) throw new Error(`No se pudo listar las capas de ${nombreServicio}: ${res.status}`)
  const data = await res.json()
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
  // Puede haber varios candidatos (ej. servicios duplicados como
  // "Caldas_POT_EB" y "POT_Caldas" con la misma capa) — algunos municipios
  // publican una versión interna sin permiso de consulta pública junto a
  // una versión pública que sí funciona. Se devuelven TODOS, en el orden
  // en que el catálogo los reporta, para que el llamador pueda intentarlos
  // uno por uno y quedarse con el primero que realmente responda.
  return candidatas
}

async function fetchCapaGeoJSON(urlBaseCapa) {
  const url = `${urlBaseCapa}/query?where=1=1&outFields=*&f=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error al consultar el servicio: ${res.status}`)
  const geojson = await res.json()
  if (geojson.error) {
    throw new Error(`${geojson.error.message || 'El servicio devolvió un error'} (capa: ${urlBaseCapa})`)
  }
  return geojson
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

const CAMPOS_NOMBRE = ['NMG', 'NOMBRE', 'NOMBRE_EQUIP', 'NOM_EQUIP', 'NOMBRE_SITIO', 'NOMBRE_INSTITUCION', 'NOM']
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

async function cargarMunicipio(municipio) {
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
  console.log(`  ${total} equipamientos encontrados.`)
  if (total === 0) return { municipio, insertados: 0 }

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

  const { data, error } = await supabase.rpc('insertar_capa', {
    p_nombre: `Equipamientos AMVA - ${municipio}`,
    p_geojson: geojson,
    // El endpoint del AMVA con f=geojson ya devuelve WGS84 (EPSG:4326)
    // por especificación del formato GeoJSON, así que no hace falta
    // reproyectar antes de insertar.
    p_srid_original: 4326,
    p_formato: 'geojson',
  })

  if (error) {
    console.error(`  ✗ Error insertando ${municipio}:`, error.message)
    return { municipio, insertados: 0, error: error.message }
  }

  console.log(`  ✓ ${data.length} filas insertadas.`)
  return { municipio, insertados: data.length }
}

async function main() {
  // Si se pasan municipios como argumentos, solo se procesan esos
  // (útil para reintentar los que fallaron sin duplicar los que ya
  // se cargaron bien). Sin argumentos, procesa los 10 de siempre.
  const municipiosArg = process.argv.slice(2)
  const municipios = municipiosArg.length > 0 ? municipiosArg : MUNICIPIOS_AMVA

  const resumen = []
  for (const municipio of municipios) {
    try {
      resumen.push(await cargarMunicipio(municipio))
    } catch (err) {
      console.error(`  ✗ ${municipio} falló por completo:`, err.message)
      resumen.push({ municipio, insertados: 0, error: err.message })
    }
  }

  console.log('\n=== Resumen de carga ===')
  console.table(resumen)
}

main()
