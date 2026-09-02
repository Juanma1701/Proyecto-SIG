import { useState } from 'react'
import shp from 'shpjs'
import { kml } from '@tmcw/togeojson'
import { detectarCRS } from '../utils/detectarCRS'
import { guardarCapaEnSupabase } from '../utils/guardarcapa'
import { toast } from 'sonner'
import '../styles/CargarCapa.css'
import {File, Folder, MapPlus } from 'lucide-react'
export default function CargarCapa({ capas, setCapas }) {
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(null)

  async function manejarArchivo(e) {
    const archivo = e.target.files[0]
    if (!archivo) return

    setCargando(true)
    const extension = archivo.name.split('.').pop().toLowerCase()
    let geojson = null
    let crsDetectado = { epsg: 4326, fuente: 'default' }

    try {
      if (extension === 'geojson' || extension === 'json') {
        const texto = await archivo.text()
        geojson = JSON.parse(texto)
        crsDetectado = detectarCRS(geojson, 'geojson')
      }

      if (extension === 'zip') {
        const buffer = await archivo.arrayBuffer()
        const resultado = await shp(buffer)
        crsDetectado = await detectarCRS(archivo, 'shapefile')

        if (Array.isArray(resultado)) {
          const grupoId = crypto.randomUUID()
          const nuevasCapas = resultado.map((fc, i) => ({
            id: crypto.randomUUID(),
            nombre: fc.fileName || `${archivo.name} — capa ${i + 1}`,
            archivoOriginal: i === 0 ? archivo : null,
            geojson: fc,
            crs: crsDetectado,
            visible: true,
            guardadaEnNube: false,
            grupo: grupoId,
            grupoNombre: archivo.name
          }))

          setCapas(prev => [...prev, ...nuevasCapas])
          toast.success(`${nuevasCapas.length} capas cargadas desde "${archivo.name}"`)
          setCargando(false)
          return
        }
        geojson = resultado
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
        crs: crsDetectado,
        visible: true,
        guardadaEnNube: false
      }

      setCapas([...capas, nuevaCapa])
      toast.success(`"${archivo.name}" cargada en el mapa`)
    } catch (error) {
      console.error(error)
      toast.error('No se pudo procesar el archivo: ' + error.message)
    } finally {
      setCargando(false)
    }
  }

  async function manejarGuardar(capa) {
    setGuardando(capa.id)
    try {
      await guardarCapaEnSupabase(capa.archivoOriginal, capa)
      setCapas(prev => prev.map(c =>
        c.id === capa.id ? { ...c, guardadaEnNube: true } : c
      ))
      toast.success(`"${capa.nombre}" guardada en la nube ☁️`)
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar: ' + error.message)
    } finally {
      setGuardando(null)
    }
  }

  return (
    <div>
      <div className="dropzone">
        <div className="dropzone-icon">⬆</div>
        <p className="dropzone-titulo">Cargar capa</p>
        <p className="dropzone-subtitulo">Arrastra archivos o haz clic para elegir</p>
        <div className="dropzone-formatos">
          <span><File />.geojson</span>
          <span><Folder />.zip</span>
          <span><MapPlus /> .kml</span>
        </div>
        <input
          type="file"
          accept=".geojson,.json,.zip,.kml"
          onChange={manejarArchivo}
          disabled={cargando}
          style={{ display: 'none' }}
          id="input-archivo"
        />
        <label htmlFor="input-archivo" className="dropzone-boton">
          Elegir archivo
        </label>
      </div>

      {cargando && (
        <p className="cargar-capa__estado">
          <span className="spinner"></span>Procesando archivo...
        </p>
      )}

      {capas.filter(capa => capa.archivoOriginal).map(capa => (
        <div key={capa.id} className="capa-item cargar-capa__item">
          <p>{capa.nombre}</p>
          {!capa.guardadaEnNube ? (
            <button onClick={() => manejarGuardar(capa)} disabled={guardando === capa.id}>
              {guardando === capa.id ? (
                <><span className="spinner"></span>Guardando...</>
              ) : (
                '☁️ Guardar en la nube'
              )}
            </button>
          ) : (
            <span className="cargar-capa__estado cargar-capa__estado--guardada">☁️ Guardada</span>
          )}
        </div>
      ))}
    </div>
  )
}