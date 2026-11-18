// Norma de usos del suelo urbano de Medellín: Acuerdo 48 de 2014 (revisión y ajuste de largo plazo del POT).
// Régimen de interrelaciones de usos por ÁREAS DE MIXTURA (arts. 242 a 260, p. 340-364 del PDF).
// Datos EXTRAÍDOS de la capa de texto del PDF (tablas por celdas, con pdfplumber), sin revisión manual.
// Las páginas citadas son páginas del PDF (877); la numeración impresa va una por debajo.
// Los textos de las tablas se conservan como los trae el acuerdo, incluidos sus errores de digitación.
// Lo no verificado va marcado [verificar]. No decide si una actividad está permitida: solo describe la norma.

import { COBERTURA, VERIFICACION, VIGENCIA, congelar } from './esquema.js'

const TEXTO = VERIFICACION.EXTRAIDO_DE_TEXTO
const f = (articulo, paginaPdf) => ({ articulo, paginaPdf, verificacion: TEXTO })

// Columnas de la tabla de localización permitida (art. 255), en el orden en que están impresas.
const COLUMNAS = ['baja', 'media', 'altaTransformacion', 'altaCentralidades', 'altaPredominanciaEconomica']

// `sn` trae una letra por columna, en el orden de COLUMNAS: S = SI, N = NO.
const fila = (categoria, actividad, sn, paginaPdf, observaciones = []) => ({
  categoria,
  actividad,
  permitido: Object.fromEntries(COLUMNAS.map((id, i) => [id, sn[i] === 'S'])),
  observaciones,
  fuente: f('255', paginaPdf)
})

const SIN_CATEGORIA = 'La p. 355 no repite la categoría de la fila; la última impresa (p. 354) es DOTACIONAL.'

