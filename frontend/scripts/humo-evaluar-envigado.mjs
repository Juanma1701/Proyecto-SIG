// Humo: las 8 actividades × 9 zonas de Envigado. Muestra una tabla corta de resultados. Sin red.
import { ENVIGADO } from '../src/utils/normativa/envigado.js'
import { ACTIVIDADES } from '../src/utils/normativa/actividades.js'
import { evaluarPorCiiu } from '../src/utils/normativa/evaluarPorCiiu.js'

const conteo = {}
for (const a of ACTIVIDADES) {
  const fila = ENVIGADO.zonas.map((z) => {
    const r = evaluarPorCiiu({ instrumento: ENVIGADO, municipioSlug: 'Envigado', zonaCodigo: z.codigo, actividadId: a.id })
    conteo[r.resultado] = (conteo[r.resultado] ?? 0) + 1
    return `${z.codigo}:${r.datos.letra ?? '-'}`
  })
  console.log(a.id.padEnd(18), fila.join(' '))
}
const sinZona = evaluarPorCiiu({ instrumento: ENVIGADO, municipioSlug: 'Envigado', actividadId: 'restaurante' })
console.log('pin sin zona =>', sinZona.resultado, '|', sinZona.explicacion)
console.log('conteo', conteo)
if (sinZona.resultado !== 'informacion_normativa_insuficiente') process.exit(1)
console.log('Todo correcto.')
