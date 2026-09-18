// Ajusta esta ruta al archivo donde ya tengas inicializado el cliente de
// Supabase (createClient de '@supabase/supabase-js'). Si en tu proyecto se
// llama distinto o está en otra carpeta, solo cambia esta línea.
import { supabase } from '../lib/supabaseClient'

/**
 * Guarda en Supabase una capa que hoy solo vive en el estado local del
 * frontend (la que arma CargarCapaAPI.jsx, con guardadaEnNube: false).
 *
 * Usa la función insertar_capa(p_nombre, p_geojson, p_srid_original, p_formato)
 * que ya existe en la base de datos — no hace falta transformar el GeoJSON,
 * porque insertar_capa ya espera un FeatureCollection igual al que arma
 * CargarCapaAPI.jsx.
 *
 * @param {Object} capa - una capa del estado `capas` (ver CargarCapaAPI.jsx)
 * @returns {Promise<string[]>} los ids (uuid) de las filas insertadas, una por feature
 */
export async function guardarCapaEnNube(capa) {
  if (!capa?.geojson?.features?.length) {
    throw new Error('La capa no tiene features para guardar')
  }

  const { data, error } = await supabase.rpc('insertar_capa', {
    p_nombre: capa.nombre,
    p_geojson: capa.geojson,
    p_srid_original: capa.crs?.epsg ?? 4326,
    p_formato: capa.crs?.fuente ?? 'GeoJSON',
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}