// Tabla de localización permitida de uso por área de mixtura (art. 255, p. 351-355).
const MATRIZ = [
  fila('COMERCIO', 'COMERCIO PEQUEÑO Menos de 200 m2', 'SSSSS', 351),
  fila('COMERCIO', 'COMERCIO MEDIANO Entre 201 m2 y 400 m2', 'NSSSS', 351),
  fila('COMERCIO', 'COMERCIO GRANDE Entre 401 m2 y 2500 m2', 'NNSSS', 351),
  fila('COMERCIO', 'GRANDES SUPERFICIES Y ZONAS COMERCIALES Superior a 2501 m2', 'NNSNN', 351),
  fila('SERVICIOS', 'OFICINA DOMESTICA Aforo tipo 1', 'SSSSS', 351),
  fila('SERVICIOS', 'OFICINA EN ZOCALO URBANO Aforo tipo 1 y 2.', 'SSSSS', 351),
  fila('SERVICIOS', 'EDIFICIO ESPECIALIZADO DE OFICINAS O CONSULTORIOS Aforos tipo 1, 2 y 3', 'NSSSS', 351),
  fila('SERVICIOS', 'EDIFICIO ESPECIALIZADO DE OFICINAS O CONSULTORIOS Aforos tipo 4', 'NNSSS', 352),
  fila('SERVICIOS', 'HOSPEDAJE PEQUEÑO Capacidad igual o inferior a 50 camas', 'NSSSS', 352),
  fila('SERVICIOS', 'HOSPEDAJE MEDIANO Con capacidad entre 51 y 150 camas', 'NNSSS', 352),
  fila('SERVICIOS', 'HOSPEDAJE GRANDE Con capacidad superior a 151 camas', 'NNSSS', 352),
  fila('SERVICIOS', 'Restaurantes, panaderías, reposterías cafeterías y similares Aforo tipo 1', 'SSSSS', 352),
  fila('SERVICIOS', 'Restaurantes, panaderías, reposterías cafeterías y similares Aforo tipo 2', 'NSSSS', 352),
  fila('SERVICIOS', 'Restaurantes, panaderías, reposterías cafeterías y similares Aforo tipo 3 y 4', 'NNSSS', 352),
  fila('SERVICIOS', 'Banquetes, salas de celebraciones y clubes Aforos 1 y 2', 'NSSSS', 352),
  fila('SERVICIOS', 'Banquetes, salas de celebraciones y clubes Aforos 3 y 4', 'NNSSS', 352),
  fila('SERVICIOS', 'ESTABLECIMIENTOS CON VENTA Y CONSUMO DE LICOR Aforo tipo 1', 'NSSSS', 352),
  fila('SERVICIOS', 'ESTABLECIMIENTOS CON VENTA Y CONSUMO DE LICOR aforo tipo 2, 3 y 4', 'NNSSS', 353),
  fila('SERVICIOS', 'SERVICIOS PERSONALES TIPOLOGIA 1 Aforo tipo 1', 'SSSSS', 353),
  fila('SERVICIOS', 'SERVICIOS PERSONALES TIPOLOGIA 1 Aforo tipo 2', 'NSSSS', 353),
  fila('SERVICIOS', 'SERVICIOS PERSONALES TIPOLOGIA 1 aforo tipo 3 y 4', 'NNSSS', 353),
  fila('SERVICIOS', 'SERVICIOS PERSONALES TIPOLOGIA 2 Aforo tipo 1', 'NSSSS', 353),
  fila('SERVICIOS', 'SERVICIOS PERSONALES TIPOLOGIA 2 Aforo tipo 2 y 3.', 'NNSSS', 353),
  fila('SERVICIOS', 'SERVICIOS PERSONALES TIPOLOGIA 2 aforo tipo 4', 'NNSNN', 353),
  fila('SERVICIOS', 'CASINOS Y LUGARES DE JUEGO independiente del aforo', 'NNNNN', 353),
  fila('INDUSTRIA', 'FAMI-INDUSTRIA Área menor a 100 m2', 'SSSSS', 353),
  fila('INDUSTRIA', 'INDUSTRIAI ARTESANAL Área menor a 100 m2', 'SSSSS', 353),
  fila('INDUSTRIA', 'FAMI-INDUSTRIA superiores a 100 m2 y menores a 200 m2', 'NSSSS', 353),
  fila('INDUSTRIA', 'INDUSTRIA ARTESANAL Superiores a 100 m2 y menores a 200 m2', 'NSSSS', 353, ['La etiqueta de la fila se parte entre las pp. 353 y 354.']),
  fila('INDUSTRIA', 'FAMI-INDUSTRIA superores a 200 m2 y menores a 400 m2', 'NNSSS', 354),
  fila('INDUSTRIA', 'INDUSTRIA ARTESANAL superiores a 200 m2 y menrores a 400 m2', 'NNSSS', 354),
  fila('INDUSTRIA', 'INDUSTRIA MENOR', 'NSSSS', 354),
  fila('INDUSTRIA', 'INDUSTRIA MEDIANA', 'NNSSS', 354),
  fila('INDUSTRIA', 'GRAN INDUSTRIA', 'NNSSS', 354),
  fila('INDUSTRIA', 'ACCESORIOS Y REPUESTOS LIVIANOS NUEVOS Y USADOS PARA AUTOMOVILES,LUJOS, VIDRIOS, LLANTAS Y NEUMATICOS', 'NSSSS', 354),
  fila('DOTACIONAL', 'EDUCACION', 'NSSSS', 354),
  fila('DOTACIONAL', 'GUARDERIAS', 'SSSSS', 354),
  fila('DOTACIONAL', 'SALUD PRIMER NIVEL', 'SSSSS', 354),
  fila('DOTACIONAL', 'SALUD SEGUNDO NIVEL', 'NSSSS', 354),
  fila('DOTACIONAL', 'SALUD TERCER NIVEL', 'NNSSS', 354),
  fila('DOTACIONAL', 'ASISTENCIA SOCIAL', 'NSSSS', 354),
  fila('DOTACIONAL', 'SERVICIOS COMUNITARIOS', 'SSSSS', 354),
  fila('DOTACIONAL', 'CULTURALES', 'SSSSS', 354),
  fila('DOTACIONAL', 'CULTO', 'SSSSS', 354),
  fila('DOTACIONAL', 'RECREACION Y DEPORTES', 'SSSSS', 354),
  fila('DOTACIONAL', 'DEPORTES EXTREMOS Y NUEVAS TENDENCIAS DEPORTIVAS', 'NSSSS', 354),
  fila(null, 'EDIFICIOS CEMENTERIOS (EN ALTURA)', 'NNSSS', 355, [SIN_CATEGORIA]),
  fila(null, 'HORNOS CREMATORIOS (ASOCIADOS AL RITUAL)', 'NNSNN', 355, [SIN_CATEGORIA]),
  fila(null, 'SERVICIO DE DISTRIBUCION Y ALMACENAMIENTO DEL SECTOR PRIMARIO Y COMERCIO POPULAR', 'NNSSS', 355, [SIN_CATEGORIA]),
  fila(null, 'ALMACENAMIENTO, DISTRIBUCION Y EXPENDIO DE COMBUSTIBLES', 'NNSSS', 355, [SIN_CATEGORIA]),
  fila(null, 'DEPOSITOS DE VEHICULOS DE TRANSPORTE PUBLICO', 'SSSSS', 355, [SIN_CATEGORIA]),
  fila(null, 'DEPOSITOS DE VEHICULOS DE TRANSPORTE PÚBLICO Y CENTROS LOGÍSTICOS DE TRANSPORTE DE PASAJEROS', 'SSSSS', 355, [SIN_CATEGORIA]),
  fila(null, 'RECUPERACION DE MATERIALES, PLANTAS DE RECICLAJE, ESTACIONES DE TRASNFERENCIA Y ESCOMBRERAS.', 'NNSSS', 355, [SIN_CATEGORIA]),
]

