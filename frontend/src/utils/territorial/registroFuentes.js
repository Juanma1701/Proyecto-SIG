// Registro estático de fuentes territoriales de GeoAburrá (etapa 1).
//
// Módulo de DATOS: no hace red, no importa nada y no decide nada normativo.
// Todo lo que está aquí viene del inventario del AMVA y de los sondeos de consulta
// puntual hechos en noviembre de 2026. Lo que no se verificó se marca como tal.
//
// Convenciones:
//  - `bloque` es el tipo de bloque del resultado normalizado; sale del NOMBRE declarado
//    de la capa, no de su significado. Por eso `significadoVerificado` es false en todas.
//  - `consultaPuntual`: 'probada' = la consulta por punto respondió sin error en el sondeo
//    (con o sin registros); 'pendiente' = falló o no se terminó de probar.
//  - `observado`: true si alguna consulta puntual devolvió registros reales de esa capa.
//    Si es false, sus atributos solo se conocen por los metadatos de la capa.
//  - `camposContenido`: campos de la capa con información (se excluyen OBJECTID, SHAPE, etc.).
//    Las consultas piden outFields=* y el original se conserva intacto.
//  - Los servicios `_EB` NO están aquí (ver SERVICIOS_EXCLUIDOS).

function congelar(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.freeze(valor)
    Object.values(valor).forEach(congelar)
  }
  return valor
}

export const BLOQUES = [
  'clasificacion_suelo',
  'uso_actual',
  'uso_normativo_pot',
  'tratamiento',
  'riesgo',
  'proteccion'
]

export const AMBITOS = ['urbano', 'rural', 'general']

// Textos de advertencia reutilizables. Las capas los referencian por código.
export const ADVERTENCIAS = {
  USO_POT_NO_VERIFICADO:
    'No está verificado si esta capa describe zonificación normativa o uso existente. No debe leerse como un permiso.',
  USO_ACTUAL_DIFIERE_ENTRE_FUENTES:
    'La etiqueta de uso actual puede diferir de la de otras fuentes en el mismo punto (Copacabana: "Comercio" frente a "Predomina Residencial"). Cada fuente se muestra por separado.',
  USO_ACTUAL_EN_CAPA_POT:
    'Aunque la capa se llama "Uso del Suelo Urbano", su campo se llama USO_ACTUAL: puede describir ocupación existente y no zonificación.',
  VACIO_EN_USOS_NO_ES_FALTA_DE_COBERTURA:
    'Un resultado vacío en capas de uso no prueba que no haya cobertura: en el centro de Medellín varias capas de uso salieron vacías mientras la clasificación sí respondía.',
  PLACEHOLDER_ZONA_URBANA:
    'Esta capa rural devuelve el valor "ZONA URBANA" en suelo urbano: es un marcador de relleno, no un uso ni un tratamiento rural.',
  POSIBLE_COPIA_DE_OTRA_CAPA:
    'En la prueba, esta capa devolvió atributos idénticos o con el mismo esquema que otra capa del mismo servicio (Girardota 5 y 6; Envigado 8 y 10). Puede ser una copia: no contarla como evidencia independiente.',
  VERSIONES_MIXTAS:
    'Este servicio mezcla campos de versiones distintas del POT (2018 y 2011). La vigencia debe verificarse en la etapa normativa.',
  RIESGOS_SOLO_CAD:
    'Los atributos de esta capa son restos de dibujo (LAYER, COLOR, LINETYPE, ELEVATION): no describen el riesgo.',
  SIN_CAMPO_SEMANTICO:
    'La capa solo trae municipio y código: no describe el tipo de riesgo.',
  CONDICION_POSIBLEMENTE_TRUNCADA:
    'El texto del campo CONDICION apareció cortado en la prueba; puede estar truncado en el origen.',
  TRATAMIENTO_CON_PROTECCION:
    'En la prueba, esta capa de tratamientos devolvió un valor de protección ("Protección Estricta"): no asumir que solo contiene tratamientos urbanísticos.',
  EXPANSION_DENTRO_DE_URBANO:
    'En suelo_pot la categoría "urbano" incluye polígonos de suelo de expansión (160 de 294) y "rural" incluye suelo suburbano (89 de 950). Para la clase del suelo se usa SIMBOLOGIA, no la categoría.',
  CAPA_ANTERIOR_AL_POT_VIGENTE:
    'Esta capa es una compilación del AMVA de septiembre de 2022, anterior al Acuerdo 09 de 2023 (POT vigente de Itagüí, que derogó el Acuerdo 20 de 2007). Sus códigos (por ejemplo ZU-C-21) y sus textos no coinciden con los polígonos y tipologías del acuerdo vigente: no la uses como norma vigente.'
}

