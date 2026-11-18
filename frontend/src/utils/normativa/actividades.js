// Catálogo de actividades que el usuario puede elegir, y su correspondencia con las tipologías de cada norma.
// Solo hay mapeos 'explicita' cuando el texto de la norma nombra la actividad. Los 'inferida' son una sugerencia
// que el motor NO usa para concluir. Datos puros: sin red, sin React.

import { congelar } from './esquema.js'

export const CONFIANZA_MAPEO = Object.freeze({ EXPLICITA: 'explicita', INFERIDA: 'inferida' })

// Mapeo a una fila de la Tabla 27 de un municipio por CIIU. 'explicita' solo si la descripción de la fila nombra la actividad.
const mapeoCiiu = (ciiu, descripcionFila, confianza, articulo, paginaPdf, nota) => ({
  ciiu,
  descripcionFila,
  confianza,
  fuente: { articulo, paginaPdf },
  nota
})

const mapeo = (tipologia, confianza, articulo, paginaPdf, nota) => ({
  tipologia,
  confianza,
  fuente: { articulo, paginaPdf },
  nota
})

// La Estrella: tipologías de la Tabla 158 del Documento Formulación (pp. 570-572 del PDF; se cita la página inicial).
const ART_LE = 'Tabla 158 de la Formulación (pp. 570-572 del PDF)'
const PAG_LE = 570