const grupo = (categoria, relacionadoCon, subcategorias, observaciones = []) => ({
  categoria,
  relacionadoCon,
  subcategorias,
  observaciones
})
const tabla = (titulo, areaIds, paginaPdf, grupos) => ({ titulo, areaIds, grupos, fuente: f('255', paginaPdf) })

// Régimen específico de localización de actividades por subcategoría para cada área de mixtura (p. 356-358).
const ACTIVIDADES = [
  tabla(
    'Actividades permitidas en áreas de baja mixtura – residencial predominante',
    ['baja'],
    356,
    [
      grupo(
        'Comercio pequeño',
        'Comercio minorista y frecuente',
        [
        'Tiendas de barrio y/o Mini mercados',
        'Papelerías',
        'Misceláneas',
        'Droguerías',
        'Cacharrerías',
        'Almacenes y Comercio Minorista',
        'Tiendas de Mascotas',
        'Estanquillos',
        'Loterías y Venta de Chance',
        'Almacenes de vestuario, artículos médicos, hobbies, joyerías, muebles, decoración, librerías tecnología y comunicaciones.'
        ]
      ),
      grupo(
        'Servicios personales de bajo impacto',
        'Servicios personales con aforos del tipo 1',
        [
        'Oficinas en Zócalo Urbano',
        'Oficinas Domesticas',
        'Servicios menores de reparación (electrodomésticos, muebles, calzado, etc.) (no automotriz)',
        'Estudios fotográficos',
        'Servicios Personales tipología 1',
        'Peluquerías',
        'Venta de Servicios Funerarios y Exequiales',
        'Restaurantes, panaderías, reposterías, cafeterías, cafés y heladerías, con procesamiento, venta, empacado, envasado y/o consumo de alimentos',
        'Consultorios (Médicos y Veterinarios) Centros terapéuticos',
        'Parqueaderos y lavaderos de autos livianos',
        'Centros de estética y/o spa'
        ]
      ),
      grupo(
        'Industria',
        'Área menor a 100 m2',
        [
        'Fami-Industria y/o Industria Artesanal'
        ]
      )
    ]
  ),
  tabla(
    'Actividades permitidas en áreas y corredores de media mixtura',
    ['media'],
    356,
    [
      grupo(
        'Además del comercio pequeño, comercio de tamaño mediano',
        'Comercio minorista comercio frecuente y ocasional comercio doméstico y especializado comercio de impacto mediano aglomeraciones comerciales y de servicios medianos (mall)',
        [
        'Establecimientos con venta y consumo de bebidas alcohólicas (licorelas, tiendas u otros)',
        'Compraventas, prenderías y casas de empeño',
        'Distribuidoras',
        'Venta de maquinaria y equipos',
        'Alquiler de maquinaria y equipos',
        'Concesionarios automotrices',
        'Venta minorista de repuestos y accesorios',
        'Guarderías de Mascotas y Centros de Estética Animal.',
        'Comercio de pinturas, esmaltes, barnices y similares.'
        ]
      ),
      grupo(
        'Servicios de mediano impacto y de alto impacto en bajo aforo',
        'Servicios personales tipología 1 y 2',
        [
        'Sastrerías y confección',
        'Oficinas de correos y centros logísticos',
        'Banquetes y salas de celebraciones',
        'Empacado y envasado de alimentos',
        'Centros Especializados de Medicina y Veterinaria',
        'Venta de materias primas',
        'Salas de ensayo artístico (Academias de Baile, Estudios de grabación etc.)',
        'Carpinterías y Talleres de Metal-mecánica',
        'Panaderías y reposterías',
        'Hospedaje Pequeño y mediano',
        'Laboratorios Clínicos o científicos, centros ayudas diagnosticas o similares',
        'Salas de velación',
        'Instituciones prestadoras de Salud IPS',
        'Estaciones de recarga rápida de energía para vehículos eléctricos – incluidos buses-',
        'Estaciones de recarga lenta de energía para vehículos eléctricos',
        'Servicios menores de reparación (electrodomésticos, muebles, calzado)',
        'Servicios al vehículo liviano',
        'Lavanderias, centros de esterilizacion de objetos o similares',
        'Gimnasios',
        'Centros de estética animal'
        ], ['La celda de categoría se parte entre las pp. 356 y 357 ("Servicios de mediano impacto" / "de alto impacto en bajo aforo"); la conjunción "y" es una reconstrucción.']
      ),
      grupo(
        'Industria',
        'Industria pequeña',
        [
        'Fami-Industria',
        'Industria Menor',
        'Industria Artesanal'
        ]
      )
    ]
  ),
  tabla(
    'Actividades permitidas en áreas y corredores de alta mixtura – centralidades y corredores con alta intensidad, además de las centralidades con predominancia económica',
    ['altaCentralidades', 'altaPredominanciaEconomica'],
    357,
    [
      grupo(
        'Además del comercio pequeño y mediano, comercio grande',
        'Comercio minorista y mayorista comercio frecuente y ocasional comercio doméstico y especializado aglomeraciones comerciales y de servicios comercio de alto impacto',
        [
        'Venta de Maquinaria y Equipos',
        'Venta de repuestos y accesorios',
        'Litografías y Tipografías',
        'Hipermercados',
        'Centros Comerciales, malls y comercio mayorista',
        'Comercio Mayorista',
        'Depósitos, Distribuidoras y Bodegas'
        ]
      ),
      grupo(
        'Servicios de alto impacto',
        'Servicios personales tipologías 1 y 2',
        [
        'Hospedaje Grande',
        'Moteles',
        'Litografías y tipografías',
        'Servitecas y/o Centros de Diagnóstico Automotriz',
        'Salas de velación y Laboratorio de Tanatopraxia y Tanatoestética',
        'Estaciones de Recarga rápida de energía para vehículos eléctricos – incluidos buses-',
        'Estaciones de Recarga lenta de energía para vehículos eléctricos',
        'Edificio especializado de oficinas o consultorios',
        'Centros de atención al vehículo',
        'Concesionarios automotrices',
        'Guardería de mascotas'
        ]
      ),
      grupo(
        'Industria',
        'Industria pequeña y mediana',
        [
        'Industria artesanal',
        'Industria pequeña y mediana'
        ]
      )
    ]
  ),
  tabla(
    'Actividades permitidas en áreas y corredores de alta mixtura – áreas de actividad económica en transformación',
    ['altaTransformacion'],
    358,
    [
      grupo(
        'Además del comercio pequeño y mediano, comercio grande y grandes superficies',
        'Comercio minorista y mayorista comercio frecuente y ocasional comercio doméstico y especializado aglomeraciones comerciales y de servicios comercio de alto impacto',
        [
        'Venta de maquinaria y equipos',
        'Venta de repuestos y accesorios',
        'Hospedaje grande',
        'Centros comerciales y malls',
        'Comercio mayorista',
        'Comercio de materiales con riesgo tecnológico y ambiental',
        'Depósitos, Distribuidoras, Bodegas, Centros de Acopio y Bancos de Alimentos',
        'Hipermercados',
        'Grandes superficies'
        ]
      ),
      grupo(
        'Servicios de alto impacto',
        'Servicios personales de las tipologías 1 y 2',
        [
        'Guarderías de Mascotas',
        'Hospedaje grande',
        'Moteles',
        'Establecimientos con venta y consumo de licor',
        'Salas de velación, y Laboratorio de tanatopraxia y tanatoestética',
        'Salas de velación',
        'Estaciones de recarga rápida de energía para vehículos eléctricos – incluidos buses-',
        'Estaciones de recarga lenta de energía para vehículos eléctricos',
        'Servitecas y/o Centros de Diagnóstico Automotriz',
        'Edificio especializado de oficinas yo consultorios',
        'Centros de atención al vehículo liviano y pesado',
        'otros servicios personales tipología 2 no relacionados en esta tabla'
        ]
      ),
      grupo(
        'Industria',
        'Industria mediana y grande',
        [
        'Industria artesanal',
        'Industria mediana y grande'
        ]
      )
    ]
  ),
]

