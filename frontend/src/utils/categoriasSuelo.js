import { Home, TreePine, Mountain, AlertTriangle, Landmark, MapPinned } from 'lucide-react'

// Colores: la protección va en violeta (antes era rojo) para que no se confunda con el rojo
// de "sin cobertura". El patrimonio pasó a ocre; hoy no aparece en la base cargada.
export const CATEGORIAS_SUELO = {
  URBANO: { color: '#22c55e', icono: Home, etiqueta: 'Suelo urbano' },
  EXPANSION_URBANA: { color: '#65a30d', icono: Home, etiqueta: 'Expansión urbana' },
  RURAL: { color: '#a3a361', icono: TreePine, etiqueta: 'Suelo rural' },
  PROTECCION: { color: '#7c3aed', icono: Mountain, etiqueta: 'Área de protección' },
  RIESGO: { color: '#ea580c', icono: AlertTriangle, etiqueta: 'Zona de riesgo/amenaza' },
  PATRIMONIO: { color: '#a16207', icono: Landmark, etiqueta: 'Patrimonio cultural' },
  'SUELO DEFAULT': { color: '#78716c', icono: MapPinned, etiqueta: 'Otra clasificación' }
}

export function estiloCategoriaSuelo(categoria) {
  return CATEGORIAS_SUELO[categoria] || CATEGORIAS_SUELO['SUELO DEFAULT']
}

// Explicaciones en lenguaje cotidiano (texto de la aplicación, no de la fuente)
export const EXPLICACIONES_SIMPLES_SUELO = {
  URBANO:
    'Zona de la ciudad donde ya hay calles y servicios públicos y se puede construir. Incluye terrenos marcados como de expansión urbana.',
  EXPANSION_URBANA:
    'Terrenos que el plan prevé convertir en ciudad durante su vigencia.',
  RURAL:
    'Zona del campo, pensada para actividades agrícolas, ganaderas, forestales o de recursos naturales; no para urbanizar. Incluye terrenos marcados como suburbanos.',
  PROTECCION:
    'Zona donde se restringe construir por razones ambientales, de paisaje, de servicios públicos o de riesgo. Puede estar encima de suelo urbano o rural.',
  RIESGO:
    'Zona que el plan identifica con amenaza o riesgo, por ejemplo por movimientos en masa (deslizamientos), inundaciones o avenidas torrenciales. No es un estudio de un predio específico.',
  PATRIMONIO: 'Áreas o inmuebles considerados patrimonio cultural.',
  'SUELO DEFAULT': 'Clasificación que la aplicación todavía no explica.'
}

export function explicacionSimpleSuelo(categoria) {
  return EXPLICACIONES_SIMPLES_SUELO[categoria] || EXPLICACIONES_SIMPLES_SUELO['SUELO DEFAULT']
}

export const DESCRIPCIONES_SUELO = {
  URBANO: {
    descripcion:
      'Parte del territorio con vías y redes de acueducto, alcantarillado y energía, donde ya se puede urbanizar o edificar. En la base cargada esta clase agrupa también polígonos marcados como expansión urbana.',
    referencia: 'Ley 388 de 1997, arts. 31 y 32'
  },
  EXPANSION_URBANA: {
    descripcion:
      'Terrenos que el plan de ordenamiento prevé habilitar para uso urbano durante su vigencia.',
    referencia: 'Ley 388 de 1997, art. 32'
  },
  RURAL: {
    descripcion:
      'Terrenos no aptos para uso urbano, destinados a usos agrícolas, ganaderos, forestales o de explotación de recursos naturales. En la base cargada incluye polígonos marcados como suburbanos.',
    referencia: 'Ley 388 de 1997, arts. 33 y 34'
  },
  PROTECCION: {
    descripcion:
      'Áreas dentro del suelo urbano, de expansión o rural donde se restringe urbanizar por razones ambientales, paisajísticas, de infraestructura de servicios públicos o de amenaza y riesgo no mitigable. Por eso se superpone con las otras clases. En la base aparecen, por ejemplo, rondas hídricas, áreas protegidas, cerros tutelares y retiros.',
    referencia: 'Ley 388 de 1997, art. 35'
  },
  RIESGO: {
    descripcion:
      'Áreas del POT con condición de amenaza o riesgo, principalmente por movimientos en masa, inundación y avenidas torrenciales. Es la zonificación del POT, no un estudio geotécnico de un predio.',
    referencia: 'Zonificación de amenaza y riesgo del POT'
  },
  PATRIMONIO: {
    descripcion: 'Áreas e inmuebles considerados patrimonio cultural.',
    referencia: 'Zonificación del POT'
  },
  'SUELO DEFAULT': {
    descripcion: 'Polígonos cuya clasificación no pudo asignarse a una de las clases anteriores.',
    referencia: ''
  }
}

export function descripcionCategoriaSuelo(categoria) {
  return DESCRIPCIONES_SUELO[categoria] || DESCRIPCIONES_SUELO['SUELO DEFAULT']
}

const PALABRAS_CLAVE_SUELO = [
  ['PROTECCION', ['proteccion', 'protección', 'area protegida', 'áreas protegidas', 'retiro', 'humedal', 'cerro tutelar']],
  ['RIESGO', ['riesgo', 'amenaza', 'inundacion', 'inundación', 'movimiento en masa', 'avenida torrencial']],
  ['PATRIMONIO', ['patrimonio', 'bic', 'bien de interes cultural', 'arquitectonico', 'arquitectónico']],
  ['EXPANSION_URBANA', ['expansion urbana', 'expansión urbana', 'expansion']],
  ['URBANO', ['urbano', 'urbana']],
  ['RURAL', ['rural']],
]

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return ''
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function obtenerCategoriaSuelo(feature) {
  if (feature?.properties?.categoria) return feature.properties.categoria

  const properties = feature?.properties || {}
  const textoCompleto = normalizarTexto(
    Object.values(properties).filter(v => typeof v === 'string' || typeof v === 'number').join(' ')
  )

  for (const [categoria, palabras] of PALABRAS_CLAVE_SUELO) {
    if (palabras.some(palabra => textoCompleto.includes(palabra))) {
      return categoria
    }
  }

  return 'SUELO DEFAULT'
}