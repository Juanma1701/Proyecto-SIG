import { useState } from 'react'
import InfoCRS from './InfoCRS'
import { reproyectarGeoJSON, asegurarDefinicionEPSG } from '../utils/reproyectar'
import { toast } from 'sonner'
import '../styles/PanelCapas.css'
import { Trash2} from 'lucide-react'

function badgeInfo(geojson) {
  const tipo = geojson?.features?.[0]?.geometry?.type || geojson?.type || ''
  if (tipo.includes('Point')) return { clase: 'panel-capas__badge--point', texto: 'Punto' }
  if (tipo.includes('Line')) return { clase: 'panel-capas__badge--line', texto: 'Línea' }
  if (tipo.includes('Polygon')) return { clase: 'panel-capas__badge--polygon', texto: 'Polígono' }
  return { clase: '', texto: tipo || '—' }
}

const SISTEMAS_PROYECTADOS = [3115, 3116, 3117, 9377, 32618]

export default function PanelCapas({ capas, setCapas }) {
  const [sridDestino, setSridDestino] = useState({})
  const [reproyectando, setReproyectando] = useState(null)
  const [gruposAbiertos, setGruposAbiertos] = useState({})

  async function manejarReproyeccion(capa) {
    const destino = parseInt(sridDestino[capa.id])
    if (!destino) return toast.error('Escribe un código EPSG válido')

    setReproyectando(capa.id)
    try {
      await asegurarDefinicionEPSG(destino)
      const reproyectado = reproyectarGeoJSON(capa.geojson, capa.crs.epsg, destino)

      setCapas(capas.map(c =>
        c.id === capa.id
          ? { ...c, geojson: reproyectado, crs: { epsg: destino, fuente: 'reproyectado por el usuario' } }
          : c
      ))

      if (SISTEMAS_PROYECTADOS.includes(destino)) {
        toast.warning(
          `Reproyectada a EPSG:${destino} — el dato es correcto (coordenadas en metros), pero el mapa no puede visualizarlo directamente en este sistema. Reproyecta de nuevo a 4326 para verlo en pantalla.`,
          { duration: 6000 }
        )
      } else {
        toast.success(`Reproyectada a EPSG:${destino}`)
      }
    } catch (error) {
      console.error(error)
      toast.error('No se pudo reproyectar: ' + error.message)
    } finally {
      setReproyectando(null)
    }
  }

  function marcarTodas(valor) {
    setCapas(capas.map(c => ({ ...c, visible: valor })))
  }

  function marcarGrupo(grupoId, valor) {
    setCapas(capas.map(c => c.grupo === grupoId ? { ...c, visible: valor } : c))
  }

  function toggleGrupoAbierto(grupoId) {
    setGruposAbiertos(prev => ({ ...prev, [grupoId]: !prev[grupoId] }))
  }

  function eliminarCapa(id) {
    setCapas(prev => prev.filter(c => c.id !== id))
  }

  const capasSueltas = capas.filter(c => !c.grupo)
  const grupos = {}
  capas.filter(c => c.grupo).forEach(c => {
    if (!grupos[c.grupo]) grupos[c.grupo] = { nombre: c.grupoNombre, capas: [] }
    grupos[c.grupo].capas.push(c)
  })

  function renderCapa(capa) {
    const esZona = capa.esZonaVisual || capa.tipo === 'zona'
    const badge = esZona ? { clase: '', texto: 'Zona' } : badgeInfo(capa.geojson)

    return (
      <div key={capa.id} className={`panel-capas__chip ${capa.visible ? '' : 'oculta'}`}>
        <div className="capa-chip-header">
          <span className="capa-chip-nombre">
            {capa.nombre}
            <span className={`panel-capas__badge ${badge.clase}`}>{badge.texto}</span>
          </span>
          <div className="capa-chip-acciones">
            <label className="switch">
              <input
                type="checkbox"
                checked={capa.visible}
                onChange={() => setCapas(capas.map(c =>
                  c.id === capa.id ? { ...c, visible: !c.visible } : c
                ))}
              />
              <span className="switch-slider"></span>
            </label>
            <button className="capa-chip-eliminar" onClick={() => eliminarCapa(capa.id)}><Trash2 /></button>
          </div>
        </div>

        <div className="capa-chip-detalle">
          <InfoCRS crs={capa.crs} />

          {!esZona && (
            <>
              <input
                placeholder="EPSG destino (ej: 3116)"
                value={sridDestino[capa.id] || ''}
                onChange={e => setSridDestino({ ...sridDestino, [capa.id]: e.target.value })}
              />
              <button onClick={() => manejarReproyeccion(capa)} disabled={reproyectando === capa.id}>
                {reproyectando === capa.id ? (
                  <><span className="spinner"></span>Reproyectando...</>
                ) : (
                  'Reproyectar'
                )}
              </button>
            </>
          )}
        </div>

      </div>
    )
  }

  return (
    <div className="panel-capas__contenedor">
      {capas.length === 0 ? (
        <p className="panel-capas__vacio">No hay capas cargadas</p>
      ) : (
        <>
          <div className="panel-capas__acciones-principales">
            <button className="panel-capas__accion panel-capas__accion--activo" onClick={() => marcarTodas(true)}>
              Marcar todo
            </button>
            <button className="panel-capas__accion panel-capas__accion--inactivo" onClick={() => marcarTodas(false)}>
              Desmarcar todo
            </button>
          </div>

          {Object.entries(grupos).map(([grupoId, grupo]) => {
        const abierto = gruposAbiertos[grupoId] ?? false
        const visibles = grupo.capas.filter(c => c.visible).length

            return (
              <div key={grupoId} className="panel-capas__grupo">
            <div className="panel-capas__grupo-header" onClick={() => toggleGrupoAbierto(grupoId)}>
              <p className="panel-capas__grupo-titulo">
                {abierto ? '▾' : '▸'} {grupo.nombre}
                <span className="panel-capas__grupo-visibles">
                  ({visibles}/{grupo.capas.length} visibles)
                </span>
              </p>
            </div>

            <div className={`panel-capas__grupo-acciones ${abierto ? 'is-open' : ''}`}>
              <button
                className="panel-capas__grupo-boton panel-capas__grupo-boton--activo"
                onClick={(e) => { e.stopPropagation(); marcarGrupo(grupoId, true) }}
              >
                Marcar todo
              </button>
              <button
                className="panel-capas__grupo-boton panel-capas__grupo-boton--inactivo"
                onClick={(e) => { e.stopPropagation(); marcarGrupo(grupoId, false) }}
              >
                Desmarcar todo
              </button>
            </div>

            {abierto && (
              <div className="panel-capas__grupo-cuerpo">
                {grupo.capas.map(renderCapa)}
              </div>
            )}
              </div>
            )
          })}

          {capasSueltas.map(renderCapa)}
        </>
      )}
    </div>
  )
}