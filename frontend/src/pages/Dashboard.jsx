import { useState } from 'react'
import Mapa from "../components/Mapa";
import '../styles/Dashboard.css'
import SeleccionarCapa from '../components/SeleccionarCapa';
import CargarCapaAPI from "../components/CargarCapaAPI";
import ModuloProximamente from "../components/ModuloProximamente";
import '../styles/ModuloProximamente.css'
import { Filter, Layers } from 'lucide-react'
import MenuCapas from '../components/MenuCapas';
import FiltroCategorias from '../components/FiltroCategorias';

export default function App() {
  const [capas, setCapas] = useState([])
  const [coordenada, setCoordenada] = useState(null)
  const [modoRenderer, setModoRenderer] = useState('leaflet')
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [activadoCapa, setActivoCapa] = useState(false)

  const capaEquipamiento = [...capas]
    .reverse()
    .find(c => (
      c.origenAPI === true || c.crs?.fuente?.includes('AMVA ArcGIS REST')
    ) && c.visible) ?? null

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Visor Geográfico</h2>
        <title>Visor Geográfico</title>
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
          <CargarCapaAPI capas={capas} setCapas={setCapas} />
        </div>

        <div className="capa-zone">
          <SeleccionarCapa 
            setCapas={setCapas}
            captura={coordenada}
          />
        </div>
      </aside>

      <div className={`dashboard__mapa-contenedor ${activadoCapa ? 'dashboard__mapa-contenedor--menu-abierto' : ''}`}>
        {modoRenderer === 'leaflet' ? (
          <Mapa capas={capas} onMapReady={() => {}} onClickMapa={setCoordenada} />
        ) : (
          <ModuloProximamente />
        )}

        <button
          className={`btn-toggle-filtros ${filtrosAbiertos ? 'activo' : ''}`}
          onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
          title="Filtros"
        >
          <Filter size={18} />
        </button>

        <button
          className={`btn-toggle-layer ${activadoCapa ? 'activo' : ''}`}
          onClick={() => setActivoCapa(!activadoCapa)}
          title="Capas"
        >
          <Layers size={18} />
        </button>
      </div>

      <div className='menu-layers'>
        {activadoCapa && (
          <MenuCapas
            capas={capas}
            setCapas={setCapas}
          />
        )}
      </div>

      <div className={`menu-layers menu-layers--filtros ${activadoCapa ? 'menu-layers--filtros-desplazado' : ''}`}>
        {filtrosAbiertos && (
          <FiltroCategorias
            capa={capaEquipamiento}
            capas={capas}
            setCapas={setCapas}
          />
        )}
      </div>
    </div>
  )
}