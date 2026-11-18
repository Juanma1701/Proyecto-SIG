import assert from 'node:assert/strict'
import { ACTIVIDADES, CONFIANZA_MAPEO, actividadPorId, validarCatalogo } from '../src/utils/normativa/actividades.js'
import { RESULTADOS, evaluarActividad } from '../src/utils/normativa/evaluar.js'
import { congelar } from '../src/utils/normativa/esquema.js'

const FUENTE = { articulo: '175', paginaPdf: 122, verificacion: 'transcrito_de_imagen' }
const tip = (codigo, nombre, datos = {}) => ({
  codigo, uso: 'comercial', nombre, areaMinimaM2: null, areaMinimaLoteM2: null,
  variantes: [], retiros: [], restricciones: [], fuente: FUENTE, ...datos
})

// Instrumento de PRUEBA (no son los datos reales)
const instrumento = congelar({
  municipioSlug: 'Itagui',
  nombre: 'Norma de prueba',
  fechaAdopcion: '2023-12-05',
  cobertura: 'parcial',
  vigencia: { estado: 'vigente_segun_fuente_municipal', fuente: 'prueba' },
  tipologias: [
    tip('C-1', 'Comercio básico', { areaMinimaM2: 10 }),
    tip('C-2', 'Licoreras y estanquillos', {
      areaMinimaM2: 20,
      retiros: [{ destino: 'colegios', metros: 40, medidaEntre: 'accesos' }],
      restricciones: ['No se puede vender licor con consumo en el establecimiento.']
    }),
    tip('C-11', 'Supermercados', { areaMinimaM2: 500 }),
    tip('C-14', 'Comercio de alto riesgo', { restricciones: ['No se permite.'] }),
    tip('S-7', 'Servicios personales generales', { areaMinimaM2: 10, variantes: [{ descripcion: 'restaurantes y cafeterías', areaMinimaM2: 30 }] })
  ],
  zonas: [
    { codigo: 'ZU-C-01', delimitacion: 'Centro', compatibles: ['C-1', 'C-11', 'S-7'], condicionados: ['C-2'], marcas: {}, notasMarcas: {}, prohibidos: 'los demás usos no determinados', fuente: { articulo: '183', paginaPdf: 143, verificacion: 'transcrito_de_imagen' } },
    {
      codigo: 'ZU-C-03', delimitacion: 'Santa María II', compatibles: ['C-1'], condicionados: ['C-2'], marcas: { 'C-2': '**' },
      notasMarcas: { '**': { texto: 'Sobre las calles 72, 77 y 80 el uso es restringido; en el resto del polígono se prohíbe.', paginaPdf: 144, restoDelPoligono: 'prohibido' } },
      prohibidos: 'los demás usos no determinados', fuente: { articulo: '183', paginaPdf: 143, verificacion: 'transcrito_de_imagen' }
    },
    {
      codigo: 'ZU-R-25', delimitacion: 'El Porvenir', compatibles: ['C-1'], condicionados: ['C-2'], marcas: { 'C-2': '*' },
      notasMarcas: { '*': { texto: 'Sobre la vía principal, C-2 con retiro de 100 m a otra C-2.', paginaPdf: 135, restoDelPoligono: 'prohibido', condiciones: { 'C-2': { retiroAOtraDeLaMismaTipologiaM: 100 } } } },
      prohibidos: 'los demás usos no determinados', fuente: { articulo: '181', paginaPdf: 134, verificacion: 'transcrito_de_imagen' }
    },
    { codigo: 'ZU-AM-02', delimitacion: 'Carrera 70', compatibles: ['C-1'], condicionados: [], marcas: {}, notasMarcas: {}, prohibidos: 'los demás usos no determinados', fuente: { articulo: '182', paginaPdf: 136, verificacion: 'transcrito_de_imagen' } }
  ],
  estandaresRuido: [
    { sector: 'C. Ruido intermedio restringido', subsector: 'usos comerciales', dbDia: 70, dbNoche: 60, tipologias: [], actividadesNombradas: ['gimnasios', 'restaurantes', 'discotecas', 'licoreras'], fuente: { articulo: '179', paginaPdf: 129, verificacion: 'transcrito_de_imagen' } }
  ]
})

const evaluar = (zonaCodigo, actividadId, extra = {}) =>
  evaluarActividad({ instrumento, municipioSlug: 'Itagui', zonaCodigo, actividadId, ...extra })

// 1. Catálogo válido; solo hay mapeos explícitos cuando la norma nombra la actividad
assert.deepEqual(validarCatalogo(), [])
assert.equal(actividadPorId('licorera').mapeos.Itagui.tipologia, 'C-2')
assert.equal(actividadPorId('minimercado').mapeos.Itagui.confianza, CONFIANZA_MAPEO.INFERIDA)
assert.equal(actividadPorId('nada'), null)
assert.ok(ACTIVIDADES.length >= 8)
console.log('ok  catálogo de actividades válido; el minimercado queda como mapeo inferido')

