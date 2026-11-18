// Del municipio resuelto, la consulta del punto y la actividad elegida, al resultado normativo.
// Función pura: sin red ni React. Itagüí (por zona) y Medellín (por área de mixtura) tienen el punto conectado con su
// norma; el resto devuelve informacion_normativa_insuficiente con el motivo. Nunca elige una zona en silencio.

import { ACTIVIDADES, TIPOLOGIAS_CANDIDATAS, actividadPorId } from './actividades.js'
import { AVISO_EVALUACION, RESULTADOS, evaluarActividad, evaluarTipologiaElegida } from './evaluar.js'
import { evaluarMedellin } from './evaluarMedellin.js'
import { instrumentoDeMunicipio } from './index.js'
import { areasDeMixtura } from './usosMedellin.js'
import { evaluarPorCiiu } from './evaluarPorCiiu.js'
import { zonaDeEnvigado, CIIU_CANDIDATOS } from './envigado.js'
import { evaluarSabaneta } from './evaluarSabaneta.js'
import { zonaDeSabaneta } from './sabaneta.js'
import { LECTURAS_ALTERNAS, avisosDeActividad, estadoEnAreas, lecturaAlterna } from './laEstrella.js'

export const SITUACIONES = Object.freeze({
  ACTIVIDAD_NO_ELEGIDA: 'actividad_no_elegida',
  MUNICIPIO_SIN_DETERMINAR: 'municipio_sin_determinar',
  FUERA_DE_COBERTURA: 'fuera_de_cobertura',
  NORMA_NO_CARGADA: 'norma_no_cargada',
  ZONA_SIN_IDENTIFICAR: 'zona_sin_identificar',
  VARIAS_ZONAS: 'varias_zonas',
  ERROR_ZONA: 'error_zona',
  EVALUADA: 'evaluada'
})

export const LISTA_ACTIVIDADES = Array.isArray(ACTIVIDADES) ? ACTIVIDADES : Object.values(ACTIVIDADES ?? {})

const SLUG_NORMA = { itagui: 'Itagui', medellin: 'Medellin', envigado: 'Envigado', sabaneta: 'Sabaneta', laestrella: 'LaEstrella' }

const sinTildes = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

// Clave estable del municipio ('itagui', 'medellin'), o null si el municipio no está resuelto.
export function claveMunicipio(municipio) {
  if (municipio?.estado !== 'resuelto') return null
  return sinTildes(municipio.slug ?? municipio.nombre) || null
}

export const esItagui = (municipio) => claveMunicipio(municipio) === 'itagui'
export const esMedellin = (municipio) => claveMunicipio(municipio) === 'medellin'
export const esSabaneta = (municipio) => claveMunicipio(municipio) === 'sabaneta'
export const esEnvigado = (municipio) => claveMunicipio(municipio) === 'envigado'
export const esLaEstrella = (municipio) => claveMunicipio(municipio) === 'laestrella'

function buscarInstrumento(municipio, clave) {
  try {
    return instrumentoDeMunicipio(SLUG_NORMA[clave] ?? municipio?.slug ?? municipio?.nombre) ?? null
  } catch {
    return null
  }
}

// Avisos de Itagüí que salen de cómo se leyó la capa, de qué tipo de zona es y de las notas de la transcripción
// del acuerdo (campo `observaciones` de itagui.js, que la zona de la capa no trae). No son del motor.
function avisosDeZona(zona, transcrita = null) {
  const lista = [...(zona.avisosDeLectura ?? [])]
  if (/dotacional/i.test(zona.areaActividad ?? '') && zona.subtipo) {
    lista.push(
      `La capa clasifica esta zona como "${zona.subtipo}" (área de actividad dotacional): confirma con Planeación qué usos aplican en el predio.`
    )
  }
  if (zona.codigo && !transcrita) {
    lista.push(`La zona ${zona.codigo} no está en la transcripción del acuerdo cargada en GeoAburrá: su tabla de usos viene solo de la capa oficial.`)
  }
  for (const o of transcrita?.observaciones ?? []) {
    lista.push(`Nota de la transcripción de ${zona.codigo}: ${o}`)
  }
  return lista
}

