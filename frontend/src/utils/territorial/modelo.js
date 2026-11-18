// Modelo del resultado de la consulta territorial (etapa 1).
// Sin red. No existe ningún campo "permitido/prohibido": el modelo solo describe lo que las fuentes devuelven.

import { ADVERTENCIAS, BLOQUES } from './registroFuentes.js'
import { ADVERTENCIAS_RESOLUCION } from './resolverMunicipio.js'

export const TIPOS_BLOQUE = BLOQUES

export const ESTADOS_BLOQUE = Object.freeze({
  OK: 'ok',
  SIN_RESULTADOS: 'sin_resultados',
  FUERA_DE_COBERTURA: 'fuera_de_cobertura',
  ERROR_SERVICIO: 'error_servicio',
  ERROR_RED: 'error_red',
  TIMEOUT: 'timeout',
  // Hay (o no) datos, pero el significado de la capa no está verificado: no se presenta como normativa.
  CAPA_NO_VERIFICADA: 'capa_no_verificada'
})

export const ORIGENES = Object.freeze({ SUPABASE: 'supabase', ARCGIS_AMVA: 'arcgis_amva' })

// Base pública verificada del catálogo del AMVA (la app consulta por el proxy /amva).
export const BASE_PUBLICA_AMVA = 'https://portalidem.metropol.gov.co/server/rest/services'

export const AVISO_ALCANCE =
  'Información territorial de referencia tomada de fuentes públicas. No es un concepto de uso del suelo, ni una licencia, permiso o autorización legal. La compatibilidad de una actividad debe confirmarse con la autoridad municipal competente.'

export const ADVERTENCIAS_MODELO = {
  CAPA_PENDIENTE_DE_PRUEBA:
    'Esta capa no se había podido probar bien en el sondeo (falló con un error de tiempo de espera): si no responde, no es un problema del punto consultado.',
  RESULTADO_TRUNCADO:
    'El servicio indicó que había más registros de los que devolvió: el resultado puede estar incompleto.',
  MUNICIPIO_AMBIGUO_SIN_CAPAS_MUNICIPALES:
    'No se pudo decidir el municipio del punto, así que no se consultaron las capas propias de cada municipio. Solo se muestra la clasificación del suelo.',
  MUNICIPIO_ELEGIDO_POR_USUARIO:
    'El municipio fue elegido por la persona entre varios candidatos; no lo determinó la consulta.',
  POLIGONOS_SUPABASE_SIN_BLOQUE:
    'La copia de suelo en Supabase devolvió polígonos de otras capas que no se asignaron a ningún bloque (no se muestran).',
  SUELO_RPC_POSIBLEMENTE_RECORTADO:
    'La consulta a la copia de suelo en Supabase pudo recortar polígonos (tope de 15 por consulta, sin aviso de recorte) [verificar].',
  USO_SUPABASE_SOLO_URBANO_MEDELLIN:
    'Esta fuente (Acuerdo 48 de 2014) cubre solo suelo urbano de Medellín: un vacío en suelo rural o fuera de ese ámbito es esperable.',
  FORMA_RESPUESTA_NO_VERIFICADA:
    'La forma de la respuesta de esta fuente aún no se ha visto en producción: los campos se muestran tal como llegan [verificar].',
  MEDELLIN_POT_EN_REVISION:
    'El Concejo de Medellín aprobó en noviembre de 2026 una revisión del POT (Proyecto de Acuerdo 104 de 2026). No se ha verificado su sanción ni su entrada en vigencia. Las capas de Medellín que muestra este panel corresponden al POT de 2014 (Acuerdo 48) y pueden no reflejar el nuevo plan.'
}

export const TEXTOS_ADVERTENCIA = { ...ADVERTENCIAS, ...ADVERTENCIAS_RESOLUCION, ...ADVERTENCIAS_MODELO }

export function advertenciasDesdeCodigos(codigos) {
  return [...new Set(codigos)].map((codigo) => ({ codigo, texto: TEXTOS_ADVERTENCIA[codigo] ?? codigo }))
}

// Recorta espacios; texto vacío -> null. No toca otros tipos.
export function limpiarValor(valor) {
  if (typeof valor !== 'string') return valor === undefined ? null : valor
  const texto = valor.trim()
  return texto === '' ? null : texto
}

export function limpiarAtributos(atributos) {
  const salida = {}
  for (const [clave, valor] of Object.entries(atributos ?? {})) salida[clave] = limpiarValor(valor)
  return salida
}

const ESTADO_DESDE_CONSULTA = {
  ok: ESTADOS_BLOQUE.OK,
  sin_resultados: ESTADOS_BLOQUE.SIN_RESULTADOS,
  error_servicio: ESTADOS_BLOQUE.ERROR_SERVICIO,
  error_red: ESTADOS_BLOQUE.ERROR_RED,
  timeout: ESTADOS_BLOQUE.TIMEOUT
}

// 'cancelada' (y cualquier estado desconocido) -> null: el orquestador descarta esa consulta.
export function estadoBloqueDesdeConsulta(estadoConsulta) {
  return ESTADO_DESDE_CONSULTA[estadoConsulta] ?? null
}

export function crearNormalizado({ clase = null, subcategoria = null, etiquetaOriginal = null } = {}) {
  return { clase, subcategoria, etiquetaOriginal }
}

// `atributosOriginales` queda intacto; `atributosLimpios` es la copia recortada para mostrar.
// `normalizado` es null si no hay un mapeo verificado.
export function crearRegistro({ atributosOriginales, normalizado = null, meta = null }) {
  return {
    atributosOriginales,
    atributosLimpios: limpiarAtributos(atributosOriginales),
    normalizado,
    meta
  }
}

export function crearFuente({
  origen,
  servicio,
  capaId = null,
  url = null,
  fechaDatosDeclarada = null,
  instrumentoNormativo = null
}) {
  if (!Object.values(ORIGENES).includes(origen)) throw new RangeError(`Origen inválido: ${origen}`)
  return { origen, servicio, capaId, url, fechaDatosDeclarada, instrumentoNormativo }
}

export function crearBloque({
  id,
  tipo,
  estado,
  fuente,
  titulo = null,
  ambito = null,
  registros = [],
  advertencias = [],
  notasVerificacion = [],
  error = null,
  truncado = false
}) {
  if (!TIPOS_BLOQUE.includes(tipo)) throw new RangeError(`Tipo de bloque inválido: ${tipo}`)
  if (!Object.values(ESTADOS_BLOQUE).includes(estado)) throw new RangeError(`Estado de bloque inválido: ${estado}`)
  return {
    id,
    tipo,
    estado,
    titulo,
    ambito,
    fuente,
    registros,
    advertencias: advertenciasDesdeCodigos(advertencias),
    notasVerificacion,
    error,
    truncado
  }
}