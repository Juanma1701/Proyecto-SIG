import { toast } from 'sonner'
import { buscarLugaresCercanos } from './fetchOverpass'
import { lugaresEnZona, esSobrecarga, MENSAJE_SATURADO } from './cercania'
import { municipiosEnZona } from './municipiosValleAburra'

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export async function capaLugaresDesdeZona(centro, radioKm) {
  let geojson = null
  let usoBaseDeDatos = false

  if (municipiosEnZona(centro, radioKm).length === 0) return null

  try {
    const respuesta = await lugaresEnZona(centro, radioKm)
    const cargados = new Set((respuesta.municipiosCargados || []).map(normalizar))
    const municipios = municipiosEnZona(centro, radioKm)
    const todosCargados = municipios.length > 0 && municipios.every((m) => cargados.has(normalizar(m.nombre)))

    if (todosCargados) {
      if ((respuesta.features || []).length === 0) return null
      geojson = { type: 'FeatureCollection', features: respuesta.features }
      usoBaseDeDatos = true
    }
  } catch (error) {
    if (esSobrecarga(error)) {
      console.warn('[Supabase] saturado: no se consulta Overpass en vivo', error)
      toast.error(MENSAJE_SATURADO, { id: 'servicio-saturado' })
      return null
    }
    console.warn('[Supabase] no se pudo leer los lugares de la base, se usa Overpass', error)
  }

  if (!geojson) {
    try {
      geojson = await buscarLugaresCercanos(centro, radioKm)
    } catch (error) {
      console.error(error)
      toast.error('Error al consultar lugares (OSM): ' + error.message)
      return null
    }
  }

  if (geojson.features.length === 0) {
    return null
  }

  return {
    id: crypto.randomUUID(),
    nombre: `Lugares de interés (radio ${radioKm} km)`,
    archivoOriginal: null,
    tipo: 'lugares',
    geojson,
    crs: {
      epsg: 4326,
      fuente: usoBaseDeDatos ? 'Base de datos propia (copia de OSM)' : 'OSM Overpass API'
    },
    visible: true,
    guardadaEnNube: false,
    origenAPI: true
  }
}