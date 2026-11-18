// Evaluación normativa de una actividad en una zona. Función pura: recibe los datos y devuelve un resultado
// explicado. No hace red ni usa React. NUNCA dice "autorizado": es una lectura orientativa de la norma cargada.

import { actividadPorId } from './actividades.js'

export const RESULTADOS = Object.freeze({
  COMPATIBLE: 'compatible',
  CONDICIONADA: 'compatible_bajo_condiciones',
  INCOMPATIBLE: 'incompatible',
  INSUFICIENTE: 'informacion_normativa_insuficiente'
})

export const AVISO_EVALUACION =
  'Resultado orientativo basado en la norma urbanística cargada en GeoAburrá. No es un concepto de uso del suelo, ni una licencia o autorización. Debe confirmarse con la oficina de Planeación del municipio.'

const referencia = (etiqueta, fuente) =>
  fuente
    ? { etiqueta, articulo: fuente.articulo ?? null, paginaPdf: fuente.paginaPdf ?? null, url: fuente.url ?? null }
    : null

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)

function requisitosDe(tipologia) {
  const lineas = []
  if (tipologia.areaMinimaM2) lineas.push(`Área mínima del local: ${tipologia.areaMinimaM2} m².`)
  if (tipologia.areaMinimaLoteM2) lineas.push(`Área mínima del lote: ${tipologia.areaMinimaLoteM2} m².`)
  for (const v of tipologia.variantes ?? []) {
    lineas.push(`${mayuscula(v.descripcion)}: área mínima de ${v.areaMinimaM2} m².`)
  }
  for (const r of tipologia.retiros ?? []) {
    const medida = r.medidaEntre ? ` (medido entre ${r.medidaEntre})` : ''
    lineas.push(`Retiro mínimo de ${r.metros} m a ${r.destino}${medida}.`)
  }
  return [...lineas, ...(tipologia.restricciones ?? [])]
}

function contextoDeRuido(instrumento, terminos) {
  return (instrumento.estandaresRuido ?? [])
    .filter((e) => terminos.some((t) => (e.actividadesNombradas ?? []).includes(t)))
    .map((e) => ({
      tema: 'ruido',
      texto: `${e.sector}: máximo ${e.dbDia} dB(A) de día y ${e.dbNoche} dB(A) de noche (${e.subsector}).`,
      referencia: referencia('Estándares de ruido', e.fuente)
    }))
}

function advertenciasDe(instrumento, zona) {
  const lista = []
  if (instrumento.cobertura !== 'completa') {
    lista.push('La norma de este municipio está cargada de forma parcial: puede faltar información.')
  }
  if (instrumento.vigencia?.estado !== 'vigente_segun_fuente_municipal') {
    lista.push('La vigencia de esta norma no está verificada.')
  } else {
    lista.push('La vigencia sale de documentos municipales; no se verificó en la gaceta oficial.')
  }
  if (zona?.fuente?.origen === 'capa_oficial') {
    lista.push(
      'La tabla de la zona viene de la capa oficial que publica el municipio, leída en el momento de la consulta; no se contrastó con el texto del acuerdo.'
    )
  } else if (zona?.fuente?.verificacion === 'transcrito_de_imagen') {
    lista.push('Los datos de la zona se transcribieron de un PDF escaneado, sin doble lectura.')
  }
  if (Array.isArray(instrumento.limitaciones)) {
    for (const l of instrumento.limitaciones) lista.push(String(l?.texto ?? l?.resumen ?? l))
  }
  return lista
}

// Condiciones que trae la nota de una marca (asterisco) para una tipología.
function condicionesDeNota(nota, codigo) {
  if (!nota) return []
  const lineas = [nota.texto]
  for (const [clave, valor] of Object.entries(nota.condiciones?.[codigo] ?? {})) {
    if (clave === 'retiroAOtraDeLaMismaTipologiaM') lineas.push(`Retiro de ${valor} m a otra de la misma tipología.`)
    if (clave === 'areaMinimaM2') lineas.push(`Área mínima de ${valor} m².`)
  }
  if (nota.truncada) lineas.push('El texto de esta nota llega cortado desde la fuente.')
  return lineas
}