export const ACTIVIDADES = [
  {
    id: 'licorera',
    nombre: 'Licorera o estanquillo',
    terminosNorma: ['licoreras'],
    mapeos: {
      Itagui: mapeo('C-2', CONFIANZA_MAPEO.EXPLICITA, '175', 122, 'La tipología se llama "licoreras y estanquillos".'),
      LaEstrella: mapeo('C2', CONFIANZA_MAPEO.EXPLICITA, ART_LE, PAG_LE, 'C2 lista "estancos y estanquillos". La norma también lista en S5 los establecimientos con expendio de licor.')
    },
    mapeoCiiu: {
      Envigado: mapeoCiiu('522', 'Comercio al por menor de alimentos, bebidas y tabacos, en establecimientos especializados', CONFIANZA_MAPEO.INFERIDA, '186 (Tabla 27)', 126, 'La fila agrupa alimentos, bebidas y tabacos; no nombra licoreras. Confirmar con Planeación.')
    }
  },
  {
    id: 'restaurante',
    nombre: 'Restaurante o cafetería',
    terminosNorma: ['restaurantes'],
    mapeos: {
      Itagui: mapeo('S-7', CONFIANZA_MAPEO.EXPLICITA, '176', 124, 'El texto fija el área mínima de restaurantes y cafeterías dentro de S-7.'),
      LaEstrella: mapeo('S7', CONFIANZA_MAPEO.INFERIDA, ART_LE, PAG_LE, 'S7 nombra cafetería y repostería sin licor, pero no restaurantes. Si el local vende licor, la norma lo ubica en S5.')
    },
    mapeoCiiu: {
      Envigado: mapeoCiiu('552', 'Expendio de alimentos preparados en el sitio de venta', CONFIANZA_MAPEO.EXPLICITA, '186 (Tabla 27)', 126, 'La descripción de la fila coincide con restaurantes y cafeterías.')
    }
  },
  {
    id: 'supermercado',
    nombre: 'Supermercado',
    terminosNorma: [],
    mapeos: {
      Itagui: mapeo('C-11', CONFIANZA_MAPEO.EXPLICITA, '175', 123, 'La tipología se llama "supermercados y almacenes por departamentos".'),
      LaEstrella: mapeo('C7', CONFIANZA_MAPEO.EXPLICITA, ART_LE, PAG_LE, 'La tipología se llama "supermercados y almacenes por departamentos".')
    },
    mapeoCiiu: {
      Envigado: mapeoCiiu('521', 'Comercio al por menor en establecimientos no especializados', CONFIANZA_MAPEO.INFERIDA, '186 (Tabla 27)', 125, 'La fila no nombra supermercados; es la más cercana. Confirmar con Planeación.')
    }
  },
  {
    id: 'minimercado',
    nombre: 'Minimercado o tienda de barrio',
    terminosNorma: [],
    mapeos: {
      Itagui: mapeo('C-1', CONFIANZA_MAPEO.INFERIDA, '175', 122, 'La norma no nombra el minimercado; C-1 (comercio minorista básico) sería la más cercana. Confirmar con Planeación.'),
      LaEstrella: mapeo('C1', CONFIANZA_MAPEO.INFERIDA, ART_LE, PAG_LE, 'La norma no define minimercado. C1 (minorista básico: víveres, graneros, misceláneas) sería la más cercana; si es un "mercado mediano", la norma lo ubica en C2.')
    },
    mapeoCiiu: {
      Envigado: mapeoCiiu('521', 'Comercio al por menor en establecimientos no especializados', CONFIANZA_MAPEO.INFERIDA, '186 (Tabla 27)', 125, 'La fila no nombra minimercados; es la más cercana. Confirmar con Planeación.')
    }
  },
  { id: 'discoteca', nombre: 'Discoteca o bar', terminosNorma: ['discotecas', 'bares', 'tabernas'],
    mapeos: {
      Itagui: mapeo('S-6', CONFIANZA_MAPEO.INFERIDA, '176', 124, 'La norma no nombra discotecas ni bares como tipología. S-6 (servicios personales) exige insonorización y retiro a colegios, pero también podría ser S-23 (alto impacto social). [verificar]'),
      LaEstrella: mapeo('S5', CONFIANZA_MAPEO.EXPLICITA, ART_LE, PAG_LE, 'S5 lista "discotecas y establecimientos con expendio de licor".')
    },
    mapeoCiiu: {
      Envigado: mapeoCiiu('553', 'Expendio de bebidas alcohólicas para el consumo dentro del establecimiento', CONFIANZA_MAPEO.EXPLICITA, '186 (Tabla 27)', 126, 'La fila describe el expendio de bebidas alcohólicas para consumo dentro del establecimiento, que es lo que hace un bar o una discoteca [verificar]. Ver también art. 197 (solo en cinco polígonos del Centro tradicional).')
    } },
  { id: 'gimnasio', nombre: 'Gimnasio', terminosNorma: ['gimnasios'],
    mapeos: {
      Itagui: mapeo('S-5', CONFIANZA_MAPEO.INFERIDA, '176', 124, 'La norma nombra gimnasios solo en los estándares de ruido, no en una tipología. S-5 (servicios medios y específicos) es una suposición; también podría ser S-6 o D-1. [verificar]'),
      LaEstrella: mapeo('S7', CONFIANZA_MAPEO.EXPLICITA, ART_LE, PAG_LE, 'S7 (personales generales) lista "gimnasio, sauna, turco".')
    },
    mapeoCiiu: {
      Envigado: mapeoCiiu('924', 'Actividades deportivas y otras actividades de esparcimiento', CONFIANZA_MAPEO.INFERIDA, '186 (Tabla 27)', 131, 'La fila no nombra gimnasios. Confirmar con Planeación.')
    } },
  { id: 'farmacia', nombre: 'Farmacia o droguería', terminosNorma: [],
    mapeos: {
      Itagui: mapeo('C-1', CONFIANZA_MAPEO.INFERIDA, '175', 122, 'La norma no nombra farmacias ni droguerías. C-1 (comercio minorista básico) es una suposición; también podría ser S-15 (salud y estética). [verificar]'),
      LaEstrella: mapeo('C1', CONFIANZA_MAPEO.EXPLICITA, ART_LE, PAG_LE, 'C1 (minorista básico) lista "farmacias".')
    },
    mapeoCiiu: {
      Envigado: mapeoCiiu('523', 'Comercio al por menor de productos nuevos de consumo doméstico, en establecimientos especializados', CONFIANZA_MAPEO.INFERIDA, '186 (Tabla 27)', 126, 'La fila no nombra farmacias ni droguerías (el art. 184 sí las menciona como uso con distancias). Confirmar.')
    } },
  { id: 'tienda_tecnologia', nombre: 'Tienda de tecnología', terminosNorma: [],
    mapeos: {
      Itagui: mapeo('C-3', CONFIANZA_MAPEO.INFERIDA, '175', 122, 'La norma no nombra tiendas de tecnología. C-3 (comercio minorista suntuario) es una suposición. [verificar]'),
      LaEstrella: mapeo('C2', CONFIANZA_MAPEO.INFERIDA, ART_LE, PAG_LE, 'La norma no nombra tiendas de tecnología. C2 (minorista medio suntuario) incluye electrodomésticos, repuestos y artículos eléctricos.')
    },
    mapeoCiiu: {
      Envigado: mapeoCiiu('524', 'Comercio al por menor de otros nuevos productos de consumo, en establecimientos especializados', CONFIANZA_MAPEO.INFERIDA, '186 (Tabla 27)', 126, 'La fila no nombra tiendas de tecnología. Confirmar con Planeación.')
    } }
]

