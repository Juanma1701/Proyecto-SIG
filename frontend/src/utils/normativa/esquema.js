// Esquema de los datos normativos de GeoAburrá (etapa 2). Módulo de DATOS y validación: sin red, sin React.
//
// Idea: la norma de cada municipio se guarda como datos versionados en el repositorio, con la fuente
// exacta (artículo y página del PDF), el estado de vigencia y el nivel de verificación de cada dato.
// Este módulo NO decide si una actividad está permitida: solo describe lo que dice la norma.

export const USOS = Object.freeze(['residencial', 'comercial', 'servicios', 'industrial', 'dotacional', 'otro'])

export const COBERTURA = Object.freeze(['sin_datos', 'parcial', 'completa'])

export const VIGENCIA = Object.freeze({
  VIGENTE_SEGUN_FUENTE: 'vigente_segun_fuente_municipal',
  POR_VERIFICAR: 'por_verificar',
  DEROGADO: 'derogado'
})

// transcrito_de_imagen: leído sobre la imagen del documento, sin doble lectura.
// revisado_por_persona: comparado de nuevo contra el documento por una persona.
export const VERIFICACION = Object.freeze({
  SIN_VERIFICAR: 'sin_verificar',
  TRANSCRITO_DE_IMAGEN: 'transcrito_de_imagen',
  EXTRAIDO_DE_TEXTO: 'extraido_de_texto',
  REVISADO_POR_PERSONA: 'revisado_por_persona'
  
})

const PATRON_CODIGO_BASE = /^[A-Z]{1,2}-[A-Z0-9]+$/
const PATRON_ZONA_BASE = /^[A-Z]{2}-[A-Z]{1,3}-\d+$/
// Formato compacto (La Estrella): tipologías R, C1, S5, I2, SRC1 y polígonos ZU09_CN05, ZE04_DE04.
const PATRON_CODIGO_COMPACTO = /^(?:R|[CSI]\d{1,2}|SRC\d)$/
const PATRON_ZONA_COMPACTO = /^[A-Z]{3}\d?$/ // áreas de actividad de La Estrella: RES1, AAM2, IND3, COR1, ESP
// Modelo por CIIU (Envigado): códigos de zona cortos, p. ej. IND-LV, CT, COR1.
const PATRON_ZONA_CIIU = /^[A-Z0-9]{2,5}(-[A-Z0-9]{1,4})?$/
export const LETRAS_USO = Object.freeze(['P', 'C', 'R'])

export function congelar(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.freeze(valor)
    Object.values(valor).forEach(congelar)
  }
  return valor
}

const esTexto = (v) => typeof v === 'string' && v.trim() !== ''
const esEntero = (v) => Number.isInteger(v) && v > 0

function validarFuente(contexto, f, errores) {
  if (!f || typeof f !== 'object') return errores.push(`${contexto}: falta la fuente`)
  if (!esTexto(f.articulo)) errores.push(`${contexto}: falta el artículo`)
  if (!esEntero(f.paginaPdf)) errores.push(`${contexto}: falta la página del PDF`)
  if (!Object.values(VERIFICACION).includes(f.verificacion)) errores.push(`${contexto}: verificación inválida`)
}

