// Adaptadores de las respuestas de Supabase al modelo normalizado. Sin red.

import { SUELO_POT_SUPABASE, claseDesdeSimbologia } from '../registroFuentes.js'
import { crearNormalizado, crearRegistro, limpiarValor } from '../modelo.js'

const sinTilde = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

// El mapeo SIMBOLOGIA -> clase solo está verificado para capas de clasificación del suelo.
export function esCapaClasificacion(capaOrigen) {
  return typeof capaOrigen === 'string' && sinTilde(capaOrigen).startsWith('clasifica')
}

function tipoDeBloque(poligono) {
  if (esCapaClasificacion(poligono?.capa_origen)) return 'clasificacion_suelo'
  const categoria = typeof poligono?.categoria === 'string' ? sinTilde(poligono.categoria) : ''
  if (categoria === 'proteccion') return 'proteccion'
  if (categoria === 'riesgo') return 'riesgo'
  return null
}

// Entrada: jsonb de suelo_en_punto ({ punto, poligonos: [...] }). Acepta también un arreglo de polígonos [verificar].
// Salida: polígonos agrupados por tipo de bloque; los que no encajan se cuentan en `sinBloque`.
export function adaptarSueloSupabase(respuesta) {
  const poligonos = Array.isArray(respuesta) ? respuesta : Array.isArray(respuesta?.poligonos) ? respuesta.poligonos : []
  const porTipo = { clasificacion_suelo: [], proteccion: [], riesgo: [] }
  let sinBloque = 0

  for (const p of poligonos) {
    const tipo = tipoDeBloque(p)
    if (!tipo) {
      sinBloque++
      continue
    }
    const atributos = p?.atributos && typeof p.atributos === 'object' ? p.atributos : {}
    const normalizado =
      tipo === 'clasificacion_suelo'
        ? crearNormalizado({
            clase: claseDesdeSimbologia(atributos.SIMBOLOGIA),
            etiquetaOriginal: limpiarValor(atributos.SIMBOLOGIA)
          })
        : null
    porTipo[tipo].push(
      crearRegistro({
        atributosOriginales: atributos,
        normalizado,
        meta: {
          id: p?.id ?? null,
          municipio: p?.municipio ?? null,
          categoriaTabla: p?.categoria ?? null,
          capaOrigen: p?.capa_origen ?? null,
          nombre: p?.nombre ?? null
        }
      })
    )
  }

  return {
    porTipo,
    sinBloque,
    total: poligonos.length,
    posibleRecorte: poligonos.length >= SUELO_POT_SUPABASE.maxPoligonosPorRpc
  }
}

// `usos_en_punto` (solo Medellín, suelo urbano): su salida real NO se ha visto [verificar].
// Se toman los datos tal como llegan: arreglo -> registros; objeto con `usos` arreglo -> esos; otro objeto -> uno.
export function adaptarUsosMedellin(respuesta) {
  let lista = []
  if (Array.isArray(respuesta)) lista = respuesta
  else if (respuesta && typeof respuesta === 'object') lista = Array.isArray(respuesta.usos) ? respuesta.usos : [respuesta]
  return lista
    .filter((x) => x && typeof x === 'object')
    .map((x) => crearRegistro({ atributosOriginales: x }))
}