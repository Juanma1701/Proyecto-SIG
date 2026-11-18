// Resolución del municipio de un punto (etapa 1). Ver decisión aprobada en el contexto del proyecto.
//
// Fuentes: AMVA_POT/5 (REST) contrastada con `suelo_pot` (Supabase, vía RPC suelo_en_punto).
// Ninguna es un límite oficial: el resultado lleva siempre el rótulo del registro.
// Se une por CODIGO_MUN, nunca por nombre.
//
// Sin red ni Supabase propios: `consultarArcGIS` y `consultarSuelo` se inyectan.
//   consultarArcGIS({servicio, capaId, lat, lon, distanciaM, outFields, signal}) -> como consultarPuntoArcGIS
//   consultarSuelo({lat, lon, signal}) -> jsonb de suelo_en_punto ({punto, poligonos:[{atributos,...}]}) o lanza

import { RESOLUCION_MUNICIPIO, municipioPorCodigo } from './registroFuentes.js'

// [verificar] con el sondeo S3; mientras tanto 250 m.
export const UMBRAL_BORDE_M_POR_DEFECTO = 250

export const ESTADOS_MUNICIPIO = Object.freeze({
  RESUELTO: 'resuelto',
  AMBIGUO: 'ambiguo',
  FUERA_DE_COBERTURA: 'fuera_de_cobertura',
  ERROR: 'error',
  CANCELADA: 'cancelada'
})

export const ADVERTENCIAS_RESOLUCION = {
  BORDE_CERCANO:
    'Hay más de un municipio dentro de la distancia de borde alrededor del punto: no se elige uno.',
  BORDE_NO_VERIFICADO:
    'No se pudo comprobar la cercanía a un borde municipal (falló la consulta con distancia).',
  AMVA_NO_DISPONIBLE:
    'El servicio del AMVA no respondió: el municipio sale solo de la copia guardada en Supabase.',
  SIN_CONTRASTE_SUPABASE:
    'No se pudo contrastar con la copia de suelo en Supabase.',
  SUELO_POT_SIN_POLIGONOS_EN_PUNTO:
    'La copia de suelo en Supabase no devolvió polígonos en este punto; el municipio sale solo del AMVA.',
  AMVA_Y_SUELO_DISCREPAN:
    'El AMVA y la copia de suelo en Supabase no coinciden en el municipio de este punto.',
  AMVA_VACIO_NO_CONCLUYENTE:
    'El AMVA no devolvió municipio y la copia de Supabase no pudo contrastarlo: no se concluye que esté fuera del área.',
  FUERA_PERO_CERCA_DEL_AMVA:
    'El punto no cae en ningún municipio, pero hay uno a menos de la distancia de borde.',
  CODIGO_NO_REGISTRADO:
    'Se obtuvo un CODIGO_MUN que no está en el registro de los 10 municipios.'
}

export function normalizarCodigoMun(valor) {
  if (valor === null || valor === undefined) return null
  const texto = String(valor).trim()
  if (!texto) return null
  return /^\d+$/.test(texto) ? texto.padStart(3, '0') : texto
}

function codigosDeRegistros(registros, campo) {
  return [...new Set((registros ?? []).map((r) => normalizarCodigoMun(r?.[campo])).filter(Boolean))]
}

function codigosDeSuelo(respuesta) {
  const poligonos = Array.isArray(respuesta?.poligonos) ? respuesta.poligonos : []
  return [...new Set(poligonos.map((p) => normalizarCodigoMun(p?.atributos?.CODIGO_MUN)).filter(Boolean))]
}

function candidato(codigo) {
  const m = municipioPorCodigo(codigo)
  return { codigo, nombre: m?.nombre ?? null, slug: m?.slug ?? null }
}

const respondio = (r) => Boolean(r) && (r.estado === 'ok' || r.estado === 'sin_resultados')

async function consultarAmvaSeguro(consultarArcGIS, parametros) {
  try {
    return await consultarArcGIS(parametros)
  } catch (e) {
    return { estado: 'error_red', registros: [], error: { codigo: null, mensaje: e?.message ?? 'Error' } }
  }
}

async function consultarSueloSeguro(consultarSuelo, parametros) {
  try {
    const respuesta = await consultarSuelo(parametros)
    return { estado: 'ok', codigos: codigosDeSuelo(respuesta) }
  } catch (e) {
    return { estado: 'error', codigos: [], mensaje: e?.message ?? 'Error' }
  }
}

