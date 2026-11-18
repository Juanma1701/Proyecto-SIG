// Humo EN VIVO (usa red; solo lectura). No forma parte de las pruebas.
// Consulta los 10 centros con el orquestador real y las capas REST reales del AMVA.
// Supabase NO se consulta aquí (en Node requiere Vite): se simula una copia sin polígonos,
// así que el contraste con suelo_pot queda sin probar.
//
//   node scripts/humo-territorial.mjs            (los 10 centros)
//   node scripts/humo-territorial.mjs Medellin   (uno solo, con detalle de cada bloque)

import { consultarPuntoArcGIS } from '../src/utils/territorial/consultaPuntoArcGIS.js'
import { consultarTerritorio } from '../src/utils/territorial/consultaTerritorial.js'
import { BASE_PUBLICA_AMVA } from '../src/utils/territorial/modelo.js'

const CENTROS = {
  Barbosa: [-75.3308, 6.4378],
  Girardota: [-75.4453, 6.3775],
  Copacabana: [-75.5083, 6.3489],
  Bello: [-75.5581, 6.3373],
  Medellin: [-75.5812, 6.2442],
  Envigado: [-75.5836, 6.1719],
  Itagui: [-75.6117, 6.1719],
  Sabaneta: [-75.6169, 6.1508],
  LaEstrella: [-75.6436, 6.15],
  Caldas: [-75.6353, 6.0917]
}

const [, , filtro] = globalThis.process?.argv ?? []
const nombres = filtro ? [filtro] : Object.keys(CENTROS)

for (const nombre of nombres) {
  if (!CENTROS[nombre]) throw new Error(`Centro desconocido: ${nombre}`)
  const [lon, lat] = CENTROS[nombre]
  const t0 = Date.now()
  const r = await consultarTerritorio(
    { lat, lon },
    {
      consultarArcGIS: (p) => consultarPuntoArcGIS({ ...p, base: BASE_PUBLICA_AMVA, timeoutMs: 60000 }),
      consultarSuelo: async () => ({ punto: {}, poligonos: [] })
    }
  )
  const conteo = {}
  for (const b of r.bloques) conteo[b.estado] = (conteo[b.estado] ?? 0) + 1
  console.log(
    `${nombre.padEnd(11)} ${r.estado} | municipio=${r.municipio.nombre ?? '-'} (${r.municipio.metodo ?? '-'}) | ` +
      `${r.bloques.length} bloques ${JSON.stringify(conteo)} | ${Date.now() - t0} ms`
  )
  if (filtro) {
    for (const b of r.bloques) {
      console.log(`   ${b.tipo.padEnd(20)} ${b.estado.padEnd(18)} ${String(b.registros.length).padStart(2)} reg  ${b.id}${b.error ? '  ' + b.error.mensaje : ''}`)
    }
  }
  await new Promise((resolver) => setTimeout(resolver, 300))
}
