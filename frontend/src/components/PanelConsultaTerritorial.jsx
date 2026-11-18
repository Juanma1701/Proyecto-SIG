import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Building2, Crosshair, FileText, Hammer, Info, MapPin, Mountain, ShieldAlert, Trees } from 'lucide-react'
import { consultarTerritorioEnVivo } from '../utils/territorial/consultaTerritorialEnVivo'
import { advertenciasDesdeCodigos } from '../utils/territorial/modelo'
import { resumirTerritorio } from '../utils/territorial/resumen'
import { esItagui } from '../utils/normativa/evaluarEnPunto.js'
import TarjetaNormativa from './TarjetaNormativa'
import FichaNormativa from './FichaNormativa'
import '../styles/PanelTerritorial.css'

// Panel "Territorio": la tarjeta "Qué dice la norma" va primero; la ficha de resumen con lo que publican las
// fuentes sobre el punto queda plegada debajo. El punto consultado es el centro del buffer o, si la persona lo
// pide, un lugar que marcó dentro del buffer.

const ESTADOS = {
  ok: { texto: 'Con resultados', clase: 'ok' },
  sin_resultados: { texto: 'Sin resultados', clase: 'vacio' },
  capa_no_verificada: { texto: 'Significado sin verificar', clase: 'aviso' },
  fuera_de_cobertura: { texto: 'Fuera de cobertura', clase: 'vacio' },
  error_servicio: { texto: 'Error del servicio', clase: 'error' },
  error_red: { texto: 'Sin conexión', clase: 'error' },
  timeout: { texto: 'Tardó demasiado', clase: 'error' }
}

const ORIGENES = {
  arcgis_amva: 'Servicio REST del AMVA (en vivo)',
  supabase: 'Base de GeoAburrá (Supabase)'
}

const METODOS = {
  amva_pot_clasificacion: 'Clasificación del suelo del AMVA',
  'amva_pot_clasificacion+suelo_pot': 'Clasificación del suelo del AMVA, contrastada con la copia en Supabase',
  suelo_pot_supabase: 'Copia en Supabase (el AMVA no respondió)',
  elegido_por_el_usuario: 'Elegido por ti entre los candidatos'
}

function ListaAvisos({ lista, titulo }) {
  if (!lista || lista.length === 0) return null
  return (
    <details className="territorial__avisos">
      <summary>
        {titulo} ({lista.length})
      </summary>
      <ul>
        {lista.map((a) => (
          <li key={a.codigo}>{a.texto}</li>
        ))}
      </ul>
    </details>
  )
}

function Fila({ icono: Icono, etiqueta, insignia, tenue = false, children }) {
  return (
    <div className={`territorial__dato${tenue ? ' territorial__dato--tenue' : ''}`}>
      <span className="territorial__icono">
        <Icono size={16} aria-hidden="true" />
      </span>
      <div className="territorial__dato-cuerpo">
        <p className="territorial__etiqueta">
          {etiqueta}
          {insignia && <span className="territorial__estado territorial__estado--aviso">{insignia}</span>}
        </p>
        {children}
      </div>
    </div>
  )
}

