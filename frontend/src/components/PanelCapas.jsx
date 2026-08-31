import { useState } from 'react'
import InfoCRS from './InfoCRS'
import { reproyectarGeoJSON, asegurarDefinicionEPSG } from '../utils/reproyectar'
import { toast } from 'sonner'
import '../styles/PanelCapas.css'

function badgeInfo(geojson) {
  const tipo = geojson?.features?.[0]?.geometry?.type || geojson?.type || ''
  if (tipo.includes('Point')) return { clase: 'badge-point', texto: 'Punto' }
  if (tipo.includes('Line')) return { clase: 'badge-line', texto: 'Línea' }
  if (tipo.includes('Polygon')) return { clase: 'badge-polygon', texto: 'Polígono' }
  return { clase: '', texto: tipo || '—' }
}

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
      toast.success(`Reproyectada a EPSG:${destino}`)
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
    setCapas(capas.filter(c => c.id !== id))
  }

  const capasSueltas = capas.filter(c => !c.grupo)
  const grupos = {}
  capas.filter(c => c.grupo).forEach(c => {
    if (!grupos[c.grupo]) grupos[c.grupo] = { nombre: c.grupoNombre, capas: [] }
    grupos[c.grupo].capas.push(c)
  })

  function renderCapa(capa) {
    const badge = badgeInfo(capa.geojson)

    return (
      <div key={capa.id} className={`capa-chip-wrapper ${capa.visible ? '' : 'oculta'}`}>
        <div className="capa-chip-header">
          <span className="capa-chip-nombre">
            {capa.nombre}
            <span className={`badge ${badge.clase}`}>{badge.texto}</span>
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
            <button className="capa-chip-eliminar" onClick={() => eliminarCapa(capa.id)}>🗑️</button>
          </div>
        </div>

        <div className="capa-chip-detalle">
          <InfoCRS crs={capa.crs} />

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
        </div>
      </div>
    )
  }

  if (capas.length === 0) return null

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => marcarTodas(true)} style={{ flex: 1, fontSize: 12 }}>
          Marcar todo
        </button>
        <button onClick={() => marcarTodas(false)} style={{ flex: 1, fontSize: 12, background: '#444' }}>
          Desmarcar todo
        </button>
      </div>

      {Object.entries(grupos).map(([grupoId, grupo]) => {
        const abierto = gruposAbiertos[grupoId] ?? false
        const visibles = grupo.capas.filter(c => c.visible).length

        return (
          <div key={grupoId} className="capa-item" style={{ marginBottom: 10, padding: 10 }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => toggleGrupoAbierto(grupoId)}
            >
              <p style={{ margin: 0 }}>
                {abierto ? '▾' : '▸'} {grupo.nombre}
                <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>
                  ({visibles}/{grupo.capas.length} visibles)
                </span>
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: abierto ? 10 : 0 }}>
              <button
                onClick={(e) => { e.stopPropagation(); marcarGrupo(grupoId, true) }}
                style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}
              >
                Marcar todo
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); marcarGrupo(grupoId, false) }}
                style={{ flex: 1, fontSize: 11, padding: '4px 8px', background: '#444' }}
              >
                Desmarcar todo
              </button>
            </div>

            {abierto && (
              <div style={{ borderTop: '1px solid #333', paddingTop: 10 }}>
                {grupo.capas.map(renderCapa)}
              </div>
            )}
          </div>
        )
      })}

      {capasSueltas.map(renderCapa)}
    </div>
  )
}