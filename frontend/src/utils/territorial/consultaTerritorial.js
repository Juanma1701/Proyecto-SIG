// Orquestador de la consulta territorial (etapa 1). Sin red ni Supabase propios: todo se inyecta.
//
//   consultarArcGIS({servicio, capaId, lat, lon, distanciaM, outFields, signal}) -> como consultarPuntoArcGIS
//   consultarSuelo({lat, lon, signal})        -> jsonb de suelo_en_punto (o lanza)
//   consultarUsoMedellin({lat, lon, signal})  -> salida de usos_en_punto (opcional; solo se llama en Medellín)
//
// Reglas:
//  - Un bloque por capa, cada uno con su estado: un fallo no tumba a los demás.
//  - `uso_normativo_pot` nunca sale como 'ok' ni 'sin_resultados': sale 'capa_no_verificada'
//    (los errores de servicio se conservan). El panel debe decir "sin datos normativos verificados".
//  - La copia de Supabase se consulta UNA sola vez y la comparten el resolver y el bloque de suelo.
//  - Si el municipio es ambiguo no se eligen capas municipales (salvo que la persona elija un candidato).

import {
  CAPAS_AMVA_AGREGADO,
  BLOQUES,
  capasDeMunicipio,
  municipioPorSlug,
  rutaCapa
} from './registroFuentes.js'
import {
  AVISO_ALCANCE,
  BASE_PUBLICA_AMVA,
  ESTADOS_BLOQUE,
  ORIGENES,
  advertenciasDesdeCodigos,
  crearBloque,
  crearFuente,
  estadoBloqueDesdeConsulta
} from './modelo.js'
import { resolverMunicipio } from './resolverMunicipio.js'
import { adaptadorPorBloque } from './adaptadores/arcgis.js'
import { adaptarSueloSupabase, adaptarUsosMedellin } from './adaptadores/supabase.js'

const FUENTE_SUELO = crearFuente({
  origen: ORIGENES.SUPABASE,
  servicio: 'suelo_pot',
  fechaDatosDeclarada: '2022-09', // copia de datos del AMVA de septiembre de 2022
  instrumentoNormativo: null
})

const FUENTE_USOS_MEDELLIN = crearFuente({
  origen: ORIGENES.SUPABASE,
  servicio: 'usos_suelo',
  fechaDatosDeclarada: null,
  instrumentoNormativo: 'Acuerdo 48 de 2014 (solo suelo urbano de Medellín)'
})

const ESTADO_GENERAL = {
  resuelto: 'ok',
  ambiguo: 'ambiguo',
  fuera_de_cobertura: 'fuera_de_cobertura',
  error: 'error',
  cancelada: 'cancelada'
}

const mensajeDe = (e) => e?.message ?? 'Error desconocido'

async function bloqueArcGIS(capa, { lat, lon, signal, timeoutMs, consultarArcGIS }) {
  let r
  try {
    r = await consultarArcGIS({
      servicio: capa.servicio,
      capaId: capa.id,
      lat,
      lon,
      signal,
      ...(timeoutMs ? { timeoutMs } : {})
    })
  } catch (e) {
    r = { estado: 'error_red', registros: [], error: { codigo: null, mensaje: mensajeDe(e) } }
  }

  let estado = estadoBloqueDesdeConsulta(r.estado)
  if (!estado) return null // cancelada

  const advertencias = [...capa.advertencias]
  if (capa.consultaPuntual === 'pendiente') advertencias.push('CAPA_PENDIENTE_DE_PRUEBA')

  let registros = []
  if (r.estado === 'ok' || r.estado === 'sin_resultados') {
    registros = adaptadorPorBloque(capa.bloque)(r.registros)
    if (r.truncado) advertencias.push('RESULTADO_TRUNCADO')
    if (capa.bloque === 'uso_normativo_pot') estado = ESTADOS_BLOQUE.CAPA_NO_VERIFICADA
  }

  return crearBloque({
    id: `${ORIGENES.ARCGIS_AMVA}:${capa.servicio}/${capa.id}`,
    tipo: capa.bloque,
    estado,
    titulo: capa.nombre,
    ambito: capa.ambito,
    fuente: crearFuente({
      origen: ORIGENES.ARCGIS_AMVA,
      servicio: capa.servicio,
      capaId: capa.id,
      url: `${BASE_PUBLICA_AMVA}/${rutaCapa(capa.servicio, capa.id)}`
    }),
    registros,
    advertencias,
    notasVerificacion: capa.notasVerificacion ?? [],
    error: r.error ?? null,
    truncado: r.truncado === true
  })
}

async function bloquesSuelo({ sueloCompartido, lat, lon, signal }) {
  let respuesta
  try {
    respuesta = await sueloCompartido({ lat, lon, signal })
  } catch (e) {
    return [
      crearBloque({
        id: 'supabase:suelo_pot:clasificacion_suelo',
        tipo: 'clasificacion_suelo',
        estado: ESTADOS_BLOQUE.ERROR_SERVICIO,
        titulo: 'Clasificación del suelo (copia en Supabase)',
        fuente: FUENTE_SUELO,
        error: { codigo: null, mensaje: mensajeDe(e) }
      })
    ]
  }

  const { porTipo, sinBloque, posibleRecorte } = adaptarSueloSupabase(respuesta)
  const comunes = []
  if (posibleRecorte) comunes.push('SUELO_RPC_POSIBLEMENTE_RECORTADO')
  if (sinBloque > 0) comunes.push('POLIGONOS_SUPABASE_SIN_BLOQUE')

  const titulos = {
    clasificacion_suelo: 'Clasificación del suelo (copia en Supabase)',
    proteccion: 'Suelo de protección (copia en Supabase)',
    riesgo: 'Riesgo (copia en Supabase)'
  }
  const bloques = []
  for (const tipo of ['clasificacion_suelo', 'proteccion', 'riesgo']) {
    const registros = porTipo[tipo]
    if (tipo !== 'clasificacion_suelo' && registros.length === 0) continue
    bloques.push(
      crearBloque({
        id: `supabase:suelo_pot:${tipo}`,
        tipo,
        estado: registros.length ? ESTADOS_BLOQUE.OK : ESTADOS_BLOQUE.SIN_RESULTADOS,
        titulo: titulos[tipo],
        fuente: FUENTE_SUELO,
        registros,
        advertencias: [...(tipo === 'clasificacion_suelo' ? ['EXPANSION_DENTRO_DE_URBANO'] : []), ...comunes]
      })
    )
  }
  return bloques
}

