import { useState } from 'react'
import FiltroCategorias from './FiltroCategorias'
import '../styles/LeyendaFlotante.css'

export default function LeyendaFlotante({ capas, setCapas }) {
  const [colapsada, setColapsada] = useState(false)

  console.log('Capas recibidas en LeyendaFlotante:', capas.map(c => ({ nombre: c.nombre, fuente: c.crs?.fuente, visible: c.visible })))

  const capaEquipamiento = capas.find(c => c.crs?.fuente === 'API ArcGIS REST (AMVA)' && c.visible)

  if (!capaEquipamiento) return null

  return (
    <div className={`leyenda-flotante ${colapsada ? 'leyenda-flotante--colapsada' : ''}`}>
      <div className="leyenda-flotante__header" onClick={() => setColapsada(!colapsada)}>
        <span>📍 {capaEquipamiento.nombre}</span>
        <span>{colapsada ? '▸' : '▾'}</span>
      </div>
      {!colapsada && (
        <FiltroCategorias capa={capaEquipamiento} capas={capas} setCapas={setCapas} />
      )}
    </div>
  )
}