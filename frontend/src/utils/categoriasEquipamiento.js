import {School, Hospital, Siren, Church, Bus, Recycle, Drama, Warehouse, Trees, Landmark, Lightbulb, Scale, Pin, UsersRound, GraduationCap, BookOpen, Baby, Wrench, Stethoscope, PawPrint, HeartPulse, Building2, Flower2 } from 'lucide-react'
export const CATEGORIAS_EQUIPAMIENTO = {
  'SALUD': { color: '#ef4444', icono: Hospital, etiqueta: 'Salud' },
  'SALUD_HOSPITAL': { color: '#dc2626', icono: Hospital, etiqueta: 'Hospitales' },
  'SALUD_CLINICA': { color: '#f43f5e', icono: Stethoscope, etiqueta: 'Clínicas' },
  'SALUD_PUESTO': { color: '#fb7185', icono: HeartPulse, etiqueta: 'Centros y puestos de salud' },
  'SALUD_VETERINARIA': { color: '#c026d3', icono: PawPrint, etiqueta: 'Veterinarias' },
  'SALUD_OTROS': { color: '#9f1239', icono: Hospital, etiqueta: 'Otros de salud' },
  'EDUCACION': { color: '#3b82f6', icono: School, etiqueta: 'Educación (general)' },
  'EDUCACION_UNIVERSIDAD': { color: '#1e40af', icono: GraduationCap, etiqueta: 'Universidades' },
  'EDUCACION_COLEGIO': { color: '#2563eb', icono: School, etiqueta: 'Colegios' },
  'EDUCACION_ESCUELA': { color: '#0ea5e9', icono: BookOpen, etiqueta: 'Escuelas' },
  'EDUCACION_JARDIN': { color: '#ec4899', icono: Baby, etiqueta: 'Jardines infantiles' },
  'EDUCACION_FORMACION': { color: '#6366f1', icono: Wrench, etiqueta: 'Centros de formación' },
  'RECREACION': { color: '#16a34a', icono: Trees, etiqueta: 'Recreación' },
  'CULTURA': { color: '#7c3aed', icono: Drama, etiqueta: 'Cultura' },
  'CULTO': { color: '#f59e0b', icono: Church, etiqueta: 'Culto' },
  'CULTO_PARROQUIA': { color: '#d97706', icono: Church, etiqueta: 'Parroquias' },
  'CULTO_IGLESIA': { color: '#f59e0b', icono: Church, etiqueta: 'Iglesias y templos' },
  'CULTO_CAPILLA': { color: '#fbbf24', icono: Church, etiqueta: 'Capillas' },
  'CULTO_CRISTIANO': { color: '#0e7490', icono: Church, etiqueta: 'Iglesias cristianas y ministerios' },
  'CULTO_CONVENTO': { color: '#b45309', icono: Building2, etiqueta: 'Conventos y seminarios' },
  'CULTO_FUNERARIO': { color: '#6b7280', icono: Flower2, etiqueta: 'Servicios funerarios' },
  'CULTO_OTROS': { color: '#ca8a04', icono: Church, etiqueta: 'Otros de culto' },
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

const SUBCATEGORIAS_EDUCACION = [
  ['EDUCACION_UNIVERSIDAD', /\b(universidad|universitari[ao]|politecnico|tecnologico)\b/],
  ['EDUCACION_JARDIN', /\b(jardin|infantil|preescolar|guarderia|primera infancia|buen comienzo|sala cuna)\b/],
  ['EDUCACION_FORMACION', /\b(sena|formacion|capacitacion|academia)\b/],
  ['EDUCACION_COLEGIO', /\b(colegio|liceo|gimnasio|institucion educativa|i\.?\s?e)\b/],
  ['EDUCACION_ESCUELA', /\b(escuela|escuelas|centro educativo)\b/],
]

const REFINAMIENTOS = {
  CULTO: {
    defecto: 'CULTO_OTROS',
    reglas: [
      ['CULTO_FUNERARIO', /\b(morgue|morgues|anfiteatro|anfiteatros|cadaver|cadaveres|cementerio|cementerios|funerari[ao]s?|exequias|crematorio|crematorios|velacion|jardines? de paz)\b/],
      ['CULTO_CONVENTO', /\b(convento|conventos|seminario|seminarios|monasterio|monasterios|claustro|noviciado|hermanas|hermanos|oblatas|carmelitas?|franciscan[ao]s?|salesian[ao]s?|jesuitas?|dominic[ao]s?|comunidad religiosa|casa de retiro)\b/],
      ['CULTO_PARROQUIA', /\b(parroquia|parroquias|parroquial|casa cural|vicaria)\b/],
      ['CULTO_CAPILLA', /\b(capilla|capillas|ermita|oratorio|gruta)\b/],
      ['CULTO_CRISTIANO', /\b(ministerio|ministerios|mision|misiones|cuadrangular|pentecostal\w*|evangelic[ao]s?|cristian[ao]s?|bautista|adventista|menonita|testigos de jehova|idmji|iglesia de dios|adoracion|avivamiento|tabernaculo|casa de oracion|centro cristiano|salon del reino)\b/],
      ['CULTO_IGLESIA', /\b(iglesia|iglesias|templo|templos|catedral|basilica|santuario|nuestra senora|ns|virgen|sagrado corazon|senor|eucaristi\w*|ascension|candelaria|reconciliacion|inmaculada|divino nino|san|santa|santo)\b/],
    ]
  },
  SALUD: {
    defecto: 'SALUD_OTROS',
    reglas: [
      ['SALUD_VETERINARIA', /\b(veterinari[ao]s?|zoonosis|mascotas?)\b/],
      ['SALUD_HOSPITAL', /\b(hospital|hospitales|hospitalari[ao]|ese|empresa social del estado)\b|e\.s\.e/],
      ['SALUD_CLINICA', /\b(clinica|clinicas|policlinica|policlinico|ips|eps|centro medico|consultorio|odontolog\w*|centro de fracturas|centro de especialistas|torre medica|urgencias|instituto del corazon|medicina alternativa|salud integral|seguro social|atencion inmediata)\b|i\.p\.s|e\.p\.s/],
      ['SALUD_PUESTO', /\b(puesto de salud|punto de salud|centro de salud|centro de atencion|unidad primaria|unidad intermedia|unidad de atencion|upa|upss|caps|cami|uba|ubas|cis|centro integral de salud)\b|c\.a\.[ab]\b/],
    ]
  }
}

const PATRON_VETERINARIA = /\b(veterinari\w*|zoonosis|vet|clinica (?:de |para )?(?:mascotas|animales|caninos|felinos)|hospital (?:de |para )?(?:mascotas|animales))\b/
const PATRON_NO_VETERINARIA = /\b(universidad|facultad|colegio|escuela|institucion educativa|politecnico|sena)\b/

const CAMPOS_CLASIFICACION = new Set([
  'NOMBRE', 'NMG', 'NOMBRE_EQUIP', 'NOM_EQUIP', 'NOMBRE_SITIO', 'NOMBRE_INSTITUCION', 'NOM',
  'TIPO', 'SIMBOLOGIA', 'COMPONENTES'
])

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return ''
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function textoDeFeature(feature) {
  const properties = feature?.properties || {}
  return normalizarTexto(
    Object.values(properties).filter(v => typeof v === 'string' || typeof v === 'number').join(' ')
  )
}

function textoClasificacion(feature) {
  const properties = feature?.properties || {}
  const partes = []
  Object.keys(properties).forEach((clave) => {
    if (!CAMPOS_CLASIFICACION.has(clave.toUpperCase())) return
    const valor = properties[clave]
    if (typeof valor === 'string' || typeof valor === 'number') partes.push(valor)
  })
  return normalizarTexto(partes.join(' '))
}

function esVeterinaria(feature) {
  const texto = textoClasificacion(feature)
  return PATRON_VETERINARIA.test(texto) && !PATRON_NO_VETERINARIA.test(texto)
}

function refinarEducacion(feature, texto) {
  const t = texto ?? textoDeFeature(feature)
  for (const [categoria, patron] of SUBCATEGORIAS_EDUCACION) {
    if (patron.test(t)) return categoria
  }
  return 'EDUCACION'
}

function refinarCategoria(base, feature) {
  const refinamiento = REFINAMIENTOS[base]
  if (!refinamiento) return base
  const texto = textoClasificacion(feature)
  for (const [categoria, patron] of refinamiento.reglas) {
    if (patron.test(texto)) return categoria
  }
  return refinamiento.defecto
}

export function esEducacion(categoria) {
  return typeof categoria === 'string' && categoria.startsWith('EDUCACION')
}

export function obtenerCategoria(feature) {

  const precalculada = feature?.properties?.categoria

  const baseEsEquipamiento = !precalculada || CATEGORIAS_EQUIPAMIENTO[precalculada] !== undefined
  if (baseEsEquipamiento && !esEducacion(precalculada) && esVeterinaria(feature)) {
    return 'SALUD_VETERINARIA'
  }

  if (precalculada) {
    if (precalculada === 'EDUCACION') return refinarEducacion(feature)
    return refinarCategoria(precalculada, feature)
  }

  const textoCompleto = textoDeFeature(feature)

  for (const [categoria, palabras] of PALABRAS_CLAVE) {
    if (palabras.some(palabra => textoCompleto.includes(palabra))) {
      if (categoria === 'EDUCACION') return refinarEducacion(feature, textoCompleto)
      return refinarCategoria(categoria, feature)
    }
  }

  return 'DEFAULT'
}

export function estiloCategoria(categoria) {
  return CATEGORIAS_EQUIPAMIENTO[categoria] || CATEGORIAS_EQUIPAMIENTO.DEFAULT
}

const CAMPOS_NOMBRE = ['NMG', 'NOMBRE', 'NOMBRE_EQUIP', 'NOM_EQUIP', 'NOMBRE_SITIO', 'NOMBRE_INSTITUCION', 'NOM']

const CAMPOS_DIRECCION = ['DIRECCION', 'DIRECCCION', 'DIR']

const CAMPOS_TELEFONO = ['NO_TELEFONO', 'TELEFONO', 'TEL']

const CAMPOS_WEBSITE = ['WEBSITE', 'SITIO_WEB', 'URL', 'PAGINA_WEB']

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

export function obtenerNombreEquipamiento(feature) {
  return buscarCampo(feature?.properties || {}, CAMPOS_NOMBRE)
}

export function obtenerDireccionEquipamiento(feature) {
  return buscarCampo(feature?.properties || {}, CAMPOS_DIRECCION)
}

export function obtenerTelefonoEquipamiento(feature) {
  return buscarCampo(feature?.properties || {}, CAMPOS_TELEFONO)
}

export function obtenerWebsiteEquipamiento(feature) {
  return buscarCampo(feature?.properties || {}, CAMPOS_WEBSITE)
}