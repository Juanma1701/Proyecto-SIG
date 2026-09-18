// src/utils/detectarCRS.js
import JSZip from 'jszip'

/**
 * Tabla de coincidencias entre fragmentos de texto de un WKT (.prj)
 * y su código EPSG. No es un parser WKT completo (eso requeriría una
 * librería mucho más pesada) — es suficiente para reconocer los
 * sistemas más comunes en datos colombianos/de Latinoamérica.
 */
const PATRONES_EPSG = [
  { patron: /MAGNA.*ORIGEN.*NACIONAL|MAGNA_SIRGAS_Origen_Nacional/i, epsg: 9377 },
  { patron: /MAGNA.*BOGOTA|MAGNA_Colombia_Bogota/i, epsg: 3116 },
  { patron: /MAGNA.*ESTE|MAGNA_Colombia_Este/i, epsg: 3117 },
  { patron: /MAGNA.*OESTE|MAGNA_Colombia_Oeste/i, epsg: 3115 },
  { patron: /WGS_1984_UTM_Zone_18N|UTM.*Zone.*18.*N/i, epsg: 32618 },
  { patron: /WGS_1984|WGS84|World Geodetic System 1984/i, epsg: 4326 },
]

/**
 * Intenta reconocer el EPSG a partir del texto WKT de un archivo .prj,
 * comparando contra patrones conocidos. Si no reconoce ninguno,
 * devuelve null en el epsg pero conserva el WKT crudo como referencia.
 */
function interpretarWKT(wktTexto) {
  for (const { patron, epsg } of PATRONES_EPSG) {
    if (patron.test(wktTexto)) {
      return { epsg, fuente: `archivo .prj (reconocido: EPSG:${epsg})` }
    }
  }
  return { epsg: null, fuente: `archivo .prj (sistema no reconocido): ${wktTexto.slice(0, 80)}...` }
}

/**
 * Detecta el CRS de un GeoJSON ya parseado (objeto JS), revisando la
 * propiedad `crs` del estándar antiguo de GeoJSON (RFC anterior a 2016).
 * El estándar actual (RFC 7946) asume siempre EPSG:4326 y no declara
 * `crs`, así que si no existe esa propiedad, se asume 4326 por defecto.
 */
function detectarCRSGeoJSON(geojson) {
  const crsProp = geojson?.crs?.properties?.name

  if (!crsProp) {
    return { epsg: 4326, fuente: 'GeoJSON sin propiedad crs (asumido EPSG:4326 por estándar)' }
  }

  // El nombre suele venir como "urn:ogc:def:crs:EPSG::3116" o similar
  const match = crsProp.match(/EPSG::?(\d+)/i)
  if (match) {
    return { epsg: parseInt(match[1], 10), fuente: 'propiedad crs del GeoJSON' }
  }

  return { epsg: null, fuente: `propiedad crs no reconocida: ${crsProp}` }
}

/**
 * Detecta el CRS de un archivo Shapefile (.zip), buscando y leyendo
 * el archivo .prj dentro del zip. Si no hay .prj, no se puede saber
 * el sistema real, así que se avisa explícitamente en vez de asumir.
 */
async function detectarCRSShapefile(archivoZip) {
  try {
    const zip = await JSZip.loadAsync(archivoZip)
    const archivoPrj = Object.values(zip.files).find((f) => f.name.toLowerCase().endsWith('.prj'))

    if (!archivoPrj) {
      return { epsg: null, fuente: 'shapefile sin archivo .prj (sistema desconocido)' }
    }

    const wktTexto = await archivoPrj.async('text')
    return interpretarWKT(wktTexto)
  } catch (error) {
    console.error('[detectarCRS] error leyendo .prj del shapefile', error)
    return { epsg: null, fuente: 'no se pudo leer el .prj del shapefile' }
  }
}

/**
 * Punto de entrada único: detecta el CRS de una capa según su tipo de origen.
 *
 * @param {object|File} entrada - el GeoJSON ya parseado, o el archivo .zip original
 * @param {'geojson'|'shapefile'} tipo
 * @returns {{ epsg: number|null, fuente: string } | Promise<{ epsg: number|null, fuente: string }>}
 */
export function detectarCRS(entrada, tipo) {
  if (tipo === 'geojson') {
    return detectarCRSGeoJSON(entrada)
  }

  if (tipo === 'shapefile') {
    return detectarCRSShapefile(entrada)
  }

  return { epsg: 4326, fuente: 'tipo no reconocido (asumido EPSG:4326)' }
}