const AMVA_BASE = '/amva/server/rest/services'

const cache = new Map()

function conCache(clave, crear) {
  if (cache.has(clave)) return cache.get(clave)
  const promesa = crear().catch((error) => {
    cache.delete(clave)
    throw error
  })
  cache.set(clave, promesa)
  return promesa
}

const ESTADOS_REINTENTABLES = [429, 502, 503, 504]
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchConReintentos(url, intentos = 3) {
  let ultimoError = new Error('No se pudo conectar con el servidor')
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(url)
      if (res.ok || !ESTADOS_REINTENTABLES.includes(res.status)) return res
      ultimoError = new Error(`El servidor respondió ${res.status}`)
    } catch (error) {
      ultimoError = error
    }
    if (i < intentos - 1) await esperar(500 * 2 ** i)
  }
  throw ultimoError
}

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_')
}

function obtenerCatalogoServicios() {
  return conCache('catalogo', async () => {
    const res = await fetchConReintentos(`${AMVA_BASE}?f=json`)
    if (!res.ok) throw new Error(`No se pudo listar los servicios del AMVA: ${res.status}`)

    const data = await res.json()
    return data.services || []
  })
}

export async function buscarServiciosPorMunicipio(nombreMunicipio) {
  const catalogo = await obtenerCatalogoServicios()
  const clave = normalizar(nombreMunicipio)

  return catalogo.filter(
    (s) => s.type === 'MapServer' && normalizar(s.name).includes(clave)
  )
}

export function listarCapasDeServicio(nombreServicio) {
  return conCache(`capas:${nombreServicio}`, async () => {
    const res = await fetchConReintentos(`${AMVA_BASE}/${nombreServicio}/MapServer/layers?f=json`)
    if (!res.ok) throw new Error(`No se pudo listar las capas de ${nombreServicio}: ${res.status}`)

    const data = await res.json()

    return (data.layers || [])
      .filter((l) => l.type !== 'Group Layer')
      .map((l) => ({ id: l.id, nombre: l.name, tipo: l.type }))
  })
}

export async function listarCapasDisponiblesPorMunicipio(nombreMunicipio) {
  const servicios = await buscarServiciosPorMunicipio(nombreMunicipio)
  if (servicios.length === 0) {
    throw new Error(`No se encontró ningún servicio del AMVA para "${nombreMunicipio}".`)
  }

  const resultados = await Promise.all(
    servicios.map(async (s) => ({
      servicio: s.name,
      capas: await listarCapasDeServicio(s.name)
    }))
  )

  return resultados
}

function obtenerEpsgDeCapa(urlCapa) {
  return conCache(`epsg:${urlCapa}`, async () => {
    const res = await fetchConReintentos(`${urlCapa}?f=json`)
    if (!res.ok) return null
    const data = await res.json()
    return (
      data?.sourceSpatialReference?.wkid ||
      data?.extent?.spatialReference?.wkid ||
      null
    )
  })
}

export async function resolverCapaElegida(nombreServicio, idCapa) {
  const url = `${AMVA_BASE}/${nombreServicio}/MapServer/${idCapa}`
  const epsg = await obtenerEpsgDeCapa(url)
  return { url, servicio: nombreServicio, idCapa, epsg }
}

const TAMANO_PAGINA = 1000
const MAX_PAGINAS = 30

export async function fetchCapaArcGIS(urlBaseCapa) {
  const geojson = await conCache(`geojson:${urlBaseCapa}`, async () => {
    const urlSimple = `${urlBaseCapa}/query?where=1=1&outFields=*&returnGeometry=true&outSR=4326&f=geojson`
    const todas = []
    const vistos = new Set()

    for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
      const url = `${urlSimple}&resultOffset=${todas.length}&resultRecordCount=${TAMANO_PAGINA}`
      const res = await fetchConReintentos(url)
      if (!res.ok) throw new Error(`Error al consultar el servicio: ${res.status}`)

      const data = await res.json()

      if (data.error) {
        if (pagina === 0) {
          const resSimple = await fetchConReintentos(urlSimple)
          if (!resSimple.ok) throw new Error(`Error al consultar el servicio: ${resSimple.status}`)
          const dataSimple = await resSimple.json()
          if (dataSimple.error) {
            console.error('[AMVA] error de ArcGIS', { url: urlSimple, error: dataSimple.error })
            throw new Error(`${dataSimple.error.message || 'El servicio devolvió un error'} (capa: ${urlBaseCapa})`)
          }
          return dataSimple
        }
        break
      }

      const lote = data.features || []
      let nuevos = 0
      for (const f of lote) {
        const clave = f.id ?? JSON.stringify(f.properties)
        if (!vistos.has(clave)) {
          vistos.add(clave)
          todas.push(f)
          nuevos++
        }
      }

      const hayMas = data.exceededTransferLimit || data.properties?.exceededTransferLimit
      if (nuevos === 0 || (!hayMas && lote.length < TAMANO_PAGINA)) break
    }

    return { type: 'FeatureCollection', features: todas }
  })

  return structuredClone(geojson)
}

export async function resolverCapaPorMunicipio(nombreMunicipio, nombreCapaBuscada = 'Equipamientos Urbanos') {
  const resultados = await listarCapasDisponiblesPorMunicipio(nombreMunicipio)
  const clave = normalizar(nombreCapaBuscada)

  for (const { servicio, capas } of resultados) {
    const capa = capas.find((c) => normalizar(c.nombre).includes(clave) || clave.includes(normalizar(c.nombre)))
    if (capa) {
      return resolverCapaElegida(servicio, capa.id)
    }
  }

  throw new Error(`No se encontró una capa parecida a "${nombreCapaBuscada}" para "${nombreMunicipio}".`)
}