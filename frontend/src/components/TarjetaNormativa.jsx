import { useEffect, useId, useMemo, useState } from 'react'
import { Scale } from 'lucide-react'
import { consultarZonaItagui } from '../utils/normativa/consultaZonaItagui.js'
import { AFOROS, tamanoDeActividad } from '../utils/normativa/actividadesMedellin.js'
import {
  LISTA_ACTIVIDADES,
  esItagui,
  esMedellin,
  esSabaneta,
  esEnvigado,
  esLaEstrella,
  valorarPunto
} from '../utils/normativa/evaluarEnPunto.js'
import { describirTarjeta } from '../utils/normativa/presentacion.js'
import { TIPOLOGIAS_CANDIDATAS } from '../utils/normativa/actividades.js'
import { instrumentoDeMunicipio } from '../utils/normativa/index.js'
import { CIIU_CANDIDATOS } from '../utils/normativa/envigado.js'


// Tarjeta "¿Qué dice la norma?": selector de actividad + resultado explicado para el punto consultado.

function Seccion({ titulo, items }) {
  if (!items || items.length === 0) return null

  return (
    <div className="territorial__norma-seccion">
      <h5>{titulo}</h5>
      <ul>
        {items.map((texto, i) => (
          <li key={`${i}-${texto}`}>{texto}</li>
        ))}
      </ul>
    </div>
  )
}

