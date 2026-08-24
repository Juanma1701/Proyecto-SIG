import { useState } from 'react'
import Mapa from './components/Mapa'
import PanelCapas from './components/PanelCapas'
import CargarCapa from './components/CargarCapa'

export default function App() {
  const [mapa, setMapa] = useState(null)
  const [capas, setCapas] = useState([])
  const [coordenada, setCoordenada] = useState(null)

  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: 320, padding: 16, overflowY: 'auto', height: '100vh' }}>
        <h2>Visor Geográfico</h2>
        <CargarCapa mapa={mapa} capas={capas} setCapas={setCapas} />
        <PanelCapas capas={capas} setCapas={setCapas} mapa={mapa} />
        {coordenada && (
          <div style={{ marginTop: 16 }}>
            <strong>Última coordenada capturada:</strong>
            <p>Lat: {coordenada.lat.toFixed(6)}</p>
            <p>Lng: {coordenada.lng.toFixed(6)}</p>
          </div>
        )}
      </aside>
      <Mapa onMapReady={setMapa} onClickMapa={setCoordenada} />
    </div>
  )
}