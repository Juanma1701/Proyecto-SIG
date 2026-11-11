# Análisis de la clasificación del suelo (POT) y usos del suelo en GeoAburrá

Este documento cubre dos fuentes distintas que no deben confundirse:

1. **Clasificación del suelo (POT)** — `suelo_pot`, todo el Valle de Aburrá (secciones 1 a 7).
2. **Usos generales del suelo urbano de Medellín (fuente oficial)** — `usos_suelo`, solo Medellín (sección 8).

## Qué es y qué NO es
- Los datos de `suelo_pot` son la **clasificación del suelo del POT** (urbano, rural, protección, riesgo), no el **uso** del suelo. No hay categorías comerciales, residenciales ni mixtas en `suelo_pot`.
- La clase `urbano` incluye polígonos de expansión urbana; `rural`, polígonos suburbanos. Las subclases se deducen de `atributos.SIMBOLOGIA`.
- "Riesgo" es la zonificación de amenaza y riesgo del POT, no un estudio geotécnico de un predio.
- Los **usos del suelo** (residencial, mixto, etc.) solo existen, con fuente oficial, para el suelo urbano de Medellín: se tratan aparte en la sección 8 y se muestran con nombres propios ("Usos del suelo (POT 48 de 2014 – Medellín)"), nunca mezclados con la clasificación.

## Fuente de datos
- Todo se consulta en Supabase/PostGIS (copia de las capas del POT del AMVA). No se consulta el AMVA en vivo para este módulo.
- `suelo_pot`: 12.095 polígonos MULTIPOLYGON (0 inválidos): protección 7.862, riesgo 2.989, rural 950, urbano 294. POT simplificado (~5 m).
- Año de la información: compilación del AMVA de septiembre de 2022; cada municipio mantiene la vigencia de su propio POT, así que los años no son iguales para todos.

## Cómo se calcula
- Áreas geodésicas (`geography`), recortadas al círculo de la zona (radio máx. 5 km).
- Un polígono de origen puede tocar la zona sin quedar completo dentro: se distingue área completa y área dentro de la zona.
- Las clases se superponen (protección y riesgo cubren parte del suelo urbano y rural): los porcentajes no suman 100 %.
- "Base predominante" compara por superficie solo urbano y rural. Nunca se decide por número de polígonos.
- "Sin clasificar" = parte de la zona que no figura ni como urbano ni como rural. La causa no está determinada.
  - En Sabaneta (radio 3 km) hay 1,63 km² sin urbano ni rural, y cerca del 89 % cae en el anillo exterior (2250–3000 m).
  - De esos 1,63 km², solo 0,05 km² no tienen ninguna clase del POT: el resto figura como protección o riesgo.
- Porcentaje de superficie y número de polígonos de origen son indicadores distintos y se rotulan por separado.

## Funciones SQL (todas NUEVAS; no modifican las anteriores)
| Archivo | Función | Uso |
|---|---|---|
| 022 | `suelo_estadisticas_zona`, `suelo_area_interseccion_m2` | Estadísticas del panel, subclases, combinaciones |
| 023 | `suelo_en_punto` | Clic sobre el suelo (atributos originales) |
| 023 | `suelo_en_celda` | Clic sobre una celda del teselado |
| 024 | `suelo_anillos_zona` | Suelo por anillos de distancia al centro |
| 025 | tabla `usos_suelo` | Usos oficiales de Medellín (sección 8) |
| 027 | `usos_en_punto` | Clic sobre un uso (atributos originales) |
| 029 | `usos_estadisticas_zona`, `usos_mapa_zona`, tabla `usos_suelo_mapa` | Estadísticas y dibujo de los usos (consolidado) |

