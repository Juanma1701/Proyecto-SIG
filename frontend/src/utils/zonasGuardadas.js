// utils/zonasGuardadas.js
import { supabase } from '../lib/supabaseClient'

/**
 * Guarda la zona actual (centro, radio) junto con una "foto" de los
 * equipamientos y lugares que tenía en ese momento, para poder
 * recargarla después sin depender de que el AMVA/Overpass respondan
 * igual (o sigan disponibles) en el futuro.
 */
export async function guardarZona(userId, zona, capaEquipamiento, capaLugares) {
  const { data: coordenada, error: errorCoordenada } = await supabase
    .from('coordenadas_capturadas')
    .insert({
      nombre: zona.nombre,
      geom: `SRID=4326;POINT(${zona.centro.lng} ${zona.centro.lat})`,
      srid_mostrado: 4326,
    })
    .select('id')
    .single()

  if (errorCoordenada) throw errorCoordenada

  const { error } = await supabase.from('zonas').insert({
    user_id: userId,
    coordenada_id: coordenada.id,
    nombre: zona.nombre,
    centro_lat: zona.centro.lat,
    centro_lng: zona.centro.lng,
    radio_km: zona.radioKm,
    geojson_equipamientos: capaEquipamiento?.geojsonOriginal || capaEquipamiento?.geojson || null,
    geojson_lugares: capaLugares?.geojsonOriginal || capaLugares?.geojson || null,
  })
  if (error) {
    await supabase.from('coordenadas_capturadas').delete().eq('id', coordenada.id)
    throw error
  }
}

/** Lista las zonas guardadas del usuario, más recientes primero. */
export async function listarZonas(userId) {
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('user_id', userId)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data
}

/** Elimina una zona guardada por su id. */
export async function eliminarZonaGuardada(id) {
  const { error } = await supabase.from('zonas').delete().eq('id', id)
  if (error) throw error
}

/**
 * Convierte una fila guardada de Supabase de vuelta en las capas que
 * espera el resto de la app (zona + equipamientos + lugares), listas
 * para agregarse al array `capas` y mostrarse en el mapa.
 */
export function capasDesdeZonaGuardada(fila) {
  const zonaId = crypto.randomUUID()
  const centro = { lat: fila.centro_lat, lng: fila.centro_lng }

  const zona = {
    id: zonaId,
    nombre: fila.nombre,
    archivoOriginal: null,
    tipo: 'zona',
    centro,
    radioKm: fila.radio_km,
    geojson: null,
    crs: { epsg: 4326, fuente: 'zona de busqueda' },
    visible: true,
    guardadaEnNube: true,
    esZonaVisual: true,
    color: '#2563eb'
  }

  const nuevas = [zona]

  if (fila.geojson_equipamientos) {
    nuevas.push({
      id: crypto.randomUUID(),
      nombre: `${fila.nombre} — Equipamientos`,
      archivoOriginal: null,
      geojson: fila.geojson_equipamientos,
      crs: { epsg: 4326, fuente: 'AMVA ArcGIS REST (zona guardada)' },
      visible: true,
      guardadaEnNube: true,
      origenAPI: true,
      zonaId
    })
  }

  if (fila.geojson_lugares) {
    nuevas.push({
      id: crypto.randomUUID(),
      nombre: `${fila.nombre} — Lugares`,
      archivoOriginal: null,
      tipo: 'lugares',
      geojson: fila.geojson_lugares,
      crs: { epsg: 4326, fuente: 'OSM Overpass API (zona guardada)' },
      visible: true,
      guardadaEnNube: true,
      origenAPI: true,
      zonaId
    })
  }

  return nuevas
}