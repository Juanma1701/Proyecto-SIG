// Adaptadores de registros ArcGIS (atributos) al modelo normalizado. Sin red.
// `normalizado` solo se llena donde el mapeo está verificado; en el resto es null.

import { claseDesdeSimbologia } from '../registroFuentes.js'
import { crearNormalizado, crearRegistro, limpiarValor } from '../modelo.js'

// Tratamientos, riesgos, protección y uso POT: sin mapeo verificado -> solo atributos originales.
export function adaptarGenerico(registros) {
  return registros.map((atributos) => crearRegistro({ atributosOriginales: atributos }))
}

// Clasificación del suelo: la clase sale de SIMBOLOGIA (no de la categoría de suelo_pot).
export function adaptarClasificacion(registros) {
  return registros.map((atributos) =>
    crearRegistro({
      atributosOriginales: atributos,
      normalizado: crearNormalizado({
        clase: claseDesdeSimbologia(atributos.SIMBOLOGIA),
        etiquetaOriginal: limpiarValor(atributos.SIMBOLOGIA)
      })
    })
  )
}

// Uso actual (capas *_Uso_y_Valores_Suelo, mismo esquema en los 10 municipios):
// solo se conserva la etiqueta original; no se interpreta.
export function adaptarUsoActual(registros) {
  return registros.map((atributos) =>
    crearRegistro({
      atributosOriginales: atributos,
      normalizado: crearNormalizado({ etiquetaOriginal: limpiarValor(atributos.USO_ACTUAL) })
    })
  )
}

export function adaptadorPorBloque(bloque) {
  if (bloque === 'clasificacion_suelo') return adaptarClasificacion
  if (bloque === 'uso_actual') return adaptarUsoActual
  return adaptarGenerico
}