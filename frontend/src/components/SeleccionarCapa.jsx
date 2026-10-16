import { useState, useEffect } from 'react'
import '../styles/SeleccionarCapa.css'
import { MapPinned, Crosshair, Radius } from 'lucide-react'
import { toast } from 'sonner'
import { capaDesdeZona } from '../utils/capaDesdeZona'
import { capaLugaresDesdeZona } from '../utils/capaLugaresDesdeZona'
import { capaSueloDesdeZona } from '../utils/capaSueloDesdeZona'
import { capaCoberturaDesdeZona } from '../utils/coberturaZona'
import { capaTeseladoDesdeZona } from '../utils/teseladoZona'
import { municipiosEnZona } from '../utils/municipiosValleAburra'
import { contarPorCategoriaEnZona } from '../utils/analisisEspacial'

const SERVICIOS_COBERTURA = [
    { valor: 'SALUD', etiqueta: 'Salud' },
    { valor: 'EDUCACION', etiqueta: 'Educación' },
    { valor: 'RECREACION', etiqueta: 'Recreación' },
    { valor: 'CULTURA', etiqueta: 'Cultura' },
    { valor: 'TRANSPORTE', etiqueta: 'Transporte' }
]

const RADIO_MAX_KM = 5

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

// Texto del mensaje final. Usa los mismos números que las estadísticas.
function mensajeResumen({ total, equipamientos, lugares, incompleto }) {
    let texto
    if (equipamientos > 0 && lugares > 0) {
        texto = `${total} elementos: ${equipamientos} equipamientos y ${lugares} lugares`
    } else if (equipamientos > 0) {
        texto = `${equipamientos} equipamientos encontrados`
    } else {
        texto = `${lugares} lugares encontrados`
    }
    return incompleto ? `${texto} (resultado incompleto)` : texto
}

