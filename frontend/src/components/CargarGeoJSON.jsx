import { useState, useRef } from 'react'
import shp from 'shpjs'
import { kml } from '@tmcw/togeojson'
import { detectarCRS } from '../utils/detectarCRS'
import { toast } from 'sonner'
import { Upload, FileJson, FileArchive, MapPin, CheckCircle2 } from 'lucide-react'
import '../styles/CargarGeoJSON.css'
import { reproyectarGeoJSON } from '../utils/reproyectarGeoJSON'

const EXTENSIONES_VALIDAS = ['geojson', 'json', 'zip', 'kml']

export default function CargarCapaArchivo({ capas, setCapas }) {
  const [cargando, setCargando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [ultimoArchivo, setUltimoArchivo] = useState(null)
  const inputRef = useRef(null)

  async function procesarArchivo(archivo) {
    if (!archivo) return

    const extension = archivo.name.split('.').pop().toLowerCase()
    if (!EXTENSIONES_VALIDAS.includes(extension)) {
      toast.error('Formato no soportado. Usa .geojson, .zip (shapefile) o .kml')
      return
    }

    setCargando(true)
    let geojson = null
    let crsDetectado = { epsg: 4326, fuente: 'default' }

    try {
      if (extension === 'geojson' || extension === 'json') {
        const texto = await archivo.text()
        geojson = JSON.parse(texto)
        crsDetectado = detectarCRS(geojson, 'geojson')
        console.log('CRS detectado:', crsDetectado)
        geojson = reproyectarGeoJSON(geojson, crsDetectado.epsg)
      }

      if (extension === 'zip') {
        const buffer = await archivo.arrayBuffer()
        geojson = await shp(buffer)
        crsDetectado = await detectarCRS(archivo, 'shapefile')
        console.log('CRS detectado:', crsDetectado)
        geojson = reproyectarGeoJSON(geojson, crsDetectado.epsg)
      }

      if (extension === 'kml') {
        const texto = await archivo.text()
        const parser = new DOMParser()
        const kmlDom = parser.parseFromString(texto, 'text/xml')
        geojson = kml(kmlDom)
        crsDetectado = { epsg: 4326, fuente: 'especificación KML' }
      }

      const nuevaCapa = {
        id: crypto.randomUUID(),
        nombre: archivo.name,
        archivoOriginal: archivo,
        geojson,
        geojsonOriginal: geojson,
        hiddenCategories: [],
        crs: crsDetectado,
        visible: true,
        guardadaEnNube: false
      }

      setCapas([...capas, nuevaCapa])
      setUltimoArchivo({ nombre: archivo.name, extension })
      toast.success(`"${archivo.name}" cargada en el mapa`)
    } catch (error) {
      console.error(error)
      toast.error('No se pudo procesar el archivo: ' + error.message)
    } finally {
      setCargando(false)
    }
  }

  function manejarSoltar(evento) {
    evento.preventDefault()
    setArrastrando(false)
    procesarArchivo(evento.dataTransfer.files?.[0])
  }

  function manejarSeleccion(evento) {
    procesarArchivo(evento.target.files?.[0])
    evento.target.value = '' 
  }

  return (
    <div className="carga-archivo">
      <div className="carga-archivo__encabezado">
        <Upload size={16} />
        <h3>Cargar archivo geográfico</h3>
      </div>
      <p className="carga-archivo__descripcion">
        Sube un archivo con tus propios datos geoespaciales para visualizarlo en el mapa.
      </p>

      <div
        className={`carga-archivo__dropzone ${arrastrando ? 'is-dragging' : ''} ${cargando ? 'is-loading' : ''}`}
        onClick={() => !cargando && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={manejarSoltar}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".geojson,.json,.zip,.kml"
          onChange={manejarSeleccion}
          disabled={cargando}
          hidden
        />

        {cargando ? (
          <>
            <span className="carga-archivo__spinner" />
            <p className="carga-archivo__texto-principal">Procesando archivo...</p>
          </>
        ) : (
          <>
            <div className="carga-archivo__icono-wrapper">
              <Upload size={24} strokeWidth={1.8} className="carga-archivo__icono" />
            </div>
            <p className="carga-archivo__texto-principal">
              Arrastra tu archivo aquí o <span>haz clic para elegir</span>
            </p>
            <p className="carga-archivo__texto-secundario">
              Formatos aceptados: GeoJSON, Shapefile (.zip), KML
            </p>
          </>
        )}
      </div>

      <div className="carga-archivo__formatos">
        <span className="carga-archivo__badge">
          <FileJson size={13} /> GeoJSON
        </span>
        <span className="carga-archivo__badge">
          <FileArchive size={13} /> Shapefile
        </span>
        <span className="carga-archivo__badge">
          <MapPin size={13} /> KML
        </span>
      </div>

      {ultimoArchivo && !cargando && (
        <div className="carga-archivo__ultimo">
          <CheckCircle2 size={16} />
          <span>{ultimoArchivo.nombre} cargado correctamente</span>
        </div>
      )}
    </div>
  )
}