// Norma de usos del suelo urbano y de expansión de La Estrella: PBOT 2023, según el Documento Formulación de la
// revisión del PBOT (enero de 2023), sección 8.3.2: Tabla 158 (tipologías, pp. 570-572 del PDF) y Tabla 160
// (asignación de usos por área de actividad, pp. 588-589). Datos puros: sin red, sin React. Describe la norma; no decide.
// La norma asigna usos por ÁREA DE ACTIVIDAD, no por polígono: el documento no dice en qué área cae cada predio.

import { VERIFICACION, VIGENCIA, congelar } from './esquema.js'

const fuente = (articulo, paginaPdf, verificacion = VERIFICACION.EXTRAIDO_DE_TEXTO) => ({ articulo, paginaPdf, verificacion })

const FUENTE_TIPOLOGIAS = fuente('Tabla 158 de la Formulación', 570)

export const REGLA_RESTRINGIDO =
  'Uso restringido: por la magnitud de sus instalaciones, procesos o impacto ambiental puede afectar el uso principal, por lo que debe cumplir controles espaciales y ambientales. El documento no detalla cuáles.'

const tip = (codigo, uso, nombre, incluye, restricciones = []) => ({
  codigo,
  uso,
  nombre,
  incluye,
  restricciones,
  fuente: FUENTE_TIPOLOGIAS
})

