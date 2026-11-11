import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import '../styles/SeleccionarCapa.css'
import '../styles/SeleccionarCapaUsos.css'
import '../styles/SeleccionarCapaRapida.css'
import { MapPinned, Radius, LocateFixed, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { capaDesdeZona } from '../utils/capaDesdeZona'
import { capaLugaresDesdeZona } from '../utils/capaLugaresDesdeZona'
import { capaSueloDesdeZona } from '../utils/capaSueloDesdeZona'
import { capaUsosDesdeZona, RADIO_MAX_USOS_KM } from '../utils/capaUsosDesdeZona'
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

const RADIOS_RAPIDOS = [
    { valor: 0.5, etiqueta: '500 m' },
    { valor: 1, etiqueta: '1 km' },
    { valor: 2, etiqueta: '2 km' },
    { valor: 3, etiqueta: '3 km' },
    { valor: 5, etiqueta: '5 km' }
]

// Las capas que nacen de una zona (la zona misma y todo lo que se consulta con ella)
const esDeZona = (capa) => Boolean(capa.zonaId || capa.esZonaVisual || capa.tipo === 'zona')

function mensajeUbicacion(error) {
    if (error.code === 1) {
        return 'No diste permiso para usar tu ubicación. Puedes activarlo desde el candado de la barra de direcciones.'
    }
    if (error.code === 3) return 'Se agotó el tiempo esperando tu ubicación. Inténtalo de nuevo.'
    return 'No se pudo determinar tu ubicación.'
}

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

// Props nuevas:
//  - capas: todas las capas del visor (para saber si hay zonas que limpiar)
//  - onIrA(lat, lng): mueve el mapa a un punto (la usa "Usar mi ubicación")
//  - onZonaCreada({ lat, lng, radioKm }): avisa que se creó una zona (el visor encuadra el mapa)
//  - onCargandoCambio(bool): avisa si se está consultando (para bloquear "Analizar aquí")
// Por la referencia (ref) expone analizarEn({ lat, lng, radioKm }), que usa la tarjeta
// "Analizar aquí" del mapa: crea la zona con las casillas marcadas en este formulario.
const SeleccionarCapa = forwardRef(function SeleccionarCapa(
    { setCapas, captura, capas = [], onIrA, onZonaCreada, onCargandoCambio },
    refExterno
) {
    const [latitud, setLatitud] = useState('6.25')
    const [longitud, setLongitud] = useState('-75.56')
    const [radioKm, setRadioKm] = useState('1')
    const [incluirSuelo, setIncluirSuelo] = useState(true)
    const [incluirUsos, setIncluirUsos] = useState(false)
    const [incluirCobertura, setIncluirCobertura] = useState(false)
    const [servicio, setServicio] = useState('SALUD')
    const [distanciaM, setDistanciaM] = useState('1000')
    const [incluirTeselado, setIncluirTeselado] = useState(false)
    const [ladoCeldaM, setLadoCeldaM] = useState('500')
    const [cargando, setCargando] = useState(false)
    const [localizando, setLocalizando] = useState(false)

    // Aviso en el formulario: usos marcados pero el radio supera el máximo permitido para ellos
    const radioUsosExcedido = incluirUsos && Number(radioKm) > RADIO_MAX_USOS_KM

    const hayZonas = capas.some(esDeZona)

    useEffect(() => {
        if (captura) {
            setLatitud(captura.lat.toFixed(6))
            setLongitud(captura.lng.toFixed(6))
        }
    }, [captura])

    useEffect(() => {
        onCargandoCambio?.(cargando)
    }, [cargando, onCargandoCambio])

    async function crearZona(latitudNumero, longitudNumero, radioNumero) {
        if (cargando) return

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
        onZonaCreada?.({ lat: latitudNumero, lng: longitudNumero, radioKm: radioNumero })

        setCargando(true)
        const centro = { lat: latitudNumero, lng: longitudNumero }

        // Mensaje de espera: las zonas grandes o con capas del POT pueden tardar unos segundos
        const puedeTardar = radioNumero >= 3 || incluirSuelo || incluirUsos
        const aviso = toast.loading(
            puedeTardar
                ? 'Consultando… las zonas grandes o con capas del POT pueden tardar unos segundos.'
                : 'Consultando equipamientos y lugares…'
        )

        try {
            const tareas = [
                capaDesdeZona(centro, radioNumero),
                capaLugaresDesdeZona(centro, radioNumero)
            ]
            if (incluirSuelo) tareas.push(capaSueloDesdeZona(centro, radioNumero))
            // Si el radio supera el máximo de los usos, capaUsosDesdeZona avisa y devuelve null
            if (incluirUsos) tareas.push(capaUsosDesdeZona(centro, radioNumero))
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
            // que usan las estadísticas (sin suelo, usos, cobertura ni teselado),
            // así los números siempre coinciden.
            const capasParaConteo = nuevasCapas.filter(
                c => c.tipo !== 'suelo' && c.tipo !== 'usos' && c.tipo !== 'cobertura' && c.tipo !== 'teselado'
            )
            const { total, equipamientos, lugares } = contarPorCategoriaEnZona(nuevaZona, capasParaConteo)

            if (total > 0) {
                toast.success(mensajeResumen({ total, equipamientos, lugares, incompleto: huboFallos }))
            }
        } finally {
            toast.dismiss(aviso)
            setCargando(false)
        }
    }

    function manejarCrearZona(evento) {
        evento.preventDefault()
        return crearZona(Number(latitud), Number(longitud), Number(radioKm))
    }

    // Se actualiza en cada render para que "analizarEn" siempre vea las casillas actuales
    useImperativeHandle(refExterno, () => ({
        analizarEn: ({ lat, lng, radioKm: radio }) => {
            const latRedondeada = Number(Number(lat).toFixed(6))
            const lngRedondeada = Number(Number(lng).toFixed(6))
            setLatitud(String(latRedondeada))
            setLongitud(String(lngRedondeada))
            setRadioKm(String(radio))
            return crearZona(latRedondeada, lngRedondeada, Number(radio))
        }
    }))

    function usarMiUbicacion() {
        if (!('geolocation' in navigator)) {
            toast.error('Tu navegador no permite obtener la ubicación.')
            return
        }

        setLocalizando(true)
        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                setLocalizando(false)
                const lat = posicion.coords.latitude
                const lng = posicion.coords.longitude

                if (municipiosEnZona({ lat, lng }, 0.1).length === 0) {
                    toast.info('Tu ubicación está fuera del Valle de Aburrá, donde GeoAburrá todavía no tiene datos.')
                    return
                }

                setLatitud(lat.toFixed(6))
                setLongitud(lng.toFixed(6))
                onIrA?.(lat, lng)
            },
            (error) => {
                setLocalizando(false)
                toast.error(mensajeUbicacion(error))
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        )
    }

    function limpiarZonas() {
        const quitadas = capas.filter(esDeZona)
        if (quitadas.length === 0) return

        setCapas(prev => prev.filter(c => !esDeZona(c)))
        toast('Zonas y resultados quitados del mapa', {
            duration: 8000,
            action: {
                label: 'Deshacer',
                onClick: () =>
                    setCapas(prev => [...prev, ...quitadas.filter(q => !prev.some(p => p.id === q.id))])
            }
        })
    }

    return (
        <div className="zona-selector">
            <div className="zona-selector__encabezado">
                <h4><MapPinned /> Mapear una zona</h4>
                <p>Haz clic en el mapa para elegir un centro, o escribe las coordenadas y el radio.</p>
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
                <button
                    type="button"
                    className="zona-selector__ubicacion"
                    onClick={usarMiUbicacion}
                    disabled={localizando || cargando}
                >
                    <LocateFixed size={16} aria-hidden="true" />
                    {localizando ? 'Buscando tu ubicación…' : 'Usar mi ubicación'}
                </button>

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

                <div className="zona-selector__radios" role="group" aria-label="Radios sugeridos">
                    {RADIOS_RAPIDOS.map(r => (
                        <button
                            key={r.valor}
                            type="button"
                            className={`zona-selector__radio ${Number(radioKm) === r.valor ? 'activo' : ''}`}
                            aria-pressed={Number(radioKm) === r.valor}
                            onClick={() => setRadioKm(String(r.valor))}
                        >
                            {r.etiqueta}
                        </button>
                    ))}
                </div>

                <label className="zona-selector__checkbox">
                    <input
                        type="checkbox"
                        checked={incluirSuelo}
                        onChange={evento => setIncluirSuelo(evento.target.checked)}
                    />
                    Incluir clasificación del suelo (POT)
                </label>

                <label className="zona-selector__checkbox">
                    <input
                        type="checkbox"
                        checked={incluirUsos}
                        onChange={evento => setIncluirUsos(evento.target.checked)}
                    />
                    Incluir usos del suelo oficiales (POT 48 de 2014, solo Medellín, radio máx. {RADIO_MAX_USOS_KM} km)
                </label>

                {radioUsosExcedido && (
                    <p className="zona-selector__aviso-usos">
                        Con este radio no se mostrarán los usos del suelo: baja el radio a{' '}
                        {RADIO_MAX_USOS_KM} km o menos. Lo demás (equipamientos, suelo, etc.) sí se creará.
                    </p>
                )}

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

            {hayZonas && (
                <button type="button" className="zona-selector__limpiar" onClick={limpiarZonas}>
                    <Trash2 size={15} aria-hidden="true" />
                    Limpiar zonas y resultados
                </button>
            )}
        </div>
    )
})

export default SeleccionarCapa