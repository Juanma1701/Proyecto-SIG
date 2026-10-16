// scripts/listar-capas.mjs
// Muestra los servicios del AMVA cuyo nombre contiene el texto dado, con sus capas.
// Uso: node scripts/listar-capas.mjs Bello

const AMVA_BASE = 'https://portalidem.metropol.gov.co/server/rest/services'
const texto = process.argv[2]

if (!texto) {
  console.error('Uso: node scripts/listar-capas.mjs <texto>')
  process.exit(1)
}

function normalizar(t) {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}

async function pedir(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`)
  return res.json()
}

const catalogo = await pedir(`${AMVA_BASE}?f=json`)
const servicios = (catalogo.services || []).filter((s) =>
  normalizar(s.name).includes(normalizar(texto))
)

console.log(`Servicios que contienen "${texto}": ${servicios.length}`)

for (const s of servicios) {
  console.log(`\n${s.name} (${s.type})`)
  if (s.type !== 'MapServer') continue
  try {
    const data = await pedir(`${AMVA_BASE}/${s.name}/MapServer/layers?f=json`)
    for (const l of data.layers || []) {
      console.log(`   id ${l.id} | ${l.type} | ${l.name}`)
    }
  } catch (error) {
    console.log(`   no se pudieron listar las capas: ${error.message}`)
  }
}