// src/utils/capaSueloDesdeZona.js
import { toast } from 'sonner'
import * as turf from '@turf/turf'
import { municipiosEnZona } from './municipiosValleAburra'
import { resolverCapasSueloPorMunicipio, fetchAreasProtegidasEnZona, fetchCapaArcGIS } from './fetchSuelo'
import { obtenerCategoriaSuelo, estiloCategoriaSuelo } from './categoriasSuelo'

/**
 * Recorta features de POLÍGONO al círculo de la zona usando Turf.js.
 * `filtrarPorZona` (geoFiltros.js) está hecho para puntos y falla con
 * polígonos — cuando eso pasa, terminan mostrándose sin recortar (el
 * municipio completo en vez de solo la zona). Esta versión SÍ recorta
 * la geometría real al círculo, no solo decide si incluir el feature
 * completo o no.
 */
function recortarPoligonosAZona(geojson, centro, radioKm) {
  const circulo = turf.circle([centro.lng, centro.lat], radioKm, { units: 'kilometers' })
  const recortados = []

  for (const feature of geojson.features || []) {
    try {
      if (!turf.booleanIntersects(feature, circulo)) continue

      const interseccion = turf.intersect(turf.featureCollection([feature, circulo]))
      if (interseccion) {
        recortados.push({ ...interseccion, properties: feature.properties })
      }
    } catch {
      // Geometría problemática (auto-intersecciones, etc.) — se
      // descarta ese feature puntual en vez de romper todo el resto.
      continue
    }
  }

  return recortados
}

export async function capaSueloDesdeZona(centro, radioKm) {
  const municipios = municipiosEnZona(centro, radioKm)
  const features = []
  const serviciosConsultados = []

  // Por municipio: puede haber VARIAS capas relevantes (clasificación
  // urbano/rural, riesgo, patrimonio...), no solo una — se consultan todas.
  const resultadosMunicipio = await Promise.allSettled(
    municipios.map(async (municipio) => {
      const capasEncontradas = await resolverCapasSueloPorMunicipio(municipio.nombre)

      const consultas = await Promise.allSettled(
        capasEncontradas.map(async (resuelto) => {
          const geojson = await fetchCapaArcGIS(resuelto.url)
          return { resuelto, geojson }
        })
      )

      return { municipio, consultas, capasEncontradas }
    })
  )

  resultadosMunicipio.forEach((resultado) => {
    if (resultado.status !== 'fulfilled') return
    const { municipio, consultas, capasEncontradas } = resultado.value

    if (capasEncontradas.length === 0) {
      toast.warning(`${municipio.nombre} no publica capas de uso de suelo en el AMVA`)
    }

    consultas.forEach((consulta) => {
      if (consulta.status !== 'fulfilled') {
        toast.error(`Error consultando suelo en ${municipio.nombre}: ${consulta.reason?.message || consulta.reason}`)
        return
      }

      const { resuelto, geojson } = consulta.value
      serviciosConsultados.push(`${municipio.nombre}: ${resuelto.nombreCapa}`)

      const recortados = recortarPoligonosAZona(geojson, centro, radioKm).map((f) => {
        const categoria = obtenerCategoriaSuelo(f)
        const estilo = estiloCategoriaSuelo(categoria)
        return {
          ...f,
          properties: {
            ...f.properties,
            municipio: municipio.nombre,
            categoria,
            categoriaEtiqueta: estilo.etiqueta,
            categoriaColor: estilo.color
          }
        }
      })

      features.push(...recortados)
    })
  })

  // Áreas Protegidas: cubre todo el valle en un solo servicio
  try {
    const geojsonProtegidas = await fetchAreasProtegidasEnZona(centro, radioKm)
    const recortadas = recortarPoligonosAZona(geojsonProtegidas, centro, radioKm).map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        categoria: 'PROTECCION',
        categoriaEtiqueta: 'Área de protección',
        categoriaColor: '#dc2626'
      }
    }))
    features.push(...recortadas)
  } catch (error) {
    toast.error('No se pudo consultar Áreas Protegidas: ' + error.message)
  }

  console.log('[Suelo] Servicios/capas consultados:', serviciosConsultados)

  if (features.length === 0) {
    toast.error('No se encontró información de uso de suelo para esta zona')
    return null
  }

  const nuevaCapa = {
    id: crypto.randomUUID(),
    nombre: `Uso del suelo (radio ${radioKm} km)`,
    archivoOriginal: null,
    tipo: 'suelo',
    geojson: { type: 'FeatureCollection', features },
    crs: { epsg: 4326, fuente: 'AMVA POT / Áreas Protegidas' },
    visible: true,
    guardadaEnNube: false,
    origenAPI: true
  }

  return nuevaCapa
}