import { useState } from 'react'
import InfoCRS from './InfoCRS'
import { reproyectarGeoJSON, asegurarDefinicionEPSG } from '../utils/reproyectar'
import { toast } from 'sonner'

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

  return (
    <div>
      {capas.map(capa => {
        const badge = badgeInfo(capa.geojson)
        return (
          <div key={capa.id} className="capa-item" style={{ marginBottom: 10 }}>
            <p>
              {capa.nombre}
              <span className={`badge ${badge.clase}`}>{badge.texto}</span>
            </p>
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
        )
      })}
    </div>
  )
}