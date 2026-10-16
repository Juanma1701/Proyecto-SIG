// scripts/cargar-suelo-pot.mjs   (VERSIÓN 8)
//
// UBICACIÓN: frontend/scripts/cargar-suelo-pot.mjs (reemplaza a la versión 7).
//
// CAMBIOS DE LA VERSIÓN 8 (Medellín se quedó 7+ minutos en UN solo polígono):
//   - Las geometrías con más de 20.000 vértices se simplifican PRIMERO
//     (ST_Simplify, ~22 m) y se reparan DESPUÉS; antes se reparaban primero,
//     que es lo lento en geometrías gigantes. Las normales no cambian.
//   - Cada polígono se guarda dentro de un savepoint con límite de 3 minutos:
//     si uno falla o se atasca, se descarta solo ese y se avisa con
//     "✗ polígono omitido". Si hubo omitidos y no usaste --permitir-parcial,
//     NO se guarda nada (todo se revierte); con --permitir-parcial se guarda
//     el resto y se lista lo que quedó fuera.
//   - El límite de tiempo por sentencia baja de 15 a 3 minutos.
//
// CAMBIOS DE LA VERSIÓN 7 (según la carga de Medellín):
//   - "Suelo de Proteccion" de Medellín (39 polígonos rurales enormes) hacía que
//     Postgres cancelara el INSERT con "canceling statement due to statement
//     timeout" (límite de tiempo por sentencia de la base). La transacción se
//     revirtió bien y no se dañó nada. Ahora el script sube ese límite a 15
//     minutos SOLO para su propia conexión (no cambia nada en tu proyecto).
//   - Si un polígono tarda más de 5 s en guardarse, el script lo avisa con su
//     número de registro y el tiempo, para saber cuál es el pesado.
// Script de UNA SOLA EJECUCIÓN: no forma parte del build del frontend.
//
// Descarga las capas de suelo del POT (clasificación urbano/rural, protección,
// riesgo, patrimonio) de cada municipio en el AMVA, las reclasifica a 5
// categorías, las repara/simplifica con PostGIS y las guarda en `suelo_pot`.
//
// CAMBIOS DE LA VERSIÓN 6 (según las pruebas de "Suelos de Proteccion", Sabaneta):
//   - Esa capa tiene 8 registros y el registro OBJECTID 5 hace que el servidor
//     del AMVA responda 504 siempre (aunque se pida simplificado). Antes eso
//     tumbaba la capa completa. Ahora, si la descarga normal falla, el script
//     baja la capa REGISTRO POR REGISTRO y omite solo los que fallen.
//   - Si se omite algún registro, el script se detiene salvo que uses
//     --permitir-parcial (así nunca guardas una capa incompleta sin saberlo).
//     El aviso "✗ registro N omitido" queda en pantalla.
//   - Se limpió una línea confusa al calcular las capas faltantes.
//
// CAMBIOS DE LA VERSIÓN 5 (según la primera carga real, Sabaneta):
//   - Si el servidor del AMVA falla al descargar UNA capa, por defecto NO SE
//     ESCRIBE NADA de ese municipio (con --reemplazar, lo que ya estaba
//     cargado queda intacto).
//   - Reintentos más pacientes al descargar (5 intentos, esperando 1, 2, 4 y 8 s).
//   - --permitir-parcial: carga solo lo que sí se pudo descargar.
//
// CAMBIO DE LA VERSIÓN 4:
//   - En "Clasificacion del Suelo" la clase puede ser PROTECCIÓN, no solo
//     urbano/rural; esos polígonos se guardan como 'proteccion'.
//
// CAMBIOS DE LA VERSIÓN 3:
//   - La capa "Clasificacion del Suelo" se clasifica leyendo PRIMERO el campo
//     de clase (SIMBOLOGIA, CLASE_SUELO, CLASIFICACION, CLASE). El texto
//     completo solo se usa como respaldo.
//
// CAMBIOS DE LA VERSIÓN 2:
//   - "Suelos de Protecccion" (Barbosa, con 3 c) se reconoce como protección.
//   - Las capas "Uso del Suelo / Usos Suelo" se OMITEN (decenas de miles de
//     polígonos de detalle de usos).
//   - Si dos servicios publican la misma capa, se intenta primero el que NO
//     termina en _EB.
//
// REQUISITOS (una sola vez):
//   1) npm install pg --save-dev        (desde la carpeta frontend)
//   2) En frontend/.env agregar  SUPABASE_DB_URL=...   SIN el prefijo VITE_
//      (si lo llevara, Vite la metería en el código publicado). Solo es
//      necesaria si NO usas --probar.
//
// USO (desde la carpeta frontend):
//   node scripts/cargar-suelo-pot.mjs --probar
//   node scripts/cargar-suelo-pot.mjs --probar Medellín Itagüí
//        -> NO escribe nada ni necesita SUPABASE_DB_URL.
//   node scripts/cargar-suelo-pot.mjs Sabaneta
//        -> carga el municipio (se niega si ya tiene filas, para no duplicar)
//   node scripts/cargar-suelo-pot.mjs Sabaneta --reemplazar
//        -> BORRA las filas de Sabaneta en suelo_pot y las vuelve a cargar,
//           todo dentro de una transacción. Solo toca suelo_pot, nunca `capas`.
//   node scripts/cargar-suelo-pot.mjs Sabaneta --reemplazar --permitir-parcial
//        -> si alguna capa o registro no baja, guarda igual lo que sí bajó
//   Sin nombres de municipio procesa los 10 del Valle de Aburrá.

