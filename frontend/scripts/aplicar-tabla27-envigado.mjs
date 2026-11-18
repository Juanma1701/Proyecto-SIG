// Pone las 123 filas de la Tabla 27 (con sus letras P/C/R ubicadas por posición) en src/utils/normativa/envigado.js.
// Conserva todo lo demás del instrumento (zonas, vigencia, advertencias...). Por defecto solo muestra el plan;
// con --escribir reescribe envigado.js (hay copia en git). Uso:
//   node scripts/aplicar-tabla27-envigado.mjs             (simulación)
//   node scripts/aplicar-tabla27-envigado.mjs --escribir  (escribe el archivo)
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ENVIGADO } from '../src/utils/normativa/envigado.js'
import { validarInstrumento } from '../src/utils/normativa/esquema.js'
import { COLUMNAS, FILAS, columnaDeZona } from './datos/tabla27-envigado.mjs'

const escribir = process.argv.includes('--escribir')
const ARCHIVO = fileURLToPath(new URL('../src/utils/normativa/envigado.js', import.meta.url))
const falla = (mensaje) => {
  console.error(`ERROR: ${mensaje}`)
  process.exit(1)
}

// 1. Cada columna de la tabla debe corresponder a una sola zona del instrumento
const codigoDeColumna = new Map()
for (const zona of ENVIGADO.zonas) {
  const columna = columnaDeZona(zona)
  if (columna === null) falla(`no sé a qué columna corresponde la zona ${JSON.stringify(zona)}. Pásamela y ajusto columnaDeZona().`)
  if (codigoDeColumna.has(columna)) falla(`dos zonas caen en la columna "${COLUMNAS[columna]}".`)
  codigoDeColumna.set(columna, zona.codigo)
}
if (codigoDeColumna.size !== COLUMNAS.length) falla(`el instrumento tiene ${codigoDeColumna.size} zonas emparejadas y la tabla ${COLUMNAS.length}.`)
console.log('Columnas de la tabla -> zonas del instrumento:')
COLUMNAS.forEach((nombre, i) => console.log(`  ${i + 1}. ${nombre} -> ${codigoDeColumna.get(i)}`))

// 2. Reglas por CIIU: solo se guardan las celdas con letra (una celda vacía no es "prohibido": el acuerdo no la define)
const reglasPorCiiu = FILAS.map(([ciiu, paginaPdf, letras, descripcion]) => ({
  ciiu,
  descripcion,
  porZona: Object.fromEntries([...letras].flatMap((letra, i) => (letra === '.' ? [] : [[codigoDeColumna.get(i), letra]]))),
  fuente: { articulo: '186', paginaPdf, verificacion: 'extraido_de_texto' }
}))

// 3. Instrumento nuevo. Se quitan las limitaciones que hablaban de filas sin interpretar y se añade la de la lectura por posición.
const base = structuredClone(ENVIGADO)
const viejas = base.limitaciones ?? []
const obsoletas = viejas.filter((l) => /sin interpretar|sinInterpretar|no (se )?conserva|pierde|4 de 123|119|resuelve solo/i.test(String(l)))
const limitaciones = [
  ...viejas.filter((l) => !obsoletas.includes(l)),
  'Las letras P, C y R de la Tabla 27 (art. 186, págs. 118 a 132 del PDF) se ubicaron por la posición de cada celda con un programa, sin revisión humana [verificar]. Una celda vacía significa que el acuerdo no define la actividad en esa zona; no equivale a "prohibido".'
]
const nuevo = { ...base, reglasPorCiiu, sinInterpretar: [], limitaciones }

const errores = validarInstrumento(nuevo)
console.log(`\nFilas antes: ${ENVIGADO.reglasPorCiiu.length} resueltas y ${ENVIGADO.sinInterpretar.length} sin interpretar. Después: ${reglasPorCiiu.length} resueltas y 0 sin interpretar.`)
console.log(`Limitaciones quitadas por obsoletas (${obsoletas.length}):`)
for (const l of obsoletas) console.log(`  - ${String(l).slice(0, 110)}`)
if (errores.length > 0) falla(`el instrumento nuevo no valida:\n  ${errores.join('\n  ')}`)
console.log('El instrumento nuevo valida con esquema.js.')

if (!escribir) {
  console.log('\nSimulación: no se escribió nada. Si todo se ve bien, repite con --escribir.')
  process.exit(0)
}

const encabezado = `// Norma de usos del suelo urbano y de expansión de Envigado: Acuerdo 010 de 2011 (POT 2011-2023), Tabla 27 (art. 186).
// Generado por scripts/aplicar-tabla27-envigado.mjs con los datos de scripts/datos/tabla27-envigado.mjs.
// Las letras P, C y R se ubicaron por posición (pdfplumber), sin revisión humana. Desde aquí se puede editar a mano.

import { congelar } from './esquema.js'

export const ENVIGADO = congelar(`
writeFileSync(ARCHIVO, `${encabezado}${JSON.stringify(nuevo, null, 2)})\n`, 'utf8')
console.log(`\nEscrito: ${ARCHIVO}`)