congelar(ACTIVIDADES)

export function actividadPorId(id, catalogo = ACTIVIDADES) {
  return catalogo.find((a) => a.id === id) ?? null
}

const PATRON_TIPOLOGIA = /^[A-Z]{1,2}-[A-Z0-9]+$/
// La Estrella usa códigos compactos: R, C1, S5, I2, SRC1.
const PATRON_TIPOLOGIA_COMPACTO = /^(?:R|[CSI]\d{1,2}|SRC\d)$/

export function validarCatalogo(catalogo = ACTIVIDADES) {
  const errores = []
  const ids = new Set()
  for (const a of catalogo) {
    if (!a.id || ids.has(a.id)) errores.push(`actividad repetida o sin id: ${a.id}`)
    ids.add(a.id)
    if (!a.nombre) errores.push(`${a.id}: falta el nombre`)
    for (const [slug, m] of Object.entries(a.mapeoCiiu ?? {})) {
      if (!/^\d{3,4}$/.test(m.ciiu)) errores.push(`${a.id}/${slug}: CIIU inválido`)
      if (!Object.values(CONFIANZA_MAPEO).includes(m.confianza)) errores.push(`${a.id}/${slug}: confianza CIIU inválida`)
      if (!Number.isInteger(m.fuente?.paginaPdf)) errores.push(`${a.id}/${slug}: falta la página del CIIU`)
    }
    for (const [slug, m] of Object.entries(a.mapeos ?? {})) {
      const patron = slug === 'LaEstrella' ? PATRON_TIPOLOGIA_COMPACTO : PATRON_TIPOLOGIA
      if (!patron.test(m.tipologia)) errores.push(`${a.id}/${slug}: tipología inválida`)
      if (!Object.values(CONFIANZA_MAPEO).includes(m.confianza)) errores.push(`${a.id}/${slug}: confianza inválida`)
      if (!Number.isInteger(m.fuente?.paginaPdf)) errores.push(`${a.id}/${slug}: falta la página`)
    }
  }
  return errores
}

// Solo para actividades que la norma no nombra: tipologías entre las que la persona elige. Son suposiciones [verificar].
export const TIPOLOGIAS_CANDIDATAS = Object.freeze({
  Itagui: {
    minimercado: ['C-1', 'C-3'],
    discoteca: ['S-6', 'S-7', 'S-23'],
    gimnasio: ['S-4', 'S-5', 'S-6', 'D-1'],
    farmacia: ['C-1', 'S-15'],
    tienda_tecnologia: ['C-1', 'C-3']
  },
  LaEstrella: {
    minimercado: ['C1', 'C2'],
    restaurante: ['S7', 'S5'],
    tienda_tecnologia: ['C2']
  }
})