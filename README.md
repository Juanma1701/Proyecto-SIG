# GeoAburrá (Proyecto-SIG)

Visor web de información geográfica (SIG) de equipamientos urbanos y suelo del Valle de Aburrá (Antioquia, Colombia). Responde preguntas como: *¿qué hay en esta zona, qué le falta, cómo está clasificada su tierra según el POT, qué la amenaza y qué dice la norma urbanística sobre una actividad en un punto?*

Producción: https://proyecto-sig-nine.vercel.app/

> Proyecto universitario sin fines comerciales. La información es de referencia: no reemplaza los mapas oficiales ni constituye un concepto de uso del suelo, de riesgo, una licencia o un trámite ante ninguna entidad.

## Qué hace

- **Equipamientos y lugares:** equipamientos urbanos del AMVA (salud, educación, recreación, culto, etc.) y lugares de OpenStreetMap, con leyenda y filtros por categoría.
- **Zonas de análisis:** un centro y un radio de hasta 5 km (clic en el mapa, coordenadas, "Usar mi ubicación" o "Ir a un municipio"). Cuenta elementos, calcula el área y la densidad por km².
- **Cobertura y teselado:** qué parte de la zona queda cerca de un servicio (distancia en línea recta) y concentración de equipamientos en hexágonos.
- **Clasificación del suelo (POT):** urbano, rural, protección y riesgo para los 10 municipios del Valle, con superficies, porcentajes y análisis por distancia al centro.
- **Usos del suelo oficiales de Medellín:** capa del POT (Acuerdo 48 de 2014) para el suelo urbano de Medellín, en seis categorías oficiales (radio máximo de 3 km).
- **Popup combinado:** al hacer clic se consultan el suelo y el uso de ese punto.
- **Consulta territorial (panel Territorio):** para un punto marcado, consulta en vivo las fuentes del AMVA y muestra la clasificación del suelo, el uso actual, el uso normativo del POT, los tratamientos, los riesgos y los suelos de protección, cada uno con su fuente. Si una fuente no responde, lo avisa. Ver [Territorio](docs/explicacion/TERRITORIO.md).
- **Evaluación normativa ("¿Qué dice la norma?"):** evalúa una actividad (8 posibles) en el punto consultado, con la norma urbanística cargada de cinco municipios: Medellín, Itagüí, Envigado, Sabaneta y La Estrella (esta última con cobertura parcial). El resultado es orientativo, vale solo para el punto consultado y nunca dice "autorizado". Ver [Territorio](docs/explicacion/TERRITORIO.md).
- **Estadísticas e informe:** panel con pestañas (Resumen, Suelo, Usos, Servicios), exportación del mapa en PNG e informe PDF con "lectura rápida", fuentes y advertencias.
- **Cuentas y zonas guardadas** con Supabase Auth, y **enlace compartible** de una zona (`#zona=lat,lng,radio`).
- **Datos abiertos del AMVA por municipio** y **carga de archivos propios** (`.geojson`, `.zip` con shapefile, `.kml`) con detección del sistema de referencia y reproyección con proj4.
- Portada, guía de uso dentro del visor y pestaña "Datos y licencias".

## Instalación

```bash
git clone <url-del-repo>
cd Proyecto_SIG/frontend
npm install
```

Crea un archivo `frontend/.env` con:

```
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

Ejecuta el proyecto:

```bash
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción (carpeta `dist`) |
| `npm run preview` | Sirve la compilación localmente |
| `npm run lint` | Revisa el código con ESLint |
| `npm test` | Prueba de reproyección (`scripts/test-reproyeccion.mjs`) |
| `npm run test:territorial` | Pruebas de la consulta territorial y de la evaluación normativa (ver más abajo) |

La clave `VITE_SUPABASE_ANON_KEY` es pública (viaja en el navegador). Nunca pongas una clave de servicio en una variable con prefijo `VITE_` ni subas `.env` al repositorio.

## Cómo funciona

