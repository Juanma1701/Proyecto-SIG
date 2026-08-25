import { useState } from 'react'
import Mapa from "../components/Mapa";
import MapaGeoLibre from "../components/MapaGeoLibre";
import PanelCapas from "../components/PanelCapas";
import CargarCapa from "../components/CargarCapa";

export default function App() {
  const [capas, setCapas] = useState([])
  const [coordenada, setCoordenada] = useState(null)
  const [modoRenderer, setModoRenderer] = useState('leaflet')

  return (
    <div style={{ display: 'flex' }}>
      <aside className="sidebar">
        <h2>Visor Geográfico</h2>
        <p className="sidebar-subtitle">Carga, reproyecta y guarda capas SIG</p>

        <div className="sidebar-section">
          <h3>Modo de visualización</h3>
          <div className="toggle-renderer">
            <button
              className={modoRenderer === 'leaflet' ? 'activo' : ''}
              onClick={() => setModoRenderer('leaflet')}
            >
              Estándar
            </button>
            <button
              className={modoRenderer === 'geolibre' ? 'activo' : ''}
              onClick={() => setModoRenderer('geolibre')}
            >
              Alto rendimiento
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <CargarCapa capas={capas} setCapas={setCapas} />
        </div>

        <div className="sidebar-section">
          <h3>Capas cargadas</h3>
          <PanelCapas capas={capas} setCapas={setCapas} />
        </div>

        {coordenada && (
          <div className="capa-item">
            <p>Última coordenada capturada</p>
            <span style={{ fontSize: 12, color: '#bbb' }}>
              Lat: {coordenada.lat.toFixed(6)}<br />
              Lng: {coordenada.lng.toFixed(6)}
            </span>
          </div>
        )}
      </aside>

      {modoRenderer === 'leaflet' ? (
        <Mapa capas={capas} onMapReady={() => {}} onClickMapa={setCoordenada} />
      ) : (
        <MapaGeoLibre capas={capas} onMapReady={() => {}} onClickMapa={setCoordenada} />
      )}
    </div>
  )
}