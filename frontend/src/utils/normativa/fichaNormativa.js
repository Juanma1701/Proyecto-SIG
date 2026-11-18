// Ficha informativa de la norma en un punto: cruza las filas que devuelve la capa de usos (usos_en_punto) con el
// instrumento normativo del municipio. Pura: sin red ni React.
//
// NO da veredicto. No dice "se puede" ni "no se puede" abrir un negocio: describe en qué área de uso cae el punto y
// qué dice la norma para esa área, con su fuente, y deja a la vista las dudas y limitaciones del propio acuerdo.

import { instrumentoDeMunicipio } from './index.js'

const SIN_CATEGORIA = 'Sin categoría impresa (p. 355)'

const aCodigo = (valor) => {
  const n = typeof valor === 'string' ? Number(valor.trim()) : valor
  return Number.isInteger(n) ? n : null
}

function agruparMatriz(matriz, areaId) {
  const grupos = []
  for (const fila of matriz) {
    const categoria = fila.categoria ?? SIN_CATEGORIA
    let grupo = grupos.find((g) => g.categoria === categoria)
    if (!grupo) {
      grupo = { categoria, filas: [] }
      grupos.push(grupo)
    }
    grupo.filas.push({
      actividad: fila.actividad,
      permitido: fila.permitido[areaId] === true,
      paginaPdf: fila.fuente.paginaPdf
    })
  }
  return grupos
}

const tablasDeArea = (regimen, areaId) =>
  regimen.actividadesPorArea
    .filter((t) => t.areaIds.includes(areaId))
    .map((t) => ({ titulo: t.titulo, paginaPdf: t.fuente.paginaPdf, grupos: t.grupos }))

function resumirPau(filas) {
  const vistos = new Set()
  const requiere = []
  const noRequiere = []
  for (const p of filas) {
    const clave = `${p.subcategoria.toLowerCase()}|${p.requiere}`
    if (vistos.has(clave)) continue
    vistos.add(clave)
    if (p.requiere) requiere.push(p.subcategoria)
    else noRequiere.push(p.subcategoria)
  }
  return { requiere, noRequiere, filas: filas.length }
}

function fichaDeArea(regimen, area, fila) {
  const matriz = agruparMatriz(regimen.matriz, area.id)
  const todas = matriz.flatMap((g) => g.filas)
  return {
    id: area.id,
    nombre: area.nombre,
    codigoSubcategoria: aCodigo(fila.cod_subcat_uso),
    areaGeneralCapa: area.areaGeneralCapa,
    subcategoriaCapa: fila.subcategoria ?? null,
    matriz,
    resumenMatriz: {
      total: todas.length,
      permitidas: todas.filter((f) => f.permitido).length,
      noPermitidas: todas.filter((f) => !f.permitido).length
    },
    actividadesPropias: tablasDeArea(regimen, area.id),
    actividadesHeredadas: (area.heredaDe ?? []).map((id) => ({
      desdeAreaId: id,
      desdeNombre: regimen.areas.find((a) => a.id === id)?.nombre ?? id,
      tablas: tablasDeArea(regimen, id)
    }))
  }
}

// slug: slug del municipio. filasUso: filas de usos_en_punto ({ cod_subcat_uso, subcategoria, area_general, ... }).
export function construirFichaNormativa(slug, filasUso) {
  const instrumento = instrumentoDeMunicipio(slug)
  const regimen = instrumento?.regimenMixtura
  const ficha = {
    slug,
    estado: 'sin_regimen_cargado',
    instrumento: null,
    filasRecibidas: 0,
    areas: [],
    otrasCategorias: [],
    noReconocidas: [],
    pau: null,
    reglas: [],
    advertencias: [],
    limitaciones: []
  }
  if (!regimen) return ficha

  const filas = (Array.isArray(filasUso) ? filasUso : []).filter((f) => f && typeof f === 'object')
  ficha.instrumento = {
    nombre: instrumento.nombre,
    vigencia: instrumento.vigencia,
    cobertura: instrumento.cobertura,
    url: instrumento.fuente.url
  }
  ficha.filasRecibidas = filas.length
  ficha.reglas = regimen.reglasInterpretacion
  ficha.limitaciones = instrumento.limitaciones ?? []
  ficha.pau = resumirPau(regimen.requierePau)
  ficha.advertencias.push('Es información de la norma: no autoriza ninguna actividad ni reemplaza el concepto de uso del suelo.')

  if (filas.length === 0) {
    ficha.estado = 'sin_filas'
    ficha.advertencias.push('La capa de usos no devolvió ningún polígono en este punto: puede estar fuera del suelo urbano o en un vacío de la capa.')
    return ficha
  }

  const vistos = new Set()
  for (const fila of filas) {
    const codigo = aCodigo(fila.cod_subcat_uso)
    if (codigo !== null) {
      if (vistos.has(codigo)) continue
      vistos.add(codigo)
    }
    const area = codigo === null ? null : regimen.areas.find((a) => a.codigosSubcategoria.includes(codigo))
    const otra = codigo === null ? null : regimen.otrasCategoriasDeLaCapa.find((o) => o.codigosSubcategoria.includes(codigo))
    if (area) ficha.areas.push(fichaDeArea(regimen, area, fila))
    else if (otra) {
      ficha.otrasCategorias.push({
        id: otra.id,
        codigoSubcategoria: codigo,
        norma: otra.norma,
        areaGeneralCapa: fila.area_general ?? null,
        subcategoriaCapa: fila.subcategoria ?? null
      })
    } else {
      ficha.noReconocidas.push({ codigoSubcategoria: codigo, areaGeneralCapa: fila.area_general ?? null, subcategoriaCapa: fila.subcategoria ?? null })
    }
  }

  ficha.estado = ficha.areas.length > 0 ? 'ok' : ficha.otrasCategorias.length > 0 ? 'sin_area_de_mixtura' : 'codigo_no_reconocido'

  if (instrumento.geometria?.nota) ficha.advertencias.push(instrumento.geometria.nota)
  if (instrumento.vigencia?.nota) ficha.advertencias.push(instrumento.vigencia.nota)
  if (vistos.size + ficha.noReconocidas.length > 1) {
    ficha.advertencias.push('El punto cae en varios polígonos de la capa de usos; se muestran todos.')
  }
  const ids = ficha.reglas.map((r) => r.id)
  if (ficha.areas.length > 0 && ids.includes('r1') && ids.includes('r5')) {
    ficha.advertencias.push(
      'El acuerdo no aclara si lo que la matriz nombra pero las tablas de actividades no listan se considera prohibido (regla r1) o se resuelve con la matriz (regla r5).'
    )
  }
  for (const n of ficha.noReconocidas) {
    ficha.advertencias.push(`El código de subcategoría ${n.codigoSubcategoria ?? '(vacío)'} no está en el instrumento normativo.`)
  }
  return ficha
}