function Registro({ registro }) {
  const entradas = Object.entries(registro.atributosLimpios ?? {}).filter(([, v]) => v !== null && v !== '')
  return (
    <div className="territorial__registro">
      {entradas.length > 0 ? (
        <dl>
          {entradas.map(([clave, valor]) => (
            <div key={clave} className="territorial__campo">
              <dt>{clave}</dt>
              <dd>{String(valor)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="territorial__nota">Registro sin campos con contenido.</p>
      )}
    </div>
  )
}

function Bloque({ bloque }) {
  const estado = ESTADOS[bloque.estado] ?? { texto: bloque.estado, clase: 'vacio' }
  const { fuente, registros } = bloque
  return (
    <article className="territorial__bloque">
      <header className="territorial__bloque-cabecera">
        <h4>{bloque.titulo ?? bloque.id}</h4>
        <span className={`territorial__estado territorial__estado--${estado.clase}`}>{estado.texto}</span>
      </header>
      {bloque.error && <p className="territorial__nota">{bloque.error.mensaje}</p>}
      {registros.map((registro, i) => (
        <Registro key={i} registro={registro} />
      ))}
      <p className="territorial__fuente">
        {ORIGENES[fuente.origen] ?? fuente.origen} · {fuente.servicio}
        {fuente.capaId !== null && fuente.capaId !== undefined ? `, capa ${fuente.capaId}` : ''}
        {' · '}datos: {fuente.fechaDatosDeclarada ?? 'sin fecha declarada'}
        {fuente.url && (
          <>
            {' · '}
            <a href={fuente.url} target="_blank" rel="noopener noreferrer">
              ver capa
            </a>
          </>
        )}
      </p>
      <ListaAvisos lista={bloque.advertencias} titulo="Avisos de esta fuente" />
    </article>
  )
}

function Municipio({ municipio, alElegir }) {
  const avisos = advertenciasDesdeCodigos(municipio.advertencias ?? [])
  return (
    <section className="territorial__municipio">
      <span className="territorial__icono territorial__icono--verde">
        <MapPin size={18} aria-hidden="true" />
      </span>
      <div className="territorial__municipio-texto">
        {municipio.estado === 'resuelto' && (
          <>
            <p className="territorial__municipio-nombre">{municipio.nombre}</p>
            <p className="territorial__nota">{METODOS[municipio.metodo] ?? municipio.metodo}</p>
          </>
        )}
        {municipio.estado === 'ambiguo' && (
          <>
            <p className="territorial__municipio-nombre">Municipio por decidir</p>
            <p className="territorial__nota">
              El punto está cerca del límite entre municipios. Elige uno para ver sus capas:
            </p>
            <div className="territorial__candidatos">
              {municipio.candidatos.map((c) =>
                c.slug ? (
                  <button key={c.codigo} type="button" onClick={() => alElegir(c.slug)}>
                    {c.nombre}
                  </button>
                ) : (
                  <span key={c.codigo} className="territorial__nota">
                    Código {c.codigo} (no registrado)
                  </span>
                )
              )}
            </div>
          </>
        )}
        {municipio.estado === 'fuera_de_cobertura' && (
          <>
            <p className="territorial__municipio-nombre">Fuera del Valle de Aburrá</p>
            <p className="territorial__nota">
              El punto no cae en ninguno de los 10 municipios según la clasificación del suelo del AMVA.
            </p>
          </>
        )}
        {municipio.estado === 'error' && (
          <>
            <p className="territorial__municipio-nombre">Sin determinar</p>
            <p className="territorial__nota">Las fuentes no respondieron. Marca otro punto o inténtalo de nuevo.</p>
          </>
        )}
        <p className="territorial__rotulo">{municipio.rotulo}</p>
        <ListaAvisos lista={avisos} titulo="Avisos sobre el municipio" />
      </div>
    </section>
  )
}

function Ficha({ resumen, ocultarUsoPot }) {
  const { suelo, tratamientos, usoActual, usoPot, alertas } = resumen
  const sinClasificar = suelo.items.length > 0 && suelo.items.every((i) => /^no clasificado/i.test(i.texto))
  const tenueSuelo = suelo.items.length === 0 || sinClasificar
  return (
    <section className="territorial__ficha" aria-label="Resumen del punto">
      <Fila icono={Mountain} etiqueta="Clasificación del suelo" tenue={tenueSuelo}>
        {suelo.items.length === 0 ? (
          <p className="territorial__nota">Sin dato en este punto.</p>
        ) : suelo.discrepa ? (
          <>
            <ul className="territorial__lista">
              {suelo.items.map((i) => (
                <li key={`${i.texto}|${i.fuente}`}>
                  <strong>{i.texto}</strong> <span className="territorial__nota">· {i.fuente}</span>
                </li>
              ))}
            </ul>
            <p className="territorial__nota">Las fuentes no coinciden: se muestran por separado.</p>
          </>
        ) : (
          <p className="territorial__valor">{suelo.items[0].texto}</p>
        )}
      </Fila>

      {tratamientos.length > 0 && (
        <Fila icono={Hammer} etiqueta="Tratamiento">
          {tratamientos.map((t) => (
            <div key={`${t.nombre}|${t.ambito}`} className="territorial__subdato">
              <p className="territorial__valor">{t.nombre}</p>
              {t.datos.length > 0 && (
                <dl className="territorial__mini">
                  {t.datos.map((d) => (
                    <div key={d.etiqueta}>
                      <dt>{d.etiqueta}</dt>
                      <dd>{d.valor}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
          <p className="territorial__nota">Valores tal como los publica la fuente, sin interpretar.</p>
        </Fila>
      )}

      {usoActual.length > 0 && (
        <Fila icono={Building2} etiqueta="Uso actual declarado">
          <ul className="territorial__lista">
            {usoActual.map((u) => (
              <li key={`${u.texto}|${u.fuente}`}>
                <strong>{u.texto}</strong> <span className="territorial__nota">· {u.fuente}</span>
              </li>
            ))}
          </ul>
          <p className="territorial__nota">Describe lo que existe según la fuente; no indica qué está permitido.</p>
        </Fila>
      )}

      {usoPot.hayBloque && ocultarUsoPot && (
        <Fila icono={FileText} etiqueta="Zona de uso (POT)" tenue>
          <p className="territorial__nota">
            En Itagüí la zona de uso sale de la capa oficial del municipio (Acuerdo 09 de 2023) y se muestra en la
            tarjeta «Qué dice la norma». La capa de uso del AMVA para Itagüí usa códigos de una norma anterior y no se
            muestra aquí; sigue disponible en «Datos completos por fuente».
          </p>
        </Fila>
      )}

      {usoPot.hayBloque && !ocultarUsoPot && (
        <Fila icono={FileText} etiqueta="Zona de uso (POT)" insignia="Sin verificar">
          {usoPot.items.length === 0 ? (
            <p className="territorial__nota">Las capas de uso no devolvieron datos legibles en este punto.</p>
          ) : (
            usoPot.items.map((u, i) => (
              <div key={`${u.titulo}-${i}`} className="territorial__subdato">
                {u.lineas.map((l) => (
                  <p key={`${l.etiqueta}-${l.valor}`} className="territorial__valor territorial__valor--chico">
                    {l.etiqueta && <span className="territorial__nota">{l.etiqueta}: </span>}
                    {l.valor}
                  </p>
                ))}
                <p className="territorial__nota">{u.titulo}</p>
              </div>
            ))
          )}
          <p className="territorial__nota">
            Lo que declara la capa; su significado normativo no está verificado y no indica qué actividades se permiten.
          </p>
        </Fila>
      )}

      <div
        className={`territorial__alertas ${alertas.sinAlertas ? 'territorial__alertas--calma' : 'territorial__alertas--alerta'}`}
      >
        {alertas.sinAlertas ? (
          <p>
            <ShieldAlert size={15} aria-hidden="true" /> Sin riesgo ni protección registrados en este punto
            {alertas.incompleto ? ' (alguna fuente no respondió: puede estar incompleto).' : '.'}
          </p>
        ) : (
          <ul>
            {alertas.items.map((a) => (
              <li key={`${a.tipo}|${a.titulo}|${a.detalle}`}>
                {a.tipo === 'riesgo' ? (
                  <ShieldAlert size={15} aria-hidden="true" />
                ) : (
                  <Trees size={15} aria-hidden="true" />
                )}
                <span>
                  <strong>{a.tipo === 'riesgo' ? 'Riesgo' : 'Protección'}:</strong> {a.detalle ?? a.titulo}
                  <span className="territorial__nota"> · {a.titulo}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

// Qué punto se consulta: el centro del buffer o un lugar marcado dentro de él
function ControlDelPunto({ esLugar, eligiendo, alAlternarEleccion, alQuitar }) {
  if (eligiendo) {
    return (
      <div className="territorial__origen territorial__origen--eligiendo" role="status">
        <p className="territorial__origen-texto">
          <Crosshair size={15} aria-hidden="true" /> Haz clic en el mapa, sobre el lugar que quieres consultar.
        </p>
        <button type="button" className="territorial__boton territorial__boton--suave" onClick={alAlternarEleccion}>
          Cancelar
        </button>
      </div>
    )
  }
  if (esLugar) {
    return (
      <div className="territorial__origen territorial__origen--lugar">
        <p className="territorial__origen-texto">
          Consultando <strong>el lugar que marcaste</strong>.
        </p>
        <button type="button" className="territorial__boton" onClick={alAlternarEleccion}>
          Cambiar lugar
        </button>
        <button type="button" className="territorial__boton territorial__boton--suave" onClick={alQuitar}>
          Volver al centro del buffer
        </button>
      </div>
    )
  }
  return (
    <div className="territorial__origen">
      <p className="territorial__origen-texto">
        Consultando <strong>el centro del buffer</strong>.
      </p>
      <button type="button" className="territorial__boton" onClick={alAlternarEleccion}>
        Consultar un lugar dentro del buffer
      </button>
    </div>
  )
}

export default function PanelConsultaTerritorial({
  punto,
  predio = null,
  eligiendoPredio = false,
  alEligirPredio,
  alQuitarPredio
}) {
  const esLugar = Boolean(predio)
  const origen = predio ?? punto
  const lat = origen?.lat
  const lng = origen?.lng
  const clavePunto = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(5)}|${lng.toFixed(5)}` : null

  // La elección de municipio vale solo para el punto en que se hizo
  const [eleccion, setEleccion] = useState({ clavePunto: null, slug: null })
  const elegido = eleccion.clavePunto === clavePunto ? eleccion.slug : null

  // La actividad y el tamaño elegidos se conservan al cambiar de punto (la tarjeta se desmonta mientras consulta)
  const [actividadId, setActividadId] = useState('')
  const [tamano, setTamano] = useState({ areaM2: '', aforo: '' })

  const clavePeticion = clavePunto ? `${clavePunto}|${elegido ?? ''}` : null
  const [estado, setEstado] = useState({ clave: null, resultado: null, error: null })

  const contenedor = useRef(null)

  useEffect(() => {
    if (!clavePeticion) return undefined
    const controlador = new AbortController()
    consultarTerritorioEnVivo({ lat, lon: lng }, { signal: controlador.signal, municipioElegido: elegido })
      .then((resultado) => {
        if (!controlador.signal.aborted) setEstado({ clave: clavePeticion, resultado, error: null })
      })
      .catch((e) => {
        if (!controlador.signal.aborted) {
          setEstado({ clave: clavePeticion, resultado: null, error: e?.message ?? 'Error desconocido' })
        }
      })
    // Otro clic (o cerrar el panel) cancela la consulta en curso
    return () => controlador.abort()
  }, [clavePeticion, lat, lng, elegido])

  // Cada resultado nuevo se muestra desde arriba (cambiar de actividad no mueve el scroll)
  useEffect(() => {
    if (contenedor.current) contenedor.current.scrollTop = 0
  }, [estado.clave])

  const encabezado = (
    <>
      <h3 className="territorial__titulo">Consulta territorial</h3>
      <p className="territorial__subtitulo">Qué dice la norma y qué publican las fuentes sobre el punto que consultas.</p>
      {alEligirPredio && (
        <ControlDelPunto
          esLugar={esLugar}
          eligiendo={eligiendoPredio}
          alAlternarEleccion={alEligirPredio}
          alQuitar={alQuitarPredio}
        />
      )}
    </>
  )

  let cuerpo
  if (!clavePeticion) {
    cuerpo = <p className="territorial__mensaje">Haz clic en el mapa para consultar un punto.</p>
  } else if (estado.clave !== clavePeticion) {
    cuerpo = (
      <p className="territorial__mensaje" role="status" aria-live="polite">
        Consultando las fuentes…
      </p>
    )
  } else if (estado.error) {
    cuerpo = (
      <p className="territorial__mensaje territorial__mensaje--error">No se pudo completar la consulta: {estado.error}</p>
    )
  } else {
    const { resultado } = estado
    const resumen = resumirTerritorio(resultado)
    const hayFicha = resultado.bloques.length > 0
    cuerpo = (
      <>
        <p className="territorial__punto">
          {esLugar ? 'Lugar marcado' : 'Centro del buffer'}: {resultado.punto.lat.toFixed(5)}, {resultado.punto.lon.toFixed(5)}
        </p>

        <Municipio municipio={resultado.municipio} alElegir={(slug) => setEleccion({ clavePunto, slug })} />

        <TarjetaNormativa
          lat={resultado.punto.lat}
          lon={resultado.punto.lon}
          municipio={resultado.municipio}
          resultadoTerritorial={resultado}
          actividadId={actividadId}
          alElegirActividad={setActividadId}
          tamano={tamano}
          alCambiarTamano={setTamano}
          esLugar={esLugar}
        />

        {resultado.advertencias.length > 0 && (
          <ul className="territorial__global">
            {resultado.advertencias.map((a) => (
              <li key={a.codigo}>{a.texto}</li>
            ))}
          </ul>
        )}

        {resumen.errores.length > 0 && (
          <p className="territorial__errores">
            <AlertTriangle size={15} aria-hidden="true" />
            {resumen.errores.length} fuente{resumen.errores.length === 1 ? '' : 's'} no respondió
            {resumen.errores.length === 1 ? '' : 'eron'}: {resumen.errores.map((e) => e.titulo).join('; ')}. Lo que falta
            puede estar incompleto.
          </p>
        )}

        {hayFicha && (
          <details className="territorial__detalle">
            <summary>Más información de este punto (suelo, uso, norma completa, datos por fuente)</summary>
            <div className="territorial__mas">
              <Ficha resumen={resumen} ocultarUsoPot={esItagui(resultado.municipio)} />
              <FichaNormativa resultado={resultado} />
              <details className="territorial__detalle">
                <summary>Datos completos por fuente ({resumen.detalle.length})</summary>
                {resumen.detalle.map((bloque) => (
                  <Bloque key={bloque.id} bloque={bloque} />
                ))}
                {resumen.vacios.length > 0 && (
                  <p className="territorial__nota">
                    Capas consultadas sin registros en este punto: {resumen.vacios.join('; ')}.
                  </p>
                )}
              </details>
            </div>
          </details>
        )}

        <footer className="territorial__pie">
          <Info size={15} aria-hidden="true" />
          <div>
            <p>{resultado.aviso}</p>
            <p className="territorial__nota">
              Consultado el {new Date(resultado.fechaConsulta).toLocaleString('es-CO')}. Clasificación del suelo, uso
              actual, uso normativo y autorización legal son cosas distintas y no se mezclan.
            </p>
          </div>
        </footer>
      </>
    )
  }

  return (
    <div className="territorial" ref={contenedor}>
      {encabezado}
      {cuerpo}
    </div>
  )
}