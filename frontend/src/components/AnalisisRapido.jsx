import { useState } from 'react'
import { MapPin, Radius, SlidersHorizontal } from 'lucide-react'
import '../styles/AnalisisRapido.css'

const RADIOS = [
  { valor: 0.5, etiqueta: '500 m' },
  { valor: 1, etiqueta: '1 km' },
  { valor: 2, etiqueta: '2 km' },
  { valor: 3, etiqueta: '3 km' },
  { valor: 5, etiqueta: '5 km' }
]

// Distancia aproximada en km entre dos puntos (fórmula de Haversine)
function distanciaKm(a, b) {
  const R = 6371
  const rad = (grados) => (grados * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export default function AnalisisRapido({
  punto,
  zona,
  visible,
  oculta,
  ocupado,
  onAnalizar,
  onElegirCapas
}) {
  const [radioKm, setRadioKm] = useState(1)

  if (oculta) return null

  if (!punto) {
    if (zona) return null
    return (
      <div className="analisis-rapido analisis-rapido--pista" role="status">
        <MapPin size={18} aria-hidden="true" />
        <p>Haz clic en el mapa para elegir el centro de tu zona.</p>
      </div>
    )
  }

  if (!visible) return null

  const dentroDeZona =
    zona?.centro && distanciaKm(punto, zona.centro) <= Number(zona.radioKm)
  if (dentroDeZona) return null

  return (
    <section className="analisis-rapido" aria-label="Analizar una zona en este punto">
      <h3 className="analisis-rapido__titulo">Analizar esta zona</h3>
      <p className="analisis-rapido__punto">
        Centro: {punto.lat.toFixed(4)}, {punto.lng.toFixed(4)}
      </p>

      <div className="analisis-rapido__radios" role="group" aria-label="Radio de la zona">
        {RADIOS.map((r) => (
          <button
            key={r.valor}
            type="button"
            className={`analisis-rapido__radio ${radioKm === r.valor ? 'activo' : ''}`}
            aria-pressed={radioKm === r.valor}
            onClick={() => setRadioKm(r.valor)}
          >
            {r.etiqueta}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="analisis-rapido__analizar"
        disabled={ocupado}
        onClick={() => onAnalizar({ lat: punto.lat, lng: punto.lng, radioKm })}
      >
        <Radius size={16} aria-hidden="true" />
        {ocupado ? 'Consultando…' : 'Analizar aquí'}
      </button>

      <p className="analisis-rapido__nota">
        Incluye las capas marcadas en el panel de trabajo (suelo, usos, cobertura, teselado).
      </p>

      <button type="button" className="analisis-rapido__capas" onClick={onElegirCapas}>
        <SlidersHorizontal size={14} aria-hidden="true" />
        Elegir capas
      </button>
    </section>
  )
}