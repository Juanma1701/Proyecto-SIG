import {School, Hospital, Siren, Church, Bus, Recycle, Drama, Warehouse, Trees, Landmark, Lightbulb, Scale, Pin, UsersRound } from 'lucide-react'
export const CATEGORIAS_EQUIPAMIENTO = {
  'SALUD': { color: '#ef4444', icono: Hospital, etiqueta: 'Salud' },
  'EDUCACION': { color: '#2563eb', icono: School, etiqueta: 'Educación' },
  'RECREACION': { color: '#16a34a', icono: Trees, etiqueta: 'Recreación' },
  'CULTURA': { color: '#7c3aed', icono: Drama, etiqueta: 'Cultura' },
  'CULTO': { color: '#f59e0b', icono: Church, etiqueta: 'Culto' },
  'TRANSPORTE': { color: '#0d9488', icono: Bus, etiqueta: 'Transporte' },
  'SANITARIO': { color: '#65a30d', icono: Recycle, etiqueta: 'Sanitario' },
  'FUERZA PUBLICA': { color: '#1e293b', icono: Siren, etiqueta: 'Fuerza pública' },
  'ALMACENAMIENTO DEL SECTOR PRIMARIO': { color: '#92400e', icono: Warehouse, etiqueta: 'Almacenamiento' },
  'INSTITUCIONAL': { color: '#be185d', icono: Landmark, etiqueta: 'Institucional' },
  'BASICO COMUNITARIO': { color: '#78716c', icono: UsersRound, etiqueta: 'Básico comunitario' },
  'PREVENCION Y ATENCION DE DESASTRES': { color: '#ea580c', icono: Siren, etiqueta: 'Prevención de desastres' },
  'SERVICIOS PUBLICOS': { color: '#eab308', icono: Lightbulb, etiqueta: 'Servicios públicos' },
  'ADMINISTRACION DE JUSTICIA': { color: '#44403c', icono: Scale, etiqueta: 'Administración de justicia' },
  'DEFAULT': { color: '#94a3b8', icono: Pin, etiqueta: 'Sin categoría' }
}


const PALABRAS_CLAVE = [
  ['SALUD', ['hospital', 'salud', 'clinica', 'clínica', 'puesto de salud', 'centro de salud', 'ese ', 'ips', 'eps']],
  ['EDUCACION', ['educ', 'colegio', 'escuela', 'institucion educativa', 'institución educativa', 'jardin', 'jardín', 'universidad', 'ie ']],
  ['CULTO', ['iglesia', 'templo', 'parroquia', 'culto', 'capilla', 'catedral']],
  ['RECREACION', ['parque', 'recreac', 'deportivo', 'polideportivo', 'coliseo', 'cancha', 'estadio']],
  ['CULTURA', ['cultura', 'biblioteca', 'museo', 'teatro', 'casa de la cultura']],
  ['TRANSPORTE', ['transporte', 'terminal', 'estacion', 'estación', 'paradero']],
  ['SANITARIO', ['sanitario', 'relleno', 'residuos', 'reciclaje', 'aseo']],
  ['FUERZA PUBLICA', ['policia', 'policía', 'estacion de policia', 'fuerza publica', 'ejercito', 'ejército', 'bomberos', 'cai']],
  ['ALMACENAMIENTO DEL SECTOR PRIMARIO', ['almacenamiento', 'silo', 'centro de acopio', 'sector primario']],
  ['BASICO COMUNITARIO', ['comunitario', 'salon comunal', 'salón comunal', 'accion comunal', 'acción comunal']],
  ['PREVENCION Y ATENCION DE DESASTRES', ['desastre', 'emergencia', 'gestion del riesgo', 'gestión del riesgo', 'prevencion']],
  ['SERVICIOS PUBLICOS', ['acueducto', 'alcantarillado', 'energia', 'energía', 'servicios publicos', 'servicios públicos', 'epm']],
  ['ADMINISTRACION DE JUSTICIA', ['justicia', 'juzgado', 'fiscalia', 'fiscalía', 'notaria', 'notaría', 'inspeccion', 'inspección']],
  ['INSTITUCIONAL', ['institucional', 'alcaldia', 'alcaldía', 'administrativo', 'gobernacion', 'gobernación']],
]

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return ''
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Determina la categoría de un feature buscando palabras clave
 * en TODAS sus properties de texto (no solo un campo fijo), porque
 * distintos servicios ArcGIS del AMVA pueden nombrar el campo distinto
 * (SIMBOLOGIA, TIPO_EQUIP, NOMBRE, etc.) y el valor exacto varía
 * mucho de un municipio a otro.
 */
