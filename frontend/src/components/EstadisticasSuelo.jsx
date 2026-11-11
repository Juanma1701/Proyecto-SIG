import { useEffect, useMemo, useState } from 'react'
import { obtenerEstadisticasSuelo, prepararEstadisticasSuelo } from '../utils/estadisticasSuelo'
import AyudaInfo from './AyudaInfo'
import '../styles/EstadisticasSuelo.css'

const COLOR_SOLAPE =
  'repeating-linear-gradient(45deg, #22c55e 0, #22c55e 4px, #a3a361 4px, #a3a361 8px)'
const COLOR_SIN_CLASIFICAR = '#94a3b8'

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

export default function EstadisticasSuelo({ zona }) {
  const lat = zona?.centro?.lat
  const lng = zona?.centro?.lng
  const radioKm = zona?.radioKm

  // Cada resultado recuerda para qué zona es (`clave`). Así "cargando" se deduce al mostrar
  // y el efecto solo guarda el resultado cuando llega, sin escribir estado de forma síncrona.
  const clave =
    Number.isFinite(lat) && Number.isFinite(lng) && radioKm ? `${lat}|${lng}|${radioKm}` : null
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: null })

  useEffect(() => {
    if (!clave) return

    let cancelado = false
    obtenerEstadisticasSuelo({ lat, lng }, radioKm)
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

  const e = useMemo(() => prepararEstadisticasSuelo(datos), [datos])

  const titulo = <h4 className="estadisticas-suelo__titulo">Clasificación del suelo (POT)</h4>

  if (cargando) {
    return (
      <section className="estadisticas-suelo">
        {titulo}
        <p className="estadisticas-suelo__mensaje">Calculando superficies…</p>
      </section>
    )
  }

  if (mensajeError) {
    return (
      <section className="estadisticas-suelo">
        {titulo}
        <p className="estadisticas-suelo__mensaje">
          No se pudieron calcular las estadísticas del suelo: {mensajeError}
        </p>
      </section>
    )
  }

  if (!e) {
    return (
      <section className="estadisticas-suelo">
        {titulo}
        <p className="estadisticas-suelo__mensaje">
          No hay información de clasificación del suelo para esta zona (con radio de hasta 5 km).
        </p>
      </section>
    )
  }

  const { zonaKm2, clases, base, combinaciones } = e
  const claseUrbano = clases.find((c) => c.categoria === 'urbano')
  const claseRural = clases.find((c) => c.categoria === 'rural')
  const claseProteccion = clases.find((c) => c.categoria === 'proteccion')
  const claseRiesgo = clases.find((c) => c.categoria === 'riesgo')

  let textoPredominante = 'Sin datos'
  if (base.predominante === 'urbano' && claseUrbano) {
    textoPredominante = `Urbano (${formato(claseUrbano.porcentaje)} %)`
  } else if (base.predominante === 'rural' && claseRural) {
    textoPredominante = `Rural (${formato(claseRural.porcentaje)} %)`
  }

  // Partición de la zona: solo urbano, solo rural, ambos (solape) y sin clasificar.
  // Las cuatro partes suman el área de la zona.
  const urbanoSoloKm2 = Math.max(0, base.urbanoKm2 - base.solapeKm2)
  const ruralSoloKm2 = Math.max(0, base.ruralKm2 - base.solapeKm2)
  const aPorcentaje = (km2) => (zonaKm2 > 0 ? (km2 / zonaKm2) * 100 : 0)

  const partes = [
    { id: 'urbano', etiqueta: 'Solo urbano', km2: urbanoSoloKm2, fondo: '#22c55e' },
    { id: 'solape', etiqueta: 'Urbano y rural a la vez', km2: base.solapeKm2, fondo: COLOR_SOLAPE },
    { id: 'rural', etiqueta: 'Solo rural', km2: ruralSoloKm2, fondo: '#a3a361' },
    { id: 'sin', etiqueta: 'Sin clasificar', km2: base.sinClasificarKm2, fondo: COLOR_SIN_CLASIFICAR }
  ]

  return (
    <section className="estadisticas-suelo">
      {titulo}

      <p className="estadisticas-suelo__frase">
        {base.predominante === 'urbano' && <>La mayor parte de la zona es suelo <strong>urbano</strong>. </>}
        {base.predominante === 'rural' && <>La mayor parte de la zona es suelo <strong>rural</strong>. </>}
        {claseProteccion && claseRiesgo && (
          <>
            El {formato(claseProteccion.porcentaje, 0)} % está en suelo de protección y el{' '}
            {formato(claseRiesgo.porcentaje, 0)} % en zona de riesgo.
          </>
        )}
      </p>

      <div className="estadisticas-suelo__resumen">
        <div className="estadisticas-suelo__dato">
          <span className="estadisticas-suelo__dato-etiqueta">Área analizada</span>
          <strong>{formato(zonaKm2, 2)} km²</strong>
        </div>
        <div className="estadisticas-suelo__dato">
          <span className="estadisticas-suelo__dato-etiqueta">Predomina</span>
          <strong>{textoPredominante}</strong>
        </div>
        <div className="estadisticas-suelo__dato">
          <span className="estadisticas-suelo__dato-etiqueta">Sin clasificar</span>
          <strong>{formato(base.sinClasificarPct)} %</strong>
        </div>
      </div>

      <h5 className="estadisticas-suelo__subtitulo">Superficie por clase (% de la zona)</h5>
      <ul className="estadisticas-suelo__lista">
        {clases.map((clase) => (
          <li key={clase.categoria} className="estadisticas-suelo__clase">
            <div className="estadisticas-suelo__fila">
              <span className="estadisticas-suelo__nombre">
                <span className="estadisticas-suelo__muestra" style={{ background: clase.color }} />
                {clase.etiqueta}
              </span>
              <strong>{formato(clase.porcentaje)} %</strong>
            </div>
            <Barra porcentaje={clase.porcentaje} color={clase.color} />
            <div className="estadisticas-suelo__detalle">
              {formato(clase.areaKm2, 2)} km² · {clase.poligonos} polígonos de origen
            </div>

            {clase.subclases.length > 0 && (
              <details className="estadisticas-suelo__subclases">
                <summary>Ver subclases</summary>
                {clase.subclases.map((sub) => (
                  <div key={sub.id} className="estadisticas-suelo__subclase">
                    <div className="estadisticas-suelo__fila">
                      <span>{sub.etiqueta}</span>
                      <strong>{formato(sub.porcentaje)} %</strong>
                    </div>
                    <Barra porcentaje={sub.porcentaje} color={sub.color} />
                    <div className="estadisticas-suelo__detalle">
                      {formato(sub.areaKm2, 2)} km² · {sub.poligonos} polígonos de origen
                    </div>
                  </div>
                ))}
                {clase.subclasesSolapadas && (
                  <p className="estadisticas-suelo__ayuda">
                    En esta zona las subclases se solapan entre sí: suman{' '}
                    {formato(clase.sumaSubclasesKm2, 2)} km², más que los{' '}
                    {formato(clase.areaKm2, 2)} km² de la clase.
                  </p>
                )}
                {clase.nota && <p className="estadisticas-suelo__ayuda">{clase.nota}</p>}
              </details>
            )}

            {clase.subclases.length === 0 && clase.nota && (
              <p className="estadisticas-suelo__ayuda">{clase.nota}</p>
            )}
          </li>
        ))}
      </ul>

      <h5 className="estadisticas-suelo__subtitulo">Urbano y rural en la zona</h5>
      <div className="estadisticas-suelo__apilada" role="img" aria-label="Reparto de la zona entre urbano, rural y sin clasificar">
        {partes.map((parte) => (
          aPorcentaje(parte.km2) > 0 && (
            <div
              key={parte.id}
              className="estadisticas-suelo__segmento"
              style={{ width: `${aPorcentaje(parte.km2)}%`, background: parte.fondo }}
              title={`${parte.etiqueta}: ${formato(parte.km2, 2)} km²`}
            />
          )
        ))}
      </div>
      <ul className="estadisticas-suelo__leyenda">
        {partes.map((parte) => (
          <li key={parte.id}>
            <span className="estadisticas-suelo__muestra" style={{ background: parte.fondo }} />
            {parte.etiqueta}: {formato(parte.km2, 2)} km² ({formato(aPorcentaje(parte.km2))} %)
          </li>
        ))}
      </ul>

      {combinaciones.length > 0 && (
        <details className="estadisticas-suelo__subclases">
          <summary>Dónde coinciden dos clases</summary>
          <ul className="estadisticas-suelo__combinaciones">
            {combinaciones.map((c) => (
              <li key={c.id}>
                <span>{c.etiqueta}</span>
                <strong>{formato(c.areaKm2, 2)} km² · {formato(c.porcentaje)} %</strong>
              </li>
            ))}
          </ul>
        </details>
      )}

      <AyudaInfo titulo="¿Cómo leer estas cifras?">
        <p>
          “Predomina” compara por superficie solo urbano y rural. Protección y riesgo se
          superponen con ellos y se muestran aparte, por eso los porcentajes no suman 100 %.
        </p>
        <p>
          “Sin clasificar” es la parte de la zona que no figura ni como urbano ni como rural en la
          base cargada. Puede ser suelo que figura solo como protección o riesgo; la causa de que
          falte la clasificación urbana o rural no está determinada.
        </p>
        <p>
          Las superficies se calculan sobre el elipsoide (geodésicas) y solo cuentan la parte que cae
          dentro del círculo de la zona. El porcentaje es de superficie; el número de polígonos es de
          elementos de la fuente y no es comparable con él. Estas cifras no cambian con los filtros
          visuales del mapa.
        </p>
      </AyudaInfo>
    </section>
  )
}