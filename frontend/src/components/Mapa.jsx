import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/Mapa.css'
import { obtenerCategoria, estiloCategoria } from '../utils/categoriasEquipamiento'

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
      const esEquipamiento = capa.crs?.fuente === 'API ArcGIS REST (AMVA)'

      const opcionesEstilo = esEquipamiento ? {
        style: (feature) => {
          const cat = obtenerCategoria(feature)
          const { color } = estiloCategoria(cat)
          return { color, weight: 2, fillColor: color, fillOpacity: 0.45 }
        },
        pointToLayer: (feature, latlng) => {
          const cat = obtenerCategoria(feature)
          const { color } = estiloCategoria(cat)
          return L.circleMarker(latlng, { radius: 6, color, fillColor: color, fillOpacity: 0.85, weight: 1 })
        }
      } : {}

      if (capasLeafletRef.current[capa.id]) {
        // Ya existe: actualiza los datos (por ejemplo, tras reproyectar o filtrar)
        capasLeafletRef.current[capa.id].clearLayers()
        capasLeafletRef.current[capa.id].addData(capa.geojson)
      } else {
        // No existe: créala y agrégala
        const layer = L.geoJSON(capa.geojson, opcionesEstilo).addTo(mapa)
        capasLeafletRef.current[capa.id] = layer

        // Solo hace zoom automático cuando se agrega la primera capa nueva
        try {
          mapa.fitBounds(layer.getBounds())
        } catch {
          // getBounds puede fallar si la capa está vacía; lo ignoramos
        }
      }

      // Mostrar/ocultar según el checkbox
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