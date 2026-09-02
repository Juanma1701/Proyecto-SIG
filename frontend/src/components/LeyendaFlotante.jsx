import { useState } from 'react'
import FiltroCategorias from './FiltroCategorias'
import '../styles/LeyendaFlotante.css'
import {Pin} from 'lucide-react'

export default function LeyendaFlotante({ capas, setCapas }) {
  const [colapsada, setColapsada] = useState(false)

  const capaEquipamiento = capas.find(c =>
    c.crs?.fuente?.includes('API ArcGIS REST (AMVA)') && c.visible
  )

  if (!capaEquipamiento || !capaEquipamiento.geojson?.features?.length) return null

  return (
    <div className={`leyenda-flotante ${colapsada ? 'leyenda-flotante--colapsada' : ''}`}>
      <div className="leyenda-flotante__header" onClick={() => setColapsada(!colapsada)}>
        <span><Pin size={16} /> {capaEquipamiento.nombre}</span>
        <span>{colapsada ? '▸' : '▾'}</span>
      </div>
      {!colapsada && (
        <FiltroCategorias capa={capaEquipamiento} capas={capas} setCapas={setCapas} />
      )}
    </div>
  )
}