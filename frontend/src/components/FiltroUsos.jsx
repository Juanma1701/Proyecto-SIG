import { useState } from 'react'
import { Info } from 'lucide-react'
import { estiloCategoriaUso } from '../utils/categoriasUsos'
import AyudaInfo from './AyudaInfo'
import '../styles/FiltroCategorias.css'
import '../styles/FiltroSuelo.css'
import '../styles/FiltroUsos.css'

// Leyenda y filtro de los usos del suelo OFICIALES de Medellín.
// Es independiente de "Clasificación del suelo" y de los filtros de equipamientos.
// Reutiliza las clases de FiltroSuelo.css para verse igual.
export default function FiltroUsos({ capaUsos, ocultas = [], setOcultas }) {
  const [abierta, setAbierta] = useState(null)
  const filas = capaUsos?.resumenUsos || []
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
      <h3 className="filtro-categorias-sidebar__title">Usos del suelo (POT 48 de 2014 – Medellín)</h3>
    </div>
  )

  const intro = (
    <p className="filtro-usos__intro">
      Muestra para qué se permite usar el suelo según el POT de 2014, no lo que hay hoy en cada
      lugar. Solo cubre el suelo urbano de Medellín.
    </p>
  )

  if (!capaUsos || filas.length === 0) {
    return (
      <aside className="filtro-categorias-sidebar filtro-suelo filtro-usos">
        {encabezado}
        <div className="filtro-categorias-sidebar__contenido">
          {intro}
          <p className="filtro-suelo__vacio">
            Todavía no hay usos del suelo en el mapa. En “Mapear una zona” marca la casilla de usos
            oficiales y crea la zona.
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="filtro-categorias-sidebar filtro-suelo filtro-usos">
      {encabezado}

      <div className="filtro-categorias-sidebar__contenido">
        {intro}

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
            const estilo = estiloCategoriaUso(fila.categoria)
            const Icono = estilo.icono
            const activa = !ocultasSet.has(fila.categoria)
            const porcentaje = Number(fila.porcentaje)
            const hayPorcentaje = fila.porcentaje !== null && Number.isFinite(porcentaje)
            const areaKm2 = Number(fila.areaKm2)
            const hayArea = fila.areaKm2 !== null && Number.isFinite(areaKm2)
            const hayFragmentos = fila.fragmentos !== null && fila.fragmentos !== undefined
            const detalleAbierto = abierta === fila.categoria

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
                    <span className="filtro-usos__texto">
                      <span className="filtro-usos__nombre-simple">
                        <Icono size={15} strokeWidth={2} aria-hidden="true" />
                        {estilo.titulo}
                      </span>
                      <span className="filtro-usos__oficial">Oficial: {fila.etiqueta}</span>
                    </span>
                  </label>
                  <span className="filtro-suelo__porcentaje">
                    {hayPorcentaje ? `${porcentaje.toFixed(1)} %` : '—'}
                  </span>
                  <button
                    type="button"
                    className="filtro-suelo__info"
                    aria-expanded={detalleAbierto}
                    aria-label={`Ver más sobre ${estilo.titulo}`}
                    title="Ver más información"
                    onClick={() => setAbierta(detalleAbierto ? null : fila.categoria)}
                  >
                    <Info size={14} />
                  </button>
                </div>

                {detalleAbierto && (
                  <div className="filtro-suelo__detalle">
                    <h5>En palabras simples</h5>
                    <p>{estilo.explicacion}</p>

                    <h5>Qué dice la fuente</h5>
                    <p>{estilo.descripcion}</p>
                    <p className="filtro-suelo__referencia">
                      Fuente: Alcaldía de Medellín, Departamento Administrativo de Planeación (POT, Acuerdo 48 de 2014)
                    </p>

                    <h5>En esta zona (calculado por la aplicación)</h5>
                    <p>
                      {hayArea ? `${areaKm2.toFixed(2)} km²` : '— km²'} ·{' '}
                      {hayPorcentaje ? `${porcentaje.toFixed(1)} %` : '—'} del área
                      {hayFragmentos && ` · ${fila.fragmentos} polígonos de origen que tocan la zona`}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <AyudaInfo titulo="Límites de estos datos">
          <p>
            La propia Alcaldía describe esta capa como una aproximación técnica: lo oficial es el
            mapa protocolizado del Acuerdo 48 de 2014.
          </p>
          <p>
            En noviembre de 2026 el Concejo de Medellín aprobó una revisión del POT. Esta capa
            corresponde al plan de 2014.
          </p>
          <p>
            No hay una categoría solo “comercial”: el comercio aparece dentro de las zonas de mezcla
            media y alta.
          </p>
          <p>
            Estos filtros solo cambian cómo se ve la capa: no afectan equipamientos, lugares,
            cobertura, teselado ni la clasificación del suelo. El dibujo está simplificado a unos
            4 m para que cargue rápido; las superficies se calculan con la geometría original.
          </p>
        </AyudaInfo>
      </div>
    </aside>
  )
}