// 2. Licorera en zona que la lista como condicionada
let r = evaluar('ZU-C-01', 'licorera')
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.ok(r.requisitosDeTipologia.some((l) => /20 m²/.test(l)))
assert.ok(r.requisitosDeTipologia.some((l) => /40 m/.test(l)))
assert.ok(r.referencias.some((x) => x.paginaPdf === 122) && r.referencias.some((x) => x.paginaPdf === 143))
assert.equal(r.requiereVerificarUbicacion, false)
console.log('ok  licorera en ZU-C-01: compatible bajo condiciones, con requisitos y páginas citadas')

// 3. Licorera con asterisco: solo en ciertas vías
r = evaluar('ZU-C-03', 'licorera')
assert.equal(r.resultado, RESULTADOS.CONDICIONADA)
assert.ok(r.condiciones.some((c) => /72, 77 y 80/.test(c)))
assert.equal(r.requiereVerificarUbicacion, true)
r = evaluar('ZU-R-25', 'licorera')
assert.ok(r.condiciones.some((c) => /100 m/.test(c)))
console.log('ok  notas de asterisco: vías indicadas y retiros adicionales en las condiciones')

// 4. Zona que no lista la tipología: incompatible según la tabla
r = evaluar('ZU-AM-02', 'licorera')
assert.equal(r.resultado, RESULTADOS.INCOMPATIBLE)
assert.match(r.razones[0], /no lista la tipología C-2/)
assert.match(r.razones[0], /no determinados/)
console.log('ok  tipología ausente de la tabla: incompatible, con la razón')

// 5. Restaurante: compatible, requisito de 30 m² y contexto de ruido
r = evaluar('ZU-C-01', 'restaurante')
assert.equal(r.resultado, RESULTADOS.COMPATIBLE)
assert.ok(r.requisitosDeTipologia.some((l) => /30 m²/.test(l)))
assert.equal(r.contexto[0].tema, 'ruido')
assert.match(r.contexto[0].texto, /70 dB/)
console.log('ok  restaurante: compatible, 30 m² y estándar de ruido como contexto')

// 6. Lo que la norma no nombra: información insuficiente (sin inferir)
r = evaluar('ZU-C-01', 'minimercado')
assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
assert.equal(r.datos.tipologia.sugerida, true)
r = evaluar('ZU-C-01', 'discoteca')
assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
assert.match(r.contexto[0].texto, /70 dB/)
assert.equal(evaluar('ZU-C-01', 'farmacia').resultado, RESULTADOS.INSUFICIENTE)
console.log('ok  minimercado, discoteca y farmacia: información insuficiente; la discoteca muestra el ruido')

// 7. Casos sin datos
assert.equal(evaluar('ZU-X-99', 'licorera').resultado, RESULTADOS.INSUFICIENTE)
assert.equal(evaluar(undefined, 'licorera').resultado, RESULTADOS.INSUFICIENTE)
assert.equal(evaluarActividad({ instrumento: null, municipioSlug: 'Medellin', zonaCodigo: 'X', actividadId: 'licorera' }).resultado, RESULTADOS.INSUFICIENTE)
assert.equal(evaluar('ZU-C-01', 'no_existe').resultado, RESULTADOS.INSUFICIENTE)
console.log('ok  zona desconocida, sin norma y actividad desconocida: información insuficiente')

// 8. Tipología marcada como no permitida
const catalogo = [{ id: 'riesgo', nombre: 'Comercio de alto riesgo', terminosNorma: [], mapeos: { Itagui: { tipologia: 'C-14', confianza: 'explicita', fuente: { articulo: '175', paginaPdf: 123 } } } }]
r = evaluar('ZU-C-01', 'riesgo', { catalogo })
assert.equal(r.resultado, RESULTADOS.INCOMPATIBLE)
console.log('ok  tipología "no se permite": incompatible')

// 9. Siempre aviso y advertencias; nunca un campo de autorización; no muta la entrada
for (const [zona, act] of [['ZU-C-01', 'licorera'], ['ZU-AM-02', 'gimnasio'], ['ZU-C-01', 'restaurante']]) {
  const x = evaluar(zona, act)
  assert.match(x.aviso, /No es un concepto de uso del suelo/)
  assert.ok(x.advertencias.some((a) => /parcial/.test(a)))
  for (const clave of Object.keys(x)) assert.ok(!/permitid|autoriz|prohibid/i.test(clave), clave)
}
assert.ok(Object.isFrozen(instrumento))
console.log('ok  siempre con aviso y advertencias, sin campo de autorización, sin mutar los datos')

console.log('\nTodo correcto.')