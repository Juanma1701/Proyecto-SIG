import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import '../styles/Mapa.css'
import '../styles/PopupSuelo.css'
import '../styles/PopupCapas.css'
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
import { geometriaEquipamiento } from '../utils/cercania'
import { consultarSueloEnPunto, consultarSueloEnCelda } from '../utils/consultasSuelo'
import { consultarUsoEnPunto } from '../utils/consultasUsos'
import {
  htmlCargandoSuelo,
  htmlErrorSuelo,
  htmlCeldaTeselado
} from '../utils/popupsSuelo'
import { htmlPopupCapas } from '../utils/popupCapas'


import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

// Valor por defecto estable (si fuera un [] nuevo en cada render, los efectos se repetirían)
const SIN_OCULTAS = []

// Une el mapa de estilos de equipamientos AMVA con el de lugares (Overpass),
// para poder pintar cualquier feature sin importar de qué capa venga.
function estiloUnificado(categoria) {
  if (CATEGORIAS_LUGARES[categoria]) return estiloCategoriaLugar(categoria)
  return estiloCategoria(categoria)
}

// ¿Dos capas de análisis pertenecen a la misma zona?
function mismaZona(a, b) {
  if (a.zonaId && b.zonaId) return a.zonaId === b.zonaId
  return Boolean(
    a.zonaCentro &&
    b.zonaCentro &&
    Math.abs(a.zonaCentro.lat - b.zonaCentro.lat) < 1e-6 &&
    Math.abs(a.zonaCentro.lng - b.zonaCentro.lng) < 1e-6 &&
    a.zonaRadioKm === b.zonaRadioKm
  )
}

// Convierte una consulta en { ok, datos } o { ok:false, mensaje } para que un fallo no tumbe al resto
function resultadoConsulta(promesa) {
  return promesa
    .then((datos) => ({ ok: true, datos }))
    .catch((error) => ({ ok: false, mensaje: error.message }))
}