async function bloqueUsosMedellin({ consultarUsoMedellin, lat, lon, signal }) {
  const base = {
    id: 'supabase:usos_suelo',
    tipo: 'uso_normativo_pot',
    titulo: 'Usos del suelo urbano de Medellín (Supabase)',
    fuente: FUENTE_USOS_MEDELLIN
  }
  const advertencias = ['USO_POT_NO_VERIFICADO', 'USO_SUPABASE_SOLO_URBANO_MEDELLIN', 'FORMA_RESPUESTA_NO_VERIFICADA']
  try {
    const respuesta = await consultarUsoMedellin({ lat, lon, signal })
    return crearBloque({
      ...base,
      estado: ESTADOS_BLOQUE.CAPA_NO_VERIFICADA,
      registros: adaptarUsosMedellin(respuesta),
      advertencias
    })
  } catch (e) {
    return crearBloque({
      ...base,
      estado: ESTADOS_BLOQUE.ERROR_SERVICIO,
      advertencias,
      error: { codigo: null, mensaje: mensajeDe(e) }
    })
  }
}

export async function consultarTerritorio(punto, deps = {}) {
  const {
    consultarArcGIS,
    consultarSuelo,
    consultarUsoMedellin = null,
    signal,
    timeoutMs,
    umbralBordeM,
    municipioElegido = null,
    ahora = () => new Date()
  } = deps
  if (typeof consultarArcGIS !== 'function' || typeof consultarSuelo !== 'function') {
    throw new TypeError('consultarTerritorio requiere consultarArcGIS y consultarSuelo.')
  }
  const { lat, lon } = punto
  const fechaConsulta = ahora().toISOString()

  // Una sola consulta a Supabase, compartida (el resolver y el bloque de suelo)
  let promesaSuelo = null
  const sueloCompartido = (parametros) => {
    promesaSuelo ??= Promise.resolve().then(() => consultarSuelo(parametros))
    return promesaSuelo
  }

  let municipio = await resolverMunicipio(
    { lat, lon },
    { consultarArcGIS, consultarSuelo: sueloCompartido, umbralBordeM, signal }
  )

  const armar = (bloques = [], advertenciasGlobales = []) => ({
    estado: ESTADO_GENERAL[municipio.estado] ?? 'error',
    punto: { lat, lon, srid: 4326 },
    fechaConsulta,
    municipio,
    bloques,
    advertencias: advertenciasDesdeCodigos(advertenciasGlobales),
    aviso: AVISO_ALCANCE
  })

  if (municipio.estado === 'cancelada' || signal?.aborted) return armar()

  // La persona eligió uno de los candidatos de un punto ambiguo
  if (municipio.estado === 'ambiguo' && municipioElegido) {
    const elegido = municipio.candidatos.find((c) => c.slug === municipioElegido)
    const m = elegido ? municipioPorSlug(municipioElegido) : null
    if (m) {
      municipio = {
        ...municipio,
        estado: 'resuelto',
        codigo: m.codigoMun,
        slug: m.slug,
        nombre: m.nombre,
        metodo: 'elegido_por_el_usuario',
        advertencias: [...municipio.advertencias, 'MUNICIPIO_ELEGIDO_POR_USUARIO']
      }
    }
  }

  const ctx = { lat, lon, signal, timeoutMs, consultarArcGIS, sueloCompartido, consultarUsoMedellin }
  const tareas = []
  const globales = []

  if (municipio.estado === 'resuelto') {
    if (municipio.slug === 'Medellin') globales.push('MEDELLIN_POT_EN_REVISION')
    for (const capa of capasDeMunicipio(municipio.slug)) tareas.push(bloqueArcGIS(capa, ctx))
        tareas.push(bloquesSuelo(ctx))
    if (municipio.slug === 'Medellin' && typeof consultarUsoMedellin === 'function') {
      tareas.push(bloqueUsosMedellin(ctx))
    }
  } else if (municipio.estado === 'ambiguo') {
    globales.push('MUNICIPIO_AMBIGUO_SIN_CAPAS_MUNICIPALES')
    tareas.push(bloqueArcGIS(CAPAS_AMVA_AGREGADO.find((c) => c.id === 5), ctx))
    tareas.push(bloquesSuelo(ctx))
  }

  const bloques = (await Promise.all(tareas)).flat().filter(Boolean)
  if (signal?.aborted) {
    municipio = { ...municipio, estado: 'cancelada' }
    return armar()
  }

  bloques.sort((a, b) => BLOQUES.indexOf(a.tipo) - BLOQUES.indexOf(b.tipo))
  return armar(bloques, globales)
}