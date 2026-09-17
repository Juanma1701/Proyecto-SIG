import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import '../styles/Mapa.css'
import {
  obtenerCategoria,
  estiloCategoria,
  obtenerNombreEquipamiento,
  obtenerDireccionEquipamiento,
  obtenerTelefonoEquipamiento,
  obtenerWebsiteEquipamiento
} from '../utils/categoriasEquipamiento'
import { CATEGORIAS_LUGARES, estiloCategoriaLugar } from '../utils/categoriasLugares'
import { buscarWebsitePorNombre } from '../utils/fetchOverpass'

// Fix del ícono roto de Leaflet en el build de producción (Vite no resuelve
// las rutas relativas que Leaflet arma internamente para sus PNG por defecto)
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

// Une el mapa de estilos de equipamientos AMVA con el de lugares (Overpass),
// para poder pintar cualquier feature sin importar de qué capa venga.
function estiloUnificado(categoria) {
  if (CATEGORIAS_LUGARES[categoria]) return estiloCategoriaLugar(categoria)
  return estiloCategoria(categoria)
}

function obtenerCentroGeometria(geometry) {
  if (!geometry) return null

  if (geometry.type === 'Point') {
    return [geometry.coordinates[1], geometry.coordinates[0]]
  }

  if (geometry.type === 'MultiPoint') {
    const [lng, lat] = geometry.coordinates[0]
    return [lat, lng]
  }

  if (geometry.type === 'LineString') {
    const coords = geometry.coordinates
    const promedio = coords.reduce((acc, [lng, lat]) => {
      acc[0] += lat
      acc[1] += lng
      return acc
    }, [0, 0])
    return [promedio[0] / coords.length, promedio[1] / coords.length]
  }

  if (geometry.type === 'MultiLineString') {
    const coords = geometry.coordinates.flat()
    const promedio = coords.reduce((acc, [lng, lat]) => {
      acc[0] += lat
      acc[1] += lng
      return acc
    }, [0, 0])
    return [promedio[0] / coords.length, promedio[1] / coords.length]
  }

  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates.flat()
    const promedio = coords.reduce((acc, [lng, lat]) => {
      acc[0] += lat
      acc[1] += lng
      return acc
    }, [0, 0])
    return [promedio[0] / coords.length, promedio[1] / coords.length]
  }

  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates.flat(2)
    const promedio = coords.reduce((acc, [lng, lat]) => {
      acc[0] += lat
      acc[1] += lng
      return acc
    }, [0, 0])
    return [promedio[0] / coords.length, promedio[1] / coords.length]
  }

  return null
}

