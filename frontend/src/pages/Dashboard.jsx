import { useState, useRef } from 'react'
import Mapa from "../components/Mapa";
import '../styles/Dashboard.css'
import SeleccionarCapa from '../components/SeleccionarCapa';
import CargarCapaAPI from "../components/CargarCapaAPI";
import ModuloProximamente from "../components/ModuloProximamente";
import '../styles/ModuloProximamente.css'
import { Filter, Layers, BarChart3, History } from 'lucide-react'
import MenuCapas from '../components/MenuCapas';
import FiltroCategorias from '../components/FiltroCategorias';
import EstadisticasZona from '../components/EstadisticasZona';
import AuthPanel from '../components/AuthPanel';
import HistorialZonas from '../components/HistorialZonas';

export default function App() {
  const [capas, setCapas] = useState([])
  const [coordenada, setCoordenada] = useState(null)
  const [modoRenderer, setModoRenderer] = useState('leaflet')
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [activadoCapa, setActivoCapa] = useState(false)
  const [estadisticasAbiertas, setEstadisticasAbiertas] = useState(false)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const mapaRef = useRef(null)

  const capaEquipamiento = [...capas]
    .reverse()
    .find(c => (
      c.origenAPI === true || c.crs?.fuente?.includes('AMVA ArcGIS REST')
    ) && c.tipo !== 'lugares' && c.tipo !== 'suelo' && c.visible) ?? null

  const capaLugares = [...capas]
    .reverse()
    .find(c => c.tipo === 'lugares' && c.visible) ?? null

  const capaSuelo = [...capas]
    .reverse()
    .find(c => c.tipo === 'suelo' && c.visible) ?? null

  const zonaActiva = [...capas]
    .reverse()
    .find(c => (c.esZonaVisual || c.tipo === 'zona') && c.visible) ?? null

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Visor Geográfico</h2>
        <title>Visor Geográfico</title>
        <p className="sidebar-subtitle">Carga, reproyecta y guarda capas SIG</p>

        <div className="sidebar-section">
          <AuthPanel />
        </div>

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
          <Mapa ref={mapaRef} capas={capas} onMapReady={() => {}} onClickMapa={setCoordenada} />
        ) : (
          <ModuloProximamente />
        )}

        {/* Cada botón vive en el mismo contenedor que su panel, apilados
            verticalmente. Así el panel siempre nace pegado a su botón,
            sin depender de cálculos manuales de "right"/"top" que se
            desincronizan entre archivos CSS distintos. */}
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
        </div>
      </div>
    </div>
  )
}