import { supabase } from '../lib/supabaseClient'

export async function guardarCapaEnSupabase(archivo, capa) {
  // 1. Subir el archivo original al bucket
  const rutaArchivo = `${Date.now()}_${archivo.name}`
  const { error: errorStorage } = await supabase.storage
    .from('archivos-capas')
    .upload(rutaArchivo, archivo)

  if (errorStorage) throw errorStorage

  // 2. Insertar la capa en la tabla 'capas' (esto reproyecta a 4326 automáticamente)
  const { data, error } = await supabase.rpc('insertar_capa', {
    p_nombre: capa.nombre,
    p_geojson: capa.geojson,
    p_srid_original: capa.crs.epsg,
    p_formato: capa.nombre.split('.').pop()
  })

  if (error) throw error
  return data // devuelve el id (uuid) de la capa insertada
}