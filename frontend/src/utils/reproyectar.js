import {
  asegurarDefinicionEPSG,
  reproyectarGeoJSON as transformarGeoJSON,
} from './reproyectarGeoJSON'
import {
  CATALOGO_EPSG,
  esDibujableEnMapa,
  esGeografico,
  esProyectado,
  etiquetaEPSG,
  obtenerEPSG,
  sistemasPorGrupo,
} from './catalogoEPSG'

export { asegurarDefinicionEPSG }
export {
  CATALOGO_EPSG,
  esDibujableEnMapa,
  esGeografico,
  esProyectado,
  etiquetaEPSG,
  obtenerEPSG,
  sistemasPorGrupo,
}

export function reproyectarGeoJSON(geojson, epsgOrigen, epsgDestino) {
  return transformarGeoJSON(geojson, epsgOrigen, epsgDestino)
}
