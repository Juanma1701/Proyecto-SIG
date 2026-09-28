import proj4 from 'proj4'

// Fuente única de verdad sobre los sistemas de referencia que la app soporta.
//
// Antes esta información vivía repartida en dos lugares que se desincronizaban:
// la tabla de definiciones proj4 (reproyectarGeoJSON.js) y la lista
// SISTEMAS_PROYECTADOS (PanelCapas.jsx). Un EPSG podía estar definido en la
// primera tabla y faltar en la segunda, y entonces el motor lo trataba como
// geográfico: volcaba metros sobre la geometría viva de la capa y rompía el
// mapa. Aquí vive el par definición + clasificación juntos, así no puede pasar.

export const GRUPOS_EPSG = [
  { id: 'geograficos', nombre: 'Geográficos (grados decimales)' },
  { id: 'colombia-magna', nombre: 'Colombia — MAGNA-SIRGAS (metros)' },
  { id: 'colombia-utm', nombre: 'Colombia — UTM WGS 84 (metros)' },
  { id: 'web', nombre: 'Web / global' },
]

export const CATALOGO_EPSG = [
  {
    epsg: 4326,
    nombre: 'WGS 84',
    grupo: 'geograficos',
    proyectado: false,
    unidades: 'grados',
    definicion: '+proj=longlat +datum=WGS84 +no_defs',
  },
  {
    epsg: 9377,
    nombre: 'Colombia Origen Nacional',
    grupo: 'colombia-magna',
    proyectado: true,
    unidades: 'metros',
    definicion:
      '+proj=tmerc +lat_0=4 +lon_0=-73 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  },
  {
    epsg: 3114,
    nombre: 'Colombia Oeste (centrado en Cali)',
    grupo: 'colombia-magna',
    proyectado: true,
    unidades: 'metros',
    definicion:
      '+proj=tmerc +lat_0=4.59620041666667 +lon_0=-80.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  },
  {
    epsg: 3115,
    nombre: 'Colombia Oeste',
    grupo: 'colombia-magna',
    proyectado: true,
    unidades: 'metros',
    definicion:
      '+proj=tmerc +lat_0=4.59620041666667 +lon_0=-77.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  },
  {
    epsg: 3116,
    nombre: 'Colombia Bogotá',
    grupo: 'colombia-magna',
    proyectado: true,
    unidades: 'metros',
    definicion:
      '+proj=tmerc +lat_0=4.59620041666667 +lon_0=-74.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  },
  {
    epsg: 31119,
    nombre: 'Colombia Bogotá (zona 5.000.000/2.000.000)',
    grupo: 'colombia-magna',
    proyectado: true,
    unidades: 'metros',
    definicion:
      '+proj=tmerc +lat_0=4.59620041666667 +lon_0=-74.0775079166667 +k=1 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  },
  {
    epsg: 3117,
    nombre: 'Colombia Este Central',
    grupo: 'colombia-magna',
    proyectado: true,
    unidades: 'metros',
    definicion:
      '+proj=tmerc +lat_0=4.59620041666667 +lon_0=-71.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  },
  {
    epsg: 3118,
    nombre: 'Colombia Este',
    grupo: 'colombia-magna',
    proyectado: true,
    unidades: 'metros',
    definicion:
      '+proj=tmerc +lat_0=4.59620041666667 +lon_0=-68.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  },
  {
    epsg: 32618,
    nombre: 'UTM zona 18N (WGS 84)',
    grupo: 'colombia-utm',
    proyectado: true,
    unidades: 'metros',
    definicion: '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs',
  },
  {
    epsg: 32619,
    nombre: 'UTM zona 19N (WGS 84)',
    grupo: 'colombia-utm',
    proyectado: true,
    unidades: 'metros',
    definicion: '+proj=utm +zone=19 +datum=WGS84 +units=m +no_defs',
  },
  {
    epsg: 3857,
    nombre: 'WGS 84 / Pseudo-Mercator (Web Mercator)',
    grupo: 'web',
    proyectado: true,
    unidades: 'metros',
    definicion:
      '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs',
  },
]

const POR_EPSG = new Map(CATALOGO_EPSG.map((sistema) => [sistema.epsg, sistema]))

export function obtenerEPSG(epsg) {
  const codigo = Number(epsg)
  if (!Number.isInteger(codigo)) return null
  return POR_EPSG.get(codigo) || null
}

export function esProyectado(epsg) {
  return obtenerEPSG(epsg)?.proyectado === true
}

export function esGeografico(epsg) {
  return obtenerEPSG(epsg)?.proyectado === false
}

// Leaflet dibuja exclusivamente en grados: cualquier sistema proyectado llega
// solo como descarga, nunca reemplaza la geometría que se está pintando.
export function esDibujableEnMapa(epsg) {
  return esGeografico(epsg)
}

export function sistemasPorGrupo() {
  return GRUPOS_EPSG.map((grupo) => ({
    ...grupo,
    sistemas: CATALOGO_EPSG.filter((sistema) => sistema.grupo === grupo.id),
  })).filter((grupo) => grupo.sistemas.length > 0)
}

export function etiquetaEPSG(epsg) {
  const sistema = obtenerEPSG(epsg)
  if (!sistema) return `EPSG:${epsg} (no catalogado)`
  return `EPSG:${sistema.epsg} — ${sistema.nombre} (${sistema.unidades})`
}

export function registrarDefinicionesEPSG() {
  for (const sistema of CATALOGO_EPSG) {
    proj4.defs(`EPSG:${sistema.epsg}`, sistema.definicion)
  }
}