function hipotesisDe(tipologia, zona) {
  const codigo = tipologia.codigo
  const sinLista = zona.compatibles.length === 0 && zona.condicionados.length === 0
  const esCompatible = zona.compatibles.includes(codigo)
  const esCondicionada = zona.condicionados.includes(codigo)
  const estado = sinLista
    ? 'sin_lista'
    : esCompatible && esCondicionada
      ? 'contradictoria'
      : esCompatible
        ? 'compatible'
        : esCondicionada
          ? 'condicionada'
          : (zona.prohibidosCodigos ?? []).includes(codigo)
            ? 'prohibida'
            : 'no_listada'
  const marca = zona.marcas?.[codigo] ?? null
  return {
    tipologia: codigo,
    nombre: tipologia.nombre,
    zonaCodigo: zona.codigo,
    estadoEnZona: estado,
    marca,
    condiciones: marca
      ? condicionesDeNota(zona.notasMarcas?.[marca], codigo)
      : estado === 'condicionada' && zona.reglaCondicionados
        ? [zona.reglaCondicionados]
        : [],
    requisitos: requisitosDe(tipologia),
    referencias: [referencia(`Tipología ${codigo}`, tipologia.fuente), referencia(`Tabla de la zona ${zona.codigo}`, zona.fuente)].filter(Boolean),
    aviso: 'Lectura hipotética: la norma no nombra esta actividad. Solo muestra cómo trata la zona la tipología más cercana; no es una conclusión.'
  }
}

