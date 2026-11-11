import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { obtenerCategoria, estiloCategoria } from '../utils/categoriasEquipamiento'
import { CATEGORIAS_LUGARES, estiloCategoriaLugar } from '../utils/categoriasLugares'
import '../styles/LeyendaMapa.css'

function estiloUnificado(categoria) {
  if (CATEGORIAS_LUGARES[categoria]) return estiloCategoriaLugar(categoria)
  return estiloCategoria(categoria)
}

function conOcultas(capa, ocultas) {
  const base = capa.geojsonOriginal || capa.geojson
  return {
    ...capa,
    geojsonOriginal: base,
    hiddenCategories: [...ocultas],
    geojson: {
      ...base,
      features: base.features.filter((f) => !ocultas.has(obtenerCategoria(f)))
    }
  }
}

export default function LeyendaMapa({ capaEquipamiento, capaLugares, setCapas, oculta = false }) {
  const [abierta, setAbierta] = useState(() => window.innerWidth > 768)

  const grupos = useMemo(() => {
    const fuentes = [
      { capa: capaEquipamiento, titulo: 'Equipamientos (AMVA)' },
      { capa: capaLugares, titulo: 'Lugares (OpenStreetMap)' }
    ]

    const lista = []
    fuentes.forEach(({ capa, titulo }) => {
      const features = capa?.geojsonOriginal?.features || capa?.geojson?.features || []
      if (features.length === 0) return

      const conteo = new Map()
      features.forEach((f) => {
        const categoria = obtenerCategoria(f)
        conteo.set(categoria, (conteo.get(categoria) || 0) + 1)
      })

      const categorias = [...conteo.entries()]
        .map(([categoria, cantidad]) => ({ categoria, cantidad, ...estiloUnificado(categoria) }))
        .sort((a, b) => b.cantidad - a.cantidad)

      lista.push({
        capaId: capa.id,
        titulo,
        categorias,
        ocultas: new Set(capa.hiddenCategories || [])
      })
    })
    return lista
  }, [capaEquipamiento, capaLugares])

  if (grupos.length === 0) return null

  let total = 0
  let visibles = 0
  grupos.forEach((grupo) => {
    grupo.categorias.forEach((c) => {
      total += c.cantidad
      if (!grupo.ocultas.has(c.categoria)) visibles += c.cantidad
    })
  })

  function alternar(capaId, categoria) {
    setCapas((previas) =>
      previas.map((capa) => {
        if (capa.id !== capaId) return capa
        const ocultas = new Set(capa.hiddenCategories || [])
        if (ocultas.has(categoria)) ocultas.delete(categoria)
        else ocultas.add(categoria)
        return conOcultas(capa, ocultas)
      })
    )
  }

  function mostrarTodas() {
    const ids = new Set(grupos.map((g) => g.capaId))
    setCapas((previas) =>
      previas.map((capa) => (ids.has(capa.id) ? conOcultas(capa, new Set()) : capa))
    )
  }

  function ocultarTodas() {
    const ids = new Set(grupos.map((g) => g.capaId))
    setCapas((previas) =>
      previas.map((capa) => {
        if (!ids.has(capa.id)) return capa
        const base = capa.geojsonOriginal || capa.geojson
        return conOcultas(capa, new Set(base.features.map(obtenerCategoria)))
      })
    )
  }

  return (
    <section className={`leyenda-mapa ${oculta ? 'leyenda-mapa--oculta' : ''}`} aria-label="Leyenda del mapa">
      <button
        type="button"
        className="leyenda-mapa__cabecera"
        aria-expanded={abierta}
        onClick={() => setAbierta((valor) => !valor)}
      >
        <span>
          Leyenda
          <span className="leyenda-mapa__conteo"> · {visibles} de {total}</span>
        </span>
        {abierta ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
      </button>

      {abierta && (
        <div className="leyenda-mapa__cuerpo">
          <div className="leyenda-mapa__acciones">
            <button type="button" onClick={mostrarTodas}>Ver todo</button>
            <button type="button" onClick={ocultarTodas}>Desmarcar todo</button>
          </div>

          {grupos.map((grupo) => (
            <div key={grupo.capaId} className="leyenda-mapa__grupo">
              <h4 className="leyenda-mapa__grupo-titulo">{grupo.titulo}</h4>
              <ul className="leyenda-mapa__lista">
                {grupo.categorias.map(({ categoria, cantidad, color, icono: Icono, etiqueta }) => {
                  const activa = !grupo.ocultas.has(categoria)
                  return (
                    <li key={categoria}>
                      <label className={`leyenda-mapa__item ${activa ? '' : 'is-disabled'}`}>
                        <input
                          type="checkbox"
                          checked={activa}
                          onChange={() => alternar(grupo.capaId, categoria)}
                        />
                        <span className="leyenda-mapa__punto" style={{ backgroundColor: color }} aria-hidden="true" />
                        <Icono size={14} strokeWidth={2} aria-hidden="true" />
                        <span className="leyenda-mapa__nombre">{etiqueta}</span>
                        <span className="leyenda-mapa__cantidad">{cantidad}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}