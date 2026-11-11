# GeoAburrá (Proyecto-SIG)

Visor web de información geográfica (SIG) de equipamientos urbanos y suelo del Valle de Aburrá (Antioquia, Colombia). Responde preguntas como: *¿qué hay en esta zona, qué le falta, cómo está clasificada su tierra según el POT y qué la amenaza?*

Producción: https://proyecto-sig-nine.vercel.app/

> Proyecto universitario sin fines comerciales. La información es de referencia: no reemplaza los mapas oficiales ni constituye un concepto de uso del suelo, de riesgo o un trámite ante ninguna entidad.

## Qué hace

- **Equipamientos y lugares:** equipamientos urbanos del AMVA (salud, educación, recreación, culto, etc.) y lugares de OpenStreetMap, con leyenda y filtros por categoría.
- **Zonas de análisis:** un centro y un radio de hasta 5 km (clic en el mapa, coordenadas, "Usar mi ubicación" o "Ir a un municipio"). Cuenta elementos, calcula el área y la densidad por km².
- **Cobertura y teselado:** qué parte de la zona queda cerca de un servicio (distancia en línea recta) y concentración de equipamientos en hexágonos.
- **Clasificación del suelo (POT):** urbano, rural, protección y riesgo para los 10 municipios del Valle, con superficies, porcentajes y análisis por distancia al centro.
- **Usos del suelo oficiales de Medellín:** capa del POT (Acuerdo 48 de 2014) para el suelo urbano de Medellín, en seis categorías oficiales (radio máximo de 3 km).
- **Popup combinado:** al hacer clic se consultan el suelo y el uso de ese punto.
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

La clave `VITE_SUPABASE_ANON_KEY` es pública (viaja en el navegador). Nunca pongas una clave de servicio en una variable con prefijo `VITE_` ni subas `.env` al repositorio.

## Cómo funciona

- **Base de datos:** Supabase (PostgreSQL + PostGIS). El visor no calcula las superficies en el navegador: llama funciones SQL (RPC) que devuelven los resultados ya calculados.
- **Datos oficiales cargados una sola vez:** el suelo (`suelo_pot`) y los usos (`usos_suelo`, más `usos_suelo_mapa` para el dibujo) se descargaron y se guardan en Supabase. La aplicación no consulta a las entidades en cada clic.
- **AMVA en vivo:** los servicios ArcGIS REST del AMVA se consultan a través del proxy `/amva/*` definido en `vercel.json` (que también reescribe `/sim/*`).
- **Rendimiento:** el informe PDF, la exportación de imagen y `jszip` se descargan solo cuando se usan.

Detalle de tablas, funciones y políticas: [Esquema de base de datos](docs/referencia/esquema-base-datos.md).

## Seguridad (Supabase)

- RLS está activo en las tablas del esquema `public`.
- Lectura pública de `capas`: solo filas cuyo nombre empieza por `Equipamientos AMVA - ` o `Lugares OSM - `.
- Cada usuario con sesión lee sus propias capas, zonas y coordenadas guardadas.
- Insertar en `capas` requiere sesión iniciada y no permite los nombres reservados (`Equipamientos AMVA - `, `Lugares OSM - `, `CARGA TEMPORAL`). Por eso `frontend/scripts/cargar-equipamientos-amva.mjs`, que inserta con la clave pública, ya no puede escribir: para cargar datos nuevos hay que usar una clave de servidor (sin prefijo `VITE_`) o `ogr2ogr`.
- Supabase Storage no se usa.
- El plan gratuito de Supabase corta las consultas del rol anónimo a los 3 segundos; por eso los radios máximos son 5 km (3 km para los usos).

## Licencias

**Código:** licencia MIT (archivo [LICENSE](LICENSE)). Cubre solo el código fuente del proyecto: **no cubre los datos**, que conservan la licencia de cada fuente (ver abajo).

## Datos, créditos y licencias

