// Muestra qué diría el motor con la norma real de Itagüí. No afirma nada: solo imprime.
// Uso: node scripts/humo-evaluar.mjs [ZU-C-01 ZU-C-03 ...]
import { ACTIVIDADES } from '../src/utils/normativa/actividades.js'
import { evaluarActividad } from '../src/utils/normativa/evaluar.js'
import { instrumentoDeMunicipio } from '../src/utils/normativa/index.js'

const instrumento = instrumentoDeMunicipio('Itagui')
const zonas = process.argv.length > 2 ? process.argv.slice(2) : ['ZU-C-01', 'ZU-C-03', 'ZU-AM-02', 'ZU-R-25']

for (const zonaCodigo of zonas) {
  console.log(`\n=== ${zonaCodigo} ===`)
  for (const a of ACTIVIDADES) {
    const r = evaluarActividad({ instrumento, municipioSlug: 'Itagui', zonaCodigo, actividadId: a.id })
    console.log(`- ${a.nombre}: ${r.resultado}${r.requiereVerificarUbicacion ? ' (verificar ubicación)' : ''}`)
    console.log(`    ${r.razones[0]}`)
  }
}