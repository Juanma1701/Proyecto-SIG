import assert from 'node:assert/strict'
import { dentroDelBuffer, distanciaM } from '../src/utils/predio.js'

const centro = { lat: 6.17, lng: -75.61 }

// 1. Distancia: un grado de latitud mide unos 111,2 km
const grado = distanciaM({ lat: 6, lng: -75 }, { lat: 7, lng: -75 })
assert.ok(Math.abs(grado - 111195) < 50, `un grado de latitud: ${grado}`)
assert.equal(distanciaM(centro, centro), 0)
assert.ok(Math.abs(distanciaM(centro, { lat: 6.17, lng: -75.6 }) - 1105) < 15)
console.log('ok  distancia: un grado de latitud y 0,01° de longitud a 6° de latitud')

// 2. Dentro y fuera del buffer
let r = dentroDelBuffer(centro, 2, { lat: 6.17, lng: -75.6 })
assert.equal(r.dentro, true)
r = dentroDelBuffer(centro, 2, { lat: 6.17, lng: -75.58 })
assert.equal(r.dentro, false)
assert.ok(r.distanciaM > 3000 && r.distanciaM < 3600)
assert.equal(dentroDelBuffer(centro, '2', { lat: 6.17, lng: -75.6 }).dentro, true)
assert.equal(dentroDelBuffer(centro, 0.5, { lat: 6.17, lng: -75.6 }).dentro, false)
console.log('ok  dentro y fuera del buffer (radio en km, también como texto)')

// 3. Sin buffer o con datos inválidos no se concluye nada
for (const [c, km, p] of [
  [null, 2, centro],
  [centro, null, centro],
  [centro, 0, centro],
  [centro, 'abc', centro],
  [centro, 2, null],
  [centro, 2, { lat: NaN, lng: 1 }]
]) {
  assert.deepEqual(dentroDelBuffer(c, km, p), { dentro: null, distanciaM: null })
}
console.log('ok  sin buffer, radio inválido o punto inválido: dentro es null')

console.log('\nTodo correcto.')