// `incluye` resume las actividades que lista la Tabla 158; el texto completo está en el PDF.
const TIPOLOGIAS = [
  tip('R', 'residencial', 'Residencial', 'Vivienda unifamiliar, bifamiliar, trifamiliar y multifamiliar, y nuevas formas de habitar.'),
  tip('C1', 'comercial', 'Minorista básico (cotidiano)', 'Víveres, huevos, verduras, frutas, graneros, carnicerías, pescaderías, salsamentarias, cigarrerías, panaderías, misceláneas, confecciones, aseo, farmacias.'),
  tip('C2', 'comercial', 'Minorista medio suntuario', 'Telas, vestidos, zapatos, cosméticos, muebles, electrodomésticos y sus repuestos, discos, floristerías, estancos, estanquillos, papelerías, librerías, regalos, juguetes, artículos deportivos y musicales, mercados medianos, ferretería menor, joyerías, artículos eléctricos, entre otros.'),
  tip('C3', 'comercial', 'Industrial liviano y pesado', 'Comercio minorista y mayorista con almacenamiento anexo: accesorios y repuestos de maquinaria y automotores, ferretería, materiales de construcción, asfaltos, motores, combustibles, calderas, entre otros.'),
  tip('C4', 'comercial', 'Recuperación de materiales', 'Compra y venta de chatarra menor, papeles, cartones, plásticos, latón, madera y textiles.'),
  tip('C5', 'comercial', 'Sala de exhibición de maquinaria y artículos al por mayor', 'Compra y venta de vehículos, maquinaria de construcción, agrícola e industrial, motores y plantas eléctricas, por exhibición; sin almacenamiento ni expendio directo.'),
  tip('C6', 'comercial', 'Centro de acopio o plaza de mercado', 'Almacenamiento y expendio al por mayor de víveres.', ['Exige parqueo y cargue y descargue de al menos el área construida.']),
  tip('C7', 'comercial', 'Supermercados y almacenes por departamentos', 'Víveres, artículos complementarios, personales y para el hogar.', ['Exige parqueo para visitantes.']),
  tip('C8', 'comercial', 'Pasajes y centros comerciales', 'Conjunto de locales dedicados a la venta de artículos y servicios diversos.'),
  tip('C9', 'comercial', 'Mayorista medio suntuario', 'Comercio al por mayor de la tipología C2.', ['Requiere almacenamiento anexo.']),
  tip('C10', 'comercial', 'Alto riesgo colectivo', 'Pólvora, explosivos, municiones y, al por mayor, combustibles sólidos o gaseosos.'),
  tip('S1', 'servicios', 'Mayor de reparación y mantenimiento', 'Talleres de automotores, motos y maquinaria agrícola y de construcción.'),
  tip('S2', 'servicios', 'Medios de reparación y mantenimiento industrial', 'Talleres de equipo industrial, plantas, transformadores, motores, refrigeración, bombeo y calderas.'),
  tip('S3', 'servicios', 'Taller industrial mediano', 'Reparación de piezas de maquinaria, soldadura, niquelado, vulcanizado y cromado.'),
  tip('S4', 'servicios', 'Taller de servicio liviano', 'Servicio mixto comercial y de reparaciones: electrodomésticos, cerrajerías, muebles, plomería, instalaciones eléctricas, publicidad visual.'),
  tip('S5', 'servicios', 'Medios específicos', 'Prenderías, juegos de azar, hoteles, pensiones, teatros, cines, discotecas y establecimientos con expendio de licor.'),
  tip('S6', 'servicios', 'Personales especiales', 'Lavandería, heliográficas, litografía y tipografía, implementos para banquetes, fotograbado.'),
  tip('S7', 'servicios', 'Personales generales', 'Ópticas, fotografías, salas de belleza, gimnasio, sauna, turco, reparación de vestido y calzado, consultorios individuales, esparcimiento público, sala de té, cafetería, repostería sin expendio de licor.'),
  tip('S8', 'servicios', 'Oficinas', 'Oficinas.'),
  tip('S9', 'servicios', 'Servicios básicos', 'Administración pública y diplomática, religiosa, educacionales, bancarias y crediticias.'),
  tip('S10', 'servicios', 'Generales de depósito', 'Almacenamiento de toda clase de productos y materia prima.'),
  tip('S11', 'servicios', 'Al vehículo liviano (hasta 3 t)', 'Estaciones de servicio, servitecas, cambio de aceite, lavado, montallantas, afinación, parqueaderos.'),
  tip('S12', 'servicios', 'Al vehículo pesado (más de 3 t)', 'Estaciones de servicio, parqueo a nivel, servitecas, lavado, montallantas, afinación de motor.'),
  tip('S13', 'servicios', 'Mortuorio', 'Funeraria, velación, cementerios con bóvedas y hornos crematorios.'),
  tip('S14', 'servicios', 'Procesamiento, recuperación y selección de materiales de reciclaje', 'Procesamiento, recuperación y selección de materiales de reciclaje.'),
  tip('S15', 'servicios', 'Salubridad', 'Clínicas, hospitales, consultorios médicos y odontológicos, laboratorios.'),
  tip('SRC1', 'otro', 'Recreativo: espacio público', 'Parques, plazas, zonas verdes, antejardines, bosques, parques lineales, retiros obligatorios y sistema vial (la Tabla 158 los llama RC1).'),
  tip('SRC2', 'otro', 'Recreativo: centros deportivos y de espectáculos', 'Centros deportivos y de espectáculos, juegos mecánicos y similares (la Tabla 158 los llama RC2).'),
  tip('I1', 'industrial', 'Industria mayor', 'Industria susceptible de generar contaminación, ruido, vibraciones, conflictos viales u otros efectos nocivos.'),
  tip('I2', 'industrial', 'Industria mediana', 'Industria que opera dentro de rangos de compatibilidad con otros usos.'),
  tip('I3', 'industrial', 'Industria artesanal', 'Procesos de origen familiar, cooperativos o similares que no requieren energía industrial ni grandes áreas.')
]

const CODIGOS = TIPOLOGIAS.map((t) => t.codigo)

const NOTAS_MARCA = {
  '**': { texto: 'Solo serán localizadas en la UAU 1 del Plan Parcial El Altico.', paginaPdf: 589 },
  '****': { texto: 'Solo se permitirá la actividad de funeraria y velación en el polígono con código residencial; las demás actividades de S13, incluida la velación, se podrán desarrollar en el polígono industrial tipo 1.', paginaPdf: 589 },
  '*****': { texto: 'Si se realiza actividad de lavadero y servitecas, se deberán realizar al interior del parqueadero.', paginaPdf: 589 }
}

const ORDEN = ['principal', 'complementario', 'restringido', 'prohibido']
const DELIMITACION =
  'Área de actividad del suelo urbano y de expansión urbana. La Formulación no trae una tabla de polígonos por área: esa asignación está en la cartografía del PBOT.'

