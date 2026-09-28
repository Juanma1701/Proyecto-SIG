import { useState, useRef } from 'react'
import shp from 'shpjs'
import { kml } from '@tmcw/togeojson'
import { detectarCRS } from '../utils/detectarCRS'
import { toast } from 'sonner'
import { Upload, FileJson, FileArchive, MapPin, CheckCircle2 } from 'lucide-react'
import '../styles/CargarGeoJSON.css'
import {
  asegurarDefinicionEPSG,
  normalizarGeoJSON,
  reproyectarGeoJSON,
} from '../utils/reproyectarGeoJSON'

const EXTENSIONES_VALIDAS = ['geojson', 'json', 'zip', 'kml']

function crearIdCapa() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `capa-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function clonarGeoJSON(geojson) {
  return JSON.parse(JSON.stringify(geojson))
}

export default function CargarCapaArchivo({ setCapas }) {
  const [cargando, setCargando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [ultimoArchivo, setUltimoArchivo] = useState(null)
  const inputRef = useRef(null)

  async function procesarArchivo(archivo) {
    if (!archivo) return

    const extension = archivo.name.split('.').pop()?.toLowerCase()
    if (!EXTENSIONES_VALIDAS.includes(extension)) {
      toast.error('Formato no soportado. Usa .geojson, .zip (shapefile) o .kml')
      return
    }

    setCargando(true)
    let geojsonOriginal
    let geojsonRender
    let crsOrigen

    try {
      if (extension === 'geojson' || extension === 'json') {
        const texto = (await archivo.text()).replace(/^\uFEFF/, '')
        geojsonOriginal = normalizarGeoJSON(JSON.parse(texto))
        crsOrigen = detectarCRS(geojsonOriginal, 'geojson')

        if (crsOrigen.epsg == null) {
          throw new Error(`No se pudo determinar el sistema de referencia del GeoJSON. ${crsOrigen.fuente}`)
        }

        await asegurarDefinicionEPSG(crsOrigen.epsg)
        geojsonRender = reproyectarGeoJSON(geojsonOriginal, crsOrigen.epsg)
      }

      if (extension === 'zip') {
        const buffer = await archivo.arrayBuffer()
        crsOrigen = await detectarCRS(buffer, 'shapefile')

        if (crsOrigen.epsg == null) {
          throw new Error(
            `El ZIP no contiene un archivo .prj con un CRS reconocible. ${crsOrigen.fuente}`
          )
        }

        await asegurarDefinicionEPSG(crsOrigen.epsg)
        const resultado = await shp(buffer)

        if (Array.isArray(resultado)) {
          if (resultado.length !== 1) {
            throw new Error('El ZIP contiene varias capas; carga un shapefile por archivo')
          }
          geojsonOriginal = normalizarGeoJSON(resultado[0])
        } else {
          geojsonOriginal = normalizarGeoJSON(resultado)
        }

        geojsonRender = geojsonOriginal
      }

      if (extension === 'kml') {
        const texto = await archivo.text()
        const parser = new DOMParser()
        const kmlDom = parser.parseFromString(texto, 'text/xml')

        if (kmlDom.getElementsByTagName('parsererror').length > 0) {
          throw new Error('El archivo KML no es un XML válido')
        }

        geojsonOriginal = normalizarGeoJSON(kml(kmlDom))
        crsOrigen = { epsg: 4326, fuente: 'especificación KML' }
        geojsonRender = geojsonOriginal
      }

      const nuevaCapa = {
        id: crearIdCapa(),
        nombre: archivo.name,
        tipo: 'archivo',
        archivoOriginal: archivo,
        geojson: geojsonRender,
        geojsonOriginal: clonarGeoJSON(geojsonOriginal),
        hiddenCategories: [],
        crs: crsOrigen,
        crsOrigen,
        crsRender: { epsg: 4326, fuente: 'WGS84 para Leaflet' },
        visible: true,
        guardadaEnNube: false,
      }

      setCapas(prev => [...prev, nuevaCapa])
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
