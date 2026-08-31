export const CATEGORIAS_EQUIPAMIENTO = {
  'SALUD': { color: '#ef4444', icono: '🏥', etiqueta: 'Salud' },
  'EDUCACION': { color: '#3b82f6', icono: '🎓', etiqueta: 'Educación' },
  'RECREACION': { color: '#22c55e', icono: '🌳', etiqueta: 'Recreación' },
  'CULTURA': { color: '#a855f7', icono: '🎭', etiqueta: 'Cultura' },
  'CULTO': { color: '#f59e0b', icono: '⛪', etiqueta: 'Culto' },
  'TRANSPORTE': { color: '#06b6d4', icono: '🚌', etiqueta: 'Transporte' },
  'SANITARIO': { color: '#84cc16', icono: '♻️', etiqueta: 'Sanitario' },
  'FUERZA PUBLICA': { color: '#1e40af', icono: '🚓', etiqueta: 'Fuerza pública' },
  'ALMACENAMIENTO DEL SECTOR PRIMARIO': { color: '#92400e', icono: '🌾', etiqueta: 'Almacenamiento' },
  'INSTITUCIONAL': { color: '#64748b', icono: '🏛️', etiqueta: 'Institucional' },
  'BASICO COMUNITARIO': { color: '#0891b2', icono: '🏘️', etiqueta: 'Básico comunitario' },
  'PREVENCION Y ATENCION DE DESASTRES': { color: '#dc2626', icono: '🚨', etiqueta: 'Prevención de desastres' },
  'SERVICIOS PUBLICOS': { color: '#eab308', icono: '💡', etiqueta: 'Servicios públicos' },
  'ADMINISTRACION DE JUSTICIA': { color: '#7c2d12', icono: '⚖️', etiqueta: 'Administración de justicia' }
}

export function obtenerCategoria(feature) {
  return feature.properties?.SIMBOLOGIA || 'INSTITUCIONAL'
}

export function estiloCategoria(categoria) {
  return CATEGORIAS_EQUIPAMIENTO[categoria] || { color: '#94a3b8', icono: '📍', etiqueta: categoria }
}