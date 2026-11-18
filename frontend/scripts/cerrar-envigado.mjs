// Cierre de Envigado: (1) celda vacía => insuficiente (no "prohibido"), (2) páginas reales del PDF en los mapeos CIIU,
// (3) discoteca/bar => CIIU 553 explícito. Idempotente. Ejecutar DESPUÉS de aplicar-tabla27-envigado.mjs --escribir.
// Uso (desde frontend/): node scripts/cerrar-envigado.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ruta = (r) => fileURLToPath(new URL(r, import.meta.url))
function parchar(archivo, cambios) {
  let s = readFileSync(ruta(archivo), 'utf8')
  for (const [desde, hacia, etiqueta] of cambios) {
    if (typeof hacia === 'string' && s.includes(hacia)) continue // ya aplicado
    if (typeof desde === 'string' ? s.includes(desde) : desde.test(s)) s = s.replace(desde, hacia)
    else if (!s.includes(typeof hacia === 'string' ? hacia.slice(0, 40) : '')) throw new Error(`${archivo}: no encuentro "${etiqueta}"`)
  }
  writeFileSync(ruta(archivo), s)
  console.log(`ok ${archivo}`)
}

parchar('../src/utils/normativa/evaluarPorCiiu.js', [
  ['ausente => incompatible solo con CIIU explícito y zona identificada;', 'celda vacía => insuficiente (el acuerdo no la define ni dice que sea prohibida);', 'comentario'],
  [
    /\} else \{\r?\n\s*salida\.resultado = RESULTADOS\.INCOMPATIBLE\r?\n\s*salida\.razones\.push\([^\r\n]*\r?\n\s*\}/,
    '} else {\n    return insuficiente(\n      `La Tabla 27 no define "${actividad.nombre}" (CIIU ${regla.ciiu}) en ${zona.nombre}: la celda está vacía. El acuerdo no dice que eso equivalga a prohibido; hay que consultarlo con Planeación o el Comité Municipal de Usos del Suelo.`\n    )\n  }',
    'rama de celda vacía'
  ]
])

const paginas = { 521: 125, 522: 126, 523: 126, 524: 126, 552: 126, 553: 126, 924: 131 }
parchar('../src/utils/normativa/actividades.js', [
  [
    /mapeoCiiu\('(\d{3})', '([^']*)', CONFIANZA_MAPEO\.(\w+), '186 \(Tabla 27\)', \d+,/g,
    (_, ciiu, fila, conf) => `mapeoCiiu('${ciiu}', '${fila}', CONFIANZA_MAPEO.${ciiu === '553' ? 'EXPLICITA' : conf}, '186 (Tabla 27)', ${paginas[ciiu] ?? 0},`,
    'mapeoCiiu'
  ],
  [
    'La fila habla de expendio de licor para consumo en el sitio; no nombra discotecas. Ver también art. 197.',
    'La fila describe el expendio de bebidas alcohólicas para consumo dentro del establecimiento, que es lo que hace un bar o una discoteca [verificar]. Ver también art. 197 (solo en cinco polígonos del Centro tradicional).',
    'nota de discoteca'
  ]
])

parchar('../src/utils/normativa/envigado.js', [
  [
    'Lo que la Tabla 27 no señala para una zona se considera prohibido.',
    'Los usos prohibidos son los que riñen con la vocación de la zona. Una celda vacía en la Tabla 27 no está definida: no se toma como prohibición expresa [verificar].',
    'disposición de usos'
  ]
])

parchar('./test-normativa-envigado.mjs', [
  ['caso ausente: fila sin letra en la zona => incompatible solo con CIIU explícito y zona dada', 'caso celda vacía: fila sin letra en la zona => insuficiente, no incompatible', 'título ausente'],
  ["assert.equal(ev('restaurante', 'COR1', sintetico).resultado, RESULTADOS.INCOMPATIBLE)", "assert.equal(ev('restaurante', 'COR1', sintetico).resultado, RESULTADOS.INSUFICIENTE)\n  assert.match(ev('restaurante', 'COR1', sintetico).explicacion, /celda está vacía/)", 'aserción ausente'],
  ["solo restaurante es explícito", "restaurante y discoteca son explícitos", 'título catálogo'],
  ["['restaurante'])", "['restaurante', 'discoteca'])", 'lista explícitos'],
  [
    "let fallos = 0",
    "prueba('discoteca (553): Centro tradicional => condicionada; residencial => celda vacía => insuficiente', () => {\n  const ct = ev('discoteca', 'CT')\n  assert.equal(ct.resultado, RESULTADOS.CONDICIONADA)\n  assert.ok(ct.referencias.some((x) => x.articulo === '184'))\n  assert.equal(ev('discoteca', 'RES').resultado, RESULTADOS.INSUFICIENTE)\n})\n\nlet fallos = 0",
    'fin de pruebas'
  ]
])