import { construirFichaNormativa } from '../utils/normativa/fichaNormativa'

// "Qué dice la norma en este punto": cruza las filas de la capa de usos con el instrumento normativo del municipio.
// Solo informa: no hay veredicto, y siempre se muestran las advertencias y limitaciones de la norma.

const ID_BLOQUE_USOS = 'supabase:usos_suelo'

// Las filas de usos_en_punto llegan dentro de los registros del bloque; se toma el objeto que trae `cod_subcat_uso`.
function filaDeRegistro(registro) {
  const candidatos = [registro?.atributosOriginales, registro?.atributosLimpios, registro?.atributos, registro]
  return candidatos.find((c) => c && typeof c === 'object' && 'cod_subcat_uso' in c) ?? null
}

function Lista({ items }) {
  return (
    <ul className="territorial__lista">
      {items.map((texto, i) => (
        <li key={`${texto}-${i}`}>{texto}</li>
      ))}
    </ul>
  )
}

function TablasDeActividades({ tablas }) {
  return tablas.map((tabla) => (
    <div key={tabla.titulo} className="territorial__subdato">
      <p className="territorial__nota">
        {tabla.titulo} (p. {tabla.paginaPdf} del PDF)
      </p>
      {tabla.grupos.map((grupo) => (
        <div key={grupo.categoria}>
          <p className="territorial__valor territorial__valor--chico">{grupo.categoria}</p>
          <Lista items={grupo.subcategorias} />
        </div>
      ))}
    </div>
  ))
}

function AreaNorma({ area }) {
  const { total, permitidas } = area.resumenMatriz
  return (
    <div className="territorial__subdato">
      <p className="territorial__valor">{area.nombre}</p>
      <p className="territorial__nota">
        Capa de usos: {area.areaGeneralCapa}
        {area.subcategoriaCapa ? ` · ${area.subcategoriaCapa}` : ''} (código {area.codigoSubcategoria})
      </p>

      <details className="territorial__avisos">
        <summary>
          Tabla de localización de usos, art. 255 ({permitidas} permitidas de {total})
        </summary>
        {area.matriz.map((grupo) => (
          <div key={grupo.categoria}>
            <p className="territorial__valor territorial__valor--chico">{grupo.categoria}</p>
            <ul className="territorial__lista">
              {grupo.filas.map((fila, i) => (
                <li key={`${fila.actividad}-${i}`}>
                  <strong>{fila.permitido ? 'Sí' : 'No'}</strong> · {fila.actividad}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </details>

      <details className="territorial__avisos">
        <summary>Actividades nombradas para esta área (p. 356-358)</summary>
        <TablasDeActividades tablas={area.actividadesPropias} />
        {area.actividadesHeredadas.map((h) => (
          <div key={h.desdeAreaId}>
            <p className="territorial__nota">También valen las de: {h.desdeNombre} (reglas r2 y r3 del art. 255)</p>
            <TablasDeActividades tablas={h.tablas} />
          </div>
        ))}
      </details>
    </div>
  )
}

export default function FichaNormativa({ resultado }) {
  const slug = resultado?.municipio?.slug
  const bloque = resultado?.bloques?.find((b) => b.id === ID_BLOQUE_USOS)
  if (!slug || !bloque) return null

  const encabezado = (
    <header className="territorial__bloque-cabecera">
      <h4>Qué dice la norma en este punto</h4>
      <span className="territorial__estado territorial__estado--aviso">Informativo</span>
    </header>
  )

  if (bloque.estado === 'error_servicio') {
    return (
      <article className="territorial__bloque">
        {encabezado}
        <p className="territorial__nota">No se pudieron consultar los usos del suelo en este punto, así que no hay ficha normativa.</p>
      </article>
    )
  }

  const registros = bloque.registros ?? []
  const filas = registros.map(filaDeRegistro).filter(Boolean)
  const ficha = construirFichaNormativa(slug, filas)
  if (ficha.estado === 'sin_regimen_cargado') return null

  if (registros.length > 0 && filas.length === 0) {
    return (
      <article className="territorial__bloque">
        {encabezado}
        <p className="territorial__nota">
          La respuesta de usos no trae el código de subcategoría esperado (cod_subcat_uso); no se puede cruzar con la norma.
        </p>
      </article>
    )
  }

  return (
    <article className="territorial__bloque">
      {encabezado}
      <p className="territorial__nota">
        {ficha.instrumento.nombre} · cobertura {ficha.instrumento.cobertura}
      </p>

      {ficha.areas.map((area) => (
        <AreaNorma key={area.id} area={area} />
      ))}

      {ficha.otrasCategorias.map((otra) => (
        <p key={otra.id} className="territorial__nota">
          {otra.areaGeneralCapa ?? otra.id}: {otra.norma}.
        </p>
      ))}

      {ficha.estado === 'sin_filas' && (
        <p className="territorial__nota">La capa de usos no tiene un polígono en este punto, así que no se puede indicar un área de uso.</p>
      )}

      {ficha.areas.length > 0 && (
        <details className="territorial__avisos">
          <summary>Protocolo ambiental y urbanístico (PAU), art. 260</summary>
          <p className="territorial__nota">Se exige por actividad, no por área. Requieren PAU:</p>
          <Lista items={ficha.pau.requiere} />
          <p className="territorial__nota">No lo requieren:</p>
          <Lista items={ficha.pau.noRequiere} />
        </details>
      )}

      {ficha.areas.length > 0 && (
        <details className="territorial__avisos">
          <summary>Reglas de interpretación del art. 255</summary>
          <ul className="territorial__lista">
            {ficha.reglas.map((regla) => (
              <li key={regla.id}>
                <strong>{regla.id}</strong> · {regla.texto}
                {regla.observaciones.map((obs) => (
                  <span key={obs} className="territorial__nota">
                    {' '}
                    ({obs})
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </details>
      )}

      <ul className="territorial__global">
        {ficha.advertencias.map((aviso) => (
          <li key={aviso}>{aviso}</li>
        ))}
      </ul>

      <details className="territorial__avisos">
        <summary>Qué no cubre esta ficha ({ficha.limitaciones.length})</summary>
        <Lista items={ficha.limitaciones} />
      </details>

      <p className="territorial__fuente">
        Fuente: {ficha.instrumento.nombre} ·{' '}
        <a href={ficha.instrumento.url} target="_blank" rel="noopener noreferrer">
          ver documento
        </a>
      </p>
    </article>
  )
}