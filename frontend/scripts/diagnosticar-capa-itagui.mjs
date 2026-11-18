// Diagnóstico de la capa oficial de áreas de actividad de Itagüí. Solo lectura, consulta en vivo.
// Uso: node scripts/diagnosticar-capa-itagui.mjs
import { URL_CAPA_AREAS_ACTIVIDAD_ITAGUI, limpiarTexto, parsearListaCodigos } from '../src/utils/normativa/zonaOficial.js'
import { instrumentoDeMunicipio } from '../src/utils/normativa/index.js'

const TAMANO = 1000
const ZONAS_CON_DIFERENCIAS = [
  'ZU-AM-02', 'ZU-AM-04', 'ZU-R-01', 'ZU-R-25', 'ZU-R-26', 'ZE-R-02', 'ZU-R-08', 'ZU-AM-13',
  'ZU-AM-14', 'ZU-AM-17', 'ZU-AM-23', 'ZU-AM-24', 'ZU-AM-26', 'ZU-AM-27', 'ZU-AM-28'
]
// Mismo patrón que zonaOficial.js: sirve para saber qué texto no reconoce el parser.
const PATRON = /\b([CSIDR])\s*-?\s*([A-Z]?\d+|[UBT])\*{0,4}/g

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
    todos.push(...datos.features.map((f) => Object.fromEntries(Object.entries(f.attributes).map(([k, v]) => [k.toLowerCase(), v]))))
    if (!datos.exceededTransferLimit) return todos
  }
}

function residuo(texto) {
  const limpio = limpiarTexto(texto)
  if (!limpio) return ''
  return limpio.replace(PATRON, '').replace(/[\s,.;]+/g, ' ').trim()
}

function caracteresRaros(texto) {
  const raros = new Set()
  for (const c of String(texto ?? '')) {
    const codigo = c.codePointAt(0)
    if (codigo > 126 && codigo !== 0xa0) raros.add(`U+${codigo.toString(16).toUpperCase().padStart(4, '0')}`)
  }
  return [...raros]
}

const atributos = await descargarAtributos()
const instrumento = instrumentoDeMunicipio('Itagui')
const transcritas = new Map(instrumento.zonas.map((z) => [z.codigo, z]))
const porCodigo = new Map()
for (const a of atributos) {
  const codigo = limpiarTexto(a.codigo)
  if (codigo && !porCodigo.has(codigo)) porCodigo.set(codigo, a)
}

console.log('=== 1. Zonas con diferencias: texto crudo, lectura del parser y transcripción ===')
for (const codigo of ZONAS_CON_DIFERENCIAS) {
  const a = porCodigo.get(codigo)
  const t = transcritas.get(codigo)
  console.log(`\n== ${codigo}`)
  if (!a) { console.log('  (no está en la capa)'); continue }
  for (const campo of ['uso_comp', 'uso_cond']) {
    const lectura = parsearListaCodigos(a[campo]).codigos
    const nuestra = campo === 'uso_comp' ? t?.compatibles : t?.condicionados
    console.log(`  ${campo} crudo : ${JSON.stringify(a[campo])}`)
    console.log(`  ${campo} parser: [${lectura}]`)
    console.log(`  ${campo} nuestra: [${nuestra ?? ''}]`)
    console.log(`  ${campo} residuo: ${JSON.stringify(residuo(a[campo]))} | raros: [${caracteresRaros(a[campo])}]`)
  }
}

console.log('\n=== 2. Residuos del parser en TODA la capa (texto que no se entendió) ===')
let conResiduo = 0
for (const [codigo, a] of porCodigo) {
  for (const campo of ['uso_comp', 'uso_cond']) {
    const sobra = residuo(a[campo])
    if (sobra) { conResiduo++; console.log(`${codigo} ${campo}: ${JSON.stringify(sobra)}`) }
  }
}
if (conResiduo === 0) console.log('(ninguno)')

console.log('\n=== 3. Polígonos sin código: tipo y subtipo ===')
const conteo = new Map()
for (const a of atributos) {
  if (limpiarTexto(a.codigo)) continue
  const clave = `${limpiarTexto(a.uso_ppal) ?? '(sin uso_ppal)'} | ${limpiarTexto(a.subtipo) ?? '(sin subtipo)'}`
  conteo.set(clave, (conteo.get(clave) ?? 0) + 1)
}
for (const [clave, n] of [...conteo].sort((x, y) => y[1] - x[1])) console.log(`${n}\t${clave}`)

console.log('\n=== 4. Muestra de zonas ZU-D ===')
const dotacionales = [...porCodigo].filter(([codigo]) => codigo.startsWith('ZU-D-')).slice(0, 3)
for (const [codigo, a] of dotacionales) {
  console.log(`${codigo}: uso_ppal=${JSON.stringify(a.uso_ppal)} subtipo=${JSON.stringify(a.subtipo)} sector=${JSON.stringify(a.sector)}`)
  console.log(`   uso_comp=${JSON.stringify(a.uso_comp)} uso_cond=${JSON.stringify(a.uso_cond)} cod_ep=${JSON.stringify(a.cod_ep)}`)
}