export function obtenerCategoria(feature) {
  // Si el feature ya trae categoría precalculada (AMVA en capaDesdeZona,
  // o Overpass en capaLugaresDesdeZona), se respeta esa en vez de
  // recalcularla por palabras clave — evita falsos positivos en
  // features que no son de equipamientos AMVA.
  if (feature?.properties?.categoria) return feature.properties.categoria

  const properties = feature?.properties || {}

  const textoCompleto = normalizarTexto(
    Object.values(properties).filter(v => typeof v === 'string' || typeof v === 'number').join(' ')
  )

  for (const [categoria, palabras] of PALABRAS_CLAVE) {
    if (palabras.some(palabra => textoCompleto.includes(palabra))) {
      return categoria
    }
  }

  return 'DEFAULT'
}

export function estiloCategoria(categoria) {
  return CATEGORIAS_EQUIPAMIENTO[categoria] || CATEGORIAS_EQUIPAMIENTO.DEFAULT
}

// Nombres de campo donde suele venir el nombre propio del equipamiento
// (varía por municipio/servicio, igual que con la categoría — por eso
// se prueban varios candidatos en orden de prioridad).
const CAMPOS_NOMBRE = ['NMG', 'NOMBRE', 'NOMBRE_EQUIP', 'NOM_EQUIP', 'NOMBRE_SITIO', 'NOMBRE_INSTITUCION', 'NOM']

// Nombres de campo donde suele venir la dirección.
const CAMPOS_DIRECCION = ['DIRECCION', 'DIRECCCION', 'DIR']

// Nombres de campo donde suele venir un teléfono de contacto.
const CAMPOS_TELEFONO = ['NO_TELEFONO', 'TELEFONO', 'TEL']

// Nombres de campo donde puede venir un sitio web (Overpass sí lo trae,
// el AMVA casi nunca).
const CAMPOS_WEBSITE = ['WEBSITE', 'SITIO_WEB', 'URL', 'PAGINA_WEB']

/**
 * Busca en las properties de un feature el primer campo cuyo nombre
 * (sin importar mayúsculas/minúsculas) coincida con alguno de los
 * candidatos, y que además tenga un valor no vacío. Se usa tanto para
 * el nombre como para la dirección y el teléfono.
 */
function buscarCampo(properties, candidatos) {
  const claves = Object.keys(properties)
  for (const candidato of candidatos) {
    const clave = claves.find(k => k.toUpperCase() === candidato)
    if (clave && properties[clave] !== null && properties[clave] !== undefined) {
      const valor = String(properties[clave]).trim()
      if (valor !== '') return valor
    }
  }
  return null
}

/**
 * Devuelve el nombre propio del equipamiento (ej. "Hospital General de
 * Sabaneta") si el servicio del AMVA lo trae, o null si no se
 * encontró ningún campo reconocible — en ese caso, la interfaz debe
 * caer de vuelta a mostrar solo la categoría genérica.
 */
export function obtenerNombreEquipamiento(feature) {
  return buscarCampo(feature?.properties || {}, CAMPOS_NOMBRE)
}

/** Devuelve la dirección del equipamiento, o null si no viene en el dato. */
export function obtenerDireccionEquipamiento(feature) {
  return buscarCampo(feature?.properties || {}, CAMPOS_DIRECCION)
}

/** Devuelve el teléfono del equipamiento, o null si no viene en el dato. */
export function obtenerTelefonoEquipamiento(feature) {
  return buscarCampo(feature?.properties || {}, CAMPOS_TELEFONO)
}

/** Devuelve el website del equipamiento si el dato lo trae, o null. */
export function obtenerWebsiteEquipamiento(feature) {
  return buscarCampo(feature?.properties || {}, CAMPOS_WEBSITE)
}