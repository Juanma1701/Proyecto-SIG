// src/utils/capaDesdeZona.js
import { toast } from 'sonner'
import { municipiosEnZona } from './municipiosValleAburra'
import { filtrarPorZona } from './geoFiltros'
import { resolverCapaPorMunicipio, fetchCapaArcGIS } from './fetchArcGIS'
import { obtenerCategoria, estiloCategoria } from './categoriasEquipamiento'

/**
 * Dado un centro y un radio definidos por el usuario en "Mapear una zona",
 * determina qué municipios del Valle de Aburrá aplican, resuelve y consulta
 * dinámicamente sus servicios ArcGIS REST de equipamientos urbanos, filtra
 * los resultados al radio exacto, y arma un objeto `capa` listo para
 * sumarse al array `capas` que ya consume Mapa.jsx.
 *
 * @param {{ lat: number, lng: number }} centro
 * @param {number} radioKm
 * @param {string} nombreCapaBuscada - nombre de la capa a buscar en cada servicio
 * @returns {Promise<object|null>} la nueva capa, o null si no hubo resultados
 */
export async function capaDesdeZona(centro, radioKm, nombreCapaBuscada = 'Equipamientos Urbanos') {
  const municipios = municipiosEnZona(centro, radioKm)

  if (municipios.length === 0) {
    toast.error('No hay municipios del Valle de Aburrá en esa zona')
    return null
  }

  // Por cada municipio: resolver dónde está su capa de equipamientos,
  // y luego consultarla. Son dos pasos async por municipio, así que
  // los encadenamos dentro de una sola promesa por municipio para
  // poder usar allSettled y que un municipio con error no tumbe a los demás.
  const resultados = await Promise.allSettled(
    municipios.map(async (municipio) => {
      const { url, epsg, servicio } = await resolverCapaPorMunicipio(municipio.nombre, nombreCapaBuscada)
      const geojson = await fetchCapaArcGIS(url)
      return { municipio, epsg, servicio, geojson }
    })
  )

  const features = []
  const municipiosConsultados = []
  const municipiosConError = []

  resultados.forEach((resultado, i) => {
    const municipio = municipios[i]

    if (resultado.status === 'rejected') {
      console.warn(`Falló AMVA para ${municipio.nombre}:`, resultado.reason)
      municipiosConError.push(municipio.nombre)
      return
    }

    const { epsg, servicio, geojson } = resultado.value

    console.log('[AMVA] GeoJSON recibido', {
      municipio: municipio.nombre,
      totalFeatures: geojson?.features?.length || 0,
      sample: geojson?.features?.[0]?.properties || null,
      keys: geojson?.features?.[0] ? Object.keys(geojson.features[0].properties || {}) : []
    })

    const filtrados = filtrarPorZona(geojson, centro, radioKm).map((f) => {
      const categoria = obtenerCategoria(f)
      const estilo = estiloCategoria(categoria)

      console.log('[AMVA] feature filtrada y categorizada', {
        municipio: municipio.nombre,
        featureId: f?.id,
        properties: f?.properties,
        categoria,
        estilo
      })

      return {
        ...f,
        properties: {
          ...f.properties,
          municipio: municipio.nombre,
          categoria,
          categoriaEtiqueta: estilo.etiqueta,
          categoriaColor: estilo.color,
          categoriaIcono: estilo.icono,
          _epsgOriginal: epsg,   // metadato: CRS real reportado por el servicio de origen
          _servicioArcGIS: servicio
        }
      }
    })

    features.push(...filtrados)
    if (filtrados.length > 0) {
      municipiosConsultados.push(municipio.nombre)
    }
  })

  if (municipiosConError.length > 0) {
    toast.error(`No se pudo consultar: ${municipiosConError.join(', ')}`)
  }

  if (features.length === 0) {
    toast.error('No se encontraron equipamientos en esa zona')
    return null
  }

  // El EPSG "de la capa" combinada se reporta como 4326 porque así es
  // como f=geojson entrega los datos siempre. Los EPSG originales por
  // municipio (que pueden diferir entre sí) quedan guardados por feature
  // en _epsgOriginal, para trazabilidad y para mostrarlos en la UI si quieres.
  const nuevaCapa = {
    id: crypto.randomUUID(),
    nombre: `${nombreCapaBuscada} (radio ${radioKm} km)`,
    archivoOriginal: null,
    geojson: { type: 'FeatureCollection', features },
    crs: { epsg: 4326, fuente: 'AMVA ArcGIS REST (f=geojson, reproyectado por el servidor)' },
    visible: true,
    guardadaEnNube: false,
    origenAPI: true,
    municipiosConsultados
  }

  toast.success(`${features.length} equipamientos encontrados en ${municipiosConsultados.length} municipio(s)`)
  return nuevaCapa
}