// Muestra u oculta los polígonos de una capa (suelo o usos) por categoría, quitándolos o
// poniéndolos dentro de su propio grupo. No se reconstruye la capa ni se toca ninguna otra.
// `claveLista` es el nombre bajo el que el grupo guarda su lista de polígonos
// ('poligonosSuelo' o 'poligonosUsos'), así cada filtro solo afecta a su propia capa.
function aplicarOcultasPoligonos(mapa, grupo, ocultas, claveLista) {
  if (!grupo[claveLista]) grupo[claveLista] = grupo.getLayers()
  const lista = grupo[claveLista]

  lista.forEach((poligono) => {
    const oculto = ocultas.has(poligono.feature?.properties?.categoria)
    const presente = grupo.hasLayer(poligono)
    if (oculto && presente) grupo.removeLayer(poligono)
    else if (!oculto && !presente) grupo.addLayer(poligono)
  })

  // Las categorías se dibujan en un orden fijo: se reordenan al volver a mostrarlas
  lista.forEach((poligono) => {
    if (mapa.hasLayer(poligono)) poligono.bringToFront()
  })
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

function obtenerEtiquetaFeature(feature, tipoLimite) {
  const properties = feature?.properties || {}
  const camposPorTipo = {
    vereda: ['NOM_VEREDA', 'NOMBRE_BARRIO', 'NOMBRE', 'NMG', 'VEREDA'],
    barrio: ['NOM_BARRIO', 'NOMBRE_BARRIO', 'NOMBARRIO', 'NMG', 'NOMBRE', 'name', 'BARRIO'],
    comuna: ['NOMBRE_COMUNA', 'NOMBRE', 'NMG', 'name'],
    corregimiento: ['NOM_CORREG', 'NOMBRE', 'NMG', 'name', 'CORREGIMIE'],
  }
  const camposNombre = camposPorTipo[tipoLimite] || [
    'NOMBRE',
    'NMG',
    'name',
    'NOMBRE_EQUIP',
    'NOMBRE_SITIO',
  ]

  for (const campo of camposNombre) {
    const clave = Object.keys(properties).find(
      (propiedad) => propiedad.toUpperCase() === campo.toUpperCase()
    )
    const valor = clave ? String(properties[clave]).trim() : ''
    if (valor && !/^\d+$/.test(valor)) return valor
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

// Espera a que el mapa termine de cargar los cuadros (tiles) tras mover la vista
function esperarTiles(capaTiles) {
  return new Promise((resolve) => {
    if (!capaTiles) {
      setTimeout(resolve, 600)
      return
    }
    let terminado = false
    const terminar = () => {
      if (terminado) return
      terminado = true
      clearTimeout(limite)
      capaTiles.off('load', terminar)
      setTimeout(resolve, 300)
    }
    const limite = setTimeout(terminar, 4000)
    capaTiles.on('load', terminar)
  })
}

const Mapa = forwardRef(function Mapa(
  {
    capas,
    onMapReady,
    onClickMapa,
    resaltados,
    sueloOcultas = SIN_OCULTAS,
    usosOcultas = SIN_OCULTAS
  },
  refExterno
) {
  const mapRef = useRef(null)
  const contenedorRef = useRef(null)
  const capasLeafletRef = useRef({})
  const marcadorRef = useRef(null)
  const onClickMapaRef = useRef(onClickMapa)
  const onMapReadyRef = useRef(onMapReady)
  const enriquecimientoRef = useRef({})
  const ajustesVistaRef = useRef(new Set())
  const resaltadosLayerRef = useRef(null)
  const tileLayerRef = useRef(null)
  const sueloOcultasRef = useRef(new Set(sueloOcultas))
  const usosOcultasRef = useRef(new Set(usosOcultas))
  const turnoPopupRef = useRef(0)

  const poligonoClicRef = useRef(null)
  const idPoligonoRef = useRef(null)

  function quitarPoligonoClic() {
    if (poligonoClicRef.current && mapRef.current) {
      mapRef.current.removeLayer(poligonoClicRef.current)
    }
    poligonoClicRef.current = null
  }

  // Abre un popup en el punto del clic, con "Consultando…", y lo completa cuando llegan los datos.
  // closeOnClick:false para que el clic siga moviendo el punto central del mapa sin cerrarlo.
  async function abrirPopupConsulta(latlng, cargar, armarHTML) {
    const mapa = mapRef.current
    if (!mapa) return

    const turno = ++turnoPopupRef.current
    const popup = L.popup({ maxWidth: 320, maxHeight: 380, closeOnClick: false })
      .setLatLng(latlng)
      .setContent(htmlCargandoSuelo())
      .openOn(mapa)

    try {
      const datos = await cargar()
      if (turnoPopupRef.current !== turno) return // ya hicieron otro clic
      popup.setContent(armarHTML(datos))
    } catch (error) {
      if (turnoPopupRef.current !== turno) return
      popup.setContent(htmlErrorSuelo(error.message))
    }
  }

  // Popup unificado: al hacer clic sobre el suelo o sobre los usos, junta en un solo popup
  // todas las capas de suelo y de usos que estén visibles en la MISMA zona.
  function abrirPopupCapas(latlng, capaClic, todasCapas) {
    const buscar = (tipo) =>
      capaClic.tipo === tipo
        ? capaClic
        : [...todasCapas].reverse().find((c) => c.tipo === tipo && c.visible && mismaZona(c, capaClic)) || null

    const capaSuelo = buscar('suelo')
    const capaUsos = buscar('usos')
    const punto = { lat: latlng.lat, lng: latlng.lng }

    abrirPopupConsulta(
      latlng,
      async () => {
        const [usos, suelo] = await Promise.all([
          capaUsos ? resultadoConsulta(consultarUsoEnPunto(punto)) : null,
          capaSuelo
            ? resultadoConsulta(
                consultarSueloEnPunto(punto, { centro: capaSuelo.zonaCentro, radioKm: capaSuelo.zonaRadioKm })
              )
            : null
        ])
        return { usos, suelo }
      },
      htmlPopupCapas
    )
  }

  useImperativeHandle(refExterno, () => ({
    getContenedor: () => contenedorRef.current,

    prepararCaptura: async (zona) => {
      const mapa = mapRef.current
      if (!mapa) return null

      const estado = {
        centro: mapa.getCenter(),
        zoom: mapa.getZoom(),
        temporales: [],
        controles: []
      }

      mapa.getContainer().querySelectorAll('.leaflet-control-zoom').forEach((el) => {
        estado.controles.push({ el, display: el.style.display })
        el.style.display = 'none'
      })

      Object.values(capasLeafletRef.current).forEach((capaLeaflet) => {
        if (capaLeaflet instanceof L.MarkerClusterGroup && mapa.hasLayer(capaLeaflet)) {
          const marcadores = capaLeaflet.getLayers()
          mapa.removeLayer(capaLeaflet)
          const grupoPlano = L.layerGroup(marcadores).addTo(mapa)
          estado.temporales.push({ original: capaLeaflet, temporal: grupoPlano })
        }
      })

      let vistaCambio = false
      if (zona?.centro && zona?.radioKm) {
        const antes = mapa.getBounds()
        const limites = L.latLng(zona.centro.lat, zona.centro.lng).toBounds(zona.radioKm * 2000)
        mapa.fitBounds(limites, { padding: [24, 24], animate: false })
        vistaCambio = !antes.equals(mapa.getBounds(), 1e-6)
      }

      if (vistaCambio) {
        await esperarTiles(tileLayerRef.current)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400))
      }

      return estado
    },

    restaurarCaptura: (estado) => {
      const mapa = mapRef.current
      if (!mapa || !estado) return

      estado.temporales.forEach(({ original, temporal }) => {
        mapa.removeLayer(temporal)
        original.addTo(mapa)
      })

      estado.controles.forEach(({ el, display }) => {
        el.style.display = display
      })

      mapa.setView(estado.centro, estado.zoom, { animate: false })
    }
  }), [])

  useEffect(() => {
    onClickMapaRef.current = onClickMapa
    onMapReadyRef.current = onMapReady
  }, [onClickMapa, onMapReady])

  // Mantienen al día los filtros del suelo y de los usos para las capas que se creen de ahora en adelante.
  // Van ANTES del efecto de capas a propósito: los efectos corren en el orden en que están escritos.
  useEffect(() => {
    sueloOcultasRef.current = new Set(sueloOcultas)
  }, [sueloOcultas])

  useEffect(() => {
    usosOcultasRef.current = new Set(usosOcultas)
  }, [usosOcultas])

  useEffect(() => {
    if (mapRef.current) return

    const mapa = L.map(contenedorRef.current).setView([6.25, -75.56], 12) // Medellín

    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

    // Etiquetas de límites (barrios, veredas...): se muestran solo desde cierto zoom
    mapa.on('zoomend', () => {
      Object.values(capasLeafletRef.current).forEach((capaLeaflet) => {
        const zoomEtiquetas = capaLeaflet.zoomEtiquetasLimites
        if (zoomEtiquetas === undefined) return

        const mostrarEtiquetas = mapa.getZoom() >= zoomEtiquetas && mapa.hasLayer(capaLeaflet)
        capaLeaflet.eachLayer((featureLayer) => {
          if (!featureLayer.getTooltip()) return
          if (mostrarEtiquetas) featureLayer.openTooltip()
          else featureLayer.closeTooltip()
        })
      })
    })

    mapRef.current = mapa
    onMapReadyRef.current && onMapReadyRef.current(mapa)

    return () => {
      mapa.remove()
      mapRef.current = null
      marcadorRef.current = null
      poligonoClicRef.current = null
      idPoligonoRef.current = null
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
        ajustesVistaRef.current.delete(id)
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
          dashArray: '8 8',
          interactive: false
        }).addTo(mapa)

        capasLeafletRef.current[capa.id] = layer

        if (capa.visible) {
          if (!mapa.hasLayer(layer)) mapa.addLayer(layer)
        } else if (mapa.hasLayer(layer)) {
          mapa.removeLayer(layer)
        }
        return
      }

      // Límites administrativos (barrios, veredas, comunas, corregimientos)
      if (capa.tipo === 'limites') {
        const existing = capasLeafletRef.current[capa.id]
        if (existing) {
          mapa.removeLayer(existing)
          delete capasLeafletRef.current[capa.id]
        }

        const nombreCapa = capa.nombre.toLowerCase()
        let tipoLimite = 'otros'
        if (/vereda/.test(nombreCapa)) tipoLimite = 'vereda'
        else if (/barrio/.test(nombreCapa)) tipoLimite = 'barrio'
        else if (/comuna/.test(nombreCapa)) tipoLimite = 'comuna'
        else if (/corregimiento/.test(nombreCapa)) tipoLimite = 'corregimiento'
        const zoomEtiquetas = /barrio/i.test(capa.nombre) ? 14 : tipoLimite === 'vereda' ? 12 : 11
        const layer = L.geoJSON(capa.geojson, {
          style: {
            color: '#0f766e',
            weight: 2,
            opacity: 0.95,
            fillColor: '#3ecf8e',
            fillOpacity: 0.035,
          },
          onEachFeature: (feature, featureLayer) => {
            const nombre = obtenerEtiquetaFeature(feature, tipoLimite)
            if (!nombre) return

            featureLayer.bindTooltip(nombre, {
              direction: 'center',
              className: 'mapa-etiqueta-limite',
              opacity: 1,
            })
            featureLayer.bindPopup(`<strong>${escaparHTML(nombre)}</strong>`)
            featureLayer.on('mouseover', () => {
              featureLayer.setStyle({ weight: 3, fillOpacity: 0.12 })
              featureLayer.bringToFront()
            })
            featureLayer.on('mouseout', () => layer.resetStyle(featureLayer))
          },
        })
        layer.zoomEtiquetasLimites = zoomEtiquetas
        capasLeafletRef.current[capa.id] = layer

        if (capa.visible) {
          layer.addTo(mapa)
          if (!ajustesVistaRef.current.has(capa.id)) {
            const bounds = layer.getBounds()
            if (bounds.isValid()) {
              mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
              ajustesVistaRef.current.add(capa.id)
            }
          }
          if (mapa.getZoom() >= zoomEtiquetas) {
            layer.eachLayer((featureLayer) => {
              if (featureLayer.getTooltip()) featureLayer.openTooltip()
            })
          }
        }
        return
      }

      if (capa.tipo === 'cobertura') {
        const existing = capasLeafletRef.current[capa.id]
        if (existing) {
          mapa.removeLayer(existing)
          delete capasLeafletRef.current[capa.id]
        }

        const layer = L.geoJSON(capa.geojson, {
          style: {
            color: '#b91c1c',
            weight: 1.5,
            dashArray: '4 4',
            fillColor: '#ef4444',
            fillOpacity: 0.3
          },
          onEachFeature: (feature, capaLeaflet) => {
            capaLeaflet.bindTooltip(feature.properties?.categoriaEtiqueta || 'Sin cobertura', { sticky: true })
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

      if (capa.tipo === 'suelo') {
        const existing = capasLeafletRef.current[capa.id]
        if (existing) {
          mapa.removeLayer(existing)
          delete capasLeafletRef.current[capa.id]
        }

        // Panel propio, por debajo del teselado (350): así las celdas del teselado
        // siguen recibiendo el mouse y los clics aunque el suelo esté visible
        if (!mapa.getPane('suelo')) {
          mapa.createPane('suelo')
          mapa.getPane('suelo').style.zIndex = 300
        }

        const layer = L.geoJSON(capa.geojson, {
          pane: 'suelo',
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

            // Funcionalidad F: clic sobre el suelo -> clasificación del suelo en ese punto
            // (y, si los usos oficiales de la misma zona están visibles, también el uso)
            capaLeaflet.on('click', (evento) => {
              abrirPopupCapas(evento.latlng, capa, capas)
            })
          }
        })

        // Aplica el filtro de categorías del suelo (panel "Clasificación del suelo")
        aplicarOcultasPoligonos(mapa, layer, sueloOcultasRef.current, 'poligonosSuelo')

        capasLeafletRef.current[capa.id] = layer

        if (capa.visible) {
          if (!mapa.hasLayer(layer)) layer.addTo(mapa)
        } else if (mapa.hasLayer(layer)) {
          mapa.removeLayer(layer)
        }
        return
      }

      // Usos del suelo OFICIALES (POT 48 de 2014, solo suelo urbano de Medellín)
      if (capa.tipo === 'usos') {
        const existing = capasLeafletRef.current[capa.id]
        if (existing) {
          mapa.removeLayer(existing)
          delete capasLeafletRef.current[capa.id]
        }

        // Panel propio por debajo del suelo (300): los usos quedan al fondo y el resto
        // de capas siguen recibiendo el mouse y los clics
        if (!mapa.getPane('usos')) {
          mapa.createPane('usos')
          mapa.getPane('usos').style.zIndex = 250
        }

        const layer = L.geoJSON(capa.geojson, {
          pane: 'usos',
          style: (feature) => ({
            color: feature.properties?.categoriaColor || '#94a3b8',
            weight: 0.6,
            opacity: 0.6,
            fillColor: feature.properties?.categoriaColor || '#94a3b8',
            fillOpacity: 0.25
          }),
          onEachFeature: (feature, capaLeaflet) => {
            const etiqueta = feature.properties?.categoriaEtiqueta || 'Uso del suelo'
            capaLeaflet.bindTooltip(escaparHTML(etiqueta), { sticky: true })

            // Clic sobre un uso -> uso oficial en ese punto
            // (y, si la clasificación del suelo de la misma zona está visible, también esa)
            capaLeaflet.on('click', (evento) => {
              abrirPopupCapas(evento.latlng, capa, capas)
            })
          }
        })

        // Aplica el filtro de categorías de los usos (panel "Usos del suelo")
        aplicarOcultasPoligonos(mapa, layer, usosOcultasRef.current, 'poligonosUsos')

        capasLeafletRef.current[capa.id] = layer

        if (capa.visible) {
          if (!mapa.hasLayer(layer)) layer.addTo(mapa)
        } else if (mapa.hasLayer(layer)) {
          mapa.removeLayer(layer)
        }
        return
      }

      if (capa.tipo === 'teselado') {
        const existing = capasLeafletRef.current[capa.id]
        if (existing) {
          mapa.removeLayer(existing)
          delete capasLeafletRef.current[capa.id]
        }

        // Panel propio por debajo de los puntos, para que los hexágonos no tapen los clics
        if (!mapa.getPane('teselado')) {
          mapa.createPane('teselado')
          mapa.getPane('teselado').style.zIndex = 350
        }

        const layer = L.geoJSON(capa.geojson, {
          pane: 'teselado',
          style: (feature) => ({
            color: '#ffffff',
            weight: 1,
            opacity: 0.8,
            fillColor: feature.properties?.categoriaColor || '#6baed6',
            fillOpacity: 0.6
          }),
          onEachFeature: (feature, capaLeaflet) => {
            capaLeaflet.bindTooltip(feature.properties?.categoriaEtiqueta || 'Celda', { sticky: true })

            // Funcionalidad D: clic sobre una celda -> suelo y actividades de esa celda
            capaLeaflet.on('click', (evento) => {
              const ladoM = capa.resumenTeselado?.ladoM
              const claveCelda = JSON.stringify(feature.geometry?.coordinates?.[0]?.[0] ?? evento.latlng)
              abrirPopupConsulta(
                evento.latlng,
                () => consultarSueloEnCelda({
                  zonaCentro: capa.zonaCentro,
                  radioKm: capa.zonaRadioKm,
                  ladoM,
                  punto: { lat: evento.latlng.lat, lng: evento.latlng.lng },
                  claveCelda
                }),
                (datos) => htmlCeldaTeselado(datos, ladoM)
              )
            })
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

      const anterior = capasLeafletRef.current[capa.id]
      if (anterior) {
        mapa.removeLayer(anterior)
        delete capasLeafletRef.current[capa.id]
      }

      const hiddenCategories = new Set(capa.hiddenCategories || [])
      const features = (capa.geojson?.features || []).filter((feature) => {
        const cat = obtenerCategoria(feature)
        return !hiddenCategories.has(cat)
      })

      const markers = L.markerClusterGroup({
        maxClusterRadius: 30,
        disableClusteringAtZoom: 17,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false
      })

      const listaMarcadores = []

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
        marcador.bindTooltip(escaparHTML(nombreTooltip || etiqueta), {
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

        const esUUID = typeof feature.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(feature.id)
        if (esCapaAMVA && esUUID && feature.geometry?.type === 'Point') {
          marcador.on('popupopen', async () => {
            const miId = feature.id
            idPoligonoRef.current = miId
            try {
              const f = await geometriaEquipamiento(miId)
              if (idPoligonoRef.current !== miId) return // ya cerraron o abrieron otro
              const tipo = f?.geometry?.type
              if (tipo !== 'Polygon' && tipo !== 'MultiPolygon') return
              quitarPoligonoClic()
              poligonoClicRef.current = L.geoJSON(f, {
                style: { color: '#2563eb', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.2 },
                interactive: false
              }).addTo(mapRef.current)
            } catch (error) {
              console.warn('[Mapa] no se pudo traer el polígono', error)
            }
          })

          marcador.on('popupclose', () => {
            if (idPoligonoRef.current === feature.id) {
              idPoligonoRef.current = null
              quitarPoligonoClic()
            }
          })
        }

        listaMarcadores.push(marcador)
      })

      markers.addLayers(listaMarcadores)
      capasLeafletRef.current[capa.id] = markers

      if (capa.visible) {
        markers.addTo(mapa)
      }
    })
  }, [capas])

  // Filtro del suelo: solo toca las capas de suelo (no reconstruye nada más)
  useEffect(() => {
    const mapa = mapRef.current
    if (!mapa) return

    const ocultas = new Set(sueloOcultas)
    Object.values(capasLeafletRef.current).forEach((capaLeaflet) => {
      if (capaLeaflet.poligonosSuelo) {
        aplicarOcultasPoligonos(mapa, capaLeaflet, ocultas, 'poligonosSuelo')
      }
    })
  }, [sueloOcultas])

  // Filtro de los usos oficiales: solo toca las capas de usos (no reconstruye nada más)
  useEffect(() => {
    const mapa = mapRef.current
    if (!mapa) return

    const ocultas = new Set(usosOcultas)
    Object.values(capasLeafletRef.current).forEach((capaLeaflet) => {
      if (capaLeaflet.poligonosUsos) {
        aplicarOcultasPoligonos(mapa, capaLeaflet, ocultas, 'poligonosUsos')
      }
    })
  }, [usosOcultas])

  useEffect(() => {
    const mapa = mapRef.current
    if (!mapa) return

    if (resaltadosLayerRef.current) {
      mapa.removeLayer(resaltadosLayerRef.current)
      resaltadosLayerRef.current = null
    }

    if (!resaltados || !resaltados.items || resaltados.items.length === 0) return

    const grupo = L.layerGroup()
    const puntos = []

    if (resaltados.centro) {
      const { lat, lng } = resaltados.centro
      L.circleMarker([lat, lng], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: '#facc15',
        fillOpacity: 0.95
      })
        .bindTooltip('Punto de búsqueda')
        .addTo(grupo)
      puntos.push([lat, lng])
    }

    resaltados.items.forEach((item, i) => {
      const textoDistancia = Math.round(item.distancia_m) === 0 ? 'dentro' : `${Math.round(item.distancia_m)} m`
      const tooltip = `${i + 1}. ${escaparHTML(item.nombre)} · ${textoDistancia}`

      if (item.geojson) {
        L.geoJSON(item.geojson, {
          style: {
            color: '#facc15',
            weight: 3,
            opacity: 0.95,
            fillColor: '#facc15',
            fillOpacity: 0.15
          }
        })
          .bindTooltip(tooltip, { sticky: true })
          .addTo(grupo)
      }

      L.circleMarker([item.lat, item.lng], {
        radius: 13,
        color: '#facc15',
        weight: 3,
        fillColor: '#facc15',
        fillOpacity: 0.2
      })
        .bindTooltip(tooltip, { direction: 'top' })
        .addTo(grupo)

      puntos.push([item.lat, item.lng])
    })

    grupo.addTo(mapa)
    resaltadosLayerRef.current = grupo

    if (puntos.length > 0) {
      mapa.fitBounds(L.latLngBounds(puntos), { padding: [60, 60], maxZoom: 17 })
    }
  }, [resaltados])

  return <div ref={contenedorRef} className="mapa-contenedor" />
})

export default Mapa