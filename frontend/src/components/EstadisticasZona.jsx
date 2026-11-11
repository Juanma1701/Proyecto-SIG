import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts'
import { Save, Map as MapIcon, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { estiloCategoria } from '../utils/categoriasEquipamiento'
import { CATEGORIAS_LUGARES, estiloCategoriaLugar } from '../utils/categoriasLugares'
import { calcularAreaZonaKm2, contarPorCategoriaEnZona } from '../utils/analisisEspacial'
import { guardarZona } from '../utils/zonasGuardadas'
import { obtenerRiesgoZona } from '../utils/riesgoZona'
import { obtenerEstadisticasSuelo, prepararEstadisticasSuelo } from '../utils/estadisticasSuelo'
import { obtenerEstadisticasUsos } from '../utils/consultasUsos'
import { prepararUsosParaPDF } from '../utils/estadisticasUsos'
import { useAuth } from '../context/AuthContext'
import EstadisticasSuelo from './EstadisticasSuelo'
import EstadisticasUsos from './EstadisticasUsos'
import AnalisisSueloAvanzado from './AnalisisSueloAvanzado'
import AyudaInfo from './AyudaInfo'
import '../styles/EstadisticasZona.css'

// html2canvas y el generador del PDF (que incluye jsPDF) NO se importan aquí arriba:
// se descargan con import() solo cuando alguien pulsa exportar, para que la app abra más rápido.

const CATEGORIAS_VISIBLES = 6

function estiloUnificado(categoria) {
  if (CATEGORIAS_LUGARES[categoria]) return estiloCategoriaLugar(categoria)
  return estiloCategoria(categoria)
}

function TooltipPersonalizado({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const { value, payload: fila } = payload[0]

  return (
    <div className="estadisticas-zona__tooltip">
      <span className="estadisticas-zona__tooltip-punto" style={{ backgroundColor: fila.color }} />
      <strong>{value}</strong> de {label}
    </div>
  )
}

function nombreArchivo(zona, extension) {
  const base = (zona?.nombre || 'zona').replace(/[^\w-]+/g, '_')
  return `${base}.${extension}`
}

// Recorta la foto del mapa a un cuadrado centrado (la zona queda en el centro)
function recortarCuadrado(canvas) {
  const lado = Math.min(canvas.width, canvas.height)
  const salida = document.createElement('canvas')
  salida.width = lado
  salida.height = lado
  salida
    .getContext('2d')
    .drawImage(canvas, (canvas.width - lado) / 2, (canvas.height - lado) / 2, lado, lado, 0, 0, lado, lado)
  return salida
}

export default function EstadisticasZona({ zona, capas = [], capaEquipamiento, capaLugares, mapaRef }) {
  const { user } = useAuth()
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [resultadoRiesgo, setResultadoRiesgo] = useState({ clave: null, datos: null })
  const [pestana, setPestana] = useState('resumen')
  const [verTodas, setVerTodas] = useState(false)

  // Suelo, usos, cobertura y teselado son polígonos de análisis, no lugares: no entran en el conteo
  const capasParaConteo = useMemo(
    () => capas.filter((c) => c.tipo !== 'suelo' && c.tipo !== 'usos' && c.tipo !== 'cobertura' && c.tipo !== 'teselado'),
    [capas]
  )

  const { total, porCategoria, equipamientos, lugares } = useMemo(
    () => contarPorCategoriaEnZona(zona, capasParaConteo),
    [zona, capasParaConteo]
  )

  // Capa de suelo que corresponde a ESTA zona (mismo centro y radio)
  const capaSuelo = useMemo(() => {
    if (!zona?.centro) return null
    return capas.find((c) =>
      c.tipo === 'suelo' &&
      c.resumenSuelo?.length > 0 &&
      c.zonaCentro &&
      Math.abs(c.zonaCentro.lat - zona.centro.lat) < 1e-6 &&
      Math.abs(c.zonaCentro.lng - zona.centro.lng) < 1e-6 &&
      c.zonaRadioKm === Number(zona.radioKm)
    ) || null
  }, [capas, zona])

  // Capa de usos oficiales que corresponde a ESTA zona (la más reciente si hay varias)
  const capaUsos = useMemo(() => {
    if (!zona?.centro) return null
    return [...capas].reverse().find((c) =>
      c.tipo === 'usos' &&
      c.resumenUsos?.length > 0 &&
      c.zonaCentro &&
      Math.abs(c.zonaCentro.lat - zona.centro.lat) < 1e-6 &&
      Math.abs(c.zonaCentro.lng - zona.centro.lng) < 1e-6 &&
      c.zonaRadioKm === Number(zona.radioKm)
    ) || null
  }, [capas, zona])

  // Capa de cobertura de ESTA zona (la más reciente si hay varias)
  const capaCobertura = useMemo(() => {
    if (!zona?.centro) return null
    return [...capas].reverse().find((c) =>
      c.tipo === 'cobertura' &&
      c.resumenCobertura &&
      c.zonaCentro &&
      Math.abs(c.zonaCentro.lat - zona.centro.lat) < 1e-6 &&
      Math.abs(c.zonaCentro.lng - zona.centro.lng) < 1e-6 &&
      c.zonaRadioKm === Number(zona.radioKm)
    ) || null
  }, [capas, zona])

  // Capa de teselado de ESTA zona (la más reciente si hay varias)
  const capaTeselado = useMemo(() => {
    if (!zona?.centro) return null
    return [...capas].reverse().find((c) =>
      c.tipo === 'teselado' &&
      c.resumenTeselado &&
      c.zonaCentro &&
      Math.abs(c.zonaCentro.lat - zona.centro.lat) < 1e-6 &&
      Math.abs(c.zonaCentro.lng - zona.centro.lng) < 1e-6 &&
      c.zonaRadioKm === Number(zona.radioKm)
    ) || null
  }, [capas, zona])

  const areaKm2 = useMemo(() => {
    if (!zona?.centro || !zona?.radioKm) return null
    return calcularAreaZonaKm2(zona.centro, zona.radioKm)
  }, [zona])

  const densidad = areaKm2 && areaKm2 > 0 ? (total / areaKm2) : null

  // Equipamientos en suelo de protección/riesgo (solo si hay capa de suelo en esta zona).
  // El resultado recuerda para qué zona es (`clave`): así no hace falta reiniciarlo dentro
  // del efecto, que solo guarda el resultado cuando llega.
  const latZona = zona?.centro?.lat
  const lngZona = zona?.centro?.lng
  const radioZona = Number(zona?.radioKm)
  const claveRiesgo =
    capaSuelo && Number.isFinite(latZona) && Number.isFinite(lngZona) && Number.isFinite(radioZona)
      ? `${latZona}|${lngZona}|${radioZona}`
      : null

  useEffect(() => {
    if (!claveRiesgo) return

    let cancelado = false
    obtenerRiesgoZona({ lat: latZona, lng: lngZona }, radioZona)
      .then((datos) => {
        if (!cancelado) setResultadoRiesgo({ clave: claveRiesgo, datos })
      })
      .catch(() => {
        if (!cancelado) setResultadoRiesgo({ clave: claveRiesgo, datos: null })
      })

    return () => { cancelado = true }
  }, [claveRiesgo, latZona, lngZona, radioZona])

  const riesgo = resultadoRiesgo.clave === claveRiesgo ? resultadoRiesgo.datos : null

  const riesgoResumen = useMemo(() => {
    if (!riesgo) return null
    return {
      total: riesgo.total_equipamientos,
      enProteccion: riesgo.en_proteccion,
      enRiesgo: riesgo.en_riesgo,
      filas: (riesgo.detalle || []).map((d) => ({
        suelo: d.suelo === 'proteccion' ? 'Protección' : 'Riesgo',
        etiqueta: estiloUnificado(d.categoria)?.etiqueta || d.categoria,
        cantidad: d.cantidad
      }))
    }
  }, [riesgo])

  const datosGrafica = useMemo(() => {
    return Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, cantidad]) => {
        const { color, etiqueta } = estiloUnificado(categoria)
        return { categoria: etiqueta, cantidad, color }
      })
  }, [porCategoria])

  // Solo se muestran las pestañas que tienen contenido para esta zona
  const pestanas = [{ id: 'resumen', etiqueta: 'Resumen' }]
  if (capaSuelo) pestanas.push({ id: 'suelo', etiqueta: 'Suelo' })
  if (capaUsos) pestanas.push({ id: 'usos', etiqueta: 'Usos' })
  if (capaCobertura || capaTeselado) pestanas.push({ id: 'servicios', etiqueta: 'Servicios' })

  // Si la pestaña elegida ya no existe (por ejemplo, se quitó una capa), se vuelve al resumen
  const pestanaActiva = pestanas.some((p) => p.id === pestana) ? pestana : 'resumen'

  async function manejarGuardar() {
    if (!user) return
    setGuardando(true)
    try {
      await guardarZona(user.id, zona, capaEquipamiento, capaLugares)
      toast.success('Zona guardada')
    } catch (error) {
      toast.error('No se pudo guardar: ' + error.message)
    } finally {
      setGuardando(false)
    }
  }

  // Foto del mapa: encuadra la zona, abre los clusters en puntos y,
  // al terminar, deja el mapa como estaba.
  async function capturarMapa() {
    if (!mapaRef?.current) return null

    // Primero se descarga html2canvas; si falla, el mapa todavía no se ha tocado
    const { default: html2canvas } = await import('html2canvas')

    const estado = await mapaRef.current.prepararCaptura(zona)

    try {
      return await html2canvas(mapaRef.current.getContenedor(), {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#e5e3df',
        scale: 2
      })
    } finally {
      mapaRef.current.restaurarCaptura(estado)
    }
  }

  async function manejarExportarMapa() {
    setExportando(true)
    const aviso = toast.loading('Preparando la imagen del mapa…')
    try {
      const canvas = await capturarMapa()
      if (!canvas) {
        toast.error('No se pudo acceder al mapa para exportarlo')
        return
      }
      const enlace = document.createElement('a')
      enlace.download = nombreArchivo(zona, 'png')
      enlace.href = canvas.toDataURL('image/png')
      enlace.click()
    } catch (error) {
      toast.error('No se pudo exportar el mapa: ' + error.message)
    } finally {
      toast.dismiss(aviso)
      setExportando(false)
    }
  }

  async function manejarExportarPDF() {
    setExportando(true)
    const aviso = toast.loading('Preparando el informe…')
    try {
      // El generador del PDF (con jsPDF) se descarga solo ahora
      const { generarInformePDF } = await import('../utils/informePDF')

      const canvasMapa = await capturarMapa().catch(() => null)

      // Estadísticas del suelo para el informe (casi siempre salen de la caché del panel)
      let sueloEstadisticas = null
      if (capaSuelo) {
        try {
          sueloEstadisticas = prepararEstadisticasSuelo(
            await obtenerEstadisticasSuelo(zona.centro, zona.radioKm)
          )
        } catch (error) {
          console.warn('[EstadisticasZona] el PDF usará el resumen básico del suelo', error)
        }
      }

      // Usos oficiales del suelo para el informe (también salen de la caché del panel)
      let usosPDF = null
      if (capaUsos) {
        try {
          usosPDF = prepararUsosParaPDF(
            await obtenerEstadisticasUsos(zona.centro, Number(zona.radioKm))
          )
        } catch (error) {
          console.warn('[EstadisticasZona] el PDF saldrá sin la sección de usos del suelo', error)
        }
      }

      generarInformePDF({
        zona,
        total,
        equipamientos,
        lugares,
        areaKm2,
        densidad,
        categorias: datosGrafica.map((d) => ({
          etiqueta: d.categoria,
          cantidad: d.cantidad,
          color: d.color
        })),
        suelo: capaSuelo?.resumenSuelo || null,
        sueloEstadisticas,
        usos: usosPDF,
        riesgo: riesgoResumen,
        cobertura: capaCobertura?.resumenCobertura || null,
        teselado: capaTeselado?.resumenTeselado || null,
        imagenMapa: canvasMapa ? recortarCuadrado(canvasMapa).toDataURL('image/jpeg', 0.9) : null,
        nombreArchivo: nombreArchivo(zona, 'pdf')
      })
    } catch (error) {
      toast.error('No se pudo exportar el PDF: ' + error.message)
    } finally {
      toast.dismiss(aviso)
      setExportando(false)
    }
  }

  if (!zona) {
    return (
      <aside className="estadisticas-zona">
        <div className="estadisticas-zona__header">
          <h3 className="estadisticas-zona__title">Estadísticas</h3>
        </div>
        <div className="estadisticas-zona__contenido">
          <div className="estadisticas-zona__vacio">
            Crea una zona de búsqueda para ver estadísticas.
          </div>
        </div>
      </aside>
    )
  }

  const datosVisibles = verTodas ? datosGrafica : datosGrafica.slice(0, CATEGORIAS_VISIBLES)
  const hayMasCategorias = datosGrafica.length > CATEGORIAS_VISIBLES

  return (
    <aside className="estadisticas-zona">
      <div className="estadisticas-zona__header">
        <h3 className="estadisticas-zona__title">Estadísticas</h3>
        <div className="estadisticas-zona__header-acciones">
          <button
            className="estadisticas-zona__boton-icono"
            onClick={manejarExportarMapa}
            disabled={exportando}
            title="Exportar el mapa como imagen (PNG)"
          >
            <MapIcon size={14} />
          </button>
          <button
            className="estadisticas-zona__boton-icono"
            onClick={manejarExportarPDF}
            disabled={exportando}
            title="Exportar informe completo (mapa + estadísticas) como PDF"
          >
            <FileText size={14} />
          </button>
          {user && (
            <button
              className="estadisticas-zona__guardar"
              onClick={manejarGuardar}
              disabled={guardando}
              title="Guardar esta zona"
            >
              <Save size={14} />
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          )}
        </div>
      </div>

      <div className="estadisticas-zona__contexto">
        <strong>{zona.nombre}</strong>
        <span>Radio {zona.radioKm} km · {zona.centro.lat.toFixed(4)}, {zona.centro.lng.toFixed(4)}</span>
      </div>

      {pestanas.length > 1 && (
        <div className="estadisticas-zona__pestanas" role="tablist" aria-label="Secciones de estadísticas">
          {pestanas.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pestanaActiva === p.id}
              className={`estadisticas-zona__pestana ${pestanaActiva === p.id ? 'activa' : ''}`}
              onClick={() => setPestana(p.id)}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      )}

      <div className="estadisticas-zona__contenido">
        {pestanaActiva === 'resumen' && (
          <>
            <p className="estadisticas-zona__frase">
              Hay <strong>{total}</strong> elementos en esta zona
              {areaKm2 !== null && <> de <strong>{areaKm2.toFixed(2)} km²</strong></>}
              : {equipamientos} equipamientos y {lugares} lugares.
            </p>

            <div className="estadisticas-zona__metricas">
              <div className="estadisticas-zona__metrica">
                <span className="estadisticas-zona__metrica-valor">{total}</span>
                <span className="estadisticas-zona__metrica-label">Total en la zona</span>
              </div>

              {areaKm2 !== null && (
                <div className="estadisticas-zona__metrica">
                  <span className="estadisticas-zona__metrica-valor">{areaKm2.toFixed(2)}</span>
                  <span className="estadisticas-zona__metrica-label">km² de área</span>
                </div>
              )}

              {densidad !== null && (
                <div className="estadisticas-zona__metrica">
                  <span className="estadisticas-zona__metrica-valor">{densidad.toFixed(1)}</span>
                  <span className="estadisticas-zona__metrica-label">elementos por km²</span>
                </div>
              )}
            </div>

            <h5 className="estadisticas-zona__subtitulo">Qué hay, por tipo</h5>

            {datosGrafica.length > 0 ? (
              <>
                <div className="estadisticas-zona__grafica">
                  <ResponsiveContainer width="100%" height={Math.max(150, datosVisibles.length * 32)}>
                    <BarChart data={datosVisibles} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#9bb5d6', fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="categoria"
                        tick={{ fill: '#060606', fontSize: 11 }}
                        width={110}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(126,200,227,0.08)' }}
                        content={<TooltipPersonalizado />}
                        offset={20}
                        allowEscapeViewBox={{ x: true, y: true }}
                      />
                      <Bar dataKey="cantidad" radius={[0, 6, 6, 0]}>
                        {datosVisibles.map((entrada, i) => (
                          <Cell key={`celda-${i}`} fill={entrada.color} />
                        ))}
                        <LabelList dataKey="cantidad" position="right" fill="#09090a" fontSize={11} fontWeight={700} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {hayMasCategorias && (
                  <button
                    type="button"
                    className="estadisticas-zona__enlace"
                    onClick={() => setVerTodas((valor) => !valor)}
                  >
                    {verTodas ? 'Ver menos' : `Ver las ${datosGrafica.length} categorías`}
                  </button>
                )}
              </>
            ) : (
              <div className="estadisticas-zona__vacio">Sin datos para graficar todavía.</div>
            )}

            {(capaSuelo || capaUsos || capaCobertura || capaTeselado) && (
              <p className="estadisticas-zona__pista-pestanas">
                Usa las pestañas de arriba para ver el suelo, los usos y los servicios de esta zona.
              </p>
            )}
          </>
        )}

        {pestanaActiva === 'suelo' && capaSuelo && (
          <>
            <EstadisticasSuelo zona={zona} />

            {riesgoResumen && (
              <section className="estadisticas-zona__bloque">
                <h5 className="estadisticas-zona__subtitulo">Equipamientos en suelo de protección o riesgo</h5>
                <div className="estadisticas-zona__dos-datos">
                  <div className="estadisticas-zona__metrica">
                    <span className="estadisticas-zona__metrica-valor">{riesgoResumen.enProteccion}</span>
                    <span className="estadisticas-zona__metrica-label">en suelo de protección</span>
                  </div>
                  <div className="estadisticas-zona__metrica">
                    <span className="estadisticas-zona__metrica-valor">{riesgoResumen.enRiesgo}</span>
                    <span className="estadisticas-zona__metrica-label">en zona de riesgo</span>
                  </div>
                </div>
                <p className="estadisticas-zona__nota">de {riesgoResumen.total} equipamientos analizados</p>

                {riesgoResumen.filas.length > 0 && (
                  <details className="estadisticas-zona__detalles">
                    <summary>Ver el detalle por tipo</summary>
                    {riesgoResumen.filas.map((f, i) => (
                      <div key={i} className="estadisticas-zona__fila-detalle">
                        <span>{f.suelo} · {f.etiqueta}</span>
                        <strong>{f.cantidad}</strong>
                      </div>
                    ))}
                  </details>
                )}
              </section>
            )}

            <details className="estadisticas-zona__detalles estadisticas-zona__avanzado">
              <summary>Análisis avanzado (distancia al centro y comparar zonas)</summary>
              <AnalisisSueloAvanzado zona={zona} capas={capas} />
            </details>
          </>
        )}

        {pestanaActiva === 'usos' && capaUsos && <EstadisticasUsos zona={zona} />}

        {pestanaActiva === 'servicios' && (
          <>
            {capaCobertura && (
              <section className="estadisticas-zona__bloque estadisticas-zona__bloque--primero">
                <h5 className="estadisticas-zona__subtitulo">
                  Cobertura de servicios: {capaCobertura.resumenCobertura.etiqueta}
                </h5>
                <p className="estadisticas-zona__frase">
                  <strong>{Number(capaCobertura.resumenCobertura.coberturaPct).toFixed(1)} %</strong> de la zona
                  queda a menos de {capaCobertura.resumenCobertura.bufferM} m de un servicio.
                </p>
                <div className="estadisticas-zona__cobertura-pista">
                  <div
                    className="estadisticas-zona__cobertura-relleno"
                    style={{ width: `${Math.max(0, Math.min(100, Number(capaCobertura.resumenCobertura.coberturaPct) || 0))}%` }}
                  />
                </div>
                <p className="estadisticas-zona__nota">
                  {capaCobertura.resumenCobertura.deficitKm2} km² sin cobertura (en rojo en el mapa) ·{' '}
                  {capaCobertura.resumenCobertura.servicios} servicios considerados
                </p>
              </section>
            )}

            {capaTeselado && (
              <section className={`estadisticas-zona__bloque ${capaCobertura ? '' : 'estadisticas-zona__bloque--primero'}`}>
                <h5 className="estadisticas-zona__subtitulo">
                  Teselado de equipamientos (hexágonos de {capaTeselado.resumenTeselado.ladoM} m)
                </h5>
                <p className="estadisticas-zona__frase">
                  <strong>{capaTeselado.resumenTeselado.totalEquipamientos}</strong> equipamientos en{' '}
                  <strong>{capaTeselado.resumenTeselado.celdasConEquipamientos}</strong> de{' '}
                  {capaTeselado.resumenTeselado.celdasTotal} celdas. La celda más llena tiene{' '}
                  <strong>{capaTeselado.resumenTeselado.maxPorCelda}</strong>.
                </p>

                <ul className="estadisticas-zona__rangos">
                  {capaTeselado.resumenTeselado.rangos.map((r) => (
                    <li key={r.color}>
                      <span className="estadisticas-zona__rango-color" style={{ background: r.color }} />
                      {r.desde === r.hasta ? r.desde : `${r.desde} a ${r.hasta}`} por celda
                    </li>
                  ))}
                </ul>

                <p className="estadisticas-zona__nota">Haz clic en una celda del mapa para ver su detalle.</p>

                <AyudaInfo titulo="¿Por qué no coincide con el total?">
                  <p>
                    El teselado solo cuenta equipamientos del AMVA, por eso difiere del total del
                    resumen, que también incluye lugares.
                  </p>
                  <p>
                    Las celdas del borde se ven completas, pero solo cuentan lo que cae dentro del
                    círculo de la zona.
                  </p>
                </AyudaInfo>
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  )
}