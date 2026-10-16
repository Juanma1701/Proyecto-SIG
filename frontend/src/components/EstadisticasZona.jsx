import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts'
import { Save, Map as MapIcon, FileText } from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import { estiloCategoria } from '../utils/categoriasEquipamiento'
import { CATEGORIAS_LUGARES, estiloCategoriaLugar } from '../utils/categoriasLugares'
import { calcularAreaZonaKm2, contarPorCategoriaEnZona } from '../utils/analisisEspacial'
import { guardarZona } from '../utils/zonasGuardadas'
import { obtenerRiesgoZona } from '../utils/riesgoZona'
import { generarInformePDF } from '../utils/informePDF'
import { useAuth } from '../context/AuthContext'
import '../styles/EstadisticasZona.css'

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

// Barra de porcentaje de una categoría de suelo
function BarraSuelo({ fila }) {
  const ancho = Math.max(0, Math.min(100, Number(fila.porcentaje) || 0))

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginBottom: 3 }}>
        <span>{fila.etiqueta}</span>
        <strong>{Number(fila.porcentaje).toFixed(1)} %</strong>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.25)', overflow: 'hidden' }}>
        <div style={{ width: `${ancho}%`, height: '100%', background: fila.color }} />
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
        {Number(fila.areaKm2).toFixed(2)} km² · {fila.poligonos} polígonos
      </div>
    </div>
  )
}

export default function EstadisticasZona({ zona, capas = [], capaEquipamiento, capaLugares, mapaRef }) {
  const { user } = useAuth()
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [riesgo, setRiesgo] = useState(null)

  // Suelo, cobertura y teselado son polígonos de análisis, no lugares: no entran en el conteo
  const capasParaConteo = useMemo(
    () => capas.filter((c) => c.tipo !== 'suelo' && c.tipo !== 'cobertura' && c.tipo !== 'teselado'),
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

  // Equipamientos en suelo de protección/riesgo (solo si hay capa de suelo en esta zona)
  useEffect(() => {
    let cancelado = false
    if (!zona?.centro || !capaSuelo) {
      setRiesgo(null)
      return
    }
    obtenerRiesgoZona(zona.centro, zona.radioKm).then((datos) => {
      if (!cancelado) setRiesgo(datos)
    })
    return () => { cancelado = true }
  }, [zona, capaSuelo])

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
      setExportando(false)
    }
  }

  async function manejarExportarPDF() {
    setExportando(true)
    try {
      const canvasMapa = await capturarMapa().catch(() => null)

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
        riesgo: riesgoResumen,
        cobertura: capaCobertura?.resumenCobertura || null,
        teselado: capaTeselado?.resumenTeselado || null,
        imagenMapa: canvasMapa ? recortarCuadrado(canvasMapa).toDataURL('image/jpeg', 0.9) : null,
        nombreArchivo: nombreArchivo(zona, 'pdf')
      })
    } catch (error) {
      toast.error('No se pudo exportar el PDF: ' + error.message)
    } finally {
      setExportando(false)
    }
  }

  if (!zona) {
    return (
      <aside className="estadisticas-zona">
        <div className="estadisticas-zona__header">
          <h3 className="estadisticas-zona__title">Estadísticas</h3>
        </div>
        <div className="estadisticas-zona__vacio">
          Crea una zona de búsqueda para ver estadísticas.
        </div>
      </aside>
    )
  }

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

      <div className="estadisticas-zona__contenido">
        <div className="estadisticas-zona__contexto">
          <strong>{zona.nombre}</strong>
          <span>Radio {zona.radioKm} km · {zona.centro.lat.toFixed(4)}, {zona.centro.lng.toFixed(4)}</span>
        </div>

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

        <div style={{ fontSize: 12, opacity: 0.85, margin: '6px 0 10px' }}>
          <strong>{equipamientos}</strong> equipamientos · <strong>{lugares}</strong> lugares
        </div>

        {datosGrafica.length > 0 ? (
          <div className="estadisticas-zona__grafica">
            <ResponsiveContainer width="100%" height={Math.max(180, datosGrafica.length * 32)}>
              <BarChart data={datosGrafica} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
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
                  {datosGrafica.map((entrada, i) => (
                    <Cell key={`celda-${i}`} fill={entrada.color} />
                  ))}
                  <LabelList dataKey="cantidad" position="right" fill="#09090a" fontSize={11} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="estadisticas-zona__vacio">Sin datos para graficar todavía.</div>
        )}

        {capaSuelo && (
          <div className="estadisticas-zona__suelo" style={{ marginTop: 16 }}>
            <strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Uso del suelo en la zona</strong>
            {capaSuelo.resumenSuelo.map((fila) => (
              <BarraSuelo key={fila.categoria} fila={fila} />
            ))}
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
              Porcentaje sobre el área de la zona. Las categorías pueden solaparse
              (por ejemplo, riesgo sobre suelo urbano), así que no suman 100 %.
            </div>

            {riesgoResumen && (
              <div style={{ marginTop: 14 }}>
                <strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
                  Equipamientos en suelo de protección o riesgo
                </strong>
                <div style={{ fontSize: 12, marginBottom: 6 }}>
                  <strong>{riesgoResumen.enProteccion}</strong> en suelo de protección ·{' '}
                  <strong>{riesgoResumen.enRiesgo}</strong> en zona de riesgo
                  <span style={{ opacity: 0.7 }}> (de {riesgoResumen.total} analizados)</span>
                </div>
                {riesgoResumen.filas.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.85 }}>
                    <span>{f.suelo} · {f.etiqueta}</span>
                    <strong>{f.cantidad}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {capaCobertura && (
          <div style={{ marginTop: 16 }}>
            <strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
              Cobertura de servicios: {capaCobertura.resumenCobertura.etiqueta}
            </strong>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
              <span>Área a menos de {capaCobertura.resumenCobertura.bufferM} m</span>
              <strong>{Number(capaCobertura.resumenCobertura.coberturaPct).toFixed(1)} %</strong>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(239,68,68,0.35)', overflow: 'hidden' }}>
              <div style={{ width: `${capaCobertura.resumenCobertura.coberturaPct}%`, height: '100%', background: '#16a34a' }} />
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
              {capaCobertura.resumenCobertura.deficitKm2} km² sin cobertura (en rojo en el mapa) ·{' '}
              {capaCobertura.resumenCobertura.servicios} servicios considerados
            </div>
          </div>
        )}

        {capaTeselado && (
          <div style={{ marginTop: 16 }}>
            <strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
              Teselado de equipamientos (hexágonos de {capaTeselado.resumenTeselado.ladoM} m)
            </strong>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              <strong>{capaTeselado.resumenTeselado.totalEquipamientos}</strong> equipamientos en{' '}
              <strong>{capaTeselado.resumenTeselado.celdasConEquipamientos}</strong> de{' '}
              {capaTeselado.resumenTeselado.celdasTotal} celdas · máximo{' '}
              <strong>{capaTeselado.resumenTeselado.maxPorCelda}</strong> en una celda
            </div>
            {capaTeselado.resumenTeselado.rangos.map((r) => (
              <div key={r.color} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 3 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: r.color, flexShrink: 0 }} />
                <span>{r.desde === r.hasta ? r.desde : `${r.desde} a ${r.hasta}`} por celda</span>
              </div>
            ))}
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
              Solo cuenta equipamientos del AMVA, por eso difiere del total de arriba, que incluye lugares.
              Las celdas del borde se ven completas, pero solo cuentan lo que cae dentro del círculo.
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}