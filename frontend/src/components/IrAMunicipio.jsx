import { MapPin } from 'lucide-react'
import { MUNICIPIOS_VALLE_ABURRA } from '../utils/municipiosValleAburra'
import '../styles/IrAMunicipio.css'

const ORDENADOS = [...MUNICIPIOS_VALLE_ABURRA].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

// Desplegable para acercar el mapa a uno de los 10 municipios del Valle de Aburrá.
// El valor vuelve siempre a "vacío" para poder elegir de nuevo el mismo municipio.
export default function IrAMunicipio({ onIr }) {
  return (
    <label className="ir-municipio">
      <span className="ir-municipio__etiqueta">
        <MapPin size={14} aria-hidden="true" />
        Ir a un municipio
      </span>
      <select
        value=""
        onChange={(evento) => {
          if (evento.target.value) onIr(evento.target.value)
        }}
      >
        <option value="" disabled>Elige un municipio del Valle…</option>
        {ORDENADOS.map((municipio) => (
          <option key={municipio.slug} value={municipio.nombre}>
            {municipio.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}