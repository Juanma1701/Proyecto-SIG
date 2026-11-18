import { MapPinned, MapPin, Layers, Mountain, Building2, BarChart3, Globe, Landmark, Compass, FileText } from 'lucide-react'
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
    icono: Compass,
    titulo: 'Consulta territorial de un punto',
    texto:
      'Con el botón “Territorio”, marca un punto en el mapa y mira qué publican las fuentes sobre él: clasificación del suelo, uso actual, uso del POT, tratamientos, riesgos y suelos de protección, cada uno con su fuente. Si una fuente no responde, el panel te lo avisa y lo que falta puede estar incompleto.'
  },
  {
    icono: FileText,
    titulo: '¿Qué dice la norma?',
    texto:
      'En el panel Territorio, elige una actividad (licorera o estanquillo, restaurante o cafetería, supermercado, minimercado o tienda de barrio, discoteca o bar, gimnasio, farmacia o droguería, tienda de tecnología) y mira qué dice la norma cargada para ese punto. Está conectada para Medellín, Itagüí, Envigado, Sabaneta y La Estrella (esta última con cobertura parcial). Es una lectura orientativa: no es una licencia ni un concepto de uso del suelo, y hay que confirmarla con la oficina de Planeación del municipio.'
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
      'A la derecha hay una columna de botones (filtros, suelo, usos, capas, estadísticas, tus zonas, “Cerca” y “Territorio”): pasa el cursor sobre cada uno para ver qué hace. Solo se abre un panel a la vez; ciérralo con “Cerrar” o con la tecla Esc. Abajo a la derecha, la leyenda te deja mostrar u ocultar categorías de equipamientos.'
  },
  {
    titulo: 'Consulta un punto',
    texto:
      'Con el suelo o los usos visibles, haz clic en el mapa para ver el detalle de ese punto en una ventana. Con el teselado, haz clic en una celda que tenga equipamientos.'
  },
  {
    titulo: 'Abre Territorio y revisa el punto',
    texto:
      'Marca el punto en el mapa (el centro de tu zona) y pulsa “Territorio”. El panel consulta las fuentes y te dice en qué municipio está el punto. Si el punto queda muy cerca del límite entre dos municipios, el panel te pide elegir uno. Por defecto se consulta el centro de tu zona; con “Consultar un lugar dentro del buffer” puedes marcar otro lugar dentro del radio, y con “Volver al centro del buffer” regresas al centro. Si alguna fuente no responde, el panel lo avisa: lo que falte puede estar incompleto.'
  },
  {
    titulo: 'Elige una actividad y lee el resultado',
    texto:
      'En la tarjeta “¿Qué dice la norma?” elige la actividad que quieres evaluar. Algunas normas dependen del tamaño: en ese caso la tarjeta te pide el área del local en m² o el aforo. El resultado puede ser “compatible”, “compatible bajo condiciones”, “no compatible” o “información normativa insuficiente”. Esta última significa que con lo cargado no se puede concluir; la tarjeta te explica por qué y qué falta. Si la norma no nombra tu actividad, puedes elegir la tipología o la fila más parecida: entonces verás una lectura según tu elección, no una conclusión. En La Estrella la norma depende del área de actividad del predio, que el visor no puede ubicar: tienes que elegirla tú (aparece en la cartografía del PBOT o te la confirma Planeación). El resultado vale solo para el punto consultado, no para todo el radio, y nunca dice “autorizado”: confírmalo siempre con la oficina de Planeación del municipio.'
  },
  {
    titulo: 'Abre “Más información de este punto”',
    texto:
      'Debajo del resultado hay un desplegable con el resumen del punto (clasificación del suelo, tratamiento, uso actual, zona de uso del POT, riesgo y protección), la norma completa del municipio y los datos tal como los publica cada fuente, con su servicio, capa y fecha. Sirve para entender de dónde sale cada dato.'
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