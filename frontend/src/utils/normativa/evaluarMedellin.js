// Evaluación de una actividad en un área de mixtura de Medellín (Acuerdo 48 de 2014, arts. 255 y 260).
// Función pura: sin red ni React. Lee la matriz SI/NO de localización permitida (por tamaño o aforo) y la tabla de
// exigencia del PAU. No usa las listas por subcategoría: las reglas r1 y r5 del art. 255 se solapan y el acuerdo
// no dice cuál prima. NUNCA dice "autorizado": es una lectura orientativa de la norma cargada.

import { ACTIVIDADES_MEDELLIN, GRUPOS_MATRIZ } from './actividadesMedellin.js'
import { AVISO_EVALUACION, RESULTADOS } from './evaluar.js'

const FUENTE_ART_256 = { articulo: '256', paginaPdf: 360 }
const AVISO_CAPA =
  'El área de mixtura sale de la capa de usos del suelo urbano, que es una aproximación técnica del Mapa 23: prevalece el mapa protocolizado del acuerdo.'
const AVISO_EXTRACCION = 'Los datos de la norma de Medellín se extrajeron del texto del PDF por programa, sin revisión humana.'
const AVISO_ALCANCE =
  'Solo se evalúa el régimen de usos del suelo urbano: no se evalúan porcentajes de vivienda, ruido ni el contenido del PAU.'
const ETIQUETA_ALTA = 'Áreas y corredores de alta mixtura (subcategoría sin precisar)'

const referencia = (etiqueta, fuente) => ({
  etiqueta,
  articulo: fuente?.articulo ?? null,
  paginaPdf: fuente?.paginaPdf ?? null,
  url: null
})

const filaPorPatron = (matriz, patron) => {
  const hallazgos = matriz.filter((f) => f.actividad.toLowerCase().includes(patron))
  return hallazgos.length === 1 ? hallazgos[0] : null
}

// true si todas dicen SÍ, false si todas dicen NO, null si hay mezcla
function combinar(valores) {
  if (valores.length === 0) return null
  if (valores.every((v) => v === true)) return true
  if (valores.every((v) => v === false)) return false
  return null
}

function rangosAplicables(grupo, rangos, tamano) {
  if (grupo.tamano === 'area') {
    const a = tamano.areaM2
    if (!(Number.isFinite(a) && a > 0)) return null
    return rangos.filter((r) => a >= r.min && a <= r.max)
  }
  const f = tamano.aforo
  if (!Number.isInteger(f) || f < 1 || f > 4) return null
  return rangos.filter((r) => r.aforos.includes(f))
}

const sinMarcaVerificar = (texto) => String(texto ?? '').replace(/\s*\[verificar\]/gi, '')

