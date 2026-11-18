# Territorio: consulta territorial y evaluación normativa

## Propósito

El panel **Territorio** responde dos preguntas sobre un punto del mapa:

1. **¿Qué publican las fuentes sobre este punto?** Clasificación del suelo, uso actual, uso normativo del POT, tratamientos, riesgos y suelos de protección, cada dato con su fuente.
2. **¿Qué dice la norma sobre una actividad aquí?** La tarjeta "¿Qué dice la norma?" evalúa **una** actividad en ese punto contra la norma urbanística cargada del municipio.

Las actividades evaluables son ocho: licorera o estanquillo, restaurante o cafetería, supermercado, minimercado o tienda de barrio, discoteca o bar, gimnasio, farmacia o droguería, y tienda de tecnología.

Es una lectura **orientativa**. No es un concepto de uso del suelo, ni una licencia o autorización, y debe confirmarse con la oficina de Planeación del municipio. El resultado nunca dice "autorizado". Cuando algo no se puede concluir, el resultado por defecto es "información normativa insuficiente".

## Flujo de una consulta

1. **Se marca el punto.** La persona marca el punto en el mapa con el modo Selección Buffer. Por defecto se consulta el **centro del buffer**; con "Consultar un lugar dentro del buffer" puede marcar otro lugar dentro del radio, y con "Volver al centro del buffer" regresa. El resultado vale solo para el punto consultado, no para todo el radio.
2. **Se consultan las fuentes.** `PanelConsultaTerritorial.jsx` llama a `consultarTerritorioEnVivo` (`utils/territorial/`) con la latitud y la longitud. Cada punto nuevo cancela la consulta anterior (`AbortController`).
3. **Se resuelve el municipio.** Se usa la clasificación del suelo del servicio REST del AMVA, contrastada con la copia en Supabase (`suelo_pot`). Si el AMVA no responde, se usa solo la copia. Los estados posibles son:
   - *resuelto*: el municipio queda determinado.
   - *ambiguo*: el punto está cerca del límite entre municipios y la persona elige uno.
   - *fuera de cobertura*: el punto no cae en ninguno de los 10 municipios.
   - *error*: las fuentes no respondieron.
4. **Se arma un bloque por fuente.** Cada bloque trae su estado (con resultados, sin resultados, significado sin verificar, fuera de cobertura, error del servicio, sin conexión, tardó demasiado), sus registros y su origen (servicio, capa, fecha de datos declarada y enlace a la capa). Si alguna fuente falla, el panel lo avisa y dice que lo que falta puede estar incompleto.
5. **Se evalúa la actividad.** `TarjetaNormativa.jsx` usa `evaluarEnPunto.js`, que tiene una rama por municipio. Cada rama:
   - lee la zona del punto (con un lector propio de cada municipio),
   - busca la actividad en el instrumento del municipio,
   - y devuelve un estado que `evaluar.js` y `presentacion.js` convierten en el texto de la tarjeta.
6. **Se muestra.** Primero la tarjeta "¿Qué dice la norma?". Debajo, el desplegable **"Más información de este punto"** con tres partes:
   - la *ficha* (suelo, tratamiento, uso actual, zona de uso del POT, riesgo y protección),
   - la *norma completa* del municipio (`FichaNormativa.jsx`),
   - y los *datos completos por fuente*.
   Al final va el aviso fijo y la fecha de consulta.

Clasificación del suelo, uso actual, uso normativo y autorización legal son cosas distintas y el panel no las mezcla.

## Fuentes de datos

| Fuente | Qué aporta | Cómo se consulta |
|---|---|---|
| Servicios REST del AMVA (portalidem.metropol.gov.co) | Clasificación del suelo, uso actual, uso normativo del POT, tratamientos, riesgos y suelos de protección | En vivo, a través del proxy `/amva/*` de `vercel.json` |
| Copia de la clasificación del suelo en Supabase (`suelo_pot`) | Contraste con el servicio del AMVA y respaldo si no responde | RPC de Supabase |
| Información pública de las alcaldías (acuerdos y planes de ordenamiento territorial) | La norma de cada municipio, transcrita como instrumento | Código: `utils/normativa/<municipio>.js` |
| Capa oficial de Itagüí (Acuerdo 09 de 2023) | La zona de uso de Itagüí. La capa de uso del AMVA para Itagüí usa códigos de una norma anterior y el panel no la usa para evaluar | Lector propio de Itagüí |

