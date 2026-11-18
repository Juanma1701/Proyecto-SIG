// Resumen para la ficha del panel Territorio. Función pura: sin red ni React.
// Toma el ResultadoConsultaTerritorial y extrae lo que cada fuente declaró, SIN interpretarlo.
// Los nombres de campo salen del inventario del AMVA y de los sondeos; si un campo no viene, se omite.

const CLASES = {
  urbano: 'Suelo urbano',
  rural: 'Suelo rural',
  suburbano: 'Suelo suburbano',
  expansion: 'Suelo de expansión',
  proteccion: 'Suelo de protección'
}

const SIN_DATO = new Set(['', 'N/A', 'NA', 'N.A.'])

function util(valor) {
  if (valor === null || valor === undefined) return null
  const texto = String(valor).trim()
  return SIN_DATO.has(texto.toUpperCase()) ? null : texto
}

function primero(atributos, campos) {
  for (const campo of campos) {
    const valor = util(atributos?.[campo])
    if (valor) return valor
  }
  return null
}

function unicos(lista, clave) {
  const vistos = new Set()
  return lista.filter((x) => {
    const k = clave(x)
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })
}

const tieneCodigo = (bloque, codigo) => bloque.advertencias.some((a) => a.codigo === codigo)
const esPlaceholder = (bloque, valor) =>
  tieneCodigo(bloque, 'PLACEHOLDER_ZONA_URBANA') && String(valor).toUpperCase() === 'ZONA URBANA'

const ESTADOS_ERROR = ['error_servicio', 'error_red', 'timeout']

function resumirSuelo(bloques) {
  const items = []
  for (const b of bloques) {
    if (b.tipo !== 'clasificacion_suelo') continue
    for (const r of b.registros) {
      const n = r.normalizado
      const texto = n?.clase ? (CLASES[n.clase] ?? n.clase) : util(n?.etiquetaOriginal)
      if (texto) items.push({ texto, clase: n?.clase ?? texto, fuente: b.fuente.origen === 'supabase' ? 'Copia en Supabase' : 'AMVA' })
    }
  }
  const claves = new Set(items.map((i) => i.clase))
  return { items: unicos(items, (i) => `${i.texto}|${i.fuente}`), discrepa: claves.size > 1 }
}

const CAMPOS_TRATAMIENTO = ['TRATAMIENTO', 'TRATAMIENTO_2018', 'TRATAMIENT', 'TIPO', 'FOLDERPATH', 'SIMBOLOGIA']
const DATOS_TRATAMIENTO = [
  ['DENSTOTAL', 'Densidad total'],
  ['ICTOTAL', 'Índice de construcción total'],
  ['ALTURANORMATIVA', 'Altura normativa'],
  ['DENSIDAD', 'Densidad'],
  ['DEN2018', 'Densidad (2018)'],
  ['R_DENSIDAD', 'Rango de densidad'],
  ['INDICE_OCU', 'Índice de ocupación'],
  ['ALTURA_MAX', 'Altura máxima'],
  ['ALTURA2018', 'Altura (2018)'],
  ['ALTURA', 'Altura']
]

function resumirTratamientos(bloques) {
  const items = []
  for (const b of bloques) {
    if (b.tipo !== 'tratamiento') continue
    for (const r of b.registros) {
      const a = r.atributosLimpios
      const nombre = primero(a, CAMPOS_TRATAMIENTO)
      if (!nombre || esPlaceholder(b, nombre)) continue
      const datos = DATOS_TRATAMIENTO.map(([campo, etiqueta]) => ({ etiqueta, valor: util(a[campo]) }))
        .filter((d) => d.valor)
        .slice(0, 5)
      items.push({ nombre, datos, ambito: b.ambito })
    }
  }
  return unicos(items, (i) => `${i.nombre}|${i.ambito}`)
}

