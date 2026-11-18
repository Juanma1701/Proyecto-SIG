import assert from 'node:assert/strict'
import { erroresDeInstrumentos, instrumentoDeMunicipio, zonaPorCodigo } from '../src/utils/normativa/index.js'
import { VERIFICACION } from '../src/utils/normativa/esquema.js'

const itagui = instrumentoDeMunicipio('Itagui')

function prueba(nombre, fn) {
  fn()
  console.log(`ok  ${nombre}`)
}

const CODIGOS_AM = ['ZU-AM-03', ...Array.from({ length: 24 }, (_, i) => `ZU-AM-${String(i + 5).padStart(2, '0')}`)]
const zona = (codigo) => {
  const z = zonaPorCodigo('Itagui', codigo)
  assert.ok(z, `falta ${codigo}`)
  return z
}
const ZONAS_AM = CODIGOS_AM.map(zona)

prueba('25 zonas ZU-AM-03 y ZU-AM-05 a ZU-AM-28 más las 3 de la primera tanda', () => {
  assert.equal(ZONAS_AM.length, 25)
  for (const c of ['ZU-AM-01', 'ZU-AM-02', 'ZU-AM-04']) assert.ok(zona(c), c)
  assert.equal(itagui.zonas.filter((z) => z.codigo.startsWith('ZU-AM-')).length, 28)
})

prueba('el validador del esquema no encuentra errores', () => {
  assert.deepEqual(erroresDeInstrumentos(), [])
})

prueba('cada símbolo usado tiene su nota y cada nota se usa', () => {
  for (const z of ZONAS_AM) {
    const usados = [...new Set(Object.values(z.marcas))].sort()
    const notas = Object.keys(z.notasMarcas).sort()
    assert.deepEqual(usados, notas, z.codigo)
  }
})

prueba('sin códigos repetidos dentro de una misma lista', () => {
  for (const z of ZONAS_AM) {
    for (const lista of [z.compatibles, z.condicionados]) {
      assert.equal(new Set(lista).size, lista.length, z.codigo)
    }
  }
})

prueba('códigos a la vez compatibles y condicionados: solo los conocidos y documentados', () => {
  const esperados = {
    'ZU-AM-03': ['C-9'],
    'ZU-AM-11': ['C-9'],
    'ZU-AM-13': ['C-9'],
    'ZU-AM-18': ['C-3'],
    'ZU-AM-26': ['S-24'],
    'ZU-AM-27': ['S-24'],
    'ZU-AM-28': ['S-24']
  }
  for (const z of ZONAS_AM) {
    const repetidos = z.compatibles.filter((c) => z.condicionados.includes(c))
    assert.deepEqual(repetidos, esperados[z.codigo] ?? [], z.codigo)
    if (repetidos.length > 0) assert.ok(z.observaciones.length > 0, `${z.codigo} sin observación`)
  }
})

prueba('fuente: art. 182, páginas 136-141, transcrito de imagen; prohibidos "los demás"', () => {
  for (const z of ZONAS_AM) {
    assert.equal(z.fuente.articulo, '182')
    assert.ok(z.fuente.paginaPdf >= 136 && z.fuente.paginaPdf <= 141, z.codigo)
    assert.equal(z.fuente.verificacion, VERIFICACION.TRANSCRITO_DE_IMAGEN)
    assert.equal(z.prohibidos, 'los demás usos no determinados')
    for (const n of Object.values(z.notasMarcas)) assert.ok(n.paginaPdf === 141 || n.paginaPdf === 142, z.codigo)
  }
})

prueba('casos puntuales: ZU-AM-03, 08, 19, 24, 25', () => {
  const z3 = zona('ZU-AM-03')
  assert.equal(z3.marcas['S-13'], '**')
  assert.equal(z3.marcas['S-6'], '***')
  assert.match(z3.notasMarcas['***'].texto, /COMPLEX/)
  assert.ok(!zona('ZU-AM-08').compatibles.includes('R-M3'))
  const z19 = zona('ZU-AM-19')
  assert.ok([...z19.compatibles, ...z19.condicionados].every((c) => !c.startsWith('R-')))
  const z24 = zona('ZU-AM-24')
  assert.ok(!z24.compatibles.includes('S-9') && z24.compatibles.includes('S-15'))
  assert.deepEqual(zona('ZU-AM-25').compatibles.filter((c) => c.startsWith('R-')), ['R-M3'])
})

prueba('restoDelPoligono "prohibido" solo donde la nota lo dice', () => {
  assert.equal(zona('ZU-AM-06').notasMarcas['**'].restoDelPoligono, 'prohibido')
  assert.equal(zona('ZU-AM-14').notasMarcas['*'].restoDelPoligono, 'prohibido')
  assert.equal(zona('ZU-AM-10').notasMarcas['*'].restoDelPoligono, null)
  assert.equal(zona('ZU-AM-12').notasMarcas['**'].restoDelPoligono, null)
})

prueba('separación de 100 m: marcas en ZU-AM-17, 20, 26, 27 y 28', () => {
  for (const codigo of ['ZU-AM-17', 'ZU-AM-20', 'ZU-AM-26', 'ZU-AM-27', 'ZU-AM-28']) {
    assert.ok(Object.values(zona(codigo).notasMarcas).some((n) => /100 m/.test(n.texto)), codigo)
  }
})

prueba('disposiciones del art. 182 con fuente', () => {
  const d = itagui.disposicionesGenerales.filter((x) => x.fuente.articulo.startsWith('182 (parágrafo'))
  assert.equal(d.length, 2)
  assert.deepEqual(d.map((x) => x.fuente.paginaPdf), [142, 143])
})

prueba('los datos son inmutables', () => {
  assert.ok(Object.isFrozen(zona('ZU-AM-03')))
  assert.ok(Object.isFrozen(zona('ZU-AM-03').notasMarcas))
})

console.log('Todo correcto.')