import assert from 'node:assert/strict'
import { zonaDesdeAtributos } from '../src/utils/normativa/zonaOficial.js'
import { aplicarCorreccionesCapa, CORRECCIONES_CAPA_ITAGUI } from '../src/utils/normativa/correccionesCapaItagui.js'
import { consultarZonaItagui } from '../src/utils/normativa/consultaZonaItagui.js'

const PROH = 'Todas las no mencionadas en esta ficha'
const ZU_R_01 = {
  codigo: 'ZU-R-01', uso_ppal: 'Áreas de actividad residencial', uso_proh: PROH,
  uso_comp: 'R-U, R-B, R-T, R-M1, R-M2, R-M3, C-1, S-7, S-8, S-15, D-5, D-8, D-10,',
  uso_cond: 'C-3, C-2*, I-5, S-4, S-5, S-6*, S-11, S-16, S-19, D-1, D-2, D-3,'
}
const ZE_R_02 = {
  codigo: 'ZE-R-02', uso_ppal: 'Áreas de actividad residencial', uso_proh: PROH,
  uso_comp: 'R-U, R-B, R-T, R-M1, RM2, C-1, S-7, S-8, S-15, D-5, D-10,',
  uso_cond: 'C-2*, C-3, S-5, S-9, S-11, S-16, S-19, I-5, D-1, D-2, D-3,  D-7,'
}
const ZU_C_02 = {
  codigo: 'ZU-C-02', uso_ppal: 'Áreas de actividad comercial', uso_proh: PROH,
  uso_comp: 'R-U, C-1, S-7,', uso_cond: 'C-2, S-13*,'
}

// 1. ZU-R-01 recibe S-14 y S-22 con su aviso
let z = aplicarCorreccionesCapa(zonaDesdeAtributos(ZU_R_01))
assert.ok(z.condicionados.includes('S-14') && z.condicionados.includes('S-22'))
assert.equal(z.compatibles.includes('S-14'), false)
assert.ok(z.avisosDeLectura.some((a) => /S-14, S-22/.test(a) && /artículo 181, p\. 131/.test(a)))
assert.deepEqual(z.marcas, { 'C-2': '*', 'S-6': '*' })
console.log('ok  ZU-R-01: se agregan S-14 y S-22 condicionados, con artículo, página y aviso')

// 2. ZE-R-02 recibe D-8
z = aplicarCorreccionesCapa(zonaDesdeAtributos(ZE_R_02))
assert.ok(z.compatibles.includes('D-8'))
assert.ok(z.avisosDeLectura.some((a) => /D-8/.test(a) && /p\. 135/.test(a)))
console.log('ok  ZE-R-02: se agrega D-8 compatible')

// 3. Otras zonas no se tocan; sin código tampoco
const intacta = zonaDesdeAtributos(ZU_C_02)
assert.equal(aplicarCorreccionesCapa(intacta), intacta)
const sinCodigo = zonaDesdeAtributos({ codigo: ' ', uso_ppal: 'Espacio público' })
assert.equal(aplicarCorreccionesCapa(sinCodigo), sinCodigo)
console.log('ok  otras zonas y espacio público no cambian')

// 4. Si la capa ya los trae, no se duplica ni se avisa
const corregida = zonaDesdeAtributos({
  ...ZU_R_01,
  uso_cond: 'C-3, C-2*, I-5, S-4, S-5, S-6*, S-11, S-14, S-16, S-19, S-22, D-1, D-2, D-3,'
})
const sinCambios = aplicarCorreccionesCapa(corregida)
assert.equal(sinCambios, corregida)
assert.equal(sinCambios.condicionados.filter((c) => c === 'S-14').length, 1)
console.log('ok  si la capa se corrige, no hay duplicados ni aviso')

// 5. No muta la zona original
const original = zonaDesdeAtributos(ZU_R_01)
const antes = [...original.condicionados]
aplicarCorreccionesCapa(original)
assert.deepEqual(original.condicionados, antes)
console.log('ok  la zona original no se modifica')

// 6. Integrado en la consulta de punto
const respuesta = (cuerpo) => async () => ({ ok: true, status: 200, json: async () => cuerpo })
const r = await consultarZonaItagui({ lat: 6.17, lon: -75.61 }, { fetchFn: respuesta({ features: [{ attributes: ZU_R_01 }] }) })
assert.equal(r.estado, 'ok')
assert.ok(r.zona.condicionados.includes('S-22'))
assert.ok(r.zona.avisosDeLectura.length >= 1)
console.log('ok  consultarZonaItagui devuelve la zona ya corregida')

// 7. La lista de correcciones tiene artículo y página
for (const c of CORRECCIONES_CAPA_ITAGUI) {
  assert.ok(c.zona && c.fuente.articulo && Number.isInteger(c.fuente.paginaPdf))
  assert.ok((c.agregarCompatibles?.length ?? 0) + (c.agregarCondicionados?.length ?? 0) > 0)
}
console.log('ok  cada corrección trae zona, artículo y página')

console.log('\nTodo correcto.')