function sinConcluir({ situacion, motivo, queFalta, actividad, municipio, zonaCodigo = null }) {
  return {
    resultado: RESULTADOS.INSUFICIENTE,
    situacion,
    explicacion: motivo,
    razones: [motivo],
    condiciones: [],
    requiereVerificarUbicacion: false,
    requisitosDeTipologia: [],
    contexto: [],
    referencias: [],
    advertencias: [],
    rangos: [],
    queFalta,
    datos: {
      actividad: actividad ? { id: actividad.id, nombre: actividad.nombre } : null,
      municipioSlug: municipio?.slug ?? null,
      zonaCodigo,
      tipologia: null,
      instrumento: null
    },
    aviso: AVISO_EVALUACION
  }
}

const DONDE_SIN_REGIMEN = {
  espacioPublicoExistente: 'espacio público existente (calles, parques, ríos y similares)',
  espacioPublicoProyectado: 'espacio público proyectado',
  dotacional: 'un área dotacional (equipamientos)'
}

function valorarMedellin({ instrumento, resultadoTerritorial, actividad, tamano, caso, nombre }) {
  const uso = areasDeMixtura(instrumento, resultadoTerritorial)
  if (uso.estado === 'ok') {
    const evaluacion = evaluarMedellin({ instrumento, areaIds: uso.areaIds, actividad, tamano })
    if (uso.porTexto) {
      evaluacion.advertencias.push('El área de mixtura se leyó del nombre del área general de la capa, no del código de subcategoría.')
    }
    return { ...evaluacion, situacion: SITUACIONES.EVALUADA }
  }
  if (uso.estado === 'sin_regimen') {
    const donde = DONDE_SIN_REGIMEN[uso.categoria] ?? 'un área sin régimen de mixtura'
    return caso(
      SITUACIONES.ZONA_SIN_IDENTIFICAR,
      `El punto cae en ${donde} de ${nombre} (${uso.norma}), así que no hay tabla de usos por mixtura que comparar.`,
      'Marca el punto sobre un predio (no sobre una calle, un río, un parque o un equipamiento), en un área de baja, media o alta mixtura.'
    )
  }
  if (uso.estado === 'varias_areas') {
    return caso(
      SITUACIONES.VARIAS_ZONAS,
      `El punto cae en más de un área de mixtura (${uso.codigos.join(', ')}) y GeoAburrá no elige una por ti.`,
      'Mueve el punto hacia el interior de una sola área.'
    )
  }
  if (uso.estado === 'sin_codigo') {
    return caso(
      SITUACIONES.ZONA_SIN_IDENTIFICAR,
      `La capa de usos de ${nombre} devolvió datos, pero no se pudo leer el área de mixtura.`,
      'Revisar el formato de la capa de usos [verificar].'
    )
  }
  return caso(
    SITUACIONES.ZONA_SIN_IDENTIFICAR,
    `No se pudo identificar el área de mixtura de ${nombre} en este punto: la capa de usos no devolvió datos.`,
    'Marca un punto dentro del suelo urbano o inténtalo de nuevo. El régimen cargado es solo de suelo urbano.'
  )
}