function SeleccionarCapa({ setCapas, captura }) {
    const [latitud, setLatitud] = useState('6.25')
    const [longitud, setLongitud] = useState('-75.56')
    const [radioKm, setRadioKm] = useState('1')
    const [incluirSuelo, setIncluirSuelo] = useState(false)
    const [incluirCobertura, setIncluirCobertura] = useState(false)
    const [servicio, setServicio] = useState('SALUD')
    const [distanciaM, setDistanciaM] = useState('1000')
    const [incluirTeselado, setIncluirTeselado] = useState(false)
    const [ladoCeldaM, setLadoCeldaM] = useState('500')
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
        if (radioNumero > RADIO_MAX_KM) {
            toast.error(`El radio máximo es ${RADIO_MAX_KM} km para mantener la consulta rápida`)
            return
        }

        // Comprobación rápida y local: ¿la zona toca el Valle de Aburrá?
        // Si no, se avisa al instante y no se dibuja ni se consulta nada.
        if (municipiosEnZona({ lat: latitudNumero, lng: longitudNumero }, radioNumero).length === 0) {
            toast.error('Esta zona está fuera del Valle de Aburrá. Por ahora GeoAburrá solo cubre los 10 municipios del Valle.')
            return
        }

        const nuevaZona = crearZonaBusqueda(latitudNumero, longitudNumero, radioNumero)
        setCapas(prev => [...prev, nuevaZona])

        setCargando(true)
        const centro = { lat: latitudNumero, lng: longitudNumero }

        try {
            const tareas = [
                capaDesdeZona(centro, radioNumero),
                capaLugaresDesdeZona(centro, radioNumero)
            ]
            if (incluirSuelo) tareas.push(capaSueloDesdeZona(centro, radioNumero))
            if (incluirCobertura) {
                tareas.push(capaCoberturaDesdeZona(centro, radioNumero, servicio, Number(distanciaM)))
            }
            if (incluirTeselado) {
                tareas.push(capaTeseladoDesdeZona(centro, radioNumero, Number(ladoCeldaM)))
            }

            const resultados = await Promise.allSettled(tareas)

            const nuevasCapas = resultados
                .filter(r => r.status === 'fulfilled' && r.value)
                .map(r => ({ ...r.value, zonaId: nuevaZona.id }))

            if (nuevasCapas.length > 0) {
                setCapas(prev => [...prev, ...nuevasCapas])
            }

            let huboFallos = false
            resultados.forEach(r => {
                if (r.status === 'rejected') {
                    huboFallos = true
                    console.error(r.reason)
                    toast.error('Error al consultar: ' + r.reason.message)
                }
            })

            // Mensaje único. Se cuenta con la MISMA función y las MISMAS capas
            // que usan las estadísticas (sin suelo, cobertura ni teselado),
            // así los números siempre coinciden.
            const capasParaConteo = nuevasCapas.filter(
                c => c.tipo !== 'suelo' && c.tipo !== 'cobertura' && c.tipo !== 'teselado'
            )
            const { total, equipamientos, lugares } = contarPorCategoriaEnZona(nuevaZona, capasParaConteo)

            if (total > 0) {
                toast.success(mensajeResumen({ total, equipamientos, lugares, incompleto: huboFallos }))
            }
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="zona-selector">
            <div className="zona-selector__encabezado">
                <h4><MapPinned /> Mapear una zona</h4>
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
                <div className="zona-selector__fila">
                    <label>
                        Latitud
                        <input type="number" min="-90" max="90" step="any" value={latitud} onChange={evento => setLatitud(evento.target.value)} required />
                    </label>
                    <label>
                        Longitud
                        <input type="number" min="-180" max="180" step="any" value={longitud} onChange={evento => setLongitud(evento.target.value)} required />
                    </label>
                </div>

                <label>
                    Radio (km)
                    <input type="number" min="0.1" max="5" step="any" value={radioKm} onChange={evento => setRadioKm(evento.target.value)} required />
                </label>

                <label className="zona-selector__checkbox">
                    <input
                        type="checkbox"
                        checked={incluirSuelo}
                        onChange={evento => setIncluirSuelo(evento.target.checked)}
                    />
                    Incluir uso de suelo / POT (experimental)
                </label>

                <label className="zona-selector__checkbox">
                    <input
                        type="checkbox"
                        checked={incluirCobertura}
                        onChange={evento => setIncluirCobertura(evento.target.checked)}
                    />
                    Analizar cobertura de un servicio (radio máx. 5 km)
                </label>

                {incluirCobertura && (
                    <div className="zona-selector__fila">
                        <label>
                            Servicio
                            <select value={servicio} onChange={evento => setServicio(evento.target.value)}>
                                {SERVICIOS_COBERTURA.map(s => (
                                    <option key={s.valor} value={s.valor}>{s.etiqueta}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Distancia
                            <select value={distanciaM} onChange={evento => setDistanciaM(evento.target.value)}>
                                <option value="500">500 m</option>
                                <option value="1000">1 km</option>
                                <option value="2000">2 km</option>
                            </select>
                        </label>
                    </div>
                )}

                <label className="zona-selector__checkbox">
                    <input
                        type="checkbox"
                        checked={incluirTeselado}
                        onChange={evento => setIncluirTeselado(evento.target.checked)}
                    />
                    Teselado de equipamientos (hexágonos, radio máx. 5 km)
                </label>

                {incluirTeselado && (
                    <label>
                        Lado del hexágono
                        <select value={ladoCeldaM} onChange={evento => setLadoCeldaM(evento.target.value)}>
                            <option value="250">250 m</option>
                            <option value="500">500 m</option>
                            <option value="1000">1 km</option>
                        </select>
                    </label>
                )}

                <button type="submit" disabled={cargando}>
                    {cargando ? (
                        <><span className="spinner"></span>Consultando...</>
                    ) : (
                        <><Radius size={16} /> Crear zona</>
                    )}
                </button>
            </form>
        </div>
    )
}

export default SeleccionarCapa