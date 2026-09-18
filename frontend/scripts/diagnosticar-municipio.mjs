// diagnosticar-municipio.mjs
//
// Script de diagnóstico rápido: lista TODOS los servicios ArcGIS del AMVA
// que coinciden con un municipio, y TODAS sus capas reales (id, nombre,
// tipo) — sin filtrar por palabra clave ni descartar Group Layer.
// Úsalo cuando el script principal no encuentra la capa esperada, o
// encuentra la equivocada, para ver qué hay disponible de verdad.
//
// Uso (desde frontend/, junto al script principal):
//   node scripts/diagnosticar-municipio.mjs Bello
//   node scripts/diagnosticar-municipio.mjs Caldas
//
// No necesita Supabase ni dotenv — solo el fetch nativo de Node.

const AMVA_BASE = 'https://portalidem.metropol.gov.co/server/rest/services'

const municipio = process.argv[2]
if (!municipio) {
  console.error('Uso: node diagnosticar-municipio.mjs <municipio>')
  process.exit(1)
}

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_')
}

async function obtenerCatalogoServicios() {
  const res = await fetch(`${AMVA_BASE}?f=json`)
  if (!res.ok) throw new Error(`No se pudo listar los servicios del AMVA: ${res.status}`)
  const data = await res.json()
  return data.services || []
}

async function listarCapasDeServicio(nombreServicio) {
  const res = await fetch(`${AMVA_BASE}/${nombreServicio}/MapServer/layers?f=json`)
  if (!res.ok) throw new Error(`No se pudo listar las capas de ${nombreServicio}: ${res.status}`)
  const data = await res.json()
  return data.layers || [] // sin filtrar Group Layer, queremos ver TODO
}

async function main() {
  const catalogo = await obtenerCatalogoServicios()
  const clave = normalizar(municipio)
  const servicios = catalogo.filter(
    (s) => s.type === 'MapServer' && normalizar(s.name).includes(clave)
  )

  if (servicios.length === 0) {
    console.log(`No hay ningún servicio del AMVA que coincida con "${municipio}".`)
    console.log('\nPrimeros 20 servicios del catálogo completo, por si el nombre no coincide como se esperaba:')
    console.log(catalogo.slice(0, 20).map((s) => s.name))
    return
  }

  console.log(`Servicios encontrados para "${municipio}":`)
  for (const s of servicios) {
    console.log(`\n=== ${s.name} ===`)
    const capas = await listarCapasDeServicio(s.name)
    for (const c of capas) {
      console.log(`  [${c.id}] ${c.name}  (tipo: ${c.type})`)
    }
  }
}

main()