import pg from 'pg'
import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const { Client } = pg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(__dirname, '../.env') })

// ---- Configuración ----

const DB_URL = process.env.SUPABASE_DB_URL

// Dominio REAL al que apunta el proxy "/amva" (este script corre fuera del navegador)
const AMVA_BASE = 'https://portalidem.metropol.gov.co/server/rest/services'

const MUNICIPIOS_AMVA = [
  'Barbosa', 'Girardota', 'Copacabana', 'Bello', 'Medellín',
  'Envigado', 'Itagüí', 'La Estrella', 'Sabaneta', 'Caldas',
]

// Mismas palabras clave que usa src/utils/fetchSuelo.js para elegir capas
const PALABRAS_CLAVE_CAPA = ['pot', 'suelo', 'riesgo', 'proteccion', 'patrimonio', 'ecologica']

// Páginas pequeñas: los polígonos pesan mucho más que los puntos
const TAMANO_PAGINA = 500
const MAX_PAGINAS = 200

// Simplificación al guardar, en grados (0.00005° ≈ 5.5 m). Criterio: el POT se
// dibuja a escalas ~1:5.000–1:25.000; a 1:25.000 la precisión gráfica (0.2 mm)
// equivale a 5 m, así que simplificar a ~5 m no pierde información útil y
// ahorra espacio (el plan gratuito de Supabase tiene 500 MB).
const SIMPLIFICAR_GRADOS = 0.00005

// DECISIÓN A REVISAR: el "suelo de expansión urbana" no es urbano ni rural
// todavía. Aquí se cuenta como 'urbano' (es suelo destinado a urbanizarse).
// Cámbialo a 'rural' si prefieres. El valor original queda en `atributos`.
const EXPANSION_COMO = 'urbano'

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

// ---- Descubrimiento de servicios y capas (misma lógica que fetchArcGIS.js) ----

let catalogoCache = null

function claveServicio(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_')
}

