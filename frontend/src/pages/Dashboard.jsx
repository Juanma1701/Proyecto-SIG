import { useState, useRef, useEffect, useCallback } from 'react'
import L from 'leaflet'
import { toast } from 'sonner'
import Mapa from "../components/Mapa";
import '../styles/Dashboard.css'
import SeleccionarCapa from '../components/SeleccionarCapa';
import CargarCapaAPI from "../components/CargarCapaAPI";
import '../styles/ModuloProximamente.css'
import '../styles/VolverInicio.css'
import '../styles/PopupCerrar.css'
import '../styles/HerramientasTip.css'
import '../styles/MapaControles.css'
import { Filter, Layers, BarChart3, History, MapPinned, MapPin, Sparkles, UserRound, Mountain, Building2, Home, Menu, X, BookOpen, Link2 } from 'lucide-react'
import MenuCapas from '../components/MenuCapas';
import FiltroCategorias from '../components/FiltroCategorias';
import FiltroSuelo from '../components/FiltroSuelo';
import FiltroUsos from '../components/FiltroUsos';
import LeyendaMapa from '../components/LeyendaMapa';
import AnalisisRapido from '../components/AnalisisRapido';
import IrAMunicipio from '../components/IrAMunicipio';
import GuiaModal from '../components/GuiaModal';
import EstadisticasZona from '../components/EstadisticasZona';
import AuthPanel from '../components/AuthPanel';
import HistorialZonas from '../components/HistorialZonas';
import CargarCapaArchivo from '../components/CargarGeoJSON';
import BotonGuardarNube from '../components/BotonGuardarNube';
import QueHayCerca from '../components/QueHayCerca';
import { MUNICIPIOS_VALLE_ABURRA } from '../utils/municipiosValleAburra';
import { leerZonaDeEnlace, escribirZonaEnEnlace, borrarZonaDeEnlace, urlDeZona } from '../utils/enlaceZona';
import Inicio from './Inicio';

// La portada se muestra solo la primera vez: el navegador recuerda que ya se vio.
// Si el almacenamiento del navegador no está disponible, la portada se muestra siempre.
// Si alguien abre un enlace con una zona (#zona=...), se salta la portada y va directo al mapa.
const CLAVE_INICIO_VISTO = 'geoaburra_inicio_visto'

function inicioYaVisto() {
  try {
    return window.localStorage.getItem(CLAVE_INICIO_VISTO) === '1'
  } catch {
    return false
  }
}

function recordarInicioVisto() {
  try {
    window.localStorage.setItem(CLAVE_INICIO_VISTO, '1')
  } catch {
    // sin almacenamiento: no pasa nada, la portada volverá a salir al recargar
  }
}

// Valor estable para "ninguna categoría oculta": si fuera un [] nuevo en cada render,
// los efectos de Mapa.jsx que lo observan se repetirían sin parar.
const SIN_OCULTAS = []

// Categorías ocultas de una capa (suelo o usos). La lista está atada al id de la capa:
// cuando cambia la capa, vuelve a quedar vacía sin necesidad de un efecto que la reinicie.
// El setter acepta un valor o una función, igual que el de useState.
function useOcultasPorCapa(capaId) {
  const id = capaId ?? null
  const [estado, setEstado] = useState({ id: null, lista: SIN_OCULTAS })

  const ocultas = estado.id === id ? estado.lista : SIN_OCULTAS

  const setOcultas = useCallback(
    (valor) => {
      setEstado((previo) => {
        const actual = previo.id === id ? previo.lista : SIN_OCULTAS
        const lista = typeof valor === 'function' ? valor(actual) : valor
        return { id, lista }
      })
    },
    [id]
  )

  return [ocultas, setOcultas]
}

