# Componentes

Los componentes están en `frontend/src/components/` y las páginas en `frontend/src/pages/`. Cada componente suele tener su CSS en `frontend/src/styles/`. Los textos de la guía y de las fuentes de datos viven en `frontend/src/utils/` (`contenidoGuia.js`, `fuentesDatos.js`) para que la portada, la guía y el informe PDF digan lo mismo.

## Páginas

### `pages/Dashboard.jsx`
El visor. Guarda el estado de la aplicación: las capas (`capas`), el último punto marcado, el panel abierto, los filtros de suelo y usos, y si se muestra la portada o la guía.

- Solo **un panel flotante** a la vez (Filtros, Suelo, Usos, Capas, Estadísticas, Mis zonas, Cerca). Se cierra con "Cerrar" o con Esc.
- La portada se muestra la primera vez (el navegador recuerda `geoaburra_inicio_visto`) y se salta si la dirección trae una zona.
- La dirección del navegador refleja la zona activa (`#zona=lat,lng,radio`) y, al abrir un enlace así, la zona se crea sola (`utils/enlaceZona.js`).
- Añade al mapa la escala gráfica y los créditos (OpenStreetMap, AMVA y Alcaldía de Medellín).

### `pages/Inicio.jsx`
La portada, con tres vistas: inicio, "¿Qué puede hacer?" y "Guía paso a paso". Prop: `onIrAlVisor`.

## Mapa

### `Mapa.jsx`
Renderizador con Leaflet. Dibuja zonas, equipamientos y lugares (con agrupación de puntos), límites, cobertura, suelo, usos y teselado.

| Prop | Tipo | Descripción |
|---|---|---|
| `capas` | array | Capas a dibujar (ver "Estructura de una capa") |
| `onMapReady` | function | Recibe la instancia de Leaflet al crearse el mapa |
| `onClickMapa` | function | Recibe `{lat, lng}` en cada clic |
| `resaltados` | object | Resultados de "¿Qué hay cerca?" que se resaltan |
| `sueloOcultas` | array | Categorías de suelo que se ocultan |
| `usosOcultas` | array | Categorías de usos que se ocultan |

Por referencia (`ref`) expone `getContenedor()`, `prepararCaptura(zona)` y `restaurarCaptura(estado)`, que usa la exportación de imagen y PDF.

Detalles que conviene saber:
- Un efecto con `[capas]` **reconstruye todas las capas**. Por eso los filtros de suelo y usos no pasan por `capas`: se aplican con efectos aparte.
- Los polígonos tienen paneles propios: usos (250), suelo (300) y teselado (350); el resto va por encima.
- Al hacer clic sobre el suelo o los usos se abre un popup combinado (`utils/popupCapas.js`), y sobre una celda del teselado, el popup de la celda.

### `MapaGeoLibre.jsx`
Renderizador con MapLibre GL (WebGL), con las props `capas`, `onMapReady` y `onClickMapa`. Ningún archivo lo importa: el visor actual usa `Mapa.jsx`.

## Crear y analizar zonas

### `SeleccionarCapa.jsx` ("Mapear una zona")
Formulario del panel de trabajo: latitud, longitud, radio (con botones de 500 m a 5 km), casillas de capas opcionales (suelo, usos, cobertura, teselado), "Usar mi ubicación" y "Limpiar zonas y resultados". Es un `forwardRef`.

| Prop | Tipo | Descripción |
|---|---|---|
| `setCapas` | function | Setter del estado de capas |
| `captura` | object | Último punto marcado en el mapa (rellena el formulario) |
| `capas` | array | Capas actuales (para saber si hay zonas que limpiar) |
| `onIrA` | function | `(lat, lng)`: mueve el mapa (la usa "Usar mi ubicación") |
| `onZonaCreada` | function | `{lat, lng, radioKm}`: avisa que se creó una zona |
| `onCargandoCambio` | function | `bool`: avisa si se está consultando |

Por referencia expone `analizarEn({lat, lng, radioKm})`, que crea la zona con las casillas marcadas.

### `AnalisisRapido.jsx`
Tarjeta sobre el mapa. Sin zona ni punto muestra la pista "Haz clic en el mapa"; con un punto elegido, los radios sugeridos y el botón "Analizar aquí". No aparece si el punto cae dentro de la zona activa.

| Prop | Tipo | Descripción |
|---|---|---|
| `punto` | object | Último punto marcado |
| `zona` | object | Zona activa |
| `visible` / `oculta` | bool | Control de visibilidad |
| `ocupado` | bool | Bloquea el botón mientras se consulta |
| `onAnalizar` | function | `{lat, lng, radioKm}` |
| `onElegirCapas` | function | Abre el panel de trabajo (celular) |

### `IrAMunicipio.jsx`
Desplegable con los 10 municipios. Prop: `onIr(nombre)`.

### `CargarCapaAPI.jsx`
Carga capas de datos abiertos del AMVA: se elige municipio y capa. Prop: `setCapas`.

## Paneles de herramientas

### `FiltroCategorias.jsx` ("Filtros")
Muestra u oculta categorías de equipamientos y lugares. Props: `capa`, `capaLugares`, `capaSuelo`, `capas`, `setCapas`.

### `LeyendaMapa.jsx`
Leyenda plegable abajo a la derecha, con conteo y casillas por categoría. Usa el mismo campo (`hiddenCategories`) que `FiltroCategorias`, así los dos quedan sincronizados. Props: `capaEquipamiento`, `capaLugares`, `setCapas`, `oculta`.

