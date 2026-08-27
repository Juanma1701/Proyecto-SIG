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

function limpiarZ(geojson) {
  function limpiarCoords(coords) {
    if (typeof coords[0] === 'number') {
      return coords.slice(0, 2)
    }
    return coords.map(limpiarCoords)
  }

  const copia = JSON.parse(JSON.stringify(geojson))
  const features = copia.type === 'FeatureCollection' ? copia.features : [copia]
  features.forEach(f => {
    f.geometry.coordinates = limpiarCoords(f.geometry.coordinates)
  })
  return copia
}

export default function MapaGeoLibre({ capas, onMapReady, onClickMapa }) {
  const mapRef = useRef(null)
  const contenedorRef = useRef(null)
  const cargadoRef = useRef(false)

  function sincronizarCapas() {
    const mapa = mapRef.current
    if (!mapa || !cargadoRef.current) return

    let boundsGlobal = null

    capas.forEach(capa => {
      const sourceId = `capa-${capa.id}`
      const visibilidad = capa.visible ? 'visible' : 'none'

      if (mapa.getSource(sourceId)) {
        mapa.getSource(sourceId).setData(limpiarZ(capa.geojson))

        if (mapa.getLayer(`${sourceId}-layer`)) {
          mapa.setLayoutProperty(`${sourceId}-layer`, 'visibility', visibilidad)
        }
        if (mapa.getLayer(`${sourceId}-outline`)) {
          mapa.setLayoutProperty(`${sourceId}-outline`, 'visibility', visibilidad)
        }
        return
      }

      try {
        mapa.addSource(sourceId, { type: 'geojson', data: limpiarZ(capa.geojson) })

        const bounds = calcularBounds(capa.geojson)
        if (bounds) {
          if (!boundsGlobal) {
            boundsGlobal = bounds
          } else {
            boundsGlobal = [
              [Math.min(boundsGlobal[0][0], bounds[0][0]), Math.min(boundsGlobal[0][1], bounds[0][1])],
              [Math.max(boundsGlobal[1][0], bounds[1][0]), Math.max(boundsGlobal[1][1], bounds[1][1])]
            ]
          }
        }

        const tipo = capa.geojson?.features?.[0]?.geometry?.type || capa.geojson?.type || ''

        if (tipo.includes('Point')) {
          mapa.addLayer({
            id: `${sourceId}-layer`,
            type: 'circle',
            source: sourceId,
            paint: { 'circle-radius': 10, 'circle-color': '#ff00ff' }
          })
          mapa.setLayoutProperty(`${sourceId}-layer`, 'visibility', visibilidad)
        } else if (tipo.includes('Line')) {
          mapa.addLayer({
            id: `${sourceId}-layer`,
            type: 'line',
            source: sourceId,
            paint: { 'line-color': '#ff00ff', 'line-width': 6 }
          })
          mapa.setLayoutProperty(`${sourceId}-layer`, 'visibility', visibilidad)
        } else {
          mapa.addLayer({
            id: `${sourceId}-layer`,
            type: 'fill',
            source: sourceId,
            paint: { 'fill-color': '#ff00ff', 'fill-opacity': 0.9 }
          })
          mapa.addLayer({
            id: `${sourceId}-outline`,
            type: 'line',
            source: sourceId,
            paint: { 'line-color': '#ff00ff', 'line-width': 4 }
          })
          mapa.setLayoutProperty(`${sourceId}-layer`, 'visibility', visibilidad)
          mapa.setLayoutProperty(`${sourceId}-outline`, 'visibility', visibilidad)
        }
      } catch (err) {
        console.error('ERROR al agregar capa:', err)
      }
    })

    if (boundsGlobal) {
      mapa.fitBounds(boundsGlobal, { padding: 40, duration: 0 })
    }
  }

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
          { id: 'osm-tiles-layer', type: 'raster', source: 'osm-tiles' }
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
        mapa.remove()
        return
      }
      mapRef.current = mapa
      window.__debugMapa = mapa
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

  useEffect(() => {
    sincronizarCapas()
  }, [capas])

  return <div ref={contenedorRef} className="mapa-contenedor" />
}