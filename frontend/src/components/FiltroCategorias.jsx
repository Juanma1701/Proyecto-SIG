import { useState, useMemo } from 'react'
import { obtenerCategoria, estiloCategoria } from '../utils/categoriasEquipamiento'
import '../styles/FiltroCategorias.css'

export default function FiltroCategorias({ capa, capas, setCapas }) {
  const geojsonBase = capa.geojsonOriginal || capa.geojson

  const categorias = useMemo(() => {
    const set = new Set(geojsonBase.features.map(obtenerCategoria))
    return [...set]
  }, [geojsonBase])

  const [ocultas, setOcultas] = useState(new Set())

  function toggleCategoria(cat) {
    const nuevasOcultas = new Set(ocultas)
    if (nuevasOcultas.has(cat)) {
      nuevasOcultas.delete(cat)
    } else {
      nuevasOcultas.add(cat)
    }
    setOcultas(nuevasOcultas)

    const geojsonFiltrado = {
      ...geojsonBase,
      features: geojsonBase.features.filter(
        f => !nuevasOcultas.has(obtenerCategoria(f))
      )
    }

    setCapas(capas.map(c =>
      c.id === capa.id
        ? { ...c, geojson: geojsonFiltrado, geojsonOriginal: geojsonBase }
        : c
    ))
  }

  return (
    <div className="filtro-categorias">
      {categorias.map(cat => {
        const { color, icono, etiqueta } = estiloCategoria(cat)
        const activa = !ocultas.has(cat)
        return (
          <label key={cat} className="filtro-categorias__item" style={{ opacity: activa ? 1 : 0.4 }}>
            <input type="checkbox" checked={activa} onChange={() => toggleCategoria(cat)} />
            <span className="filtro-categorias__punto" style={{ background: color }}></span>
            <span>{icono} {etiqueta}</span>
          </label>
        )
      })}
    </div>
  )
}