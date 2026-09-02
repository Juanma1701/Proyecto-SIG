import { useState, useEffect } from 'react'
import { fetchCapaArcGIS, listarCapasDisponiblesPorMunicipio, resolverCapaElegida } from '../utils/fetchArcGIS'
import { obtenerCategoria, estiloCategoria } from '../utils/categoriasEquipamiento'
import { toast } from 'sonner'
import { Globe } from 'lucide-react'

const MUNICIPIOS_AMVA = [
  'Barbosa', 'Girardota', 'Copacabana', 'Bello', 'Medellín',
  'Envigado', 'Itagüí', 'La Estrella', 'Sabaneta', 'Caldas',
]

export default function CargarCapaAPI({ setCapas }) {
  const [municipio, setMunicipio] = useState(MUNICIPIOS_AMVA[0])
  const [capasDisponibles, setCapasDisponibles] = useState([]) // [{ servicio, id, nombre }]
  const [capaSeleccionada, setCapaSeleccionada] = useState('')
  const [cargandoLista, setCargandoLista] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(false)

  // Cada vez que cambia el municipio, trae la lista REAL de capas de ese municipio
  useEffect(() => {
    let cancelado = false

    async function cargarListaCapas() {
      setCargandoLista(true)
      setCapasDisponibles([])
      setCapaSeleccionada('')
      try {
        const resultados = await listarCapasDisponiblesPorMunicipio(municipio)
        // Aplana [{ servicio, capas: [{id, nombre}] }] a una sola lista
        const lista = resultados.flatMap(({ servicio, capas }) =>
          capas.map((c) => ({ servicio, id: c.id, nombre: c.nombre }))
        )
        if (!cancelado) {
          setCapasDisponibles(lista)
          if (lista.length > 0) {
            setCapaSeleccionada(`${lista[0].servicio}::${lista[0].id}`)
          }
        }
      } catch (error) {
        console.error(error)
        if (!cancelado) toast.error('No se pudo listar capas: ' + error.message)
      } finally {
        if (!cancelado) setCargandoLista(false)
      }
    }

    cargarListaCapas()
    return () => { cancelado = true }
  }, [municipio])

  async function manejarCargar() {
    if (!capaSeleccionada) return
    const [servicio, idCapaTexto] = capaSeleccionada.split('::')
    const idCapa = Number(idCapaTexto)
    const nombreCapa = capasDisponibles.find((c) => c.servicio === servicio && c.id === idCapa)?.nombre || 'Capa AMVA'

    setCargandoDatos(true)
    try {
      const { url, epsg } = await resolverCapaElegida(servicio, idCapa)
      const geojson = await fetchCapaArcGIS(url)

      if (!geojson?.features?.length) {
        toast.error('Esa capa no tiene datos para mostrar')
        return
      }

      // Le agrega a cada feature su categoría/color/icono, útil para pintar
      // en el mapa y para poder filtrar/ocultar por categoría después
      const featuresConCategoria = geojson.features.map((f) => {
        const categoria = obtenerCategoria(f)
        const estilo = estiloCategoria(categoria)
        return {
          ...f,
          properties: {
            ...f.properties,
            categoria,
            categoriaEtiqueta: estilo.etiqueta,
            categoriaColor: estilo.color,
            categoriaIcono: estilo.icono,
          }
        }
      })

      const geojsonFinal = { type: 'FeatureCollection', features: featuresConCategoria }

      const nuevaCapa = {
        id: crypto.randomUUID(),
        nombre: `${nombreCapa} — ${municipio}`,
        archivoOriginal: null,
        geojson: geojsonFinal,
        geojsonOriginal: geojsonFinal,
        hiddenCategories: [],
        crs: { epsg: epsg || null, fuente: `API ArcGIS REST (AMVA — ${servicio}/${idCapa})` },
        visible: true,
        guardadaEnNube: false,
      }

      setCapas((prev) => [...prev, nuevaCapa])
      toast.success(`"${nuevaCapa.nombre}" cargada desde la API`)
    } catch (error) {
      console.error(error)
      toast.error('No se pudo cargar desde la API: ' + error.message)
    } finally {
      setCargandoDatos(false)
    }
  }

  return (
    <div className="sidebar-section">
      <h3>Datos abiertos AMVA</h3>

      <select
        value={municipio}
        onChange={(e) => setMunicipio(e.target.value)}
        className="dropzone-boton"
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      >
        {MUNICIPIOS_AMVA.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select
        value={capaSeleccionada}
        onChange={(e) => setCapaSeleccionada(e.target.value)}
        disabled={cargandoLista || capasDisponibles.length === 0}
        className="dropzone-boton"
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      >
        {cargandoLista && <option>Buscando capas...</option>}
        {!cargandoLista && capasDisponibles.length === 0 && <option>No hay capas disponibles</option>}
        {capasDisponibles.map((c) => (
          <option key={`${c.servicio}::${c.id}`} value={`${c.servicio}::${c.id}`}>
            {c.nombre} ({c.servicio})
          </option>
        ))}
      </select>

      <button
        onClick={manejarCargar}
        disabled={cargandoDatos || cargandoLista || !capaSeleccionada}
        className="dropzone-boton"
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      >
        {cargandoDatos ? (
          <><span className="spinner"></span>Cargando datos...</>
        ) : (
          <><Globe size={12} />  <span>Cargar capa</span></>
        )}
      </button>
    </div>
  )
}