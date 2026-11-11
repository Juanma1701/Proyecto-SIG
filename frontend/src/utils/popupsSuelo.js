import { estiloCategoriaSuelo } from './categoriasSuelo'
import { estiloCategoria } from './categoriasEquipamiento'
import { CATEGORIAS_LUGARES, estiloCategoriaLugar } from './categoriasLugares'

// Campos técnicos de la fuente que no aportan al usuario
const ATRIBUTOS_TECNICOS = new Set([
  'SHAPE.LEN', 'SHAPE.AREA', 'SE_ANNO_CAD_DATA', 'OBJECTID', 'OBJECTID_1',
  'INPOLY_FID', 'LINETYPE', 'ELEVATION', 'COLOR'
])

const MAX_ATRIBUTOS = 14
const MAX_CATEGORIAS = 6

function escapar(texto) {
  if (texto === null || texto === undefined) return ''
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const numero = (valor, decimales = 1) =>
  Number.isFinite(Number(valor)) ? Number(valor).toFixed(decimales) : '—'

function estiloUnificado(categoria) {
  if (CATEGORIAS_LUGARES[categoria]) return estiloCategoriaLugar(categoria)
  return estiloCategoria(categoria)
}

function filasAtributos(atributos) {
  if (!atributos || typeof atributos !== 'object') return ''

  const filas = Object.entries(atributos)
    .filter(([clave, valor]) =>
      !ATRIBUTOS_TECNICOS.has(clave.toUpperCase()) &&
      valor !== null &&
      String(valor).trim() !== ''
    )
    .slice(0, MAX_ATRIBUTOS)

  if (filas.length === 0) return '<div class="popup-suelo__vacio">Sin atributos adicionales en la fuente.</div>'

  return (
    '<table class="popup-suelo__tabla">' +
    filas
      .map(([clave, valor]) => `<tr><th>${escapar(clave)}</th><td>${escapar(valor)}</td></tr>`)
      .join('') +
    '</table>'
  )
}

export function htmlCargandoSuelo() {
  return '<div class="popup-suelo"><span class="popup-suelo__vacio">Consultando…</span></div>'
}

export function htmlErrorSuelo(mensaje) {
  return `<div class="popup-suelo"><span class="popup-suelo__vacio">No se pudo consultar: ${escapar(mensaje)}</span></div>`
}

// Popup al hacer clic sobre el suelo (Funcionalidad F)
export function htmlSueloEnPunto(datos) {
  const poligonos = datos?.poligonos || []
  if (poligonos.length === 0) {
    return '<div class="popup-suelo"><span class="popup-suelo__vacio">No hay clasificación del suelo cargada en este punto.</span></div>'
  }

  const punto = datos.punto || {}
  const relacion = punto.dentro_zona ? 'dentro de la zona' : 'fuera de la zona'

  const tarjetas = poligonos
    .map((p) => {
      const estilo = estiloCategoriaSuelo(String(p.categoria).toUpperCase())
      const total = Number(p.area_total_km2)
      const enZona = Number(p.area_en_zona_km2)
      const porcentaje = total > 0 ? (enZona / total) * 100 : null

      return `
        <div class="popup-suelo__poligono">
          <div class="popup-suelo__cabecera">
            <span class="popup-suelo__muestra" style="background:${estilo.color}"></span>
            <strong>${escapar(estilo.etiqueta)}</strong>
          </div>
          <div class="popup-suelo__seccion">Atributos originales de la fuente</div>
          <div class="popup-suelo__fila"><b>Nombre:</b> ${escapar(p.nombre) || '(sin nombre)'}</div>
          <div class="popup-suelo__fila"><b>Capa de origen:</b> ${escapar(p.capa_origen) || '—'}</div>
          <div class="popup-suelo__fila"><b>Municipio:</b> ${escapar(p.municipio) || '—'}</div>
          ${filasAtributos(p.atributos)}
          <div class="popup-suelo__seccion">Calculado por la aplicación</div>
          <div class="popup-suelo__fila">Área completa del polígono: <b>${numero(total, 3)} km²</b></div>
          <div class="popup-suelo__fila">Parte dentro de la zona: <b>${numero(enZona, 3)} km²</b>${porcentaje === null ? '' : ` (${numero(porcentaje)} % del polígono)`}</div>
        </div>`
    })
    .join('')

  return `
    <div class="popup-suelo">
      <div class="popup-suelo__titulo">Clasificación del suelo (POT) en este punto</div>
      <div class="popup-suelo__fila">Punto a <b>${numero(punto.distancia_centro_m, 0)} m</b> del centro · ${relacion}</div>
      ${tarjetas}
      <div class="popup-suelo__nota">Pueden aparecer varios polígonos porque las clases se superponen (por ejemplo, protección sobre suelo urbano).</div>
    </div>`
}

function listaCategorias(grupo) {
  const items = grupo?.por_categoria || []
  if (items.length === 0) return ''

  const visibles = items.slice(0, MAX_CATEGORIAS)
  const resto = items.length - visibles.length

  return (
    '<ul class="popup-suelo__lista">' +
    visibles
      .map((i) => `<li>${escapar(estiloUnificado(i.categoria)?.etiqueta || i.categoria)}: <b>${i.cantidad}</b></li>`)
      .join('') +
    (resto > 0 ? `<li>y ${resto} categorías más</li>` : '') +
    '</ul>'
  )
}

// Popup al hacer clic sobre una celda del teselado (Funcionalidad D)
export function htmlCeldaTeselado(datos, ladoM) {
  if (!datos) {
    return '<div class="popup-suelo"><span class="popup-suelo__vacio">No se encontró la celda en esta zona.</span></div>'
  }

  const clases = (datos.clases || [])
    .map((c) => {
      const estilo = estiloCategoriaSuelo(String(c.categoria).toUpperCase())
      const ancho = Math.max(0, Math.min(100, Number(c.porcentaje_celda) || 0))
      return `
        <div class="popup-suelo__fila popup-suelo__fila--barra">
          <span>${escapar(estilo.etiqueta)}</span><b>${numero(c.porcentaje_celda)} %</b>
        </div>
        <div class="popup-suelo__pista"><div class="popup-suelo__relleno" style="width:${ancho}%;background:${estilo.color}"></div></div>
        <div class="popup-suelo__detalle">${numero(c.area_km2, 3)} km² · ${c.poligonos} polígonos de origen</div>`
    })
    .join('')

  const base = datos.base || {}
  const textoBase =
    base.predominante === 'urbano' ? 'Urbano' : base.predominante === 'rural' ? 'Rural' : 'sin datos'

  const equip = datos.equipamientos || {}
  const lugares = datos.lugares || {}
  const nEquip = (equip.por_categoria || []).length
  const nLugares = (lugares.por_categoria || []).length

  return `
    <div class="popup-suelo">
      <div class="popup-suelo__titulo">Celda del teselado${ladoM ? ` (hexágono de ${escapar(ladoM)} m)` : ''}</div>

      <div class="popup-suelo__seccion">Calculado por la aplicación</div>
      <div class="popup-suelo__fila">Área de la celda: <b>${numero(datos.celda_km2, 3)} km²</b></div>
      <div class="popup-suelo__fila">Dentro de la zona: <b>${numero(datos.dentro_zona_km2, 3)} km²</b> (${numero(datos.dentro_zona_pct)} % de la celda)</div>
      <div class="popup-suelo__fila">Centro de la celda a <b>${numero(datos.distancia_centro_m, 0)} m</b> del centro de la zona</div>

      <div class="popup-suelo__seccion">Suelo (solo la parte de la celda dentro de la zona)</div>
      ${clases || '<div class="popup-suelo__vacio">Sin clasificación del suelo en esta celda.</div>'}
      <div class="popup-suelo__fila">Base predominante (urbano/rural): <b>${textoBase}</b></div>
      <div class="popup-suelo__fila">Sin clasificar: <b>${numero(base.sin_clasificar_pct)} %</b></div>

      <div class="popup-suelo__seccion">Actividades identificadas en la celda</div>
      <div class="popup-suelo__fila">Equipamientos AMVA: <b>${equip.total ?? 0}</b> (${nEquip} categorías)</div>
      ${listaCategorias(equip)}
      <div class="popup-suelo__fila">Lugares OSM: <b>${lugares.total ?? 0}</b> (${nLugares} categorías)</div>
      ${listaCategorias(lugares)}

      <div class="popup-suelo__nota">Las clases del suelo se superponen, por eso sus porcentajes no suman 100 %. El número de equipamientos coincide con el del teselado. Es una lista de actividades registradas, no una clasificación de uso del suelo.</div>
    </div>`
}