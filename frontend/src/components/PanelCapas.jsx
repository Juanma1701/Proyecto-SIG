import { useState } from 'react'
import InfoCRS from './InfoCRS'
import SelectorEPSG from './SelectorEPSG'
import {
  reproyectarGeoJSON,
  asegurarDefinicionEPSG,
  esDibujableEnMapa,
  etiquetaEPSG,
} from '../utils/reproyectar'
import { toast } from 'sonner'
import '../styles/PanelCapas.css'
import { Trash2, Download, RotateCcw } from 'lucide-react'
import { descargarGeoJSON } from '../utils/exportarCapa'

function badgeInfo(geojson) {
  const tipo = geojson?.features?.[0]?.geometry?.type || geojson?.type || ''
  if (tipo.includes('Point')) return { clase: 'panel-capas__badge--point', texto: 'Punto' }
  if (tipo.includes('Line')) return { clase: 'panel-capas__badge--line', texto: 'Línea' }
  if (tipo.includes('Polygon')) return { clase: 'panel-capas__badge--polygon', texto: 'Polígono' }
  return { clase: '', texto: tipo || '—' }
}

// Al subir un archivo la app lo convierte a 4326 para dibujarlo, así que
// capa.geojson ya no es el archivo original sino su versión en grados. Cuando
// existe el original tal cual se descarga ese; si no, se descarga lo que hay.
function originalDeCapa(capa) {
  return {
    geojson: capa.geojsonOriginal || capa.geojsonCargaOriginal || capa.geojson,
    epsg: capa.crsOrigen?.epsg ?? capa.crsCargaOriginal?.epsg ?? capa.crs?.epsg,
  }
}

function epsgOriginal(capa) {
  return originalDeCapa(capa).epsg
}

function descargarOriginal(capa) {
  const { geojson, epsg } = originalDeCapa(capa)
  descargarGeoJSON(geojson, capa.nombre, epsg, 'original')
}

