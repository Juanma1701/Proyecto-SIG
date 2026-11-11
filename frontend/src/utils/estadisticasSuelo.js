import { supabase } from '../lib/supabaseClient'
import { estiloCategoriaSuelo } from './categoriasSuelo'

const RADIO_MAX_KM = 5
const VIGENCIA_CACHE_MS = 10 * 60 * 1000

const cache = new Map()
const enVuelo = new Map()

const ORDEN_CLASES = ['urbano', 'rural', 'proteccion', 'riesgo']

const ETIQUETAS_CORTAS = {
  urbano: 'Urbano',
  rural: 'Rural',
  proteccion: 'Protección',
  riesgo: 'Riesgo'
}

// Subclases que devuelve la función SQL suelo_estadisticas_zona (clave: clase.subclase)
const ETIQUETAS_SUBCLASE = {
  'urbano.urbano': 'Urbano',
  'urbano.expansion': 'Expansión urbana',
  'rural.rural': 'Rural',
  'rural.suburbano': 'Suburbano',
  'rural.expansion': 'Expansión (marcada como rural en la fuente)',
  'riesgo.movimiento_en_masa': 'Movimiento en masa',
  'riesgo.inundacion': 'Inundación',
  'riesgo.avenidas_torrenciales': 'Avenidas torrenciales',
  'riesgo.poliducto': 'Riesgo por poliducto',
  'riesgo.varios_eventos': 'Movimiento en masa e inundación',
  'riesgo.sin_tipo': 'Sin tipo identificable'
}

// Aclaraciones que se muestran junto a cada clase
const NOTAS_CLASE = {
  proteccion:
    'Sin subclases: un mismo polígono puede tener varias razones de protección a la vez (por ejemplo, retiro a quebradas y áreas protegidas), y separarlas contaría el mismo terreno varias veces.',
  riesgo:
    'Se agrupa por el tipo de evento que dicen los atributos de la fuente. “Sin tipo identificable” son polígonos cuyos atributos no nombran el evento (por ejemplo, solo indican el nivel de riesgo).'
}

const clave = (centro, radioKm) => `${centro.lat.toFixed(5)},${centro.lng.toFixed(5)},${radioKm}`

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function pedir(centro, radioKm) {
  const parametros = { p_lat: centro.lat, p_lng: centro.lng, p_radio_km: radioKm }
  let ultimoError

  for (let intento = 0; intento < 2; intento++) {
    const { data, error } = await supabase.rpc('suelo_estadisticas_zona', parametros)
    if (!error) return data
    ultimoError = error
    if (intento === 0) await esperar(800)
  }

  throw new Error(ultimoError?.message || 'No se pudieron calcular las estadísticas del suelo')
}

// Pide las estadísticas a Supabase (con caché de 10 min y sin repetir pedidos en vuelo).
// Devuelve null si el radio no es válido; lanza un Error si la consulta falla.
export async function obtenerEstadisticasSuelo(centro, radioKm) {
  const radio = Number(radioKm)
  if (!Number.isFinite(radio) || radio <= 0 || radio > RADIO_MAX_KM) return null

  const k = clave(centro, radio)
  const guardado = cache.get(k)
  if (guardado && guardado.hasta > Date.now()) return guardado.datos
  if (enVuelo.has(k)) return enVuelo.get(k)

  const promesa = pedir(centro, radio)
    .then((datos) => {
      cache.set(k, { datos, hasta: Date.now() + VIGENCIA_CACHE_MS })
      return datos
    })
    .finally(() => enVuelo.delete(k))

  enVuelo.set(k, promesa)
  return promesa
}

function posicionClase(categoria) {
  const i = ORDEN_CLASES.indexOf(categoria)
  return i === -1 ? ORDEN_CLASES.length : i
}

// Convierte la respuesta de la función SQL en los datos que pinta el panel
export function prepararEstadisticasSuelo(datos) {
  if (!datos || !Array.isArray(datos.clases) || datos.clases.length === 0) return null

  const zonaKm2 = Number(datos.zona_km2)
  const subclasesSql = datos.subclases || []

  const clases = datos.clases
    .map((c) => {
      const estilo = estiloCategoriaSuelo(String(c.categoria).toUpperCase())
      const areaKm2 = Number(c.area_km2)

      const subclases = subclasesSql
        .filter((s) => s.categoria === c.categoria)
        .map((s) => {
          const esExpansionUrbana = s.categoria === 'urbano' && s.subclase === 'expansion'
          return {
            id: `${s.categoria}.${s.subclase}`,
            etiqueta: ETIQUETAS_SUBCLASE[`${s.categoria}.${s.subclase}`] || s.subclase,
            color: esExpansionUrbana ? estiloCategoriaSuelo('EXPANSION_URBANA').color : estilo.color,
            areaKm2: Number(s.area_km2),
            porcentaje: Number(s.porcentaje_zona),
            poligonos: s.poligonos
          }
        })

      const sumaSubclasesKm2 = subclases.reduce((suma, s) => suma + s.areaKm2, 0)

      return {
        categoria: c.categoria,
        etiqueta: estilo.etiqueta,
        etiquetaCorta: ETIQUETAS_CORTAS[c.categoria] || c.categoria,
        color: estilo.color,
        areaKm2,
        porcentaje: Number(c.porcentaje_zona),
        poligonos: c.poligonos,
        subclases,
        // true cuando las subclases suman más que la clase (se solapan entre sí)
        subclasesSolapadas: subclases.length > 1 && sumaSubclasesKm2 > areaKm2 + 0.005,
        sumaSubclasesKm2,
        nota: NOTAS_CLASE[c.categoria] || null
      }
    })
    .sort((a, b) => posicionClase(a.categoria) - posicionClase(b.categoria))

  const b = datos.base || {}
  const base = {
    urbanoKm2: Number(b.urbano_km2) || 0,
    ruralKm2: Number(b.rural_km2) || 0,
    solapeKm2: Number(b.solape_urbano_rural_km2) || 0,
    clasificadaKm2: Number(b.clasificada_km2) || 0,
    sinClasificarKm2: Number(b.sin_clasificar_km2) || 0,
    sinClasificarPct: Number(b.sin_clasificar_pct) || 0,
    predominante: b.predominante || null
  }

  const combinaciones = (datos.combinaciones || []).map((c) => ({
    id: `${c.a}.${c.b}`,
    etiqueta: `${ETIQUETAS_CORTAS[c.a] || c.a} ∩ ${ETIQUETAS_CORTAS[c.b] || c.b}`,
    areaKm2: Number(c.area_km2),
    porcentaje: Number(c.porcentaje_zona)
  }))

  return { zonaKm2, clases, base, combinaciones }
}