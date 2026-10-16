import { toast } from 'sonner'
import { municipiosEnZona } from './municipiosValleAburra'
import { filtrarPorZona } from './geoFiltros'
import { resolverCapaPorMunicipio, fetchCapaArcGIS } from './fetchArcGIS'
import { obtenerCategoria, estiloCategoria } from './categoriasEquipamiento'
import { buscarEquipamientosOSM } from './fetchOverpass'
import { equipamientosEnZona, esSobrecarga, MENSAJE_SATURADO } from './cercania'

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const MUNICIPIOS_SIN_CAPA_AMVA = new Set(['bello'])

function enriquecer(feature, extra = {}) {
  const categoria = obtenerCategoria(feature)
  const estilo = estiloCategoria(categoria)
  return {
    ...feature,
    properties: {
      ...feature.properties,
      ...extra,
      categoria,
      categoriaEtiqueta: estilo.etiqueta,
      categoriaColor: estilo.color,
      categoriaIcono: estilo.icono
    }
  }
}

async function consultarAMVA(municipios, centro, radioKm, nombreCapaBuscada) {
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

    const filtrados = filtrarPorZona(geojson, centro, radioKm).map((f) =>
      enriquecer(f, {
        municipio: municipio.nombre,
        _epsgOriginal: epsg,
        _servicioArcGIS: servicio
      })
    )

    features.push(...filtrados)
    if (filtrados.length > 0) municipiosConsultados.push(municipio.nombre)
  })

  return { features, municipiosConsultados, municipiosConError }
}

async function complementarConOSM(nombresMunicipios, centro, radioKm) {
  try {
    const geojson = await buscarEquipamientosOSM(centro, radioKm, nombresMunicipios)
    const nombreUnico = nombresMunicipios.length === 1 ? nombresMunicipios[0] : ''
    return geojson.features.map((f) => enriquecer(f, { municipio: nombreUnico }))
  } catch (error) {
    console.warn('[OSM] no se pudo complementar', nombresMunicipios, error)
    return []
  }
}

async function capaDesdeOSM(centro, radioKm) {
  try {
    const geojson = await buscarEquipamientosOSM(centro, radioKm)
    const features = geojson.features.map((f) => enriquecer(f, { municipio: '' }))

    if (features.length === 0) {
      toast.error('No se encontraron equipamientos en esa zona')
      return null
    }

    return {
      id: crypto.randomUUID(),
      nombre: `Equipamientos OSM (radio ${radioKm} km)`,
      archivoOriginal: null,
      geojson: { type: 'FeatureCollection', features },
      crs: { epsg: 4326, fuente: 'OpenStreetMap Overpass' },
      visible: true,
      guardadaEnNube: false,
      origenAPI: true,
      municipiosConsultados: []
    }
  } catch (error) {
    console.warn('[OSM] falló el respaldo de equipamientos', error)
    toast.error('No se pudo consultar OpenStreetMap. Intenta de nuevo en unos segundos.')
    return null
  }
}

export async function capaDesdeZona(centro, radioKm, nombreCapaBuscada = 'Equipamientos Urbanos') {
  const municipios = municipiosEnZona(centro, radioKm)

  if (municipios.length === 0) {
    toast.error('Esta zona está fuera del Valle de Aburrá. Por ahora GeoAburrá solo cubre los 10 municipios del Valle.')
    return null
  }

  let features = []
  let municipiosConsultados = []
  let municipiosPendientes = municipios 
  let usoBaseDeDatos = false
  let usoOSM = false

  try {
    const respuesta = await equipamientosEnZona(centro, radioKm)
    const disponibles = new Set((respuesta.municipiosDisponibles || []).map(normalizar))

    features = (respuesta.features || []).map((f) => enriquecer(f))
    municipiosConsultados = [...new Set(features.map((f) => f.properties.municipio).filter(Boolean))]
    municipiosPendientes = municipios.filter((m) => !disponibles.has(normalizar(m.nombre)))
    usoBaseDeDatos = true
  } catch (error) {
    if (esSobrecarga(error)) {
      console.warn('[Supabase] saturado: no se consulta AMVA ni OSM en vivo', error)
      toast.error(MENSAJE_SATURADO, { id: 'servicio-saturado' })
      return null
    }
    console.warn('[Supabase] no se pudo leer la base, se usa el AMVA en vivo', error)
  }

  if (municipiosPendientes.length > 0) {
    const sinCapaAMVA = municipiosPendientes.filter((m) => MUNICIPIOS_SIN_CAPA_AMVA.has(normalizar(m.nombre)))
    const paraAMVA = municipiosPendientes.filter((m) => !MUNICIPIOS_SIN_CAPA_AMVA.has(normalizar(m.nombre)))

    let amva = { features: [], municipiosConsultados: [], municipiosConError: [] }
    if (paraAMVA.length > 0) {
      amva = await consultarAMVA(paraAMVA, centro, radioKm, nombreCapaBuscada)
    }
    features.push(...amva.features)
    municipiosConsultados = [...new Set([...municipiosConsultados, ...amva.municipiosConsultados])]

    const municipiosParaOSM = [...amva.municipiosConError, ...sinCapaAMVA.map((m) => m.nombre)]
    if (municipiosParaOSM.length > 0) {
      const extra = await complementarConOSM(municipiosParaOSM, centro, radioKm)

      if (extra.length > 0) {
        features.push(...extra)
        usoOSM = true
        toast.info(
          `${extra.length} equipamientos de OpenStreetMap para ${municipiosParaOSM.join(', ')} (el AMVA no tiene datos ahí)`
        )
      } else {
        toast.error(`No se pudo consultar: ${municipiosParaOSM.join(', ')}`)
      }
    }
  }

  if (features.length === 0) {
    if (usoBaseDeDatos) {
      toast.info('No hay equipamientos registrados en esta zona')
      return null
    }
    toast.info('No se encontraron equipamientos en las fuentes oficiales: probando con OpenStreetMap')
    return capaDesdeOSM(centro, radioKm)
  }

  const fuente = usoBaseDeDatos
    ? 'Base de datos propia (copia de AMVA ArcGIS REST)'
    : 'AMVA ArcGIS REST (f=geojson, reproyectado por el servidor)'

  const nuevaCapa = {
    id: crypto.randomUUID(),
    nombre: `${nombreCapaBuscada} (radio ${radioKm} km)`,
    archivoOriginal: null,
    geojson: { type: 'FeatureCollection', features },
    crs: { epsg: 4326, fuente: usoOSM ? `${fuente} + OpenStreetMap` : fuente },
    visible: true,
    guardadaEnNube: false,
    origenAPI: true,
    municipiosConsultados
  }

  return nuevaCapa
}