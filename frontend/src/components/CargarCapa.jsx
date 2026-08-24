import { useState } from 'react'
import shp from 'shpjs'
import { kml } from '@tmcw/togeojson'
import L from 'leaflet'
import { detectarCRS } from '../utils/detectarCRS'

export default function CargarCapa({ mapa, capas, setCapas }) {
  const [cargando, setCargando] = useState(false)

  async function manejarArchivo(e) {
    const archivo = e.target.files[0]
    if (!archivo || !mapa) return

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
        const resultado = await shp(buffer) // shpjs ya devuelve GeoJSON
        geojson = resultado
        // shpjs no expone el .prj crudo directamente en todos los casos;
        // si necesitas el EPSG exacto, hay que leer el .prj aparte (ver utils/detectarCRS.js)
        crsDetectado = await detectarCRS(archivo, 'shapefile')
      }

      if (extension === 'kml') {
        const texto = await archivo.text()
        const parser = new DOMParser()
        const kmlDom = parser.parseFromString(texto, 'text/xml')
        geojson = kml(kmlDom)
        crsDetectado = { epsg: 4326, fuente: 'especificación KML' }
      }

      const capaLeaflet = L.geoJSON(geojson).addTo(mapa)
      mapa.fitBounds(capaLeaflet.getBounds())

      const nuevaCapa = {
        id: crypto.randomUUID(),
        nombre: archivo.name,
        geojson,
        crs: crsDetectado,
        leafletLayer: capaLeaflet,
        visible: true
      }

      setCapas([...capas, nuevaCapa])
    } catch (error) {
      console.error(error)
      alert('No se pudo procesar el archivo: ' + error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div>
      <label>Cargar capa (.geojson, .zip shapefile, .kml)</label>
      <input type="file" accept=".geojson,.json,.zip,.kml" onChange={manejarArchivo} disabled={cargando} />
      {cargando && <p>Procesando...</p>}
    </div>
  )
}