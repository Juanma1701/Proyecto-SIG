import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function Mapa({ onMapReady, onClickMapa }) {
  const mapRef = useRef(null)
  const contenedorRef = useRef(null)

  useEffect(() => {
    if (mapRef.current) return // evita reinicializar

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

  return <div ref={contenedorRef} style={{ height: '100vh', width: '100%' }} />
}