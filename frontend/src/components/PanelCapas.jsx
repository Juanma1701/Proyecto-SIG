import { useState } from 'react'
import InfoCRS from './InfoCRS'
import { reproyectarGeoJSON, asegurarDefinicionEPSG } from '../utils/reproyectar'
import L from 'leaflet'

export default function PanelCapas({ capas, setCapas, mapa }) {
  const [sridDestino, setSridDestino] = useState({})

  async function manejarReproyeccion(capa) {
    const destino = parseInt(sridDestino[capa.id])
    if (!destino) return alert('Escribe un código EPSG válido')

    await asegurarDefinicionEPSG(destino)
    const reproyectado = reproyectarGeoJSON(capa.geojson, capa.crs.epsg, destino)

    capa.leafletLayer.remove()
    const nuevaCapaLeaflet = L.geoJSON(reproyectado).addTo(mapa)

    setCapas(capas.map(c =>
      c.id === capa.id
        ? { ...c, geojson: reproyectado, crs: { epsg: destino, fuente: 'reproyectado por el usuario' }, leafletLayer: nuevaCapaLeaflet }
        : c
    ))
  }

  return (
    <div>
      <h3>Capas cargadas</h3>
      {capas.map(capa => (
        <div key={capa.id} style={{ marginBottom: 12, borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
          <p><strong>{capa.nombre}</strong></p>
          <InfoCRS crs={capa.crs} />
          <input
            placeholder="EPSG destino (ej: 3116)"
            value={sridDestino[capa.id] || ''}
            onChange={e => setSridDestino({ ...sridDestino, [capa.id]: e.target.value })}
          />
          <button onClick={() => manejarReproyeccion(capa)}>Reproyectar</button>
        </div>
      ))}
    </div>
  )
}