// Norma de usos del suelo urbano y de expansión de Sabaneta: Acuerdo Municipal 07 de 2018 (PBOT), arts. 179-202.
// Modelo por zona de mezcla (baja, media, alta) y negocio. Lo no listado en la tabla de la zona está prohibido (art. 193).
// Fuente: extracto aportado por el usuario; las tablas de media mezcla y alta mezcla T2 se revisaron contra la imagen,
// el resto salió de OCR [verificar].

import { VIGENCIA, VERIFICACION, congelar } from './esquema.js'

const fuente = (articulo) => ({
  articulo: `${articulo} (págs. 232-287 del PDF)`,
  paginaPdf: 232,
  verificacion: VERIFICACION.EXTRAIDO_DE_TEXTO
})

const P = 'permitido'
const R = 'permitido_con_restricciones'
const N = 'no_permitido'
const V = 'verificar'
const ORDEN = ['BAJA', 'MEDIA_AREA_T2', 'MEDIA_AREA_T1_COR_T2', 'MEDIA_COR_T1', 'ALTA_T2', 'ALTA_T1', 'ALTA_COR']
const porZona = (...estados) => Object.fromEntries(ORDEN.map((z, i) => [z, estados[i]]))

const COND_BAR = [
  'Debe acoger la regulación de tamaño de locales de media mezcla, de ruido, de parqueaderos y otras.',
  'Art. 201: prohibido a menos de 200 m horizontales de un equipamiento educativo.'
]
const COND_TRANSITO = ['Exige estudio de tránsito aprobado, con superficie de parqueo y zona de regulación de taxis (art. 200, parágrafo).']

