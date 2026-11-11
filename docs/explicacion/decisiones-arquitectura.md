# Decisiones de arquitectura

## 1. Normalizar la geometría a EPSG:4326

Cada capa puede llegar en un sistema de coordenadas distinto (UTM, MAGNA-SIRGAS, etc.). Guardarlas todas en EPSG:4326 (WGS84) permite que convivan en el mismo espacio para hacer consultas espaciales entre ellas (intersecciones, distancias). El sistema original no se pierde: se guarda en `srid_original`.

## 2. Supabase en vez de un backend propio

Supabase da PostgreSQL con PostGIS, autenticación y funciones RPC sin levantar ni mantener un servidor. PostGIS es el mismo motor que usaría un backend a medida, así que no se sacrifican capacidades geoespaciales.

El costo son los límites del plan gratuito: las consultas del rol anónimo se cortan a los 3 segundos (8 para usuarios con sesión) y la base tiene un tope de 500 MB. Por eso los radios máximos son 5 km (3 km para los usos de Medellín). Supabase Storage no se usa.

## 3. Las superficies se calculan en la base, no en el navegador

Las áreas y los porcentajes salen de funciones SQL (RPC) que trabajan con geometría geodésica (`geography`) y recortan al círculo de la zona. El navegador solo muestra el resultado. Así los cálculos son exactos sobre el elipsoide y el visor no tiene que descargar decenas de miles de polígonos.

## 4. Los datos oficiales se cargan una vez y se consultan desde Supabase

El suelo (`suelo_pot`) y los usos (`usos_suelo`) se descargaron una vez y se guardan en la base. La aplicación no consulta a las entidades en cada clic: es más rápido y no depende de que sus servidores estén disponibles. Los servicios del AMVA, a través del proxy `/amva`, solo se usan en el bloque "Datos abiertos del AMVA", y Overpass solo para buscar el sitio web de un equipamiento.

La consecuencia es que los datos pueden quedar desactualizados respecto a la fuente: por eso la guía y el informe PDF indican la fecha de adopción y de descarga de la capa de usos.

## 5. Clasificación del suelo y uso del suelo se muestran por separado

- La interfaz dice "Clasificación del suelo (POT)" (urbano, rural, protección, riesgo) y nunca "uso".
- Los usos (vivienda, mixtura, etc.) solo existen con fuente oficial para el suelo urbano de Medellín, y se muestran con los nombres oficiales de la fuente. No se renombran ("comercial" no existe como categoría).
- La clase predominante compara por superficie solo urbano y rural. Los porcentajes de superficie y el número de polígonos se rotulan por separado.
- No se infieren usos por piso, por altura ni por establecimientos cercanos: no hay fuente.
- Solo se usan fuentes oficiales para los usos; `landuse` de OpenStreetMap se descartó.

## 6. Dibujar con geometría simplificada, calcular con la original

El mapa de usos se dibuja con una versión disuelta y simplificada (~4 m, tabla `usos_suelo_mapa`) para que cargue rápido. Las cifras se calculan con la geometría original. La superficie dibujada por categoría difiere de la original entre -0,5 % y -1,7 %, y las estadísticas no se ven afectadas. El suelo del POT se guarda simplificado (~5 m).

## 7. Reproyección en el cliente y en la base

- **Cliente (proj4):** los archivos que sube el usuario se reproyectan a WGS84 en el navegador para dibujarlos al instante.
- **Base (PostGIS):** `insertar_capa` transforma cada geometría de su sistema original a 4326 con `st_transform` al guardar.

## 8. Un solo motor de mapa conectado: Leaflet

El visor usa Leaflet, con agrupación de puntos, paneles propios por capa y popups al clic. En una versión anterior el visor permitía alternar con MapLibre GL (WebGL). El componente `MapaGeoLibre.jsx` se conserva en el repositorio pero ningún archivo lo importa, y `Mapa.jsx` creció con funciones que MapLibre no tiene (suelo, usos, teselado, captura para el PDF).

## 9. Una sola fuente para los textos compartidos

Los textos de la guía y de las fuentes de datos viven en `utils/contenidoGuia.js` y `utils/fuentesDatos.js`. La portada, la ventana de guía del visor y el informe PDF los leen de ahí, así no pueden contradecirse.

## 10. Carga diferida de librerías pesadas

`html2canvas`, `jsPDF` y `jszip` se descargan con `import()` solo cuando se usan (exportar la imagen o el PDF, o subir un shapefile en `.zip`). El archivo principal de la app pasó de 2.083 kB a 1.389 kB (de 617 a 413 kB comprimido), una reducción del 33 %. `shpjs` y `@tmcw/togeojson` también se importan de forma diferida, pero no aparecen como archivos propios en la compilación, así que no se midió su aporte.

## 11. Seguridad por dueño (RLS)

RLS está activo en todas las tablas del esquema `public`. Las zonas guardadas, sus capas y sus coordenadas son visibles y borrables solo por su dueño. La inserción en `capas` exige sesión y no permite los nombres reservados de las capas públicas (`Equipamientos AMVA - `, `Lugares OSM - `). Se eliminaron las políticas que permitían escribir sin sesión y las públicas del bucket de Storage. El detalle está en [Esquema de base de datos](../referencia/esquema-base-datos.md).

## 12. Interfaz: un panel a la vez y enlace compartible

Solo se abre un panel flotante a la vez, para que los paneles no tapen el mapa ni entre sí. La zona activa se refleja en la dirección del navegador como `#zona=lat,lng,radio`: el hash no llega al servidor, así que no hace falta configurar nada en Vercel. El enlace guarda el centro y el radio, no las capas opcionales (usos, cobertura y teselado).

## Costos asumidos

| Decisión | Ventaja | Costo asumido |
|---|---|---|
| Normalizar a 4326 | Consultas espaciales uniformes | Transformar al guardar |
| Supabase vs backend propio | Menos infraestructura que mantener | Límites del plan gratuito (3 s, 500 MB) |
| Calcular en la base | Cifras geodésicas exactas, poco tráfico | Radios máximos por el límite de tiempo |
| Datos cargados una vez | Rápido y sin depender de terceros | Pueden quedar desactualizados |
| Dibujo simplificado | El mapa carga rápido | Diferencia visual de -0,5 % a -1,7 % en superficie |
| Solo Leaflet conectado | Una sola lógica de dibujo que mantener | `MapaGeoLibre.jsx` queda sin uso |
| Carga diferida | La app abre más rápido | Una pequeña espera la primera vez que se exporta |
| RLS por dueño | Cada usuario ve solo lo suyo | Los datos públicos solo se pueden cargar con una clave de servidor |