- **Base de datos:** Supabase (PostgreSQL + PostGIS). El visor no calcula las superficies en el navegador: llama funciones SQL (RPC) que devuelven los resultados ya calculados.
- **Datos oficiales cargados una sola vez:** el suelo (`suelo_pot`) y los usos (`usos_suelo`, más `usos_suelo_mapa` para el dibujo) se descargaron y se guardan en Supabase. Las estadísticas y los popups de suelo y usos leen esa copia, no consultan a las entidades en cada clic.
- **AMVA en vivo:** los servicios ArcGIS REST del AMVA se consultan a través del proxy `/amva/*` definido en `vercel.json` (que también reescribe `/sim/*`). El panel Territorio usa estos servicios en cada consulta y contrasta la clasificación del suelo con la copia de Supabase.
- **Normas en el código:** la norma urbanística de cada municipio está transcrita como un "instrumento" en `frontend/src/utils/normativa/<municipio>.js`, con su nombre, fecha de adopción, vigencia, cobertura, limitaciones y fuente. La evaluación se hace en el navegador, sin consultar un servidor de normas.
- **Rendimiento:** el informe PDF, la exportación de imagen y `jszip` se descargan solo cuando se usan.

Detalle de tablas, funciones y políticas: [Esquema de base de datos](docs/referencia/esquema-base-datos.md). Detalle de la consulta territorial: [Territorio](docs/explicacion/TERRITORIO.md).

## Municipios con norma conectada

| Municipio | Instrumento y cómo se lee | Estado |
|---|---|---|
| Medellín | Por área de mixtura (baja, media, alta); el área del local o el aforo se informa según la actividad; incluye la exigencia de PAU para algunas actividades | Norma citada y vigencia: ver `medellin.js` |
| Itagüí | Por zona de actividad, con tipologías (C-1, S-5, etc.); donde la norma no nombra la actividad, la persona elige la tipología más parecida | Zona leída de la capa oficial del municipio (Acuerdo 09 de 2023) |
| Envigado | Acuerdo 010 de 2011, Tabla 27 (123 filas por código CIIU y 9 zonas, letras P, C y R); solo se identifica la zona en el Centro Tradicional | POT 2011-2023 vencido, vigencia no verificada; letras leídas con un programa, sin revisión humana |
| Sabaneta | PBOT, Acuerdo 07 de 2018; zona de mezcla leída del campo USO de la capa del AMVA; lo no listado en la tabla de la zona está prohibido (art. 193) | Dos zonas leídas solo por OCR; vigencia por verificar |
| La Estrella | Revisión del PBOT (documento de Formulación, enero de 2023): norma por área de actividad (15 áreas) | Cobertura parcial: nunca concluye desde el punto, la persona elige el área; vigencia por verificar |

Los demás municipios del Valle de Aburrá no tienen norma cargada: la tarjeta lo dice con su motivo.

## Seguridad (Supabase)

- RLS está activo en las tablas del esquema `public`.
- Lectura pública de `capas`: solo filas cuyo nombre empieza por `Equipamientos AMVA - ` o `Lugares OSM - `.
- Cada usuario con sesión lee sus propias capas, zonas y coordenadas guardadas.
- Insertar en `capas` requiere sesión iniciada y no permite los nombres reservados (`Equipamientos AMVA - `, `Lugares OSM - `, `CARGA TEMPORAL`). Por eso `frontend/scripts/cargar-equipamientos-amva.mjs`, que inserta con la clave pública, ya no puede escribir: para cargar datos nuevos hay que usar una clave de servidor (sin prefijo `VITE_`) o `ogr2ogr`.
- Supabase Storage no se usa.
- El plan gratuito de Supabase corta las consultas del rol anónimo a los 3 segundos; por eso los radios máximos son 5 km (3 km para los usos).

## Licencias

**Código:** licencia MIT (archivo [LICENSE](LICENSE)). Cubre solo el código fuente del proyecto: **no cubre los datos ni las normas**, que conservan los términos de cada fuente (ver abajo).

## Datos, créditos y licencias