export function evaluarActividad({ instrumento, municipioSlug, zonaCodigo, zona: zonaDada = null, actividadId, catalogo }) {
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
      zonaCodigo: zonaDada?.codigo ?? zonaCodigo ?? null,
      tipologia: null,
      instrumento: instrumento
        ? { nombre: instrumento.nombre, fechaAdopcion: instrumento.fechaAdopcion, cobertura: instrumento.cobertura }
        : null
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
  if (!instrumento) return insuficiente('Todavía no hay norma cargada para este municipio.')

  salida.contexto.push(...contextoDeRuido(instrumento, actividad.terminosNorma ?? []))
  salida.advertencias.push(...advertenciasDe(instrumento, null))

  const m = actividad.mapeos?.[municipioSlug]
  if (!m) {
    return insuficiente(`La norma cargada no nombra "${actividad.nombre}" como una tipología de uso, así que no se puede concluir.`)
  }
  if (m.confianza !== 'explicita') {
    salida.datos.tipologia = { codigo: m.tipologia, sugerida: true }
    const sugerida = instrumento.tipologias.find((t) => t.codigo === m.tipologia)
    const zonaH = zonaDada ?? instrumento.zonas.find((z) => z.codigo === zonaCodigo)
    if (sugerida && zonaH) {
      salida.hipotesis = hipotesisDe(sugerida, zonaH)
      salida.advertencias = advertenciasDe(instrumento, zonaH)
    }
    return insuficiente(
      `La norma no nombra "${actividad.nombre}". La tipología más cercana sería ${m.tipologia}, pero es una suposición: ${m.nota.replace(/\s*\[verificar\]\s*/g, ' ').trim()}`
    )
  }

  const tipologia = instrumento.tipologias.find((t) => t.codigo === m.tipologia)
  if (!tipologia) return insuficiente(`La tipología ${m.tipologia} aún no está cargada.`)
  salida.datos.tipologia = { codigo: tipologia.codigo, nombre: tipologia.nombre }
  salida.requisitosDeTipologia = requisitosDe(tipologia)
  salida.referencias.push(referencia(`Tipología ${tipologia.codigo}`, tipologia.fuente))

  const zona = zonaDada ?? instrumento.zonas.find((z) => z.codigo === zonaCodigo)
  if (!zona) {
    return insuficiente(`La zona ${zonaCodigo ?? '(sin identificar)'} no está cargada, así que no se puede comparar con su tabla de usos.`)
  }
  salida.advertencias = advertenciasDe(instrumento, zona)
  salida.referencias.push(referencia(`Tabla de la zona ${zona.codigo}`, zona.fuente))

  if (zona.compatibles.length === 0 && zona.condicionados.length === 0) {
    return insuficiente(
      `La tabla de la zona ${zona.codigo} no trae una lista de usos (puede ser una zona dotacional o de espacio público), así que no se puede concluir.`
    )
  }

  const prohibidaPorTipologia = (tipologia.restricciones ?? []).some((r) => /^no se permite\.?$/i.test(r.trim()))
  const esCompatible = zona.compatibles.includes(tipologia.codigo)
  const esCondicionada = zona.condicionados.includes(tipologia.codigo)

  if (prohibidaPorTipologia) {
    salida.resultado = RESULTADOS.INCOMPATIBLE
    salida.razones.push(`La tipología ${tipologia.codigo} (${tipologia.nombre}) figura como no permitida.`)
  } else if (!esCompatible && !esCondicionada && (zona.prohibidosCodigos ?? []).includes(tipologia.codigo)) {
    salida.resultado = RESULTADOS.INCOMPATIBLE
    salida.razones.push(`La tabla de la zona ${zona.codigo} clasifica la tipología ${tipologia.codigo} (${tipologia.nombre}) como uso prohibido.`)
  } else if (!esCompatible && !esCondicionada) {
    salida.resultado = RESULTADOS.INCOMPATIBLE
    salida.razones.push(
      `La tabla de la zona ${zona.codigo} no lista la tipología ${tipologia.codigo}, y esa tabla trata como prohibidos ${zona.prohibidos}.`
    )
  } else {
    if (esCompatible && esCondicionada) {
      salida.resultado = RESULTADOS.CONDICIONADA
      salida.razones.push(
        `La tabla de la zona ${zona.codigo} lista la tipología ${tipologia.codigo} como compatible y también como condicionada; se toma la lectura más restrictiva.`
      )
      salida.advertencias.push('La tabla de la zona se contradice en esta tipología: conviene confirmarla con Planeación.')
    } else {
      salida.resultado = esCompatible ? RESULTADOS.COMPATIBLE : RESULTADOS.CONDICIONADA
      salida.razones.push(
        `La tabla de la zona ${zona.codigo} lista la tipología ${tipologia.codigo} como uso ${esCompatible ? 'compatible o complementario' : 'condicionado o restringido'}.`
      )
    }
        
    if (esCondicionada && zona.reglaCondicionados) salida.condiciones.push(zona.reglaCondicionados)

    const marca = zona.marcas?.[tipologia.codigo]
    if (marca) {
      // Una nota depende de calles, sectores o predios que la app no puede comprobar desde el punto.
      salida.resultado = RESULTADOS.CONDICIONADA
      salida.requiereVerificarUbicacion = true
      const nota = zona.notasMarcas?.[marca]
      if (nota) {
        salida.condiciones.push(nota.texto)
        if (nota.truncada) salida.advertencias.push('El texto de una nota llega cortado desde la fuente.')
        for (const [clave, valor] of Object.entries(nota.condiciones?.[tipologia.codigo] ?? {})) {
          if (clave === 'retiroAOtraDeLaMismaTipologiaM') salida.condiciones.push(`Retiro de ${valor} m a otra de la misma tipología.`)
          if (clave === 'areaMinimaM2') salida.condiciones.push(`Área mínima de ${valor} m².`)
        }
        salida.referencias.push(
          referencia(`Nota ${marca} de la zona ${zona.codigo}`, {
            articulo: zona.fuente?.articulo,
            paginaPdf: nota.paginaPdf ?? zona.fuente?.paginaPdf,
            url: zona.fuente?.url
          })
        )
      } else {
        salida.condiciones.push('La tabla marca esta tipología con un asterisco, pero su nota no está disponible.')
      }
    }
  }

  const partes = [`${actividad.nombre} (${tipologia.codigo}) en la zona ${zona.codigo}: ${salida.razones[0]}`]
  if (salida.condiciones.length) partes.push(`Condiciones de la zona: ${salida.condiciones.join(' ')}`)
  if (salida.requiereVerificarUbicacion) partes.push('Hay que verificar que el punto esté en las vías o sectores indicados.')
  salida.explicacion = partes.join(' ')
  return salida
}

// Lectura según la tipología que la persona eligió. No concluye: la norma no nombra la actividad.
export function evaluarTipologiaElegida({ instrumento, zona, tipologiaCodigo }) {
  const tipologia = instrumento?.tipologias.find((t) => t.codigo === tipologiaCodigo)
  if (!tipologia || !zona) return null
  return {
    ...hipotesisDe(tipologia, zona),
    aviso: 'Lectura según la tipología que elegiste. La norma no nombra tu actividad; confirma con Planeación cuál le corresponde.'
  }
}