// Cómo se pide un punto a ArcGIS (verificado en el sondeo).
// `geometry` se arma como "lng,lat". `distance` + `units` solo se añaden cuando se busca
// cerca de un borde (verificado en AMVA_POT/0 y AMVA_POT/5). `outSR` NO se probó
// (returnGeometry=false). `inSR=4326` funciona también en las capas en EPSG:3857.
export const PARAMETROS_CONSULTA_PUNTUAL = {
  geometryType: 'esriGeometryPoint',
  inSR: '4326',
  spatialRel: 'esriSpatialRelIntersects',
  outFields: '*',
  returnGeometry: 'false',
  f: 'json'
}

export const PARAMETROS_DISTANCIA = { units: 'esriSRUnit_Meter' }

const SRID_POT = 9377
const SRID_USO_ACTUAL = 3857 // wkid declarado 102100, latestWkid 3857
const MAX_REGISTROS = 2000

function capa(id, nombre, bloque, ambito, camposContenido, extra = {}) {
  return {
    id,
    nombre,
    bloque,
    ambito,
    camposContenido,
    consultaPuntual: 'probada',
    observado: false,
    significadoVerificado: false,
    advertencias: [],
    notasVerificacion: [],
    ...extra
  }
}

const CAMPOS_USO_ACTUAL = ['INDICADOR', 'USO_ACTUAL', 'INPOLY_FID']

function municipio(definicion, capasPot) {
  const { servicioPot, servicioUsoActual, advertenciasUsoActual = [] } = definicion

  const pot = capasPot.map((c) => ({
    ...c,
    servicio: servicioPot,
    sridServicio: SRID_POT,
    maxRegistros: MAX_REGISTROS,
    advertencias:
      c.bloque === 'uso_normativo_pot'
        ? ['USO_POT_NO_VERIFICADO', ...c.advertencias]
        : c.advertencias
  }))

  const usoActual = {
    ...capa(1, 'Usos Suelo Metropolitano', 'uso_actual', 'general', CAMPOS_USO_ACTUAL, {
      observado: true
    }),
    servicio: servicioUsoActual,
    sridServicio: SRID_USO_ACTUAL,
    maxRegistros: MAX_REGISTROS,
    advertencias: ['USO_ACTUAL_DIFIERE_ENTRE_FUENTES', ...advertenciasUsoActual]
  }

  const { servicioPot: _p, servicioUsoActual: _u, advertenciasUsoActual: _a, ...resto } = definicion
  void _p
  void _u
  void _a

  return { ...resto, servicios: { pot: servicioPot, usoActual: servicioUsoActual }, capas: [...pot, usoActual] }
}

