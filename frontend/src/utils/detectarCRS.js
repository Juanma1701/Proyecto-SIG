import proj4 from 'proj4'

// Para GeoJSON: por spec siempre es 4326, salvo campo "crs" heredado
export function detectarCRSGeoJSON(geojson) {
  if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name) {
    const nombre = geojson.crs.properties.name // ej: "urn:ogc:def:crs:EPSG::32618"
    const match = nombre.match(/EPSG::?(\d+)/)
    if (match) return { epsg: parseInt(match[1]), fuente: 'campo crs del GeoJSON' }
  }
  return { epsg: 4326, fuente: 'estándar GeoJSON (RFC 7946)' }
}

// Para Shapefile: leer el .prj dentro del .zip
export async function detectarCRSShapefile(archivoZip) {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(archivoZip)
  const prjFile = Object.keys(zip.files).find(n => n.endsWith('.prj'))

  if (!prjFile) return { epsg: 4326, fuente: 'sin .prj, se asume WGS84' }

  const wkt = await zip.files[prjFile].async('text')
  const epsg = await resolverEPSGDesdeWKT(wkt)
  return { epsg: epsg || 4326, fuente: `.prj (${wkt.slice(0, 40)}...)` }
}

// Consulta a epsg.io para resolver el código EPSG a partir del WKT
async function resolverEPSGDesdeWKT(wkt) {
  try {
    const res = await fetch(`https://epsg.io/?format=json&q=${encodeURIComponent(wkt)}`)
    const data = await res.json()
    if (data.results && data.results.length > 0) {
      return parseInt(data.results[0].code)
    }
  } catch (e) {
    console.warn('No se pudo resolver EPSG desde epsg.io', e)
  }
  return 4326 // desconocido
}

export async function detectarCRS(input, tipo) {
  if (tipo === 'geojson') return detectarCRSGeoJSON(input)
  if (tipo === 'shapefile') return await detectarCRSShapefile(input)
  return { epsg: 4326, fuente: 'desconocido' }
}