const pauGrupo = (categoria, relacionadoCon, filas) =>
  filas.map(([subcategoria, sn, paginaPdf]) => ({
    categoria,
    relacionadoCon,
    subcategoria,
    requiere: sn === 'S',
    fuente: f('260', paginaPdf)
  }))

// Exigencia de protocolo ambiental y urbanístico (PAU) por actividad (art. 260, p. 362-364). S = requiere PAU.
const PAU = [
  ...pauGrupo('Comercio', 'Comercio Pequeño - Comercio Minorista Y Frecuente', [
    ['Tiendas De Barrio Y/O Mini Mercados', 'N', 362],
    ['Papelerías', 'N', 362],
    ['Misceláneas', 'N', 362],
    ['Almacenes Y Comercio Minorista', 'N', 362],
    ['Almacenes De Vestuario, Artículos Médicos, Hobbies, Joyerías, Muebles, Decoración, Librerías Tecnología Y Comunicaciones.', 'N', 362],
    ['Droguerías', 'N', 362],
    ['Cacharrerías', 'N', 362],
    ['Comercio De Pinturas, Esmaltes, Barnices Y Similares.', 'N', 362],
    ['Loterías Y Venta De Chance', 'N', 363],
    ['Compraventas, Prenderías Y Casas De Empeño', 'N', 363],
    ['Tiendas De Mascotas', 'S', 363],
    ['Carnicerías Y Pescaderías', 'S', 363],
    ['Establecimientos Con Venta Y Consume De Licor (Licoreras, Tiendas, Estanquillos, Pubs, Discotecas, Tabernas Y Otros)', 'S', 363],
    ['Comercio Minorista De Repuestos Y Accesorios', 'N', 363],
    ['Venta De Repuestos Y Accesorios', 'N', 363]
  ]),
  ...pauGrupo('Comercio', 'Comercio Mediano', [
    ['Comercio De Materiales Con Riesgo Tecnológico y Ambiental', 'S', 363],
    ['Venta de materias primas', 'N', 363],
    ['Venta de maquinaria y equipos', 'N', 363],
    ['Alquiler de maquinaria y equipos', 'N', 363],
    ['Distribuidoras', 'S', 363],
    ['Establecimientos con venta y consume de licor (licoreras, tiendas, estanquillos, pubs, discotecas, tabernas y otros)', 'S', 363],
    ['Venta de repuestos y accesorios', 'N', 363]
  ]),
  ...pauGrupo('Comercio', 'Comercio Grande', [
    ['Comercio de materiales con riesgo tecnológico y ambiental', 'S', 363],
    ['Venta de materias primas', 'N', 363],
    ['Venta de maquinaria y equipos', 'N', 363],
    ['Alquiler de maquinaria y equipos', 'N', 363],
    ['Distribuidoras', 'S', 363],
    ['Establecimientos con venta y consume de licor (licoreras, tiendas, estanquillos, pubs, discotecas, tabernas y otros)', 'S', 363],
    ['Venta de repuestos y accesorios', 'N', 363],
    ['Distribuidoras', 'S', 363]
  ]),
  ...pauGrupo('Comercio', 'Zonas Comerciales Con Área Superior A 2501 M2', [
    ['Centros comerciales, malls y comercio mayorista', 'S', 363],
    ['Establecimientos con venta y consume de licor (licoreras, tiendas, estanquillos, pubs, discotecas, tabernas y otros)', 'S', 363],
    ['Hipermercados, grandes superficies', 'S', 363]
  ]),
  ...pauGrupo('Servicios', 'Hospedaje', [
    ['Hospedaje pequeño', 'S', 363],
    ['Hospedaje mediano', 'S', 363],
    ['Hospedaje grande', 'S', 363]
  ]),
  ...pauGrupo('Servicios', 'Oficinas', [
    ['Oficinas en zócalo urbano', 'N', 363],
    ['Oficinas domésticas', 'N', 363],
    ['Edificios exclusivos y centros empresariales', 'N', 363]
  ]),
  ...pauGrupo('Servicios', 'Servicios Personales Tipología 1', [
    ['Estudios fotográficos', 'N', 363],
    ['Oficinas de correos y centros logísticos', 'N', 363],
    ['Venta de servicios funerarios y exequiales', 'N', 363],
    ['Sastrerías y confección', 'N', 363],
    ['Peluquerías', 'S', 363],
    ['Consultorios', 'N', 364],
    ['Centros de estética y/o spa', 'S', 364],
    ['Servicios menores de reparación: electrodomésticos, muebles, calzado, etc. (no automotriz)', 'S', 364],
    ['Centros especializados de medicina y veterinaria', 'S', 364],
    ['Venta de materias primas', 'N', 364],
    ['Litografías y tipografías', 'N', 364],
    ['Gimnasio', 'S', 364],
    ['Instituciones prestadoras de salud ips', 'S', 364],
    ['Guardería de mascotas y centros de estética animal', 'S', 364],
    ['Parqueaderos y lavaderos de autos livianos', 'S', 364],
    ['Salas de ensayo artístico, academias de baile, estudios de grabación y similares', 'S', 364],
    ['Lavanderías, centros de esterilización de objetos y similares', 'S', 364],
    ['Laboratorios clínicos o científicos y centros de ayudas diagnósticas o similares', 'S', 364],
    ['Edificio especializado de consultorios', 'S', 364]
  ]),
  ...pauGrupo('Servicios', 'Servicios Personales Tipología 2', [
    ['Servicios al vehiculo liviano', 'S', 364],
    ['Concesionarios automotrices', 'S', 364],
    ['Centro de atención al vehiculo liviano y pesado', 'S', 364],
    ['Depósitos y bodegas', 'S', 364],
    ['Centros de acopio, bancos de alimentos', 'S', 364],
    ['Estaciones de combustibles', 'S', 364],
    ['Estaciones de recarga lenta y rápida de energía para vehículos eléctricos', 'S', 364],
    ['Salas de velación, servicios funerarios, laboratorios de tanatopraxia y tanatoestética', 'S', 364],
    ['Carpinterías', 'S', 364],
    ['Talleres de metalmecánica', 'S', 364],
    ['Servitecas y/o centros de diagnostico automotriz', 'S', 364],
    ['Servicios menores de reparación (electrodomésticos, muebles, calzado)', 'S', 364],
    ['Casinos y lugares de juego', 'S', 364]
  ]),
  ...pauGrupo('Servicios', 'Terciario Recreativo', [
    ['Restaurantes, panaderías, reposterías, cafeterías, cafes y heladerías, con procesamiento, venta, empacado, envasado y/o consumo de alimentos', 'S', 364],
    ['Banquetes, salas de celebraciones y clubes', 'S', 364]
  ]),
  ...pauGrupo('Industria', '', [
    ['Fami-industria', 'S', 364],
    ['Industria artesanal', 'S', 364],
    ['Industria menor', 'S', 364],
    ['Industria mediana', 'S', 364],
    ['Gran industria', 'S', 364]
  ]),
  ...pauGrupo('Dotación', '', [
    ['Depositos logisticos y centros de transporte de pasajeros', 'S', 364]
  ]),
]

