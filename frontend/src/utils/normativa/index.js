// Registro de los instrumentos normativos por municipio. Solo datos y consultas simples.
// No decide si una actividad está permitida.

import { ITAGUI } from './itagui.js'
import { MEDELLIN } from './medellin.js'
import { ENVIGADO } from './envigado.js'
import { validarInstrumento } from './esquema.js'
import { SABANETA } from './sabaneta.js'
import { LA_ESTRELLA } from './laEstrella.js'

export { validarInstrumento } from './esquema.js'

export const INSTRUMENTOS = Object.freeze({ Itagui: ITAGUI, Medellin: MEDELLIN, Envigado: ENVIGADO, Sabaneta: SABANETA, LaEstrella: LA_ESTRELLA })

export function instrumentoDeMunicipio(slug) {
  return Object.hasOwn(INSTRUMENTOS, slug) ? INSTRUMENTOS[slug] : null
}

export function tipologiaPorCodigo(slug, codigo) {
  return instrumentoDeMunicipio(slug)?.tipologias?.find((t) => t.codigo === codigo) ?? null
}

export function zonaPorCodigo(slug, codigo) {
  return instrumentoDeMunicipio(slug)?.zonas.find((z) => z.codigo === codigo) ?? null
}

// Regla de la Tabla 27 de un municipio con modelo por CIIU (Envigado).
export function reglaPorCiiu(slug, ciiu) {
  return instrumentoDeMunicipio(slug)?.reglasPorCiiu?.find((r) => r.ciiu === ciiu) ?? null
}

export function reglaDotacionalDeTipo(slug, tipo) {
  return instrumentoDeMunicipio(slug)?.reglasDotacionales?.find((r) => r.tipo === tipo) ?? null
}

// Fila de la matriz de usos por área de mixtura que contiene el texto dado (sin distinguir mayúsculas).
export function filaDeMatriz(slug, texto) {
  const buscado = texto.toLowerCase()
  return instrumentoDeMunicipio(slug)?.regimenMixtura?.matriz.find((f) => f.actividad.toLowerCase().includes(buscado)) ?? null
}

// Área de mixtura (columna de la matriz) a la que pertenece un código de subcategoría de la capa de usos.
export function areaDeMixturaPorCodigo(slug, codigoSubcategoria) {
  return instrumentoDeMunicipio(slug)?.regimenMixtura?.areas.find((a) => a.codigosSubcategoria.includes(codigoSubcategoria)) ?? null
}

// Códigos de tipología citados en las zonas que aún no tienen definición cargada.
export function codigosSinDefinir(slug) {
  const instrumento = instrumentoDeMunicipio(slug)
  if (!instrumento) return []
  if (!instrumento.tipologias) return [] // modelo por CIIU: no usa tipologías
  const definidos = new Set(instrumento.tipologias.map((t) => t.codigo))
  const citados = new Set(instrumento.zonas.flatMap((z) => [...(z.compatibles ?? []), ...(z.condicionados ?? [])]))
  return [...citados].filter((c) => !definidos.has(c)).sort()
}

export function erroresDeInstrumentos() {
  return Object.entries(INSTRUMENTOS).flatMap(([slug, i]) => validarInstrumento(i).map((e) => `${slug}: ${e}`))
}