// Modelo de "áreas de mixtura" (Medellín y municipios con mixtura alta, media y baja): una matriz de SI/NO por
// actividad y área, las actividades nombradas por área, la exigencia de PAU y las reglas de interpretación.
// Cada área enlaza con los códigos de subcategoría de la capa de usos (`codigosSubcategoria`).
function validarRegimenMixtura(r, errores) {
  if (r === undefined) return
  const c = 'régimen de mixtura'
  if (!r || typeof r !== 'object') return errores.push(`${c}: debe ser un objeto`)

  const ids = []
  for (const a of r.areas ?? []) {
    const ca = `área ${a?.id}`
    if (!esTexto(a?.id)) errores.push(`${c}: área sin id`)
    if (ids.includes(a?.id)) errores.push(`${ca}: repetida`)
    ids.push(a?.id)
    if (!esTexto(a?.nombre)) errores.push(`${ca}: falta el nombre`)
    const subs = a?.codigosSubcategoria
    if (!Array.isArray(subs) || subs.length === 0 || !subs.every(Number.isInteger)) {
      errores.push(`${ca}: códigos de subcategoría inválidos`)
    }
  }
  if (ids.length === 0) errores.push(`${c}: faltan las áreas`)
    for (const a of r.areas ?? []) {
      for (const h of a?.heredaDe ?? []) {
        if (!ids.includes(h) || h === a.id) errores.push(`área ${a.id}: hereda de un área inválida (${h})`)
    }
  }

  for (const fila of r.matriz ?? []) {
    const cf = `matriz ${fila?.actividad}`
    if (!esTexto(fila?.actividad)) errores.push(`${c}: fila sin actividad`)
    for (const id of ids) {
      if (typeof fila?.permitido?.[id] !== 'boolean') errores.push(`${cf}: falta SI o NO para ${id}`)
    }
    for (const id of Object.keys(fila?.permitido ?? {})) {
      if (!ids.includes(id)) errores.push(`${cf}: área desconocida (${id})`)
    }
    validarFuente(cf, fila?.fuente, errores)
  }

  for (const t of r.actividadesPorArea ?? []) {
    const ct = `actividades ${t?.titulo}`
    if (!esTexto(t?.titulo)) errores.push(`${c}: tabla de actividades sin título`)
    if (!Array.isArray(t?.areaIds) || t.areaIds.length === 0 || !t.areaIds.every((id) => ids.includes(id))) {
      errores.push(`${ct}: áreas inválidas`)
    }
    if (!Array.isArray(t?.grupos) || t.grupos.length === 0) errores.push(`${ct}: faltan grupos`)
    for (const g of t?.grupos ?? []) {
      if (!esTexto(g?.categoria)) errores.push(`${ct}: grupo sin categoría`)
      if (!Array.isArray(g?.subcategorias) || g.subcategorias.length === 0 || !g.subcategorias.every(esTexto)) {
        errores.push(`${ct}: el grupo ${g?.categoria} tiene subcategorías inválidas`)
      }
    }
    validarFuente(ct, t?.fuente, errores)
  }

  for (const p of r.requierePau ?? []) {
    const cp = `PAU ${p?.subcategoria}`
    if (!esTexto(p?.subcategoria)) errores.push(`${c}: fila de PAU sin subcategoría`)
    if (typeof p?.requiere !== 'boolean') errores.push(`${cp}: falta SI o NO`)
    validarFuente(cp, p?.fuente, errores)
  }

  for (const x of r.reglasInterpretacion ?? []) {
    const cx = `regla ${x?.id}`
    if (!esTexto(x?.id) || !esTexto(x?.efecto) || !esTexto(x?.texto)) errores.push(`${cx}: falta id, efecto o texto`)
    validarFuente(cx, x?.fuente, errores)
  }
}


// Modelo "por CIIU y zona" (Envigado, Tabla 27): reglasPorCiiu[{ ciiu, descripcion, porZona:{<zona>:'P'|'C'|'R'}, fuente }],
// zonas[{ codigo, nombre, descripcion, fuente }] y, opcional, sinInterpretar[{ ciiu, descripcion, letras, motivo }].
// Una zona sin letra en una fila significa "prohibido" (art. 183); por eso solo se admiten filas con las letras ya ubicadas.
function validarModeloCiiu(i, errores) {
  const codigosZona = new Set()
  for (const z of i.zonas ?? []) {
    const c = `zona ${z?.codigo}`
    if (!PATRON_ZONA_CIIU.test(z?.codigo ?? '')) errores.push(`${c}: código inválido`)
    if (codigosZona.has(z?.codigo)) errores.push(`${c}: repetida`)
    codigosZona.add(z?.codigo)
    if (!esTexto(z?.nombre) || !esTexto(z?.descripcion)) errores.push(`${c}: falta nombre o descripción`)
    validarFuente(c, z?.fuente, errores)
  }
  if (codigosZona.size === 0) errores.push('modelo por CIIU: faltan las zonas')
  const ciiu = new Set()
  for (const r of i.reglasPorCiiu ?? []) {
    const c = `CIIU ${r?.ciiu}`
    if (!/^\d{3,4}$/.test(r?.ciiu ?? '')) errores.push(`${c}: código CIIU inválido`)
    if (ciiu.has(r?.ciiu)) errores.push(`${c}: repetido`)
    ciiu.add(r?.ciiu)
    if (!esTexto(r?.descripcion)) errores.push(`${c}: falta la descripción`)
    validarFuente(c, r?.fuente, errores)
    const pz = r?.porZona
    if (!pz || typeof pz !== 'object' || Object.keys(pz).length === 0) errores.push(`${c}: falta porZona`)
    for (const [z, letra] of Object.entries(pz ?? {})) {
      if (!codigosZona.has(z)) errores.push(`${c}: zona desconocida (${z})`)
      if (!LETRAS_USO.includes(letra)) errores.push(`${c}: letra inválida (${letra}) en ${z}`)
    }
  }
  for (const s of i.sinInterpretar ?? []) {
    const c = `sin interpretar ${s?.ciiu}`
    if (!esTexto(s?.ciiu) || !esTexto(s?.motivo)) errores.push(`${c}: falta ciiu o motivo`)
    if (ciiu.has(s?.ciiu)) errores.push(`${c}: figura también como regla interpretada`)
  }
}