const regla = (id, efecto, texto, paginaPdf, observaciones = []) => ({
  id,
  efecto,
  texto,
  observaciones,
  fuente: f('255', paginaPdf)
})

// Reglas de interpretación del régimen de usos urbanos (art. 255, p. 359).
const REGLAS_INTERPRETACION = [
  regla(
    'r1',
    'no_listado_prohibido',
    'Los usos y actividades que no aparezcan expresamente relacionados en las tablas del régimen específico de localización de actividades por subcategoría de uso para cada área de mixtura se consideran prohibidos.',
    359,
    ['Se solapa con la regla r5; el acuerdo no dice cuál prima.']
  ),
  regla('r2', 'permitido_en_baja_vale_en_media_y_alta', 'Una actividad que puede localizarse en baja mixtura también puede localizarse en media y alta mixtura.', 359),
  regla('r3', 'permitido_en_media_vale_en_alta', 'Una actividad que puede localizarse en media mixtura también puede localizarse en alta mixtura.', 359),
  regla('r4', 'alta_solo_en_alta', 'Las actividades establecidas para las áreas de alta mixtura solo pueden localizarse allí.', 359),
  regla(
    'r5',
    'no_listado_consultar_matriz',
    'Si una actividad no figura en ninguna de las tablas del régimen específico, se consulta la tabla de localización permitida de uso por área de mixtura y se aplica el criterio general de localización del uso.',
    359,
    ['Se solapa con la regla r1; el acuerdo no dice cuál prima.']
  ),
  regla(
    'p1',
    'establecidas_exentas_de_localizacion',
    'Las disposiciones de localización de las tablas no aplican a actividades establecidas antes de la entrada en vigencia del acuerdo; el PAU y los aforos sí aplican a actividades establecidas y por establecerse.',
    359
  ),
  regla('p2', 'mineria_prohibida', 'La minería es un uso prohibido en suelo urbano; las áreas mineras existentes se sujetan al régimen de usos al terminar su explotación.', 359)
]