export default function PanelCapas({ capas, setCapas }) {
  const [sridDestino, setSridDestino] = useState({})
  const [reproyectando, setReproyectando] = useState(null)
  const [gruposAbiertos, setGruposAbiertos] = useState({})

  async function manejarReproyeccion(capa) {
    const destino = Number(sridDestino[capa.id])
    if (!Number.isInteger(destino) || !destino) {
      return toast.error('Selecciona un sistema de destino de la lista')
    }

    const origen = capa.crs?.epsg
    if (!Number.isInteger(Number(origen)) || !Number(origen)) {
      return toast.error(
        `No se sabe el sistema de origen de "${capa.nombre}". Vuelve a cargarla para que se detecte su .prj o su propiedad crs.`
      )
    }

    setReproyectando(capa.id)
    try {
      await asegurarDefinicionEPSG(destino)
      const reproyectado = reproyectarGeoJSON(capa.geojson, origen, destino)

      // La decisión se toma con el catálogo, no con una lista escrita a mano:
      // así 3857, 3114, 3118 y 31119 también se tratan como proyectados y
      // nunca se pintan metros sobre la geometría viva de la capa. Lo que no
      // se puede dibujar (o no se conoce) cae aquí por defecto, que es el
      // camino seguro.
      if (!esDibujableEnMapa(destino)) {
        setCapas(prev => prev.map(c =>
          c.id === capa.id
            ? { ...c, geojsonReproyectado: reproyectado, crsReproyectado: { epsg: destino } }
            : c
        ))
        toast.warning(
          `Reproyectada a ${etiquetaEPSG(destino)}. El mapa sigue mostrando la capa en su sistema original porque Leaflet solo dibuja en grados — usa "Descargar reproyectado" para exportar este resultado.`,
          { duration: 6000 }
        )
      } else {
        setCapas(prev => prev.map(c =>
          c.id === capa.id
            ? {
              ...c,
              geojson: reproyectado,
              crs: { epsg: destino, fuente: 'reproyectado por el usuario' },
              // Se guarda la geometría tal como llegó solo la primera vez, para
              // que "Restaurar" devuelva el archivo original y no otra
              // reproyección encadenada.
              geojsonCargaOriginal: c.geojsonCargaOriginal ?? c.geojson,
              crsCargaOriginal: c.crsCargaOriginal ?? c.crs,
              geojsonReproyectado: null,
              crsReproyectado: null,
            }
            : c
        ))
        toast.success(`Reproyectada a ${etiquetaEPSG(destino)}`)
      }
    } catch (error) {
      console.error(error)
      toast.error('No se pudo reproyectar: ' + error.message)
    } finally {
      setReproyectando(null)
    }
  }

  function restaurarCapa(capa) {
    if (!capa.geojsonCargaOriginal) return
    setCapas(prev => prev.map(c =>
      c.id === capa.id
        ? {
          ...c,
          geojson: capa.geojsonCargaOriginal,
          crs: capa.crsCargaOriginal,
          geojsonCargaOriginal: null,
          crsCargaOriginal: null,
          geojsonReproyectado: null,
          crsReproyectado: null,
        }
        : c
    ))
    setSridDestino(prev => ({ ...prev, [capa.id]: '' }))
    toast.success('Capa restaurada a su sistema original')
  }

  function marcarTodas(valor) {
    setCapas(capas.map(c => ({ ...c, visible: valor })))
  }

  function marcarGrupo(grupoId, valor) {
    setCapas(capas.map(c => c.grupo === grupoId ? { ...c, visible: valor } : c))
  }

  function toggleGrupoAbierto(grupoId) {
    setGruposAbiertos(prev => ({ ...prev, [grupoId]: !prev[grupoId] }))
  }

  function eliminarCapa(id) {
    setCapas(prev => prev.filter(c => c.id !== id))
  }

  const capasSueltas = capas.filter(c => !c.grupo)
  const grupos = {}
  capas.filter(c => c.grupo).forEach(c => {
    if (!grupos[c.grupo]) grupos[c.grupo] = { nombre: c.grupoNombre, capas: [] }
    grupos[c.grupo].capas.push(c)
  })

  function renderCapa(capa) {
    const esZona = capa.esZonaVisual || capa.tipo === 'zona'
    const badge = esZona ? { clase: '', texto: 'Zona' } : badgeInfo(capa.geojson)

    return (
      <div key={capa.id} className={`panel-capas__chip ${capa.visible ? '' : 'oculta'}`}>
        <div className="capa-chip-header">
          <span className="capa-chip-nombre">
            {capa.nombre}
            <span className={`panel-capas__badge ${badge.clase}`}>{badge.texto}</span>
          </span>
          <div className="capa-chip-acciones">
            <label className="switch">
              <input
                type="checkbox"
                checked={capa.visible}
                onChange={() => setCapas(capas.map(c =>
                  c.id === capa.id ? { ...c, visible: !c.visible } : c
                ))}
              />
              <span className="switch-slider"></span>
            </label>
            <button className="capa-chip-eliminar" onClick={() => eliminarCapa(capa.id)}><Trash2 /></button>
          </div>
        </div>

        <div className="capa-chip-detalle">
          <InfoCRS crs={capa.crs} />

          {!esZona && (
            <>
              <SelectorEPSG
                origen={capa.crs?.epsg}
                valor={sridDestino[capa.id] ?? ''}
                onChange={(epsg) => setSridDestino(prev => ({ ...prev, [capa.id]: epsg }))}
                deshabilitado={reproyectando === capa.id}
              />
              <button
                onClick={() => manejarReproyeccion(capa)}
                disabled={reproyectando === capa.id || !sridDestino[capa.id]}
              >
                {reproyectando === capa.id ? (
                  <><span className="spinner"></span>Reproyectando...</>
                ) : (
                  'Reproyectar'
                )}
              </button>
              <button
                className="panel-capas__boton-descarga"
                onClick={() => descargarOriginal(capa)}
              >
                <Download size={14} /> Descargar original ({etiquetaEPSG(epsgOriginal(capa))})
              </button>

              {capa.geojsonReproyectado && (
                <button
                  className="panel-capas__boton-descarga"
                  onClick={() => descargarGeoJSON(
                    capa.geojsonReproyectado,
                    capa.nombre,
                    capa.crsReproyectado.epsg,
                    'reproyectado'
                  )}
                >
                  <Download size={14} /> Descargar reproyectado ({etiquetaEPSG(capa.crsReproyectado.epsg)})
                </button>
              )}

              {capa.geojsonCargaOriginal && (
                <button
                  className="panel-capas__boton-descarga"
                  onClick={() => restaurarCapa(capa)}
                >
                  <RotateCcw size={14} /> Restaurar original (EPSG:{capa.crsCargaOriginal.epsg})
                </button>
              )}
            </>
          )}
        </div>

      </div>
    )
  }

  return (
    <div className="panel-capas__contenedor">
      {capas.length === 0 ? (
        <p className="panel-capas__vacio">No hay capas cargadas</p>
      ) : (
        <>
          <div className="panel-capas__acciones-principales">
            <button className="panel-capas__accion panel-capas__accion--activo" onClick={() => marcarTodas(true)}>
              Marcar todo
            </button>
            <button className="panel-capas__accion panel-capas__accion--inactivo" onClick={() => marcarTodas(false)}>
              Desmarcar todo
            </button>
          </div>

          {Object.entries(grupos).map(([grupoId, grupo]) => {
        const abierto = gruposAbiertos[grupoId] ?? false
        const visibles = grupo.capas.filter(c => c.visible).length

            return (
              <div key={grupoId} className="panel-capas__grupo">
            <div className="panel-capas__grupo-header" onClick={() => toggleGrupoAbierto(grupoId)}>
              <p className="panel-capas__grupo-titulo">
                {abierto ? '▾' : '▸'} {grupo.nombre}
                <span className="panel-capas__grupo-visibles">
                  ({visibles}/{grupo.capas.length} visibles)
                </span>
              </p>
            </div>

            <div className={`panel-capas__grupo-acciones ${abierto ? 'is-open' : ''}`}>
              <button
                className="panel-capas__grupo-boton panel-capas__grupo-boton--activo"
                onClick={(e) => { e.stopPropagation(); marcarGrupo(grupoId, true) }}
              >
                Marcar todo
              </button>
              <button
                className="panel-capas__grupo-boton panel-capas__grupo-boton--inactivo"
                onClick={(e) => { e.stopPropagation(); marcarGrupo(grupoId, false) }}
              >
                Desmarcar todo
              </button>
            </div>

            {abierto && (
              <div className="panel-capas__grupo-cuerpo">
                {grupo.capas.map(renderCapa)}
              </div>
            )}
              </div>
            )
          })}

          {capasSueltas.map(renderCapa)}
        </>
      )}
    </div>
  )
}