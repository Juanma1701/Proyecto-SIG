import JSZip from 'jszip'

const PATRONES_EPSG = [
  [/magna.*origen.*nacional/, 9377],
  [/magna.*colombia.*bogota/, 3116],
  [/magna.*colombia.*(?:este.?central|east.?central)/, 3117],
  [/magna.*colombia.*(?:este|east)/, 3118],
  [/magna.*colombia.*(?:oeste|west)/, 3115],
  [/wgs_1984_utm_zone_18n|utm.*zone.*18.*n/, 32618],
  [/wgs.?84|world.?geodetic.?system.?1984/, 4326],
]

function extraerEPSG(texto) {
  if (typeof texto !== 'string') return null

  const patrones = [
    /\/EPSG\/\d+\/(\d+)\s*$/i,
    /EPSG::(\d+)\s*$/i,
    /EPSG:(?:\d+\.\d+:)?(\d+)\s*$/i,
    /^EPSG:(\d+)\s*$/i,
  ]

  for (const patron of patrones) {
    const coincidencia = texto.match(patron)
    if (coincidencia) return Number(coincidencia[1])
  }

  return /CRS84/i.test(texto) ? 4326 : null
}

function interpretarWKT(wktTexto) {
  if (typeof wktTexto !== 'string') {
    return { epsg: null, fuente: 'archivo .prj con contenido inválido' }
  }

  const autoridad = wktTexto.match(
    /(?:AUTHORITY|ID)\s*\[\s*["']EPSG["']\s*,\s*["']?(\d+)/i
  )

  if (autoridad) {
    const epsg = Number(autoridad[1])
    return { epsg, fuente: `archivo .prj (AUTHORITY EPSG:${epsg})` }
  }

  const texto = wktTexto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  for (const [patron, epsg] of PATRONES_EPSG) {
    if (patron.test(texto)) {
      return { epsg, fuente: `archivo .prj (reconocido: EPSG:${epsg})` }
    }
  }

  if (/crs84/i.test(texto)) {
    return { epsg: 4326, fuente: 'archivo .prj (CRS84)' }
  }

  return { epsg: null, fuente: 'sistema no reconocido en el archivo .prj' }
}

const MUESTRA_MAXIMA = 200

function posicionEnGrados(posicion) {
  return Math.abs(posicion[0]) <= 180 && Math.abs(posicion[1]) <= 90
}

function revisarGeometria(geometria, estado) {
  if (!geometria) return true
  if (estado.vistas >= MUESTRA_MAXIMA) return true

  if (geometria.type === 'GeometryCollection') {
    return (geometria.geometries || []).every((hija) => revisarGeometria(hija, estado))
  }

  const recorrer = (coordenadas) => {
    if (estado.vistas >= MUESTRA_MAXIMA) return true
    if (!Array.isArray(coordenadas) || coordenadas.length === 0) return true

    if (typeof coordenadas[0] === 'number') {
      estado.vistas += 1
      return posicionEnGrados(coordenadas)
    }

    return coordenadas.every(recorrer)
  }

  return recorrer(geometria.coordinates)
}

function parecenGrados(geojson) {
  const estado = { vistas: 0 }
  const geometrias = (geojson?.features || []).map((feature) => feature?.geometry)
  return geometrias.every((geometria) => revisarGeometria(geometria, estado))
}

function detectarCRSGeoJSON(geojson) {
  const crsProp = geojson?.crs?.properties?.name

  if (!crsProp) {
    if (!parecenGrados(geojson)) {
      return {
        epsg: null,
        fuente: 'las coordenadas no son grados: el archivo parece estar en un sistema proyectado (metros) pero no declara su EPSG',
      }
    }

    return { epsg: 4326, fuente: 'GeoJSON sin propiedad crs (WGS84 por estándar)' }
  }

  const epsg = extraerEPSG(crsProp)
  if (epsg) {
    return { epsg, fuente: 'propiedad crs del GeoJSON' }
  }

  return { epsg: null, fuente: `propiedad crs no reconocida: ${String(crsProp)}` }
}

async function detectarCRSShapefile(archivoZip) {
  try {
    const zip = await JSZip.loadAsync(archivoZip)
    const archivoPrj = Object.values(zip.files).find((archivo) =>
      archivo.name.toLowerCase().endsWith('.prj')
    )

    if (!archivoPrj) {
      return { epsg: null, fuente: 'shapefile sin archivo .prj' }
    }

    return interpretarWKT(await archivoPrj.async('text'))
  } catch {
    return { epsg: null, fuente: 'no se pudo leer el archivo .prj del shapefile' }
  }
}

export function detectarCRS(entrada, tipo) {
  if (tipo === 'geojson') {
    return detectarCRSGeoJSON(entrada)
  }

  if (tipo === 'shapefile') {
    return detectarCRSShapefile(entrada)
  }

  return { epsg: null, fuente: 'tipo de entrada no soportado' }
}