export const MUNICIPIOS = [
  municipio(
    {
      slug: 'Barbosa',
      nombre: 'Barbosa',
      codigoMun: '079',
      nombreEnRest: 'Barbosa',
      nombreEnSuelo: 'Barbosa',
      servicioPot: 'Barbosa_POT',
      servicioUsoActual: 'BARBOSA_Uso_y_Valores_Suelo',
      capasAusentes: []
    },
    [
      capa(0, 'Clasificacion del Suelo', 'clasificacion_suelo', 'general',
        ['CLASE_SUELO', 'CATEGORIA', 'SUBCATEGORIA', 'NOMBRE', 'SIMBOLOGIA'], { observado: true }),
      capa(1, 'Uso de Suelo Rural', 'uso_normativo_pot', 'rural', ['USO', 'SIMBOLOGIA']),
      capa(2, 'Uso de Suelo Urbano', 'uso_normativo_pot', 'urbano', ['USOS', 'SIMBOLOGIA'], { observado: true }),
      capa(3, 'Tratamientos Rurales', 'tratamiento', 'rural',
        ['TIPO', 'CONVENCION', 'CODIGO', 'DEN_VIV_HA', 'SIMBOLOGIA']),
      // El campo del código lleva tilde en el servicio: "CÓDIGO"
      capa(4, 'Tratamientos Urbanos', 'tratamiento', 'urbano',
        ['NOMBRE', 'CATEGORIA', 'CÓDIGO', 'TRATAMIENTO', 'CONVENCION', 'DENSIDAD', 'ALTURA_MAX',
          'AREA_MINIM', 'FRENTE_MIN', 'INDICE_OCU', 'SIMBOLOGIA'], { observado: true }),
      capa(5, 'Riesgos Rurales', 'riesgo', 'rural', ['CLASE', 'CODIGO', 'SIMBOLOGIA']),
      capa(6, 'Riesgos Urbanos', 'riesgo', 'urbano', ['TIPO', 'FUENTE', 'CODIGO', 'SIMBOLOGIA']),
      // El nombre declarado trae "Protecccion" con tres c: se conserva tal cual
      capa(9, 'Suelos de Protecccion', 'proteccion', 'general', ['NOMBRE', 'SIMBOLOGIA'])
    ]
  ),

  municipio(
    {
      slug: 'Girardota',
      nombre: 'Girardota',
      codigoMun: '308',
      nombreEnRest: 'Girardota',
      nombreEnSuelo: 'Girardota',
      servicioPot: 'Girardota_POT',
      servicioUsoActual: 'GIRARDOTA_Uso_y_Valores_Suelo',
      capasAusentes: []
    },
    [
      capa(2, 'Riesgos', 'riesgo', 'general',
        ['LAYER', 'COLOR', 'LINETYPE', 'ELEVATION', 'SIMBOLOGIA'], { advertencias: ['RIESGOS_SOLO_CAD'] }),
      capa(3, 'Suelo de Protección', 'proteccion', 'general',
        ['LAYER', 'LAYER_1', 'TEXT_1', 'TAM_PREDIO', 'DENSIDAD', 'USO', 'CESIONES', 'N_SITIO', 'SIMBOLOGIA']),
      capa(4, 'Tratamientos Rurales', 'tratamiento', 'rural',
        ['LAYER_12', 'TEXT_12', 'TAM_PRED_1', 'DENSIDAD_1', 'USO_1', 'CESIONES_1', 'IOVIVAB',
          'IOOTROSUSO', 'IOTOTALAB', 'ALTURA', 'CESIONEQUI', 'PAGINA', 'SIMBOLOGIA']),
      capa(5, 'Tratamientos Urbanos', 'tratamiento', 'urbano',
        ['LAYER', 'TRATAMIENTO', 'USOS', 'PAGINA', 'SIMBOLOGIA'],
        { observado: true, advertencias: ['POSIBLE_COPIA_DE_OTRA_CAPA'] }),
      capa(6, 'Uso del Suelo Urbano', 'uso_normativo_pot', 'urbano',
        ['LAYER', 'TRATAMIENTO', 'USOS', 'PAGINA', 'SIMBOLOGIA'],
        { observado: true, advertencias: ['POSIBLE_COPIA_DE_OTRA_CAPA'] }),
      capa(7, 'Uso del Suelo Rural', 'uso_normativo_pot', 'rural',
        ['LAYER_12', 'TEXT_12', 'TAM_PRED_1', 'DENSIDAD_1', 'USO_1', 'CESIONES_1', 'IOVIVAB',
          'IOOTROSUSO', 'IOTOTALAB', 'ALTURA', 'CESIONEQUI', 'PAGINA', 'SIMBOLOGIA']),
      capa(8, 'Clasificación del Suelo', 'clasificacion_suelo', 'general',
        ['CLASIFICACION', 'SIMBOLOGIA'], { observado: true })
    ]
  ),

  municipio(
    {
      slug: 'Copacabana',
      nombre: 'Copacabana',
      codigoMun: '212',
      nombreEnRest: 'Copacabana',
      nombreEnSuelo: 'Copacabana',
      servicioPot: 'POT_COPACABANA',
      servicioUsoActual: 'COPACABANA_Uso_y_Valores_Suelo',
      // Según el inventario, el servicio no trae estas capas
      capasAusentes: ['riesgo', 'tratamiento_rural']
    },
    [
      capa(2, 'Uso del Suelo Rural', 'uso_normativo_pot', 'rural', ['USO', 'SIMBOLOGIA']),
      capa(3, 'Uso del Suelo Urbano', 'uso_normativo_pot', 'urbano', ['USO_ACTUAL', 'SIMBOLOGIA'],
        { observado: true, advertencias: ['USO_ACTUAL_EN_CAPA_POT'] }),
      capa(4, 'Clasificación del Suelo', 'clasificacion_suelo', 'general',
        ['CLASIFICACION', 'SIMBOLOGIA'], { observado: true }),
      capa(5, 'Tratamientos Urbanos', 'tratamiento', 'urbano',
        ['NAME', 'FOLDERPATH', 'SIMBOLOGIA'], { observado: true }),
      capa(6, 'Suelos de Proteccion', 'proteccion', 'general',
        ['TIPO_ECOSI', 'NOMBRE', 'SIMBOLOGIA'], { observado: true })
    ]
  ),

  municipio(
    {
      slug: 'Bello',
      nombre: 'Bello',
      codigoMun: '088',
      nombreEnRest: 'Bello',
      nombreEnSuelo: 'Bello',
      servicioPot: 'Bello_POT',
      servicioUsoActual: 'BELLO_Uso_y_Valores_Suelo',
      capasAusentes: []
    },
    [
      capa(1, 'Clasificacion del Suelo Rural', 'clasificacion_suelo', 'rural',
        ['CLASIFICACION', 'NMG', 'SIMBOLOGIA']),
      capa(2, 'Clasificacion del Suelo Urbano', 'clasificacion_suelo', 'urbano',
        ['CLASIFICACION', 'SIMBOLOGIA'], { observado: true }),
      capa(3, 'Tratamientos Rurales', 'tratamiento', 'rural',
        ['DXF_TXT', 'CATEGORIA', 'DESCRIPCIO', 'CATEG_1', 'SIMBOLOGIA']),
      capa(4, 'Tratamientos Urbanos', 'tratamiento', 'urbano',
        ['COD_POLIGO', 'COMUNA', 'TRATAMIENT', 'SIMBOLOGIA'], { observado: true }),
      capa(5, 'Suelo de Proteccion', 'proteccion', 'general',
        ['CLASIFICACION', 'NMG', 'CATEGORIA', 'FUENTE', 'SIMBOLO', 'SIMBOLOGIA']),
      capa(6, 'Uso del Suelo', 'uso_normativo_pot', 'general',
        ['DXF_TEXT', 'CATEGORIA', 'DESCRIP', 'CATEG_1', 'CATEG_2', 'COMUNA', 'SIMBOLOGIA'], { observado: true }),
      capa(7, 'Riesgos', 'riesgo', 'general', ['CODIGO', 'DESCRIPCION', 'SIMBOLOGIA'])
    ]
  ),

  municipio(
    {
      slug: 'Medellin',
      nombre: 'Medellín',
      codigoMun: '001',
      nombreEnRest: 'Medellin',
      nombreEnSuelo: 'Medellín',
      servicioPot: 'DISTRITO_MEDELLIN_POT',
      servicioUsoActual: 'MEDELLIN_Uso_y_Valores_Suelo',
      capasAusentes: [],
      advertenciasUsoActual: ['VACIO_EN_USOS_NO_ES_FALTA_DE_COBERTURA']
    },
    [
      capa(0, 'Clasificacion del Suelo', 'clasificacion_suelo', 'general',
        ['CODIGO_TRATAMIENTO', 'NOMBRE', 'CLASE_SUELO', 'CATEGORIA_SUELO', 'CATDLLORESTRING', 'SIMBOLOGIA'],
        { observado: true }),
      capa(1, 'Uso del Suelo Urbano', 'uso_normativo_pot', 'urbano',
        ['COD_CAT_USO', 'COD_SUBCAT_USO', 'AREAGRALUSO', 'SUBCATEGORIA', 'SIMBOLOGIA'],
        { advertencias: ['VACIO_EN_USOS_NO_ES_FALTA_DE_COBERTURA'] }),
      capa(2, 'Uso del Suelo Rural', 'uso_normativo_pot', 'rural',
        ['CORREGIMIENTO', 'CATEGORIA_USO', 'COD_CAT_USO', 'CATEGORIA_PROTECCION',
          'SUBCATEGORIA_PROTECCION', 'SIMBOLOGIA']),
      capa(3, 'Riesgos', 'riesgo', 'general',
        ['CODIGO', 'NOMBRE', 'RIESGO', 'DESCRIPCION', 'TIPO_AMENAZA', 'CATEGORIA_PROTECCION',
          'SUBCATEGORIA_PROTECCION', 'SIMBOLOGIA']),
      capa(5, 'Tratamientos', 'tratamiento', 'general',
        ['CODIGO_TRATAMIENTO', 'TRATAMIENTO', 'TIPO', 'DENSADICI', 'DENSTOTAL', 'ICADICI', 'ICTOTAL',
          'ALTURAVARIABLE', 'ALTURAADICIO', 'FRANJABASE', 'FRANJAADICI', 'CESVIV', 'CESOUSOS',
          'PORCANMIN', 'EQCNTVIV', 'EQCNTOUSOS', 'VDERVIV', 'VDEROUSO', 'ALTURANORMATIVA',
          'INDICECONSTRUCCMAX', 'DENSIDADMAX', 'CATEGORIA_TRATAMIENTO', 'CLASE_SUELO', 'ZONA',
          'IDENTIFICADOR', 'SIMBOLOGIA'], { observado: true }),
      capa(6, 'Suelo de Proteccion', 'proteccion', 'general',
        ['CATEGORIA', 'SUBCATEGORIAS', 'NOMBRECATEGORIA', 'SIMBOLOGIA'])
    ]
  ),

  municipio(
    {
      slug: 'Envigado',
      nombre: 'Envigado',
      codigoMun: '266',
      nombreEnRest: 'Envigado',
      nombreEnSuelo: 'Envigado',
      servicioPot: 'POT_Envigado',
      servicioUsoActual: 'ENVIGADO_Uso_y_Valores_Suelo',
      capasAusentes: []
    },
    [
      capa(0, 'Clasificacion del Suelo', 'clasificacion_suelo', 'general',
        ['POT_2018', 'SIMBOLOGIA'], { observado: true, advertencias: ['VERSIONES_MIXTAS'] }),
      capa(5, 'Riesgos de Inundacion', 'riesgo', 'general', ['EVENTO', 'TIPO', 'SIMBOLOGIA']),
      capa(6, 'Riesgos Movimientos en Masa', 'riesgo', 'general', ['TIPO', 'EVENTO', 'SIMBOLOGIA']),
      capa(7, 'Suelo de Proteccion', 'proteccion', 'general', ['PROT_2018', 'DESCRIPCION', 'SIMBOLOGIA']),
      capa(8, 'Tratamientos Rurales', 'tratamiento', 'rural',
        ['POT_2011', 'TIPO_TRATA', 'CLASE_SUELO', 'DENSIDAD', 'CODIGO', 'USOS_PPAL', 'INDICE_OCUPACION',
          'ALTURA_MAXIMA', 'SIMBOLOGIA'],
        { observado: true, advertencias: ['PLACEHOLDER_ZONA_URBANA', 'POSIBLE_COPIA_DE_OTRA_CAPA', 'VERSIONES_MIXTAS'] }),
      capa(9, 'Tratamientos Urbanos', 'tratamiento', 'urbano',
        ['ZONA', 'TRATAMIENTO_2018', 'DEN2018', 'DENADDVEN', 'DENADDMAX', 'ALTURA2018', 'ALTURAADD', 'ORDEN',
          'IC_BA2018', 'IC_AD2018', 'ALTURAMAX', 'IO_OTRUSOS2018', 'ALTURA_OTRUSOS', 'ZONAS',
          'PARQUEADEROS', 'NOMBRE_2018', 'SIMBOLOGIA'],
        { observado: true, advertencias: ['VERSIONES_MIXTAS'] }),
      capa(10, 'Uso del Suelo Rural', 'uso_normativo_pot', 'rural',
        ['POT_2011', 'TIPO_TRATA', 'CLASE_SUEL', 'DENSIDAD', 'CODIGO', 'USOS_PPAL', 'INDICE_OCUPACION',
          'ALTURA_MAXIMA', 'SIMBOLOGIA'],
        { observado: true, advertencias: ['PLACEHOLDER_ZONA_URBANA', 'POSIBLE_COPIA_DE_OTRA_CAPA', 'VERSIONES_MIXTAS'] }),
      capa(11, 'Uso del Suelo Urbano', 'uso_normativo_pot', 'urbano',
        ['DESCRIPCION', 'SIMBOLOGIA'], { observado: true })
    ]
  ),

  municipio(
    {
      slug: 'Itagui',
      nombre: 'Itagüí',
      codigoMun: '360',
      nombreEnRest: 'Itagui',
      nombreEnSuelo: 'Itagüí',
      servicioPot: 'POT_Itagui',
      servicioUsoActual: 'ITAGUI_Uso_y_Valores_Suelo',
      capasAusentes: []
    },
    [
      capa(1, 'Clasificacion del Suelo', 'clasificacion_suelo', 'general',
        ['CLASE', 'SUBCLASE', 'OBS', 'SIMBOLOGIA'], { observado: true }),
      // Única capa de uso con campos de uso principal, condicionado y prohibido.
      // Es por zona general, no por actividad. Su contenido real aún no se interpreta.
      // Sus códigos y textos no coinciden con el Acuerdo 09 de 2023 (POT vigente): ver el aviso.
      capa(2, 'Uso del Suelo', 'uso_normativo_pot', 'general',
        ['CODIGO', 'USO_PPAL', 'USO_COND', 'USO_PROH', 'CONDICION', 'BARRIO', 'SIMBOLOGIA'],
        {
          observado: true,
          advertencias: ['CONDICION_POSIBLEMENTE_TRUNCADA', 'CAPA_ANTERIOR_AL_POT_VIGENTE'],
          notasVerificacion: [
            'Hipótesis sin confirmar: el contenido parece venir del Acuerdo 20 de 2007 (derogado por el Acuerdo 09 de 2023, art. 290). Falta compararlo con el texto de ese acuerdo.'
          ]
        }),
      capa(4, 'Tratamientos Urbanos', 'tratamiento', 'urbano',
        ['TIPO', 'CODIGO', 'OBSERV', 'SIMBOLOGIA'], { observado: true }),
      capa(5, 'Tratamientos Rurales', 'tratamiento', 'rural',
        ['CODIGO', 'INTERVENCION', 'OBS', 'SIMBOLOGIA']),
      capa(6, 'Suelos de Proteccion', 'proteccion', 'general', ['IDR', 'SIMBOLOGIA']),
      capa(7, 'Riesgos de Movimiento en Masa', 'riesgo', 'general', ['RIESGO', 'SIMBOLOGIA']),
      capa(8, 'Riesgos de Inundacion', 'riesgo', 'general', ['RIESGO', 'SIMBOLOGIA'])
    ]
  ),

  municipio(
    {
      slug: 'Sabaneta',
      nombre: 'Sabaneta',
      codigoMun: '631',
      nombreEnRest: 'Sabaneta',
      nombreEnSuelo: 'Sabaneta',
      servicioPot: 'POT_Sabaneta',
      servicioUsoActual: 'SABANETA_Uso_y_Valores_Suelo',
      capasAusentes: []
    },
    [
      capa(0, 'Clasificacion del Suelo', 'clasificacion_suelo', 'general',
        ['CLASIFICACION', 'NOMBRE', 'CATEGORIA', 'SUBCATEGORIA', 'SIMBOLOGIA'], { observado: true }),
      capa(1, 'Uso del Suelo Urbano', 'uso_normativo_pot', 'urbano', ['USO', 'SIMBOLOGIA'], { observado: true }),
      capa(2, 'Uso del Suelo Rural', 'uso_normativo_pot', 'rural', ['USO', 'SIMBOLOGIA']),
      capa(3, 'Tratamientos Urbanos', 'tratamiento', 'urbano',
        ['CODIGO', 'TRATAMIENTO', 'DENSIDAD', 'R_DENSIDAD', 'I_CONSTRUC', 'ALTURA', 'INSTRUMENT',
          'DENHABTOTA', 'ICONSTOTAL', 'VIVIENDA', 'ALTURA_ADI', 'SIMBOLOGIA'], { observado: true }),
      capa(4, 'Tratamientos Rurales', 'tratamiento', 'rural',
        ['INTERVENCION', 'CODIGO', 'INSTRUMENT', 'SIMBOLOGIA']),
      capa(5, 'Riesgos', 'riesgo', 'general', ['CONDICION', 'PRIORIDAD', 'SIMBOLOGIA']),
      capa(7, 'Suelos de Proteccion', 'proteccion', 'general', ['CATEGORIA', 'TIPO', 'SIMBOLOGIA'], {
        consultaPuntual: 'pendiente',
        notasVerificacion: ['HTTP 504 (tiempo de espera de la puerta de enlace) en el sondeo: reprobar antes de darla por probada.']
      })
    ]
  ),

  municipio(
    {
      slug: 'LaEstrella',
      nombre: 'La Estrella',
      codigoMun: '380',
      nombreEnRest: 'La Estrella',
      nombreEnSuelo: 'La Estrella',
      servicioPot: 'POT_La_Estrella',
      servicioUsoActual: 'LA_ESTRELLA_Uso_y_Valores_Suelo',
      capasAusentes: []
    },
    [
      capa(0, 'Clasificacion del Suelo', 'clasificacion_suelo', 'general',
        ['CLASIFICAC', 'DESCRIPCIO', 'SIMBOLOGIA'], { observado: true }),
      capa(1, 'Uso del Suelo', 'uso_normativo_pot', 'general',
        ['CODIGO', 'ENFASISUSO', 'DESCRIPCION', 'SIMBOLOGIA'], { observado: true }),
      capa(2, 'Tratamientos Urbanos', 'tratamiento', 'urbano',
        ['CODIGO', 'DESCRIPCION', 'TRATAMIENTO', 'NOMBRE', 'SIMBOLOGIA'],
        { observado: true, advertencias: ['TRATAMIENTO_CON_PROTECCION'] }),
      capa(3, 'Tratamientos Rurales', 'tratamiento', 'rural',
        ['CODIGO', 'NOMBRE', 'DESCRIPCION', 'SIMBOLOGIA']),
      capa(4, 'Suelo de Proteccion de Retiro', 'proteccion', 'general',
        ['NOMBRE', 'SIMBOLOGIA'], { observado: true }),
      capa(5, 'Suelo de Proteccion de Preservacion', 'proteccion', 'general',
        ['DESCRIPCIO', 'NO_POLIGON', 'SIMBOLOGIA']),
      capa(6, 'Riesgos', 'riesgo', 'general', ['TIPO', 'SIMBOLOGIA'])
    ]
  ),

  municipio(
    {
      slug: 'Caldas',
      nombre: 'Caldas',
      codigoMun: '129',
      nombreEnRest: 'Caldas',
      nombreEnSuelo: 'Caldas',
      servicioPot: 'POT_Caldas',
      servicioUsoActual: 'CALDAS_Uso_y_Valores_Suelo',
      capasAusentes: []
    },
    [
      capa(0, 'Clasificacion del Suelo', 'clasificacion_suelo', 'general',
        ['SUBCATEGOR', 'CATEGORIA', 'DENSIDAD', 'SIMBOLOGIA'], { observado: true }),
      capa(2, 'Riesgos', 'riesgo', 'general', ['TIPO_RIESG', 'SECTOR', 'NOMBRE', 'SIMBOLOGIA']),
      capa(3, 'Suelo de Proteccion', 'proteccion', 'general', ['SUBCATEGOR', 'CATEGORIA', 'SIMBOLOGIA']),
      capa(4, 'Tratamientos Rurales', 'tratamiento', 'rural',
        ['SUBCATEGORIA', 'CATEGORIA', 'INTERVENCION', 'CODIGO', 'SIMBOLOGIA']),
      capa(5, 'Tratamientos Urbanos', 'tratamiento', 'urbano',
        ['CODIGO', 'NOMBRE', 'BARRIO_SEC', 'TRATAMIENTO', 'SIMBOLOGIA'], { observado: true }),
      capa(6, 'Uso del Suelo', 'uso_normativo_pot', 'general', ['SUBCATEGORIA', 'SIMBOLOGIA'], {
        observado: true,
        notasVerificacion: ['En la prueba SUBCATEGORIA devolvió "Urbano": parece repetir la clasificación y no describir un uso.']
      })
    ]
  )
]

