import { useEffect } from 'react'
import L from 'leaflet'

// Pin naranja del "lugar marcado" dentro del buffer y captura de su clic. No dibuja nada de interfaz.
// Mientras se elige, intercepta el clic ANTES de que lo vea Mapa.jsx: así el pin y las coordenadas del buffer no se mueven.

const ICONO = L.divIcon({
  className: 'predio-pin',
  html: '<span></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30]
})

// Los controles del mapa (zoom, escala) y los globos no cuentan como "elegir un lugar"
const IGNORADOS = '.leaflet-control, .leaflet-popup'

export default function MarcadorPredio({ mapa, eligiendo, predio, alElegir }) {
  useEffect(() => {
    if (!mapa || !eligiendo) return undefined
    const contenedor = mapa.getContainer()
    let inicio = null

    const alPresionar = (evento) => {
      inicio = { x: evento.clientX, y: evento.clientY }
    }
    const alHacerClic = (evento) => {
      if (evento.target instanceof Element && evento.target.closest(IGNORADOS)) return
      // Arrastrar el mapa no cuenta como clic
      if (inicio && Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > 5) return
      evento.stopPropagation()
      evento.stopImmediatePropagation()
      alElegir(mapa.mouseEventToLatLng(evento))
    }

    contenedor.addEventListener('pointerdown', alPresionar, true)
    contenedor.addEventListener('click', alHacerClic, true)
    contenedor.classList.add('mapa--eligiendo-predio')
    return () => {
      contenedor.removeEventListener('pointerdown', alPresionar, true)
      contenedor.removeEventListener('click', alHacerClic, true)
      contenedor.classList.remove('mapa--eligiendo-predio')
    }
  }, [mapa, eligiendo, alElegir])

  useEffect(() => {
    if (!mapa || !predio) return undefined
    const marcador = L.marker([predio.lat, predio.lng], {
      icon: ICONO,
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000
    }).addTo(mapa)
    return () => {
      marcador.remove()
    }
  }, [mapa, predio])

  return null
}