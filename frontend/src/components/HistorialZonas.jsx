import { useEffect, useState, useMemo } from 'react'
import { Trash2, MapPin, GitCompare } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { listarZonas, eliminarZonaGuardada, capasDesdeZonaGuardada } from '../utils/zonasGuardadas'
import { analizarZonaGuardada } from '../utils/analisisEspacial'
import { estiloCategoria } from '../utils/categoriasEquipamiento'
import { CATEGORIAS_LUGARES, estiloCategoriaLugar } from '../utils/categoriasLugares'
import '../styles/HistorialZonas.css'

function estiloUnificado(categoria) {
  if (CATEGORIAS_LUGARES[categoria]) return estiloCategoriaLugar(categoria)
  return estiloCategoria(categoria)
}

function PanelComparacion({ filaA, filaB }) {
  const analisisA = useMemo(() => analizarZonaGuardada(filaA), [filaA])
  const analisisB = useMemo(() => analizarZonaGuardada(filaB), [filaB])

  const categorias = useMemo(() => {
    return [...new Set([...Object.keys(analisisA.porCategoria), ...Object.keys(analisisB.porCategoria)])]
      .sort((a, b) => (analisisB.porCategoria[b] || 0) + (analisisA.porCategoria[b] || 0)
        - ((analisisB.porCategoria[a] || 0) + (analisisA.porCategoria[a] || 0)))
  }, [analisisA, analisisB])

  return (
    <div className="historial-zonas__comparacion">
      <div className="historial-zonas__comparacion-header">
        <span className="historial-zonas__comparacion-nombre">{filaA.nombre}</span>
        <span className="historial-zonas__comparacion-vs">vs</span>
        <span className="historial-zonas__comparacion-nombre">{filaB.nombre}</span>
      </div>

      <div className="historial-zonas__comparacion-fila historial-zonas__comparacion-fila--total">
        <span>{analisisA.total}</span>
        <span className="historial-zonas__comparacion-etiqueta">Total</span>
        <span>{analisisB.total}</span>
      </div>

      <div className="historial-zonas__comparacion-fila">
        <span>{analisisA.areaKm2.toFixed(2)} km²</span>
        <span className="historial-zonas__comparacion-etiqueta">Área</span>
        <span>{analisisB.areaKm2.toFixed(2)} km²</span>
      </div>

      {categorias.map((categoria) => {
        const { etiqueta } = estiloUnificado(categoria)
        return (
          <div key={categoria} className="historial-zonas__comparacion-fila">
            <span>{analisisA.porCategoria[categoria] || 0}</span>
            <span className="historial-zonas__comparacion-etiqueta">{etiqueta}</span>
            <span>{analisisB.porCategoria[categoria] || 0}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function HistorialZonas({ setCapas }) {
  const { user } = useAuth()
  const [zonas, setZonas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionadas, setSeleccionadas] = useState([])

  async function recargar() {
    if (!user) return
    setCargando(true)
    try {
      const data = await listarZonas(user.id)
      setZonas(data)
    } catch (error) {
      toast.error('No se pudieron cargar tus zonas: ' + error.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    recargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function manejarCargar(fila) {
    const nuevasCapas = capasDesdeZonaGuardada(fila)
    setCapas(prev => [...prev, ...nuevasCapas])
    toast.success(`"${fila.nombre}" cargada al mapa`)
  }

  async function manejarEliminar(id) {
    try {
      await eliminarZonaGuardada(id)
      setZonas(prev => prev.filter(z => z.id !== id))
      setSeleccionadas(prev => prev.filter(sid => sid !== id))
      toast.success('Zona eliminada')
    } catch (error) {
      toast.error('No se pudo eliminar: ' + error.message)
    }
  }

  function toggleSeleccion(id) {
    setSeleccionadas((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id] // mantiene solo las últimas 2
      return [...prev, id]
    })
  }

  if (!user) {
    return (
      <aside className="historial-zonas">
        <div className="historial-zonas__header">
          <h3 className="historial-zonas__title">Mis zonas</h3>
        </div>
        <div className="historial-zonas__vacio">
          Inicia sesión para guardar y ver tus zonas.
        </div>
      </aside>
    )
  }

  const [idA, idB] = seleccionadas
  const filaA = zonas.find((z) => z.id === idA)
  const filaB = zonas.find((z) => z.id === idB)

  return (
    <aside className="historial-zonas">
      <div className="historial-zonas__header">
        <h3 className="historial-zonas__title">Mis zonas</h3>
        {seleccionadas.length > 0 && (
          <span className="historial-zonas__contador-seleccion">
            <GitCompare size={12} /> {seleccionadas.length}/2 para comparar
          </span>
        )}
      </div>

      <div className="historial-zonas__contenido">
        {cargando ? (
          <div className="historial-zonas__vacio">Cargando…</div>
        ) : zonas.length === 0 ? (
          <div className="historial-zonas__vacio">
            Todavía no has guardado ninguna zona. Usa el botón "Guardar" en el panel de Estadísticas.
          </div>
        ) : (
          <>
            {zonas.map((fila) => (
              <div key={fila.id} className={`historial-zonas__item ${seleccionadas.includes(fila.id) ? 'is-seleccionada' : ''}`}>
                <label className="historial-zonas__item-checkbox">
                  <input
                    type="checkbox"
                    checked={seleccionadas.includes(fila.id)}
                    onChange={() => toggleSeleccion(fila.id)}
                  />
                </label>
                <div className="historial-zonas__item-info">
                  <span className="historial-zonas__item-nombre">{fila.nombre}</span>
                  <span className="historial-zonas__item-fecha">
                    {new Date(fila.creado_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="historial-zonas__item-acciones">
                  <button onClick={() => manejarCargar(fila)} title="Cargar al mapa">
                    <MapPin size={14} />
                  </button>
                  <button onClick={() => manejarEliminar(fila.id)} title="Eliminar" className="historial-zonas__eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {filaA && filaB && <PanelComparacion filaA={filaA} filaB={filaB} />}
          </>
        )}
      </div>
    </aside>
  )
}