// Capas del servicio agregado AMVA_POT que sí se usan en la etapa 1.
// Sus campos son pobres (sin semántica propia); sirven para resolver el municipio
// y como contraste, no como evidencia normativa.
export const CAPAS_AMVA_AGREGADO = [
  {
    servicio: 'AMVA_POT',
    id: 5,
    nombre: 'Clasificacion del Suelo',
    bloque: 'clasificacion_suelo',
    ambito: 'general',
    camposContenido: ['CODIGO_MUN', 'MUNICIPIO', 'SIMBOLOGIA'],
    consultaPuntual: 'probada',
    observado: true,
    significadoVerificado: false,
    advertencias: [],
    notasVerificacion: [
      'En los 10 centros y en 12 puntos medios entre municipios vecinos, d=0 devolvió un registro con el CODIGO_MUN esperado.',
      'Un punto de control en Rionegro (fuera del AMVA) salió vacío.'
    ],
    sridServicio: SRID_POT,
    maxRegistros: MAX_REGISTROS
  },
  {
    servicio: 'AMVA_POT',
    id: 4,
    nombre: 'Usos del Suelo',
    bloque: 'uso_normativo_pot',
    ambito: 'general',
    camposContenido: ['MUNICIPIO', 'CODIGO_MUN', 'SIMBOLOGIA', 'INPOLY_FID'],
    valoresObservados: {
      SIMBOLOGIA: [
        'COMERCIO/SERVICIOS', 'RESIDENCIAL', 'MIXTO', 'INSTITUCIONAL/DOTACIONAL',
        'FORESTAL/PROTECCION', 'OTRAS CLASIFICACIONES'
      ]
    },
    consultaPuntual: 'probada',
    observado: true,
    significadoVerificado: false,
    advertencias: ['USO_POT_NO_VERIFICADO', 'VACIO_EN_USOS_NO_ES_FALTA_DE_COBERTURA'],
    notasVerificacion: [
      'Único campo de uso común a los 10 municipios; su semántica no está verificada.'
    ],
    sridServicio: SRID_POT,
    maxRegistros: MAX_REGISTROS
  },
  {
    servicio: 'AMVA_POT',
    id: 3,
    nombre: 'Suelo de Proteccion',
    bloque: 'proteccion',
    ambito: 'general',
    camposContenido: ['MUNICIPIO', 'CODIGO_MUN', 'INPOLY_FID'],
    consultaPuntual: 'probada',
    observado: true,
    significadoVerificado: false,
    advertencias: [],
    notasVerificacion: [],
    sridServicio: SRID_POT,
    maxRegistros: MAX_REGISTROS
  },
  {
    servicio: 'AMVA_POT',
    id: 7,
    nombre: 'Riesgos',
    bloque: 'riesgo',
    ambito: 'general',
    camposContenido: ['MUNICIPIO', 'CODIGO_MUN'],
    consultaPuntual: 'probada',
    observado: false,
    significadoVerificado: false,
    advertencias: ['SIN_CAMPO_SEMANTICO'],
    notasVerificacion: [],
    sridServicio: SRID_POT,
    maxRegistros: MAX_REGISTROS
  }
]