function valorarEnvigado({ instrumento, resultadoTerritorial, actividad, catalogo, ciiuElegido, caso, nombre }) {
  const z = zonaDeEnvigado(resultadoTerritorial)
  if (z.estado === 'ok') {
    const m = actividad.mapeoCiiu?.Envigado
    const candidatas = (CIIU_CANDIDATOS[actividad.id] ?? []).map((ciiu) => ({
      ciiu,
      descripcion: instrumento.reglasPorCiiu.find((r) => r.ciiu === ciiu)?.descripcion ?? ''
    }))
    const esSuposicion = m && m.confianza !== 'explicita'
    const fila = esSuposicion ? candidatas.find((c) => c.ciiu === ciiuElegido) : null
    let catalogoUsado = catalogo
    if (fila) {
      const conEleccion = { ...actividad, mapeoCiiu: { Envigado: { ...m, ciiu: fila.ciiu, descripcionFila: fila.descripcion, confianza: 'explicita' } } }
      catalogoUsado = (catalogo ?? ACTIVIDADES).map((a) => (a.id === actividad.id ? conEleccion : a))
    }
    const evaluacion = evaluarPorCiiu({ instrumento, municipioSlug: 'Envigado', zonaCodigo: z.zonaCodigo, actividadId: actividad.id, catalogo: catalogoUsado })
    const sinElegir = esSuposicion && !fila && candidatas.length > 0
    return {
      ...evaluacion,
      advertencias: fila
        ? [...evaluacion.advertencias, `Elegiste la fila CIIU ${fila.ciiu} (${fila.descripcion}) como la más parecida a "${actividad.nombre}". La Tabla 27 no nombra esta actividad: es una suposición, confírmala con Planeación.`]
        : evaluacion.advertencias,
      situacion: SITUACIONES.EVALUADA,
      rangos: evaluacion.rangos ?? [],
      candidatasCiiu: sinElegir ? candidatas : [],
      queFalta: sinElegir
        ? 'La Tabla 27 de Envigado clasifica por código CIIU y no nombra esta actividad. Elige la fila que más se parece para ver el resultado.'
        : evaluacion.resultado === RESULTADOS.INSUFICIENTE ? 'Confirmar esta actividad con Planeación de Envigado.' : null
    }
  }
  if (z.estado === 'varias_zonas') {
    return caso(SITUACIONES.VARIAS_ZONAS, `El punto cae en más de una zona (${z.descripciones.join(', ')}) y GeoAburrá no elige una por ti.`, 'Mueve el punto hacia el interior de una sola zona.')
  }
  if (z.estado === 'sin_columna') {
    return caso(SITUACIONES.ZONA_SIN_IDENTIFICAR, `El punto cae en "${z.descripcion}" de ${nombre}, que no es una zona de la Tabla 27.`, 'Marca el punto sobre un predio, no sobre espacio público.')
  }
  if (z.estado === 'sin_equivalencia') {
    return caso(
      SITUACIONES.ZONA_SIN_IDENTIFICAR,
      `La capa llama a esta zona "${z.descripcion}", y todavía no hay una equivalencia verificada con las 9 zonas de la Tabla 27 de ${nombre}.`,
      'Falta verificar con el acuerdo a qué zona de la Tabla 27 corresponde esta descripción.'
    )
  }
  return caso(SITUACIONES.ZONA_SIN_IDENTIFICAR, `No se pudo leer la zona de ${nombre} en este punto: la capa de uso urbano no devolvió datos.`, 'Marca un punto dentro del suelo urbano o inténtalo de nuevo.')
}

function valorarSabaneta({ instrumento, resultadoTerritorial, actividad, tamano, catalogo, caso, nombre }) {
  const z = zonaDeSabaneta(resultadoTerritorial)
  if (z.estado === 'ok') {
    const evaluacion = evaluarSabaneta({ instrumento, zonaId: z.zonaId, actividadId: actividad.id, tamano, catalogo })
    evaluacion.advertencias.push(`La zona de mezcla se leyó del nombre que publica la capa ("${z.descripcion}"), no de un código oficial [verificar].`)
    return { ...evaluacion, situacion: SITUACIONES.EVALUADA }
  }
  if (z.estado === 'varias_zonas') {
    return caso(SITUACIONES.VARIAS_ZONAS, `El punto cae en más de una zona de mezcla (${z.descripciones.join(', ')}) y GeoAburrá no elige una por ti.`, 'Mueve el punto hacia el interior de una sola zona.')
  }
  if (z.estado === 'sin_regimen') {
    return caso(
      SITUACIONES.ZONA_SIN_IDENTIFICAR,
      `El punto cae en ${z.categoria} ("${z.descripcion}") de ${nombre}, así que no hay tabla de usos por mezcla que comparar.`,
      'Marca el punto sobre un predio (no sobre una calle, un parque, un equipamiento o suelo forestal), en un área de baja, media o alta mezcla.'
    )
  }
  if (z.estado === 'sin_equivalencia') {
    return caso(
      SITUACIONES.ZONA_SIN_IDENTIFICAR,
      `La capa llama a esta zona "${z.descripcion}", y todavía no hay una equivalencia verificada con las zonas de mezcla del PBOT de ${nombre}.`,
      'Falta verificar a qué zona de mezcla del PBOT corresponde esta descripción.'
    )
  }
  return caso(SITUACIONES.ZONA_SIN_IDENTIFICAR, `No se pudo leer la zona de mezcla de ${nombre} en este punto: la capa de uso urbano no devolvió datos.`, 'Marca un punto dentro del suelo urbano o inténtalo de nuevo.')
}

