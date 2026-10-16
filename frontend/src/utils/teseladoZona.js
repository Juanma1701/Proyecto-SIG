import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import { estiloCategoria } from './categoriasEquipamiento'

const RADIO_MAX_KM = 5
const LADO_MIN_M = 200
const LADO_MAX_M = 2000
const VIGENCIA_CACHE_MS = 10 * 60 * 1000

// Azules de claro a oscuro: no chocan con suelo (amarillo, rojo, verde, morado)
// ni con cobertura (rojo)
const COLORES = ['#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c']

const cache = new Map()
const enVuelo = new Map()

const clave = (c, r, lado, cat) =>
  `${c.lat.toFixed(5)},${c.lng.toFixed(5)},${r},${lado},${cat ?? 'todas'}`

// Con enteros: cantidad * 5 / maximo da el tramo exacto (sin errores de decimales)
function colorPorCantidad(cantidad, maximo) {
  if (!maximo) return COLORES[0]
  const indice = Math.min(COLORES.length - 1, Math.floor((cantidad * COLORES.length) / maximo))
  return COLORES[indice]
}

// Tramos de la leyenda: son los mismos 5 que usa colorPorCantidad para pintar.
// Solo hay celdas con al menos 1 equipamiento, por eso el primer tramo empieza en 1.
function rangosPorColor(maximo) {
  const n = COLORES.length
  const rangos = []
  COLORES.forEach((color, i) => {
    const desde = Math.max(1, Math.ceil((i * maximo) / n))
    const hasta = i === n - 1 ? maximo : Math.ceil(((i + 1) * maximo) / n) - 1
    if (desde <= hasta) rangos.push({ desde, hasta, color })
  })
  return rangos
}

async function pedir(centro, radioKm, ladoM, categoria) {
  const k = clave(centro, radioKm, ladoM, categoria)
  const guardado = cache.get(k)
  if (guardado && guardado.hasta > Date.now()) return guardado.datos
  if (enVuelo.has(k)) return enVuelo.get(k)

  const promesa = (async () => {
    const { data, error } = await supabase.rpc('teselado_equipamientos', {
      p_lat: centro.lat,
      p_lng: centro.lng,
      p_radio_km: radioKm,
      p_lado_m: ladoM,
      p_categoria: categoria || null
    })
    if (error) throw new Error(error.message)
    cache.set(k, { datos: data, hasta: Date.now() + VIGENCIA_CACHE_MS })
    return data
  })().finally(() => enVuelo.delete(k))

  enVuelo.set(k, promesa)
  return promesa
}

export async function capaTeseladoDesdeZona(centro, radioKm, ladoM = 500, categoria = null) {
  const radio = Number(radioKm)
  if (radio > RADIO_MAX_KM) {
    toast.error(`El teselado solo se calcula con radio de ${RADIO_MAX_KM} km o menos`)
    return null
  }
  const lado = Math.min(LADO_MAX_M, Math.max(LADO_MIN_M, Number(ladoM) || 500))

  let datos
  try {
    datos = await pedir(centro, radio, lado, categoria)
  } catch (error) {
    toast.error('No se pudo calcular el teselado: ' + error.message)
    return null
  }

  if (!datos || !datos.total_equipamientos) {
    toast.error('No hay equipamientos en esta zona para armar el teselado')
    return null
  }

  const etiquetaCategoria = categoria
    ? (estiloCategoria(categoria)?.etiqueta || categoria)
    : 'Todas las categorías'

  const features = (datos.features || []).map((f) => {
    const cantidad = f.properties.cantidad
    return {
      ...f,
      properties: {
        ...f.properties,
        categoriaColor: colorPorCantidad(cantidad, datos.max_cantidad),
        categoriaEtiqueta: `${cantidad} equipamiento${cantidad === 1 ? '' : 's'} en esta celda`
      }
    }
  })

  return {
    id: crypto.randomUUID(),
    nombre: `Teselado de equipamientos (${lado} m)`,
    archivoOriginal: null,
    tipo: 'teselado',
    geojson: { type: 'FeatureCollection', features },
    crs: { epsg: 4326, fuente: 'PostGIS (teselado_equipamientos)' },
    visible: true,
    guardadaEnNube: false,
    origenAPI: true,
    zonaCentro: { lat: centro.lat, lng: centro.lng },
    zonaRadioKm: radio,
    resumenTeselado: {
      ladoM: lado,
      categoria: etiquetaCategoria,
      celdasTotal: datos.celdas_total,
      celdasConEquipamientos: features.length,
      totalEquipamientos: datos.total_equipamientos,
      maxPorCelda: datos.max_cantidad,
      rangos: rangosPorColor(datos.max_cantidad)
    }
  }
}