import { estiloCategoriaUso } from './categoriasUsos'

function escapar(texto) {
  if (texto === null || texto === undefined) return ''
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Convierte 2014-12-17 en 17/12/2014 sin pasar por Date (evita desfases de zona horaria)
function fechaLegible(valor) {
  if (!valor) return ''
  const partes = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!partes) return String(valor)
  return `${partes[3]}/${partes[2]}/${partes[1]}`
}

// Fila "Etiqueta: valor"; si no hay valor, no se muestra
function fila(etiqueta, valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return ''
  return `<div class="popup-suelo__fila"><b>${escapar(etiqueta)}:</b> ${escapar(valor)}</div>`
}

// Contenido (sin título ni contenedor) del uso oficial del suelo en un punto.
// Lo usan tanto el popup propio de los usos como el popup unificado suelo + usos.
// `filas` es lo que devuelve usos_en_punto: una fila por polígono de la fuente que contiene el punto.
export function cuerpoUsoEnPunto(filas) {
  const lista = Array.isArray(filas) ? filas : []

  if (lista.length === 0) {
    return '<span class="popup-suelo__vacio">La fuente oficial no registra ningún uso en este punto exacto. La capa solo cubre el suelo urbano de Medellín y puede tener huecos entre sus polígonos.</span>'
  }

  const tarjetas = lista
    .map((p) => {
      const estilo = estiloCategoriaUso(p.area_general)

      return `
        <div class="popup-suelo__poligono">
          <div class="popup-suelo__cabecera">
            <span class="popup-suelo__muestra" style="background:${estilo.color}"></span>
            <strong>${escapar(estilo.titulo)}</strong>
          </div>
          <div class="popup-capas__explicacion">${escapar(estilo.explicacion)}</div>
          ${fila('Nombre oficial', p.area_general)}

          <details class="popup-capas__detalles">
            <summary>Ver datos originales de la fuente</summary>
            ${fila('Categoría oficial', p.area_general)}
            ${fila('Subcategoría', p.subcategoria)}
            ${fila('Código de categoría', p.cod_cat_uso)}
            ${fila('Código de subcategoría', p.cod_subcat_uso)}
            ${fila('Fecha de adopción', fechaLegible(p.fecha_adopcion))}
            ${fila('Fecha de actualización', fechaLegible(p.fecha_actualizacion))}
            ${fila('Acuerdo', p.acuerdo)}
            ${fila('Origen', p.fuente)}
          </details>
        </div>`
    })
    .join('')

  const notaVarios =
    lista.length > 1
      ? ' Aparece más de un uso porque en este punto los polígonos de la fuente se tocan o se solapan (ocurre en los bordes).'
      : ''

  return `
    ${tarjetas}
    <div class="popup-suelo__nota">Indica para qué se permite usar el suelo según el plan de la ciudad, no lo que existe hoy en este lugar. La Alcaldía la describe como una aproximación técnica. Cerca de un borde, el color dibujado puede diferir de este resultado porque el dibujo del mapa está simplificado (unos 4 m).${notaVarios}</div>`
}

// Popup al hacer clic sobre un uso del suelo oficial (POT 48 de 2014, Medellín), versión de una sola capa
export function htmlUsoEnPunto(filas) {
  return `
    <div class="popup-suelo">
      <div class="popup-suelo__titulo">Uso del suelo (POT 48 de 2014 – Medellín) en este punto</div>
      ${cuerpoUsoEnPunto(filas)}
    </div>`
}