import { toast } from 'sonner'
import { obtenerUsosMapa, obtenerEstadisticasUsos } from './consultasUsos'
import { estiloCategoriaUso, posicionOrdenUso } from './categoriasUsos'

// Radio máximo para los usos oficiales. Con zonas más grandes la consulta pasa del límite
// de tiempo de la base gratuita (verificado: 2 y 3 km responden bien, 5 km falla).
export const RADIO_MAX_USOS_KM = 3

// Arma la capa de usos oficiales (POT 48 de 2014, solo suelo urbano de Medellín) para una zona.
// El DIBUJO sale de usos_mapa_zona (geometría simplificada, solo para mostrar);
// las CIFRAS (km², %, polígonos) salen de usos_estadisticas_zona (geometría original).
// Devuelve null si no hay datos (por ejemplo, zonas fuera de Medellín) o si el radio es mayor al permitido.
export async function capaUsosDesdeZona(centro, radioKm) {
  const radio = Number(radioKm)

  if (radio > RADIO_MAX_USOS_KM) {
    toast.info(
      `Los usos del suelo oficiales están disponibles para zonas de hasta ${RADIO_MAX_USOS_KM} km de radio. ` +
        'Crea la zona con un radio menor para verlos.'
    )
    return null
  }

  // Las dos consultas salen a la vez; las estadísticas son opcionales
  const pedidoMapa = obtenerUsosMapa(centro, radio)
  const pedidoEstadisticas = obtenerEstadisticasUsos(centro, radio).catch((error) => {
    console.warn('[usos] no se pudieron calcular las estadísticas', error)
    return null
  })

  let datos
  try {
    datos = await pedidoMapa
  } catch (error) {
    toast.error('No se pudieron consultar los usos del suelo: ' + error.message)
    return null
  }

  const crudas = datos?.features || []
  if (crudas.length === 0) {
    toast.info(
      'No hay usos del suelo oficiales para esta zona: la fuente solo cubre el suelo urbano de Medellín.'
    )
    return null
  }

  const estadisticas = await pedidoEstadisticas
  const filasEstadisticas = new Map(
    (estadisticas?.por_area || []).map((fila) => [fila.area_general, fila])
  )

  const features = crudas
    .map((f) => {
      const p = f.properties || {}
      const nombre = p.area_general || '(sin categoría)'
      const estilo = estiloCategoriaUso(nombre)
      const fila = filasEstadisticas.get(nombre)
      const pct = fila ? Number(fila.pct_zona) : NaN
      return {
        ...f,
        properties: {
          ...p,
          categoria: nombre,
          // Al pasar el mouse se ve el título simple (el nombre oficial está en el panel)
          categoriaEtiqueta: Number.isFinite(pct)
            ? `${estilo.titulo} · ${pct.toFixed(1)} % de la zona`
            : estilo.titulo,
          categoriaColor: estilo.color
        }
      }
    })
    .sort((a, b) => posicionOrdenUso(a.properties.categoria) - posicionOrdenUso(b.properties.categoria))

  const resumenUsos = features.map((f) => {
    const p = f.properties
    const estilo = estiloCategoriaUso(p.categoria)
    const fila = filasEstadisticas.get(p.categoria)
    return {
      categoria: p.categoria,
      etiqueta: estilo.etiqueta,
      color: estilo.color,
      areaKm2: fila ? Number(fila.km2) : null,
      porcentaje: fila ? Number(fila.pct_zona) : null,
      fragmentos: fila ? fila.fragmentos : null
    }
  })

  return {
    id: crypto.randomUUID(),
    nombre: `Usos del suelo – Medellín (radio ${radioKm} km)`,
    archivoOriginal: null,
    tipo: 'usos',
    geojson: { type: 'FeatureCollection', features },
    crs: { epsg: 4326, fuente: 'Alcaldía de Medellín – DAP, POT (Acuerdo 48 de 2014)' },
    visible: true,
    guardadaEnNube: false,
    zonaCentro: { lat: centro.lat, lng: centro.lng },
    zonaRadioKm: Number(radioKm),
    zonaKm2: estadisticas?.zona_km2 ?? null,
    resumenUsos
  }
}