export const SABANETA = congelar({
  municipioSlug: 'Sabaneta',
  nombre: 'Acuerdo Municipal 07 de 2018 - Plan Básico de Ordenamiento Territorial (Sabaneta)',
  fechaAdopcion: '2018',
  fechaConsulta: '2026-11-17',
  vigencia: {
    estado: VIGENCIA.POR_VERIFICAR,
    fuente: 'Extracto del Acuerdo 07 de 2018 aportado por el usuario; falta confirmar modificaciones posteriores con la Secretaría de Planeación [verificar]'
  },
  cobertura: 'parcial',
  fuente: { url: 'https://www.sabaneta.gov.co', nota: '[verificar] URL exacta del acuerdo; datos tomados del extracto aportado por el usuario' },
  limitaciones: [
    'Solo suelo urbano y de expansión urbana. No cubre suelo rural, de protección, dotacional ni espacio público.',
    'Art. 193: lo no listado en la tabla de la zona se entiende prohibido.',
    'Las tablas de alta mezcla T1 y corredores de alta mezcla salieron de OCR [verificar]. Las páginas citadas son el inicio de la tabla de cada zona; solo restaurante (S-7) tiene la página de su fila.',
    'La capa que dice en qué zona de mezcla cae un predio no está en el texto del PBOT.',
    'Cualquier uso puede quedar condicionado por la amenaza o el riesgo del predio (arts. 58 a 62).',
    'Restaurante (S-7): verificado en imagen en 5 de las 7 zonas; alta Tipo 1 y corredores de alta mezcla solo por el texto del OCR [verificar].'
  ],
  disposicionesGenerales: [
    { tema: 'Usos no listados', resumen: 'Toda actividad no listada en la tabla de la zona se entiende prohibida.', fuente: fuente('187-7 y 193') },
    { tema: 'Equipamientos educativos', resumen: 'Se prohíbe la venta y el consumo de licor en establecimientos abiertos al público a menos de 200 m horizontales de un equipamiento educativo.', fuente: fuente('201') },
    { tema: 'Ruido', resumen: 'Se revisan los mapas de ruido vigentes y no se admiten nuevos impactos.', fuente: fuente('187-15 y 192') },
    { tema: 'Usos establecidos', resumen: 'Un uso anterior al Acuerdo conserva su derecho solo con mejoras locativas.', fuente: fuente('198') },
    { tema: 'Intensidad de uso en baja mezcla', resumen: 'El tamaño de los locales en baja mezcla lo limita la intensidad de uso según el tratamiento; el área mínima de un local es de 12 m².', fuente: fuente('197') }
  ],
  modeloMezcla: {
    // Páginas del PDF de la tabla de cada zona (inicio y fin), según la revisión del PDF [verificar]
    tablasPorZona: {
      BAJA: [252, 253],
      MEDIA_AREA_T2: [254, 256],
      MEDIA_AREA_T1_COR_T2: [256, 259],
      MEDIA_COR_T1: [259, 263],
      ALTA_T2: [264, 267],
      ALTA_T1: [267, 273],
      ALTA_COR: [274, 281]
    },
    zonas: [
      { codigo: 'BAJA', nombre: 'Áreas de baja mezcla de usos' },
      { codigo: 'MEDIA_AREA_T2', nombre: 'Áreas de media mezcla Tipo 2' },
      { codigo: 'MEDIA_AREA_T1_COR_T2', nombre: 'Áreas de media mezcla Tipo 1 y corredores de media mezcla Tipo 2' },
      { codigo: 'MEDIA_COR_T1', nombre: 'Corredores de media mezcla Tipo 1 (calle 77 Sur, carrera 45, Av. El Poblado)' },
      { codigo: 'ALTA_T2', nombre: 'Áreas de alta mezcla Tipo 2 (renovación por reactivación)' },
      { codigo: 'ALTA_T1', nombre: 'Áreas de alta mezcla Tipo 1 (renovación por redesarrollo)' },
      { codigo: 'ALTA_COR', nombre: 'Corredores de alta mezcla (Vía Regional y Av. Las Vegas)' }
    ],
    negocios: {
      farmacia: { codigo: 'C-1', porZona: porZona(P, P, P, P, P, P, P), condiciones: [], limitaTamanoEnBaja: true, fuente: fuente('194-196') },
      restaurante: {
        codigo: 'S-7 (restaurantes, cafeterías, panaderías y similares)',
        porZona: porZona(R, R, P, P, P, P, P),
        condicionesPorZona: {
          BAJA: ['En ningún caso se admite la venta y el consumo de licor.'],
          MEDIA_AREA_T2: ['En ningún caso se admite el consumo de licor.']
        },
        condiciones: ['La venta y el consumo de licor se rigen por S-9 (bares), no por S-7.'],
        limitaTamanoEnBaja: true,
        paginaPorZona: { BAJA: 253, MEDIA_AREA_T2: 255, MEDIA_AREA_T1_COR_T2: 257, MEDIA_COR_T1: 261, ALTA_T2: 265, ALTA_T1: 270, ALTA_COR: 277 },
        fuente: fuente('194-196')
      },
      licorera: {
        codigo: 'C-2 (estancos, solo venta de licor)',
        porZona: porZona(R, R, R, R, R, R, R),
        condiciones: [
          'En ningún caso se admite el consumo de licor en el establecimiento; si lo habrá, ya es un bar (S-9).',
          'Art. 201: prohibida la venta y el consumo de licor a menos de 200 m horizontales de un equipamiento educativo. El texto no nombra expresamente la venta sola: consúltalo con Planeación.'
        ],
        limitaTamanoEnBaja: true,
        fuente: fuente('194-196 y 201')
      },
      minimercado: { codigo: 'C-2 (autoservicio de menos de 600 m²)', porZona: porZona(R, R, R, R, R, R, R), condiciones: COND_TRANSITO, limitaTamanoEnBaja: true, fuente: fuente('194-196 y 200') },
      supermercado: { codigo: 'C-8 (gran superficie, desde 600 m²)', porZona: porZona(N, N, N, N, N, R, R), condiciones: COND_TRANSITO, fuente: fuente('194-196 y 200') },
      tienda_tecnologia: { codigo: 'C-3', porZona: porZona(N, P, P, P, P, P, P), condiciones: [], fuente: fuente('194-196') },
      gimnasio: { codigo: 'S-11', porZona: porZona(N, R, R, R, R, R, R), condiciones: ['Se restringe a locales con el área que fija la categoría de uso del suelo (art. 197).'], fuente: fuente('194-197') },
      bar: { codigo: 'S-9 (bares y licoreras con consumo)', porZona: porZona(N, N, R, R, R, R, R), condiciones: COND_BAR, fuente: fuente('194-196 y 201') },
      discoteca: {
        codigo: 'S-9 (pubs, discotecas, tabernas)',
        porZona: porZona(N, N, R, R, V, V, V),
        condiciones: COND_BAR,
        notaVerificar: 'La palabra "discotecas" solo aparece en las tablas de media mezcla; en alta mezcla el S-9 lista "licoreras, tiendas, bares". Como lo no listado está prohibido (art. 193), hay que confirmarlo con Planeación.',
        fuente: fuente('194-196 y 201')
      }
    }
  }
})