// Botones de la barra de herramientas del mapa. Solo UN panel puede estar abierto a la vez.
// `descripcion` es el texto de la burbuja que aparece al pasar el cursor.
const HERRAMIENTAS = [
  {
    id: 'filtros',
    etiqueta: 'Filtros',
    descripcion: 'Muestra u oculta los equipamientos y lugares por categoría.',
    icono: Filter
  },
  {
    id: 'suelo',
    etiqueta: 'Suelo',
    descripcion: 'Leyenda y filtro de la clasificación del suelo (POT).',
    icono: Mountain
  },
  {
    id: 'usos',
    etiqueta: 'Usos',
    descripcion: 'Leyenda y filtro de los usos del suelo oficiales de Medellín (POT de 2014).',
    icono: Building2
  },
  {
    id: 'capas',
    etiqueta: 'Capas',
    descripcion: 'Las capas que has cargado en el mapa.',
    icono: Layers
  },
  {
    id: 'estadisticas',
    etiqueta: 'Estadísticas',
    descripcion: 'Cifras de la zona, informe en PDF y guardado.',
    icono: BarChart3
  },
  {
    id: 'historial',
    etiqueta: 'Mis zonas',
    descripcion: 'Las zonas que guardaste con tu cuenta.',
    icono: History
  },
  {
    id: 'cerca',
    etiqueta: 'Cerca',
    descripcion: 'Busca equipamientos cerca del último punto que marcaste en el mapa.',
    icono: MapPin
  }
]

function tieneElementos(capa) {
  const features = capa?.geojsonOriginal?.features || capa?.geojson?.features || []
  return features.length > 0
}


