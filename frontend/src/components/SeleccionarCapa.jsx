import { useState, useEffect } from 'react'
import '../styles/SeleccionarCapa.css'
import { MapPinned } from 'lucide-react'
import { toast } from 'sonner'
import { capaDesdeZona } from '../utils/capaDesdeZona'
function crearZonaBusqueda(latitud, longitud, radioKm) {
    return {
        id: crypto.randomUUID(),
        nombre: `Zona de ${radioKm} km (${latitud}, ${longitud})`,
        archivoOriginal: null,
        tipo: 'zona',
        centro: { lat: latitud, lng: longitud },
        radioKm,
        geojson: null,
        crs: { epsg: 4326, fuente: 'zona de busqueda' },
        visible: true,
        guardadaEnNube: false,
        esZonaVisual: true,
        color: '#2563eb'
    }
}

function SeleccionarCapa({ setCapas, captura }) {
    const [latitud, setLatitud] = useState('6.25')
    const [longitud, setLongitud] = useState('-75.56')
    const [radioKm, setRadioKm] = useState('2')
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        if (captura) {
            setLatitud(captura.lat.toFixed(6))
            setLongitud(captura.lng.toFixed(6))
        }
    }, [captura])

    async function manejarCrearZona(evento) {
        evento.preventDefault()

        const latitudNumero = Number(latitud)
        const longitudNumero = Number(longitud)
        const radioNumero = Number(radioKm)

        if (!Number.isFinite(latitudNumero) || latitudNumero < -90 || latitudNumero > 90) return
        if (!Number.isFinite(longitudNumero) || longitudNumero < -180 || longitudNumero > 180) return
        if (!Number.isFinite(radioNumero) || radioNumero <= 0) return

        const nuevaZona = crearZonaBusqueda(latitudNumero, longitudNumero, radioNumero)
        setCapas(prev => [...prev, nuevaZona])

        setCargando(true)
        try {
            const centro = { lat: latitudNumero, lng: longitudNumero }
            const capaEquipamientos = await capaDesdeZona(centro, radioNumero)
            if (capaEquipamientos) {
                setCapas(prev => [...prev, capaEquipamientos])
            }
        } catch (error) {
            console.error(error)
            toast.error('Error al consultar equipamientos del AMVA: ' + error.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="zona-selector">
            <div className="zona-selector__encabezado">
                <h4>Mapear una zona <MapPinned /></h4>
                <p>Define un centro y un radio para crear una zona en el mapa.</p>
            </div>
            {captura && (
                <div className="capa-item">
                    <p>Última coordenada capturada</p>
                    <span className="dashboard__coordenada">
                        Lat: {captura.lat.toFixed(6)}<br />
                        Lng: {captura.lng.toFixed(6)}
                    </span>
                </div>
            )}
            <form onSubmit={manejarCrearZona} className="zona-selector__formulario">
                <label>
                    Latitud
                    <input type="number" min="-90" max="90" step="any" value={latitud} onChange={evento => setLatitud(evento.target.value)} required />
                </label>
                <label>
                    Longitud
                    <input type="number" min="-180" max="180" step="any" value={longitud} onChange={evento => setLongitud(evento.target.value)} required />
                </label>
                <label>
                    Radio (km)
                    <input type="number" min="0.1" step="any" value={radioKm} onChange={evento => setRadioKm(evento.target.value)} required />
                </label>
                <button type="submit" disabled={cargando}>
                    {cargando ? (
                        <><span className="spinner"></span>Consultando AMVA...</>
                    ) : (
                        'Crear zona'
                    )}
                </button>
            </form>
        </div>
    )
}

export default SeleccionarCapa