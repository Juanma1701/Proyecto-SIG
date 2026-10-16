import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Crosshair, MapPin } from 'lucide-react'
import { buscarCercanos, contarCercanos, obtenerUbicacion } from '../utils/cercania'
import {
  CATEGORIAS_EQUIPAMIENTO,
  obtenerCategoria,
  estiloCategoria,
  obtenerNombreEquipamiento
} from '../utils/categoriasEquipamiento'

// Máximo de resultados que se piden a la base (coincide con el tope de la función SQL)
const LIMITE_BUSQUEDA = 200
// Con varias categorías a la vez, cuántos se ven por categoría antes de "ver más"
const POR_GRUPO_RESUMEN = 5
// Con una sola categoría elegida, cuántos se ven antes de "ver más"
const POR_GRUPO_UNA_CATEGORIA = 25
// Tope de un grupo ya expandido
const MAX_GRUPO_EXPANDIDO = 60

const OPCIONES_CATEGORIA = [
  { clave: 'TODAS', etiqueta: 'Todas las categorías' },
  { clave: 'EDU_TODAS', etiqueta: 'Toda la educación' },
  ...Object.entries(CATEGORIAS_EQUIPAMIENTO)
    .filter(([clave]) => clave !== 'DEFAULT')
    .map(([clave, estilo]) => ({ clave, etiqueta: estilo.etiqueta }))
]

function coincide(categoria, filtro) {
  if (filtro === 'TODAS') return true
  if (filtro === 'EDU_TODAS') return categoria.startsWith('EDUCACION')
  return categoria === filtro
}

function etiquetaCategoria(categoria) {
  return (
    CATEGORIAS_EQUIPAMIENTO[categoria]?.etiqueta ||
    estiloCategoria(categoria)?.etiqueta ||
    categoria
  )
}

