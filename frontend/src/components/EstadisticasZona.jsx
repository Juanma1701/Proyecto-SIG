import { useMemo, useState, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts'
import { Save, Map as MapIcon, FileText } from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { estiloCategoria } from '../utils/categoriasEquipamiento'
import { CATEGORIAS_LUGARES, estiloCategoriaLugar } from '../utils/categoriasLugares'
import { calcularAreaZonaKm2, contarPorCategoriaEnZona } from '../utils/analisisEspacial'
import { guardarZona } from '../utils/zonasGuardadas'
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

/**
 * `zona` es la capa de tipo 'zona' (círculo de búsqueda) actualmente
 * activa. `capas` es el array completo. `capaEquipamiento`/`capaLugares`
 * son las capas puntuales asociadas a esta zona. `mapaRef` apunta al
 * contenedor DOM real del mapa Leaflet, para poder capturarlo como
 * imagen al exportar.
 */
export default function EstadisticasZona({ zona, capas = [], capaEquipamiento, capaLugares, mapaRef }) {
  const { user } = useAuth()
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const contenidoRef = useRef(null)

  const { total, porCategoria } = useMemo(() => contarPorCategoriaEnZona(zona, capas), [zona, capas])

  const areaKm2 = useMemo(() => {
    if (!zona?.centro || !zona?.radioKm) return null
    return calcularAreaZonaKm2(zona.centro, zona.radioKm)
  }, [zona])

  const densidad = areaKm2 && areaKm2 > 0 ? (total / areaKm2) : null

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

  // Captura el mapa Leaflet tal como se ve en pantalla, pero con los
  // clusters "desarmados" temporalmente (cada punto suelto) para que la
  // foto sirva de verdad para ubicar qué hay en cada calle exacta.
  async function capturarMapa() {
    if (!mapaRef?.current) return null

    const temporales = mapaRef.current.prepararCaptura()
    // pequeña espera para que Leaflet termine de pintar los marcadores sueltos
    await new Promise((resolve) => setTimeout(resolve, 300))

    try {
      return await html2canvas(mapaRef.current.getContenedor(), {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#e5e3df',
        scale: 2
      })
    } finally {
      mapaRef.current.restaurarCaptura(temporales)
    }
  }

  // Captura el panel de estadísticas COMPLETO, no solo la parte visible
  // sin hacer scroll (html2canvas por defecto solo toma lo que cabe en
  // pantalla si el contenedor tiene scroll interno).
  async function capturarEstadisticas() {
    const el = contenidoRef.current
    const estiloOriginal = { maxHeight: el.style.maxHeight, overflow: el.style.overflow }

    el.style.maxHeight = 'none'
    el.style.overflow = 'visible'

    // Se le da la altura REAL del contenido explícitamente — si no,
    // html2canvas puede seguir usando el tamaño "encogido" de la caja
    // flexible en vez de todo lo que realmente hay adentro.
    const alturaReal = el.scrollHeight

    try {
      return await html2canvas(el, {
        backgroundColor: '#121820',
        scale: 2,
        height: alturaReal,
        windowHeight: alturaReal
      })
    } finally {
      el.style.maxHeight = estiloOriginal.maxHeight
      el.style.overflow = estiloOriginal.overflow
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
      const [canvasMapa, canvasStats] = await Promise.all([
        capturarMapa().catch(() => null),
        capturarEstadisticas()
      ])

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const anchoPagina = pdf.internal.pageSize.getWidth()
      const margen = 40
      let y = 50

      // --- Encabezado / contexto en texto real, no solo imagen ---
      pdf.setFontSize(16)
      pdf.text(`Informe de zona: ${zona.nombre}`, margen, y)
      y += 20

      pdf.setFontSize(10)
      pdf.setTextColor(90, 90, 90)
      pdf.text(`Centro: ${zona.centro.lat.toFixed(6)}, ${zona.centro.lng.toFixed(6)}`, margen, y)
      y += 14
      pdf.text(`Radio de búsqueda: ${zona.radioKm} km`, margen, y)
      y += 14
      pdf.text(`Generado el: ${new Date().toLocaleString('es-CO')}`, margen, y)
      y += 14
      pdf.text(
        `Total de equipamientos/lugares en la zona: ${total}   |   Área: ${areaKm2?.toFixed(2)} km²   |   Densidad: ${densidad?.toFixed(1)} por km²`,
        margen, y
      )
      y += 24
      pdf.setTextColor(0, 0, 0)

      // --- Mapa ---
      const alturaPagina = pdf.internal.pageSize.getHeight()

      if (canvasMapa) {
        const anchoImg = anchoPagina - margen * 2
        const altoImg = (canvasMapa.height * anchoImg) / canvasMapa.width

        // Si el mapa no cabe entero en lo que queda de página, empieza
        // una página nueva en vez de cortarlo.
        if (y + altoImg > alturaPagina - margen) {
          pdf.addPage()
          y = margen
        }

        pdf.setFontSize(12)
        pdf.text('Mapa de la zona', margen, y)
        y += 10
        pdf.addImage(canvasMapa.toDataURL('image/png'), 'PNG', margen, y, anchoImg, altoImg)
        y += altoImg + 20
      }

      // --- Gráfica de estadísticas (nueva página si no cabe) ---
      const anchoImgStats = anchoPagina - margen * 2
      const altoImgStats = (canvasStats.height * anchoImgStats) / canvasStats.width

      if (y + altoImgStats > alturaPagina - margen) {
        pdf.addPage()
        y = margen
      }

      pdf.setFontSize(12)
      pdf.text('Distribución por categoría', margen, y)
      y += 10
      pdf.addImage(canvasStats.toDataURL('image/png'), 'PNG', margen, y, anchoImgStats, altoImgStats)

      pdf.save(nombreArchivo(zona, 'pdf'))
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

      <div className="estadisticas-zona__contenido" ref={contenidoRef}>
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
              <span className="estadisticas-zona__metrica-label">por km²</span>
            </div>
          )}
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
                  tick={{ fill: '#edf6ff', fontSize: 11 }}
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
                  <LabelList dataKey="cantidad" position="right" fill="#edf6ff" fontSize={11} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="estadisticas-zona__vacio">Sin datos para graficar todavía.</div>
        )}
      </div>
    </aside>
  )
}