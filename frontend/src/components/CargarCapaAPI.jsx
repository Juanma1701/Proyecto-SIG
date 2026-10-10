import { useState, useEffect } from 'react'
import { fetchCapaArcGIS, listarCapasDisponiblesPorMunicipio, resolverCapaElegida } from '../utils/fetchArcGIS'
import { obtenerCategoria, estiloCategoria } from '../utils/categoriasEquipamiento'
import '../styles/CargarCapaAPI.css'
import { toast } from 'sonner'
import { Globe, MapPin, Layers, ChevronDown } from 'lucide-react'

const MUNICIPIOS_AMVA = [
  'Barbosa', 'Girardota', 'Copacabana', 'Bello', 'Medellín',
  'Envigado', 'Itagüí', 'La Estrella', 'Sabaneta', 'Caldas',
]

export default function CargarCapaAPI({ setCapas }) {
  const [municipio, setMunicipio] = useState('')
  const [capasDisponibles, setCapasDisponibles] = useState([])
  const [capaSeleccionada, setCapaSeleccionada] = useState('')
  const [cargandoLista, setCargandoLista] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(false)

  useEffect(() => {
    if (!municipio) {
      setCapasDisponibles([])
      setCapaSeleccionada('')
      return
    }

    let cancelado = false

    async function cargarListaCapas() {
      setCargandoLista(true)
      setCapasDisponibles([])
      setCapaSeleccionada('')
      try {
        const resultados = await listarCapasDisponiblesPorMunicipio(municipio)
        const lista = resultados.flatMap(({ servicio, capas }) =>
          capas.map((c) => ({ servicio, id: c.id, nombre: c.nombre }))
        )
        if (!cancelado) setCapasDisponibles(lista)
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
      const tipo = /vereda|barrio|comuna|corregimiento/i.test(nombreCapa) &&
        featuresConCategoria.some((feature) =>
          ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)
        )
        ? 'limites'
        : undefined

      const nuevaCapa = {
        id: crypto.randomUUID(),
        nombre: `${nombreCapa} — ${municipio}`,
        tipo,
        archivoOriginal: null,
        geojson: geojsonFinal,
        geojsonOriginal: geojsonFinal,
        hiddenCategories: [],
        crs: { epsg: epsg || null, fuente: `API ArcGIS REST (AMVA — ${servicio}/${idCapa})` },
        visible: true,
        guardadaEnNube: false,
        origenAPI: true,
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
    <div className="sidebar-section capa-api">
      <div className="capa-api__encabezado">
        <Globe size={16} />
        <h3>Datos abiertos del AMVA</h3>
      </div>
      <p className="capa-api__descripcion">
        Selecciona un municipio y la capa que deseas cargar al visor.
      </p>

      <div className="capa-api__campo">
        <label><MapPin size={13} /> Municipio</label>
        <div className="capa-api__select-wrapper">
          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
          >
            <option value="" disabled>Elige un municipio del Valle de Aburrá</option>
            {MUNICIPIOS_AMVA.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <ChevronDown size={16} className="capa-api__select-icono" />
        </div>
      </div>

      <div className="capa-api__campo">
        <label><Layers size={13} /> Capa geográfica</label>
        <div className="capa-api__select-wrapper">
          <select
            value={capaSeleccionada}
            onChange={(e) => setCapaSeleccionada(e.target.value)}
            disabled={!municipio || cargandoLista || capasDisponibles.length === 0}
          >
            {!municipio && <option value="">Primero elige un municipio</option>}
            {municipio && cargandoLista && <option value="">Buscando capas disponibles...</option>}
            {municipio && !cargandoLista && capasDisponibles.length === 0 && (
              <option value="">No hay capas disponibles</option>
            )}
            {municipio && !cargandoLista && capasDisponibles.length > 0 && (
              <option value="" disabled>Elige la capa a cargar</option>
            )}
            {capasDisponibles.map((c) => (
              <option key={`${c.servicio}::${c.id}`} value={`${c.servicio}::${c.id}`}>
                {c.nombre} ({c.servicio})
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="capa-api__select-icono" />
        </div>
      </div>

      <button
        className="capa-api__boton"
        onClick={manejarCargar}
        disabled={cargandoDatos || cargandoLista || !capaSeleccionada}
      >
        {cargandoDatos ? (
          <><span className="spinner"></span>Cargando datos...</>
        ) : (
          <><Globe size={15} /><span>Cargar capa al visor</span></>
        )}
      </button>
    </div>
  )
}