export function evaluarMedellin({ instrumento, areaIds = [], actividad, tamano = {} }) {
  const regimen = instrumento?.regimenMixtura
  const salida = {
    resultado: RESULTADOS.INSUFICIENTE,
    explicacion: '',
    razones: [],
    condiciones: [],
    requiereVerificarUbicacion: false,
    requisitosDeTipologia: [],
    contexto: [],
    referencias: [],
    advertencias: [],
    rangos: [],
    queFalta: null,
    datos: {
      actividad: actividad ? { id: actividad.id, nombre: actividad.nombre } : null,
      municipioSlug: 'Medellin',
      zonaCodigo: null,
      areaMixtura: null,
      tipologia: null,
      tamano: { areaM2: tamano.areaM2 ?? null, aforo: tamano.aforo ?? null },
      instrumento: instrumento
        ? { nombre: instrumento.nombre, fechaAdopcion: instrumento.fechaAdopcion, cobertura: instrumento.cobertura }
        : null
    },
    aviso: AVISO_EVALUACION
  }
  const insuficiente = (motivo, queFalta = null) => {
    salida.resultado = RESULTADOS.INSUFICIENTE
    salida.razones = [motivo]
    salida.explicacion = motivo
    salida.queFalta = queFalta
    return salida
  }

  if (!regimen) return insuficiente('Todavía no hay norma cargada para Medellín.')
  const config = actividad ? ACTIVIDADES_MEDELLIN[actividad.id] : null
  if (!config) {
    return insuficiente(
      `La norma de Medellín no nombra "${actividad?.nombre ?? 'esta actividad'}" de forma que se pueda leer en su matriz de usos, así que no se puede concluir.`
    )
  }
  const areas = areaIds.map((id) => regimen.areas.find((a) => a.id === id)).filter(Boolean)
  if (areas.length === 0 || areas.length !== areaIds.length) {
    return insuficiente('No se pudo identificar el área de mixtura del punto en Medellín.', 'Marca otro punto dentro del suelo urbano.')
  }
  salida.datos.areaMixtura = { id: areas.length === 1 ? areas[0].id : null, nombre: areas.length === 1 ? areas[0].nombre : ETIQUETA_ALTA }
  const nombreArea = salida.datos.areaMixtura.nombre

  const grupo = GRUPOS_MATRIZ[config.grupo]
  const rangos = grupo.rangos.map((r) => ({ ...r, filaMatriz: filaPorPatron(regimen.matriz, r.fila) }))
  if (rangos.some((r) => !r.filaMatriz)) {
    return insuficiente('No se encontró en los datos cargados la fila de la matriz de usos para esta actividad.')
  }

  const valorDeRango = (r) => combinar(areas.map((a) => r.filaMatriz.permitido[a.id]))
  salida.rangos = rangos.map((r) => ({ etiqueta: r.etiqueta, permitido: valorDeRango(r) }))

  const aplicables = rangosAplicables(grupo, rangos, tamano)
  const usados = aplicables ?? rangos
  // Con tamaño informado, un valor justo en un corte cae en dos filas: basta un NO para que sea NO (lectura restrictiva).
  // Sin tamaño, solo se concluye si todos los rangos coinciden.
  const valores = usados.map(valorDeRango)
  const permitido = aplicables && valores.includes(false) ? false : combinar(valores)
  const queTamano = grupo.tamano === 'area' ? 'el área del local' : 'el aforo'
  const etiquetas = usados.map((r) => r.etiqueta).join(' y ')
  for (const r of usados) {
    const ref = referencia(`Localización permitida por área de mixtura (${r.etiqueta})`, r.filaMatriz.fuente)
    if (!salida.referencias.some((x) => x.paginaPdf === ref.paginaPdf && x.etiqueta === ref.etiqueta)) salida.referencias.push(ref)
  }

  salida.advertencias.push(sinMarcaVerificar(instrumento.vigencia?.nota), AVISO_EXTRACCION, AVISO_CAPA, AVISO_ALCANCE, ...config.avisos)
  if (aplicables) salida.advertencias.push('El tamaño o el aforo lo informaste tú: GeoAburrá no lo verifica.')
  if (areas.length > 1) {
    salida.advertencias.push(
      'La capa ubica el punto en alta mixtura sin precisar la subcategoría (centralidades, transformación o predominancia económica): el resultado solo se concluye si las tres coinciden.'
    )
  }
  salida.advertencias = salida.advertencias.filter(Boolean)

  if (permitido === null) {
    if (!aplicables) {
      return insuficiente(
        `En ${nombreArea}, la norma de Medellín permite o no "${actividad.nombre}" según ${queTamano}.`,
        `Indica ${queTamano} para concluir.`
      )
    }
    return insuficiente(
      `La capa ubica el punto en alta mixtura sin precisar la subcategoría, y las tres dan resultados distintos para "${actividad.nombre}" con ese tamaño.`,
      'Hay que precisar la subcategoría de alta mixtura del predio (centralidades, transformación o predominancia económica).'
    )
  }

  const cuando = aplicables ? `(${etiquetas})` : `(para cualquier ${grupo.tamano === 'area' ? 'tamaño' : 'aforo'})`
  if (permitido === false) {
    salida.resultado = RESULTADOS.INCOMPATIBLE
    salida.razones.push(`La tabla de localización permitida (art. 255) dice NO para ${actividad.nombre} ${cuando} en ${nombreArea}.`)
    const dondeSi = regimen.areas.filter((a) => usados.every((r) => r.filaMatriz.permitido[a.id])).map((a) => a.nombre)
    if (dondeSi.length > 0) {
      salida.razones.push(`Con ese ${grupo.tamano === 'area' ? 'tamaño' : 'aforo'}, la tabla sí la permite en: ${dondeSi.join('; ')}.`)
    }
    salida.explicacion = salida.razones.join(' ')
    return salida
  }

  // Permitido por la matriz: falta ver si exige PAU (art. 260 y, para el comercio grande, art. 256)
  salida.razones.push(`La tabla de localización permitida (art. 255) dice SÍ para ${actividad.nombre} ${cuando} en ${nombreArea}.`)
  const filasPau = config.pau.flatMap((p) => regimen.requierePau.filter((x) => x.subcategoria.toLowerCase().includes(p)))
  let pau = null
  if (filasPau.length > 0) {
    pau = filasPau.some((x) => x.requiere)
    salida.referencias.push(referencia('Exigencia de PAU', filasPau[0].fuente))
  } else if (config.pauSiAreaMayorA && Number.isFinite(tamano.areaM2) && tamano.areaM2 > config.pauSiAreaMayorA) {
    pau = true
    salida.referencias.push(referencia('Exigencia de PAU (actividades económicas singulares)', FUENTE_ART_256))
  }

  if (pau === false) {
    salida.resultado = RESULTADOS.COMPATIBLE
    salida.razones.push('La tabla de PAU (art. 260) indica que esta actividad no lo requiere.')
  } else {
    salida.resultado = RESULTADOS.CONDICIONADA
    salida.condiciones.push(
      pau === true
        ? 'Requiere protocolo ambiental y urbanístico (PAU): el instrumento de control que permite viabilizar su localización (art. 260).'
        : 'La tabla de PAU (art. 260) no nombra esta actividad con este tamaño: confirma con Planeación si necesita PAU.'
    )
  }
  salida.explicacion = [salida.razones.join(' '), ...salida.condiciones].join(' ')
  return salida
}