// Pruebas offline (sin red) de Itagüí: lectura según la tipología elegida, regresión y estados del pin.
import assert from 'node:assert/strict'
import { instrumentoDeMunicipio } from '../src/utils/normativa/index.js'
import { TIPOLOGIAS_CANDIDATAS } from '../src/utils/normativa/actividades.js'
import { RESULTADOS, evaluarActividad, evaluarTipologiaElegida } from '../src/utils/normativa/evaluar.js'
import { valorarPunto } from '../src/utils/normativa/evaluarEnPunto.js'
import { describirTarjeta } from '../src/utils/normativa/presentacion.js'

const ok = (m) => console.log(`ok ${m}`)
const inst = instrumentoDeMunicipio('Itagui')
const municipio = { estado: 'resuelto', slug: 'itagui', nombre: 'Itagüí' }

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o)
    Object.values(o).forEach(deepFreeze)
  }
  return o
}
const zonaReal = (codigo) => {
  const z = inst.zonas.find((x) => x.codigo === codigo)
  assert.ok(z, `la zona ${codigo} no está en itagui.js`)
  return z
}
// Una zona como la entrega la capa oficial: sin `observaciones` de la transcripción.
const comoCapa = (zona) => {
  const { observaciones, ...resto } = zona
  void observaciones
  return deepFreeze({
    ...structuredClone(resto),
    avisosDeLectura: [],
    fuente: { origen: 'capa_oficial', url: 'https://ejemplo.test/capa', articulo: null, paginaPdf: null, verificacion: 'publicado_por_el_municipio' }
  })
}
const punto = (zona, actividadId, tipologiaElegida = null) =>
  valorarPunto({ municipio, zonaResultado: { estado: 'ok', zona }, actividadId, tipologiaElegida })

// 1. Candidatas
assert.deepEqual(TIPOLOGIAS_CANDIDATAS.Itagui.minimercado, ['C-1', 'C-3'])
assert.deepEqual(TIPOLOGIAS_CANDIDATAS.Itagui.gimnasio, ['S-4', 'S-5', 'S-6', 'D-1'])
ok('candidatas de Itagüí incluyen minimercado y gimnasio')

// 2. Gimnasio + ZU-AM-05 + S-5 con la tabla real
{
  const z = zonaReal('ZU-AM-05')
  assert.ok(z.compatibles.includes('S-5') && !z.condicionados.includes('S-5'), 'S-5 debe estar solo en compatibles de ZU-AM-05')
  const r = punto(comoCapa(z), 'gimnasio', 'S-5')
  assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
  assert.equal(r.lecturaElegida.estadoEnZona, 'compatible')
  assert.equal(r.lecturaElegida.marca, null)
  const t = describirTarjeta(r)
  assert.equal(t.clase, 'insuficiente')
  assert.match(t.lectura.titulo, /elegiste.*no concluye/)
  assert.match(t.lectura.texto, /compatible/)
  ok('gimnasio + ZU-AM-05 + S-5: insuficiente con lectura compatible')
}

// 3. Tipología no candidata => null
{
  const z = comoCapa(zonaReal('ZU-AM-05'))
  assert.equal(punto(z, 'gimnasio', 'C-11').lecturaElegida, null)
  assert.equal(punto(z, 'gimnasio', 'ZZ-9').lecturaElegida, null)
  assert.equal(punto(z, 'licorera', 'C-1').lecturaElegida, null)
  ok('tipología no candidata => lecturaElegida null')
}

// 4. Asterisco en ZU-R-01 (C-2 y S-6 con nota de la calle 87)
{
  const z = comoCapa(zonaReal('ZU-R-01'))
  const c2 = evaluarTipologiaElegida({ instrumento: inst, zona: z, tipologiaCodigo: 'C-2' })
  assert.equal(c2.estadoEnZona, 'condicionada')
  assert.equal(c2.marca, '*')
  assert.match(c2.condiciones[0], /calle 87/)
  const r = punto(z, 'discoteca', 'S-6')
  assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
  assert.equal(r.lecturaElegida.marca, '*')
  const t = describirTarjeta(r)
  assert.match(t.lectura.verificarUbicacion, /verificar que el punto esté/)
  assert.match(t.lectura.condiciones[0], /calle 87/)
  ok('tipología con asterisco: marca, condiciones y aviso de ubicación')
}