function escaparHTML(texto) {
  if (!texto) return ''
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function linkGoogleFallback(nombre, municipio) {
  const q = encodeURIComponent([nombre, municipio, 'Colombia'].filter(Boolean).join(' '))
  return `https://www.google.com/search?q=${q}`
}

// Arma el HTML del popup de un feature. `estado` es el resultado (o
// 'cargando' / null) de la búsqueda lazy por Overpass, solo aplica a
// equipamientos AMVA que no traían website propio.
function armarPopupHTML(feature, estado) {
  const nombre = obtenerNombreEquipamiento(feature) || feature?.properties?.NOMBRE
  const direccion = obtenerDireccionEquipamiento(feature)
  const telefono = obtenerTelefonoEquipamiento(feature)
  const websitePropio = obtenerWebsiteEquipamiento(feature)
  const municipio = feature?.properties?.municipio

  const titulo = escaparHTML(nombre || 'Sin nombre')
  let filas = ''

  if (direccion) filas += `<div class="mapa-popup__fila">📍 ${escaparHTML(direccion)}</div>`
  if (telefono) filas += `<div class="mapa-popup__fila">📞 ${escaparHTML(telefono)}</div>`

  let websiteHTML
  if (websitePropio) {
    websiteHTML = `<a href="${escaparHTML(websitePropio)}" target="_blank" rel="noopener noreferrer">Ver sitio web</a>`
  } else if (estado === 'cargando') {
    websiteHTML = `<span class="mapa-popup__cargando">Buscando sitio web…</span>`
  } else if (estado && estado.website) {
    websiteHTML = `<a href="${escaparHTML(estado.website)}" target="_blank" rel="noopener noreferrer">Ver sitio web</a>`
  } else {
    websiteHTML = `<a href="${linkGoogleFallback(nombre, municipio)}" target="_blank" rel="noopener noreferrer">Buscar en Google</a>`
  }

  return `
    <div class="mapa-popup">
      <div class="mapa-popup__titulo">${titulo}</div>
      ${filas}
      <div class="mapa-popup__fila mapa-popup__link">${websiteHTML}</div>
    </div>
  `
}

const Mapa = forwardRef(function Mapa({ capas, onMapReady, onClickMapa }, refExterno) {
  const mapRef = useRef(null)
  const contenedorRef = useRef(null)
  const capasLeafletRef = useRef({})
  const marcadorRef = useRef(null)
  const onClickMapaRef = useRef(onClickMapa)
  const onMapReadyRef = useRef(onMapReady)
  const enriquecimientoRef = useRef({}) // cache por feature.id: 'cargando' | { website }

  // Expone hacia afuera: el nodo DOM del contenedor (para capturarlo con
  // html2canvas), y dos funciones para desactivar/restaurar el clustering
  // justo antes/después de una captura — así la foto muestra cada punto
  // individual en su calle exacta, en vez de burbujas agrupadas con número.
  useImperativeHandle(refExterno, () => ({
    getContenedor: () => contenedorRef.current,
    prepararCaptura: () => {
      const mapa = mapRef.current
      if (!mapa) return []
      const temporales = []
      const marcadoresConTooltipAbierto = []

      Object.values(capasLeafletRef.current).forEach((capaLeaflet) => {
        if (capaLeaflet instanceof L.MarkerClusterGroup) {
          const marcadores = capaLeaflet.getLayers()
          mapa.removeLayer(capaLeaflet)
          const grupoPlano = L.layerGroup(marcadores).addTo(mapa)
          temporales.push({ original: capaLeaflet, temporal: grupoPlano })

          // Fuerza que el nombre (tooltip) quede visible en la foto,
          // no solo al pasar el mouse — si no, la imagen exportada
          // solo muestra puntos de colores sin decir qué son.
          marcadores.forEach((marcador) => {
            if (marcador.getTooltip && marcador.getTooltip()) {
              marcador.openTooltip()
              marcadoresConTooltipAbierto.push(marcador)
            }
          })
        }
      })

      return { temporales, marcadoresConTooltipAbierto }
    },
    restaurarCaptura: ({ temporales, marcadoresConTooltipAbierto }) => {
      const mapa = mapRef.current
      if (!mapa) return

      marcadoresConTooltipAbierto.forEach((marcador) => marcador.closeTooltip())

      temporales.forEach(({ original, temporal }) => {
        mapa.removeLayer(temporal)
        original.addTo(mapa)
      })
    }
  }), [])

  useEffect(() => {
    onClickMapaRef.current = onClickMapa
    onMapReadyRef.current = onMapReady
  }, [onClickMapa, onMapReady])

  useEffect(() => {
    if (mapRef.current) return

    const mapa = L.map(contenedorRef.current).setView([6.25, -75.56], 12) // Medellín

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapa)

    mapa.on('click', (e) => {
      onClickMapaRef.current && onClickMapaRef.current(e.latlng)

      if (marcadorRef.current) {
        marcadorRef.current.setLatLng(e.latlng)
      } else {
        marcadorRef.current = L.marker(e.latlng).addTo(mapa)
      }
    })

    mapRef.current = mapa
    onMapReadyRef.current && onMapReadyRef.current(mapa)

    return () => {
      mapa.remove()
      mapRef.current = null
      marcadorRef.current = null
    }
  }, [])

  useEffect(() => {
    const mapa = mapRef.current
    if (!mapa) return

    const idsActuales = new Set(capas.map(c => c.id))

    Object.keys(capasLeafletRef.current).forEach(id => {
      if (!idsActuales.has(id)) {
        mapa.removeLayer(capasLeafletRef.current[id])
        delete capasLeafletRef.current[id]
      }
    })

    capas.forEach(capa => {
      if (capa.esZonaVisual === true || capa.tipo === 'zona') {
        const existing = capasLeafletRef.current[capa.id]

        if (existing) {
          mapa.removeLayer(existing)
          delete capasLeafletRef.current[capa.id]
        }

        const layer = L.circle([capa.centro.lat, capa.centro.lng], {
          radius: capa.radioKm * 1000,
          color: capa.color || '#2563eb',
          weight: 2,
          fillColor: '#60a5fa',
          fillOpacity: 0.18,
          dashArray: '8 8'
        }).addTo(mapa)

        capasLeafletRef.current[capa.id] = layer

        if (capa.visible) {
          if (!mapa.hasLayer(layer)) mapa.addLayer(layer)
        } else if (mapa.hasLayer(layer)) {
          mapa.removeLayer(layer)
        }
        return
      }

      // Suelo/POT: son polígonos (áreas), no puntos — se dibujan con
      // L.geoJSON en vez de circleMarker, coloreados por categoría.
      if (capa.tipo === 'suelo') {
        const existing = capasLeafletRef.current[capa.id]
        if (existing) {
          mapa.removeLayer(existing)
          delete capasLeafletRef.current[capa.id]
        }

        const layer = L.geoJSON(capa.geojson, {
          style: (feature) => ({
            color: feature.properties?.categoriaColor || '#78716c',
            weight: 0.5,
            opacity: 0.5,
            fillColor: feature.properties?.categoriaColor || '#78716c',
            fillOpacity: 0.18
          }),
          onEachFeature: (feature, capaLeaflet) => {
            const etiqueta = feature.properties?.categoriaEtiqueta || 'Sin categoría'
            capaLeaflet.bindTooltip(etiqueta, { sticky: true })
          }
        })

        capasLeafletRef.current[capa.id] = layer

        if (capa.visible) {
          if (!mapa.hasLayer(layer)) layer.addTo(mapa)
        } else if (mapa.hasLayer(layer)) {
          mapa.removeLayer(layer)
        }
        return
      }

      if (capasLeafletRef.current[capa.id]) {
        capasLeafletRef.current[capa.id].clearLayers()
      }

      const hiddenCategories = new Set(capa.hiddenCategories || [])
      const features = (capa.geojson?.features || []).filter((feature) => {
        const cat = obtenerCategoria(feature)
        return !hiddenCategories.has(cat)
      })

      // Clustering: agrupa marcadores cercanos en burbujas con contador
      // cuando hay muchos puntos juntos, en vez de amontonarlos sin poder
      // distinguir nada. Se separan solos al hacer zoom.
      const markers = L.markerClusterGroup({
        maxClusterRadius: 30, // antes 50 — agrupa menos agresivo
        disableClusteringAtZoom: 17, // a partir de este zoom, siempre puntos sueltos
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false
      })

      features.forEach((feature) => {
        const centro = obtenerCentroGeometria(feature.geometry)
        if (!centro) return

        const cat = obtenerCategoria(feature)
        const { color, etiqueta } = estiloUnificado(cat)
        const marcador = L.circleMarker([centro[0], centro[1]], {
          radius: 6,
          color: '#ffffff',
          fillColor: color,
          fillOpacity: 0.95,
          weight: 1.2
        })

        const nombreTooltip = obtenerNombreEquipamiento(feature)
        marcador.bindTooltip(nombreTooltip || etiqueta, {
          direction: 'top',
          opacity: 0.9
        })

        const featureId = feature.id ?? `${centro[0]},${centro[1]}`
        marcador.bindPopup(
          armarPopupHTML(feature, enriquecimientoRef.current[featureId])
        )

        const esCapaAMVA = capa.origenAPI === true && capa.tipo !== 'lugares'
        const nombre = obtenerNombreEquipamiento(feature)
        const yaTieneWebsite = obtenerWebsiteEquipamiento(feature)

        if (esCapaAMVA && nombre && !yaTieneWebsite) {
          marcador.on('popupopen', async () => {
            if (enriquecimientoRef.current[featureId]) {
              marcador.setPopupContent(
                armarPopupHTML(feature, enriquecimientoRef.current[featureId])
              )
              return
            }

            enriquecimientoRef.current[featureId] = 'cargando'
            marcador.setPopupContent(
              armarPopupHTML(feature, 'cargando')
            )

            const website = await buscarWebsitePorNombre(nombre, centro[0], centro[1])
            enriquecimientoRef.current[featureId] = { website }
            marcador.setPopupContent(
              armarPopupHTML(feature, { website })
            )
          })
        }

        markers.addLayer(marcador)
      })

      markers.addTo(mapa)
      capasLeafletRef.current[capa.id] = markers

      const layer = capasLeafletRef.current[capa.id]
      if (capa.visible) {
        if (!mapa.hasLayer(layer)) mapa.addLayer(layer)
      } else {
        if (mapa.hasLayer(layer)) mapa.removeLayer(layer)
      }
    })
  }, [capas])

  return <div ref={contenedorRef} className="mapa-contenedor" />
})

export default Mapa