// AMVA_POT/0 "Limite Politico Administrativo AMVA" NO sirve como límite de los 10 municipios.
export const LIMITE_AMVA_DESCARTADO = {
  servicio: 'AMVA_POT',
  id: 0,
  usable: false,
  motivo:
    'Con where=1=1 devuelve un solo registro (Medellín, MPCODIGO 05001). Su campo RESTRICCIO advierte que no es apropiada para ubicar puntos exactos ni calcular áreas o distancias.'
}

export const SERVICIOS_EXCLUIDOS = [
  {
    servicio: 'Barbosa_POT_EB',
    motivo: 'Devuelve los mismos atributos que Barbosa_POT. Su relación con ese servicio no está documentada.'
  },
  {
    servicio: 'Bello_POT_EB',
    motivo: 'Las capas 1 a 7 respondieron ArcGIS 400 "Requested operation is not supported by this service" en consulta puntual, aunque declaran Query.'
  }
]

// Cómo se resolvería el municipio. ESTADO: propuesta pendiente de aprobación.
// Ninguna de las dos fuentes es un límite oficial: el método debe rotularse así.
export const RESOLUCION_MUNICIPIO = {
  estado: 'propuesta_pendiente_de_aprobacion',
  rotulo: 'Derivado de la clasificación del suelo del AMVA; no es el límite oficial.',
  fuenteAmva: {
    servicio: 'AMVA_POT',
    capaId: 5,
    campoCodigo: 'CODIGO_MUN',
    campoNombre: 'MUNICIPIO'
  },
  contrasteSupabase: {
    tabla: 'suelo_pot',
    claveCodigo: "atributos->>'CODIGO_MUN'"
  },
  // Los nombres difieren entre fuentes: se une por código, nunca por nombre
  unirPor: 'codigoMun'
}