export default function App() {
  const [enInicio, setEnInicio] = useState(() => !inicioYaVisto() && !leerZonaDeEnlace())
  const [capas, setCapas] = useState([])
  const [coordenada, setCoordenada] = useState(null)
  const [modoRenderer, setModoRenderer] = useState('leaflet')
  const [panelAbierto, setPanelAbierto] = useState(null)
  const [barraAbierta, setBarraAbierta] = useState(false)
  const [guiaAbierta, setGuiaAbierta] = useState(false)
  const [resaltados, setResaltados] = useState(null)
  const [profileActive, setProfileActive] = useState(false)
  const [rapidoVisible, setRapidoVisible] = useState(true)
  const [creandoZona, setCreandoZona] = useState(false)

  const mapaRef = useRef(null)
  const zonaFormRef = useRef(null)
  const mapaLeafletRef = useRef(null)
  const enlaceAplicadoRef = useRef(false)
  const huboZonaRef = useRef(false)

  const capaEquipamiento = [...capas]
    .reverse()
    .find(c => (
      c.origenAPI === true || c.crs?.fuente?.includes('AMVA ArcGIS REST')
    ) && c.tipo !== 'lugares' && c.tipo !== 'suelo' && c.tipo !== 'usos' && c.tipo !== 'cobertura' && c.tipo !== 'teselado' && c.tipo !== 'limites' && c.visible) ?? null

  const capaLugares = [...capas]
    .reverse()
    .find(c => c.tipo === 'lugares' && c.visible) ?? null

  const capaSuelo = [...capas]
    .reverse()
    .find(c => c.tipo === 'suelo' && c.visible) ?? null

  const capaUsos = [...capas]
    .reverse()
    .find(c => c.tipo === 'usos' && c.visible) ?? null

  const zonaActiva = [...capas]
    .reverse()
    .find(c => (c.esZonaVisual || c.tipo === 'zona') && c.visible) ?? null

  // Filtros de categorías del suelo y de los usos (se reinician solos al cambiar de capa)
  const [sueloOcultas, setSueloOcultas] = useOcultasPorCapa(capaSuelo?.id)
  const [usosOcultas, setUsosOcultas] = useOcultasPorCapa(capaUsos?.id)

  // La dirección del navegador siempre refleja la zona activa (enlace compartible).
  // Si ya no queda ninguna zona, se borra de la dirección.
  const zonaId = zonaActiva?.id
  const zonaLat = zonaActiva?.centro?.lat
  const zonaLng = zonaActiva?.centro?.lng
  const zonaRadio = zonaActiva?.radioKm
  useEffect(() => {
    if (zonaId && Number.isFinite(zonaLat) && Number.isFinite(zonaLng) && Number.isFinite(Number(zonaRadio))) {
      huboZonaRef.current = true
      escribirZonaEnEnlace({ lat: zonaLat, lng: zonaLng, radioKm: Number(zonaRadio) })
    } else if (huboZonaRef.current) {
      huboZonaRef.current = false
      borrarZonaDeEnlace()
    }
  }, [zonaId, zonaLat, zonaLng, zonaRadio])

  // Esc cierra el panel abierto (si la guía está abierta, Esc cierra la guía y no el panel)
  useEffect(() => {
    if (!panelAbierto || enInicio || guiaAbierta) return
    function alPulsar(evento) {
      if (evento.key === 'Escape') setPanelAbierto(null)
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [panelAbierto, enInicio, guiaAbierta])

  // Se llama una vez cuando Mapa.jsx crea el mapa de Leaflet
  const alMapaListo = useCallback((mapa) => {
    mapaLeafletRef.current = mapa

    // Escala gráfica (metros y kilómetros)
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(mapa)

    // Créditos: el de OpenStreetMap ahora enlaza a su licencia, y se agregan las fuentes de datos
    const atribucion = mapa.attributionControl
    if (atribucion) {
      atribucion.removeAttribution('&copy; OpenStreetMap contributors')
      atribucion.addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors (ODbL)'
      )
      atribucion.addAttribution('Datos: AMVA · Alcaldía de Medellín')
    }

    // Si la dirección trae una zona (#zona=lat,lng,radio), se crea sola (solo una vez)
    if (!enlaceAplicadoRef.current) {
      enlaceAplicadoRef.current = true
      const zona = leerZonaDeEnlace()
      if (zona) setTimeout(() => zonaFormRef.current?.analizarEn(zona), 0)
    }
  }, [])

  // Cada clic en el mapa guarda el punto y vuelve a mostrar la tarjeta "Analizar aquí"
  const alClickMapa = useCallback((latlng) => {
    setCoordenada(latlng)
    setRapidoVisible(true)
  }, [])

  // Mueve el mapa a un punto y lo marca como si se hubiera hecho clic ahí
  function irA(lat, lng, zoom = 15) {
    const mapa = mapaLeafletRef.current
    if (!mapa) return
    mapa.flyTo([lat, lng], Math.max(mapa.getZoom(), zoom))
    mapa.fire('click', { latlng: { lat, lng } })
  }

  // Acerca el mapa a un municipio (las coordenadas y radios vienen de municipiosValleAburra.js)
  function irAMunicipio(nombre) {
    const municipio = MUNICIPIOS_VALLE_ABURRA.find((m) => m.nombre === nombre)
    const mapa = mapaLeafletRef.current
    if (!municipio || !mapa) return

    const radio = municipio.radioAprox * 0.8
    const dLat = radio / 111.32
    const dLng = radio / (111.32 * Math.cos((municipio.lat * Math.PI) / 180))
    mapa.flyToBounds(
      [[municipio.lat - dLat, municipio.lng - dLng], [municipio.lat + dLat, municipio.lng + dLng]],
      { padding: [20, 20] }
    )
    setBarraAbierta(false)
  }

  // Al crear una zona (desde el formulario o desde la tarjeta), el mapa se acerca a ella.
  // En el celular, además, se cierra el panel izquierdo para dejar ver el mapa.
  function encuadrarZona({ lat, lng, radioKm }) {
    setRapidoVisible(false)
    setBarraAbierta(false)
    const mapa = mapaLeafletRef.current
    if (!mapa) return
    const dLat = radioKm / 111.32
    const dLng = radioKm / (111.32 * Math.cos((lat * Math.PI) / 180))
    mapa.fitBounds(
      [[lat - dLat, lng - dLng], [lat + dLat, lng + dLng]],
      { padding: [30, 30], maxZoom: 16 }
    )
  }

  function analizarAqui({ lat, lng, radioKm }) {
    setPanelAbierto(null)
    zonaFormRef.current?.analizarEn({ lat, lng, radioKm })
  }

  async function copiarEnlaceZona() {
    if (!zonaActiva?.centro) return
    const url = urlDeZona({
      lat: zonaActiva.centro.lat,
      lng: zonaActiva.centro.lng,
      radioKm: Number(zonaActiva.radioKm)
    })
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado. Quien lo abra verá esta zona.')
    } catch {
      toast.error('No se pudo copiar. Copia la dirección del navegador: ya incluye la zona.')
    }
  }

  const OpenProfile = () =>{
    setProfileActive(!profileActive)
  } 

  function irAlVisor() {
    recordarInicioVisto()
    setEnInicio(false)
  }

  function volverAlInicio() {
    setBarraAbierta(false)
    setEnInicio(true)
  }

  function abrirGuia() {
    setBarraAbierta(false)
    setPanelAbierto(null)
    setGuiaAbierta(true)
  }

  const cerrarGuia = useCallback(() => setGuiaAbierta(false), [])

  function alternarPanel(id) {
    setPanelAbierto((actual) => (actual === id ? null : id))
  }

  const hayFiltros = tieneElementos(capaEquipamiento) || tieneElementos(capaLugares)
  const tituloPanel = HERRAMIENTAS.find((h) => h.id === panelAbierto)?.descripcion
  

return (
    <>
      {/* La portada va encima del visor. El visor queda cargado debajo (sus zonas y capas
          no se pierden al volver a la portada) y "inert" evita que se pueda usar con el teclado
          mientras la portada o la guía están visibles. */}
      {enInicio && <Inicio onIrAlVisor={irAlVisor} />}

    <div
      className={`dashboard ${barraAbierta ? 'dashboard--barra-abierta' : ''} ${panelAbierto ? 'dashboard--panel-abierto' : ''}`}
      inert={enInicio || guiaAbierta}
    >
      {/* Solo se ve en el celular: al tocarlo se cierra el panel izquierdo */}
      <div className="dashboard__overlay" onClick={() => setBarraAbierta(false)} aria-hidden="true" />

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
          <button
            type="button"
            className="sidebar-header__cerrar-movil"
            onClick={() => setBarraAbierta(false)}
            aria-label="Cerrar el panel"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-atajos">
            <button
              type="button"
              className="volver-inicio"
              onClick={volverAlInicio}
              title="Volver a la portada de GeoAburrá"
            >
              <Home size={16} aria-hidden="true" />
              Portada
            </button>
            <button
              type="button"
              className="volver-inicio"
              onClick={abrirGuia}
              title="Abrir la guía de uso sin salir del visor"
            >
              <BookOpen size={16} aria-hidden="true" />
              Guía de uso
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <IrAMunicipio onIr={irAMunicipio} />
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
                  ref={zonaFormRef}
                  setCapas={setCapas}
                  captura={coordenada}
                  capas={capas}
                  onIrA={irA}
                  onZonaCreada={encuadrarZona}
                  onCargandoCambio={setCreandoZona}
                />
              </div>

              {zonaActiva && (
                <div className="sidebar-section">
                  <button
                    type="button"
                    className="volver-inicio"
                    onClick={copiarEnlaceZona}
                    title="Copia un enlace que abre el visor con esta misma zona"
                  >
                    <Link2 size={16} aria-hidden="true" />
                    Copiar enlace de esta zona
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      <div className={`dashboard__mapa-contenedor ${panelAbierto === 'capas' ? 'dashboard__mapa-contenedor--menu-abierto' : ''}`}>
        {modoRenderer === 'leaflet' ? (
          <Mapa ref={mapaRef} capas={capas} onMapReady={alMapaListo} onClickMapa={alClickMapa} resaltados={resaltados} sueloOcultas={sueloOcultas} usosOcultas={usosOcultas} />
        ) : (
          <Mapa capas={capas} onMapReady={alMapaListo} onClickMapa={alClickMapa} resaltados={resaltados} sueloOcultas={sueloOcultas} usosOcultas={usosOcultas} />
        )}

        {/* Tarjeta de arriba: la pista "haz clic en el mapa" y, con un punto elegido,
            los radios y el botón "Analizar aquí". Solo en el modo de zonas. */}
        {modoRenderer === 'leaflet' && (
          <AnalisisRapido
            punto={coordenada}
            zona={zonaActiva}
            visible={rapidoVisible}
            oculta={Boolean(panelAbierto)}
            ocupado={creandoZona}
            onAnalizar={analizarAqui}
            onElegirCapas={() => setBarraAbierta(true)}
          />
        )}

        {/* Leyenda abajo a la derecha: activa o desactiva categorías de equipamientos y lugares.
            Se esconde mientras hay un panel abierto, para que no se tapen entre sí. */}
        <LeyendaMapa
          capaEquipamiento={capaEquipamiento}
          capaLugares={capaLugares}
          setCapas={setCapas}
          oculta={Boolean(panelAbierto)}
        />

        {/* Solo se ve en el celular: abre el panel izquierdo (crear zona, datos del AMVA, cuenta) */}
        <button
          type="button"
          className="btn-toggle-barra"
          onClick={() => setBarraAbierta(true)}
          aria-label="Abrir el panel para crear zonas y cargar datos"
        >
          <Menu size={18} aria-hidden="true" />
          Menú
        </button>

        <div className="herramientas" role="toolbar" aria-label="Herramientas del mapa">
          {HERRAMIENTAS.map(({ id, etiqueta, descripcion, icono: Icono }) => (
            <button
              key={id}
              type="button"
              className={`btn-herramienta ${panelAbierto === id ? 'activo' : ''}`}
              onClick={() => alternarPanel(id)}
              aria-label={`${etiqueta}: ${descripcion}`}
              aria-pressed={panelAbierto === id}
            >
              <Icono size={20} aria-hidden="true" />
              <span>{etiqueta}</span>
              <span className="btn-herramienta__tip" aria-hidden="true">
                <strong>{etiqueta}</strong>
                {descripcion}
              </span>
            </button>
          ))}
        </div>

        {panelAbierto && (
          <div className="panel-flotante" role="region" aria-label={tituloPanel}>
            <button type="button" className="panel-flotante__cerrar" onClick={() => setPanelAbierto(null)}>
              <X size={18} aria-hidden="true" />
              Cerrar
            </button>

            <div className="panel-flotante__cuerpo">
              {panelAbierto === 'filtros' && (
                hayFiltros ? (
                  <FiltroCategorias
                    capa={capaEquipamiento}
                    capaLugares={capaLugares}
                    capas={capas}
                    setCapas={setCapas}
                  />
                ) : (
                  <div className="panel-flotante__vacio">
                    Todavía no hay equipamientos en el mapa. Crea una zona en el panel de trabajo
                    y aquí podrás filtrarlos por categoría.
                  </div>
                )
              )}

              {panelAbierto === 'suelo' && (
                <FiltroSuelo
                  capaSuelo={capaSuelo}
                  ocultas={sueloOcultas}
                  setOcultas={setSueloOcultas}
                />
              )}

              {panelAbierto === 'usos' && (
                <FiltroUsos
                  capaUsos={capaUsos}
                  ocultas={usosOcultas}
                  setOcultas={setUsosOcultas}
                />
              )}

              {panelAbierto === 'capas' && (
                <MenuCapas
                  capas={capas}
                  setCapas={setCapas}
                />
              )}

              {panelAbierto === 'estadisticas' && (
                <EstadisticasZona
                  zona={zonaActiva}
                  capas={capas}
                  capaEquipamiento={capaEquipamiento}
                  capaLugares={capaLugares}
                  mapaRef={mapaRef}
                />
              )}

              {panelAbierto === 'historial' && (
                <HistorialZonas setCapas={setCapas} />
              )}

              {panelAbierto === 'cerca' && (
                <QueHayCerca punto={coordenada} onResultados={setResaltados} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* La guía va FUERA del visor para que el visor quede bloqueado (inert) mientras está abierta */}
    {guiaAbierta && <GuiaModal onCerrar={cerrarGuia} />}
    </>
  )
}