### `FiltroSuelo.jsx` y `FiltroUsos.jsx`
Leyenda y filtro de la clasificación del suelo y de los usos de Medellín. Props: `capaSuelo` o `capaUsos`, `ocultas`, `setOcultas`.

### `MenuCapas.jsx` y `PanelCapas.jsx`
`MenuCapas` es el contenedor del panel "Capas" y `PanelCapas` la lista: muestra cada capa cargada con su CRS, un control de visibilidad y la reproyección. Props de ambos: `capas`, `setCapas`.

### `EstadisticasZona.jsx`
Panel de estadísticas con pestañas (Resumen, Suelo, Usos, Servicios; cada una aparece solo si la zona tiene esa capa). Exporta el mapa en PNG y el informe en PDF (con carga diferida de `html2canvas` y de `jsPDF`) y guarda la zona.

| Prop | Tipo | Descripción |
|---|---|---|
| `zona` | object | Zona activa |
| `capas` | array | Capas del visor |
| `capaEquipamiento`, `capaLugares` | object | Capas de datos de la zona |
| `mapaRef` | ref | Referencia al mapa, para la captura |

Usa estos subcomponentes:
- **`EstadisticasSuelo.jsx`** (`zona`): clasificación del suelo (barras, reparto urbano/rural, combinaciones).
- **`EstadisticasUsos.jsx`** (`zona`): usos del suelo de Medellín.
- **`AnalisisSueloAvanzado.jsx`** (`zona`, `capas`): suelo por anillos de distancia y comparación de zonas.

### `HistorialZonas.jsx` ("Mis zonas")
Muestra las zonas que el usuario guardó (tablas `zonas` y `zona_capas`) y las vuelve a cargar al mapa. Prop: `setCapas`.

### `QueHayCerca.jsx` ("Cerca")
Busca equipamientos cerca del último punto marcado y los resalta en el mapa. Props: `punto`, `onResultados`.

## Carga y guardado de capas

### `CargarGeoJSON.jsx` (exporta `CargarCapaArchivo`)
Carga `.geojson`, `.zip` (shapefile) y `.kml`, detecta el CRS y reproyecta a WGS84. `shpjs` y `@tmcw/togeojson` se descargan solo al subir un archivo de ese tipo. Prop: `setCapas`.

### `BotonGuardarNube.jsx`
Guarda una capa en la base de datos (`guardarCapaEnNube`, en `utils/supabaseCapas.js`) y muestra "Guardada" cuando ya está en la nube. Guardar exige sesión iniciada. Props: `capa`, `setCapas`.

### `InfoCRS.jsx`
Muestra el EPSG de una capa y de dónde se obtuvo. Prop: `crs` (`{ epsg, fuente }`).

### `SelectorEPSG.jsx`
Selector del sistema de referencia (EPSG) de destino para reproyectar una capa.

## Cuenta

### `AuthPanel.jsx`
Inicio de sesión y registro (Supabase Auth). La sesión la entrega `context/AuthContext.jsx`.

## Ayuda

### `GuiaModal.jsx`
Ventana de ayuda sobre el mapa, con las pestañas "Paso a paso", "¿Qué puede hacer?" y "Datos y licencias". Prop: `onCerrar`.

### `AyudaInfo.jsx`
Botón "¿Qué significa?" que muestra u oculta un texto de ayuda. Props: `titulo`, `children`.

## Estructura de una capa en el estado `capas`

```javascript
{
  id: string,                  // uuid generado en el cliente
  nombre: string,
  tipo: string,                // 'zona' | 'lugares' | 'suelo' | 'usos' | 'cobertura' | 'teselado' | 'limites' | 'archivo' | (sin tipo = equipamientos)
  geojson: object,             // lo que se dibuja (ya filtrado por categorías)
  geojsonOriginal: object,     // el GeoJSON completo, sin filtrar
  hiddenCategories: string[],  // categorías ocultas
  crs: { epsg: number, fuente: string },
  visible: boolean,
  guardadaEnNube: boolean,
  origenAPI: boolean,          // true si viene de los datos abiertos del AMVA
  archivoOriginal: File | null
}
```

Las capas de una zona suman:

```javascript
{
  zonaId: string,              // id de la zona de la que nacen
  zonaCentro: { lat, lng },
  zonaRadioKm: number,
  resumenSuelo / resumenUsos / resumenCobertura / resumenTeselado   // cifras para paneles e informe
}
```

La zona misma es una capa con `tipo: 'zona'`, `esZonaVisual: true`, `centro: { lat, lng }` y `radioKm`.

## Utilidades principales

| Archivo | Para qué |
|---|---|
| `utils/consultasSuelo.js`, `utils/consultasUsos.js` | Llamadas a las funciones SQL del suelo y de los usos (con caché) |
| `utils/categoriasSuelo.js`, `utils/categoriasUsos.js` | Colores, íconos y descripciones de cada categoría |
| `utils/popupCapas.js` (con `popupsSuelo.js` y `popupsUsos.js`) | HTML de los popups |
| `utils/informePDF.js` | Informe PDF de una zona (se carga solo al exportar) |
| `utils/fuentesDatos.js`, `utils/contenidoGuia.js` | Textos de fuentes, avisos y guía |
| `utils/enlaceZona.js` | Enlace compartible de una zona (`#zona=lat,lng,radio`) |
| `utils/municipiosValleAburra.js` | Los 10 municipios y la comprobación de si una zona está en el Valle |
| `utils/detectarCRS.js`, `utils/reproyectarGeoJSON.js` | Detección de CRS y reproyección con proj4 |
| `utils/supabaseCapas.js` | Guardado de capas en Supabase |