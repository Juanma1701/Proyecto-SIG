// Enlace compartible de una zona. Se guarda en el "hash" de la dirección:
//   https://.../#zona=6.25000,-75.56000,1
// El hash no se envía al servidor, así que no hace falta configurar nada en Vercel.
// Se conservan otros parámetros del hash por si otra parte de la app (por ejemplo, el
// inicio de sesión) también los usa.

const CLAVE = 'zona'

function parametros() {
  return new URLSearchParams(window.location.hash.replace(/^#/, ''))
}

function aTexto(params) {
  // Las comas se dejan sin codificar para que el enlace sea legible
  return params.toString().replace(/%2C/gi, ',')
}

function actualizarHash(params) {
  const resto = aTexto(params)
  const url = window.location.pathname + window.location.search + (resto ? `#${resto}` : '')
  // Se conserva el estado del historial para no confundir al router
  window.history.replaceState(window.history.state, '', url)
}

export function textoZona({ lat, lng, radioKm }) {
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)},${Number(radioKm)}`
}

// Lee la zona de la dirección. Devuelve { lat, lng, radioKm } o null si no hay una válida.
export function leerZonaDeEnlace() {
  try {
    const crudo = parametros().get(CLAVE)
    if (!crudo) return null

    const [lat, lng, radioKm] = crudo.split(',').map(Number)
    if (![lat, lng, radioKm].every(Number.isFinite)) return null
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    if (radioKm <= 0 || radioKm > 5) return null

    return { lat, lng, radioKm }
  } catch {
    return null
  }
}

export function escribirZonaEnEnlace(zona) {
  try {
    const params = parametros()
    params.set(CLAVE, textoZona(zona))
    actualizarHash(params)
  } catch {
    // sin acceso al historial: el enlace simplemente no se actualiza
  }
}

export function borrarZonaDeEnlace() {
  try {
    const params = parametros()
    if (!params.has(CLAVE)) return
    params.delete(CLAVE)
    actualizarHash(params)
  } catch {
    // ídem
  }
}

// Dirección completa para compartir
export function urlDeZona(zona) {
  return `${window.location.origin}${window.location.pathname}#${CLAVE}=${textoZona(zona)}`
}