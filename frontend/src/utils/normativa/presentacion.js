// Convierte la valoración del motor en el texto que ve la persona. Función pura.
// Reglas de lenguaje: claro, sin jerga; nunca "autorizado".

import { RESULTADOS } from './evaluar.js'

const ETIQUETAS = {
  [RESULTADOS.COMPATIBLE]: {
    clase: 'compatible',
    titulo: 'Compatible con la zona',
    bajada: 'La tabla de usos de la zona incluye esta actividad.'
  },
  [RESULTADOS.CONDICIONADA]: {
    clase: 'condicionada',
    titulo: 'Compatible bajo condiciones',
    bajada: 'La norma la contempla en esta zona, pero con condiciones que hay que cumplir.'
  },
  [RESULTADOS.INCOMPATIBLE]: {
    clase: 'incompatible',
    titulo: 'No compatible con la zona',
    bajada: 'Según la norma cargada, esta actividad no encaja en esta zona.'
  },
  [RESULTADOS.INSUFICIENTE]: {
    clase: 'insuficiente',
    titulo: 'Información normativa insuficiente',
    bajada: 'Con lo cargado hoy no se puede concluir.'
  }
}

const AVISO_UBICACION =
  'Hay que verificar que el punto esté en las vías o sectores que indica la nota de la zona. GeoAburrá no puede comprobarlo desde el pin.'

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)

function textoReferencia(r) {
  const partes = [r.etiqueta]
  if (r.articulo) partes.push(`artículo ${r.articulo}`)
  if (r.paginaPdf) partes.push(`p. ${r.paginaPdf} del PDF`)
  return { texto: partes.join(', '), url: r.url ?? null }
}

function textoRango(r) {
  const valor = r.permitido === true ? 'SÍ' : r.permitido === false ? 'NO' : 'depende de la subcategoría de alta mixtura'
  return `${mayuscula(r.etiqueta)}: ${valor}`
}

function textoZona(datos) {
  if (datos.areaMixtura) return `Área de mixtura: ${datos.areaMixtura.nombre}`
  if (!datos.zonaCodigo) return null
  return `Zona ${datos.zonaCodigo}${datos.zonaAreaActividad ? ` · ${datos.zonaAreaActividad}` : ''}`
}

const TEXTO_ESTADO = {
  compatible: (h) => `La zona ${h.zonaCodigo} lista la tipología ${h.tipologia} como compatible.`,
  condicionada: (h) => `La zona ${h.zonaCodigo} lista la tipología ${h.tipologia} como condicionada.`,
  contradictoria: (h) =>
    `La tabla de la zona ${h.zonaCodigo} lista la tipología ${h.tipologia} como compatible y también como condicionada; se toma la lectura más restrictiva. Confirma con Planeación.`,
  no_listada: (h) => `La zona ${h.zonaCodigo} no lista la tipología ${h.tipologia}; lo no determinado se trata como prohibido.`,
  prohibida: (h) => `La zona ${h.zonaCodigo} clasifica la tipología ${h.tipologia} como prohibida.`,
  sin_lista: (h) => `La zona ${h.zonaCodigo} no trae lista de usos.`
}

function describirLectura(h, elegida) {
  return {
    titulo: h.titulo ?? (elegida ? 'Lectura según la tipología que elegiste (no concluye)' : 'Lectura hipotética (no concluye)'),
    tipologia: `${h.tipologia} · ${h.nombre}`,
    texto: TEXTO_ESTADO[h.estadoEnZona]?.(h) ?? '',
    condiciones: h.condiciones ?? [],
    requisitos: h.requisitos ?? [],
    verificarUbicacion: h.marca ? AVISO_UBICACION : null,
    referencias: (h.referencias ?? []).map(textoReferencia),
    aviso: h.aviso
  }
}

export function describirTarjeta(valoracion) {
  const etiqueta = ETIQUETAS[valoracion.resultado] ?? ETIQUETAS[RESULTADOS.INSUFICIENTE]
  const datos = valoracion.datos ?? {}
  const tipologia = datos.tipologia && !datos.tipologia.sugerida ? `${datos.tipologia.codigo} · ${datos.tipologia.nombre}` : null

  const referencias = []
  const vistas = new Set()
  const candidatas = [...(valoracion.referencias ?? []), ...(valoracion.contexto ?? []).map((c) => c.referencia)]
  for (const r of candidatas) {
    if (!r) continue
    const ref = textoReferencia(r)
    if (vistas.has(ref.texto)) continue
    vistas.add(ref.texto)
    referencias.push(ref)
  }

  return {
    clase: etiqueta.clase,
    titulo: etiqueta.titulo,
    bajada: etiqueta.bajada,
    actividad: datos.actividad?.nombre ?? null,
    zona: textoZona(datos),
    tipologia,
    porQue: valoracion.razones ?? [],
    condiciones: valoracion.condiciones ?? [],
    verificarUbicacion: valoracion.requiereVerificarUbicacion ? AVISO_UBICACION : null,
    requisitos: valoracion.requisitosDeTipologia ?? [],
    rangos: (valoracion.rangos ?? []).map(textoRango),
    porArea: valoracion.porArea ?? [],
    contexto: (valoracion.contexto ?? []).map((c) => c.texto),
    referencias,
    advertencias: valoracion.advertencias ?? [],
    queFalta: valoracion.queFalta ?? null,
    lectura: valoracion.lecturaElegida
      ? describirLectura(valoracion.lecturaElegida, true)
      : valoracion.hipotesis
        ? describirLectura(valoracion.hipotesis, false)
        : null,
    aviso: valoracion.aviso
  }
}