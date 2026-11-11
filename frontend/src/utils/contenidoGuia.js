import { MapPinned, MapPin, Layers, Mountain, Building2, BarChart3, Globe, Landmark } from 'lucide-react'
import { FUENTES_DATOS, AVISOS_DATOS } from './fuentesDatos'

export const FUNCIONES = [
  {
    icono: MapPinned,
    titulo: 'Equipamientos y lugares',
    texto:
      'Mira en el mapa los equipamientos del AMVA (salud, educación, recreación, culto y más) y los lugares de OpenStreetMap, y activa o desactiva categorías desde la leyenda del mapa. También puedes cargar capas de datos abiertos del AMVA eligiendo un municipio.'
  },
  {
    icono: MapPin,
    titulo: 'Analizar una zona',
    texto:
      'Marca un punto y un radio de hasta 5 km: la aplicación cuenta lo que hay dentro, calcula el área y cuántos elementos hay por km². Puedes empezar desde tu ubicación o desde un municipio, y compartir la zona con un enlace.'
  },
  {
    icono: Layers,
    titulo: 'Cobertura y teselado',
    texto:
      'Descubre qué parte de la zona queda cerca de un servicio (en línea recta) y dónde se concentran los equipamientos, con el mapa dividido en hexágonos.'
  },
  {
    icono: Mountain,
    titulo: 'Clasificación del suelo',
    texto:
      'Consulta cómo clasifica el POT el suelo (urbano, rural, protección y riesgo), con superficies y porcentajes para tu zona. Cubre todo el Valle de Aburrá.'
  },
  {
    icono: Building2,
    titulo: 'Usos del suelo de Medellín',
    texto:
      'En el suelo urbano de Medellín, ve para qué permite el POT de 2014 usar cada sector: vivienda, mezcla de usos, servicios para la comunidad y espacio público.'
  },
  {
    icono: BarChart3,
    titulo: 'Estadísticas, informe y guardado',
    texto:
      'Revisa las cifras de tu zona, exporta el mapa como imagen o el informe en PDF y, con una cuenta, guarda tus zonas para volver a ellas.'
  }
]

export const PASOS = [
  {
    titulo: 'Abre el visor y ubica el panel de trabajo',
    texto:
      'Desde la portada pulsa “Ir al visor”. El panel de trabajo está a la izquierda; en el celular se abre con el botón “Menú”.'
  },
  {
    titulo: 'Elige el centro de tu zona',
    texto:
      'Haz clic en el mapa, en el lugar que quieres analizar: arriba aparece una tarjeta con el punto elegido. También puedes pulsar “Usar mi ubicación”, escribir las coordenadas o acercar el mapa a un municipio con “Ir a un municipio”. La zona debe estar dentro del Valle de Aburrá.'
  },
  {
    titulo: 'Define el radio y las capas',
    texto:
      'En la tarjeta elige el radio (de 500 m a 5 km). Los equipamientos y lugares siempre se incluyen, y la clasificación del suelo viene marcada. En “Mapear una zona” puedes agregar los usos del suelo (solo Medellín, radio hasta 3 km), la cobertura de un servicio y el teselado.'
  },
  {
    titulo: 'Crea la zona',
    texto:
      'Pulsa “Analizar aquí” en la tarjeta (o “Crear zona” en el panel de trabajo). El mapa se acerca a la zona y un mensaje te dice cuántos elementos se encontraron. Con “Limpiar zonas y resultados” las quitas, y puedes deshacerlo.'
  },
  {
    titulo: 'Explora con los botones del mapa',
    texto:
      'A la derecha hay una columna de botones (filtros, suelo, usos, capas, estadísticas, tus zonas y “Cerca”): pasa el cursor sobre cada uno para ver qué hace. Solo se abre un panel a la vez; ciérralo con “Cerrar” o con la tecla Esc. Abajo a la derecha, la leyenda te deja mostrar u ocultar categorías de equipamientos.'
  },
  {
    titulo: 'Consulta un punto',
    texto:
      'Con el suelo o los usos visibles, haz clic en el mapa para ver el detalle de ese punto en una ventana. Con el teselado, haz clic en una celda que tenga equipamientos.'
  },
  {
    titulo: 'Lee las estadísticas',
    texto:
      'En Estadísticas, las pestañas Resumen, Suelo, Usos y Servicios muestran las cifras de tu zona. Cada pestaña aparece solo si marcaste esa capa al crear la zona.'
  },
  {
    titulo: 'Exporta, guarda o comparte',
    texto:
      'Desde Estadísticas puedes bajar el mapa como imagen, el informe en PDF o, con la sesión iniciada, guardar la zona. Con “Copiar enlace de esta zona” (panel de trabajo) se la envías a otra persona: al abrir el enlace verá la misma zona. El enlace solo guarda el centro y el radio, no las capas opcionales.'
  }
]

const ICONOS_FUENTES = { osm: Globe, amva: MapPinned, alcaldia: Landmark }

export const FUENTES = FUENTES_DATOS.map((fuente) => ({
  ...fuente,
  icono: ICONOS_FUENTES[fuente.id] || Globe
}))

export { AVISOS_DATOS }