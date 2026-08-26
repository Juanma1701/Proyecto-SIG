# Principios SOLID aplicados en el Visor Geográfico

## S — Single Responsibility Principle

Cada módulo del proyecto tiene una única responsabilidad:

- `utils/detectarCRS.js` → solo detecta el sistema de referencia de un archivo
- `utils/reproyectar.js` → solo transforma coordenadas entre sistemas
- `utils/guardarCapa.js` → solo gestiona la persistencia en Supabase
- `components/CargarCapa.jsx` → solo maneja la carga de archivos
- `components/PanelCapas.jsx` → solo maneja la reproyección y visibilidad de capas ya cargadas

Ningún archivo mezcla, por ejemplo, lógica de reproyección con lógica de conexión a Supabase.

## O — Open/Closed Principle

El sistema de renderizado (`Mapa.jsx` para Leaflet, `MapaGeoLibre.jsx` para MapLibre) está
diseñado para poder **agregar nuevos motores de mapa sin modificar el resto del sistema**.
Ambos componentes reciben el mismo array `capas` como prop y reaccionan a sus cambios de
forma independiente — el resto de la aplicación (`CargarCapa`, `PanelCapas`, la lógica de
CRS) no sabe ni le importa qué motor de renderizado está activo.

Esto significa que agregar un tercer motor (por ejemplo, deck.gl) solo requeriría crear
un nuevo componente `MapaX.jsx` con la misma interfaz de props, sin tocar nada más.

## L — Liskov Substitution Principle

`Mapa.jsx` y `MapaGeoLibre.jsx` son intercambiables entre sí porque ambos cumplen el mismo
"contrato": reciben `capas`, `onMapReady` y `onClickMapa`, y producen el mismo comportamiento
observable (dibujar las capas, permitir click para capturar coordenadas). El componente
`Dashboard.jsx` puede alternar entre ellos (el toggle "Estándar" / "Alto rendimiento") sin
que el resto de la aplicación note ninguna diferencia funcional.

## I — Interface Segregation Principle

Los componentes reciben solo las props que realmente necesitan, no un objeto gigante con
todo el estado de la aplicación:

- `CargarCapa` recibe únicamente `capas` y `setCapas`
- `PanelCapas` recibe únicamente `capas` y `setCapas`
- `InfoCRS` recibe únicamente `crs`

Ninguno depende de props que no usa (por ejemplo, ninguno recibe directamente la instancia
del mapa de Leaflet o MapLibre — esa dependencia quedó encapsulada dentro de `Mapa.jsx`
y `MapaGeoLibre.jsx`).

## D — Dependency Inversion Principle

La lógica de negocio (detección de CRS, reproyección, guardado) no depende directamente
de Leaflet ni de MapLibre — depende únicamente de GeoJSON como formato intermedio. Esto es
lo que permite que `utils/reproyectar.js` y `utils/detectarCRS.js` se reutilicen sin cambios
entre ambos renderizadores. La dependencia de alto nivel (la lógica geoespacial) no depende
de detalles de bajo nivel (qué motor de mapas se use).