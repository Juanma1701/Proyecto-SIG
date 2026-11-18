// Del resultado de la consulta territorial a las áreas de mixtura de Medellín. Función pura: sin red ni React.
// Lee los registros del bloque de usos (id "supabase:usos_suelo", tipo "uso_normativo_pot"): la capa de usos
// generales del suelo urbano (Mapa 23). Los campos pueden venir en atributosOriginales, atributosLimpios o sueltos.
// Prefiere el código de subcategoría (cod_subcat_uso); si no viene, usa el nombre del área general.
// Nunca elige en silencio: dos áreas distintas en el mismo punto devuelven "varias_areas".

const sinTildes = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

const ID_BLOQUE_USOS = 'supabase:usos_suelo'
const CAMPO_CODIGO = /^cod[_ ]?sub[_ ]?cat/i
const CAMPO_AREA = /^(area[_ ]?general|areagraluso)$/i

const POR_TEXTO = [
  ['baja mixtura', ['baja']],
  ['media mixtura', ['media']],
  ['alta mixtura', ['altaTransformacion', 'altaCentralidades', 'altaPredominanciaEconomica']]
]

function leerRegistro(registro) {
  // Se unen las formas posibles; si un campo está en varias, gana atributosOriginales
  const atributos = Object.assign({}, registro, registro?.atributos, registro?.atributosLimpios, registro?.atributosOriginales)
  let codigo = null
  let area = null
  for (const [clave, valor] of Object.entries(atributos)) {
    if (CAMPO_CODIGO.test(clave)) {
      const n = Number.parseInt(String(valor).trim(), 10)
      if (Number.isInteger(n)) codigo = n
    } else if (CAMPO_AREA.test(clave) && valor !== null && valor !== undefined) {
      area = sinTildes(valor)
    }
  }
  return { codigo, area }
}

export function areasDeMixtura(instrumento, resultadoTerritorial) {
  const regimen = instrumento?.regimenMixtura
  if (!regimen) return { estado: 'sin_regimen_cargado' }

  const lecturas = (resultadoTerritorial?.bloques ?? [])
    .filter((b) => b.id === ID_BLOQUE_USOS || b.tipo === 'uso_normativo_pot')
    .flatMap((b) => b.registros ?? [])
    .map(leerRegistro)
  if (lecturas.length === 0) return { estado: 'sin_registros' }

  const codigos = [...new Set(lecturas.map((l) => l.codigo).filter((c) => c !== null))]
  if (codigos.length > 1) return { estado: 'varias_areas', codigos }
  if (codigos.length === 1) {
    const codigo = codigos[0]
    const area = regimen.areas.find((a) => a.codigosSubcategoria.includes(codigo))
    if (area) return { estado: 'ok', areaIds: [area.id], codigo, porTexto: false }
    const otra = regimen.otrasCategoriasDeLaCapa.find((o) => o.codigosSubcategoria.includes(codigo))
    if (otra) return { estado: 'sin_regimen', categoria: otra.id, norma: otra.norma, codigo }
    return { estado: 'sin_codigo', codigo }
  }

  const textos = [...new Set(lecturas.map((l) => l.area).filter(Boolean))]
  if (textos.length > 1) return { estado: 'varias_areas', codigos: textos }
  if (textos.length === 1) {
    const coincidencia = POR_TEXTO.find(([patron]) => textos[0].includes(patron))
    if (coincidencia) return { estado: 'ok', areaIds: coincidencia[1], codigo: null, porTexto: true }
  }
  return { estado: 'sin_codigo', codigo: null }
}