// ---- Zona del punto (capa 1 de POT_Sabaneta, campo USO) ----
// Se lee por el nombre que publica la capa, que sigue los nombres del PBOT. Si el texto no coincide con un patrón
// estricto, devuelve 'sin_equivalencia': no adivina [verificar con los valores reales de la capa].
const sinTildesS = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

function zonaDeNombre(texto) {
  const t = sinTildesS(texto)
  const corredor = t.includes('corredor')
  const tipo = /tipo\s*1\b/.test(t) ? 1 : /tipo\s*2\b/.test(t) ? 2 : null
  if (t.includes('baja')) return 'BAJA'
  if (t.includes('media')) {
    if (corredor) return tipo === 1 ? 'MEDIA_COR_T1' : tipo === 2 ? 'MEDIA_AREA_T1_COR_T2' : null
    return tipo === 2 ? 'MEDIA_AREA_T2' : tipo === 1 ? 'MEDIA_AREA_T1_COR_T2' : null
  }
  if (t.includes('alta')) {
    if (corredor) return 'ALTA_COR'
    return tipo === 1 ? 'ALTA_T1' : tipo === 2 ? 'ALTA_T2' : null
  }
  return null
}

export function zonaDeSabaneta(resultadoTerritorial) {
  const usos = (resultadoTerritorial?.bloques ?? [])
    .filter((b) => b.tipo === 'uso_normativo_pot')
    .flatMap((b) => b.registros ?? [])
    .map((r) => {
      const a = Object.assign({}, r, r?.atributos, r?.atributosLimpios, r?.atributosOriginales)
      const clave = Object.keys(a).find((k) => /^uso$/i.test(k))
      return clave ? a[clave] : null
    })
    .filter((v) => typeof v === 'string' && v.trim() !== '')
  if (usos.length === 0) return { estado: 'sin_registros' }
  // Solo cuentan las descripciones de mezcla (la capa rural también trae un campo USO)
  const distintos = [...new Set(usos.map((u) => u.trim()))].filter((u) => sinTildesS(u).includes('mezcla'))
  if (distintos.length === 0) {
    const d = usos[0].trim()
    const t = sinTildesS(d)
    const categoria = t.includes('espacio publico') ? 'espacio público' : t.includes('dotacional') ? 'un área dotacional' : t.includes('forestal') ? 'suelo forestal protector' : null
    return categoria ? { estado: 'sin_regimen', descripcion: d, categoria } : { estado: 'sin_equivalencia', descripcion: d }
  }
  const zonas = new Set()
  for (const d of distintos) {
    const z = zonaDeNombre(d)
    if (!z) return { estado: 'sin_equivalencia', descripcion: d }
    zonas.add(z)
  }
  if (zonas.size > 1) return { estado: 'varias_zonas', descripciones: distintos }
  return { estado: 'ok', zonaId: [...zonas][0], descripcion: distintos[0] }
}