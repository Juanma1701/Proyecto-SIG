import { useState, useMemo } from 'react'
import { obtenerCategoria, estiloCategoria } from '../utils/categoriasEquipamiento'
import '../styles/FiltroCategorias.css'

export default function FiltroCategorias({ capa, capas = [], setCapas }) {
  const geojsonBase = capa?.geojsonOriginal || capa?.geojson || null

  const featuresBase = useMemo(() => geojsonBase?.features || [], [geojsonBase])

  const categorias = useMemo(() => {
    if (!featuresBase.length) return []
    const set = new Set(featuresBase.map(obtenerCategoria))
    return [...set]
  }, [featuresBase])

  const [ocultasPorCapa, setOcultasPorCapa] = useState({})
  const idCapaActiva = capa?.id ?? 'sin-capa'
  const ocultas = new Set(ocultasPorCapa[idCapaActiva] || capa?.hiddenCategories || [])

  if (!capa || !geojsonBase?.features?.length) return null

  function toggleCategoria(cat) {
    const nuevasOcultas = new Set(ocultas)

    if (nuevasOcultas.has(cat)) {
      nuevasOcultas.delete(cat)
    } else {
      nuevasOcultas.add(cat)
    }

    setOcultasPorCapa((prev) => ({
      ...prev,
      [idCapaActiva]: [...nuevasOcultas]
    }))

    const geojsonFiltrado = {
      ...geojsonBase,
      features: featuresBase.filter(
        (feature) => !nuevasOcultas.has(obtenerCategoria(feature))
      )
    }

    setCapas(
      capas.map((capaActual) =>
        capaActual.id === capa.id
          ? {
              ...capaActual,
              geojson: geojsonFiltrado,
              geojsonOriginal: geojsonBase,
              hiddenCategories: [...nuevasOcultas]
            }
          : capaActual
      )
    )
  }

  function mostrarTodas() {
    setOcultasPorCapa((prev) => ({
      ...prev,
      [idCapaActiva]: []
    }))

    setCapas(
      capas.map((capaActual) =>
        capaActual.id === capa.id
          ? {
              ...capaActual,
              geojson: geojsonBase,
              geojsonOriginal: geojsonBase,
              hiddenCategories: []
            }
          : capaActual
      )
    )
  }

  return (
    <aside className="filtro-categorias-sidebar">
      <div className="filtro-categorias-sidebar__header">
        <div>
          <p className="filtro-categorias-sidebar__eyebrow">Capas</p>
          <h3 className="filtro-categorias-sidebar__title">Filtrar categorías</h3>
        </div>

        <button
          type="button"
          className="filtro-categorias-sidebar__boton"
          onClick={mostrarTodas}
        >
          Ver todo
        </button>
      </div>

      <div className="filtro-categorias-sidebar__list">
        {categorias.map((categoria) => {
          const { color, icono: Icono, etiqueta } = estiloCategoria(categoria)
          const activa = !ocultas.has(categoria)

          return (
            <label
              key={categoria}
              className={`filtro-categorias-sidebar__item ${activa ? 'is-active' : 'is-disabled'}`}
            >
              <input
                type="checkbox"
                checked={activa}
                onChange={() => toggleCategoria(categoria)}
              />

              <span
                className="filtro-categorias-sidebar__punto"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />

              <span className="filtro-categorias-sidebar__text">
                <Icono size={15} strokeWidth={2} aria-hidden="true" />
                {etiqueta}
              </span>
            </label>
          )
        })}
      </div>
    </aside>
  )
}