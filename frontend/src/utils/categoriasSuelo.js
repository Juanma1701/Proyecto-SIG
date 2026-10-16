import { Home, TreePine, Mountain, AlertTriangle, Landmark, MapPinned } from 'lucide-react'

export const CATEGORIAS_SUELO = {
  URBANO: { color: '#22c55e', icono: Home, etiqueta: 'Suelo urbano' },
  EXPANSION_URBANA: { color: '#65a30d', icono: Home, etiqueta: 'Expansión urbana' },
  RURAL: { color: '#a3a361', icono: TreePine, etiqueta: 'Suelo rural' },
  PROTECCION: { color: '#dc2626', icono: Mountain, etiqueta: 'Área de protección' },
  RIESGO: { color: '#ea580c', icono: AlertTriangle, etiqueta: 'Zona de riesgo/amenaza' },
  PATRIMONIO: { color: '#7c3aed', icono: Landmark, etiqueta: 'Patrimonio cultural' },
  'SUELO DEFAULT': { color: '#78716c', icono: MapPinned, etiqueta: 'Otra clasificación' }
}

export function estiloCategoriaSuelo(categoria) {
  return CATEGORIAS_SUELO[categoria] || CATEGORIAS_SUELO['SUELO DEFAULT']
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