// Humo en vivo: del punto a la zona oficial y al resultado para cada actividad.
// Uso: node scripts/humo-punto-itagui.mjs [lat] [lon]   (por defecto, el centro de Itagüí)
import { consultarZonaItagui } from '../src/utils/normativa/consultaZonaItagui.js'
import { URL_CAPA_AREAS_ACTIVIDAD_ITAGUI } from '../src/utils/normativa/zonaOficial.js'
import { LISTA_ACTIVIDADES, valorarPunto } from '../src/utils/normativa/evaluarEnPunto.js'

const lat = Number(process.argv[2] ?? 6.1719)
const lon = Number(process.argv[3] ?? -75.6117)
const municipio = { estado: 'resuelto', nombre: 'Itagüí', slug: 'itagui' }

const zona = await consultarZonaItagui({ lat, lon }, { base: URL_CAPA_AREAS_ACTIVIDAD_ITAGUI })
console.log(`Punto ${lat}, ${lon} -> estado de la consulta: ${zona.estado}`)
if (zona.estado === 'ok') console.log(`Zona: ${zona.zona.codigo} · ${zona.zona.areaActividad}`)
if (zona.estado === 'varias_zonas') console.log(`Zonas: ${zona.codigos.join(', ')}`)

for (const actividad of LISTA_ACTIVIDADES) {
  const v = valorarPunto({ municipio, zonaResultado: zona, actividadId: actividad.id })
  const verificar = v.requiereVerificarUbicacion ? ' + verificar ubicación' : ''
  console.log(`- ${actividad.nombre}: ${v.resultado}${verificar}`)
}