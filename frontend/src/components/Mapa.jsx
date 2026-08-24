import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function Mapa({ capas, onMapReady, onClickMapa }) {
  const mapRef = useRef(null)
  const contenedorRef = useRef(null)
  const capasLeafletRef = useRef({}) // guarda las layers de Leaflet por id de capa

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (mapRef.current) return

    const mapa = L.map(contenedorRef.current).setView([6.25, -75.56], 12) // Medellín

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapa)

    mapa.on('click', (e) => {
      onClickMapa && onClickMapa(e.latlng)
    })

    mapRef.current = mapa
    onMapReady && onMapReady(mapa)

    return () => {
      mapa.remove()
      mapRef.current = null
    }
  }, [])

  // Sincronizar capas cada vez que cambian
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
      if (capasLeafletRef.current[capa.id]) {
        // Ya existe: actualiza los datos (por ejemplo, tras reproyectar)
        capasLeafletRef.current[capa.id].clearLayers()
        capasLeafletRef.current[capa.id].addData(capa.geojson)
      } else {
        // No existe: créala y agrégala
        const layer = L.geoJSON(capa.geojson).addTo(mapa)
        capasLeafletRef.current[capa.id] = layer

        // Solo hace zoom automático cuando se agrega la primera capa nueva
        try {
          mapa.fitBounds(layer.getBounds())
        } catch (e) {
          // getBounds puede fallar si la capa está vacía; lo ignoramos
        }
      }
    })
  }, [capas])

  return <div ref={contenedorRef} style={{ height: '100vh', width: '100%' }} />
}