function resumirUsoActual(bloques) {
  const items = []
  for (const b of bloques) {
    if (b.tipo !== 'uso_actual') continue
    for (const r of b.registros) {
      const texto = util(r.normalizado?.etiquetaOriginal)
      if (texto) items.push({ texto, fuente: b.titulo ?? b.fuente.servicio })
    }
  }
  return unicos(items, (i) => `${i.texto}|${i.fuente}`)
}

const CAMPOS_USO_POT = [
  'AREAGRALUSO', 'area_general', 'USOS', 'USO', 'DESCRIPCION', 'DESCRIP', 'ENFASISUSO',
  'USOS_PPAL', 'USO_1', 'USO_ACTUAL', 'SUBCATEGORIA', 'subcategoria'
]

function resumirUsoPot(bloques) {
  const items = []
  let hayBloque = false
  for (const b of bloques) {
    if (b.tipo !== 'uso_normativo_pot') continue
    hayBloque = true
    for (const r of b.registros) {
      const a = r.atributosLimpios
      let lineas
      if (util(a.USO_PPAL) || util(a.USO_COND) || util(a.USO_PROH)) {
        // Itagüí: la fuente publica uso principal, condicionado y prohibido POR ZONA, no por actividad
        lineas = [
          ['Uso principal', a.USO_PPAL],
          ['Uso condicionado', a.USO_COND],
          ['Uso prohibido', a.USO_PROH],
          ['Condición', a.CONDICION]
        ]
          .map(([etiqueta, valor]) => ({ etiqueta, valor: util(valor) }))
          .filter((l) => l.valor)
      } else {
        const principal = primero(a, CAMPOS_USO_POT)
        if (!principal || esPlaceholder(b, principal)) continue
        const sub = primero(a, ['SUBCATEGORIA', 'subcategoria'])
        lineas = [{ etiqueta: null, valor: sub && sub !== principal ? `${principal} · ${sub}` : principal }]
      }
      if (lineas.length) items.push({ titulo: b.titulo ?? b.fuente.servicio, lineas })
    }
  }
  return { items: unicos(items, (i) => `${i.titulo}|${JSON.stringify(i.lineas)}`), hayBloque }
}

const CAMPOS_ALERTA = ['TIPO', 'RIESGO', 'CLASE', 'EVENTO', 'TIPO_AMENAZA', 'TIPO_RIESG', 'NOMBRE', 'CATEGORIA', 'DESCRIPCION', 'TIPO_ECOSI', 'LAYER', 'SIMBOLOGIA']

function resumirAlertas(bloques) {
  const items = []
  let incompleto = false
  for (const b of bloques) {
    if (b.tipo !== 'riesgo' && b.tipo !== 'proteccion') continue
    if (ESTADOS_ERROR.includes(b.estado)) incompleto = true
    for (const r of b.registros) {
      items.push({ tipo: b.tipo, titulo: b.titulo, detalle: primero(r.atributosLimpios, CAMPOS_ALERTA) })
    }
  }
  return { items: unicos(items, (i) => `${i.tipo}|${i.titulo}|${i.detalle}`), incompleto }
}

export function resumirTerritorio(resultado) {
  const bloques = resultado?.bloques ?? []
  const errores = bloques
    .filter((b) => ESTADOS_ERROR.includes(b.estado))
    .map((b) => ({ titulo: b.titulo ?? b.id, estado: b.estado, mensaje: b.error?.mensaje ?? null }))
  const vacios = bloques.filter((b) => b.estado === 'sin_resultados').map((b) => b.titulo ?? b.id)
  const alertas = resumirAlertas(bloques)
  return {
    suelo: resumirSuelo(bloques),
    tratamientos: resumirTratamientos(bloques),
    usoActual: resumirUsoActual(bloques),
    usoPot: resumirUsoPot(bloques),
    alertas: { ...alertas, sinAlertas: alertas.items.length === 0 },
    errores,
    vacios,
    detalle: bloques.filter((b) => b.registros.length > 0 || ESTADOS_ERROR.includes(b.estado))
  }
}