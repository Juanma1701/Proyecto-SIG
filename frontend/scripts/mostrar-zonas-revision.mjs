// Muestra las zonas cuya transcripción difiere de la capa oficial (después de corregir el parser),
// con el artículo y la página del PDF donde se leyó, para revisarlas a ojo.
import { instrumentoDeMunicipio } from '../src/utils/normativa/index.js'

const REVISION = {
  'ZU-AM-04': 'la capa trae S-6 como CONDICIONADO; nuestra transcripción no',
  'ZU-R-01': 'nuestra transcripción trae S-14 y S-22 como CONDICIONADOS; la capa no',
  'ZE-R-02': 'nuestra transcripción trae D-8 como COMPATIBLE; la capa no',
  'ZU-AM-24': 'la capa trae S-15 como COMPATIBLE; nuestra transcripción no'
}

const instrumento = instrumentoDeMunicipio('Itagui')
for (const [codigo, diferencia] of Object.entries(REVISION)) {
  const z = instrumento.zonas.find((x) => x.codigo === codigo)
  console.log(`\n== ${codigo}: ${diferencia}`)
  if (!z) { console.log('  (no está transcrita)'); continue }
  console.log(`  compatibles   : ${z.compatibles.join(', ')}`)
  console.log(`  condicionados : ${z.condicionados.join(', ')}`)
  console.log(`  fuente        : ${JSON.stringify(z.fuente)}`)
}