export const SUELO_POT_SUPABASE = {
  tabla: 'suelo_pot',
  rpc: 'suelo_en_punto',
  maxPoligonosPorRpc: 15,
  categoriasDeLaTabla: ['urbano', 'rural', 'proteccion', 'riesgo'],
  advertencias: ['EXPANSION_DENTRO_DE_URBANO']
}

// Clase de suelo comparable, a partir de SIMBOLOGIA.
// SOLO verificado para capas de clasificación del suelo (capa_origen que empieza por
// "clasifica" en suelo_pot y las capas de clasificación del REST). Para cualquier otro
// valor se devuelve null: no se adivina.
export const MAPEO_CLASIFICACION_SIMBOLOGIA = {
  URBANO: 'urbano',
  'SUELO URBANO': 'urbano',
  RURAL: 'rural',
  'SUELO RURAL': 'rural',
  SUBURBANO: 'suburbano',
  'SUELO SUBURBANO': 'suburbano',
  EXPANSION: 'expansion',
  'EXPANSION URBANA': 'expansion',
  'SUELO DE EXPANSION': 'expansion',
  PROTECCION: 'proteccion',
  'SUELO DE PROTECCION': 'proteccion'
}

function claveSimbologia(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function claseDesdeSimbologia(simbologia) {
  if (typeof simbologia !== 'string') return null
  const clave = claveSimbologia(simbologia)
  if (!clave) return null
  return Object.hasOwn(MAPEO_CLASIFICACION_SIMBOLOGIA, clave)
    ? MAPEO_CLASIFICACION_SIMBOLOGIA[clave]
    : null
}

export function municipioPorCodigo(codigoMun) {
  return MUNICIPIOS.find((m) => m.codigoMun === codigoMun) ?? null
}

export function municipioPorSlug(slug) {
  return MUNICIPIOS.find((m) => m.slug === slug) ?? null
}

// Capas de un municipio, con filtros opcionales por bloque y por estado de la consulta puntual
export function capasDeMunicipio(slug, { bloque, soloProbadas = false } = {}) {
  const m = municipioPorSlug(slug)
  if (!m) return []
  return m.capas.filter(
    (c) => (!bloque || c.bloque === bloque) && (!soloProbadas || c.consultaPuntual === 'probada')
  )
}

// Ruta RELATIVA de una capa dentro del catálogo (sin base ni parámetros).
// Quien consulte antepone la base (p. ej. '/amva/server/rest/services') y añade '/query?...'.
export function rutaCapa(servicio, id) {
  return `${servicio}/MapServer/${id}`
}

congelar(MUNICIPIOS)
congelar(CAPAS_AMVA_AGREGADO)
congelar(LIMITE_AMVA_DESCARTADO)
congelar(SERVICIOS_EXCLUIDOS)
congelar(RESOLUCION_MUNICIPIO)
congelar(SUELO_POT_SUPABASE)
congelar(MAPEO_CLASIFICACION_SIMBOLOGIA)
congelar(ADVERTENCIAS)
congelar(PARAMETROS_CONSULTA_PUNTUAL)
congelar(PARAMETROS_DISTANCIA)