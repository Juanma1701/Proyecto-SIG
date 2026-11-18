// Cómo se leen en Medellín las actividades del catálogo (Acuerdo 48 de 2014, arts. 249, 250, 255 y 260).
// La norma de Medellín no se organiza por zonas con tabla de usos: una matriz SI/NO (art. 255) dice, para cada
// área de mixtura, si una actividad se permite según su tamaño (comercio) o su aforo (servicios).
// Los patrones son textos en minúscula que deben aparecer en UNA sola fila de la matriz cargada.
// Solo concluyen las actividades que la norma nombra (arts. 250, 255 y 260); no se infiere ninguna otra.

export const AFOROS = Object.freeze([
  { valor: 1, texto: 'Tipo 1: menos de 25 personas y hasta 100 m²' },
  { valor: 2, texto: 'Tipo 2: de 26 a 100 personas y hasta 400 m²' },
  { valor: 3, texto: 'Tipo 3: de 101 a 200 personas y hasta 800 m²' },
  { valor: 4, texto: 'Tipo 4: 201 personas o más, o más de 800 m²' }
])

// Filas de la matriz por grupo. En comercio los rangos comparten los cortes 200, 400 y 2.500 m²: un valor justo en
// el corte cae en dos filas y se toma la lectura más restrictiva (las dos deben decir SÍ).
export const GRUPOS_MATRIZ = Object.freeze({
  comercio: {
    tamano: 'area',
    rangos: [
      { etiqueta: 'hasta 200 m²', fila: 'comercio pequeño', min: 0, max: 200 },
      { etiqueta: 'de 200 a 400 m²', fila: 'comercio mediano', min: 200, max: 400 },
      { etiqueta: 'de 400 a 2.500 m²', fila: 'comercio grande', min: 400, max: 2500 },
      { etiqueta: 'más de 2.500 m²', fila: 'grandes superficies', min: 2500, max: Infinity }
    ]
  },
  restaurante: {
    tamano: 'aforo',
    rangos: [
      { etiqueta: 'aforo tipo 1', fila: 'restaurantes, panaderías, reposterías cafeterías y similares aforo tipo 1', aforos: [1] },
      { etiqueta: 'aforo tipo 2', fila: 'restaurantes, panaderías, reposterías cafeterías y similares aforo tipo 2', aforos: [2] },
      { etiqueta: 'aforo tipo 3 y 4', fila: 'restaurantes, panaderías, reposterías cafeterías y similares aforo tipo 3 y 4', aforos: [3, 4] }
    ]
  },
  licor: {
    tamano: 'aforo',
    rangos: [
      { etiqueta: 'aforo tipo 1', fila: 'consumo de licor aforo tipo 1', aforos: [1] },
      { etiqueta: 'aforo tipo 2, 3 y 4', fila: 'consumo de licor aforo tipo 2, 3 y 4', aforos: [2, 3, 4] }
    ]
  },
  serviciosPersonales1: {
    tamano: 'aforo',
    rangos: [
      { etiqueta: 'aforo tipo 1', fila: 'servicios personales tipologia 1 aforo tipo 1', aforos: [1] },
      { etiqueta: 'aforo tipo 2', fila: 'servicios personales tipologia 1 aforo tipo 2', aforos: [2] },
      { etiqueta: 'aforo tipo 3 y 4', fila: 'servicios personales tipologia 1 aforo tipo 3 y 4', aforos: [3, 4] }
    ]
  }
})

const AVISO_LICOR =
  'La norma agrupa la venta y el consumo de licor en la misma fila de la matriz y en la del PAU (nombra licoreras, tiendas, pubs y discotecas). No distingue una licorera de solo venta: se aplica la lectura de esa fila.'

// pau: textos (minúscula) que identifican las filas de la tabla del art. 260. pauSiAreaMayorA: regla del art. 256.
export const ACTIVIDADES_MEDELLIN = Object.freeze({
  licorera: { grupo: 'licor', pau: ['venta y consume de licor'], avisos: [AVISO_LICOR] },
  discoteca: { grupo: 'licor', pau: ['venta y consume de licor'], avisos: [AVISO_LICOR] },
  restaurante: { grupo: 'restaurante', pau: ['restaurantes'], avisos: [] },
  gimnasio: {
    grupo: 'serviciosPersonales1',
    pau: ['gimnasio'],
    avisos: ['La norma incluye los gimnasios en servicios personales tipología 1 (art. 250).']
  },
  minimercado: {
    grupo: 'comercio',
    pau: ['tiendas de barrio'],
    avisos: ['La norma nombra las "tiendas de barrio y/o mini mercados" dentro del comercio pequeño; el tamaño decide el área donde se permite.']
  },
  farmacia: {
    grupo: 'comercio',
    pau: ['droguerías'],
    avisos: ['La norma las nombra como "droguerías" (comercio pequeño); el tamaño decide el área donde se permite.']
  },
  tienda_tecnologia: {
    grupo: 'comercio',
    pau: ['tecnología y comunicaciones'],
    avisos: ['La norma nombra los almacenes de "tecnología y comunicaciones" dentro del comercio pequeño; el tamaño decide el área donde se permite.']
  },
  supermercado: {
    grupo: 'comercio',
    pau: [],
    pauSiAreaMayorA: 2500,
    avisos: ['La norma no nombra "supermercado": se lee como comercio por su tamaño (arts. 249 y 255); más de 2.500 m² son hipermercados y grandes superficies.']
  }
})

export const tamanoDeActividad = (id) => {
  const config = ACTIVIDADES_MEDELLIN[id]
  return config ? GRUPOS_MATRIZ[config.grupo].tamano : null
}