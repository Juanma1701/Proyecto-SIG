import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../styles/MapaGeoLibre.css'

function calcularBounds(geojson) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity

  function procesarCoords(coords) {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    } else {
      coords.forEach(procesarCoords)
    }
  }

  const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson]
  features.forEach(f => procesarCoords(f.geometry.coordinates))

  if (minLng === Infinity) return null
  return [[minLng, minLat], [maxLng, maxLat]]
}

export default function MapaGeoLibre({ capas, onMapReady, onClickMapa }) {
  const mapRef = useRef(null)
  const contenedorRef = useRef(null)
  const cargadoRef = useRef(false) // indica si el mapa ya terminó de cargar su estilo

  function sincronizarCapas() {
    const mapa = mapRef.current
    console.log('sincronizarCapas llamado. mapa:', !!mapa, 'cargado:', cargadoRef.current, 'capas:', capas.length)
    if (!mapa || !cargadoRef.current) return

    capas.forEach(capa => {
      const sourceId = `capa-${capa.id}`
      console.log('procesando capa', capa.nombre, 'features:', capa.geojson?.features?.length)

      if (mapa.getSource(sourceId)) {
        mapa.getSource(sourceId).setData(capa.geojson)
        console.log('fuente ya existía, datos actualizados')
        return
      }

      try {
        mapa.addSource(sourceId, { type: 'geojson', data: capa.geojson })
        console.log('fuente agregada:', sourceId)

        const bounds = calcularBounds(capa.geojson)
        if (bounds) {
          mapa.fitBounds(bounds, { padding: 40, duration: 0 })
          console.log('cámara ajustada a los límites de la capa')
        }

        const tipo = capa.geojson?.features?.[0]?.geometry?.type || capa.geojson?.type || ''
        console.log('tipo detectado:', tipo)

        if (tipo.includes('Point')) {
            mapa.addLayer({
                id: `${sourceId}-layer`,
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': 15,
                    'circle-color': '#ff0000',
                    'circle-opacity': 1
                }
            })
            console.log('capa de círculos agregada')
        } else if (tipo.includes('Line')) {
          mapa.addLayer({
            id: `${sourceId}-layer`,
            type: 'line',
            source: sourceId,
            paint: { 'line-color': '#fbbf24', 'line-width': 2 }
          })
          console.log('capa de línea agregada')
        } else {
          mapa.addLayer({
            id: `${sourceId}-layer`,
            type: 'fill',
            source: sourceId,
            paint: { 'fill-color': '#4ade80', 'fill-opacity': 0.4 }
          })
          mapa.addLayer({
            id: `${sourceId}-outline`,
            type: 'line',
            source: sourceId,
            paint: { 'line-color': '#4ade80', 'line-width': 1.5 }
          })
          console.log('capa de polígono agregada')
        }
      } catch (err) {
        console.error('ERROR al agregar capa:', err)
      }
    })
  }

  // Inicializar el mapa una sola vez
  useEffect(() => {
        let cancelado = false
        let mapaLocal = null

        const mapa = new maplibregl.Map({
            container: contenedorRef.current,
            style: {
                version: 8,
                sources: {
                    'osm-tiles': {
                        type: 'raster',
                        tiles: [
                            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: '&copy; OpenStreetMap contributors'
                    }
                },
                layers: [
                    {
                        id: 'osm-tiles-layer',
                        type: 'raster',
                        source: 'osm-tiles'
                    }
                ]
            },
            center: [-75.56, 6.25],
            zoom: 11
        })

        mapaLocal = mapa

        mapa.addControl(new maplibregl.NavigationControl(), 'top-left')

        mapa.on('click', (e) => {
            onClickMapa && onClickMapa({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        })

        mapa.on('load', () => {
            if (cancelado) {
                // Este efecto ya fue "cancelado" por StrictMode; no usar esta instancia
                mapa.remove()
                return
            }
            mapRef.current = mapa
            cargadoRef.current = true
            onMapReady && onMapReady(mapa)
            sincronizarCapas()
        })

        return () => {
            cancelado = true
            if (mapRef.current === mapaLocal) {
                mapRef.current = null
                cargadoRef.current = false
            }
            mapaLocal.remove()
        }
    }, [])

  // Sincronizar capas cada vez que cambian (mientras el mapa ya esté listo)
  useEffect(() => {
    sincronizarCapas()
  }, [capas])

  return <div ref={contenedorRef} className="mapa-contenedor" />
}