// 5. Regresión de las 3 explícitas con zonas reales
{
  const casos = [
    ['licorera', 'C-2', 'ZU-R-01', RESULTADOS.CONDICIONADA, true],
    ['licorera', 'C-2', 'ZU-R-02', RESULTADOS.INCOMPATIBLE, false],
    ['restaurante', 'S-7', 'ZU-AM-05', RESULTADOS.COMPATIBLE, false],
    ['supermercado', 'C-11', 'ZU-AM-05', RESULTADOS.CONDICIONADA, false],
    ['supermercado', 'C-11', 'ZU-R-02', RESULTADOS.INCOMPATIBLE, false]
  ]
  for (const [id, cod, zonaCodigo, esperado, verificar] of casos) {
    const z = comoCapa(zonaReal(zonaCodigo))
    for (const eleccion of [null, 'C-1']) {
      const r = punto(z, id, eleccion)
      assert.equal(r.resultado, esperado, `${id} en ${zonaCodigo}`)
      assert.equal(r.datos.tipologia.codigo, cod)
      assert.equal(r.requiereVerificarUbicacion, verificar)
      assert.ok(!('hipotesis' in r), `${id} no debe traer hipótesis`)
      assert.equal(r.lecturaElegida, null)
    }
    const directo = evaluarActividad({ instrumento: inst, municipioSlug: 'Itagui', zona: z, actividadId: id })
    assert.equal(directo.resultado, esperado)
    assert.ok(!('hipotesis' in directo))
  }
  ok('licorera, restaurante y supermercado siguen concluyentes y sin cambios')
}

// 6. Las 5 inferidas nunca concluyen
{
  const z = comoCapa(zonaReal('ZU-AM-05'))
  for (const id of ['minimercado', 'discoteca', 'gimnasio', 'farmacia', 'tienda_tecnologia']) {
    const r = punto(z, id)
    assert.equal(r.resultado, RESULTADOS.INSUFICIENTE, `${id} no debe concluir`)
    assert.ok(r.hipotesis, `${id} debe traer lectura hipotética`)
    assert.equal(describirTarjeta(r).lectura.titulo, 'Lectura hipotética (no concluye)')
  }
  ok('las 5 actividades inferidas siguen en insuficiente con lectura hipotética')
}

// 7. Contradicción real: C-3 es compatible y condicionado en ZU-AM-18
{
  const z = comoCapa(zonaReal('ZU-AM-18'))
  assert.ok(z.compatibles.includes('C-3') && z.condicionados.includes('C-3'), 'ZU-AM-18 debe listar C-3 en ambas')
  const r = punto(z, 'tienda_tecnologia', 'C-3')
  assert.equal(r.resultado, RESULTADOS.INSUFICIENTE)
  assert.equal(r.lecturaElegida.estadoEnZona, 'contradictoria')
  assert.match(describirTarjeta(r).lectura.texto, /compatible y también como condicionada/)
  ok('contradicción compatible/condicionada visible en la lectura')
}

