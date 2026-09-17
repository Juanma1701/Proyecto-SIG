// src/utils/capaLugaresDesdeZona.js
import { toast } from 'sonner'
import { buscarLugaresCercanos } from './fetchOverpass'

/**
 * Dado un centro y un radio, consulta Overpass (OSM) por hoteles, moteles,
 * bares y discotecas, y arma un objeto "capa" con el mismo formato que ya
 * consumen Mapa.jsx, PanelCapas/MenuCapas y FiltroCategorias.
 */
export async function capaLugaresDesdeZona(centro, radioKm) {
  let geojson
  try {
    geojson = await buscarLugaresCercanos(centro, radioKm)
  } catch (error) {
    console.error(error)
    toast.error('Error al consultar lugares (OSM): ' + error.message)
    return null
  }

  if (geojson.features.length === 0) {
    return null
  }

  const nuevaCapa = {
    id: crypto.randomUUID(),
    nombre: `Lugares de interés (radio ${radioKm} km)`,
    archivoOriginal: null,
    tipo: 'lugares',
    geojson,
    crs: { epsg: 4326, fuente: 'OSM Overpass API' },
    visible: true,
    guardadaEnNube: false,
    origenAPI: true
  }

  return nuevaCapa
}