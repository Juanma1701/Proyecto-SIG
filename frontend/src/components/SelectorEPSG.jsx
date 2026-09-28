import { sistemasPorGrupo, esProyectado, etiquetaEPSG } from '../utils/reproyectar'

// Sustituye al campo de texto libre que dejaba escribir cualquier número: el
// usuario solo puede elegir un sistema que la app sabe convertir de verdad, así
// no hay forma de pedir una reproyección inválida.
function SelectorEPSG({ origen, valor, onChange, deshabilitado }) {
  const origenNumero = Number(origen)
  const destinoNumero = Number(valor)

  const disponible = (epsg) => !Number.isInteger(origenNumero) || epsg !== origenNumero
  const grupos = sistemasPorGrupo().filter((grupo) => grupo.sistemas.some(disponible))

  return (
    <div className="selector-epsg">
      <select
        className="selector-epsg__select"
        value={Number.isInteger(destinoNumero) ? destinoNumero : ''}
        onChange={(evento) => onChange(evento.target.value === '' ? '' : Number(evento.target.value))}
        disabled={deshabilitado}
      >
        <option value="">Selecciona un sistema de destino...</option>

        {grupos.map((grupo) => (
          <optgroup key={grupo.id} label={grupo.nombre}>
            {grupo.sistemas.filter(disponible).map((sistema) => (
              <option key={sistema.epsg} value={sistema.epsg}>
                {etiquetaEPSG(sistema.epsg)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {Number.isInteger(destinoNumero) && destinoNumero > 0 && (
        <p className={`selector-epsg__nota ${esProyectado(destinoNumero) ? 'selector-epsg__nota--proyectado' : ''}`}>
          {esProyectado(destinoNumero)
            ? 'Sistema en metros: la capa se reproyecta para descargar, el mapa sigue mostrando el sistema original.'
            : 'Sistema en grados: la capa se reproyecta y se actualiza en el mapa.'}
        </p>
      )}
    </div>
  )
}

export default SelectorEPSG
