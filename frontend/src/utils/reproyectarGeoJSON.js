// src/utils/reproyectarGeoJSON.js
import proj4 from 'proj4'

// Mismas definiciones que cubre detectarCRS.js (PATRONES_EPSG)
proj4.defs('EPSG:9377',
  '+proj=tmerc +lat_0=4.596200417 +lon_0=-73.11341833333333 ' +
  '+k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 ' +
  '+towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
)
proj4.defs('EPSG:3116',
  '+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750791666667 ' +
  '+k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 ' +
  '+towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
)
proj4.defs('EPSG:3117',
  '+proj=tmerc +lat_0=4.596200417 +lon_0=-71.60250791666666 ' +
  '+k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 ' +
  '+towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
)
proj4.defs('EPSG:3115',
  '+proj=tmerc +lat_0=4.596200417 +lon_0=-77.07750791666667 ' +
  '+k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 ' +
  '+towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
)
proj4.defs('EPSG:32618',
  '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs'
)
// EPSG:4326 ya viene incluido por defecto en proj4 (WGS84)

/**
 * Transforma recursivamente cualquier array de coordenadas
 * (Point, LineString, Polygon, Multi*, con cualquier nivel de anidación)
 * de un EPSG de origen a EPSG:4326.
 */
function transformarCoordenadas(coords, epsgOrigen) {
  // Un punto es [x, y] o [x, y, z] — el nivel más profundo, siempre numérico
  if (typeof coords[0] === 'number') {
    const [x, y] = coords
    const [lng, lat] = proj4(`EPSG:${epsgOrigen}`, 'EPSG:4326', [x, y])
    return coords.length > 2 ? [lng, lat, coords[2]] : [lng, lat]
  }
  // Si no, es un array de arrays: recursión
  return coords.map((c) => transformarCoordenadas(c, epsgOrigen))
}

function transformarGeometria(geometria, epsgOrigen) {
  if (!geometria) return geometria

  if (geometria.type === 'GeometryCollection') {
    return {
      ...geometria,
      geometries: geometria.geometries.map((g) => transformarGeometria(g, epsgOrigen))
    }
  }

  return {
    ...geometria,
    coordinates: transformarCoordenadas(geometria.coordinates, epsgOrigen)
  }
}

/**
 * Reproyecta un GeoJSON completo (Feature, FeatureCollection o Geometry suelta)
 * de epsgOrigen a EPSG:4326. Si ya es 4326, lo devuelve intacto.
 */
export function reproyectarGeoJSON(geojson, epsgOrigen) {
  if (!epsgOrigen || epsgOrigen === 4326) return geojson

  if (geojson.type === 'FeatureCollection') {
    return {
      ...geojson,
      features: geojson.features.map((f) => ({
        ...f,
        geometry: transformarGeometria(f.geometry, epsgOrigen)
      }))
    }
  }

  if (geojson.type === 'Feature') {
    return { ...geojson, geometry: transformarGeometria(geojson.geometry, epsgOrigen) }
  }

  // Geometry suelta (Point, Polygon, etc. sin envoltorio Feature)
  return transformarGeometria(geojson, epsgOrigen)
}