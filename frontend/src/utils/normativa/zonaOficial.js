// Convierte los atributos de la capa oficial de áreas de actividad de Itagüí (POT 09 de 2023) en una zona con el
// formato de normativa/. Función pura: sin red, sin React. No decide nada normativo.
//
// Los campos vienen como texto libre, con espacios duros y erratas ("RU", "R.-B", "RM-1", "R-M-2", "-M2",
// "S–24" con raya larga, comas dobles, "I-4. D-1"): aquí se normalizan. Lo que no se entiende NO se adivina:
// se devuelve en `noReconocido` y la zona lo expone en `avisosDeLectura`.

export const URL_CAPA_AREAS_ACTIVIDAD_ITAGUI =
  'https://arcgis.itagui.gov.co/waserver/rest/services/Formulacion/26_FU_Areas_Actividad/MapServer/0'

export function limpiarTexto(valor) {
  if (valor === null || valor === undefined) return null
  const texto = String(valor).replace(/[\s\u00A0]+/g, ' ').trim()
  return texto === '' ? null : texto
}

// Guiones tipográficos (‐ ‑ – — ―) y el signo menos se tratan como "-"
const GUIONES = /[\u2010-\u2015\u2212]/g

// Un código es: R-M + número (con guiones o puntos opcionales: R-M1, RM2, RM-1, R-M-2),
// o una letra C, S, I, D, R con número (C-2, S-24) o, solo para R, U/B/T (vivienda). Luego asteriscos.
const PATRON_CODIGO = /\b(?:(R)[\s.-]*M[\s.-]*(\d+)|([CSIDR])[\s.-]*(?:(\d+)|([UBT])(?![A-Za-z0-9])))(\*{0,4})/g

// "C-2*, RU, I-4. D-1" -> { codigos: ['C-2','R-U','I-4','D-1'], marcas: { 'C-2': '*' }, noReconocido: '', corregidas: [] }
export function parsearListaCodigos(texto) {
  const codigos = []
  const marcas = {}
  const corregidas = []
  const limpio = limpiarTexto(texto)
  if (!limpio) return { codigos, marcas, noReconocido: '', corregidas }

  const normalizado = limpio
    .replace(GUIONES, '-')
    // "R-M1, -M2": en la fuente a veces falta la R de la vivienda multifamiliar
    .replace(/(^|[\s,;])-\s*M\s*(\d+)/g, (_, antes, numero) => {
      corregidas.push(`"-M${numero}" se leyó como R-M${numero} (a la fuente le falta la R)`)
      return `${antes}R-M${numero}`
    })

  for (const m of normalizado.matchAll(PATRON_CODIGO)) {
    const codigo = m[1] ? `R-M${m[2]}` : `${m[3]}-${m[4] ?? m[5]}`
    if (!codigos.includes(codigo)) codigos.push(codigo)
    if (m[6]) marcas[codigo] = m[6]
  }

  // Lo que sobra después de quitar los códigos, los separadores y la conjunción "y"
  const noReconocido = normalizado
    .replace(PATRON_CODIGO, ' ')
    .replace(/\by\b/gi, ' ')
    .replace(/[\s,.;]+/g, ' ')
    .trim()

  return { codigos, marcas, noReconocido, corregidas }
}

// "** ZU-AM-03 Solo en bodegas..." -> { simbolo: '**', texto: 'Solo en bodegas...', ... }
export function parsearNota(texto) {
  const limpio = limpiarTexto(texto)
  if (!limpio) return null
  const m = /^(\*{1,4})\s*(.*)$/.exec(limpio)
  if (!m) return null
  const cuerpo = m[2].replace(/^ZU-[A-Z]{1,2}-\d+(?:\s*y\s*ZU-[A-Z]{1,2}-\d+)*\s*/, '') || m[2]
  return {
    simbolo: m[1],
    texto: cuerpo,
    // Los campos de la capa miden 255 caracteres: un texto de ese largo puede estar cortado en el origen.
    truncada: String(texto).length >= 255,
    restoDelPoligono: /resto del pol[ií]gono se proh[ií]be/i.test(cuerpo) ? 'prohibido' : null
  }
}

export function zonaDesdeAtributos(atributos) {
  const a = Object.fromEntries(Object.entries(atributos ?? {}).map(([k, v]) => [k.toLowerCase(), v]))
  const compatibles = parsearListaCodigos(a.uso_comp)
  const condicionados = parsearListaCodigos(a.uso_cond)

  const avisosDeLectura = []
  for (const [nombre, lista] of [
    ['usos compatibles', compatibles],
    ['usos condicionados', condicionados]
  ]) {
    for (const c of lista.corregidas) avisosDeLectura.push(`En los ${nombre}: ${c}.`)
    if (lista.noReconocido) {
      avisosDeLectura.push(
        `En los ${nombre} quedó texto sin reconocer ("${lista.noReconocido}"): la lista de la zona puede estar incompleta.`
      )
    }
  }

  const notasMarcas = {}
  for (const clave of ['condicion1', 'condicion2', 'condicion3']) {
    const nota = parsearNota(a[clave])
    if (nota) {
      const { simbolo, ...resto } = nota
      notasMarcas[simbolo] = { ...resto, paginaPdf: null }
    }
  }

  return {
    codigo: limpiarTexto(a.codigo),
    areaActividad: limpiarTexto(a.uso_ppal),
    subtipo: limpiarTexto(a.subtipo),
    delimitacion: limpiarTexto(a.sector),
    compatibles: compatibles.codigos,
    condicionados: condicionados.codigos,
    marcas: { ...compatibles.marcas, ...condicionados.marcas },
    notasMarcas,
    prohibidos: limpiarTexto(a.uso_proh) ?? 'los demás usos no determinados',
    espacioPublico: limpiarTexto(a.cod_ep),
    avisosDeLectura,
    fuente: {
      origen: 'capa_oficial',
      url: URL_CAPA_AREAS_ACTIVIDAD_ITAGUI,
      articulo: null,
      paginaPdf: null,
      verificacion: 'publicado_por_el_municipio'
    }
  }
}