const area = (codigo, nombre, categorias, { marcas = {}, notas = [] } = {}) => {
  const { principal, complementario, restringido, prohibido } = categorias
  const listados = Object.values(categorias).flat()
  const enProhibido = new Set(prohibido)
  const repetidos = [...new Set(listados)].filter((c) => ORDEN.filter((k) => categorias[k].includes(c)).length > 1)
  const avisoRepetidos = repetidos.map((c) => {
    const cats = ORDEN.filter((k) => categorias[k].includes(c))
    return `La tabla lista ${c} como ${cats.join(' y como ')}; se toma la lectura más restrictiva.`
  })
  const simbolos = [...new Set(Object.values(marcas))]
  return {
    codigo,
    nombre,
    delimitacion: DELIMITACION,
    categorias,
    compatibles: [...new Set([...principal, ...complementario])].filter((c) => !enProhibido.has(c)),
    condicionados: restringido.filter((c) => !enProhibido.has(c)),
    prohibidosCodigos: [...prohibido],
    noListados: CODIGOS.filter((c) => !listados.includes(c)),
    prohibidos: 'los usos que la tabla no lista (art. 2.2.2.1.2.1.3 del Decreto 1077 de 2015)',
    reglaCondicionados: REGLA_RESTRINGIDO,
    marcas,
    notasMarcas: Object.fromEntries(simbolos.map((s) => [s, NOTAS_MARCA[s]])),
    observaciones: [...notas, ...avisoRepetidos],
    fuente: fuente('Tabla 160', 588, VERIFICACION.TRANSCRITO_DE_IMAGEN)
  }
}

