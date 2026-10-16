import jsPDF from 'jspdf'

const C = {
  marino: [15, 23, 42],
  azul: [37, 99, 235],
  texto: [30, 41, 59],
  suave: [100, 116, 139],
  pista: [226, 232, 240],
  tarjeta: [241, 245, 249],
  claro: [186, 200, 222]
}

function hexARgb(hex) {
  const h = String(hex || '').replace('#', '')
  const c = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return [120, 113, 108]
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]
}

export function generarInformePDF({
  zona,
  total,
  equipamientos, // cuántos del total son equipamientos (opcional)
  lugares, // cuántos del total son lugares (opcional)
  areaKm2,
  densidad,
  categorias, // [{ etiqueta, cantidad, color }]
  suelo, // resumenSuelo o null
  riesgo, // { total, enProteccion, enRiesgo, filas } o null
  cobertura, // resumenCobertura o null
  teselado, // resumenTeselado o null
  imagenMapa, // dataURL JPEG cuadrada o null
  nombreArchivo
}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const ANCHO = pdf.internal.pageSize.getWidth()
  const ALTO = pdf.internal.pageSize.getHeight()
  const M = 40
  const ANCHO_UTIL = ANCHO - M * 2
  const LIMITE_Y = ALTO - 56
  let y = 0

  const texto = (rgb) => pdf.setTextColor(rgb[0], rgb[1], rgb[2])
  const relleno = (rgb) => pdf.setFillColor(rgb[0], rgb[1], rgb[2])
  const trazo = (rgb) => pdf.setDrawColor(rgb[0], rgb[1], rgb[2])
  const fuente = (estilo, tam) => {
    pdf.setFont('helvetica', estilo)
    pdf.setFontSize(tam)
  }

  function asegurarEspacio(alto) {
    if (y + alto > LIMITE_Y) {
      pdf.addPage()
      y = M
    }
  }

  function barra(x, yBarra, ancho, alto, proporcion, rgbColor) {
    relleno(C.pista)
    pdf.roundedRect(x, yBarra, ancho, alto, alto / 2, alto / 2, 'F')
    if (proporcion <= 0) return
    const largo = Math.max(alto, ancho * Math.min(1, proporcion))
    relleno(rgbColor)
    pdf.roundedRect(x, yBarra, largo, alto, alto / 2, alto / 2, 'F')
  }

  function titulo(textoTitulo) {
    asegurarEspacio(70)
    texto(C.marino)
    fuente('bold', 14)
    pdf.text(textoTitulo, M, y)
    relleno(C.azul)
    pdf.rect(M, y + 7, 30, 3, 'F')
    y += 28
  }

  // ---------- Encabezado ----------
  relleno(C.marino)
  pdf.rect(0, 0, ANCHO, 92, 'F')
  relleno(C.azul)
  pdf.rect(0, 92, ANCHO, 4, 'F')

  texto([255, 255, 255])
  fuente('bold', 22)
  pdf.text('Informe de zona', M, 44)

  texto(C.claro)
  fuente('normal', 11)
  pdf.text(pdf.splitTextToSize(String(zona.nombre), ANCHO_UTIL - 110)[0], M, 66)

  texto([255, 255, 255])
  fuente('bold', 12)
  pdf.text('GeoAburrá', ANCHO - M, 44, { align: 'right' })

  // ---------- Mapa (izquierda) + datos (derecha) ----------
  y = 120
  const LADO = 250
  const xDer = imagenMapa ? M + LADO + 22 : M
  const anchoDer = ANCHO - M - xDer

  if (imagenMapa) {
    pdf.addImage(imagenMapa, 'JPEG', M, y, LADO, LADO)
    trazo(C.pista)
    pdf.setLineWidth(1)
    pdf.rect(M, y, LADO, LADO, 'S')
  }

  const fecha = new Date().toLocaleString('es-CO').replace(/[\u202f\u00a0]/g, ' ')
  const datos = [
    ['CENTRO', `${zona.centro.lat.toFixed(5)}, ${zona.centro.lng.toFixed(5)}`],
    ['RADIO DE BÚSQUEDA', `${zona.radioKm} km`],
    ['GENERADO EL', fecha]
  ]

  let ry = y + 8
  datos.forEach(([etiqueta, valor]) => {
    texto(C.suave)
    fuente('bold', 7.5)
    pdf.text(etiqueta, xDer, ry)
    texto(C.texto)
    fuente('normal', 11)
    pdf.text(valor, xDer, ry + 14)
    ry += 34
  })

  const metricas = [
    [Number(total).toLocaleString('es-CO'), 'Total en la zona'],
    areaKm2 != null ? [Number(areaKm2).toFixed(2), 'km² de área'] : null,
    densidad != null ? [Number(densidad).toFixed(1), 'elementos por km²'] : null
  ].filter(Boolean)

  metricas.forEach(([valor, etiqueta]) => {
    relleno(C.tarjeta)
    pdf.roundedRect(xDer, ry, anchoDer, 40, 6, 6, 'F')
    texto(C.azul)
    fuente('bold', 20)
    pdf.text(valor, xDer + 14, ry + 27)
    texto(C.suave)
    fuente('normal', 10)
    pdf.text(etiqueta, xDer + 100, ry + 25)
    ry += 47
  })

  // Desglose del total (igual que en el panel de estadísticas)
  if (Number.isFinite(equipamientos) && Number.isFinite(lugares)) {
    texto(C.suave)
    fuente('normal', 9)
    pdf.text(
      `${Number(equipamientos).toLocaleString('es-CO')} equipamientos · ${Number(lugares).toLocaleString('es-CO')} lugares`,
      xDer,
      ry + 4
    )
  }

  y += LADO + 32

  // ---------- Distribución por categoría ----------
  titulo('Distribución por categoría')

  if (!categorias || categorias.length === 0) {
    texto(C.suave)
    fuente('normal', 10)
    pdf.text('No hay equipamientos ni lugares en esta zona.', M, y)
    y += 24
  } else {
    const maximo = Math.max(...categorias.map((c) => c.cantidad))
    const xBarra = M + 160
    const anchoValor = 74
    const anchoBarra = ANCHO - M - anchoValor - xBarra

    categorias.forEach((c) => {
      asegurarEspacio(24)
      texto(C.texto)
      fuente('normal', 9.5)
      pdf.text(pdf.splitTextToSize(c.etiqueta, 148)[0], M, y + 9)

      barra(xBarra, y, anchoBarra, 12, c.cantidad / maximo, hexARgb(c.color))

      const pct = total > 0 ? ((c.cantidad / total) * 100).toFixed(1) : '0.0'
      texto(C.texto)
      fuente('bold', 9)
      pdf.text(`${c.cantidad}  (${pct} %)`, ANCHO - M, y + 9, { align: 'right' })
      y += 24
    })
  }

  // ---------- Uso del suelo ----------
  if (suelo && suelo.length > 0) {
    y += 14
    titulo('Uso del suelo en la zona')

    suelo.forEach((f) => {
      asegurarEspacio(48)
      const pct = Number(f.porcentaje) || 0

      texto(C.texto)
      fuente('bold', 10)
      pdf.text(f.etiqueta, M, y + 8)
      pdf.text(`${pct.toFixed(1)} %`, ANCHO - M, y + 8, { align: 'right' })

      barra(M, y + 15, ANCHO_UTIL, 10, pct / 100, hexARgb(f.color))

      texto(C.suave)
      fuente('normal', 8.5)
      pdf.text(`${Number(f.areaKm2).toFixed(2)} km² · ${f.poligonos} polígonos`, M, y + 37)
      y += 48
    })

    asegurarEspacio(40)
    texto(C.suave)
    fuente('italic', 8.5)
    pdf.text(
      pdf.splitTextToSize(
        'Porcentaje sobre el área de la zona. Las categorías pueden solaparse (por ejemplo, riesgo sobre suelo urbano), así que no suman 100 %.',
        ANCHO_UTIL
      ),
      M,
      y + 4
    )
  }

  // ---------- Equipamientos en suelo de protección o riesgo ----------
  if (riesgo) {
    y += 40
    titulo('Equipamientos en suelo de protección o riesgo')
    asegurarEspacio(40)
    texto(C.texto)
    fuente('normal', 10)
    pdf.text(
      `${riesgo.enProteccion} en suelo de protección · ${riesgo.enRiesgo} en zona de riesgo (de ${riesgo.total} analizados)`,
      M, y
    )
    y += 20
    riesgo.filas.forEach((f) => {
      asegurarEspacio(16)
      texto(C.texto)
      fuente('normal', 9.5)
      pdf.text(`${f.suelo} · ${f.etiqueta}`, M, y)
      fuente('bold', 9.5)
      pdf.text(String(f.cantidad), ANCHO - M, y, { align: 'right' })
      y += 16
    })
  }

  // ---------- Cobertura de servicios ----------
  if (cobertura) {
    y += 40
    titulo(`Cobertura de servicios: ${cobertura.etiqueta}`)
    asegurarEspacio(50)
    const pct = Number(cobertura.coberturaPct) || 0
    texto(C.texto)
    fuente('bold', 10)
    pdf.text(`Área a menos de ${cobertura.bufferM} m de un servicio`, M, y + 8)
    pdf.text(`${pct.toFixed(1)} %`, ANCHO - M, y + 8, { align: 'right' })
    barra(M, y + 15, ANCHO_UTIL, 10, pct / 100, [22, 163, 74])
    texto(C.suave)
    fuente('normal', 8.5)
    pdf.text(
      `${cobertura.deficitKm2} km² sin cobertura de ${cobertura.zonaKm2} km² · ${cobertura.servicios} servicios considerados`,
      M, y + 37
    )
    y += 48
  }

  // ---------- Teselado de equipamientos ----------
  if (teselado) {
    y += 40
    titulo(`Teselado de equipamientos (hexágonos de ${teselado.ladoM} m)`)
    asegurarEspacio(50)
    texto(C.texto)
    fuente('normal', 10)
    pdf.text(
      `${teselado.totalEquipamientos} equipamientos en ${teselado.celdasConEquipamientos} de ${teselado.celdasTotal} celdas · máximo ${teselado.maxPorCelda} en una celda`,
      M, y
    )
    y += 22

    ;(teselado.rangos || []).forEach((r) => {
      asegurarEspacio(18)
      relleno(hexARgb(r.color))
      pdf.rect(M, y - 9, 16, 11, 'F')
      texto(C.texto)
      fuente('normal', 9.5)
      pdf.text(
        r.desde === r.hasta ? `${r.desde} por celda` : `${r.desde} a ${r.hasta} por celda`,
        M + 26,
        y
      )
      y += 17
    })

    asegurarEspacio(40)
    texto(C.suave)
    fuente('italic', 8.5)
    pdf.text(
      pdf.splitTextToSize(
        'Solo cuenta equipamientos del AMVA, por eso difiere del total de arriba, que incluye lugares. Las celdas del borde se ven completas, pero solo cuentan lo que cae dentro del círculo.',
        ANCHO_UTIL
      ),
      M,
      y + 4
    )
    y += 30
  }

  // ---------- Pie de página en todas las hojas ----------
  const paginas = pdf.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    pdf.setPage(i)
    trazo(C.pista)
    pdf.setLineWidth(0.75)
    pdf.line(M, ALTO - 38, ANCHO - M, ALTO - 38)
    texto(C.suave)
    fuente('normal', 8)
    pdf.text('GeoAburrá · Datos: AMVA y OpenStreetMap contributors', M, ALTO - 24)
    pdf.text(`Página ${i} de ${paginas}`, ANCHO - M, ALTO - 24, { align: 'right' })
  }

  pdf.save(nombreArchivo)
}