# Proyecto-SIG
Desarrollada por Juan Manuel Castaño Quiroz y Juan Pablo Uribe

Aplicación web para cargar, visualizar, reproyectar y almacenar capas geoespaciales (GeoJSON, Shapefile, KML), con soporte para dos motores de renderizado intercambiables: Leaflet (estándar) y MapLibre GL (alto rendimiento, WebGL).

## Características

- Carga de capas en `.geojson`, `.zip` (shapefile) y `.kml`
- Detección automática del sistema de referencia (CRS/EPSG) de cada archivo
- Reproyección de coordenadas en cliente (proj4) y en servidor (PostGIS)
- Persistencia en Supabase (Storage + PostgreSQL con extensión PostGIS)
- Filtro de visibilidad por capa
- Alternancia en vivo entre renderizador Leaflet y MapLibre GL
- Generador de datos de prueba para comparar rendimiento entre renderizadores

## Instalación

```bash
git clone <url-del-repo>
cd Proyecto_SIG/frontend
npm install
```

Crea un archivo `.env` en `frontend/` con:

VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima

Corre el proyecto:
```bash
npm run dev
```

## Documentación

- [Primeros pasos](docs/tutoriales/primeros-pasos.md)
- [Agregar un formato de archivo nuevo](docs/guias/agregar-formato-nuevo.md)
- [Agregar un renderizador de mapa nuevo](docs/guias/agregar-renderer-nuevo.md)
- [Esquema de base de datos](docs/referencia/esquema-base-datos.md)
- [Componentes](docs/referencia/componentes.md)
- [Decisiones de arquitectura](docs/explicacion/decisiones-arquitectura.md)
- [Principios SOLID aplicados](docs/explicacion/principios-solid.md)

## Stack

React + Vite · Leaflet · MapLibre GL · Supabase (PostgreSQL + PostGIS + Storage) · proj4 · shpjs