Los datos del AMVA y las normas pertenecen a sus entidades. El visor los presenta de forma orientativa y los términos de uso de cada fuente deben consultarse en su portal (ver el README).

Las normas se transcribieron a tablas dentro del código. Pueden tener errores de transcripción: algunas se leyeron de imágenes o con un programa de lectura (ver cada municipio).

## Modelo de cada municipio

Cada instrumento define: `nombre`, `fechaAdopcion`, `vigencia`, `cobertura`, `limitaciones` y `fuente`. Esos campos son la referencia de la norma citada y de su estado: si algo de este documento los contradice, mandan los archivos.

### Medellín

- Se evalúa por **área de mixtura** (baja, media, alta).
- La persona informa el área del local en m² o el aforo, según la actividad.
- Incluye la exigencia de **PAU** (plan de actividad urbana) para algunas actividades.
- Norma citada y vigencia: ver `medellin.js`.

### Itagüí

- Se evalúa por **zona de actividad**, con tipologías (C-1, S-5, etc.).
- Para las actividades que la norma no nombra (por ejemplo farmacia, gimnasio y discoteca), la persona elige la tipología más parecida. La tarjeta lo presenta como una lectura según su elección, no como una conclusión.
- La zona sale de la capa oficial del municipio (Acuerdo 09 de 2023).

### Envigado

- Acuerdo 010 de 2011, **Tabla 27**: 123 filas por código CIIU y 9 zonas, con letras P, C y R.
- Solo se identifica la zona en el **Centro Tradicional**. Las demás descripciones de la capa del AMVA no tienen equivalencia verificada con las 9 zonas y dan "información insuficiente" con su motivo.
- La tabla solo nombra restaurante y discoteca. Para las otras seis actividades la persona elige la fila CIIU más parecida.
- El POT 2011-2023 está vencido y su vigencia no está verificada.
- Las letras de la tabla se leyeron por posición con un programa, sin revisión humana.

### Sabaneta

- PBOT, Acuerdo 07 de 2018.
- La **zona de mezcla** (baja, media tipo 1 y 2, alta tipo 1 y 2, corredores) se lee del campo USO de la capa del AMVA.
- Supermercado y minimercado se distinguen por el área del local: menos de 600 m² es minimercado.
- Lo no listado en la tabla de la zona está **prohibido** (art. 193).
- En alta mezcla, la discoteca queda "por verificar".
- Alta tipo 1 y los corredores de alta mezcla se leyeron solo por OCR.
- La vigencia del acuerdo de 2018 está por verificar.

### La Estrella (cobertura parcial)

- **Fuente:** documento de Formulación de la revisión del PBOT (enero de 2023, 746 páginas, archivo `Formulacion_La_Estrella_AJUSTES_Enero_30_2023.pdf`), sección 8.3.2: Tabla 158 de tipologías (pp. 570-572) y Tabla 160 de asignación de usos por área de actividad (pp. 588-589). Reemplaza al Documento Diagnóstico, cuyas tablas por polígono eran del Acuerdo 042 de 2008 (el PBOT anterior) y se retiraron.
- **Vigencia por verificar:** el documento dice que el vigente es el Acuerdo 003 de 2023 (2023-2035), y una nota de prensa de enero de 2026 confirma que se aplica un PBOT aprobado en 2023. Las tablas salen de la Formulación, no del acuerdo adoptado.
- **Modelo:** la zona es el **área de actividad** (15): Residencial tipo 1 a 6, Área de actividad múltiple 1 a 3, Industrial tipo 1 a 3, Corredores de actividad tipo 1 y 2, y Corredor especializado. Las tipologías usan códigos compactos (R, C1-C10, S1-S15, SRC1, SRC2, I1-I3). Los datos se transcribieron de imagen.
- **Limitación principal:** la norma asigna los usos por área de actividad y el documento no dice en qué área cae cada predio: eso está en la cartografía. La capa de tratamientos del AMVA usa los códigos del plan anterior (por ejemplo `ZU13 CN08`) y no sirve para ubicar el área. Por eso GeoAburrá **nunca concluye desde el punto en La Estrella**: la tarjeta dice "información normativa insuficiente", muestra cómo trata la actividad cada una de las 15 áreas y deja que la persona elija el área (y la tipología, cuando la norma no nombra la actividad). Esa lectura queda marcada como "según el área que elegiste (no concluye)". No se elige un área en silencio.
- **Mapeos explícitos:** supermercado (C7), farmacia (C1), discoteca o bar (S5), gimnasio (S7) y licorera o estanquillo (C2, con advertencia de la lectura alterna S5).
- **Mapeos inferidos** (no concluyen; la persona elige la tipología): minimercado (C1 o C2), restaurante (S7 o S5) y tienda de tecnología (C2).
- **Reglas que se muestran como advertencia:**
  - Lo no listado se entiende prohibido (Decreto 1077 de 2015, art. 2.2.2.1.2.1.3).
  - Cinco filas repiten un código en dos categorías (RES2 con I3, AAM2 con S5, AAM3 con S10, COR1 con S11, ESP con C5) y se toma la lectura más restrictiva.
  - "Restringido" exige controles espaciales y ambientales que el documento no detalla; se muestra como condición. "Prohibido" se dice como prohibido.
  - Radio de 200 m a equipamientos educativos donde se prohíbe venta y consumo de licor, casino y juegos de azar (licorera y discoteca). Se muestra, no se comprueba.
  - Gran formato desde 600 m² exige estudio de movilidad (supermercado). Se muestra, no se comprueba.
  - Notas de los asteriscos (S3, S10, S11, S13) y notas de RES6, AAM1 e IND3.
