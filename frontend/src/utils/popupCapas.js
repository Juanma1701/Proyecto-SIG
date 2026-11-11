import { cuerpoUsoEnPunto } from './popupsUsos'
import { htmlSueloEnPunto, htmlErrorSuelo } from './popupsSuelo'
import '../styles/PopupCapas.css'

// Popup unificado: al hacer clic sobre el suelo o sobre los usos, junta en un solo
// popup el uso oficial y la clasificación del suelo (POT) de ese punto.
//
// Recibe { usos, suelo }, donde cada uno es:
//   - null                          -> esa capa no está visible: no se muestra su sección
//   - { ok: true, datos }           -> consulta exitosa
//   - { ok: false, mensaje }        -> la consulta falló (un fallo no tumba a la otra sección)
//
// Cada sección va dentro de un bloque `popup-capas__bloque`: la línea que separa
// un bloque del siguiente la pone el CSS (styles/PopupCapas.css).
export function htmlPopupCapas({ usos, suelo } = {}) {
  const secciones = []

  // ---------- Uso oficial del suelo (POT 48 de 2014, Medellín) ----------
  if (usos) {
    if (usos.ok) {
      secciones.push(`
        <div class="popup-suelo">
          <div class="popup-suelo__titulo">Uso del suelo (POT 48 de 2014 – Medellín) en este punto</div>
          ${cuerpoUsoEnPunto(usos.datos)}
        </div>`)
    } else {
      secciones.push(htmlErrorSuelo(usos.mensaje))
    }
  }

  // ---------- Clasificación del suelo (POT) ----------
  if (suelo) {
    if (suelo.ok) {
      secciones.push(htmlSueloEnPunto(suelo.datos))
    } else {
      secciones.push(htmlErrorSuelo(suelo.mensaje))
    }
  }

  if (secciones.length === 0) {
    return '<div class="popup-suelo"><span class="popup-suelo__vacio">No hay capas visibles para consultar en este punto.</span></div>'
  }

  return secciones
    .map((html) => `<div class="popup-capas__bloque">${html}</div>`)
    .join('')
}