import { useEffect, useMemo, useState } from 'react'
import { obtenerEstadisticasUsos } from '../utils/consultasUsos'
import { estiloCategoriaUso, posicionOrdenUso } from '../utils/categoriasUsos'
import AyudaInfo from './AyudaInfo'
import '../styles/EstadisticasSuelo.css'
import '../styles/EstadisticasUsos.css'

const COLOR_SIN_DATO = '#94a3b8'

const formato = (valor, decimales = 1) =>
  Number.isFinite(Number(valor)) ? Number(valor).toFixed(decimales) : '—'

function Barra({ porcentaje, color }) {
  const ancho = Math.max(0, Math.min(100, Number(porcentaje) || 0))
  return (
    <div className="estadisticas-suelo__pista">
      <div className="estadisticas-suelo__relleno" style={{ width: `${ancho}%`, background: color }} />
    </div>
  )
}

// Estadísticas de los usos oficiales del suelo urbano de Medellín (POT 48 de 2014).
// Reutiliza las clases de EstadisticasSuelo.css para verse igual.
export default function EstadisticasUsos({ zona }) {
  const lat = zona?.centro?.lat
  const lng = zona?.centro?.lng
  const radioKm = Number(zona?.radioKm)

  // Cada resultado recuerda para qué zona es (`clave`). Así "cargando" se deduce al mostrar
  // y el efecto solo guarda el resultado cuando llega, sin escribir estado de forma síncrona.
  const clave =
    Number.isFinite(lat) && Number.isFinite(lng) && radioKm ? `${lat}|${lng}|${radioKm}` : null
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: null })

  useEffect(() => {
    if (!clave) return

    let cancelado = false
    obtenerEstadisticasUsos({ lat, lng }, radioKm)
      .then((datos) => {
        if (!cancelado) setResultado({ clave, datos, error: null })
      })
      .catch((error) => {
        if (!cancelado) setResultado({ clave, datos: null, error: error.message })
      })

    return () => { cancelado = true }
  }, [clave, lat, lng, radioKm])

  const cargando = clave !== null && resultado.clave !== clave
  const datos = resultado.clave === clave ? resultado.datos : null
  const mensajeError = resultado.clave === clave ? resultado.error : null

  const resumen = useMemo(() => {
    const d = datos
    if (!d || !Array.isArray(d.por_area) || d.por_area.length === 0) return null

    const subPorArea = {}
    ;(d.por_subcategoria || []).forEach((s) => {
      if (!subPorArea[s.area_general]) subPorArea[s.area_general] = []
      subPorArea[s.area_general].push(s)
    })

    const categorias = [...d.por_area]
      .sort((a, b) => posicionOrdenUso(a.area_general) - posicionOrdenUso(b.area_general))
      .map((fila) => ({
        ...fila,
        estilo: estiloCategoriaUso(fila.area_general),
        subcategorias: (subPorArea[fila.area_general] || []).filter((s) => s.subcategoria)
      }))

    const zonaKm2 = Number(d.zona_km2)
    const sinDatoKm2 = Number(d.sin_dato_km2)
    const sinDatoPct = zonaKm2 > 0 ? (sinDatoKm2 / zonaKm2) * 100 : 0

    return {
      zonaKm2,
      sinDatoKm2,
      sinDatoPct,
      conDatoPct: Math.max(0, 100 - sinDatoPct),
      solapeKm2: Number(d.solape_km2),
      predominante: d.predominante ? estiloCategoriaUso(d.predominante) : null,
      categorias
    }
  }, [datos])

  const titulo = <h4 className="estadisticas-suelo__titulo">Usos del suelo (POT 48 de 2014 – Medellín)</h4>

  if (cargando) {
    return (
      <section className="estadisticas-suelo estadisticas-usos">
        {titulo}
        <p className="estadisticas-suelo__mensaje">Calculando superficies…</p>
      </section>
    )
  }

  if (mensajeError) {
    return (
      <section className="estadisticas-suelo estadisticas-usos">
        {titulo}
        <p className="estadisticas-suelo__mensaje">
          No se pudieron calcular las estadísticas de usos: {mensajeError}
        </p>
      </section>
    )
  }

  if (!resumen) {
    return (
      <section className="estadisticas-suelo estadisticas-usos">
        {titulo}
        <p className="estadisticas-suelo__mensaje">
          No hay usos oficiales para esta zona: la fuente solo cubre el suelo urbano de Medellín.
        </p>
      </section>
    )
  }

  const { zonaKm2, sinDatoKm2, sinDatoPct, conDatoPct, solapeKm2, predominante, categorias } = resumen

  return (
    <section className="estadisticas-suelo estadisticas-usos">
      {titulo}

      <p className="estadisticas-suelo__frase">
        {predominante ? (
          <>
            En esta zona, la mayor parte es <strong>{predominante.titulo.toLowerCase()}</strong>.{' '}
          </>
        ) : null}
        El {formato(conDatoPct, 0)} % del área tiene información en esta capa.
      </p>

      <div className="estadisticas-suelo__resumen">
        <div className="estadisticas-suelo__dato">
          <span className="estadisticas-suelo__dato-etiqueta">Área analizada</span>
          <strong>{formato(zonaKm2, 2)} km²</strong>
        </div>
        <div className="estadisticas-suelo__dato">
          <span className="estadisticas-suelo__dato-etiqueta">Mayor superficie</span>
          <strong>{predominante ? predominante.titulo : 'Sin datos'}</strong>
        </div>
        <div className="estadisticas-suelo__dato">
          <span className="estadisticas-suelo__dato-etiqueta">Sin información</span>
          <strong>{formato(sinDatoPct)} %</strong>
        </div>
      </div>

      <h5 className="estadisticas-suelo__subtitulo">Cómo se reparte la zona (% del área)</h5>
      <ul className="estadisticas-suelo__lista">
        {categorias.map((c) => (
          <li key={c.area_general} className="estadisticas-suelo__clase">
            <div className="estadisticas-suelo__fila">
              <span className="estadisticas-suelo__nombre">
                <span className="estadisticas-suelo__muestra" style={{ background: c.estilo.color }} />
                {c.estilo.titulo}
              </span>
              <strong>{formato(c.pct_zona)} %</strong>
            </div>
            <Barra porcentaje={c.pct_zona} color={c.estilo.color} />
            <div className="estadisticas-suelo__detalle">
              {formato(c.km2, 2)} km² · <em>Oficial: {c.area_general}</em>
            </div>

            {c.subcategorias.length > 0 && (
              <details className="estadisticas-suelo__subclases">
                <summary>Ver detalle de la fuente (subcategorías)</summary>
                {c.subcategorias.map((s) => (
                  <div key={s.subcategoria} className="estadisticas-suelo__subclase">
                    <div className="estadisticas-suelo__fila">
                      <span>{s.subcategoria}</span>
                      <strong>{formato(s.pct_zona)} %</strong>
                    </div>
                    <Barra porcentaje={s.pct_zona} color={c.estilo.color} />
                    <div className="estadisticas-suelo__detalle">{formato(s.km2, 2)} km²</div>
                  </div>
                ))}
              </details>
            )}
          </li>
        ))}
      </ul>

      <div className="estadisticas-usos__sin-dato">
        <span className="estadisticas-suelo__muestra" style={{ background: COLOR_SIN_DATO }} />
        Sin información en esta capa: {formato(sinDatoKm2, 2)} km² ({formato(sinDatoPct)} %)
      </div>

      <AyudaInfo titulo="Sobre estos datos y sus límites">
        <p>
          Esta capa indica para qué se permite o se planea usar el suelo según el POT de Medellín
          (Acuerdo 48 de 2014); no describe lo que existe hoy en cada lote. La propia ficha oficial la
          llama una aproximación técnica: lo oficial es el mapa protocolizado del acuerdo.
        </p>
        <p>
          En noviembre de 2026 el Concejo de Medellín aprobó una revisión del POT. Esta capa
          corresponde al plan de 2014.
        </p>
        <p>
          “Sin información” es la parte de la zona que no tiene ningún polígono de esta fuente. Solo
          se cubre el suelo urbano de Medellín, así que ahí puede haber suelo rural, otros
          municipios o terreno sin polígono; no se interpreta como un uso.
          {solapeKm2 > 0.001 &&
            ` Además, ${formato(solapeKm2, 3)} km² aparecen en más de una categoría (los polígonos de la fuente se solapan), por eso la suma de porcentajes puede superar la parte cubierta.`}
        </p>
        <p>
          Los nombres oficiales son los de la fuente (Alcaldía de Medellín, Departamento
          Administrativo de Planeación). Los títulos simples y las explicaciones son texto de la
          aplicación. Las superficies son geodésicas y solo cuentan lo que cae dentro del círculo.
        </p>
      </AyudaInfo>
    </section>
  )
}