export default function TarjetaNormativa({
  lat,
  lon,
  municipio,
  resultadoTerritorial,
  actividadId,
  alElegirActividad,
  tamano,
  alCambiarTamano,
  esLugar = false
}) {
  const idSelector = useId()
  const idTamano = useId()
  const idTipologia = useId()
  const idArea = useId()

  const aplicaItagui = esItagui(municipio)
  const aplicaMedellin = esMedellin(municipio)
  const aplicaSabaneta = esSabaneta(municipio)
  const aplicaLaEstrella = esLaEstrella(municipio)

  const clave =
    Number.isFinite(lat) && Number.isFinite(lon)
      ? `${lat.toFixed(5)}|${lon.toFixed(5)}`
      : null

  const [zona, setZona] = useState({ clave: null, resultado: null })

  // La elección de tipología pertenece a una actividad:
  // si la actividad cambia, se descarta.
  const [eleccion, setEleccion] = useState({
    actividadId: '',
    codigo: ''
  })

  const tipologiaElegida =
    eleccion.actividadId === actividadId ? eleccion.codigo : ''

  // El área de actividad de La Estrella la elige la persona: ninguna capa la da.
  const [areaElegida, setAreaElegida] = useState('')

  const dondeTitulo = esLugar
    ? 'en el lugar que marcaste'
    : 'en el centro del buffer'

  const dondeNota = esLugar
    ? 'el lugar que marcaste'
    : 'el punto central del buffer'

  useEffect(() => {
    if (!clave || !aplicaItagui) return undefined

    const controlador = new AbortController()

    consultarZonaItagui({ lat, lon }, { signal: controlador.signal })
      .then((resultado) => {
        if (!controlador.signal.aborted && resultado.estado !== 'cancelada') {
          setZona({ clave, resultado })
        }
      })
      .catch(() => {
        if (!controlador.signal.aborted) {
          setZona({ clave, resultado: { estado: 'error_red' } })
        }
      })

    return () => controlador.abort()
  }, [clave, aplicaItagui, lat, lon])

  const zonaActual =
    aplicaItagui && zona.clave === clave ? zona.resultado : null

  const consultando = aplicaItagui && !zonaActual

  const tipoTamano =
    aplicaMedellin && actividadId
      ? tamanoDeActividad(actividadId)
      : aplicaSabaneta &&
          (actividadId === 'minimercado' || actividadId === 'supermercado')
        ? 'area'
        : null

  // Tipologías candidatas de Itagüí.
  const candidatas =
    aplicaItagui && actividadId
      ? (TIPOLOGIAS_CANDIDATAS.Itagui?.[actividadId] ?? null)
      : null

  // Filas CIIU candidatas de Envigado.
  const candidatasCiiu =
    esEnvigado(municipio) && actividadId
      ? (CIIU_CANDIDATOS[actividadId] ?? null)
      : null

  // Instrumento normativo de Itagüí.
  const instrumentoItagui = useMemo(
    () => instrumentoDeMunicipio('Itagui'),
    []
  )

  const nombreTipologia = (codigo) =>
    instrumentoItagui?.tipologias?.find(
      (t) => t.codigo === codigo
    )?.nombre ?? ''

  // Instrumento normativo de Envigado.
  const instrumentoEnvigado = useMemo(
    () => instrumentoDeMunicipio('Envigado'),
    []
  )

  const descripcionCiiu = (ciiu) =>
    instrumentoEnvigado?.reglasPorCiiu?.find(
      (r) => r.ciiu === ciiu
    )?.descripcion ?? ''

  // Tipologías candidatas de La Estrella.
  const candidatasLE =
    aplicaLaEstrella && actividadId
      ? (TIPOLOGIAS_CANDIDATAS.LaEstrella ?? {})[actividadId] ?? null
      : null

  const instrumentoLaEstrella = useMemo(
    () => instrumentoDeMunicipio('LaEstrella'),
    []
  )

  const nombreTipologiaLE = (codigo) =>
    instrumentoLaEstrella?.tipologias?.find((t) => t.codigo === codigo)?.nombre ?? ''

  const tamanoNumerico = useMemo(() => {
    const area = Number(tamano?.areaM2)
    const aforo = Number(tamano?.aforo)

    return {
      areaM2: Number.isFinite(area) && area > 0 ? area : null,
      aforo: Number.isInteger(aforo) && aforo > 0 ? aforo : null
    }
  }, [tamano])

  const tarjeta = useMemo(() => {
    if (!actividadId || consultando) return null

    return describirTarjeta(
      valorarPunto({
        municipio,
        zonaResultado: zonaActual,
        resultadoTerritorial,
        tamano: tamanoNumerico,
        actividadId,
        tipologiaElegida,
        ciiuElegido: tipologiaElegida,
        areaElegida
      })
    )
  }, [
    actividadId,
    consultando,
    municipio,
    zonaActual,
    resultadoTerritorial,
    tamanoNumerico,
    tipologiaElegida,
    areaElegida
  ])

  return (
    <section
      className="territorial__norma"
      aria-label={`Qué dice la norma ${dondeTitulo}`}
    >
      <p className="territorial__etiqueta">
        <Scale size={14} aria-hidden="true" /> Qué dice la norma {dondeTitulo}
      </p>

      <label
        className="territorial__norma-etiqueta"
        htmlFor={idSelector}
      >
        ¿Qué actividad quieres evaluar en este punto?
      </label>

      <select
        id={idSelector}
        className="territorial__norma-selector"
        value={actividadId}
        onChange={(e) => alElegirActividad(e.target.value)}
      >
        <option value="">Elige una actividad…</option>

        {LISTA_ACTIVIDADES.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </select>

      {tipoTamano === 'area' && (
        <>
          <label
            className="territorial__norma-etiqueta"
            htmlFor={idTamano}
          >
            ¿Cuántos m² tendrá el local?
          </label>

          <input
            id={idTamano}
            className="territorial__norma-selector"
            type="number"
            min="1"
            inputMode="numeric"
            placeholder="Opcional"
            value={tamano.areaM2}
            onChange={(e) =>
              alCambiarTamano({
                ...tamano,
                areaM2: e.target.value
              })
            }
          />
        </>
      )}

      {tipoTamano === 'aforo' && (
        <>
          <label
            className="territorial__norma-etiqueta"
            htmlFor={idTamano}
          >
            ¿Qué aforo tendrá el establecimiento?
          </label>

          <select
            id={idTamano}
            className="territorial__norma-selector"
            value={tamano.aforo}
            onChange={(e) =>
              alCambiarTamano({
                ...tamano,
                aforo: e.target.value
              })
            }
          >
            <option value="">No sé: mostrar todos los aforos</option>

            {AFOROS.map((a) => (
              <option key={a.valor} value={String(a.valor)}>
                {a.texto}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Selector de tipologías de Itagüí */}
      {candidatas && (
        <>
          <label
            className="territorial__norma-etiqueta"
            htmlFor={idTipologia}
          >
            La norma no nombra esta actividad. ¿A cuál tipología se parece tu negocio?
          </label>

          <select
            id={idTipologia}
            className="territorial__norma-selector"
            value={tipologiaElegida}
            onChange={(e) =>
              setEleccion({ actividadId, codigo: e.target.value })
            }
          >
            <option value="">Elige una tipología…</option>

            {candidatas.map((codigo) => (
              <option key={codigo} value={codigo}>
                {`${codigo} · ${nombreTipologia(codigo)}`}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Selector de tipologías de La Estrella */}
      {candidatasLE && (
        <>
          <label
            className="territorial__norma-etiqueta"
            htmlFor={idTipologia}
          >
            La norma no nombra esta actividad. ¿A cuál tipología se parece tu negocio?
          </label>

          <select
            id={idTipologia}
            className="territorial__norma-selector"
            value={tipologiaElegida}
            onChange={(e) =>
              setEleccion({ actividadId, codigo: e.target.value })
            }
          >
            <option value="">Elige una tipología…</option>

            {candidatasLE.map((codigo) => (
              <option key={codigo} value={codigo}>
                {`${codigo} · ${nombreTipologiaLE(codigo)}`}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Selector del área de actividad de La Estrella */}
      {aplicaLaEstrella && actividadId && (
        <>
          <label
            className="territorial__norma-etiqueta"
            htmlFor={idArea}
          >
            ¿En qué área de actividad está tu predio? (opcional)
          </label>

          <select
            id={idArea}
            className="territorial__norma-selector"
            value={areaElegida}
            onChange={(e) => setAreaElegida(e.target.value)}
          >
            <option value="">No sé: ver todas las áreas</option>

            {(instrumentoLaEstrella?.zonas ?? []).map((z) => (
              <option key={z.codigo} value={z.codigo}>
                {z.nombre}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Selector de filas CIIU de Envigado */}
      {candidatasCiiu && (
        <>
          <label
            className="territorial__norma-etiqueta"
            htmlFor={idTipologia}
          >
            La Tabla 27 no nombra esta actividad. ¿Qué fila se parece más a tu negocio?
          </label>

          <select
            id={idTipologia}
            className="territorial__norma-selector"
            value={tipologiaElegida}
            onChange={(e) =>
              setEleccion({ actividadId, codigo: e.target.value })
            }
          >
            <option value="">Elige una fila…</option>

            {candidatasCiiu.map((ciiu) => (
              <option key={ciiu} value={ciiu}>
                {`CIIU ${ciiu} · ${descripcionCiiu(ciiu)}`}
              </option>
            ))}
          </select>
        </>
      )}

      <p className="territorial__nota">
        {aplicaMedellin
          ? `En Medellín el resultado depende del tamaño o del aforo, y vale solo para ${dondeNota}.`
          : esLugar
            ? 'El resultado vale solo para el lugar que marcaste.'
            : 'El resultado vale solo para el punto central del buffer. El radio puede cruzar otras zonas con otras reglas.'}
      </p>

      {!actividadId && (
        <p className="territorial__nota">
          Elige una actividad para ver qué dice la norma sobre este punto.
        </p>
      )}

      {actividadId && consultando && (
        <p className="territorial__nota" role="status">
          Consultando la zona de actividad del municipio…
        </p>
      )}

      {tarjeta && (
        <div
          className={`territorial__norma-tarjeta territorial__norma-tarjeta--${tarjeta.clase}`}
        >
          <p className="territorial__norma-titulo">
            {tarjeta.titulo}
          </p>

          <p className="territorial__norma-bajada">
            {tarjeta.bajada}
          </p>

          <p className="territorial__nota">
            {[
              tarjeta.actividad,
              tarjeta.zona,
              tarjeta.tipologia && `Tipología ${tarjeta.tipologia}`
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>

          <Seccion titulo="Por qué" items={tarjeta.porQue} />

          {tarjeta.queFalta && (
            <div className="territorial__norma-seccion">
              <h5>Qué falta</h5>
              <p>{tarjeta.queFalta}</p>
            </div>
          )}

          <Seccion titulo="Condiciones" items={tarjeta.condiciones} />

          {tarjeta.verificarUbicacion && (
            <p className="territorial__norma-verificar">
              {tarjeta.verificarUbicacion}
            </p>
          )}

          <Seccion
            titulo="Según el tamaño o el aforo"
            items={tarjeta.rangos}
          />

          <Seccion
            titulo="Según el área de actividad"
            items={tarjeta.porArea}
          />

          <Seccion
            titulo="Requisitos de la tipología"
            items={tarjeta.requisitos}
          />

          <Seccion
            titulo="Contexto de ruido"
            items={tarjeta.contexto}
          />

          {tarjeta.lectura && (
            <div className="territorial__norma-seccion territorial__norma-lectura">
              <h5>{tarjeta.lectura.titulo}</h5>

              <p className="territorial__nota">
                Tipología {tarjeta.lectura.tipologia}
              </p>

              <p>{tarjeta.lectura.texto}</p>

              {tarjeta.lectura.verificarUbicacion && (
                <p className="territorial__norma-verificar">
                  {tarjeta.lectura.verificarUbicacion}
                </p>
              )}

              <Seccion
                titulo="Condiciones de la zona"
                items={tarjeta.lectura.condiciones}
              />

              <Seccion
                titulo="Requisitos de la tipología"
                items={tarjeta.lectura.requisitos}
              />

              {tarjeta.lectura.aviso && (
                <p className="territorial__norma-aviso">
                  {tarjeta.lectura.aviso}
                </p>
              )}
            </div>
          )}

          {tarjeta.referencias.length > 0 && (
            <div className="territorial__norma-seccion">
              <h5>Referencias</h5>

              <ul>
                {tarjeta.referencias.map((r) => (
                  <li key={r.texto}>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {r.texto}
                      </a>
                    ) : (
                      r.texto
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tarjeta.advertencias.length > 0 && (
            <details
              className="territorial__avisos"
              open={aplicaItagui && tarjeta.advertencias.length <= 3}
            >
              <summary>
                Advertencias ({tarjeta.advertencias.length})
              </summary>

              <ul>
                {tarjeta.advertencias.map((a, i) => (
                  <li key={`${i}-${a}`}>{a}</li>
                ))}
              </ul>
            </details>
          )}

          <p className="territorial__norma-aviso">
            {tarjeta.aviso}
          </p>
        </div>
      )}
    </section>
  )
}