const ESTADOS_MEZCLA = Object.freeze(['permitido', 'permitido_con_restricciones', 'no_permitido', 'verificar'])

// Modelo "por zona de mezcla y negocio" (Sabaneta): modeloMezcla.zonas[{ codigo, nombre }] y
// modeloMezcla.negocios[id] = { codigo, porZona:{<zona>: estado}, condiciones, fuente }.
function validarModeloMezcla(m, errores) {
  if (m === undefined) return
  const ids = new Set()
  for (const z of m?.zonas ?? []) {
    if (!esTexto(z?.codigo) || !esTexto(z?.nombre)) errores.push('modelo por mezcla: zona sin código o nombre')
    ids.add(z?.codigo)
  }
  if (ids.size === 0) errores.push('modelo por mezcla: faltan las zonas')
  for (const [id, n] of Object.entries(m?.negocios ?? {})) {
    const c = `negocio ${id}`
    if (!esTexto(n?.codigo)) errores.push(`${c}: falta el código`)
    for (const z of ids) if (!ESTADOS_MEZCLA.includes(n?.porZona?.[z])) errores.push(`${c}: estado inválido en ${z}`)
    for (const z of Object.keys(n?.porZona ?? {})) if (!ids.has(z)) errores.push(`${c}: zona desconocida (${z})`)
    if (n?.porZona && Object.values(n.porZona).includes('verificar') && !esTexto(n.notaVerificar)) errores.push(`${c}: falta la nota de verificación`)
    validarFuente(c, n?.fuente, errores)
  }
}

