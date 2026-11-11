import { estiloCategoriaUso, posicionOrdenUso } from './categoriasUsos'

export function prepararUsosParaPDF(datos) {
  if (!datos || !Array.isArray(datos.por_area) || datos.por_area.length === 0) {
    return null
  }

  const zonaKm2 = Number(datos.zona_km2) || 0
  const sinDatoKm2 = Number(datos.sin_dato_km2) || 0
  const sinDatoPct = zonaKm2 > 0 ? (sinDatoKm2 / zonaKm2) * 100 : 0

  const categorias = [...datos.por_area]
    .sort((a, b) => posicionOrdenUso(a.area_general) - posicionOrdenUso(b.area_general))
    .map((fila) => {
      const estilo = estiloCategoriaUso(fila.area_general)
      return {
        titulo: estilo.titulo,
        oficial: fila.area_general || '(sin categoría)',
        color: estilo.color,
        porcentaje: Number(fila.pct_zona) || 0,
        areaKm2: Number(fila.km2) || 0
      }
    })

  const masGrande = [...categorias].sort((a, b) => b.areaKm2 - a.areaKm2)[0]
  const mayor = datos.predominante
    ? estiloCategoriaUso(datos.predominante).titulo
    : masGrande
      ? masGrande.titulo
      : null

  return {
    zonaKm2,
    sinDatoKm2,
    sinDatoPct,
    mayor,
    categorias
  }
}