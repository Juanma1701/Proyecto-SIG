# Decisiones de arquitectura

## Por qué normalizar todo a EPSG:4326 internamente

Cada capa puede llegar en un sistema de coordenadas distinto (UTM, MAGNA-SIRGAS, etc.). Guardarlas todas internamente en EPSG:4326 (WGS84) permite que convivan en el mismo espacio para hacer consultas espaciales entre ellas (intersecciones, distancias). El SRID original no se pierde: se guarda como metadato (`srid_original`) para poder ofrecer reproyectar a lo que el usuario pida sin haber perdido esa información.

## Por qué Supabase en vez de un backend propio

Supabase da PostgreSQL con PostGIS, autenticación, Storage y funciones RPC sin tener que levantar y mantener un servidor propio. Para el alcance del proyecto, esto reduce tiempo de infraestructura sin sacrificar capacidades geoespaciales reales (PostGIS es el mismo motor que usaría un backend a medida).

## Por qué reproyección en cliente y en servidor

- **Cliente (proj4):** reproyección inmediata y visual, sin esperar una petición de red — el usuario ve el resultado al instante.
- **Servidor (PostGIS, función `obtener_capa_reproyectada`):** reproyección persistente y confiable para cuando se necesita el dato ya transformado desde la base, o para grandes volúmenes donde no conviene mover todo el cómputo al navegador.

## Por qué Leaflet + MapLibre en vez de un solo motor

Leaflet es más simple y suficiente para volúmenes moderados de datos. MapLibre GL usa WebGL (renderiza con la GPU), lo que lo hace considerablemente más fluido con datasets grandes (miles de geometrías). En vez de elegir uno solo, el proyecto separa la lógica de detección/reproyección de CRS (en `utils/`) del renderizado (en `components/Mapa.jsx` y `components/MapaGeoLibre.jsx`), permitiendo alternar entre ambos sin duplicar lógica de negocio. Esto también demuestra en la práctica el principio de Abierto/Cerrado (ver `principios-solid.md`).

## Trade-offs considerados

| Decisión | Ventaja | Costo asumido |
|---|---|---|
| Normalizar a 4326 | Consultas espaciales uniformes | Reproyectar en cada guardado |
| Supabase vs backend propio | Menos infraestructura que mantener | Menos control fino sobre el servidor |
| Dos renderizadores | Comparación real de rendimiento | Doble mantenimiento de lógica de dibujo |
| RLS abierta (por ahora) | Simplicidad para el alcance del reto | Sin control de acceso por usuario aún |