- **Pendientes:** una capa o mapa de áreas de actividad (es el único camino para concluir desde el punto), contrastar con el texto del Acuerdo 003 de 2023 y poner su URL, las páginas exactas de las notas de la Tabla 160, las condiciones del uso restringido, el suelo rural y suburbano, la homologación acústica, y distancias, aforos y horarios.

### Municipios sin norma

Los municipios del Valle de Aburrá que no están en esta lista devuelven "la norma de este municipio aún no está cargada", con su motivo.

## Significado de los resultados

| Resultado | Qué significa |
|---|---|
| **Compatible** | La norma cargada permite la actividad en la zona del punto. No es una autorización. |
| **Compatible bajo condiciones** | La norma la permite con condiciones (por ejemplo "restringido", un PAU o un área máxima). La tarjeta lista las condiciones. Si la norma cita condiciones que el visor no puede comprobar, las muestra sin comprobarlas. |
| **No compatible** | La norma la prohíbe en esa zona (o no la lista, donde lo no listado está prohibido). |
| **Información normativa insuficiente** | Resultado por defecto cuando algo no se puede concluir: el punto no cae en una zona identificable, la norma no nombra la actividad, falta el área o la tipología, o el municipio no tiene norma cargada. La tarjeta explica por qué y qué falta. |

- **Lectura según tu elección.** Si la norma no nombra la actividad, el motor **no la deduce**. En los municipios que lo permiten, la persona elige la tipología o la fila más parecida, y la tarjeta lo presenta como una lectura según su elección, no como una conclusión.
- **Aviso fijo.** Toda respuesta lleva, en esencia, este aviso: resultado orientativo basado en la norma urbanística cargada; no es un concepto de uso del suelo, ni una licencia o autorización; debe confirmarse con la oficina de Planeación del municipio.

## Límites

- Es orientativo: no reemplaza el concepto de uso del suelo ni la licencia; hay que confirmarlo con Planeación.
- La vigencia de las normas no está verificada en la gaceta oficial; algunas están vencidas o pueden haber sido modificadas.
- El resultado depende de que el punto caiga en una zona que la aplicación pueda identificar; si no, dice "información insuficiente" y explica por qué.
- No evalúa distancias a colegios, ruido, parqueaderos, riesgo del predio ni otros permisos, salvo que la norma los cite como condición; en ese caso solo los muestra, no los comprueba.
- Evalúa una actividad a la vez y solo las ocho de la lista.
- El resultado vale solo para el punto consultado, no para todo el radio.
- Las tablas pueden tener errores de transcripción (Envigado se leyó con un programa sin revisión humana; algunas zonas de Sabaneta, solo por OCR; La Estrella se transcribió de imagen).
- Los municipios del Valle de Aburrá que no están en la lista no tienen norma cargada.