const ETIQUETA_CATEGORIA_LE = {
  principal: 'uso principal',
  complementario: 'uso complementario',
  restringido: 'uso restringido (exige controles espaciales y ambientales)',
  prohibido: 'uso prohibido'
}

function lineasPorAreaLE(codigo) {
  return estadoEnAreas(codigo).map((e) => {
    const texto = e.categoria ? ETIQUETA_CATEGORIA_LE[e.categoria] : 'no listado: la norma lo trata como prohibido'
    return `${e.nombre}: ${texto}${e.contradictoria ? ' (la tabla lo lista en dos categorías; se toma la más restrictiva)' : ''}`
  })
}

// La norma de La Estrella asigna los usos por área de actividad y ninguna capa dice en qué área cae el punto:
// nunca concluye. Si la persona elige el área (y la tipología, cuando la norma no nombra la actividad), la lectura
// va marcada "según lo que elegiste (no concluye)".
function valorarLaEstrella({ instrumento, actividad, tipologiaElegida, areaElegida, catalogo, caso, nombre }) {
  const m = actividad.mapeos?.LaEstrella
  if (!m) {
    return caso(
      SITUACIONES.ZONA_SIN_IDENTIFICAR,
      `La norma cargada de ${nombre} no nombra "${actividad.nombre}" como una tipología de uso, así que no se puede concluir.`,
      'Confirmar esta actividad con Planeación de La Estrella.'
    )
  }
  const candidatas = TIPOLOGIAS_CANDIDATAS.LaEstrella?.[actividad.id] ?? []
  const explicita = m.confianza === 'explicita'
  const eligio = !explicita && candidatas.includes(tipologiaElegida)
  const codigo = explicita ? m.tipologia : eligio ? tipologiaElegida : null
  const tipologia = codigo ? instrumento.tipologias.find((t) => t.codigo === codigo) : null
  const area = areaElegida ? (instrumento.zonas.find((z) => z.codigo === areaElegida) ?? null) : null

  const evaluacion = evaluarActividad({ instrumento, municipioSlug: 'LaEstrella', zona: area, actividadId: actividad.id, catalogo })

  const motivo =
    !explicita && !eligio
      ? `La norma no nombra "${actividad.nombre}". La tipología más cercana sería ${m.tipologia}, pero es una suposición: ${m.nota.replace(/\s*\[verificar\]\s*/g, ' ').trim()}`
      : area
        ? `La norma trata ${actividad.nombre} (${codigo}) en ${area.nombre}, pero GeoAburrá no puede comprobar que el punto esté en esa área de actividad.`
        : 'La norma de La Estrella asigna los usos por área de actividad y no hay una capa que diga en qué área cae el punto. GeoAburrá no elige el área por ti.'

  const queFalta =
    !explicita && !eligio
      ? 'Elige la tipología que más se parece a tu negocio y, si la conoces, el área de actividad de tu predio.'
      : area
        ? 'Confirma con Planeación de La Estrella que tu predio esté en esa área de actividad.'
        : 'Elige el área de actividad de tu predio (aparece en la cartografía del PBOT) o confírmala con Planeación. Abajo ves cómo trata cada área esta actividad.'

  let lecturaElegida = null
  if (tipologia && area) {
    const base = evaluarTipologiaElegida({ instrumento, zona: area, tipologiaCodigo: codigo })
    lecturaElegida = {
      ...base,
      zonaCodigo: area.nombre,
      titulo: eligio ? 'Lectura según la tipología y el área que elegiste (no concluye)' : 'Lectura según el área que elegiste (no concluye)',
      aviso: 'Vale solo si tu predio está en esa área de actividad: GeoAburrá no puede comprobarlo desde el punto.'
    }
  }

  const advertencias = [...evaluacion.advertencias]
  if (area) advertencias.push(...area.observaciones)
  const alterna = area ? lecturaAlterna(area, actividad.id) : null
  if (alterna) advertencias.push(alterna.texto)
  else if (LECTURAS_ALTERNAS[actividad.id]) advertencias.push(LECTURAS_ALTERNAS[actividad.id].motivo)
  advertencias.push(...avisosDeActividad(actividad.id))

  return {
    ...evaluacion,
    resultado: RESULTADOS.INSUFICIENTE,
    situacion: SITUACIONES.ZONA_SIN_IDENTIFICAR,
    explicacion: motivo,
    razones: [motivo],
    condiciones: [],
    requiereVerificarUbicacion: false,
    porArea: tipologia ? lineasPorAreaLE(codigo) : [],
    advertencias,
    queFalta,
    datos: {
      ...evaluacion.datos,
      zonaCodigo: null,
      tipologia: tipologia ? { codigo: tipologia.codigo, nombre: tipologia.nombre, ...(explicita ? {} : { sugerida: true }) } : evaluacion.datos.tipologia
    },
    lecturaElegida
  }
}

