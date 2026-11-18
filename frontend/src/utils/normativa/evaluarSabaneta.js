// Evaluación por zona de mezcla y negocio (modelo de Sabaneta). Función pura, sin red ni React.
// Permitido => compatible; con restricciones => compatible bajo condiciones; no permitido => incompatible (art. 193);
// "verificar" o dato que falta => insuficiente. NUNCA dice "autorizado".

import { actividadPorId } from './actividades.js'
import { AVISO_EVALUACION, RESULTADOS } from './evaluar.js'

const UMBRAL_SUPERMERCADO_M2 = 600
const RESULTADO = {
  permitido: RESULTADOS.COMPATIBLE,
  permitido_con_restricciones: RESULTADOS.CONDICIONADA,
  no_permitido: RESULTADOS.INCOMPATIBLE
}
const RAZON = {
  permitido: 'El PBOT de Sabaneta la lista como uso permitido en esta zona.',
  permitido_con_restricciones: 'El PBOT la lista en esta zona, pero con condiciones que hay que cumplir.',
  no_permitido: 'El PBOT no la lista en esta zona, y lo no listado está prohibido (art. 193).'
}

function advertenciasDe(instrumento) {
  const l = []
  if (instrumento.cobertura !== 'completa') l.push('La norma de este municipio está cargada de forma parcial: puede faltar información.')
  l.push(
    instrumento.vigencia?.estado === 'vigente_segun_fuente_municipal'
      ? 'La vigencia sale de documentos municipales; no se verificó en la gaceta oficial.'
      : 'La vigencia de esta norma no está verificada.'
  )
  for (const x of instrumento.limitaciones ?? []) l.push(String(x))
  return l
}

export function evaluarSabaneta({ instrumento, zonaId = null, actividadId, tamano = {}, catalogo }) {
  const actividad = actividadPorId(actividadId, catalogo)
  const modelo = instrumento?.modeloMezcla
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
      municipioSlug: 'Sabaneta',
      zonaCodigo: zonaId,
      tipologia: null,
      instrumento: instrumento ? { nombre: instrumento.nombre, fechaAdopcion: instrumento.fechaAdopcion, cobertura: instrumento.cobertura } : null
    },
    aviso: AVISO_EVALUACION
  }
  const insuficiente = (motivo, queFalta = null) => {
    salida.resultado = RESULTADOS.INSUFICIENTE
    salida.razones.push(motivo)
    salida.explicacion = motivo
    salida.queFalta = queFalta
    return salida
  }

  if (!actividad) return insuficiente('La actividad elegida no está en el catálogo.')
  if (!modelo) return insuficiente('Todavía no hay norma por zona de mezcla cargada para este municipio.')
  const zona = modelo.zonas.find((z) => z.codigo === zonaId)
  if (!zona) return insuficiente('Zona de mezcla sin identificar: no se puede leer la tabla del PBOT.', 'Falta saber en qué zona de mezcla cae el punto.')

  salida.advertencias.push(...advertenciasDe(instrumento))

  // Supermercado y minimercado se distinguen por el área del local (art. 200)
  const area = Number(tamano?.areaM2)
  const hayArea = Number.isFinite(area) && area > 0
  let clave = actividadId
  if (hayArea && (actividadId === 'minimercado' || actividadId === 'supermercado')) {
    clave = area >= UMBRAL_SUPERMERCADO_M2 ? 'supermercado' : 'minimercado'
    if (clave !== actividadId) {
      salida.advertencias.push(
        clave === 'supermercado'
          ? 'Con 600 m² o más, el PBOT lo trata como supermercado (gran superficie), no como minimercado.'
          : 'Con menos de 600 m², el PBOT lo trata como minimercado, no como supermercado.'
      )
    }
  }
  const negocio = modelo.negocios[clave]
  if (!negocio) {
    return insuficiente(`El extracto del PBOT de Sabaneta no incluye "${actividad.nombre}", así que no se puede concluir.`, 'Confirmarlo con la Secretaría de Planeación de Sabaneta.')
  }
  const estado = negocio.porZona[zonaId]
  if (!hayArea && actividadId === 'supermercado' && modelo.negocios.minimercado.porZona[zonaId] !== estado) {
    return insuficiente(
      'El PBOT trata distinto a un supermercado (desde 600 m²) y a un minimercado (menos de 600 m²) en esta zona.',
      'Indica el área del local para saber cuál de los dos aplica.'
    )
  }
  if (!hayArea && actividadId === 'minimercado') {
    salida.advertencias.push('Se evaluó como minimercado (menos de 600 m²). Con 600 m² o más, el PBOT lo trata como supermercado.')
  }

  salida.datos.negocioPbot = negocio.codigo
  const tabla = modelo.tablasPorZona?.[zonaId]
  const arts = negocio.fuente.articulo.replace(/\s*\(págs\..*\)$/, '')
  salida.referencias.push({
    etiqueta: `PBOT de Sabaneta, ${negocio.codigo}`,
    articulo: tabla ? `${arts}, tabla de la zona en las págs. ${tabla[0]}-${tabla[1]} del PDF` : negocio.fuente.articulo,
    paginaPdf: negocio.paginaPorZona?.[zonaId] ?? (tabla ? tabla[0] : negocio.fuente.paginaPdf),
    url: null
  })

  if (estado === 'verificar') return insuficiente(negocio.notaVerificar, 'Confirmar con la Secretaría de Planeación de Sabaneta.')

  if (actividadId === 'discoteca' && zonaId.startsWith('ALTA')) {
    salida.advertencias.push('Si es un bar sin pista de baile, el PBOT sí lista "bares" en alta mezcla: confírmalo con Planeación.')
  }
  if (zonaId === 'BAJA' && negocio.limitaTamanoEnBaja && estado !== 'no_permitido') {
    salida.advertencias.push('En baja mezcla el tamaño del local lo limita la intensidad de uso (art. 197): por ejemplo, un local de 30 m² en primer piso en consolidación con norma de solo altura.')
  }

  salida.resultado = RESULTADO[estado]
  salida.razones.push(RAZON[estado])
  if (estado === 'permitido_con_restricciones') salida.condiciones.push(...negocio.condiciones)
  else if (estado === 'permitido') salida.advertencias.push(...negocio.condiciones)
  salida.explicacion = `${actividad.nombre} · ${zona.nombre}: ${salida.razones[0]}${salida.condiciones.length ? ' Condiciones: ' + salida.condiciones.join(' ') : ''}`
  return salida
}