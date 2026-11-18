// "Pegamento": conecta el orquestador con el acceso real a datos de la app.
// Solo este archivo importa consultasSuelo/consultasUsos (que dependen de Vite y Supabase),
// por eso NO se prueba en Node; el orquestador y los adaptadores sí.
//
// [verificar] Supuestos sobre código que no he visto en esta conversación:
//  - consultarSueloEnPunto(punto, zona) con punto {lat, lng} y zona {centro:{lat,lng}, radioKm}
//    devuelve el jsonb de suelo_en_punto ({punto, poligonos}); el adaptador también acepta un arreglo de polígonos.
//  - consultarUsoEnPunto(punto) con punto {lat, lng} (solo Medellín).
//  - El radio mínimo efectivo del RPC es 0,05 km (se pide ese para acercarse al punto).

import { consultarPuntoArcGIS, BASE_AMVA_POR_DEFECTO } from './consultaPuntoArcGIS.js'
import { consultarTerritorio } from './consultaTerritorial.js'
import { consultarSueloEnPunto } from '../consultasSuelo'
import { consultarUsoEnPunto } from '../consultasUsos'

const RADIO_MINIMO_KM = 0.05

// punto: {lat, lon}. opciones: signal (AbortSignal del último clic), municipioElegido, timeoutMs.
export function consultarTerritorioEnVivo(punto, opciones = {}) {
  return consultarTerritorio(punto, {
    consultarArcGIS: (parametros) => consultarPuntoArcGIS({ ...parametros, base: BASE_AMVA_POR_DEFECTO }),
    consultarSuelo: ({ lat, lon }) =>
      consultarSueloEnPunto({ lat, lng: lon }, { centro: { lat, lng: lon }, radioKm: RADIO_MINIMO_KM }),
    consultarUsoMedellin: ({ lat, lon }) => consultarUsoEnPunto({ lat, lng: lon }),
    ...opciones
  })
}