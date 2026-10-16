import { useState, useRef } from 'react'
import Mapa from "../components/Mapa";
import '../styles/Dashboard.css'
import SeleccionarCapa from '../components/SeleccionarCapa';
import CargarCapaAPI from "../components/CargarCapaAPI";
import '../styles/ModuloProximamente.css'
import { Filter, Layers, BarChart3, History, MapPinned, MapPin, Sparkles, UserRound } from 'lucide-react'
import MenuCapas from '../components/MenuCapas';
import FiltroCategorias from '../components/FiltroCategorias';
import EstadisticasZona from '../components/EstadisticasZona';
import AuthPanel from '../components/AuthPanel';
import HistorialZonas from '../components/HistorialZonas';
import CargarCapaArchivo from '../components/CargarGeoJSON';
import BotonGuardarNube from '../components/BotonGuardarNube';
import QueHayCerca from '../components/QueHayCerca';


export default function App() {
  const [capas, setCapas] = useState([])
  const [coordenada, setCoordenada] = useState(null)
  const [modoRenderer, setModoRenderer] = useState('leaflet')
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [activadoCapa, setActivoCapa] = useState(false)
  const [estadisticasAbiertas, setEstadisticasAbiertas] = useState(false)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const [cercaAbierto, setCercaAbierto] = useState(false)
  const [resaltados, setResaltados] = useState(null)
  const [profileActive, setProfileActive] = useState(false)

  const mapaRef = useRef(null)
  const capaEquipamiento = [...capas]
    .reverse()
    .find(c => (
      c.origenAPI === true || c.crs?.fuente?.includes('AMVA ArcGIS REST')
    ) && c.tipo !== 'lugares' && c.tipo !== 'suelo' && c.tipo !== 'cobertura' && c.tipo !== 'teselado' && c.tipo !== 'limites' && c.visible) ?? null

  const capaLugares = [...capas]
    .reverse()
    .find(c => c.tipo === 'lugares' && c.visible) ?? null

  const capaSuelo = [...capas]
    .reverse()
    .find(c => c.tipo === 'suelo' && c.visible) ?? null

  const zonaActiva = [...capas]
    .reverse()
    .find(c => (c.esZonaVisual || c.tipo === 'zona') && c.visible) ?? null

  const OpenProfile = () =>{
    setProfileActive(!profileActive)
  } 
  

return (
    <div className="dashboard">
      <aside className="sidebar">
        <title>GeoAburrá</title>

        <div className="sidebar-header">
          <div className="sidebar-header__icono">
            <MapPinned size={22} />
          </div>
          <div>
            <h2>GeoAburrá</h2>
            <p className="sidebar-subtitle">Carga, reproyecta y guarda capas SIG</p>
          </div>
          <button className='btn-profile' onClick={OpenProfile}>
            <UserRound />
          </button>
        </div>
        
        <div className="sidebar-section">
          { profileActive && 
          <AuthPanel />
          } 
        </div>
        
        <div className="sidebar-section">
          <p className="sidebar-section__titulo">Modo de visualización</p>
          <div className="toggle-renderer">
            <button
              className={modoRenderer === 'leaflet' ? 'activo' : ''}
              onClick={() => setModoRenderer('leaflet')}
            >
              <Sparkles size={14} />
              Selección Buffer
            </button>
            <button
              className={modoRenderer === 'GeoJSON' ? 'activo' : ''}
              onClick={() => setModoRenderer('GeoJSON')}
            >
              <MapPinned size={14} />
              Cargar GeoJSON
            </button>
          </div>
        </div>

        <div className='sidebar-type'>
          {modoRenderer === 'GeoJSON' ? (
            <div className="sidebar-section">
              <CargarCapaArchivo capas={capas} setCapas={setCapas} />
              <BotonGuardarNube capa={capas} setCapas={setCapas} />
            </div>
          ) : (
            <>
              <div className="sidebar-section">
                <CargarCapaAPI capas={capas} setCapas={setCapas} />
              </div>
              <div className="capa-zone">
                <SeleccionarCapa
                  setCapas={setCapas}
                  captura={coordenada}
                />
              </div>
            </>
          )}
        </div>
      </aside>

      <div className={`dashboard__mapa-contenedor ${activadoCapa ? 'dashboard__mapa-contenedor--menu-abierto' : ''}`}>
        {modoRenderer === 'leaflet' ? (
          <Mapa ref={mapaRef} capas={capas} onMapReady={() => {}} onClickMapa={setCoordenada} resaltados={resaltados} />
        ) : (
          <Mapa capas={capas} onMapReady={() => {}} onClickMapa={setCoordenada} resaltados={resaltados} />
        )}

      
        <div className="controles-mapa">
          <div className="controles-mapa__grupo">
            <button
              className={`btn-toggle-filtros ${filtrosAbiertos ? 'activo' : ''}`}
              onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
              title="Filtros"
            >
              <Filter size={18} />
            </button>

            {filtrosAbiertos && (
              <FiltroCategorias
                capa={capaEquipamiento}
                capaLugares={capaLugares}
                capaSuelo={capaSuelo}
                capas={capas}
                setCapas={setCapas}
              />
            )}
          </div>

          <div className="controles-mapa__grupo">
            <button
              className={`btn-toggle-layer ${activadoCapa ? 'activo' : ''}`}
              onClick={() => setActivoCapa(!activadoCapa)}
              title="Capas"
            >
              <Layers size={18} />
            </button>

            {activadoCapa && (
              <MenuCapas
                capas={capas}
                setCapas={setCapas}
              />
            )}
          </div>

          <div className="controles-mapa__grupo">
            <button
              className={`btn-toggle-estadisticas ${estadisticasAbiertas ? 'activo' : ''}`}
              onClick={() => setEstadisticasAbiertas(!estadisticasAbiertas)}
              title="Estadísticas"
            >
              <BarChart3 size={18} />
            </button>

            {estadisticasAbiertas && (
              <EstadisticasZona
                zona={zonaActiva}
                capas={capas}
                capaEquipamiento={capaEquipamiento}
                capaLugares={capaLugares}
                mapaRef={mapaRef}
              />
            )}
          </div>

          <div className="controles-mapa__grupo">
            <button
              className={`btn-toggle-historial ${historialAbierto ? 'activo' : ''}`}
              onClick={() => setHistorialAbierto(!historialAbierto)}
              title="Mis zonas"
            >
              <History size={18} />
            </button>

            {historialAbierto && (
              <HistorialZonas setCapas={setCapas} />
            )}
          </div>

          <div className="controles-mapa__grupo">
            <button
              className={`btn-toggle-estadisticas ${cercaAbierto ? 'activo' : ''}`}
              onClick={() => setCercaAbierto(!cercaAbierto)}
              title="¿Qué hay cerca?"
            >
              <MapPin size={18} />
            </button>

            {cercaAbierto && (
              <QueHayCerca punto={coordenada} onResultados={setResaltados} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}