// 8. Observaciones de la transcripción y zona no transcrita
{
  const z = comoCapa(zonaReal('ZU-AM-18'))
  const t = describirTarjeta(punto(z, 'tienda_tecnologia', 'C-3'))
  assert.ok(t.advertencias.some((a) => /a la vez como compatible y como condicionado/.test(a)), 'falta la observación de ZU-AM-18')
  const explicita = describirTarjeta(punto(z, 'licorera'))
  assert.ok(explicita.advertencias.some((a) => /Nota de la transcripción de ZU-AM-18/.test(a)), 'falta la observación en una explícita')

  const noTranscrita = deepFreeze({
    codigo: 'ZU-XX-99', areaActividad: 'actividad múltiple', subtipo: null,
    compatibles: ['S-5'], condicionados: [], marcas: {}, notasMarcas: {},
    prohibidos: 'los demás usos no determinados', avisosDeLectura: [],
    fuente: { origen: 'capa_oficial', url: 'https://ejemplo.test/capa', articulo: null, paginaPdf: null, verificacion: 'publicado_por_el_municipio' }
  })
  const t2 = describirTarjeta(punto(noTranscrita, 'gimnasio', 'S-5'))
  assert.ok(t2.advertencias.some((a) => /no está en la transcripción/.test(a)), 'falta el aviso de zona no transcrita')
  ok('observaciones y zona no transcrita se muestran como advertencia')
}

// 9. Avisos de lectura de la capa visibles también con actividad inferida
{
  const z = deepFreeze({ ...structuredClone(comoCapa(zonaReal('ZU-AM-05'))), avisosDeLectura: ['AVISO-DE-LECTURA-X'] })
  const t = describirTarjeta(punto(z, 'gimnasio', 'S-5'))
  assert.ok(t.advertencias.some((a) => a.includes('AVISO-DE-LECTURA-X')))
  ok('avisos de lectura de la capa visibles con actividades inferidas')
}

// 10. Inmutabilidad
{
  const z = comoCapa(zonaReal('ZU-R-01'))
  const antes = JSON.stringify(z)
  punto(z, 'gimnasio', 'S-5')
  punto(z, 'licorera')
  punto(z, 'discoteca', 'S-6')
  evaluarTipologiaElegida({ instrumento: inst, zona: z, tipologiaCodigo: 'C-2' })
  assert.equal(JSON.stringify(z), antes)
  assert.ok(Object.isFrozen(z))
  ok('no muta la zona congelada')
}

// 11. Estados del pin -> zona: mensaje claro y nunca concluye
{
  const estados = [
    [{ estado: 'sin_codigo', areaActividad: 'Dotacional', subtipo: 'Equipamiento' }, 'zona_sin_identificar'],
    [{ estado: 'sin_poligono' }, 'zona_sin_identificar'],
    [{ estado: 'varias_zonas', codigos: ['ZU-AM-05', 'ZU-R-01'] }, 'varias_zonas'],
    [{ estado: 'error_red' }, 'error_zona'],
    [{ estado: 'timeout' }, 'error_zona'],
    [{ estado: 'error_servicio' }, 'error_zona']
  ]
  const mensajes = new Set()
  for (const [zonaResultado, situacion] of estados) {
    const r = valorarPunto({ municipio, zonaResultado, actividadId: 'licorera' })
    assert.equal(r.resultado, RESULTADOS.INSUFICIENTE, zonaResultado.estado)
    assert.equal(r.situacion, situacion, zonaResultado.estado)
    assert.ok(r.explicacion.length > 10 && r.queFalta, zonaResultado.estado)
    assert.equal(describirTarjeta(r).clase, 'insuficiente')
    mensajes.add(r.explicacion)
  }
  assert.equal(mensajes.size, 6, 'cada estado debe tener su propio mensaje')
  const dot = valorarPunto({ municipio, zonaResultado: estados[0][0], actividadId: 'gimnasio', tipologiaElegida: 'D-1' })
  assert.equal(dot.resultado, RESULTADOS.INSUFICIENTE)
  assert.ok(!dot.lecturaElegida)
  ok('estados del pin dan mensaje propio y sin_codigo/dotacional no concluye')
}
// 12. Diferencias entre la capa y la transcripción quedan como advertencia
for (const codigo of ['ZU-R-01', 'ZE-R-02']) {
  const t = describirTarjeta(punto(comoCapa(zonaReal(codigo)), 'licorera'))
  assert.ok(t.advertencias.some((a) => /capa oficial del municipio no lista/.test(a)), codigo)
}
ok('diferencias entre capa y transcripción visibles como advertencia')
console.log('Todo correcto.')