## Limitaciones conocidas
1. Subclases de protección no disponibles: un polígono puede tener varias razones de protección a la vez (cientos de combinaciones en `SIMBOLOGIA`).
2. En riesgo, más de la mitad de la superficie (en Sabaneta 3 km) no tiene tipo de evento identificable en los atributos.
3. `USO` existe solo en 97 polígonos de Girardota (protección): no sirve como uso del suelo general.
4. Solo se pueden consultar celdas del teselado que tengan equipamientos (las únicas que se dibujan). Las celdas del borde se generan completas y el suelo se calcula solo en celda ∩ zona.
5. Pintar todas las celdas por clase predominante no se implementó: no cabe de forma fiable en el límite de 3 s del rol `anon`.
6. El teselado cuenta equipamientos AMVA; "equipamientos en riesgo" cuenta AMVA y lugares OSM; por eso los totales difieren.
7. Usos mixtos y usos por piso: **en `suelo_pot` no existen** y no se infieren (ni por altura, ni por ubicación, ni por establecimientos cercanos). Para el suelo urbano de Medellín sí hay una fuente oficial de usos generales (sección 8), con categorías de mixtura definidas por el POT; los usos por piso siguen sin fuente. Para el resto del Valle solo se ofrece la lista de actividades registradas (equipamientos AMVA y lugares OSM) por celda.
8. Fuentes adicionales que haría falta cargar para profundizar: los usos del suelo rural de Medellín (`VM_32_Uso_Suelo_Rural`), los usos de los otros nueve municipios (geoportal oficial de cada uno, sin verificar) y, para usos por piso, información predial por unidad o licencias. Cualquier fuente nueva se carga primero a Supabase.

## Pruebas realizadas
- `suelo_estadisticas_zona` coincide con `suelo_en_zona` (áreas y polígonos por clase).
- Celda del centro de Sabaneta: 19 equipamientos en `suelo_en_celda` = 19 del teselado.
- `suelo_anillos_zona`: la suma de los anillos coincide con el área de cada clase en la zona completa (diferencias de 0,001 km² por redondeo).
- Medellín 5 km dentro del tope de 3 s para las funciones 022, 023 y 024.

---

## 8. Usos generales del suelo urbano de Medellín (fuente oficial)

### Qué es y qué NO es
- Capa oficial "Usos generales del suelo urbano" del Plan de Ordenamiento Territorial (POT) de Medellín, adoptado por el **Acuerdo 48 de 2014**.
- Indica **para qué se permite o se planea usar el suelo**; no describe lo que existe hoy en cada lote.
- "Mixtura" es una categoría del POT, no una deducción de la aplicación. No existe una categoría "comercial" pura: lo más cercano está dentro de las áreas de media y alta mixtura.

### Fuente
- Alcaldía de Medellín, Departamento Administrativo de Planeación. Servicio ArcGIS `VM_23_Uso_General_Suelo_Urbano`, capa 2 `UsosGnalesSueloUrbano` (polígonos). Escala 1:2000.
- Sistema de referencia original EPSG 9377 (MAGNA-SIRGAS Origen Nacional), reproyectado a EPSG 4326 al descargar.
- Descarga puntual, una sola vez, almacenada en Supabase (`usos_suelo`). La aplicación no consulta a la Alcaldía en cada clic.
- **Aviso de la propia ficha oficial:** es una aproximación técnica; para información oficial debe consultarse el mapa protocolizado del Acuerdo 48 de 2014.
- **Licencia:** abierta CC BY-SA 4.0 (registro de la capa en el catálogo de GeoMedellín). Se cita a GeoMedellín y al Departamento Administrativo de Planeación, y se indican los cambios hechos: reproyección a WGS84, dibujo simplificado y 12 polígonos sin descargar.

### Cobertura
- Solo el suelo urbano de Medellín. El suelo rural de Medellín (`VM_32_Uso_Suelo_Rural`) y los otros nueve municipios del Valle de Aburrá no están cargados.