## Cómo agregar un municipio nuevo

1. **Instrumento.** Crea `frontend/src/utils/normativa/<municipio>.js` con `nombre`, `fechaAdopcion`, `vigencia`, `cobertura`, `limitaciones` y `fuente`, y las tablas de la norma. Si no sabes la vigencia, no la inventes: declárala como no verificada en `limitaciones`. Si la cobertura es parcial, dilo en `cobertura`.
2. **Validación.** Registra el patrón de la norma (zonas, códigos, categorías) en `esquema.js`. Si el instrumento usa un formato nuevo de códigos, agrégalo ahí (La Estrella agregó el formato compacto con `formatoCodigos === 'compacto'`). El instrumento debe fallar en las pruebas si una fila no cumple el esquema.
3. **Lector de zona.** Escribe la función que, a partir del punto y del resultado territorial, devuelve la zona de la norma. Si la zona no se puede identificar con seguridad, devuelve "no identificada" y no una zona adivinada. Ejemplos: `consultaZonaItagui.js`, `evaluarSabaneta.js`, `categoriaEnZona` en `laEstrella.js`.
4. **Actividades.** Mapea las ocho actividades a las categorías de la norma en `actividades.js`. Marca como *explícito* solo lo que la norma nombra; lo demás es *inferido* y debe pedir elegir la tipología.
5. **Rama en `evaluarEnPunto.js`.** Agrega la rama del municipio. Revisa también `index.js` (registro del instrumento), `evaluar.js` (estados) y `presentacion.js` (textos) por si necesitas un estado o un texto nuevo.
6. **Selector en `TarjetaNormativa.jsx`, si hace falta.** Solo cuando la norma exige que la persona elija algo: el área de actividad (La Estrella), la tipología (Itagüí) o la fila CIIU (Envigado). Si el municipio pide el área del local o el aforo, usa los campos de tamaño que ya tiene la tarjeta.
7. **Pruebas.** Crea `scripts/test-<municipio>.mjs` (instrumento) y, si el municipio evalúa por punto, `scripts/test-<municipio>-punto.mjs`. Incluye al menos: un caso compatible, uno condicionado, uno prohibido, uno de "información insuficiente" y uno de punto fuera de zona.
8. **`test:territorial`.** Agrega `&& node scripts/test-<municipio>.mjs` (y el del punto) a `test:territorial` en `frontend/package.json`.
9. **Documentación.** Agrega el municipio a la tabla del README, a la sección "Modelo de cada municipio" de este documento y a la guía de uso (`contenidoGuia.js`) si cambia la lista de municipios.

Regla general: el motor no deduce lo que la norma no nombra. Ante la duda, el resultado es "información normativa insuficiente".

## Cómo se prueba

Desde `frontend/`:

```bash
npm run test:territorial
```

Ejecuta en cadena, en este orden, y se detiene en la primera falla:

| Grupo | Scripts |
|---|---|
| Consulta a las fuentes | `test-registro-fuentes`, `test-consulta-punto`, `test-resolver-municipio`, `test-adaptadores`, `test-consulta-territorial`, `test-resumen-territorial` |
| Normativa de Itagüí y motor general | `test-normativa`, `test-normativa-zonas`, `test-normativa-residencial`, `test-normativa-actividad-multiple`, `test-normativa-dotacional`, `test-evaluar`, `test-zona-oficial`, `test-evaluar-en-punto`, `test-erratas-capa-itagui`, `test-correcciones-capa`, `test-normativa-itagui-lectura` |
| Medellín | `test-normativa-medellin`, `test-evaluar-medellin`, `test-ficha-normativa`, `test-predio` |
| Envigado | `test-normativa-envigado`, `humo-evaluar-envigado` |
| Sabaneta | `test-normativa-sabaneta` |
| La Estrella | `test-la-estrella`, `test-la-estrella-punto` |

Las pruebas corren con Node y no necesitan conexión a las fuentes. Puedes correr una sola, por ejemplo `node scripts/test-la-estrella.mjs`. La reproyección se prueba aparte con `npm test`.

Las pruebas verifican que el código lea bien las tablas cargadas. No verifican que las tablas coincidan con el acuerdo oficial ni que la norma esté vigente: eso se revisa a mano contra el documento y la gaceta.