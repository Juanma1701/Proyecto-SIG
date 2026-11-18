import assert from 'node:assert/strict'
import { erroresDeInstrumentos, instrumentoDeMunicipio, zonaPorCodigo } from '../src/utils/normativa/index.js'

const itagui = instrumentoDeMunicipio('Itagui')
const zona = (codigo) => zonaPorCodigo('Itagui', codigo)

// 1. Estructura válida y zonas cargadas
assert.deepEqual(erroresDeInstrumentos(), [])
const nuevas = [
  'ZU-C-01', 'ZU-C-02', 'ZU-C-03', 'ZU-C-04', 'ZU-R-24', 'ZU-R-25', 'ZU-R-26', 'ZU-R-27', 'ZU-R-28', 'ZE-R-01', 'ZE-R-02',
  'ZU-R-04', 'ZU-R-23', 'ZU-AM-03', 'ZU-AM-05', 'ZU-AM-28'
]
for (const c of nuevas) assert.ok(zona(c), c)
assert.equal(itagui.zonas.length, 62)
console.log('ok  62 zonas cargadas: actividad múltiple, residenciales, expansión y comerciales')

// 2. Cada asterisco tiene su nota con texto y página
for (const z of itagui.zonas) {
  for (const simbolo of new Set(Object.values(z.marcas))) {
    const n = z.notasMarcas[simbolo]
    assert.ok(n?.texto && Number.isInteger(n.paginaPdf), `${z.codigo} ${simbolo}`)
  }
}
assert.match(zona('ZU-R-01').notasMarcas['*'].texto, /calle 87/i)
assert.match(zona('ZU-R-03').notasMarcas['*'].texto, /carrera 50/i)
console.log('ok  todos los asteriscos tienen nota (incluidas las de ZU-R-01 y ZU-R-03)')

// 3. Reglas de licorera (C-2) y servicios personales (S-6) leídas en las notas
const c01 = zona('ZU-C-01')
assert.ok(c01.condicionados.includes('C-2') && c01.marcas['C-2'] === undefined)
const c03 = zona('ZU-C-03')
assert.equal(c03.marcas['C-2'], '**')
assert.match(c03.notasMarcas['**'].texto, /72, 77 y 80/)
assert.equal(c03.notasMarcas['**'].restoDelPoligono, 'prohibido')
const r25 = zona('ZU-R-25').notasMarcas['*']
assert.equal(r25.condiciones['C-2'].retiroAOtraDeLaMismaTipologiaM, 100)
assert.equal(r25.condiciones['S-6'].areaMinimaM2, 30)
assert.equal(zona('ZE-R-01').notasMarcas['*'].restoDelPoligono, null)
assert.match(zona('ZE-R-01').notasMarcas['*'].texto, /comerciales/)
console.log('ok  notas de C-2 y S-6: calles 72/77/80, retiro de 100 m y área mínima de 30 m²')

// 4. Calidad: un código repetido entre compatibles y condicionados solo se admite si es una
// contradicción conocida del texto del acuerdo y la zona la documenta en `observaciones`
const REPETIDOS_CONOCIDOS = {
  'ZU-R-15': ['R-M2'],
  'ZU-AM-03': ['C-9'],
  'ZU-AM-11': ['C-9'],
  'ZU-AM-13': ['C-9'],
  'ZU-AM-18': ['C-3'],
  'ZU-AM-26': ['S-24'],
  'ZU-AM-27': ['S-24'],
  'ZU-AM-28': ['S-24']
}
for (const z of itagui.zonas) {
  const repetidos = z.compatibles.filter((c) => z.condicionados.includes(c))
  assert.deepEqual(repetidos, REPETIDOS_CONOCIDOS[z.codigo] ?? [], `${z.codigo} repite ${repetidos.join(', ')}`)
  if (repetidos.length > 0) assert.ok(z.observaciones?.length > 0, `${z.codigo}: repetido sin observación`)
}
console.log('ok  repetidos entre compatibles y condicionados: solo los 8 casos conocidos, todos documentados')

// 5. Las notas de la tabla residencial ya están todas emparejadas con su fila
assert.deepEqual(itagui.notasTablaPendientes, [])
console.log('ok  sin notas de la tabla residencial pendientes de emparejar')

// 6. Sigue parcial (faltan ZU-D, arts. 185-187 y suelo rural)
assert.equal(itagui.cobertura, 'parcial')
console.log('ok  la cobertura de Itagüí sigue marcada como parcial')

console.log('\nTodo correcto.')