export async function resolverMunicipio(
  punto,
  { consultarArcGIS, consultarSuelo, umbralBordeM = UMBRAL_BORDE_M_POR_DEFECTO, signal } = {}
) {
  if (typeof consultarArcGIS !== 'function' || typeof consultarSuelo !== 'function') {
    throw new TypeError('resolverMunicipio requiere consultarArcGIS y consultarSuelo.')
  }
  const { lat, lon } = punto
  const { fuenteAmva, rotulo } = RESOLUCION_MUNICIPIO
  const comun = {
    servicio: fuenteAmva.servicio,
    capaId: fuenteAmva.capaId,
    lat,
    lon,
    signal,
    outFields: `${fuenteAmva.campoCodigo},${fuenteAmva.campoNombre},SIMBOLOGIA`
  }

  const [amva0, amvaD, suelo] = await Promise.all([
    consultarAmvaSeguro(consultarArcGIS, { ...comun, distanciaM: 0 }),
    umbralBordeM > 0
      ? consultarAmvaSeguro(consultarArcGIS, { ...comun, distanciaM: umbralBordeM })
      : Promise.resolve(null),
    consultarSueloSeguro(consultarSuelo, { lat, lon, signal })
  ])

  const A = respondio(amva0) ? codigosDeRegistros(amva0.registros, fuenteAmva.campoCodigo) : null
  const B = respondio(amvaD) ? codigosDeRegistros(amvaD.registros, fuenteAmva.campoCodigo) : null
  const S = suelo.estado === 'ok' ? suelo.codigos : null

  const advertencias = new Set()
  const detalle = {
    amva: amva0.estado,
    amvaBorde: amvaD ? amvaD.estado : null,
    suelo: suelo.estado,
    codigosAmva: A,
    codigosBorde: B,
    codigosSuelo: S
  }

  const armar = (estado, { municipio = null, metodo = null, candidatos = [] } = {}) => ({
    estado,
    codigo: municipio?.codigoMun ?? null,
    slug: municipio?.slug ?? null,
    nombre: municipio?.nombre ?? null,
    metodo,
    rotulo,
    candidatos,
    cercaDeBorde: B ? B.length > 1 : null,
    umbralBordeM,
    distanciaBordeM: null, // no se puede medir con estas consultas
    advertencias: [...advertencias],
    detalle
  })

  const terminar = (estado, codigos = [], metodo = null) => {
    if (estado === ESTADOS_MUNICIPIO.RESUELTO) {
      const municipio = municipioPorCodigo(codigos[0])
      if (!municipio) {
        advertencias.add('CODIGO_NO_REGISTRADO')
        return armar(ESTADOS_MUNICIPIO.ERROR, { candidatos: codigos.map(candidato) })
      }
      return armar(estado, { municipio, metodo })
    }
    return armar(estado, {
      candidatos: estado === ESTADOS_MUNICIPIO.AMBIGUO ? codigos.map(candidato) : []
    })
  }

  if (signal?.aborted) return armar(ESTADOS_MUNICIPIO.CANCELADA)

  if (umbralBordeM > 0 && B === null) advertencias.add('BORDE_NO_VERIFICADO')
  if (A === null) advertencias.add('AMVA_NO_DISPONIBLE')
  if (S === null) advertencias.add('SIN_CONTRASTE_SUPABASE')

  // Ninguna fuente respondió
  if (A === null && S === null) return terminar(ESTADOS_MUNICIPIO.ERROR)

  // El AMVA respondió y no hay municipio en el punto
  if (A !== null && A.length === 0) {
    if (S === null) {
      advertencias.add('AMVA_VACIO_NO_CONCLUYENTE')
      return terminar(ESTADOS_MUNICIPIO.ERROR)
    }
    if (S.length === 0) {
      if (B && B.length > 0) advertencias.add('FUERA_PERO_CERCA_DEL_AMVA')
      return terminar(ESTADOS_MUNICIPIO.FUERA_DE_COBERTURA)
    }
    advertencias.add('AMVA_Y_SUELO_DISCREPAN')
    return terminar(ESTADOS_MUNICIPIO.AMBIGUO, S)
  }

  // El AMVA no respondió: solo Supabase
  if (A === null) {
    if (S.length === 1) return terminar(ESTADOS_MUNICIPIO.RESUELTO, S, 'suelo_pot_supabase')
    if (S.length > 1) return terminar(ESTADOS_MUNICIPIO.AMBIGUO, S)
    return terminar(ESTADOS_MUNICIPIO.ERROR)
  }

  // El AMVA devolvió al menos un código
  const union = [...new Set([...A, ...(B ?? []), ...(S ?? [])])]
  if (B && B.length > 1) advertencias.add('BORDE_CERCANO')
  if (S !== null) {
    if (S.length === 0) {
      advertencias.add('SUELO_POT_SIN_POLIGONOS_EN_PUNTO')
    } else if (!(S.length === A.length && S.every((c) => A.includes(c)))) {
      advertencias.add('AMVA_Y_SUELO_DISCREPAN')
    }
  }

  if (union.length === 1) {
    const conSuelo = S !== null && S.length > 0
    return terminar(
      ESTADOS_MUNICIPIO.RESUELTO,
      union,
      conSuelo ? 'amva_pot_clasificacion+suelo_pot' : 'amva_pot_clasificacion'
    )
  }
  return terminar(ESTADOS_MUNICIPIO.AMBIGUO, union)
}
