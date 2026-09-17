import { useMemo } from 'react'
import { obtenerCategoria, estiloCategoria } from '../utils/categoriasEquipamiento'
import { CATEGORIAS_LUGARES, estiloCategoriaLugar } from '../utils/categoriasLugares'
import { CATEGORIAS_SUELO, estiloCategoriaSuelo } from '../utils/categoriasSuelo'
import '../styles/FiltroCategorias.css'

function estiloUnificado(categoria) {
  if (CATEGORIAS_LUGARES[categoria]) return estiloCategoriaLugar(categoria)
  if (CATEGORIAS_SUELO[categoria]) return estiloCategoriaSuelo(categoria)
  return estiloCategoria(categoria)
}

/**
 * `capa` (equipamientos AMVA), `capaLugares` (hoteles/moteles/bares de
 * Overpass) y `capaSuelo` (uso/clasificación del suelo POT) se combinan
 * en una sola lista de checkboxes, sin separarlos en secciones — cada
 * categoría sabe a qué capa pertenece internamente, pero visualmente
 * están todas al mismo nivel.
 */
export default function FiltroCategorias({ capa, capaLugares, capaSuelo, capas = [], setCapas }) {
  const fuentes = useMemo(() => {
    return [capa, capaLugares, capaSuelo].filter((c) => {
      const feats = c?.geojsonOriginal?.features || c?.geojson?.features || []
      return feats.length > 0
    })
  }, [capa, capaLugares, capaSuelo])

  const entradas = useMemo(() => {
    const lista = []
    fuentes.forEach((fuente) => {
      const features = fuente.geojsonOriginal?.features || fuente.geojson?.features || []
      const categoriasUnicas = [...new Set(features.map(obtenerCategoria))]
      categoriasUnicas.forEach((categoria) => {
        lista.push({ categoria, capaId: fuente.id })
      })
    })
    return lista
  }, [fuentes])

  if (fuentes.length === 0) return null

  function toggleCategoria(categoria, capaId) {
    const fuente = fuentes.find((f) => f.id === capaId)
    const geojsonBase = fuente.geojsonOriginal || fuente.geojson
    const featuresBase = geojsonBase.features
    const ocultas = new Set(fuente.hiddenCategories || [])

    if (ocultas.has(categoria)) ocultas.delete(categoria)
    else ocultas.add(categoria)

    const geojsonFiltrado = {
      ...geojsonBase,
      features: featuresBase.filter((f) => !ocultas.has(obtenerCategoria(f)))
    }

    setCapas(capas.map((c) =>
      c.id === capaId
        ? { ...c, geojson: geojsonFiltrado, geojsonOriginal: geojsonBase, hiddenCategories: [...ocultas] }
        : c
    ))
  }

  function mostrarTodas() {
    setCapas(capas.map((c) => {
      const fuente = fuentes.find((f) => f.id === c.id)
      if (!fuente) return c
      const geojsonBase = fuente.geojsonOriginal || fuente.geojson
      return { ...c, geojson: geojsonBase, geojsonOriginal: geojsonBase, hiddenCategories: [] }
    }))
  }

  function ocultarTodas() {
    setCapas(capas.map((c) => {
      const fuente = fuentes.find((f) => f.id === c.id)
      if (!fuente) return c
      const geojsonBase = fuente.geojsonOriginal || fuente.geojson
      const todasOcultas = [...new Set(geojsonBase.features.map(obtenerCategoria))]
      return { ...c, geojson: { ...geojsonBase, features: [] }, geojsonOriginal: geojsonBase, hiddenCategories: todasOcultas }
    }))
  }

  return (
    <aside className="filtro-categorias-sidebar">
      <div className="filtro-categorias-sidebar__header">
        <h3 className="filtro-categorias-sidebar__title">Filtrar categorías</h3>
      </div>

      <div className="filtro-categorias-sidebar__contenido">
        <div className="filtro-categorias-sidebar__acciones">
          <button type="button" className="filtro-categorias-sidebar__boton filtro-categorias-sidebar__boton--activo" onClick={mostrarTodas}>Ver todo</button>
          <button type="button" className="filtro-categorias-sidebar__boton filtro-categorias-sidebar__boton--inactivo" onClick={ocultarTodas}>Desmarcar todo</button>
        </div>

        <div className="filtro-categorias-sidebar__list">
        {entradas.map(({ categoria, capaId }) => {
          const fuente = fuentes.find((f) => f.id === capaId)
          const ocultas = new Set(fuente.hiddenCategories || [])
          const { color, icono: Icono, etiqueta } = estiloUnificado(categoria)
          const activa = !ocultas.has(categoria)

          return (
            <label
              key={`${capaId}-${categoria}`}
              className={`filtro-categorias-sidebar__item ${activa ? 'is-active' : 'is-disabled'}`}
            >
              <input
                type="checkbox"
                checked={activa}
                onChange={() => toggleCategoria(categoria, capaId)}
              />
              <span className="filtro-categorias-sidebar__punto" style={{ backgroundColor: color }} aria-hidden="true" />
              <span className="filtro-categorias-sidebar__text">
                <Icono size={15} strokeWidth={2} aria-hidden="true" />
                {etiqueta}
              </span>
            </label>
          )
        })}
        </div>
      </div>
    </aside>
  )
}