import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import { estiloCategoria } from './categoriasEquipamiento'

const RADIO_MAX_KM = 5
const VIGENCIA_CACHE_MS = 10 * 60 * 1000

const cache = new Map()
const enVuelo = new Map()

const clave = (c, r, cat, b) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)},${r},${cat},${b}`

async function pedir(centro, radioKm, categoria, bufferM) {
  const k = clave(centro, radioKm, categoria, bufferM)
  const guardado = cache.get(k)
  if (guardado && guardado.hasta > Date.now()) return guardado.datos
  if (enVuelo.has(k)) return enVuelo.get(k)

  const promesa = (async () => {
    const { data, error } = await supabase.rpc('cobertura_servicio', {
      p_lat: centro.lat,
      p_lng: centro.lng,
      p_radio_km: radioKm,
      p_categoria: categoria,
      p_buffer_m: bufferM
    })
    if (error) throw new Error(error.message)
    cache.set(k, { datos: data, hasta: Date.now() + VIGENCIA_CACHE_MS })
    return data
  })().finally(() => enVuelo.delete(k))

  enVuelo.set(k, promesa)
  return promesa
}

export async function capaCoberturaDesdeZona(centro, radioKm, categoria, bufferM) {
  const radio = Number(radioKm)
  if (radio > RADIO_MAX_KM) {
    toast.error(`La cobertura solo se calcula con radio de ${RADIO_MAX_KM} km o menos`)
    return null
  }

  let datos
  try {
    datos = await pedir(centro, radio, categoria, bufferM)
  } catch (error) {
    toast.error('No se pudo calcular la cobertura: ' + error.message)
    return null
  }

  if (!datos || !datos.n_servicios) {
    toast.error('No hay servicios de esa categoría cerca de esta zona')
    return null
  }

  const etiqueta = estiloCategoria(categoria)?.etiqueta || categoria
  const features = datos.geometry
    ? [{
        type: 'Feature',
        geometry: datos.geometry,
        properties: {
          categoriaEtiqueta: `Sin cobertura de ${etiqueta} a ${bufferM} m · ${datos.deficit_km2} km²`
        }
      }]
    : []

  return {
    id: crypto.randomUUID(),
    nombre: `Cobertura de ${etiqueta} (${bufferM} m)`,
    archivoOriginal: null,
    tipo: 'cobertura',
    geojson: { type: 'FeatureCollection', features },
    crs: { epsg: 4326, fuente: 'PostGIS (cobertura_servicio)' },
    visible: true,
    guardadaEnNube: false,
    origenAPI: true,
    zonaCentro: { lat: centro.lat, lng: centro.lng },
    zonaRadioKm: radio,
    resumenCobertura: {
      etiqueta,
      bufferM,
      servicios: datos.n_servicios,
      zonaKm2: datos.zona_km2,
      deficitKm2: datos.deficit_km2,
      coberturaPct: datos.cobertura_pct
    }
  }
}