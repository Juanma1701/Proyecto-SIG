import { BedDouble, Building2, Wine, Music2, Dumbbell, Pin } from 'lucide-react'

// Categorías para lugares de interés (Overpass/OSM), separadas de las
// categorías de equipamientos públicos del AMVA para no mezclar fuentes.
export const CATEGORIAS_LUGARES = {
  HOTEL: { color: '#0ea5e9', icono: Building2, etiqueta: 'Hotel' },
  MOTEL: { color: '#ec4899', icono: BedDouble, etiqueta: 'Motel' },
  BAR: { color: '#9f1239', icono: Wine, etiqueta: 'Bar' },
  DISCOTECA: { color: '#c026d3', icono: Music2, etiqueta: 'Discoteca / Vida nocturna' },
  GIMNASIO: { color: '#059669', icono: Dumbbell, etiqueta: 'Gimnasio' },
  'LUGAR DEFAULT': { color: '#64748b', icono: Pin, etiqueta: 'Otro lugar' }
}

export function estiloCategoriaLugar(categoria) {
  return CATEGORIAS_LUGARES[categoria] || CATEGORIAS_LUGARES['LUGAR DEFAULT']
}

// Mapea el tag real de OSM (tourism=hotel, amenity=bar, etc.) a nuestra
// categoría interna.
export function categoriaDesdeTagsOSM(tags = {}) {
  if (tags.tourism === 'hotel' || tags.tourism === 'guest_house') return 'HOTEL'
  if (tags.tourism === 'motel') return 'MOTEL'
  if (tags.amenity === 'bar' || tags.amenity === 'pub') return 'BAR'
  if (tags.amenity === 'nightclub') return 'DISCOTECA'
  if (tags.leisure === 'fitness_centre' || tags.sport === 'fitness') return 'GIMNASIO'
  return 'LUGAR DEFAULT'
}