import { supabase } from '../lib/supabaseClient'

function sanitizarNombre(nombre) {
  return nombre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function guardarCapaEnSupabase(archivo, capa) {
  // 1. Subir el archivo original al bucket (solo si viene con archivo real)
  if (archivo) {
    const rutaArchivo = `${Date.now()}_${sanitizarNombre(archivo.name)}`
    const { error: errorStorage } = await supabase.storage
      .from('archivos-capas')
      .upload(rutaArchivo, archivo)

    if (errorStorage) throw errorStorage
  }

  // 2. Insertar la capa (una fila por feature si es FeatureCollection)
  const { data, error } = await supabase.rpc('insertar_capa', {
    p_nombre: capa.nombre,
    p_geojson: capa.geojson,
    p_srid_original: capa.crs.epsg,
    p_formato: capa.nombre.split('.').pop()
  })

  if (error) throw error
  return data // ahora es un array de uuids, uno por cada feature insertado
}