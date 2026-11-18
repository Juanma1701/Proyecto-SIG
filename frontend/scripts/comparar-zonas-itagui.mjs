// Compara la capa oficial de áreas de actividad de Itagüí con las zonas transcritas del acuerdo.
// Solo lectura. Uso: node scripts/comparar-zonas-itagui.mjs
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { URL_CAPA_AREAS_ACTIVIDAD_ITAGUI, zonaDesdeAtributos } from '../src/utils/normativa/zonaOficial.js'
import { instrumentoDeMunicipio } from '../src/utils/normativa/index.js'
import { aplicarCorreccionesCapa } from '../src/utils/normativa/correccionesCapaItagui.js'

const TAMANO = 1000

async function descargarAtributos() {
  const todos = []
  for (let desplazamiento = 0; ; desplazamiento += TAMANO) {
    const parametros = new URLSearchParams({
      where: '1=1', outFields: '*', returnGeometry: 'false', f: 'json',
      resultOffset: String(desplazamiento), resultRecordCount: String(TAMANO)
    })
    const respuesta = await fetch(`${URL_CAPA_AREAS_ACTIVIDAD_ITAGUI}/query?${parametros}`)
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
    const datos = await respuesta.json()
    if (datos.error) throw new Error(datos.error.message)
    todos.push(...datos.features.map((f) => f.attributes))
    if (!datos.exceededTransferLimit) return todos
  }
}

const igualConjunto = (a, b) => a.length === b.length && a.every((x) => b.includes(x))
const diferencia = (a, b) => ({ soloOficial: a.filter((x) => !b.includes(x)), soloTranscrito: b.filter((x) => !a.includes(x)) })

const atributos = await descargarAtributos()
const instrumento = instrumentoDeMunicipio('Itagui')
const oficiales = new Map()
let sinCodigo = 0
const internas = []

for (const a of atributos) {
  const z = aplicarCorreccionesCapa(zonaDesdeAtributos(a))
  if (!z.codigo) { sinCodigo++; continue }
  const previa = oficiales.get(z.codigo)
  if (previa && (!igualConjunto(previa.compatibles, z.compatibles) || !igualConjunto(previa.condicionados, z.condicionados))) {
    internas.push(z.codigo)
  }
  oficiales.set(z.codigo, previa ?? z)
}

const transcritas = new Map(instrumento.zonas.map((z) => [z.codigo, z]))
const faltanEnNuestraNorma = [...oficiales.keys()].filter((c) => !transcritas.has(c)).sort()
const faltanEnLaCapa = [...transcritas.keys()].filter((c) => !oficiales.has(c)).sort()
const diferentes = []

for (const [codigo, t] of transcritas) {
  const o = oficiales.get(codigo)
  if (!o) continue
  const comp = diferencia(o.compatibles, t.compatibles)
  const cond = diferencia(o.condicionados, t.condicionados)
  if (comp.soloOficial.length || comp.soloTranscrito.length || cond.soloOficial.length || cond.soloTranscrito.length) {
    diferentes.push({ codigo, compatibles: comp, condicionados: cond })
  }
}

console.log(`Polígonos descargados: ${atributos.length} (sin código: ${sinCodigo})`)
console.log(`Códigos de zona distintos en la capa: ${oficiales.size} | transcritos: ${transcritas.size}`)
console.log(`\nZonas de la capa que NO tenemos transcritas (${faltanEnNuestraNorma.length}): ${faltanEnNuestraNorma.join(', ') || '-'}`)
console.log(`\nZonas transcritas que NO están en la capa (${faltanEnLaCapa.length}): ${faltanEnLaCapa.join(', ') || '-'}`)
console.log(`\nZonas con el mismo código pero listas distintas entre polígonos de la capa (${internas.length}): ${[...new Set(internas)].join(', ') || '-'}`)
console.log(`\nZonas con listas distintas entre capa y transcripción (${diferentes.length}):`)
for (const d of diferentes) {
  console.log(`- ${d.codigo}`)
  if (d.compatibles.soloOficial.length || d.compatibles.soloTranscrito.length) console.log(`    compatibles: solo capa [${d.compatibles.soloOficial}] | solo nuestra [${d.compatibles.soloTranscrito}]`)
  if (d.condicionados.soloOficial.length || d.condicionados.soloTranscrito.length) console.log(`    condicionados: solo capa [${d.condicionados.soloOficial}] | solo nuestra [${d.condicionados.soloTranscrito}]`)
}

const archivo = join(tmpdir(), 'comparacion_zonas_itagui.json')
writeFileSync(archivo, JSON.stringify({ faltanEnNuestraNorma, faltanEnLaCapa, internas, diferentes }, null, 2))
console.log(`\nDetalle guardado en: ${archivo}`)