// Devuelve una lista de errores (vacía si todo está bien).
export function validarInstrumento(instrumento) {
  const errores = []
  const i = instrumento
  if (!i || typeof i !== 'object') return ['instrumento vacío']
  const compacto = i.formatoCodigos === 'compacto'
  const PATRON_CODIGO = compacto ? PATRON_CODIGO_COMPACTO : PATRON_CODIGO_BASE
  const PATRON_ZONA = compacto ? PATRON_ZONA_COMPACTO : PATRON_ZONA_BASE

  for (const campo of ['municipioSlug', 'nombre', 'fechaAdopcion', 'fechaConsulta']) {
    if (!esTexto(i[campo])) errores.push(`falta ${campo}`)
  }
  if (!Object.values(VIGENCIA).includes(i.vigencia?.estado)) errores.push('estado de vigencia inválido')
  if (!esTexto(i.vigencia?.fuente)) errores.push('la vigencia no cita su fuente')
  if (!COBERTURA.includes(i.cobertura)) errores.push('cobertura inválida')
  if (!esTexto(i.fuente?.url)) errores.push('falta la URL oficial')

  const codigos = new Set()
  for (const t of i.tipologias ?? []) {
    const c = `tipología ${t?.codigo}`
    if (!PATRON_CODIGO.test(t?.codigo ?? '')) errores.push(`${c}: código inválido`)
    if (codigos.has(t?.codigo)) errores.push(`${c}: repetida`)
    codigos.add(t?.codigo)
    if (!USOS.includes(t?.uso)) errores.push(`${c}: uso inválido`)
    if (!esTexto(t?.nombre)) errores.push(`${c}: falta el nombre`)
    validarFuente(c, t?.fuente, errores)
    if (t?.areaMinimaM2 != null && !(t.areaMinimaM2 > 0)) errores.push(`${c}: área mínima inválida`)
    for (const r of t?.retiros ?? []) {
      if (!esTexto(r?.destino) || !(r?.metros > 0)) errores.push(`${c}: retiro inválido`)
    }
  }

  const porCiiu = Array.isArray(i.reglasPorCiiu)
  if (porCiiu) validarModeloCiiu(i, errores)

  const zonas = new Set()
  for (const z of porCiiu ? [] : i.zonas ?? []) {
    const c = `zona ${z?.codigo}`
    if (!PATRON_ZONA.test(z?.codigo ?? '')) errores.push(`${c}: código inválido`)
    if (zonas.has(z?.codigo)) errores.push(`${c}: repetida`)
    zonas.add(z?.codigo)
    if (!esTexto(z?.delimitacion)) errores.push(`${c}: falta la delimitación`)
    validarFuente(c, z?.fuente, errores)
    for (const lista of ['compatibles', 'condicionados']) {
      if (!Array.isArray(z?.[lista])) errores.push(`${c}: falta ${lista}`)
      for (const cod of z?.[lista] ?? []) {
        if (!PATRON_CODIGO.test(cod)) errores.push(`${c}: código de tipología inválido (${cod})`)
      }
    }
    if (!esTexto(z?.prohibidos)) errores.push(`${c}: falta la regla de prohibidos`)
    // `marcas`: asteriscos que la tabla pone junto a un código (su nota puede estar pendiente de leer)
        // `marcas`: asteriscos que la tabla pone junto a un código. Cada símbolo debe tener su nota
    // (texto, página del PDF) en `notasMarcas`.
    for (const cod of Object.keys(z?.marcas ?? {})) {
      if (!(z.compatibles ?? []).includes(cod) && !(z.condicionados ?? []).includes(cod)) {
        errores.push(`${c}: la marca de ${cod} no corresponde a un código de la zona`)
      }
    }
    for (const simbolo of new Set(Object.values(z?.marcas ?? {}))) {
      const nota = z?.notasMarcas?.[simbolo]
      if (!nota || !esTexto(nota.texto) || !esEntero(nota.paginaPdf)) errores.push(`${c}: la marca ${simbolo} no tiene nota`)
    }
  }

  for (const e of i.estandaresRuido ?? []) {
    const c = `ruido ${e?.sector} / ${e?.subsector}`
    if (!esTexto(e?.sector) || !esTexto(e?.subsector)) errores.push(`${c}: falta sector o subsector`)
    if (!(e?.dbDia > 0) || !(e?.dbNoche > 0)) errores.push(`${c}: niveles de ruido inválidos`)
    validarFuente(c, e?.fuente, errores)
    for (const cod of e?.tipologias ?? []) {
      if (!PATRON_CODIGO.test(cod)) errores.push(`${c}: código de tipología inválido (${cod})`)
    }
  }

  for (const r of i.reglasDotacionales ?? []) {
    const c = `regla dotacional ${r?.tipo}`
    if (!esTexto(r?.tipo)) errores.push(`${c}: falta el tipo`)
    validarFuente(c, r?.fuente, errores)
    for (const lista of ['compatibles', 'condicionados']) {
      if (!Array.isArray(r?.[lista]) || r[lista].length === 0) errores.push(`${c}: falta ${lista}`)
      for (const cod of r?.[lista] ?? []) {
        if (!PATRON_CODIGO.test(cod)) errores.push(`${c}: código de tipología inválido (${cod})`)
      }
    }
  }

  validarModeloMezcla(i.modeloMezcla, errores)

  validarRegimenMixtura(i.regimenMixtura, errores)

  for (const d of i.disposicionesGenerales ?? []) {
    const c = `disposición ${d?.tema}`
    if (!esTexto(d?.tema) || !esTexto(d?.resumen)) errores.push(`${c}: falta tema o resumen`)
    validarFuente(c, d?.fuente, errores)
  }
  return errores
}