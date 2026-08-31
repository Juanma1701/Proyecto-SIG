import { useState } from 'react'
import { fetchCapaArcGIS, resolverCapaPorMunicipio } from '../utils/fetchArcGIS'
import { toast } from 'sonner'

const MUNICIPIOS_AMVA = [
  'Barbosa',
  'Girardota',
  'Copacabana',
  'Bello',
  'Medellín',
  'Envigado',
  'Itagüí',
  'La Estrella',
  'Sabaneta',
  'Caldas',
]

const NOMBRE_CAPA = 'Equipamientos Urbanos'

export default function CargarCapaAPI({ capas, setCapas }) {
  const [municipio, setMunicipio] = useState(MUNICIPIOS_AMVA[0])
  const [cargando, setCargando] = useState(false)

  async function manejarCargar() {
    setCargando(true)
    try {
      const { url, servicio, idCapa, epsg } = await resolverCapaPorMunicipio(municipio, NOMBRE_CAPA)
      const geojson = await fetchCapaArcGIS(url)

      const nuevaCapa = {
        id: crypto.randomUUID(),
        nombre: `${NOMBRE_CAPA} — ${municipio}`,
        archivoOriginal: null,
        geojson,
        crs: {
          epsg: epsg || null,
          fuente: `API ArcGIS REST (AMVA — ${servicio}/${idCapa})`,
        },
        visible: true,
        guardadaEnNube: false,
      }

      setCapas([...capas, nuevaCapa])
      toast.success(`"${nuevaCapa.nombre}" cargada desde la API`)
    } catch (error) {
      console.error(error)
      toast.error('No se pudo cargar desde la API: ' + error.message)
    } finally {
      setCargando(false)
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
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <button
        onClick={manejarCargar}
        disabled={cargando}
        className="dropzone-boton"
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      >
        {cargando ? (
          <>
            <span className="spinner"></span>Consultando...
          </>
        ) : (
          `🌐 ${NOMBRE_CAPA} — ${municipio}`
        )}
      </button>
    </div>
  )
}