import { useMemo, useState } from 'react'
import { consultarAnillosSuelo } from '../utils/consultasSuelo'
import { obtenerEstadisticasSuelo, prepararEstadisticasSuelo } from '../utils/estadisticasSuelo'
import '../styles/AnalisisSueloAvanzado.css'

const CLASES = [
  { id: 'urbano', etiqueta: 'Urbano' },
  { id: 'rural', etiqueta: 'Rural' },
  { id: 'proteccion', etiqueta: 'Protección' },
  { id: 'riesgo', etiqueta: 'Riesgo' }
]

const MAX_ZONAS = 5
const NUMERO_ANILLOS = 4

const formato = (valor, decimales = 1) =>
  Number.isFinite(Number(valor)) ? Number(valor).toFixed(decimales) : '—'

const claveZona = (centro, radioKm) =>
  `${Number(centro.lat).toFixed(5)},${Number(centro.lng).toFixed(5)},${radioKm}`

function porcentajeDe(clases, id, campo) {
  const fila = (clases || []).find((c) => c.categoria === id)
  return fila ? Number(fila[campo]) : 0
}

// ---------- Suelo según la distancia al centro ----------
function SeccionAnillos({ zona }) {
  const [estado, setEstado] = useState({ cargando: false, datos: null, error: null })

  async function calcular() {
    setEstado({ cargando: true, datos: null, error: null })
    try {
      const datos = await consultarAnillosSuelo(zona.centro, Number(zona.radioKm), NUMERO_ANILLOS)
      setEstado({ cargando: false, datos, error: null })
    } catch (error) {
      setEstado({ cargando: false, datos: null, error: error.message })
    }
  }

  const anillos = estado.datos?.anillos || []
  const primero = anillos[0]
  const ultimo = anillos[anillos.length - 1]

  return (
    <div className="analisis-suelo__seccion">
      <h5 className="analisis-suelo__subtitulo">Suelo según la distancia al centro</h5>

      {anillos.length === 0 && !estado.cargando && (
        <>
          <p className="analisis-suelo__ayuda">
            Divide la zona en {NUMERO_ANILLOS} anillos concéntricos y calcula qué clases del suelo
            predominan cerca y lejos del punto central.
          </p>
          {estado.error && (
            <p className="analisis-suelo__ayuda">No se pudo calcular: {estado.error}</p>
          )}
          <button type="button" className="analisis-suelo__boton" onClick={calcular}>
            Calcular por distancia
          </button>
        </>
      )}

      {estado.cargando && <p className="analisis-suelo__ayuda">Calculando anillos…</p>}

      {anillos.length > 0 && (
        <>
          <div className="analisis-suelo__scroll">
            <table className="analisis-suelo__tabla">
              <thead>
                <tr>
                  <th>Distancia</th>
                  {CLASES.map((c) => <th key={c.id}>{c.etiqueta}</th>)}
                  <th>Sin clasif.</th>
                </tr>
              </thead>
              <tbody>
                {anillos.map((anillo) => (
                  <tr key={anillo.desde_m}>
                    <td>{anillo.desde_m}–{anillo.hasta_m} m</td>
                    {CLASES.map((c) => (
                      <td key={c.id}>{formato(porcentajeDe(anillo.clases, c.id, 'porcentaje_anillo'))} %</td>
                    ))}
                    <td>{formato(anillo.sin_clasificar_pct)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {primero && ultimo && anillos.length > 1 && (
            <ul className="analisis-suelo__cambios">
              {CLASES.map((c) => (
                <li key={c.id}>
                  {c.etiqueta}: <b>{formato(porcentajeDe(primero.clases, c.id, 'porcentaje_anillo'))} %</b> en
                  los primeros {primero.hasta_m} m → <b>{formato(porcentajeDe(ultimo.clases, c.id, 'porcentaje_anillo'))} %</b> en
                  el último anillo
                </li>
              ))}
            </ul>
          )}

          <p className="analisis-suelo__ayuda">
            Cada porcentaje es sobre la superficie de su anillo. Los anillos tienen el mismo ancho,
            no la misma área (los de afuera son más grandes), y las clases se superponen, por eso
            cada fila no suma 100 %.
          </p>
        </>
      )}
    </div>
  )
}

// ---------- Comparación entre zonas ----------
function SeccionComparacion({ zona, capas }) {
  const [estado, setEstado] = useState({ cargando: false, filas: null })

  // Una entrada por zona distinta que tenga capa de suelo (las más recientes primero)
  const zonas = useMemo(() => {
    const vistas = new Set()
    const lista = []
    ;[...capas].reverse().forEach((capa) => {
      if (capa.tipo !== 'suelo' || !capa.zonaCentro) return
      const clave = claveZona(capa.zonaCentro, capa.zonaRadioKm)
      if (vistas.has(clave)) return
      vistas.add(clave)
      const capaZona = capas.find((c) => c.id === capa.zonaId)
      lista.push({
        clave,
        centro: capa.zonaCentro,
        radioKm: capa.zonaRadioKm,
        nombre: capaZona?.nombre || `Zona de ${capa.zonaRadioKm} km`
      })
    })
    return lista.slice(0, MAX_ZONAS)
  }, [capas])

  async function comparar() {
    setEstado({ cargando: true, filas: null })

    const resultados = await Promise.allSettled(
      zonas.map((z) => obtenerEstadisticasSuelo(z.centro, z.radioKm))
    )

    const filas = zonas.map((z, i) => {
      const resultado = resultados[i]
      const e = resultado.status === 'fulfilled' ? prepararEstadisticasSuelo(resultado.value) : null
      if (!e) return { ...z, error: true }
      return {
        ...z,
        areaKm2: e.zonaKm2,
        porcentajes: Object.fromEntries(e.clases.map((c) => [c.categoria, c.porcentaje])),
        sinClasificarPct: e.base.sinClasificarPct
      }
    })

    setEstado({ cargando: false, filas })
  }

  const actual = claveZona(zona.centro, zona.radioKm)

  return (
    <div className="analisis-suelo__seccion">
      <h5 className="analisis-suelo__subtitulo">Comparar con otras zonas</h5>

      {zonas.length < 2 ? (
        <p className="analisis-suelo__ayuda">
          Para comparar, crea otra zona con la casilla de clasificación del suelo marcada.
        </p>
      ) : (
        <>
          {!estado.filas && !estado.cargando && (
            <>
              <p className="analisis-suelo__ayuda">
                Hay {zonas.length} zonas con suelo cargado. La comparación usa sus estadísticas ya
                calculadas o las pide una sola vez.
              </p>
              <button type="button" className="analisis-suelo__boton" onClick={comparar}>
                Comparar {zonas.length} zonas
              </button>
            </>
          )}

          {estado.cargando && <p className="analisis-suelo__ayuda">Comparando…</p>}

          {estado.filas && (
            <>
              <div className="analisis-suelo__scroll">
                <table className="analisis-suelo__tabla">
                  <thead>
                    <tr>
                      <th>Zona</th>
                      <th>km²</th>
                      {CLASES.map((c) => <th key={c.id}>{c.etiqueta}</th>)}
                      <th>Sin clasif.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estado.filas.map((fila) => (
                      <tr key={fila.clave} className={fila.clave === actual ? 'analisis-suelo__actual' : ''}>
                        <td className="analisis-suelo__zona" title={fila.nombre}>
                          {fila.nombre}{fila.clave === actual ? ' (esta)' : ''}
                        </td>
                        {fila.error ? (
                          <td colSpan={CLASES.length + 2}>Sin datos</td>
                        ) : (
                          <>
                            <td>{formato(fila.areaKm2, 1)}</td>
                            {CLASES.map((c) => <td key={c.id}>{formato(fila.porcentajes[c.id] ?? 0)} %</td>)}
                            <td>{formato(fila.sinClasificarPct)} %</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="analisis-suelo__boton analisis-suelo__boton--suave" onClick={comparar}>
                Volver a calcular
              </button>
              <p className="analisis-suelo__ayuda">
                Cada porcentaje es sobre el área de su propia zona; con radios distintos los km² no
                son comparables directamente. Las clases se superponen, por eso las filas no suman 100 %.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function AnalisisSueloAvanzado({ zona, capas = [] }) {
  if (!zona?.centro) return null

  return (
    <section className="analisis-suelo">
      {/* key: al cambiar de zona se descartan los anillos de la zona anterior */}
      <SeccionAnillos key={claveZona(zona.centro, zona.radioKm)} zona={zona} />
      <SeccionComparacion zona={zona} capas={capas} />
    </section>
  )
}