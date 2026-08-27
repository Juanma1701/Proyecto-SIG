import { useState } from 'react'
import shp from 'shpjs'
import { kml } from '@tmcw/togeojson'
import { detectarCRS } from '../utils/detectarCRS'
import { guardarCapaEnSupabase } from '../utils/guardarcapa'
import { toast } from 'sonner'
import { generarPuntosPrueba } from '../utils/generarPuntosPrueba'
import '../styles/CargarCapa.css'

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

  function manejarGenerarPrueba() {
    const geojson = generarPuntosPrueba(5000)
    const nuevaCapa = {
      id: crypto.randomUUID(),
      nombre: 'Prueba de rendimiento (5,000 puntos)',
      archivoOriginal: null,
      geojson,
      crs: { epsg: 4326, fuente: 'generado localmente' },
      visible: true,
      guardadaEnNube: false
    }
    setCapas([...capas, nuevaCapa])
    toast.success('5,000 puntos generados — compara los modos ahora')
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
      <label>Cargar capa (.geojson, .zip shapefile, .kml)</label>
      <br />
      <input type="file" accept=".geojson,.json,.zip,.kml" onChange={manejarArchivo} disabled={cargando} />
      {cargando && (
        <p className="cargar-capa__estado">
          <span className="spinner"></span>Procesando archivo...
        </p>
      )}

      <button
        onClick={manejarGenerarPrueba}
        className="cargar-capa__boton-prueba"
      >
        ⚡ Generar capa de prueba (5,000 puntos)
      </button>

      {capas.map(capa => (
        <div key={capa.id} className="capa-item cargar-capa__item">
          <p>{capa.nombre}</p>
          {capa.archivoOriginal ? (
            !capa.guardadaEnNube ? (
              <button onClick={() => manejarGuardar(capa)} disabled={guardando === capa.id}>
                {guardando === capa.id ? (
                  <><span className="spinner"></span>Guardando...</>
                ) : (
                  '☁️ Guardar en la nube'
                )}
              </button>
            ) : (
              <span className="cargar-capa__estado cargar-capa__estado--guardada">☁️ Guardada</span>
            )
          ) : (
            <span className="cargar-capa__estado cargar-capa__estado--local">⚡ Solo demo local</span>
          )}
        </div>
      ))}
    </div>
  )
}