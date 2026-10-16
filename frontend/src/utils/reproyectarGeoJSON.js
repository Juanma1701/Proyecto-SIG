import proj4 from 'proj4'
import { registrarDefinicionesEPSG, obtenerEPSG } from './catalogoEPSG'

registrarDefinicionesEPSG()

const TIPOS_GEOMETRIA = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
])

function validarCoordenadas(coordenadas) {
  if (!Array.isArray(coordenadas) || coordenadas.length === 0) {
    throw new Error('Una geometría contiene coordenadas inválidas')
  }

  if (typeof coordenadas[0] === 'number') {
    if (coordenadas.length < 2) {
      throw new Error('Una geometría contiene coordenadas inválidas')
    }

    if (!Number.isFinite(coordenadas[0]) || !Number.isFinite(coordenadas[1])) {
      throw new Error('Una geometría contiene coordenadas no numéricas')
    }

    return
  }

  coordenadas.forEach(validarCoordenadas)
}

function validarGeometria(geometria) {
  if (geometria === null) return

  if (!geometria || typeof geometria !== 'object' || !TIPOS_GEOMETRIA.has(geometria.type)) {
    throw new Error(`Tipo de geometría no soportado: ${geometria?.type || 'desconocido'}`)
  }

  if (geometria.type === 'GeometryCollection') {
    if (!Array.isArray(geometria.geometries) || geometria.geometries.length === 0) {
      throw new Error('GeometryCollection no contiene geometrías')
    }
    geometria.geometries.forEach(validarGeometria)
    return
  }

  validarCoordenadas(geometria.coordinates)
}

export function normalizarGeoJSON(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    throw new Error('El archivo no contiene un objeto GeoJSON válido')
  }

  if (entrada.type === 'FeatureCollection') {
    if (!Array.isArray(entrada.features)) {
      throw new Error('FeatureCollection no contiene el array features')
    }

    const features = entrada.features.map((feature) => {
      if (!feature || feature.type !== 'Feature') {
        throw new Error('FeatureCollection contiene un elemento que no es Feature')
      }
      validarGeometria(feature.geometry)
      return {
        ...feature,
        properties: feature.properties || {},
      }
    })

    if (!features.some((feature) => feature.geometry !== null)) {
      throw new Error('El GeoJSON no contiene geometrías dibujables')
    }

    return {
      ...entrada,
      features,
    }
  }

  if (entrada.type === 'Feature') {
    validarGeometria(entrada.geometry)
    if (entrada.geometry === null) {
      throw new Error('La Feature no contiene una geometría')
    }

    return {
      type: 'FeatureCollection',
      features: [{
        ...entrada,
        properties: entrada.properties || {},
      }],
    }
  }

  if (TIPOS_GEOMETRIA.has(entrada.type)) {
    validarGeometria(entrada)
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: entrada,
      }],
    }
  }

  throw new Error(`Tipo GeoJSON no soportado: ${entrada.type || 'desconocido'}`)
}

function transformarCoordenadas(coordenadas, epsgOrigen, epsgDestino) {
  if (typeof coordenadas[0] === 'number') {
    const [x, y, ...extra] = coordenadas
    const [lng, lat] = proj4(`EPSG:${epsgOrigen}`, `EPSG:${epsgDestino}`, [x, y])
    return [lng, lat, ...extra]
  }

  return coordenadas.map((coordenada) =>
    transformarCoordenadas(coordenada, epsgOrigen, epsgDestino)
  )
}

function transformarGeometria(geometria, epsgOrigen, epsgDestino) {
  if (!geometria) return geometria

  if (geometria.type === 'GeometryCollection') {
    return {
      ...geometria,
      geometries: geometria.geometries.map((geometriaHija) =>
        transformarGeometria(geometriaHija, epsgOrigen, epsgDestino)
      ),
    }
  }

  return {
    ...geometria,
    coordinates: transformarCoordenadas(geometria.coordinates, epsgOrigen, epsgDestino),
  }
}

export function reproyectarGeoJSON(geojson, epsgOrigen, epsgDestino = 4326) {
  const origen = Number(epsgOrigen)
  const destino = Number(epsgDestino)

  if (!Number.isInteger(origen) || !Number.isInteger(destino)) {
    throw new Error('El EPSG de origen y destino debe ser un número entero')
  }

  if (origen === destino) return geojson

  const normalizado = normalizarGeoJSON(geojson)

  try {
    if (normalizado.type === 'FeatureCollection') {
      return {
        ...normalizado,
        features: normalizado.features.map((feature) => ({
          ...feature,
          geometry: transformarGeometria(feature.geometry, origen, destino),
        })),
      }
    }

    return transformarGeometria(normalizado, origen, destino)
  } catch (error) {
    throw new Error(
      `No se pudo reproyectar de EPSG:${origen} a EPSG:${destino}: ${error.message}`,
      { cause: error }
    )
  }
}

export async function asegurarDefinicionEPSG(epsg) {
  const codigo = Number(epsg)

  if (!Number.isInteger(codigo) || codigo <= 0) {
    throw new Error('El código EPSG debe ser un número entero positivo')
  }

  const nombre = `EPSG:${codigo}`

  if (obtenerEPSG(codigo)) return
  if (proj4.defs(nombre)) return

  const response = await fetch(`https://epsg.io/${codigo}.proj4`)
  if (!response.ok) {
    throw new Error(`No se pudo obtener la definición de ${nombre}`)
  }

  const definicion = (await response.text()).trim()
  if (!definicion || definicion.startsWith('<')) {
    throw new Error(`La definición de ${nombre} no es válida`)
  }

  proj4.defs(nombre, definicion)
}