| Fuente | Uso | Condiciones |
|---|---|---|
| OpenStreetMap | Mapa base y lugares | Licencia ODbL. © OpenStreetMap contributors (https://www.openstreetmap.org/copyright) |
| Área Metropolitana del Valle de Aburrá (AMVA) | Equipamientos, capas de datos abiertos y clasificación del suelo del POT | Información compilada por el AMVA con datos proporcionados por las Alcaldías de los 10 municipios (septiembre de 2022; cada municipio con la vigencia de su POT). Los servicios consultados no declaran una licencia: uso académico, citando la fuente |
| Alcaldía de Medellín, Departamento Administrativo de Planeación (GeoMedellín) | Usos generales del suelo urbano (POT, Acuerdo 48 de 2014) | **Licencia abierta CC BY-SA 4.0** según el [registro de la capa](https://www.medellin.gov.co/giscatalogacion/srv/api/records/45fe3f84-ce3e-4325-860f-b9c60435b65e) |

**Capa de usos del suelo:**
- **Titular y recurso:** Distrito Especial de Ciencia, Tecnología e Innovación de Medellín (GeoMedellín). Recurso "Usos Generales del Suelo Urbano", del Departamento Administrativo de Planeación, Subdirección de Planeación Territorial y Estratégica de Ciudad.
- **Cita que pide el registro:** Distrito Especial de Ciencia Tecnología e Innovación de Medellín - GeoMedellín - Dato proporcionado por Departamento Administrativo de Planeación - Subdirección de Planeación Territorial y Estratégica de Ciudad.
- **Versión:** fecha de adopción del 17 de diciembre de 2014; descargada el 4 de noviembre de 2026.
- **Cambios hechos por GeoAburrá:** reproyección a WGS84, simplificación del dibujo del mapa (~4 m, tabla `usos_suelo_mapa`) y 12 polígonos que no se pudieron descargar.
- **Compartir igual:** por la cláusula CompartirIgual de CC BY-SA 4.0, los datos derivados (`usos_suelo` y `usos_suelo_mapa`) se ofrecen bajo la misma licencia.
- **Exención de responsabilidad:** la Alcaldía de Medellín no se hace responsable por el uso, tratamiento o transformación de estos datos, ni por responsabilidades legales o económicas derivadas de su uso directo o indirecto.
- La propia Alcaldía describe la capa como una aproximación técnica: la información oficial es el mapa protocolizado del Acuerdo 48 de 2014.

Cada entidad conserva los derechos sobre sus datos: si vas a reutilizarlos, revisa la licencia que publica cada una. En noviembre de 2026 el Concejo de Medellín aprobó una revisión del POT; la capa de usos corresponde al plan de 2014.

## Limitaciones conocidas

- La clasificación y los usos muestran lo que el POT **permite o planea**, no el uso real de cada predio.
- Los usos oficiales solo cubren el suelo urbano de Medellín; no hay usos por piso (no hay fuente) ni una categoría "comercial" pura.
- 12 de los 25.446 polígonos de usos no se pudieron descargar (el servidor devolvió error).
- "Riesgo" es la zonificación del POT, no un estudio geotécnico de un predio.
- La cobertura se mide en línea recta, no por las calles.
- El suelo se guarda simplificado (~5 m) y el dibujo de los usos (~4 m); las cifras de los usos se calculan con la geometría original.
- Los porcentajes de clasificación no suman 100 % porque protección y riesgo se superponen con urbano y rural.

Más detalle en [Análisis del suelo y los usos](docs/explicacion/analisis-suelo.md).

## Estructura

```
Proyecto_SIG/
├── frontend/
│   ├── src/
│   │   ├── pages/        Dashboard.jsx (visor) · Inicio.jsx (portada)
│   │   ├── components/   Mapa (Leaflet), paneles, filtros, leyenda, guía, estadísticas
│   │   │                 (MapaGeoLibre.jsx usa MapLibre GL y no está conectado al visor actual)
│   │   ├── utils/        consultas a Supabase, categorías, informe PDF, enlace de zona
│   │   ├── styles/       CSS de cada componente
│   │   └── context/      AuthContext (sesión)
│   └── scripts/          cargas de una sola ejecución y pruebas
├── docs/                 documentación, consultasSQL/ (SQL numerados) y scripts/
└── vercel.json           reescrituras /amva y /sim
```

## Documentación

- [Primeros pasos](docs/tutoriales/primeros-pasos.md)
- [Agregar un formato de archivo nuevo](docs/guias/agregar-formato-nuevo.md)
- [Esquema de base de datos](docs/referencia/esquema-base-datos.md)
- [Componentes](docs/referencia/componentes.md)
- [Análisis del suelo y los usos](docs/explicacion/analisis-suelo.md)
- [Decisiones de arquitectura](docs/explicacion/decisiones-arquitectura.md)
- [Principios SOLID aplicados](docs/explicacion/principios-solid.md)
- [GDAL](docs/explicacion/gdal.md)

## Stack

React 19 · Vite 8 · Leaflet + markercluster · Turf · Recharts · Supabase (PostgreSQL + PostGIS + Auth) · proj4 · shpjs · togeojson · jsPDF + html2canvas · jszip · sonner · lucide-react