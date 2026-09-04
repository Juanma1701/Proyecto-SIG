import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/Mapa.css'
import { obtenerCategoria, estiloCategoria } from '../utils/categoriasEquipamiento'

// Fix del ícono roto de Leaflet en el build de producción (Vite no resuelve
// las rutas relativas que Leaflet arma internamente para sus PNG por defecto)
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

function obtenerCentroGeometria(geometry) {
  if (!geometry) return null

  if (geometry.type === 'Point') {
    return [geometry.coordinates[1], geometry.coordinates[0]]
  }

  if (geometry.type === 'MultiPoint') {
    const [lng, lat] = geometry.coordinates[0]
    return [lat, lng]
  }

  if (geometry.type === 'LineString') {
    const coords = geometry.coordinates
    const promedio = coords.reduce((acc, [lng, lat]) => {
      acc[0] += lat
      acc[1] += lng
      return acc
    }, [0, 0])
    return [promedio[0] / coords.length, promedio[1] / coords.length]
  }

  if (geometry.type === 'MultiLineString') {
    const coords = geometry.coordinates.flat()
    const promedio = coords.reduce((acc, [lng, lat]) => {
      acc[0] += lat
      acc[1] += lng
      return acc
    }, [0, 0])
    return [promedio[0] / coords.length, promedio[1] / coords.length]
  }

  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates.flat()
    const promedio = coords.reduce((acc, [lng, lat]) => {
      acc[0] += lat
      acc[1] += lng
      return acc
    }, [0, 0])
    return [promedio[0] / coords.length, promedio[1] / coords.length]
  }

  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates.flat(2)
    const promedio = coords.reduce((acc, [lng, lat]) => {
      acc[0] += lat
      acc[1] += lng
      return acc
    }, [0, 0])
    return [promedio[0] / coords.length, promedio[1] / coords.length]
  }

  return null
}

export default function Mapa({ capas, onMapReady, onClickMapa }) {
  const mapRef = useRef(null)
  const contenedorRef = useRef(null)
  const capasLeafletRef = useRef({})
  const marcadorRef = useRef(null)
  const onClickMapaRef = useRef(onClickMapa)
  const onMapReadyRef = useRef(onMapReady)

  useEffect(() => {
    onClickMapaRef.current = onClickMapa
    onMapReadyRef.current = onMapReady
  }, [onClickMapa, onMapReady])

  useEffect(() => {
    if (mapRef.current) return

    const mapa = L.map(contenedorRef.current).setView([6.25, -75.56], 12) // Medellín

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapa)

    mapa.on('click', (e) => {
      onClickMapaRef.current && onClickMapaRef.current(e.latlng)

      if (marcadorRef.current) {
        marcadorRef.current.setLatLng(e.latlng)
      } else {
        marcadorRef.current = L.marker(e.latlng).addTo(mapa)
      }
    })

    mapRef.current = mapa
    onMapReadyRef.current && onMapReadyRef.current(mapa)

    return () => {
      mapa.remove()
      mapRef.current = null
      marcadorRef.current = null
    }
  }, [])

  useEffect(() => {
    const mapa = mapRef.current
    if (!mapa) return

    // IDs de capas actuales que llegan por props
    const idsActuales = new Set(capas.map(c => c.id))

    // Eliminar del mapa las capas que ya no están en el array
    Object.keys(capasLeafletRef.current).forEach(id => {
      if (!idsActuales.has(id)) {
        mapa.removeLayer(capasLeafletRef.current[id])
        delete capasLeafletRef.current[id]
      }
    })

    // Agregar o actualizar cada capa
    capas.forEach(capa => {
      if (capa.esZonaVisual === true || capa.tipo === 'zona') {
        const existing = capasLeafletRef.current[capa.id]

        if (existing) {
          mapa.removeLayer(existing)
          delete capasLeafletRef.current[capa.id]
        }

        const layer = L.circle([capa.centro.lat, capa.centro.lng], {
          radius: capa.radioKm * 1000,
          color: capa.color || '#2563eb',
          weight: 2,
          fillColor: '#60a5fa',
          fillOpacity: 0.18,
          dashArray: '8 8'
        }).addTo(mapa)

        capasLeafletRef.current[capa.id] = layer

        if (capa.visible) {
          if (!mapa.hasLayer(layer)) mapa.addLayer(layer)
        } else if (mapa.hasLayer(layer)) {
          mapa.removeLayer(layer)
        }
        return
      }

      if (capasLeafletRef.current[capa.id]) {
        capasLeafletRef.current[capa.id].clearLayers()
      }

      const hiddenCategories = new Set(capa.hiddenCategories || [])
      const features = (capa.geojson?.features || []).filter((feature) => {
        const cat = obtenerCategoria(feature)
        return !hiddenCategories.has(cat)
      })
      const markers = L.layerGroup()

      features.forEach((feature) => {
        const centro = obtenerCentroGeometria(feature.geometry)
        if (!centro) return

        const cat = obtenerCategoria(feature)
        const { color, etiqueta } = estiloCategoria(cat)
        const marcador = L.circleMarker([centro[0], centro[1]], {
          radius: 6,
          color: '#ffffff',
          fillColor: color,
          fillOpacity: 0.95,
          weight: 1.2
        })

        marcador.bindTooltip(etiqueta, {
          direction: 'top',
          opacity: 0.9
        })
        markers.addLayer(marcador)
      })

      markers.addTo(mapa)
      capasLeafletRef.current[capa.id] = markers

      try {
        const bounds = features
          .map((feature) => obtenerCentroGeometria(feature.geometry))
          .filter(Boolean)
          .map(([lat, lng]) => [lat, lng])

        if (bounds.length > 0) {
          mapa.fitBounds(bounds)
        }
      } catch {
        // Ignorado si la capa está vacía o no tiene geometría válida
      }

      const layer = capasLeafletRef.current[capa.id]
      if (capa.visible) {
        if (!mapa.hasLayer(layer)) mapa.addLayer(layer)
      } else {
        if (mapa.hasLayer(layer)) mapa.removeLayer(layer)
      }
    })
  }, [capas])

  return <div ref={contenedorRef} className="mapa-contenedor" />
}