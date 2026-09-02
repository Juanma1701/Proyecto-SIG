import {School, Hospital, Siren, Church, Bus, Recycle, Drama, Warehouse, Trees, Landmark, Lightbulb, Scale, Pin, UsersRound } from 'lucide-react'
export const CATEGORIAS_EQUIPAMIENTO = {
  'SALUD': { color: '#ef4444', icono: Hospital, etiqueta: 'Salud' },
  'EDUCACION': { color: '#3b82f6', icono: School, etiqueta: 'Educación' },
  'RECREACION': { color: '#22c55e', icono: Trees, etiqueta: 'Recreación' },
  'CULTURA': { color: '#a855f7', icono: Drama, etiqueta: 'Cultura' },
  'CULTO': { color: '#f59e0b', icono: Church, etiqueta: 'Culto' },
  'TRANSPORTE': { color: '#06b6d4', icono: Bus, etiqueta: 'Transporte' },
  'SANITARIO': { color: '#84cc16', icono: Recycle, etiqueta: 'Sanitario' },
  'FUERZA PUBLICA': { color: '#1e40af', icono: Siren, etiqueta: 'Fuerza pública' },
  'ALMACENAMIENTO DEL SECTOR PRIMARIO': { color: '#92400e', icono: Warehouse, etiqueta: 'Almacenamiento' },
  'INSTITUCIONAL': { color: '#175cbd', icono: Landmark, etiqueta: 'Institucional' },
  'BASICO COMUNITARIO': { color: '#0891b2', icono: UsersRound, etiqueta: 'Básico comunitario' },
  'PREVENCION Y ATENCION DE DESASTRES': { color: '#dc2626', icono: Siren, etiqueta: 'Prevención de desastres' },
  'SERVICIOS PUBLICOS': { color: '#eab308', icono: Lightbulb, etiqueta: 'Servicios públicos' },
  'ADMINISTRACION DE JUSTICIA': { color: '#7c2d12', icono: Scale, etiqueta: 'Administración de justicia' },
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
  const properties = feature?.properties || {}

  // Junta todos los valores de texto del feature en un solo string
  // para buscar palabras clave sin depender de saber el nombre exacto del campo.
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