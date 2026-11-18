import assert from 'node:assert/strict'
import {
  codigosSinDefinir,
  erroresDeInstrumentos,
  instrumentoDeMunicipio,
  zonaPorCodigo
} from '../src/utils/normativa/index.js'

const itagui = instrumentoDeMunicipio('Itagui')
const z = (codigo) => zonaPorCodigo('Itagui', codigo)
const CODIGOS_R4 = Array.from({ length: 20 }, (_, i) => `ZU-R-${String(i + 4).padStart(2, '0')}`)
const ZONAS_R4 = CODIGOS_R4.map((c) => {
  assert.ok(z(c), `falta ${c}`)
  return z(c)
})

// 1. Tabla residencial urbana completa: ZU-R-01 a ZU-R-28, sin repetidas y sin errores de esquema
{
  for (let n = 1; n <= 28; n++) {
    const codigo = `ZU-R-${String(n).padStart(2, '0')}`
    assert.ok(z(codigo), `falta ${codigo}`)
  }
  const codigos = itagui.zonas.map((x) => x.codigo)
  assert.equal(new Set(codigos).size, codigos.length, 'hay zonas repetidas')
  assert.deepEqual(erroresDeInstrumentos(), [])
  console.log('ok  ZU-R-01..28 presentes, sin repetidas y sin errores de esquema')
}

// 2. Las 20 zonas ZU-R-04..23: fuente, delimitación y regla de prohibidos
{
  assert.equal(ZONAS_R4.length, 20)
  for (const zona of ZONAS_R4) {
    assert.equal(zona.areaActividad, 'residencial')
    assert.equal(zona.fuente.articulo, '181')
    assert.ok(zona.fuente.paginaPdf >= 131 && zona.fuente.paginaPdf <= 133, `página de ${zona.codigo}`)
    assert.match(zona.delimitacion, /^Sectores .+\.$/)
    assert.equal(zona.prohibidos, 'los demás usos no determinados')
    assert.equal(zona.fuente.verificacion, 'transcrito_de_imagen')
  }
  console.log('ok  20 zonas ZU-R-04..23 con artículo 181, página del PDF y regla de prohibidos')
}

// 3. Rarezas del texto fuente quedan documentadas, no corregidas
{
  assert.ok(!z('ZU-R-04').compatibles.includes('R-M1'))
  assert.ok(z('ZU-R-04').observaciones.length === 1)
  assert.ok(z('ZU-R-15').compatibles.includes('R-M2') && z('ZU-R-15').condicionados.includes('R-M2'))
  assert.equal(z('ZU-R-15').marcas['R-M2'], '*')
  assert.ok(z('ZU-R-15').observaciones[0].includes('contradicción'))
  assert.equal(z('ZU-R-08').marcas['R-M2'], '*')
  assert.ok(z('ZU-R-05').condicionados.includes('S-22') && z('ZU-R-05').condicionados.includes('I-5'))
  console.log('ok  rarezas del texto (R-M1 ausente, R-M2 doble, RM-2*, S-22* I-5) documentadas')
}

// 4. ZU-R-16 y ZU-R-17: una sola celda de usos, cuatro marcas con su nota
{
  const a = z('ZU-R-16')
  const b = z('ZU-R-17')
  assert.deepEqual(a.compatibles, b.compatibles)
  assert.deepEqual(a.condicionados, b.condicionados)
  assert.deepEqual(a.marcas, b.marcas)
  assert.equal(b.marcas['S-17'], '*')
  assert.equal(b.marcas['C-11'], '**')
  assert.equal(b.marcas['D-7'], '***')
  assert.equal(b.marcas['D-6'], '****')
  assert.equal(b.notasMarcas['*'].restoDelPoligono, 'prohibido')
  assert.match(b.notasMarcas['***'].texto, /Automóviles Itagüí S\.A\.S\./)
  assert.deepEqual(b.notasMarcas['***'].soloAplicaA, ['ZU-R-17'])
  assert.deepEqual(a.notasMarcas['***'].soloAplicaA, ['ZU-R-17'])
  assert.match(b.notasMarcas['****'].texto, /cárceles/)
  console.log('ok  ZU-R-16/17: celda compartida y marcas *, **, ***, **** con su nota')
}

// 5. Reglas de las notas: "en el resto se prohíbe" solo donde el texto lo dice
{
  assert.equal(z('ZU-R-07').notasMarcas['*'].restoDelPoligono, 'prohibido')
  assert.equal(z('ZU-R-12').notasMarcas['*'].restoDelPoligono, 'prohibido')
  assert.equal(z('ZU-R-14').notasMarcas['*'].restoDelPoligono, 'prohibido')
  assert.equal(z('ZU-R-15').notasMarcas['*'].restoDelPoligono, 'prohibido')
  assert.equal(z('ZU-R-05').notasMarcas['*'].restoDelPoligono, null)
  assert.equal(z('ZU-R-08').notasMarcas['*'].restoDelPoligono, null)
  assert.equal(z('ZU-R-21').notasMarcas['*'].restoDelPoligono, null)
  assert.equal(z('ZU-R-23').notasMarcas['*'].restoDelPoligono, null)
  assert.deepEqual(Object.keys(z('ZU-R-12').marcas).sort(), ['C-2', 'S-6'])
  assert.deepEqual(Object.keys(z('ZU-R-21').marcas).sort(), ['C-11', 'C-12', 'C-13', 'S-17', 'S-18'])
  console.log('ok  notas: solo se declara "resto prohibido" cuando el acuerdo lo dice')
}

// 6. Todas las marcas de las zonas residenciales tienen su nota y no quedan notas pendientes
{
  for (const zona of itagui.zonas.filter((x) => x.codigo.startsWith('ZU-R-'))) {
    for (const simbolo of new Set(Object.values(zona.marcas))) {
      assert.ok(zona.notasMarcas[simbolo], `${zona.codigo}: falta la nota ${simbolo}`)
    }
  }
  assert.deepEqual(itagui.notasTablaPendientes, [])
  console.log('ok  todas las marcas residenciales tienen nota (lista de pendientes vacía)')
}

// 7. Los códigos de tipología que citan las zonas ZU-R-04..23 están definidos
{
  const sinDefinir = new Set(codigosSinDefinir('Itagui'))
  for (const zona of ZONAS_R4) {
    for (const codigo of [...zona.compatibles, ...zona.condicionados]) {
      assert.ok(!sinDefinir.has(codigo), `${zona.codigo} cita ${codigo}, que no tiene definición`)
    }
  }
  console.log('ok  todas las tipologías citadas por las zonas ZU-R-04..23 tienen definición')
}

// 8. Inmutabilidad
{
  assert.ok(Object.isFrozen(ZONAS_R4[0]))
  assert.ok(Object.isFrozen(ZONAS_R4[0].compatibles))
  assert.throws(() => {
    ZONAS_R4[0].codigo = 'otro'
  }, TypeError)
  console.log('ok  datos inmutables')
}

console.log('\nTodo correcto.')