function formatearDistancia(metros) {
  const m = Math.round(metros)
  if (m === 0) return 'Dentro'
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`
}

function formatearRadio(metros) {
  return metros < 1000 ? `${metros} m` : `${metros / 1000} km`
}

const estiloPanel = {
  width: 300,
  padding: 12,
  borderRadius: 16,
  background: 'rgba(11, 22, 32, 0.92)',
  border: '1px solid rgba(126, 200, 227, 0.3)',
  backdropFilter: 'blur(8px)',
  color: '#e5f0f6',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const estiloSelect = {
  width: '100%',
  padding: 6,
  borderRadius: 8,
  background: '#0f1f2c',
  color: '#e5f0f6',
  border: '1px solid rgba(126, 200, 227, 0.3)'
}

const estiloBoton = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px 6px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #3ecf8e, #7ec8e3)',
  color: '#0b1620',
  fontWeight: 600,
  fontSize: 13
}

const estiloVerMas = {
  background: 'transparent',
  border: 'none',
  color: '#7ec8e3',
  cursor: 'pointer',
  fontSize: 12,
  padding: '4px 2px',
  textAlign: 'left'
}

export default function QueHayCerca({ punto, onResultados }) {
  const [cargando, setCargando] = useState(false)
  const [radio, setRadio] = useState(1000)
  const [filtro, setFiltro] = useState('TODAS')
  const [datos, setDatos] = useState(null)
  const [expandidas, setExpandidas] = useState({})

  // Agrupa por categoría. Como los items llegan ordenados por distancia,
  // los grupos quedan ordenados por su elemento más cercano.
  const grupos = useMemo(() => {
    if (!datos) return []
    const mapa = new Map()
    for (const item of datos.items) {
      if (!coincide(item.categoria, filtro)) continue
      if (!mapa.has(item.categoria)) mapa.set(item.categoria, [])
      mapa.get(item.categoria).push(item)
    }
    return Array.from(mapa, ([categoria, items]) => ({ categoria, items }))
  }, [datos, filtro])

  const variasCategorias = filtro === 'TODAS' || filtro === 'EDU_TODAS'
  const porGrupo = variasCategorias ? POR_GRUPO_RESUMEN : POR_GRUPO_UNA_CATEGORIA

  // Lo que realmente se ve en la lista (y lo que se dibuja en el mapa)
  const mostrados = useMemo(() => {
    return grupos.flatMap((g) =>
      expandidas[g.categoria]
        ? g.items.slice(0, MAX_GRUPO_EXPANDIDO)
        : g.items.slice(0, porGrupo)
    )
  }, [grupos, expandidas, porGrupo])

  const totalCoincidentes = grupos.reduce((suma, g) => suma + g.items.length, 0)

  useEffect(() => {
    onResultados?.(datos ? { centro: datos.centro, items: mostrados } : null)
  }, [datos, mostrados, onResultados])

  function alternarGrupo(categoria) {
    setExpandidas((previo) => ({ ...previo, [categoria]: !previo[categoria] }))
  }

  async function buscar(origen) {
    if (origen === 'punto' && !punto) {
      toast.info('Primero haz clic en el mapa para marcar un punto')
      return
    }

    setCargando(true)
    try {
      const centro =
        origen === 'gps'
          ? await obtenerUbicacion()
          : { lat: punto.lat, lng: punto.lng }

      // La búsqueda y el conteo total van en paralelo. Si el conteo falla
      // (por ejemplo, la función SQL nueva aún no existe) se sigue sin él.
      const [crudos, total] = await Promise.all([
        buscarCercanos(centro.lat, centro.lng, radio, LIMITE_BUSQUEDA),
        contarCercanos(centro.lat, centro.lng, radio).catch(() => null)
      ])

      const items = crudos
        .filter((r) => r.lat != null && r.lng != null)
        .map((r) => {
          const feature = { properties: r.propiedades || {} }
          return {
            id: r.id,
            lat: r.lat,
            lng: r.lng,
            distancia_m: r.distancia_m,
            tipo: r.tipo_geom,
            geojson: r.geojson,
            categoria: obtenerCategoria(feature),
            nombre: obtenerNombreEquipamiento(feature) || r.nombre_capa || 'Sin nombre'
          }
        })

      const truncado = total != null ? total > crudos.length : crudos.length >= LIMITE_BUSQUEDA

      setExpandidas({})
      setDatos({ centro, items, total, truncado, radioUsado: radio })
      if (items.length === 0) toast.info('No hay equipamientos en ese radio')
    } catch (e) {
      if (e?.code === 1) {
        toast.error('No diste permiso de ubicación. Usa "Punto marcado" o activa el permiso.')
      } else {
        toast.error('No se pudo buscar: ' + (e?.message || 'error desconocido'))
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={estiloPanel}>
      <strong style={{ fontSize: 14 }}>¿Qué hay cerca?</strong>

      <select value={radio} onChange={(e) => setRadio(Number(e.target.value))} style={estiloSelect}>
        <option value={500}>Radio: 500 m</option>
        <option value={1000}>Radio: 1 km</option>
        <option value={2000}>Radio: 2 km</option>
        <option value={5000}>Radio: 5 km</option>
      </select>

      <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={estiloSelect}>
        {OPCIONES_CATEGORIA.map((o) => (
          <option key={o.clave} value={o.clave}>{o.etiqueta}</option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => buscar('gps')} disabled={cargando} style={estiloBoton}>
          <Crosshair size={15} /> Mi ubicación
        </button>
        <button onClick={() => buscar('punto')} disabled={cargando || !punto} style={{ ...estiloBoton, opacity: punto ? 1 : 0.5 }}>
          <MapPin size={15} /> Punto marcado
        </button>
      </div>

      {cargando && <span style={{ fontSize: 12 }}>Buscando…</span>}

      {datos && (
        <>
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
            <strong>
              {datos.total != null ? datos.total : datos.items.length} equipamientos
            </strong>{' '}
            dentro de {formatearRadio(datos.radioUsado)}
            {datos.truncado && (
              <div style={{ opacity: 0.85 }}>
                Se cargaron los {LIMITE_BUSQUEDA} más cercanos
                {filtro !== 'TODAS' && ': el filtro solo busca entre ellos'}.
              </div>
            )}
            {filtro !== 'TODAS' && (
              <div style={{ opacity: 0.85 }}>
                {totalCoincidentes} de esta categoría entre los cargados.
              </div>
            )}
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {grupos.map((g) => {
              const abierto = !!expandidas[g.categoria]
              const visiblesGrupo = abierto
                ? g.items.slice(0, MAX_GRUPO_EXPANDIDO)
                : g.items.slice(0, porGrupo)
              const hayMas = g.items.length > porGrupo

              return (
                <div key={g.categoria} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#7ec8e3',
                      padding: '4px 2px'
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: estiloCategoria(g.categoria).color,
                        flexShrink: 0
                      }}
                    />
                    <span style={{ flex: 1 }}>{etiquetaCategoria(g.categoria)}</span>
                    <span>{g.items.length}</span>
                  </div>

                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {visiblesGrupo.map((r) => (
                      <li
                        key={r.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '5px 2px',
                          borderBottom: '1px solid rgba(126, 200, 227, 0.2)',
                          fontSize: 13
                        }}
                      >
                        <span style={{ flex: 1 }}>{r.nombre}</span>
                        <strong>{formatearDistancia(r.distancia_m)}</strong>
                      </li>
                    ))}
                  </ul>

                  {hayMas && (
                    <button onClick={() => alternarGrupo(g.categoria)} style={estiloVerMas}>
                      {abierto ? 'Ver menos' : `Ver más (${Math.min(g.items.length, MAX_GRUPO_EXPANDIDO) - porGrupo} más)`}
                    </button>
                  )}
                </div>
              )
            })}

            {grupos.length === 0 && (
              <div style={{ fontSize: 12, padding: 6 }}>
                Ninguno de esa categoría entre los cargados en este radio.
              </div>
            )}
          </div>

          <button
            onClick={() => setDatos(null)}
            style={{ ...estiloBoton, flex: 'none', background: 'transparent', color: '#7ec8e3', border: '1px solid rgba(126,200,227,0.4)' }}
          >
            Limpiar resultados
          </button>
        </>
      )}
    </div>
  )
}