function sinTildes(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

async function obtenerCatalogoServicios() {
  if (catalogoCache) return catalogoCache
  const data = await pedirJSON(`${AMVA_BASE}?f=json`)
  catalogoCache = data.services || []
  return catalogoCache
}

async function buscarServiciosPorMunicipio(nombreMunicipio) {
  const catalogo = await obtenerCatalogoServicios()
  const clave = claveServicio(nombreMunicipio)
  return catalogo.filter((s) => s.type === 'MapServer' && claveServicio(s.name).includes(clave))
}

async function listarCapasDeServicio(nombreServicio) {
  const data = await pedirJSON(`${AMVA_BASE}/${nombreServicio}/MapServer/layers?f=json`)
  return (data.layers || [])
    .filter((l) => l.type !== 'Group Layer')
    .map((l) => ({ id: l.id, nombre: l.name }))
}

async function contarEnServicio(urlCapa) {
  try {
    const data = await pedirJSON(`${urlCapa}/query?where=1=1&returnCountOnly=true&f=json`, 2)
    return data.count ?? null
  } catch {
    return null
  }
}

// ---- Reclasificación a 5 categorías ----
// Devuelve: 'riesgo' | 'patrimonio' | 'proteccion' | 'rural' | 'urbano'
//           | 'por_atributo' (capa genérica "Clasificacion del Suelo": cada
//             polígono se clasifica leyendo sus atributos)
//           | null (se OMITE)

function clasificarCapa(nombreCapa) {
  const t = sinTildes(nombreCapa)
  if (t.includes('riesgo')) return 'riesgo'
  if (t.includes('patrimonio')) return 'patrimonio'
  if (t.includes('protec') || t.includes('ecologica') || t.includes('protegid')) return 'proteccion'
  if (/^usos?\b/.test(t)) return null // "Uso del Suelo", "Uso de Suelo Rural", "Usos Suelo Metropolitano"
  if (t.includes('suburban') || t.includes('rural')) return 'rural' // el suburbano es una subclase del rural
  if (t.includes('urban')) return 'urbano'
  if (t.includes('clasificacion')) return 'por_atributo'
  return null // "Valores Suelo Metropolitano", "Comunas", "Tratamientos", etc.
}

// Campos que dicen la clase del suelo, en orden de preferencia. Se leen
// primero porque son limpios (valores como RURAL, URBANO, EXPANSIÓN, SUBURBANO);
// el resto de campos (NOMBRE, OBS, DENSIDAD...) puede mencionar "urbano" o
// "rural" sin que ese sea la clase del polígono.
const CAMPOS_CLASE_PRINCIPAL = ['SIMBOLOGIA', 'CLASE_SUELO', 'CLASIFICACION', 'CLASE']

function categoriaDesdeTexto(textoCrudo) {
  const texto = sinTildes(textoCrudo)
  if (texto.includes('suburban')) return 'rural' // el suburbano es una subclase del rural
  if (texto.includes('expansion')) return EXPANSION_COMO
  if (/\brural/.test(texto)) return 'rural'
  if (/\burban/.test(texto)) return 'urbano'
  if (texto.includes('proteccion')) return 'proteccion' // clase "PROTECCIÓN" (solo si no dijo urbano/rural)
  return null
}

// Clasifica UN polígono de la capa "Clasificacion del Suelo".
// Devuelve { categoria, via }: via = 'campo clase' | 'texto' | null
function clasificarPorAtributos(props) {
  for (const campo of CAMPOS_CLASE_PRINCIPAL) {
    const valor = buscarCampo(props, [campo])
    if (!valor) continue
    const categoria = categoriaDesdeTexto(valor)
    if (categoria) return { categoria, via: 'campo clase' }
  }

  // Respaldo: el texto de todos los campos
  const texto = Object.entries(props || {})
    .filter(([clave, valor]) => typeof valor === 'string' && !/^(objectid|shape|globalid)/i.test(clave))
    .map(([, valor]) => valor)
    .join(' | ')
  const categoria = categoriaDesdeTexto(texto)
  return { categoria, via: categoria ? 'texto' : null }
}

const CAMPOS_NOMBRE = ['NOMBRE', 'NOM', 'CLASIFICACION', 'CLASE', 'USO', 'TIPO', 'CATEGORIA', 'DESCRIPCION', 'TEXT']

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

const esEB = (capa) => /_EB$/i.test(capa.servicio)
const claveCapa = (capa) => `${capa.categoria}|${claveServicio(capa.nombreCapa)}`

async function descubrirCapas(municipio) {
  const servicios = await buscarServiciosPorMunicipio(municipio)
  if (servicios.length === 0) {
    throw new Error(`No se encontró ningún servicio del AMVA para "${municipio}".`)
  }

  const encontradas = []
  for (const servicio of servicios) {
    let capas
    try {
      capas = await listarCapasDeServicio(servicio.name)
    } catch (error) {
      console.warn(`  (no se pudo listar ${servicio.name}: ${error.message})`)
      continue
    }
    for (const capa of capas) {
      const texto = claveServicio(capa.nombre)
      if (!PALABRAS_CLAVE_CAPA.some((p) => texto.includes(p.toUpperCase()))) continue
      encontradas.push({
        servicio: servicio.name,
        idCapa: capa.id,
        nombreCapa: capa.nombre,
        url: `${AMVA_BASE}/${servicio.name}/MapServer/${capa.id}`,
        categoria: clasificarCapa(capa.nombre),
      })
    }
  }

  // Los servicios que NO terminan en _EB primero (array.sort es estable)
  return encontradas.sort((a, b) => Number(esEB(a)) - Number(esEB(b)))
}

// ---- Descarga ----

// Descarga normal (paginada). Si falla, descargarCapa() prueba registro por registro.
async function descargarCapaPorPaginas(urlCapa) {
  const urlSimple = `${urlCapa}/query?where=1=1&outFields=*&f=geojson`
  const todas = []
  const vistos = new Set()

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const url = `${urlSimple}&resultOffset=${todas.length}&resultRecordCount=${TAMANO_PAGINA}`
    const data = await pedirJSON(url, 5)

    if (data.error) {
      if (pagina === 0) {
        const simple = await pedirJSON(urlSimple, 5)
        if (simple.error) {
          throw new Error(`${simple.error.message || 'El servicio devolvió un error'} (capa: ${urlCapa})`)
        }
        console.log('    (la capa no admite paginación: una sola consulta)')
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
    console.log(`    página ${pagina + 1}: ${lote.length} recibidos, ${todas.length} acumulados`)

    const hayMas = data.exceededTransferLimit || data.properties?.exceededTransferLimit
    if (nuevos === 0 || (!hayMas && lote.length < TAMANO_PAGINA)) break
  }

  return { type: 'FeatureCollection', features: todas }
}

// Si la descarga normal falla (p. ej. un registro con geometría que cuelga al
// servidor), se baja la capa registro por registro y se omiten los que fallen.
async function descargarCapa(urlCapa, permitirParcial = false) {
  try {
    return await descargarCapaPorPaginas(urlCapa)
  } catch (error) {
    console.warn(`    (la descarga normal falló: ${String(error.message).slice(0, 100)})`)
    console.warn('    → probando registro por registro (puede tardar uno o dos minutos)...')
    return await descargarPorIds(urlCapa, permitirParcial)
  }
}

async function descargarPorIds(urlCapa, permitirParcial) {
  const info = await pedirJSON(`${urlCapa}/query?where=1=1&returnIdsOnly=true&f=json`, 3)
  const campo = info.objectIdFieldName || 'OBJECTID'
  const ids = info.objectIds || []
  if (ids.length === 0) throw new Error('la capa no devolvió identificadores de registros')

  const features = []
  const omitidos = []
  for (const id of ids) {
    try {
      const data = await pedirJSON(`${urlCapa}/query?where=${campo}=${id}&outFields=*&f=geojson&outSR=4326`, 3)
      if (data.error) throw new Error(data.error.message || 'error del servicio')
      features.push(...(data.features || []))
    } catch (error) {
      omitidos.push(id)
      console.warn(`    ✗ registro ${id} omitido: ${String(error.message).slice(0, 80)}`)
    }
  }
  console.log(`    descarga registro por registro: bajaron ${features.length} de ${ids.length}`)

  if (features.length === 0) throw new Error('no bajó ningún registro')
  if (omitidos.length > 0 && !permitirParcial) {
    throw new Error(`no bajaron los registros ${omitidos.join(', ')} (usa --permitir-parcial para cargar sin ellos)`)
  }
  return { type: 'FeatureCollection', features }
}

// ---- Muestra de atributos (solo para --probar) ----

async function mostrarMuestraClasificacion(capa) {
  try {
    const url = `${capa.url}/query?where=1=1&outFields=*&returnGeometry=false&resultRecordCount=1000&f=geojson`
    const data = await pedirJSON(url, 2)
    if (data.error) throw new Error(data.error.message || 'error del servicio')
    const features = data.features || []

    const distribucion = {}
    const valoresPorCampo = {}
    for (const f of features) {
      const { categoria: cat, via } = clasificarPorAtributos(f.properties)
      const categoria = cat ?? 'SIN_CLASIFICAR'
      distribucion[categoria] = (distribucion[categoria] || 0) + 1
      if (via === 'texto') distribucion.por_texto_de_respaldo = (distribucion.por_texto_de_respaldo || 0) + 1
      for (const [campo, valor] of Object.entries(f.properties || {})) {
        if (typeof valor !== 'string' || /^(objectid|shape|globalid)/i.test(campo)) continue
        if (!valoresPorCampo[campo]) valoresPorCampo[campo] = new Set()
        valoresPorCampo[campo].add(valor.length > 40 ? valor.slice(0, 40) + '…' : valor)
      }
    }

    console.log(`  Muestra de "${capa.nombreCapa}" (${capa.servicio}): ${features.length} polígonos`)
    console.log('    Clasificación automática por atributos:', distribucion)
    const campos = Object.entries(valoresPorCampo).filter(([, v]) => v.size > 0 && v.size <= 12).slice(0, 8)
    for (const [campo, valores] of campos) {
      console.log(`    campo ${campo}: ${[...valores].join(' | ')}`)
    }
    if (campos.length === 0) console.log('    (ningún campo de texto con pocos valores distintos)')
  } catch (error) {
    console.log(`  (no se pudo leer la muestra de "${capa.nombreCapa}": ${error.message})`)
  }
}

// ---- Escritura en PostGIS ----
// ST_MakeValid repara geometrías con errores; ST_SimplifyPreserveTopology las
// aligera sin crear huecos ni cruces; ST_CollectionExtract(...,3) deja solo
// polígonos; ST_Multi unifica el tipo a MultiPolygon (lo que pide la tabla).

// Geometrías normales: igual que antes (MakeValid + SimplifyPreserveTopology).
// Geometrías MUY grandes (más de UMBRAL_VERTICES_GRANDE vértices, p. ej. la
// protección rural de Medellín): primero se simplifican con ST_Simplify
// (Douglas-Peucker, mucho más rápido) con una tolerancia 4 veces mayor
// (~22 m), y DESPUÉS se reparan con MakeValid, cuando ya tienen pocos vértices.
// Reparar primero una geometría gigante fue lo que dejó la carga atascada.
const UMBRAL_VERTICES_GRANDE = 20000

const SQL_INSERTAR = `
  insert into public.suelo_pot (municipio, categoria, capa_origen, nombre, atributos, geom)
  select $1::text, $2::text, $3::text, $4::text, $5::jsonb, t.g
  from (
    select ST_Multi(
             ST_CollectionExtract(
               ST_MakeValid(
                 case when ST_NPoints(e.g0) > ${UMBRAL_VERTICES_GRANDE}
                      then ST_Simplify(e.g0, $7::float8 * 4)
                      else ST_SimplifyPreserveTopology(ST_MakeValid(e.g0), $7::float8)
                 end),
               3)) as g
    from (select ST_SetSRID(ST_GeomFromGeoJSON($6::text), 4326) as g0) e
  ) t
  where t.g is not null and not ST_IsEmpty(t.g)`

async function cargarMunicipio(municipio, { probar, reemplazar, permitirParcial, client }) {
  console.log(`\n→ ${municipio}: buscando capas de suelo...`)
  const capas = await descubrirCapas(municipio)

  if (capas.length === 0) {
    console.log('  No hay capas de suelo/riesgo/protección/patrimonio en el AMVA para este municipio.')
    return { municipio, capasEncontradas: 0, capasACargar: 0, poligonosEstimados: 0, filasInsertadas: 0 }
  }

  const aCargar = capas.filter((c) => c.categoria)

  if (probar) {
    const tabla = []
    const vistas = new Set() // capas que ya responden (para marcar duplicadas)
    let estimados = 0
    for (const capa of capas) {
      const registros = await contarEnServicio(capa.url)
      let nota = ''
      if (!capa.categoria) nota = 'omitida'
      else if (vistas.has(claveCapa(capa))) nota = 'duplicada (se omite)'
      else if (registros === null) nota = 'no responde (se intenta otra copia)'
      else {
        vistas.add(claveCapa(capa))
        estimados += registros
      }
      tabla.push({
        servicio: capa.servicio,
        id: capa.idCapa,
        capa: capa.nombreCapa,
        categoria: capa.categoria ?? '(omitida)',
        registros,
        nota,
      })
    }
    console.table(tabla)

    // Muestra de la capa genérica de clasificación (la primera que responda)
    const generica = capas.find((c) => c.categoria === 'por_atributo')
    if (generica) await mostrarMuestraClasificacion(generica)

    console.log(`  Polígonos que se cargarían (aprox.): ${estimados}`)
    console.log('  Modo --probar: no se descargó ni se escribió nada.')
    return { municipio, capasEncontradas: capas.length, capasACargar: aCargar.length, poligonosEstimados: estimados, filasInsertadas: 0 }
  }

  // Evita duplicar: si el municipio ya tiene filas, hay que pedir --reemplazar
  const { rows } = await client.query('select count(*)::int as n from public.suelo_pot where municipio = $1', [municipio])
  const filasPrevias = rows[0].n
  if (filasPrevias > 0 && !reemplazar) {
    throw new Error(
      `${municipio} ya tiene ${filasPrevias} filas en suelo_pot. Para reemplazarlas (solo las de ese municipio en suelo_pot) corre de nuevo agregando --reemplazar`
    )
  }

  // 1) Descargar todo ANTES de tocar la base: si la red falla, no se pierde nada
  const descargadas = []
  const yaCargadas = new Set()
  for (const capa of aCargar) {
    // Algunos municipios publican la misma capa en dos servicios (uno interno sin permiso)
    const clave = claveCapa(capa)
    if (yaCargadas.has(clave)) {
      console.log(`  (omitida "${capa.nombreCapa}" de ${capa.servicio}: ya se descargó otra igual)`)
      continue
    }
    console.log(`  Descargando "${capa.nombreCapa}" (${capa.servicio}) → ${capa.categoria === 'por_atributo' ? 'según atributos' : capa.categoria}`)
    try {
      const geojson = await descargarCapa(capa.url, permitirParcial)
      descargadas.push({ capa, features: geojson.features || [] })
      yaCargadas.add(clave)
    } catch (error) {
      console.warn(`  ✗ no se pudo descargar "${capa.nombreCapa}" de ${capa.servicio}: ${error.message}`)
    }
  }
  // Una capa que falla puede ser otra copia de una que sí bajó (servicio duplicado): eso no cuenta
  const faltantes = aCargar
    .filter((c) => !yaCargadas.has(claveCapa(c)))
    .map((c) => `"${c.nombreCapa}" (${c.servicio})`)
  if (faltantes.length > 0 && !permitirParcial) {
    throw new Error(
      `No se pudo descargar: ${[...new Set(faltantes)].join('; ')}. NO se escribió nada de ${municipio} (la base quedó como estaba). ` +
      'El servidor del AMVA a veces responde 504: repite en unos minutos, o usa --permitir-parcial para cargar solo lo que sí bajó.'
    )
  }
  if (descargadas.length === 0) {
    throw new Error('No se pudo descargar ninguna capa de este municipio.')
  }

  // 2) Escribir en una transacción: o entra todo, o no entra nada
  let insertadas = 0
  const omitidosPorError = []
  await client.query('begin')
  try {
    if (filasPrevias > 0) {
      console.log(`  Reemplazando: se borran ${filasPrevias} filas previas de ${municipio} en suelo_pot`)
      await client.query('delete from public.suelo_pot where municipio = $1', [municipio])
    }

    for (const { capa, features } of descargadas) {
      let n = 0
      let sinClasificar = 0
      let porCampo = 0
      let porTexto = 0
      for (const f of features) {
        const tipo = f.geometry?.type
        if (tipo !== 'Polygon' && tipo !== 'MultiPolygon') continue // solo polígonos

        const props = f.properties || {}
        let categoria = capa.categoria
        if (categoria === 'por_atributo') {
          const resultado = clasificarPorAtributos(props)
          categoria = resultado.categoria
          if (resultado.via === 'campo clase') porCampo++
          else if (resultado.via === 'texto') porTexto++
        }
        if (!categoria) {
          sinClasificar++
          continue
        }
        const nombre = buscarCampo(props, CAMPOS_NOMBRE) || capa.nombreCapa

        const t0 = Date.now()
        // Savepoint por polígono: si uno pasa el límite de tiempo, se descarta
        // solo ese y el resto de la transacción sigue intacta.
        let res
        await client.query('savepoint poligono')
        try {
          res = await client.query(SQL_INSERTAR, [
            municipio,
            categoria,
            capa.nombreCapa,
            nombre,
            JSON.stringify(props),
            JSON.stringify(f.geometry),
            SIMPLIFICAR_GRADOS,
          ])
          await client.query('release savepoint poligono')
        } catch (error) {
          await client.query('rollback to savepoint poligono')
          omitidosPorError.push(`"${nombre}" (${capa.nombreCapa})`)
          console.warn(`    ✗ polígono omitido: "${nombre}" (${capa.nombreCapa}): ${String(error.message).slice(0, 80)}`)
          continue
        }
        n += res.rowCount
        const segundos = (Date.now() - t0) / 1000
        if (segundos > 5) {
          console.log(`    (polígono lento: "${nombre}" tardó ${segundos.toFixed(1)} s en guardarse)`)
        }
        if (n > 0 && n % 250 === 0) console.log(`    ${n} filas...`)
      }
      const detalle = capa.categoria === 'por_atributo'
        ? ` (${porCampo} por campo de clase, ${porTexto} por texto de respaldo, ${sinClasificar} sin poder clasificar y no guardados)`
        : ''
      console.log(`  ✓ "${capa.nombreCapa}": ${n} polígonos guardados${detalle}`)
      insertadas += n
    }
    if (omitidosPorError.length > 0 && !permitirParcial) {
      throw new Error(
        `no se pudieron guardar ${omitidosPorError.length} polígonos: ${omitidosPorError.join('; ')}. ` +
        'Usa --permitir-parcial para cargar el resto sin ellos'
      )
    }
    if (omitidosPorError.length > 0) {
      console.warn(`  AVISO: ${omitidosPorError.length} polígonos quedaron fuera: ${omitidosPorError.join('; ')}`)
    }
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw new Error(`Se revirtió todo para ${municipio} (la base quedó como estaba): ${error.message}`)
  }

  return { municipio, capasEncontradas: capas.length, capasACargar: aCargar.length, poligonosEstimados: null, capasFallidas: new Set(faltantes).size, filasInsertadas: insertadas }
}

async function main() {
  const args = process.argv.slice(2)
  const probar = args.includes('--probar')
  const reemplazar = args.includes('--reemplazar')
  const permitirParcial = args.includes('--permitir-parcial')
  const municipiosArg = args.filter((a) => !a.startsWith('--'))
  const municipios = municipiosArg.length > 0 ? municipiosArg : MUNICIPIOS_AMVA

  let client = null
  if (!probar) {
    if (!DB_URL) {
      console.error('Falta SUPABASE_DB_URL en frontend/.env (sin prefijo VITE_). Mira las instrucciones al inicio de este archivo.')
      process.exit(1)
    }
    const local = /localhost|127\.0\.0\.1/.test(DB_URL)
    client = new Client({ connectionString: DB_URL, ssl: local ? false : { rejectUnauthorized: false } })
    await client.connect()
    // Solo afecta a esta conexión del script. 3 minutos por polígono: si uno
    // se atasca (pasó en la protección de Medellín) se descarta solo ese.
    await client.query("set statement_timeout = '3min'")
  }

  const resumen = []
  try {
    for (const municipio of municipios) {
      try {
        resumen.push(await cargarMunicipio(municipio, { probar, reemplazar, permitirParcial, client }))
      } catch (error) {
        console.error(`  ✗ ${municipio} falló:`, error.message)
        resumen.push({ municipio, capasEncontradas: 0, capasACargar: 0, poligonosEstimados: null, filasInsertadas: 0, error: error.message })
      }
    }
  } finally {
    if (client) await client.end()
  }

  console.log('\n=== Resumen ===')
  console.table(resumen)
}

main()
