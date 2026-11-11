import { Home, Store, Building2, Landmark, TreePine, MapPinned } from 'lucide-react'

// Frase de introducción que se muestra arriba del panel de usos
export const INTRO_USOS =
  'Este mapa muestra para qué puede usarse el suelo según el plan de la ciudad (el POT), ' +
  'no lo que hay hoy en cada lote. “Mixtura” significa mezcla de usos: vivienda, comercio y ' +
  'servicios en un mismo sector.'

// Categorías oficiales de "Usos generales del suelo urbano" de Medellín
// (POT, Acuerdo 48 de 2014). El nombre oficial se conserva SIEMPRE tal cual viene de la fuente.
// Aquí se asignan, además: un título en lenguaje cotidiano, una explicación corta (texto de la
// aplicación), color, icono y la descripción técnica.
// El orden de esta lista es el orden en que se dibujan y se listan.
export const CATEGORIAS_USOS = [
  {
    id: 'BAJA_MIXTURA',
    palabras: ['baja mixtura'],
    color: '#fde047',
    icono: Home,
    titulo: 'Zona de vivienda',
    explicacion: 'Aquí predomina la vivienda, con poca mezcla de otros usos.',
    descripcion:
      'Según la leyenda del servicio oficial, son áreas predominantemente residenciales.'
  },
  {
    id: 'MEDIA_MIXTURA',
    palabras: ['media mixtura'],
    color: '#f472b6',
    icono: Store,
    titulo: 'Vivienda con comercio y servicios de barrio',
    explicacion:
      'Zonas de transición donde la vivienda se mezcla con tiendas y servicios del barrio.',
    descripcion:
      'Según la leyenda del servicio oficial, agrupa zonas de transición, centralidades dotacionales y aglomeraciones comerciales y de servicios barriales.'
  },
  {
    id: 'ALTA_MIXTURA',
    palabras: ['alta mixtura'],
    color: '#be185d',
    icono: Building2,
    titulo: 'Zona de mucha actividad',
    explicacion:
      'Zonas con mucha mezcla de usos y actividad económica; incluye corredores de mucho movimiento.',
    descripcion:
      'Según la leyenda del servicio oficial, agrupa centralidades con predominancia económica, centralidades y corredores con alta mixtura, y áreas de actividad económica en transformación.'
  },
  {
    id: 'DOTACIONAL',
    palabras: ['dotacional'],
    color: '#0ea5e9',
    icono: Landmark,
    titulo: 'Servicios para la comunidad',
    explicacion:
      'Terrenos pensados para equipamientos de uso colectivo, como educación o salud.',
    descripcion: 'Categoría “Uso dotacional” del POT de Medellín (Acuerdo 48 de 2014).'
  },
  {
    id: 'ESPACIO_PUBLICO_EXISTENTE',
    palabras: ['espacio publico existente'],
    color: '#14b8a6',
    icono: TreePine,
    titulo: 'Parques y espacios públicos existentes',
    explicacion: 'Espacios abiertos de uso de todos, como parques y plazas, que ya existen.',
    descripcion: 'Categoría “Espacio público existente” del POT de Medellín (Acuerdo 48 de 2014).'
  },
  {
    id: 'ESPACIO_PUBLICO_PROYECTADO',
    palabras: ['espacio publico proyectado'],
    color: '#5eead4',
    icono: MapPinned,
    titulo: 'Espacios públicos planeados',
    explicacion: 'Espacios que el plan prevé crear y que todavía no existen.',
    descripcion: 'Categoría “Espacio público proyectado” del POT de Medellín (Acuerdo 48 de 2014).'
  }
]

const POR_DEFECTO = {
  id: 'OTRA',
  palabras: [],
  color: '#94a3b8',
  icono: MapPinned,
  titulo: null,
  explicacion: 'Categoría de la fuente oficial que la aplicación todavía no explica.',
  descripcion: 'Categoría de la fuente oficial que la aplicación todavía no describe.'
}

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return ''
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function estiloCategoriaUso(areaGeneral) {
  const texto = normalizarTexto(areaGeneral)
  const encontrada = CATEGORIAS_USOS.find((c) => c.palabras.some((p) => texto.includes(p)))
  const base = encontrada || POR_DEFECTO
  const oficial = areaGeneral || '(sin categoría)'
  return { ...base, titulo: base.titulo || oficial, etiqueta: oficial }
}

export function posicionOrdenUso(areaGeneral) {
  const texto = normalizarTexto(areaGeneral)
  const i = CATEGORIAS_USOS.findIndex((c) => c.palabras.some((p) => texto.includes(p)))
  return i === -1 ? CATEGORIAS_USOS.length : i
}