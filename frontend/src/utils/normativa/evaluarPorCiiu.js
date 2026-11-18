// Evaluación por CIIU y zona (modelo de Envigado, Tabla 27). Función pura, sin red ni React.
// P => compatible; C => compatible (complementario); R => compatible_bajo_condiciones (art. 184);
// celda vacía => insuficiente (el acuerdo no la define ni dice que sea prohibida); sin zona o sin CIIU => insuficiente.
// No sustituye a evaluarActividad (Itagüí). NUNCA dice "autorizado".

import { actividadPorId } from './actividades.js'
import { RESULTADOS, AVISO_EVALUACION } from './evaluar.js'

const ref = (etiqueta, f) => (f ? { etiqueta, articulo: f.articulo ?? null, paginaPdf: f.paginaPdf ?? null, url: f.url ?? null } : null)

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

export function evaluarPorCiiu({ instrumento, municipioSlug, zonaCodigo = null, actividadId, catalogo }) {
  const actividad = actividadPorId(actividadId, catalogo)
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
    datos: {
      actividad: actividad ? { id: actividad.id, nombre: actividad.nombre } : null,
      municipioSlug: municipioSlug ?? null,
      zonaCodigo: zonaCodigo ?? null,
      ciiu: null,
      letra: null,
      instrumento: instrumento ? { nombre: instrumento.nombre, fechaAdopcion: instrumento.fechaAdopcion, cobertura: instrumento.cobertura } : null
    },
    aviso: AVISO_EVALUACION
  }
  const insuficiente = (motivo) => {
    salida.resultado = RESULTADOS.INSUFICIENTE
    salida.razones.push(motivo)
    salida.explicacion = motivo
    return salida
  }

  if (!actividad) return insuficiente('La actividad elegida no está en el catálogo.')
  if (!instrumento?.reglasPorCiiu) return insuficiente('Todavía no hay norma por CIIU cargada para este municipio.')
  salida.advertencias.push(...advertenciasDe(instrumento))

  const m = actividad.mapeoCiiu?.[municipioSlug]
  if (!m) return insuficiente(`La norma cargada no identifica "${actividad.nombre}" con un código CIIU, así que no se puede concluir.`)
  salida.datos.ciiu = m.ciiu
  if (m.confianza !== 'explicita') {
    return insuficiente(`La tabla no nombra "${actividad.nombre}". La fila CIIU ${m.ciiu} (${m.descripcionFila}) sería la más cercana, pero es una suposición: ${m.nota}`)
  }
  if (!zonaCodigo) return insuficiente('Zona sin identificar: no se puede leer la columna de la Tabla 27.')
  const zona = instrumento.zonas.find((z) => z.codigo === zonaCodigo)
  if (!zona) return insuficiente(`La zona ${zonaCodigo} no está cargada.`)

  const regla = instrumento.reglasPorCiiu.find((r) => r.ciiu === m.ciiu)
  if (!regla) {
    const sin = (instrumento.sinInterpretar ?? []).find((s) => s.ciiu === m.ciiu)
    return insuficiente(
      sin
        ? `La fila CIIU ${m.ciiu} de la Tabla 27 no pudo asignarse a sus zonas (${sin.motivo}) [verificar con el PDF].`
        : `La fila CIIU ${m.ciiu} no figura en la Tabla 27 cargada.`
    )
  }
  salida.referencias.push(ref(`Tabla 27, CIIU ${regla.ciiu}`, regla.fuente), ref(`Zona ${zona.nombre}`, zona.fuente))

  const letra = regla.porZona[zona.codigo]
  salida.datos.letra = letra ?? null
  const base = `${actividad.nombre} (CIIU ${regla.ciiu}) en ${zona.nombre}`
  if (letra === 'P') {
    salida.resultado = RESULTADOS.COMPATIBLE
    salida.razones.push('La Tabla 27 la señala como uso principal (P).')
  } else if (letra === 'C') {
    salida.resultado = RESULTADOS.COMPATIBLE
    salida.razones.push('La Tabla 27 la señala como uso complementario (C).')
  } else if (letra === 'R') {
    salida.resultado = RESULTADOS.CONDICIONADA
    salida.razones.push('La Tabla 27 la señala como uso restringido (R): no es un permiso, depende de los criterios del art. 184.')
    salida.condiciones.push(...instrumento.criteriosRestringido.criterios)
    salida.referencias.push(ref('Criterios de uso restringido', { articulo: instrumento.criteriosRestringido.articulo, paginaPdf: instrumento.criteriosRestringido.paginaPdf }))
  } else {
    return insuficiente(
      `La Tabla 27 no define "${actividad.nombre}" (CIIU ${regla.ciiu}) en ${zona.nombre}: la celda está vacía. El acuerdo no dice que eso equivalga a prohibido; hay que consultarlo con Planeación o el Comité Municipal de Usos del Suelo.`
    )
  }
  salida.explicacion = `${base}: ${salida.razones[0]}${salida.condiciones.length ? ' Condiciones: ' + salida.condiciones.join(' ') : ''}`
  return salida
}