import assert from 'node:assert/strict'
import { crearBloque, crearFuente, crearNormalizado, crearRegistro } from '../src/utils/territorial/modelo.js'
import { resumirTerritorio } from '../src/utils/territorial/resumen.js'

const fuente = (servicio, capaId, origen = 'arcgis_amva') => crearFuente({ origen, servicio, capaId })
let contador = 0
const bloque = (tipo, estado, registros, extra = {}) => {
  const { origen = 'arcgis_amva', ...resto } = extra
  return crearBloque({
    id: `${tipo}-${contador++}`,
    tipo,
    estado,
    fuente: fuente('S', 1, origen),
    registros,
    ...resto
  })
}
const clasif = (clase, etiqueta) =>
  crearRegistro({
    atributosOriginales: { SIMBOLOGIA: etiqueta },
    normalizado: crearNormalizado({ clase, etiquetaOriginal: etiqueta })
  })

// Caso tipo Medellín: clasificación del AMVA y de Supabase que coinciden, tratamiento con parámetros, sin riesgo
const medellin = {
  bloques: [
    bloque('clasificacion_suelo', 'ok', [clasif('urbano', 'URBANO')]),
    bloque('clasificacion_suelo', 'ok', [clasif('urbano', 'URBANO')], { origen: 'supabase' }),
    bloque('tratamiento', 'ok', [
      crearRegistro({ atributosOriginales: { TRATAMIENTO: 'Consolidación Nivel 1', DENSTOTAL: 400, ICTOTAL: 4, ALTURANORMATIVA: 'N/A' } })
    ]),
    bloque('uso_actual', 'ok', [
      crearRegistro({ atributosOriginales: { USO_ACTUAL: 'Comercio' }, normalizado: crearNormalizado({ etiquetaOriginal: 'Comercio' }) })
    ], { titulo: 'Usos Suelo Metropolitano' }),
    bloque('riesgo', 'sin_resultados', [])
  ]
}
let r = resumirTerritorio(medellin)
assert.equal(r.suelo.items.length, 2, 'AMVA y Supabase se muestran por separado')
assert.deepEqual(r.suelo.items.map((i) => i.fuente).sort(), ['AMVA', 'Copia en Supabase'])
assert.equal(r.suelo.discrepa, false)
assert.equal(r.tratamientos[0].nombre, 'Consolidación Nivel 1')
assert.deepEqual(r.tratamientos[0].datos.map((d) => d.etiqueta), ['Densidad total', 'Índice de construcción total'])
assert.equal(r.usoActual[0].texto, 'Comercio')
assert.equal(r.alertas.sinAlertas, true)
assert.equal(r.alertas.incompleto, false)
assert.equal(r.vacios.length, 1)
console.log('ok  ficha tipo Medellín: suelo en dos fuentes, tratamiento sin "N/A", uso actual, sin alertas')

// Dos bloques de la MISMA fuente con el mismo valor no se repiten
r = resumirTerritorio({
  bloques: [
    bloque('clasificacion_suelo', 'ok', [clasif('urbano', 'URBANO')]),
    bloque('clasificacion_suelo', 'ok', [clasif('urbano', 'URBANO')])
  ]
})
assert.equal(r.suelo.items.length, 1)
console.log('ok  un mismo dato de la misma fuente no se repite')

// Discrepancia entre fuentes
r = resumirTerritorio({
  bloques: [
    bloque('clasificacion_suelo', 'ok', [clasif('urbano', 'URBANO')]),
    bloque('clasificacion_suelo', 'ok', [clasif('expansion', 'EXPANSION')], { origen: 'supabase' })
  ]
})
assert.equal(r.suelo.discrepa, true)
assert.deepEqual(r.suelo.items.map((i) => i.texto).sort(), ['Suelo de expansión', 'Suelo urbano'])
console.log('ok  discrepancia de clase entre fuentes se marca')

// Itagüí: uso principal / condicionado / prohibido, tal cual
r = resumirTerritorio({
  bloques: [
    bloque('uso_normativo_pot', 'capa_no_verificada', [
      crearRegistro({ atributosOriginales: { USO_PPAL: 'Comercial', USO_COND: 'Servicios - Residencial', USO_PROH: 'Industria liviana', CONDICION: ' ' } })
    ])
  ]
})
assert.equal(r.usoPot.hayBloque, true)
assert.deepEqual(r.usoPot.items[0].lineas.map((l) => l.etiqueta), ['Uso principal', 'Uso condicionado', 'Uso prohibido'])
console.log('ok  Itagüí: uso principal/condicionado/prohibido, condición vacía omitida')

// Placeholder de Envigado no se presenta como dato
r = resumirTerritorio({
  bloques: [
    bloque('uso_normativo_pot', 'capa_no_verificada', [crearRegistro({ atributosOriginales: { USOS_PPAL: 'ZONA URBANA' } })], { advertencias: ['PLACEHOLDER_ZONA_URBANA'] })
  ]
})
assert.equal(r.usoPot.items.length, 0)
assert.equal(r.usoPot.hayBloque, true)
console.log('ok  el marcador "ZONA URBANA" no se muestra como uso')

// Alertas y errores
r = resumirTerritorio({
  bloques: [
    bloque('riesgo', 'ok', [crearRegistro({ atributosOriginales: { TIPO: 'Inundación' } })], { titulo: 'Riesgos' }),
    bloque('proteccion', 'error_servicio', [], { error: { codigo: 500, mensaje: 'fallo' } })
  ]
})
assert.equal(r.alertas.sinAlertas, false)
assert.equal(r.alertas.items[0].detalle, 'Inundación')
assert.equal(r.alertas.incompleto, true)
assert.equal(r.errores.length, 1)
console.log('ok  alertas de riesgo y aviso de resultado incompleto cuando una fuente falla')

console.log('\nTodo correcto.')