### Vigencia
- Esta capa corresponde al POT adoptado por el **Acuerdo 48 de 2014**.
- La revisión de mediano plazo (Proyecto de Acuerdo 104 de 2026) fue aprobada en primer debate por la Comisión Primera del Concejo el 19 de octubre de 2026 y, según la prensa, aprobada en segundo debate por la plenaria entre el 4 y el 5 de noviembre de 2026 (18 votos a favor, 2 en contra y un concejal sin votar). Las notas de prensa difieren en la fecha exacta de la votación.
- **No se verificó** la sanción ni la publicación del acuerdo, ni su fecha de entrada en vigencia. Mientras no se confirmen, la capa se presenta como el POT de 2014 y se avisa que el Concejo aprobó una revisión.
- Cuando se confirme la entrada en vigencia y la Alcaldía publique la nueva cartografía, esta capa pasará a ser el plan anterior. Las funciones actuales no filtran por acuerdo: habrá que versionar la tabla. No se cargan borradores.

### Contenido cargado
- 25.434 polígonos (92,077 km²) en seis categorías, con los nombres oficiales de la fuente: Áreas de baja mixtura (10.938), Espacio Público Existente (5.494), Áreas y corredores de alta mixtura (3.138), Áreas y corredores de media mixtura (3.016), Uso Dotacional (1.822), Espacio Público Proyectado (1.026).
- Se conserva siempre el nombre oficial. Los títulos simples ("Zona de vivienda", etc.) y sus explicaciones son texto de la aplicación, separados de los atributos originales.

### Cómo se calcula
- Las superficies y porcentajes se calculan con la geometría **original**, recortando solo los polígonos que cruzan el borde de la zona (el área de los demás está precalculada en `area_m2`).
- El **dibujo** del mapa usa una versión disuelta por categoría y simplificada (~4 m) en `usos_suelo_mapa`, para que cargue rápido.
- Clic sobre un uso: `usos_en_punto` consulta los polígonos originales y devuelve los atributos originales (categoría, subcategoría, códigos, fechas, acuerdo).

### Límites conocidos
- **Polígonos no descargados:** 12 de 25.446 (el servidor devolvió un error al pedirlos), con `objectid` 230, 231, 5807, 1477, 6515, 6312, 6676, 6677, 7291, 7294 (baja mixtura) y 17669, 17670 (espacio público existente).
- **Solapes:** 1.141 pares de polígonos se solapan, con 0,015 km² en total (0,016 % de la capa). No se ajusta por zona (`solape_km2` se devuelve vacío); las sumas por categoría pueden exceder la superficie cubierta en esa proporción.
- **Dibujo simplificado:** la superficie dibujada por categoría difiere de la original entre -0,5 % y -1,7 %. Las estadísticas no se ven afectadas. Cerca de un borde, el color dibujado puede diferir del resultado del clic.
- **Radio máximo:** los usos se consultan hasta 3 km de radio. En las pruebas con el rol `anon` (límite de 3 s), 2 y 3 km respondieron bien, 4 km tardó unos 2,3 s en una de las funciones y 5 km superó el límite de tiempo.
- **"Sin información"** es la parte de la zona que no tiene ningún polígono de esta fuente (rural, otros municipios o terreno sin polígono); no se interpreta como un uso.
- **Capas apiladas:** con el suelo y los usos visibles, un clic abre un único popup con las dos secciones. Si el teselado está visible y se hace clic sobre una celda con equipamientos, el popup es el de la celda y no incluye usos.
- Sin usos por piso: no hay fuente y no se infieren.

### Pruebas realizadas
- Carga: 25.434 filas en `usos_suelo`, 0 vacías, 0 inválidas, srid 4326, 6 categorías; 24.749 trozos de dibujo, 0 polígonos sin área precalculada.
- Dibujo contra original: diferencias por categoría entre -0,5 % y -1,7 %.
- Tiempos (rol `anon`): radios de 2 y 3 km sin error; 4 km, 2,3 s; 5 km, error por tiempo.