const disposicion = (tema, resumen, articulo, paginaPdf) => ({ tema, resumen, fuente: f(articulo, paginaPdf) })

export const MEDELLIN = congelar({
  municipioSlug: 'Medellin',
  nombre: 'Acuerdo 48 de 2014 (revisión y ajuste de largo plazo del POT de Medellín)',
  tipo: 'acuerdo',
  numero: '48',
  anio: 2014,
  fechaAdopcion: '2014-12-19', // [verificar] con la columna fecha_adopcion de usos_suelo o la Gaceta Oficial 4267
  fechaConsulta: '2026-11-15',
  vigencia: {
    estado: VIGENCIA.VIGENTE_SEGUN_FUENTE,
    fuente:
      'Mapas Medellín y datos.gov.co publican el Acuerdo 48 de 2014 como POT 2014-2027; el art. 614 fija el largo plazo hasta el fin del cuarto período de alcaldes desde la adopción.',
    nota: 'El Concejo aprobó el Proyecto de Acuerdo 104 de 2026 (nuevo POT) el 5-nov-2026 y se formalizó el 12-nov; la sanción y la publicación no están verificadas [verificar]. Hasta confirmarlas, este acuerdo sigue como norma cargada.'
  },
  cobertura: COBERTURA[1], // parcial
  fuente: {
    url: 'https://www.medellin.gov.co/es/wp-content/uploads/2022/10/POT-Medellin.pdf',
    normograma: 'https://www.medellin.gov.co/normograma/docs/astrea/docs/a_conmed_0048_2014.htm',
    nota: 'PDF con capa de texto de 877 páginas; las tablas SI/NO se leyeron por celdas porque la extracción de texto plano las desordena.'
  },
  geometria: {
    origen: 'supabase',
    tabla: 'usos_suelo',
    valorMunicipioEnCapa: 'Medellín', // así está escrito en la columna municipio de usos_suelo (con tilde)
    campos: ['area_general', 'subcategoria', 'cod_cat_uso', 'cod_subcat_uso'],
    nota: 'Capa de usos generales del suelo urbano (Mapa 23). Según su metadato es una aproximación técnica; prevalece el mapa protocolizado [verificar].'
  },
  tipologias: [],
  zonas: [],
  regimenMixtura: {
    // `heredaDe`: áreas cuyas actividades nombradas también valen aquí (art. 255, reglas r2 y r3: lo permitido en baja
    // mixtura también lo está en media y alta, y lo permitido en media también lo está en alta).
    areas: [
      {
        id: 'baja',
        nombre: 'Áreas de baja mixtura – residencial predominante',
        areaGeneralCapa: 'Áreas de baja mixtura',
        codigosSubcategoria: [11],
        heredaDe: []
      },
      {
        id: 'media',
        nombre: 'Áreas y corredores de media mixtura',
        areaGeneralCapa: 'Áreas y corredores de media mixtura',
        codigosSubcategoria: [21],
        heredaDe: ['baja']
      },
      {
        id: 'altaTransformacion',
        nombre: 'Alta mixtura – áreas de actividad económica en transformación',
        areaGeneralCapa: 'Áreas y corredores de alta mixtura',
        codigosSubcategoria: [31],
        heredaDe: ['baja', 'media']
      },
      {
        id: 'altaCentralidades',
        nombre: 'Alta mixtura – centralidades y corredores con alta intensidad',
        areaGeneralCapa: 'Áreas y corredores de alta mixtura',
        codigosSubcategoria: [32],
        heredaDe: ['baja', 'media']
      },
      {
        id: 'altaPredominanciaEconomica',
        nombre: 'Alta mixtura – centralidades con predominancia económica',
        areaGeneralCapa: 'Áreas y corredores de alta mixtura',
        codigosSubcategoria: [33],
        heredaDe: ['baja', 'media']
      }
    ],
    // Categorías de la capa que no tienen columna en la matriz de usos.
    otrasCategoriasDeLaCapa: [
      { id: 'espacioPublicoExistente', codigosSubcategoria: [41, 42, 43], norma: 'art. 253' },
      { id: 'espacioPublicoProyectado', codigosSubcategoria: [50], norma: 'art. 254 (solo usos transitorios)' },
      { id: 'dotacional', codigosSubcategoria: [60], norma: 'art. 252 (conserva el uso dotacional)' }
    ],
    matriz: MATRIZ,
    actividadesPorArea: ACTIVIDADES,
    requierePau: PAU,
    reglasInterpretacion: REGLAS_INTERPRETACION
  },
  disposicionesGenerales: [
    disposicion(
      'Zonificación de los usos urbanos',
      'Los usos urbanos se espacializan en el Mapa 23 (Usos Generales del Suelo Urbano) con tres áreas generales de uso: baja, media y alta mixtura, para las cuales se fija un porcentaje mínimo de construcción residencial y se habilita un máximo de otras actividades. Las categorías de uso son residencial, comercial, servicios, industria, dotacional, espacio público existente y espacio público proyectado.',
      '242',
      340
    ),
    disposicion(
      'Tamaño del comercio',
      'Pequeño: menos de 200 m²; mediano: de 201 a 400 m²; grande: de 400 a 2.500 m²; superior a 2.500 m²: hipermercados y grandes superficies. El área es la suma de uno o varios locales, en construcción neta sin circulaciones externas. La tabla de localización usa los cortes 200, 201-400, 401-2.500 y más de 2.501 m².',
      '249',
      346
    ),
    disposicion(
      'Aforo de los servicios',
      'Tipo 1: menos de 25 personas y hasta 100 m²; tipo 2: de 26 a 100 personas y hasta 400 m²; tipo 3: de 101 a 200 personas y hasta 800 m²; tipo 4: 201 personas o más, por encima de 800 m². Para la licencia priman las variables de tamaño; para el control del funcionamiento se usa el aforo del PAU.',
      '250',
      348
    ),
    disposicion(
      'Servicios personales: tipologías 1 y 2',
      'Tipología 1: servicios profesionales y tecnológicos de bajo y medio impacto (consultorios médicos y veterinarios, odontología, peluquería, gimnasios, centros terapéuticos y de estética, parqueaderos de vehículos livianos, reparación menor no vehicular). Tipología 2: servicios de alto impacto (reparación de maquinaria y vehículos, parqueaderos de vehículos pesados, casinos y salas de juego, salas de velación, estaciones de combustible, bodegas y depósitos, servicios de índole sexual). Hospedaje: pequeño hasta 50 camas, mediano de 51 a 150, grande más de 150.',
      '250',
      347
    ),
    disposicion(
      'Uso dotacional',
      'Corresponde a las áreas e inmuebles identificados como equipamientos. Si el equipamiento de un predio con uso dotacional desaparece, el predio conserva el uso y puede ser reemplazado por otra tipología.',
      '252',
      349
    ),
    disposicion(
      'Espacio público proyectado: usos transitorios',
      'Mientras el municipio no adquiera los inmuebles del espacio público proyectado (Mapa 12), mantienen su actividad sin aumentar la edificabilidad. Si se transforman con licencia, solo pueden tener parqueaderos, ferias artesanales, viveros, o comercio y servicios permitidos con su PAU, en un piso y con materiales fácilmente removibles.',
      '254',
      350
    ),
    disposicion(
      'Actividades económicas singulares',
      'Se les exige el PAU las actividades con alguna de estas características: establecimientos comerciales con más de 2.500 m² de venta; instalaciones deportivas, lúdicas o culturales con aforo superior a 2.000 personas; clínicas o centros hospitalarios con más de 200 camas; centros educativos con más de 1.000 alumnos; edificios o complejos con más de 500 trabajadores; edificios exclusivos de parqueaderos o lavaderos de vehículos; estaciones de combustible.',
      '256',
      360
    ),
    disposicion(
      'Protocolo ambiental y urbanístico (PAU)',
      'Es el instrumento de control para viabilizar la localización de actividades que pueden generar impactos negativos al uso residencial. Si la actividad está permitida en el área de mixtura, se verifica si requiere PAU con la tabla del art. 260 (79 filas, en este archivo en regimenMixtura.requierePau). El contenido de los PAU (arts. 264 a 269) no se cargó.',
      '260',
      362
    ),
    disposicion(
      'Vigencias del plan',
      'Corto plazo: desde la adopción hasta el fin del segundo período constitucional de alcaldes. Mediano plazo: hasta el fin del tercero. Largo plazo: hasta el fin del cuarto período, es decir, hasta 2027.',
      '614',
      674
    )
  ],
  limitaciones: [
    'Régimen de usos del suelo urbano únicamente; el suelo rural y de expansión no se cargaron.',
    'No se cargaron los porcentajes mínimos de vivienda y máximos de otros usos por tratamiento (Título III, aprovechamientos), ni los estándares de ruido y calidad del aire (arts. 261 a 263), ni el contenido de los PAU (arts. 264 a 269).',
    'No se verificaron modificaciones al Acuerdo 48 de 2014 posteriores a su adopción [verificar].',
    'Nuevo POT (Proyecto de Acuerdo 104 de 2026): aprobado por el Concejo, sin sanción ni publicación verificadas [verificar]; podría reemplazar este régimen.',
    'Las reglas r1 y r5 del art. 255 se solapan y el acuerdo no dice cuál prima: una actividad nombrada en la matriz por tamaño o aforo pero ausente de las tablas específicas (p. ej. gimnasios en baja mixtura) queda sin resolver [verificar con Planeación o una curaduría].',
    'La capa de usos en Supabase es una aproximación técnica del Mapa 23; los códigos 41, 42, 43, 50 y 60 (espacio público y dotacional) no tienen columna en la matriz.',
    'Las siete filas de la p. 355 no traen su categoría impresa; se dejan sin categoría.',
    'En la tabla de PAU (art. 260), el grupo al que pertenece cada fila (p. ej. dónde termina servicios personales tipología 1) se tomó de las celdas combinadas del PDF; conviene confirmarlo contra el documento [verificar].',
    'Los conceptos de uso del suelo los expiden las curadurías urbanas; este instrumento es informativo y no autoriza ninguna actividad.'
  ]
})