const AREAS = [
  area('RES1', 'Residencial tipo 1', {
    principal: ['R', 'SRC1'],
    complementario: ['C1', 'C2', 'S8', 'I3', 'SRC2', 'S11'],
    restringido: ['C3', 'S5', 'S6', 'S7', 'S9', 'S15', 'S13'],
    prohibido: ['C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'S1', 'S2', 'S3', 'S4', 'S10', 'S12', 'S14', 'I1', 'I2']
  }, { marcas: { S11: '*****', S13: '****' } }),
  area('RES2', 'Residencial tipo 2', {
    principal: ['R', 'SRC1'],
    complementario: ['C1', 'C2', 'S6', 'S7', 'S8', 'S9', 'SRC2'],
    restringido: ['C7', 'C8', 'S4', 'S5', 'S14', 'S15', 'I3', 'S11', 'S13'],
    prohibido: ['C3', 'C4', 'C5', 'C6', 'C9', 'C10', 'S1', 'S2', 'S3', 'S10', 'S12', 'I1', 'I2', 'I3']
  }, { marcas: { S11: '*****', S13: '****' } }),
  area('RES3', 'Residencial tipo 3', {
    principal: ['R', 'S9', 'SRC1'],
    complementario: ['C1', 'C2', 'S6', 'S7', 'S8', 'S15', 'I3', 'SRC2'],
    restringido: ['C3', 'C6', 'C7', 'C8', 'C9', 'S4', 'S5', 'S10', 'S11', 'S13'],
    prohibido: ['C4', 'C5', 'C10', 'S1', 'S2', 'S3', 'S12', 'S14', 'I1', 'I2']
  }, { marcas: { S13: '****' } }),
  area('RES4', 'Residencial tipo 4', {
    principal: ['R', 'C1', 'SRC1'],
    complementario: ['C2', 'C8', 'S6', 'S7', 'S8', 'S9', 'SRC2'],
    restringido: ['C6', 'C7', 'C9', 'S4', 'S5', 'S15', 'I3', 'S11', 'S13'],
    prohibido: ['C3', 'C4', 'C5', 'C10', 'S1', 'S2', 'S3', 'S10', 'S12', 'S14', 'I1', 'I2']
  }, { marcas: { S11: '*****', S13: '****' } }),
  area('RES5', 'Residencial tipo 5', {
    principal: ['R', 'SRC1'],
    complementario: ['C1', 'C2', 'S6', 'S7', 'S8', 'S9', 'I3', 'SRC2'],
    restringido: ['C3', 'C4', 'C6', 'C7', 'C8', 'C9', 'S4', 'S5', 'S10', 'S14', 'S15', 'S11', 'S13'],
    prohibido: ['C5', 'C10', 'S1', 'S2', 'S3', 'S12', 'I1', 'I2']
  }, { marcas: { S11: '*****', S13: '****' } }),
  area('RES6', 'Residencial tipo 6', {
    principal: ['R'],
    complementario: ['C1', 'SRC1'],
    restringido: ['C2', 'S6', 'S7', 'S9', 'SRC2', 'S11', 'S13'],
    prohibido: ['C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'S1', 'S2', 'S3', 'S4', 'S5', 'S8', 'S10', 'S12', 'S14', 'S15', 'I1', 'I2', 'I3']
  }, {
    marcas: { S11: '*****', S13: '****' },
    notas: ['Corresponde al polígono de tratamiento SU_CN3_10 y queda sujeto a estudios de detalle posteriores.']
  }),
  area('AAM1', 'Área de actividad múltiple 1', {
    principal: ['R', 'C1', 'SRC1'],
    complementario: ['C2', 'S6', 'S7', 'S8', 'S9', 'S15', 'I3', 'SRC2', 'S11'],
    restringido: ['C7', 'C8', 'S5'],
    prohibido: ['C3', 'C4', 'C5', 'C6', 'C9', 'C10', 'S1', 'S2', 'S3', 'S4', 'S10', 'S12', 'S13', 'S14', 'I1', 'I2']
  }, {
    marcas: { S11: '*****' },
    notas: ['Para el polígono ZU17_API01 rige la asignación de la Resolución 1999 de 2010, que es distinta de esta fila.']
  }),
  area('AAM2', 'Área de actividad múltiple 2', {
    principal: ['R', 'C1', 'SRC1'],
    complementario: ['C2', 'C8', 'S5', 'S6', 'S7', 'S8', 'S9', 'SRC2'],
    restringido: ['C6', 'C7', 'C9', 'S4', 'S5', 'S10', 'S11', 'S15', 'I3'],
    prohibido: ['C3', 'C4', 'C5', 'C10', 'S1', 'S2', 'S3', 'S12', 'S14', 'S13', 'I1', 'I2']
  }),
  area('AAM3', 'Área de actividad múltiple 3', {
    principal: ['C3', 'C5', 'C7', 'C9', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'SRC1'],
    complementario: ['C2', 'C8', 'S3', 'S10', 'S11', 'S15', 'SRC2'],
    restringido: ['C4', 'C6', 'S1', 'S2', 'S10', 'I2', 'I3'],
    prohibido: ['R', 'C1', 'C10', 'S12', 'S13', 'S14', 'I1']
  }, { marcas: { S3: '**', S10: '**' } }),
  area('IND1', 'Industrial tipo 1', {
    principal: ['C2', 'C3', 'C7', 'C8', 'S1', 'S2', 'I2', 'SRC1', 'SRC2'],
    complementario: ['C1', 'C5', 'C6', 'C9', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'I3'],
    restringido: ['C4', 'S13', 'S14', 'S15', 'I1'],
    prohibido: ['R', 'C10']
  }),
  area('IND2', 'Industrial tipo 2', {
    principal: ['I2', 'I3', 'SRC1'],
    complementario: ['C2', 'C3', 'C5', 'C6', 'C7', 'C8', 'C9', 'S6', 'S7', 'S8', 'S9'],
    restringido: ['S4', 'S5', 'S10', 'S15', 'I1', 'S11'],
    prohibido: ['R', 'C4', 'C10', 'S1', 'S2', 'S3', 'S12', 'S13', 'S14']
  }),
  area('IND3', 'Industrial tipo 3', {
    principal: ['C3'],
    complementario: ['SRC1'],
    restringido: ['R', 'C1', 'C2', 'C7', 'C8', 'S6', 'S7', 'S8', 'S9', 'S15', 'I3', 'SRC2', 'S11'],
    prohibido: ['C4', 'C5', 'C6', 'C10', 'S1', 'S2', 'S3', 'S4', 'S5', 'S10', 'S12', 'S13', 'S14', 'I1', 'I2']
  }, {
    notas: ['Las categorías de uso de este polígono quedan sujetas a las determinantes de un fallo judicial (radicado 05001-33-31-010-2009-00226-00) y a las aclaraciones de la audiencia del 14 de septiembre de 2012.']
  }),
  area('COR1', 'Corredores de actividad tipo 1', {
    principal: ['C1', 'C2', 'S6', 'S7'],
    complementario: ['R', 'S8', 'S9', 'I3'],
    restringido: ['C7', 'C8', 'S4', 'S5', 'S15', 'S11'],
    prohibido: ['C3', 'C4', 'C5', 'C6', 'C10', 'S1', 'S2', 'S3', 'S10', 'S11', 'S12', 'S13', 'S14', 'I1', 'I2']
  }),
  area('COR2', 'Corredores de actividad tipo 2', {
    principal: ['C2', 'C7', 'C8', 'S6', 'S7', 'S8', 'S9'],
    complementario: ['R', 'C1', 'S4', 'S5', 'S15', 'I3'],
    restringido: ['C6', 'C9', 'S10', 'S11'],
    prohibido: ['C3', 'C4', 'C5', 'C10', 'S1', 'S2', 'S3', 'S12', 'S13', 'S14', 'I1', 'I2']
  }),
  area('ESP', 'Corredor especializado', {
    principal: ['C3', 'C5', 'S1', 'S2', 'S3'],
    complementario: ['C2', 'C5', 'C7', 'C8', 'S4', 'I3'],
    restringido: ['C1', 'C4', 'C6', 'C9', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'I2'],
    prohibido: ['C10', 'S13', 'S14', 'I1', 'R', 'S15']
  })
]

export const LA_ESTRELLA = congelar({
  municipioSlug: 'LaEstrella',
  formatoCodigos: 'compacto',
  nombre: 'PBOT de La Estrella 2023 (Acuerdo 003 de 2023 según el documento), a partir del Documento Formulación de enero de 2023',
  fechaAdopcion: '2023',
  fechaConsulta: '2026-11-18',
  vigencia: {
    estado: VIGENCIA.POR_VERIFICAR,
    fuente:
      'El documento indica que el PBOT vigente es el Acuerdo 003 de 2023 (2023-2035) y que el Acuerdo 042 de 2008 es el PBOT anterior. Una nota de prensa de enero de 2026 confirma que se aplica un PBOT aprobado en 2023. Las tablas salen del documento de formulación, no del acuerdo adoptado.'
  },
  cobertura: 'parcial',
  // [verificar] Es el dominio del municipio; falta la URL del PDF Formulacion_La_Estrella_AJUSTES_Enero_30_2023.pdf.
  fuente: { url: 'https://www.laestrella.gov.co/', archivo: 'Formulacion_La_Estrella_AJUSTES_Enero_30_2023.pdf' },
  limitaciones: [
    'Las tablas salen del documento de formulación (enero de 2023), no del texto del Acuerdo adoptado: hay que contrastarlas con el Acuerdo 003 de 2023.',
    'La norma asigna los usos por área de actividad y el documento no dice en qué área cae cada predio (eso está en la cartografía del PBOT). Por eso GeoAburrá no puede ubicar el área desde el punto.',
    'Para los usos restringidos el documento solo dice que exigen controles espaciales y ambientales; no lista las condiciones.',
    'Lo que la tabla no lista se entiende prohibido (Decreto 1077 de 2015). Cinco filas repiten un código en dos categorías: se toma la lectura más restrictiva.',
    'No se cargó el suelo rural ni suburbano, ni las tablas de homologación acústica. El documento no fija distancias entre establecimientos, aforos, horarios ni parqueaderos por actividad.'
  ],
  tipologias: TIPOLOGIAS,
  zonas: AREAS,
  disposicionesGenerales: [
    { tema: 'Usos no listados', resumen: 'Los usos y actividades que no estén relacionados en la tabla se consideran prohibidos.', fuente: fuente('Notas de la Tabla 160', 589, VERIFICACION.TRANSCRITO_DE_IMAGEN) },
    { tema: 'Equipamientos educativos', resumen: 'En un radio de 200 metros alrededor de los equipamientos educativos se prohíben los establecimientos abiertos al público de venta y consumo de licor, casino y juegos de azar, talleres industriales y servicios al vehículo.', fuente: fuente('8.3.2.5 Criterios de manejo de los usos', 573) },
    { tema: 'Gran formato', resumen: 'En los usos comerciales de gran formato, o los que agrupan locales con áreas superiores a 600 m², se deben mitigar los impactos en la movilidad mediante estudios de movilidad.', fuente: fuente('8.3.2.5 Criterios de manejo de los usos', 573) },
    { tema: 'Ruido', resumen: 'Se acogen las regulaciones de emisión de ruido para usos diferentes al residencial, de modo que no se permitan nuevos impactos.', fuente: fuente('8.3.2.5 Criterios de manejo de los usos', 573) },
    { tema: 'Usos preexistentes', resumen: 'Se reconocen los usos preexistentes con licencia urbanística; si la actividad termina o se pide licencia de ampliación, modificación u obra nueva, deben acogerse a las normas de esta revisión.', fuente: fuente('8.3.2.10 Transición', 591) },
    { tema: 'Suelos de protección', resumen: 'En los suelos de protección por retiro a fuentes hídricas, por amenaza alta por inundaciones y de aprovisionamiento de servicios públicos, el residencial y las actividades comerciales, industriales y de servicio están prohibidos.', fuente: fuente('8.3.2.9 Suelos de protección', 590) }
  ]
})

export const ZONAS_CON_MATRIZ = LA_ESTRELLA.zonas.map((z) => z.codigo)

const MAS_RESTRICTIVA = ['prohibido', 'restringido', 'complementario', 'principal']

// 'principal' | 'complementario' | 'restringido' | 'prohibido' | null (no listado). Si la tabla repite un código, gana la lectura más restrictiva.
export function categoriaEnZona(zonaDatos, codigo) {
  return MAS_RESTRICTIVA.find((k) => zonaDatos?.categorias?.[k]?.includes(codigo)) ?? null
}

// Cómo trata cada área de actividad una tipología.
export function estadoEnAreas(codigo) {
  return LA_ESTRELLA.zonas.map((z) => ({
    areaId: z.codigo,
    nombre: z.nombre,
    categoria: categoriaEnZona(z, codigo),
    contradictoria: ORDEN.filter((k) => z.categorias[k].includes(codigo)).length > 1
  }))
}

// Segunda lectura que la norma también deja abierta aunque el mapeo sea explícito. No cambia el resultado: es advertencia.
export const LECTURAS_ALTERNAS = Object.freeze({
  licorera: { codigo: 'S5', motivo: 'Si en el local se consume licor en el sitio, la norma lo ubica en S5 ("establecimientos con expendio de licor"), no en C2.' },
  supermercado: { codigo: 'C8', motivo: 'Si se trata de un centro comercial o un pasaje, la tipología es C8.' },
  gimnasio: { codigo: 'SRC2', motivo: 'Un gimnasio grande, tipo centro deportivo, podría tratarse como SRC2; el documento no fija el umbral.' }
})

export function lecturaAlterna(zonaDatos, actividadId) {
  const alterna = LECTURAS_ALTERNAS[actividadId]
  if (!alterna || !zonaDatos) return null
  const categoria = categoriaEnZona(zonaDatos, alterna.codigo)
  const donde = categoria ? `es uso ${categoria}` : 'no está listado, así que se trata como prohibido'
  return { tipologia: alterna.codigo, categoria, texto: `${alterna.motivo} En ${zonaDatos.nombre}, ${alterna.codigo} ${donde}.` }
}

// Reglas generales del documento que afectan a una actividad concreta.
export function avisosDeActividad(actividadId) {
  const resumen = (tema) => LA_ESTRELLA.disposicionesGenerales.find((d) => d.tema === tema)?.resumen
  const avisos = []
  if (actividadId === 'licorera' || actividadId === 'discoteca') avisos.push(resumen('Equipamientos educativos'))
  if (actividadId === 'supermercado') avisos.push(resumen('Gran formato'))
  if (actividadId === 'discoteca') avisos.push(resumen('Ruido'))
  return avisos.filter(Boolean)
}