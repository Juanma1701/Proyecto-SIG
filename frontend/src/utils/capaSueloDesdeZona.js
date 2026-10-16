import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import { estiloCategoriaSuelo } from './categoriasSuelo'

const RADIO_MAX_KM = 5 
const VIGENCIA_CACHE_MS = 10 * 60 * 1000

const cache = new Map() 
const enVuelo = new Map() 

const ORDEN_CATEGORIAS = ['URBANO', 'EXPANSION_URBANA', 'RURAL', 'PROTECCION', 'RIESGO', 'PATRIMONIO']

function posicionOrden(categoria) {
  const i = ORDEN_CATEGORIAS.indexOf(categoria)
  return i === -1 ? ORDEN_CATEGORIAS.length : i
}

const clavePedido = (centro, radioKm) => `${centro.lat.toFixed(5)},${centro.lng.toFixed(5)},${radioKm}`

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function pedirSuelo(centro, radioKm) {
  const parametros = { p_lat: centro.lat, p_lng: centro.lng, p_radio_km: radioKm }
  let ultimoError

  for (let intento = 0; intento < 2; intento++) {
    const { data, error } = await supabase.rpc('suelo_en_zona', parametros)
    if (!error) return data
    ultimoError = error
    if (intento === 0) await esperar(800)
  }

  throw new Error(ultimoError?.message || 'No se pudo consultar el uso de suelo')
}

async function obtenerSuelo(centro, radioKm) {
  const clave = clavePedido(centro, radioKm)

  const guardado = cache.get(clave)
  if (guardado && guardado.hasta > Date.now()) return guardado.datos

  if (enVuelo.has(clave)) return enVuelo.get(clave)

  const promesa = pedirSuelo(centro, radioKm)
    .then((datos) => {
      cache.set(clave, { datos, hasta: Date.now() + VIGENCIA_CACHE_MS })
      return datos
    })
    .finally(() => enVuelo.delete(clave))

  enVuelo.set(clave, promesa)
  return promesa
}

export async function capaSueloDesdeZona(centro, radioKm) {
  const radio = Math.min(Number(radioKm), RADIO_MAX_KM)

  let datos
  try {
    datos = await obtenerSuelo(centro, radio)
  } catch (error) {
    toast.error('No se pudo consultar el uso de suelo: ' + error.message)
    return null
  }

  const crudas = datos?.features || []
  if (crudas.length === 0) {
    toast.error('No hay información de uso de suelo para esta zona (solo está cargado el Valle de Aburrá)')
    return null
  }

  const features = crudas
    .map((f) => {
      const p = f.properties || {}
      const categoria = String(p.categoria || '').toUpperCase()
      const estilo = estiloCategoriaSuelo(categoria)
      return {
        ...f,
        properties: {
          ...p,
          categoria,
          categoriaEtiqueta: `${estilo.etiqueta} · ${p.porcentaje_zona} % de la zona`,
          categoriaColor: estilo.color
        }
      }
    })
    .sort((a, b) => posicionOrden(a.properties.categoria) - posicionOrden(b.properties.categoria))

  const resumenSuelo = features.map((f) => {
    const p = f.properties
    const estilo = estiloCategoriaSuelo(p.categoria)
    return {
      categoria: p.categoria,
      etiqueta: estilo.etiqueta,
      color: estilo.color,
      areaKm2: p.area_km2,
      porcentaje: p.porcentaje_zona,
      poligonos: p.poligonos
    }
  })

  return {
    id: crypto.randomUUID(),
    nombre: `Uso del suelo (radio ${radioKm} km)`,
    archivoOriginal: null,
    tipo: 'suelo',
    geojson: { type: 'FeatureCollection', features },
    crs: { epsg: 4326, fuente: 'AMVA POT (cargado en Supabase)' },
    visible: true,
    guardadaEnNube: false,
    origenAPI: true,
    zonaCentro: { lat: centro.lat, lng: centro.lng },
    zonaRadioKm: Number(radioKm),
    zonaKm2: datos.zona_km2,
    resumenSuelo
  }
}