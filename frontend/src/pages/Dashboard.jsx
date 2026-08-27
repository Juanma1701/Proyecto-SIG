import { useState } from 'react'
import Mapa from "../components/Mapa";
import MapaGeoLibre from "../components/MapaGeoLibre";
import PanelCapas from "../components/PanelCapas";
import CargarCapa from "../components/CargarCapa";
import '../styles/Dashboard.css'
import SeleccionarCapa from '../components/SeleccionarCapa';
import { MapPin} from 'lucide-react'

export default function App() {
  const [capas, setCapas] = useState([])
  const [coordenada, setCoordenada] = useState(null)
  const [modoRenderer, setModoRenderer] = useState('leaflet')
  const [captura, setCaptura] = useState("")

  const handleCaptureCoordenada = (lat, lng) => {
    setCaptura({ lat, lng })
  }

  return (
    <div className="dashboard">
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
            <span className="dashboard__coordenada">
              Lat: {coordenada.lat.toFixed(6)}<br />
              Lng: {coordenada.lng.toFixed(6)}
            </span>
            <button className='btn-capture' onClick={() => handleCaptureCoordenada(coordenada.lat, coordenada.lng)}>
              Capturar coordenada
            </button>
          </div>
        )}
        <div className="capa-zone">
          <SeleccionarCapa 
            setCapas={setCapas}
            captura={captura}
            
          
          />
        </div>
      </aside>

      {modoRenderer === 'leaflet' ? (
        <Mapa capas={capas} onMapReady={() => {}} onClickMapa={setCoordenada} />
      ) : (
        <MapaGeoLibre capas={capas} onMapReady={() => {}} onClickMapa={setCoordenada} />
      )}
      
    </div>
  )
}