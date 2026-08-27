import { useState, useEffect } from 'react'
import '../styles/SeleccionarCapa.css'
import {Map} from 'lucide-react'

function crearZonaGeoJSON(latitud, longitud, radioKm) {
    const puntos = []
    const gradosPorKm = 1 / 111.32
    const radioLatitud = radioKm * gradosPorKm
    const radioLongitud = radioLatitud / Math.cos((latitud * Math.PI) / 180)

    for (let indice = 0; indice <= 64; indice += 1) {
        const angulo = (indice / 64) * Math.PI * 2
        puntos.push([
            longitud + Math.cos(angulo) * radioLongitud,
            latitud + Math.sin(angulo) * radioLatitud
        ])
    }

    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: { radioKm },
            geometry: { type: 'Polygon', coordinates: [puntos] }
        }]
    }
}

function SeleccionarCapa({ setCapas, captura }) {
    const [latitud, setLatitud] = useState('6.25')
    const [longitud, setLongitud] = useState('-75.56')
    const [radioKm, setRadioKm] = useState('2')

    useEffect(() => {
        if (captura) {
            setLatitud(captura.lat.toFixed(6))
            setLongitud(captura.lng.toFixed(6))
        }
    }, [captura])

    function manejarCrearZona(evento) {
        evento.preventDefault()

        const latitudNumero = Number(latitud)
        const longitudNumero = Number(longitud)
        const radioNumero = Number(radioKm)

        if (!Number.isFinite(latitudNumero) || latitudNumero < -90 || latitudNumero > 90) return
        if (!Number.isFinite(longitudNumero) || longitudNumero < -180 || longitudNumero > 180) return
        if (!Number.isFinite(radioNumero) || radioNumero <= 0) return

        const nuevaZona = {
            id: crypto.randomUUID(),
            nombre: `Zona de ${radioNumero} km (${latitudNumero}, ${longitudNumero})`,
            archivoOriginal: null,
            geojson: crearZonaGeoJSON(latitudNumero, longitudNumero, radioNumero),
            crs: { epsg: 4326, fuente: 'zona generada por coordenadas' },
            visible: true,
            guardadaEnNube: false
        }

        setCapas(prev => [...prev, nuevaZona])
    }

    return (
        <div className="zona-selector">
            <div className="zona-selector__encabezado">
                <h4>Mapear una zona <Map /></h4>
                <p>Define un centro y un radio para crear una zona en el mapa.</p>
            </div>
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
                <button type="submit">Crear zona</button>
            </form>
        </div>
    )
}

export default SeleccionarCapa