# Primeros pasos

Esta guía te lleva de cero a tu primer análisis de una zona del Valle de Aburrá. También está dentro del visor, en el botón **Guía de uso**.

## 1. Entrar al visor

La primera vez que abres GeoAburrá aparece una portada con tres botones: **¿Qué puede hacer?**, **Ir al visor** y **Guía paso a paso**. Pulsa "Ir al visor". Las siguientes veces entras directo al visor; para volver a la portada usa el botón **Portada** del panel izquierdo.

## 2. Elegir el centro de tu zona

Tienes cuatro formas:
- **Hacer clic en el mapa.** Arriba aparece una tarjeta con el punto elegido.
- **Usar mi ubicación** (panel de trabajo, a la izquierda). El navegador te pide permiso.
- **Escribir las coordenadas** de latitud y longitud en "Mapear una zona".
- **Ir a un municipio**: acerca el mapa a uno de los 10 municipios del Valle.

La zona debe quedar dentro del Valle de Aburrá.

## 3. Elegir el radio y crear la zona

En la tarjeta elige un radio (500 m, 1, 2, 3 o 5 km) y pulsa **Analizar aquí**. También puedes usar el formulario del panel de trabajo y **Crear zona**. El mapa se acerca a la zona y un mensaje te dice cuántos elementos se encontraron.

Los equipamientos y los lugares siempre se incluyen. La clasificación del suelo viene marcada. En "Mapear una zona" puedes agregar:
- **Usos del suelo oficiales** (solo suelo urbano de Medellín, radio de hasta 3 km).
- **Cobertura de un servicio**: qué parte de la zona queda cerca de salud, educación, recreación, cultura o transporte (distancia en línea recta).
- **Teselado**: el mapa dividido en hexágonos, para ver dónde se concentran los equipamientos.

**Limpiar zonas y resultados** quita la zona y todo lo que se consultó con ella, y puedes deshacerlo durante unos segundos.

## 4. Explorar el mapa

A la derecha hay una columna de botones: Filtros, Suelo, Usos, Capas, Estadísticas, Mis zonas y Cerca. Pasa el cursor sobre cada uno para ver qué hace. Solo se abre un panel a la vez: ciérralo con **Cerrar** o con la tecla Esc.

Abajo a la derecha, la **leyenda** te deja mostrar u ocultar categorías de equipamientos y lugares. Abajo a la izquierda hay una escala.

## 5. Consultar un punto

Con el suelo o los usos visibles, haz clic en el mapa: se abre una ventana con la clasificación del suelo y el uso oficial de ese punto. Con el teselado, haz clic en una celda que tenga equipamientos para ver su detalle.

## 6. Leer las estadísticas

En **Estadísticas** hay cuatro pestañas: Resumen, Suelo, Usos y Servicios. Cada una aparece solo si marcaste esa capa al crear la zona. Desde ahí puedes:
- Exportar el mapa como imagen (PNG).
- Exportar el informe en PDF, que incluye una "lectura rápida", las cifras de la zona, las fuentes y las advertencias.
- Guardar la zona, si iniciaste sesión.

## 7. Compartir una zona

Con una zona creada, **Copiar enlace de esta zona** (panel izquierdo) copia una dirección. Quien la abra verá la misma zona. El enlace guarda el centro y el radio, no las capas opcionales (usos, cobertura y teselado).

## 8. Cargar tus propios datos

En el panel izquierdo, cambia el "Modo de visualización" a **Cargar GeoJSON** y arrastra o elige un archivo:
- un `.geojson` o `.json`,
- un `.zip` con el shapefile completo (`.shp`, `.shx`, `.dbf` y `.prj`),
- o un `.kml`.

La aplicación detecta el sistema de referencia del archivo (EPSG) y lo reproyecta a WGS84 para dibujarlo. Si no puede determinarlo, te lo dice. La capa aparece en el panel **Capas**.

## 9. Datos abiertos del AMVA

En el modo de zonas, el bloque **Datos abiertos del AMVA** te deja elegir un municipio y una de sus capas para cargarla al mapa.

## 10. Iniciar sesión

El ícono de perfil (arriba, en el panel izquierdo) abre el panel de cuenta. Con sesión puedes guardar zonas y ver "Mis zonas". Guardar datos en la base exige tener sesión iniciada.

## Antes de interpretar los resultados

El suelo y los usos muestran lo que el POT **permite o planea**, no lo que existe hoy en cada predio. Los usos solo cubren el suelo urbano de Medellín y corresponden al POT de 2014. Más detalle en la pestaña "Datos y licencias" de la guía y en `docs/explicacion/analisis-suelo.md`.