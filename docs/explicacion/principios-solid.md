# Principios SOLID aplicados en GeoAburrá

## S — Responsabilidad única

Cada módulo tiene una sola razón para cambiar:

- `utils/detectarCRS.js`: solo detecta el sistema de referencia de un archivo.
- `utils/reproyectarGeoJSON.js`: solo normaliza y reproyecta GeoJSON.
- `utils/supabaseCapas.js`: solo guarda capas en Supabase.
- `utils/zonasGuardadas.js`: solo guarda, lista y borra zonas.
- `utils/consultasSuelo.js` y `utils/consultasUsos.js`: solo llaman a las funciones SQL de suelo y usos.
- `utils/categoriasSuelo.js` y `utils/categoriasUsos.js`: solo definen colores, íconos y textos de cada categoría.
- `utils/informePDF.js`: solo dibuja el PDF a partir de datos ya calculados.
- `utils/enlaceZona.js`: solo lee y escribe la zona en la dirección del navegador.
- `utils/fuentesDatos.js` y `utils/contenidoGuia.js`: solo contienen textos.

En los componentes, `CargarGeoJSON.jsx` solo carga archivos, `BotonGuardarNube.jsx` solo guarda, `LeyendaMapa.jsx` solo muestra y filtra la leyenda, y `AyudaInfo.jsx` solo muestra un texto de ayuda.

## O — Abierto/Cerrado

Varias partes se amplían agregando datos, sin editar la lógica:

- Una categoría nueva de usos del suelo se agrega a la lista de `categoriasUsos.js`; los paneles, la leyenda, los filtros y el informe PDF la recogen solos.
- Una fuente de datos nueva se agrega a `fuentesDatos.js` y aparece en la guía y en el informe.
- Un paso nuevo de la guía se agrega a `contenidoGuia.js` y cambia en la portada y en el visor.
- Una herramienta nueva de la barra del mapa se agrega a la lista `HERRAMIENTAS` de `Dashboard.jsx`.

Donde no se cumple del todo: `Mapa.jsx` dibuja cada tipo de capa (zona, límites, cobertura, suelo, usos, teselado y equipamientos) con una condición por tipo, así que agregar un tipo de capa nuevo obliga a editar ese archivo.

## L — Sustitución de Liskov

Los componentes que cumplen el mismo contrato se pueden intercambiar sin que el resto lo note:

- `FiltroSuelo` y `FiltroUsos` reciben la capa, la lista de categorías ocultas y su setter, y se usan igual en el panel flotante.
- `EstadisticasSuelo` y `EstadisticasUsos` reciben solo la zona y se muestran igual en las pestañas de estadísticas.

`MapaGeoLibre.jsx` (MapLibre GL) conserva el contrato de props de la primera versión (`capas`, `onMapReady`, `onClickMapa`), pero ya no es un sustituto real de `Mapa.jsx`: el visor depende de funciones que solo tiene `Mapa.jsx` (suelo, usos, teselado, resaltados, captura para el PDF). Por eso ningún archivo lo importa.

## I — Segregación de interfaces

Los componentes reciben solo las props que usan, no el estado completo de la aplicación:

- `IrAMunicipio` recibe solo `onIr`.
- `GuiaModal` recibe solo `onCerrar`.
- `InfoCRS` recibe solo `crs`.
- `LeyendaMapa` recibe las dos capas que muestra, `setCapas` y un indicador de visibilidad.
- `AnalisisRapido` recibe el punto, la zona activa y las funciones que necesita, no el estado de `Dashboard`.

La instancia del mapa de Leaflet no se reparte por los componentes: la guarda `Dashboard.jsx` y `Mapa.jsx` la encapsula, y expone solo `getContenedor`, `prepararCaptura` y `restaurarCaptura`.

## D — Inversión de dependencias

La lógica de negocio no depende de detalles de bajo nivel:

- Los componentes llaman funciones de `utils/` (por ejemplo `obtenerEstadisticasUsos` o `guardarCapaEnNube`) y no al cliente de Supabase directamente.
- El informe PDF recibe datos ya preparados (`prepararUsosParaPDF`, `prepararEstadisticasSuelo`): no sabe de dónde salieron.
- La detección y la reproyección de CRS trabajan con GeoJSON como formato intermedio, sin depender de Leaflet ni de MapLibre.
- Los textos de la guía y las fuentes de datos están en módulos propios; la portada, la ventana de guía y el PDF dependen de ellos, y no al revés.

Donde no se cumple del todo: `Dashboard.jsx` concentra el estado y conoce a casi todos los componentes, por lo que cualquier cambio de interfaz pasa por ese archivo.