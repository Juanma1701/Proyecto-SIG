// Humo EN VIVO (usa red; solo lectura). No forma parte de `npm test`.
// Mide a qué distancia empieza a aparecer un segundo municipio en AMVA_POT/5 (sondeo S3)
// usando el mismo módulo de consulta que usará la app.
//
//   node scripts/humo-consulta-punto.mjs

import { consultarPuntoArcGIS } from '../src/utils/territorial/consultaPuntoArcGIS.js'

const BASE = 'https://portalidem.metropol.gov.co/server/rest/services'

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

const MEDIOS = {
  'Bello-Medellin': [-75.56965, 6.29075],
  'Medellin-Envigado': [-75.5824, 6.20805],
  'Medellin-Itagui': [-75.59645, 6.20805],
  'Envigado-Itagui': [-75.59765, 6.1719],
  'Envigado-Sabaneta': [-75.60025, 6.16135],
  'Itagui-Sabaneta': [-75.6143, 6.16135],
  'Itagui-LaEstrella': [-75.62765, 6.16095],
  'Sabaneta-LaEstrella': [-75.63025, 6.1504],
  'LaEstrella-Caldas': [-75.63945, 6.12085],
  'Copacabana-Bello': [-75.5332, 6.3431],
  'Girardota-Copacabana': [-75.4768, 6.3632],
  'Barbosa-Girardota': [-75.38805, 6.40765]
}

const DISTANCIAS = [0, 100, 250, 500]

async function codigos(lon, lat, distanciaM) {
  const r = await consultarPuntoArcGIS({
    servicio: 'AMVA_POT',
    capaId: 5,
    lat,
    lon,
    distanciaM,
    base: BASE,
    outFields: 'CODIGO_MUN',
    timeoutMs: 60000
  })
  if (r.estado === 'ok') return [...new Set(r.registros.map((x) => String(x.CODIGO_MUN ?? '').trim()))].sort().join(',')
  if (r.estado === 'sin_resultados') return '(vacío)'
  return `ERROR ${r.estado}${r.httpStatus ? ' ' + r.httpStatus : ''}`
}

for (const grupo of [CENTROS, MEDIOS]) {
  for (const [nombre, [lon, lat]] of Object.entries(grupo)) {
    const partes = []
    for (const d of DISTANCIAS) {
      partes.push(`d=${d} -> ${await codigos(lon, lat, d)}`)
      await new Promise((resolver) => setTimeout(resolver, 150))
    }
    console.log(`${nombre.padEnd(22)} ${partes.join(' | ')}`)
  }
}