// zonaResultado: lo que devuelve consultarZonaItagui (solo Itagüí).
// resultadoTerritorial: el resultado de la consulta territorial del punto (solo Medellín).
// tamano: { areaM2, aforo } que informa la persona (solo Medellín).
export function valorarPunto({ municipio, zonaResultado = null, resultadoTerritorial = null, tamano = {}, actividadId, tipologiaElegida = null, catalogo, ciiuElegido = null, areaElegida = null }) {
  const actividad = actividadPorId(actividadId, catalogo)
  const nombre = municipio?.nombre ?? 'este municipio'
  const caso = (situacion, motivo, queFalta) => sinConcluir({ situacion, motivo, queFalta, actividad, municipio })

  if (!actividad) {
    return caso(SITUACIONES.ACTIVIDAD_NO_ELEGIDA, 'Todavía no elegiste una actividad.', 'Elige la actividad que quieres evaluar.')
  }

  if (municipio?.estado === 'ambiguo') {
    return caso(
      SITUACIONES.MUNICIPIO_SIN_DETERMINAR,
      'El punto está cerca del límite entre municipios y aún no elegiste uno.',
      'Elige el municipio en la parte de arriba del panel.'
    )
  }
  if (municipio?.estado === 'fuera_de_cobertura') {
    return caso(
      SITUACIONES.FUERA_DE_COBERTURA,
      'El punto está fuera de los 10 municipios del Valle de Aburrá.',
      'Marca un punto dentro del Valle de Aburrá.'
    )
  }
  const clave = claveMunicipio(municipio)
  if (!clave) {
    return caso(
      SITUACIONES.MUNICIPIO_SIN_DETERMINAR,
      'No se pudo determinar el municipio del punto.',
      'Marca otro punto o inténtalo de nuevo.'
    )
  }

  const instrumento = buscarInstrumento(municipio, clave)
  if (!instrumento) {
    return caso(
      SITUACIONES.NORMA_NO_CARGADA,
      `La norma de ${nombre} aún no está cargada en GeoAburrá.`,
      'Por ahora solo Itagüí, Medellín, Envigado y Sabaneta tienen el punto conectado con su norma.'
    )
  }

  if (clave === 'medellin') {
    return valorarMedellin({ instrumento, resultadoTerritorial, actividad, tamano, caso, nombre })
  }

  if (clave === 'envigado') {
    return valorarEnvigado({ instrumento, resultadoTerritorial, actividad, catalogo, ciiuElegido, caso, nombre })
  }

  if (clave === 'sabaneta') {
    return valorarSabaneta({ instrumento, resultadoTerritorial, actividad, tamano, catalogo, caso, nombre })
  }

  if (clave === 'laestrella') {
    return valorarLaEstrella({ instrumento, actividad, tipologiaElegida, areaElegida, catalogo, caso, nombre })
  }

  if (clave !== 'itagui') {
    return caso(
      SITUACIONES.ZONA_SIN_IDENTIFICAR,
      `La norma de ${nombre} está cargada, pero el punto todavía no se conecta con sus zonas.`,
      'Falta la consulta de zona de este municipio.'
    )
  }

  const estado = zonaResultado?.estado
  if (estado === 'ok') {
    const zona = zonaResultado.zona
    const evaluacion = evaluarActividad({
      instrumento,
      municipioSlug: SLUG_NORMA[clave],
      zona,
      actividadId,
      catalogo
    })
    const llegoALaZona = Boolean(evaluacion.datos.tipologia && !evaluacion.datos.tipologia.sugerida)
    const candidatas = TIPOLOGIAS_CANDIDATAS[SLUG_NORMA[clave]]?.[actividadId] ?? []
    const lecturaElegida =
      tipologiaElegida && candidatas.includes(tipologiaElegida)
        ? evaluarTipologiaElegida({ instrumento, zona, tipologiaCodigo: tipologiaElegida })
        : null
    // Los avisos de la zona (lectura de la capa, dotacional, notas de la transcripción) se muestran siempre que
    // se haya mirado la tabla de la zona: con resultado concluyente, con lectura hipotética o con lectura elegida.
    const miroLaZona = llegoALaZona || Boolean(evaluacion.hipotesis) || Boolean(lecturaElegida)
    const transcrita = instrumento.zonas.find((z) => z.codigo === zona.codigo) ?? null
    return {
      ...evaluacion,
      advertencias: miroLaZona ? [...evaluacion.advertencias, ...avisosDeZona(zona, transcrita)] : evaluacion.advertencias,
      situacion: SITUACIONES.EVALUADA,
      queFalta: null,
      datos: { ...evaluacion.datos, zonaAreaActividad: zona.areaActividad ?? null },
      lecturaElegida
    }
  }
  if (estado === 'sin_codigo') {
    const detalle = zonaResultado.subtipo ?? zonaResultado.areaActividad
    return caso(
      SITUACIONES.ZONA_SIN_IDENTIFICAR,
      `El punto cae en un área sin zona de actividad con código${detalle ? ` (${detalle})` : ''}, así que no hay tabla de usos que comparar.`,
      'Marca un punto dentro de una zona de actividad.'
    )
  }
  if (estado === 'sin_poligono') {
    return caso(
      SITUACIONES.ZONA_SIN_IDENTIFICAR,
      'El punto no cae en ningún polígono de la capa de áreas de actividad de Itagüí.',
      'Marca un punto dentro del municipio.'
    )
  }
  if (estado === 'varias_zonas') {
    return caso(
      SITUACIONES.VARIAS_ZONAS,
      `El punto cae en más de una zona (${(zonaResultado.codigos ?? []).join(', ')}) y GeoAburrá no elige una por ti.`,
      'Mueve el punto hacia el interior de una sola zona.'
    )
  }
  if (estado === 'timeout') {
    return caso(
      SITUACIONES.ERROR_ZONA,
      'El servidor del municipio tardó demasiado en responder.',
      'Inténtalo de nuevo o marca otro punto.'
    )
  }
  if (estado === 'error_red') {
    return caso(
      SITUACIONES.ERROR_ZONA,
      'No hay conexión con el servidor del municipio.',
      'Revisa tu conexión e inténtalo de nuevo.'
    )
  }
  return caso(
    SITUACIONES.ERROR_ZONA,
    'No se pudo consultar la zona de actividad en el servidor del municipio.',
    'Inténtalo de nuevo en unos minutos o marca otro punto.'
  )
}