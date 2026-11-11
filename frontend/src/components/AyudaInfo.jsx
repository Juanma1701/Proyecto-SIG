import { useState } from 'react'
import { Info } from 'lucide-react'
import '../styles/AyudaInfo.css'

// Botón pequeño que muestra u oculta un texto de ayuda.
// Sirve para sacar las explicaciones largas de la vista principal.
export default function AyudaInfo({ titulo = '¿Qué significa?', children }) {
  const [abierta, setAbierta] = useState(false)

  return (
    <div className="ayuda-info">
      <button
        type="button"
        className="ayuda-info__boton"
        aria-expanded={abierta}
        onClick={() => setAbierta((valor) => !valor)}
      >
        <Info size={13} aria-hidden="true" />
        {titulo}
      </button>
      {abierta && <div className="ayuda-info__texto">{children}</div>}
    </div>
  )
}