| Fuente | Uso | Condiciones |
|---|---|---|
| OpenStreetMap | Mapa base y lugares | Licencia ODbL. © OpenStreetMap contributors (https://www.openstreetmap.org/copyright) |
| Área Metropolitana del Valle de Aburrá (AMVA) | Equipamientos, capas de datos abiertos, clasificación del suelo del POT y consulta Territorio (servicios REST de portalidem.metropol.gov.co, en vivo). Además, una copia de la clasificación del suelo en Supabase | Información compilada por el AMVA con datos proporcionados por las Alcaldías de los 10 municipios (septiembre de 2022; cada municipio con la vigencia de su POT). Los servicios consultados no declaran una licencia: uso académico, citando la fuente. Los términos de uso de cada servicio deben consultarse en el portal del AMVA |
| Alcaldías de Medellín, Itagüí, Envigado, Sabaneta y La Estrella | Normas de uso del suelo de la evaluación normativa: información pública (acuerdos y planes de ordenamiento territorial) | Pertenece a cada entidad; el visor la presenta de forma orientativa. Las tablas se transcribieron de los documentos y pueden tener errores. Los términos de uso de cada fuente deben consultarse en el portal de la alcaldía |
| Alcaldía de Medellín, Departamento Administrativo de Planeación (GeoMedellín) | Usos generales del suelo urbano (POT, Acuerdo 48 de 2014) | **Licencia abierta CC BY-SA 4.0** según el [registro de la capa](https://www.medellin.gov.co/giscatalogacion/srv/api/records/45fe3f84-ce3e-4325-860f-b9c60435b65e) |

**Capa de usos del suelo:**
- **Titular y recurso:** Distrito Especial de Ciencia, Tecnología e Innovación de Medellín (GeoMedellín). Recurso "Usos Generales del Suelo Urbano", del Departamento Administrativo de Planeación, Subdirección de Planeación Territorial y Estratégica de Ciudad.
- **Cita que pide el registro:** Distrito Especial de Ciencia Tecnología e Innovación de Medellín - GeoMedellín - Dato proporcionado por Departamento Administrativo de Planeación - Subdirección de Planeación Territorial y Estratégica de Ciudad.
- **Versión:** fecha de adopción del 17 de diciembre de 2014; descargada el 4 de noviembre de 2026.
- **Cambios hechos por GeoAburrá:** reproyección a WGS84, simplificación del dibujo del mapa (~4 m, tabla `usos_suelo_mapa`) y 12 polígonos que no se pudieron descargar.
- **Compartir igual:** por la cláusula CompartirIgual de CC BY-SA 4.0, los datos derivados (`usos_suelo` y `usos_suelo_mapa`) se ofrecen bajo la misma licencia.
- **Exención de responsabilidad:** la Alcaldía de Medellín no se hace responsable por el uso, tratamiento o transformación de estos datos, ni por responsabilidades legales o económicas derivadas de su uso directo o indirecto.
- La propia Alcaldía describe la capa como una aproximación técnica: la información oficial es el mapa protocolizado del Acuerdo 48 de 2014.

Cada entidad conserva los derechos sobre sus datos: si vas a reutilizarlos, revisa los términos que publica cada una. En noviembre de 2026 el Concejo de Medellín aprobó una revisión del POT; la capa de usos corresponde al plan de 2014.

## Limitaciones conocidas

**De los datos de suelo y usos**
- La clasificación y los usos muestran lo que el POT **permite o planea**, no el uso real de cada predio.
- Los usos oficiales solo cubren el suelo urbano de Medellín; no hay usos por piso (no hay fuente) ni una categoría "comercial" pura.
- 12 de los 25.446 polígonos de usos no se pudieron descargar (el servidor devolvió error).
- "Riesgo" es la zonificación del POT, no un estudio geotécnico de un predio.
- La cobertura se mide en línea recta, no por las calles.
- El suelo se guarda simplificado (~5 m) y el dibujo de los usos (~4 m); las cifras de los usos se calculan con la geometría original.
- Los porcentajes de clasificación no suman 100 % porque protección y riesgo se superponen con urbano y rural.

**De la evaluación normativa (Territorio)**
- Es orientativa: no reemplaza el concepto de uso del suelo ni la licencia; hay que confirmarla con la oficina de Planeación del municipio.
- La vigencia de las normas no está verificada en la gaceta oficial; algunas están vencidas o pueden haber sido modificadas.
- Depende de que el punto caiga en una zona que la aplicación pueda identificar; si no, el resultado es "información normativa insuficiente" y explica por qué.
- No evalúa distancias a colegios, ruido, parqueaderos, riesgo del predio ni otros permisos, salvo que la norma los cite como condición; en ese caso solo los muestra, no los comprueba.
- Solo hay norma cargada para Medellín, Itagüí, Envigado, Sabaneta y La Estrella; en La Estrella la cobertura es parcial y nunca se concluye desde el punto.

Más detalle en [Análisis del suelo y los usos](docs/explicacion/analisis-suelo.md) y en [Territorio](docs/explicacion/TERRITORIO.md).

## Estructura

```
Proyecto_SIG/
├── frontend/
│   ├── src/
│   │   ├── pages/        Dashboard.jsx (visor) · Inicio.jsx (portada)
│   │   ├── components/   Mapa (Leaflet), paneles, filtros, leyenda, guía, estadísticas
│   │   │                 Territorio: PanelConsultaTerritorial.jsx, TarjetaNormativa.jsx,
│   │   │                 FichaNormativa.jsx, MarcadorPredio.jsx
│   │   │                 (MapaGeoLibre.jsx usa MapLibre GL y no está conectado al visor actual)
│   │   ├── utils/        consultas a Supabase, categorías, informe PDF, enlace de zona,
│   │   │                 contenidoGuia.js y fuentesDatos.js (textos de la guía y las licencias)
│   │   │   ├── territorial/   consulta de un punto a las fuentes del AMVA y a Supabase
│   │   │   └── normativa/     un instrumento por municipio (medellin.js, itagui.js, envigado.js,
│   │   │                      sabaneta.js, laEstrella.js), esquema.js, evaluar.js,
│   │   │                      evaluarEnPunto.js, actividades.js, presentacion.js
│   │   ├── styles/       CSS de cada componente
│   │   └── context/      AuthContext (sesión)
│   └── scripts/          cargas de una sola ejecución y pruebas (test-*.mjs)
├── docs/                 documentación, TERRITORIO.md, consultasSQL/ (SQL numerados) y scripts/
└── vercel.json           reescrituras /amva y /sim
```

## Pruebas

```bash
cd frontend
npm test                  # reproyección
npm run test:territorial  # consulta territorial y evaluación normativa
```

`test:territorial` ejecuta en cadena todos los `scripts/test-*.mjs` de Territorio (y `humo-evaluar-envigado.mjs`); se detiene en la primera prueba que falle. También puedes correr una sola, por ejemplo `node scripts/test-la-estrella.mjs`. Qué prueba cada una: ver [Territorio](docs/explicacion/TERRITORIO.md#cómo-se-prueba).

## Documentación

- [Primeros pasos](docs/tutoriales/primeros-pasos.md)
- [Agregar un formato de archivo nuevo](docs/guias/agregar-formato-nuevo.md)
- [Esquema de base de datos](docs/referencia/esquema-base-datos.md)
- [Componentes](docs/referencia/componentes.md)
- [Análisis del suelo y los usos](docs/explicacion/analisis-suelo.md)
- [Territorio: consulta territorial y evaluación normativa](docs/explicacion/TERRITORIO.md)
- [Decisiones de arquitectura](docs/explicacion/decisiones-arquitectura.md)
- [Principios SOLID aplicados](docs/explicacion/principios-solid.md)
- [GDAL](docs/explicacion/gdal.md)

## Stack

React 19 · Vite 8 · Leaflet + markercluster · Turf · Recharts · Supabase (PostgreSQL + PostGIS + Auth) · proj4 · shpjs · togeojson · jsPDF + html2canvas · jszip · sonner · lucide-react
