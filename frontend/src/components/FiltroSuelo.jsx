import { useState } from 'react'
import { Info } from 'lucide-react'
import { estiloCategoriaSuelo, descripcionCategoriaSuelo } from '../utils/categoriasSuelo'
import AyudaInfo from './AyudaInfo'
import '../styles/FiltroCategorias.css'
import '../styles/FiltroSuelo.css'

// Leyenda y filtro del suelo. Es independiente de los filtros de equipamientos:
// solo recibe la capa de suelo y la lista de categorías ocultas.
export default function FiltroSuelo({ capaSuelo, ocultas = [], setOcultas }) {
  const [abierta, setAbierta] = useState(null)
  const filas = capaSuelo?.resumenSuelo || []
  const ocultasSet = new Set(ocultas)

  function alternar(categoria) {
    setOcultas((previas) =>
      previas.includes(categoria)
        ? previas.filter((c) => c !== categoria)
        : [...previas, categoria]
    )
  }

  const encabezado = (
    <div className="filtro-categorias-sidebar__header">
      <h3 className="filtro-categorias-sidebar__title">Clasificación del suelo (POT)</h3>
    </div>
  )

  if (!capaSuelo || filas.length === 0) {
    return (
      <aside className="filtro-categorias-sidebar filtro-suelo">
        {encabezado}
        <div className="filtro-categorias-sidebar__contenido">
          <p className="filtro-suelo__vacio">
            Todavía no hay suelo en el mapa. En “Mapear una zona” marca la casilla de suelo / POT
            y crea la zona: aquí aparecerá la leyenda.
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="filtro-categorias-sidebar filtro-suelo">
      {encabezado}

      <div className="filtro-categorias-sidebar__contenido">
        <p className="filtro-suelo__nota filtro-suelo__nota--arriba">
          Marca o desmarca cada clase para verla u ocultarla en el mapa.
        </p>

        <div className="filtro-categorias-sidebar__acciones">
          <button
            type="button"
            className="filtro-categorias-sidebar__boton filtro-categorias-sidebar__boton--activo"
            onClick={() => setOcultas([])}
          >
            Mostrar todas
          </button>
          <button
            type="button"
            className="filtro-categorias-sidebar__boton filtro-categorias-sidebar__boton--inactivo"
            onClick={() => setOcultas(filas.map((f) => f.categoria))}
          >
            Ocultar todas
          </button>
        </div>

        <ul className="filtro-suelo__lista">
          {filas.map((fila) => {
            const estilo = estiloCategoriaSuelo(fila.categoria)
            const Icono = estilo.icono
            const activa = !ocultasSet.has(fila.categoria)
            const porcentaje = Number(fila.porcentaje)
            const detalleAbierto = abierta === fila.categoria
            const texto = descripcionCategoriaSuelo(fila.categoria)

            return (
              <li key={fila.categoria}>
                <div className={`filtro-suelo__item ${activa ? 'is-active' : 'is-disabled'}`}>
                  <label className="filtro-suelo__principal">
                    <input
                      type="checkbox"
                      checked={activa}
                      onChange={() => alternar(fila.categoria)}
                    />
                    <span
                      className="filtro-suelo__muestra"
                      style={{ backgroundColor: fila.color }}
                      aria-hidden="true"
                    />
                    <span className="filtro-suelo__nombre">
                      <Icono size={15} strokeWidth={2} aria-hidden="true" />
                      {fila.etiqueta}
                    </span>
                  </label>
                  <span className="filtro-suelo__porcentaje">
                    {Number.isFinite(porcentaje) ? `${porcentaje.toFixed(1)} %` : '—'}
                  </span>
                  <button
                    type="button"
                    className="filtro-suelo__info"
                    aria-expanded={detalleAbierto}
                    aria-label={`Ver qué significa ${fila.etiqueta}`}
                    title="Qué significa"
                    onClick={() => setAbierta(detalleAbierto ? null : fila.categoria)}
                  >
                    <Info size={14} />
                  </button>
                </div>

                {detalleAbierto && (
                  <div className="filtro-suelo__detalle">
                    <h5>Qué significa (explicación de la aplicación)</h5>
                    <p>{texto.descripcion}</p>
                    {texto.referencia && <p className="filtro-suelo__referencia">{texto.referencia}</p>}

                    <h5>En esta zona (calculado por la aplicación)</h5>
                    <p>
                      {Number(fila.areaKm2).toFixed(2)} km² ·{' '}
                      {Number.isFinite(porcentaje) ? `${porcentaje.toFixed(1)} %` : '—'} del área ·{' '}
                      {fila.poligonos} polígonos de origen que tocan la zona
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <AyudaInfo titulo="¿Cómo leer esta leyenda?">
          <p>
            Las clases pueden solaparse (protección y riesgo cubren parte del suelo urbano y rural),
            por eso los porcentajes no suman 100 %.
          </p>
          <p>
            Estos filtros solo cambian cómo se ve el suelo: no afectan equipamientos, lugares,
            cobertura ni teselado.
          </p>
        </AyudaInfo>
      </div>
    </aside>
  )
}