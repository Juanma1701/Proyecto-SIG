import jsPDF from 'jspdf'
import { FUENTES_DATOS, AVISOS_DATOS, VERSION_USOS } from './fuentesDatos'

// Informe PDF de una zona. Este archivo se carga solo al exportar (import() en
// EstadisticasZona.jsx), por eso jsPDF no pesa en la carga inicial de la app.

const C = {
  marino: [15, 23, 42],
  azul: [37, 99, 235],
  texto: [30, 41, 59],
  suave: [100, 116, 139],
  pista: [226, 232, 240],
  tarjeta: [241, 245, 249],
  claro: [186, 200, 222],
  tinte: [239, 246, 255],
  tinteBorde: [191, 219, 254]
}

function hexARgb(hex) {
  const h = String(hex || '').replace('#', '')
  const c = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return [120, 113, 108]
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]
}

const num = (valor, decimales = 1) =>
  Number.isFinite(Number(valor)) ? Number(valor).toFixed(decimales) : '-'

export function generarInformePDF({
  zona,
  total,
  equipamientos, // cuántos del total son equipamientos (opcional)
  lugares, // cuántos del total son lugares (opcional)
  areaKm2,
  densidad,
  categorias, // [{ etiqueta, cantidad, color }], de mayor a menor
  suelo, // resumenSuelo o null (se usa solo si no hay sueloEstadisticas)
  sueloEstadisticas, // resultado de prepararEstadisticasSuelo o null
  usos, // resultado de prepararUsosParaPDF o null
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
  const Y_INICIO = 58 // donde empieza el contenido en las páginas 2 en adelante
  let y = 0

  // ¿El informe usa datos de OpenStreetMap? (mapa base en la imagen o capa de lugares)
  const usaOSM = Boolean(imagenMapa) || (Number.isFinite(lugares) && lugares > 0)

  const texto = (rgb) => pdf.setTextColor(rgb[0], rgb[1], rgb[2])
  const relleno = (rgb) => pdf.setFillColor(rgb[0], rgb[1], rgb[2])
  const trazo = (rgb) => pdf.setDrawColor(rgb[0], rgb[1], rgb[2])
  const fuente = (estilo, tam) => {
    pdf.setFont('helvetica', estilo)
    pdf.setFontSize(tam)
  }

  function nuevaPagina() {
    pdf.addPage()
    y = Y_INICIO
  }

  function asegurarEspacio(alto) {
    if (y + alto > LIMITE_Y) nuevaPagina()
  }

  function barra(x, yBarra, ancho, alto, proporcion, rgbColor) {
    relleno(C.pista)
    pdf.roundedRect(x, yBarra, ancho, alto, alto / 2, alto / 2, 'F')
    if (proporcion <= 0) return
    const largo = Math.max(alto, ancho * Math.min(1, proporcion))
    relleno(rgbColor)
    pdf.roundedRect(x, yBarra, largo, alto, alto / 2, alto / 2, 'F')
  }

  // Título de sección. `minimo` es el espacio que debe caber debajo para no dejar el
  // título solo al final de una página.
  function titulo(textoTitulo, minimo = 96) {
    y += 12
    asegurarEspacio(minimo)
    texto(C.marino)
    fuente('bold', 14)
    pdf.text(textoTitulo, M, y)
    relleno(C.azul)
    pdf.rect(M, y + 7, 30, 3, 'F')
    y += 28
  }

  // Párrafo: parte el texto en líneas y salta de página línea por línea si hace falta
  function parrafo(contenido, opciones = {}) {
    const {
      tam = 10,
      estilo = 'normal',
      color = C.texto,
      despues = 8,
      x = M,
      ancho = ANCHO_UTIL,
      interlineado = 1.4
    } = opciones
    fuente(estilo, tam)
    const lineas = pdf.splitTextToSize(String(contenido), ancho)
    const alto = tam * interlineado
    lineas.forEach((linea) => {
      asegurarEspacio(alto)
      texto(color)
      fuente(estilo, tam)
      pdf.text(linea, x, y)
      y += alto
    })
    y += despues
  }

  // Nota en cursiva al final de una sección
  function nota(contenido) {
    y += 4
    parrafo(contenido, { tam: 8.5, estilo: 'italic', color: C.suave, despues: 10, interlineado: 1.25 })
  }

  // Fila con etiqueta, valor a la derecha, barra y una línea (o dos) de detalle
  function filaBarra({ etiqueta, valor, proporcion, color, detalle }) {
    const lineasDetalle = detalle ? pdf.splitTextToSize(detalle, ANCHO_UTIL).slice(0, 2) : []
    const alto = 48 + Math.max(0, lineasDetalle.length - 1) * 10
    asegurarEspacio(alto)

    texto(C.texto)
    fuente('bold', 10)
    pdf.text(pdf.splitTextToSize(etiqueta, ANCHO_UTIL - 90)[0], M, y + 8)
    pdf.text(valor, ANCHO - M, y + 8, { align: 'right' })

    barra(M, y + 15, ANCHO_UTIL, 10, proporcion, hexARgb(color))

    texto(C.suave)
    fuente('normal', 8.5)
    lineasDetalle.forEach((linea, i) => pdf.text(linea, M, y + 37 + i * 10))
    y += alto
  }

  // Recuadro azul con las ideas principales del informe, en frases cortas
  function cajaLectura(items) {
    if (items.length === 0) return
    fuente('normal', 10)
    const ancho = ANCHO_UTIL - 46
    const bloques = items.map((t) => pdf.splitTextToSize(t, ancho))
    const totalLineas = bloques.reduce((n, b) => n + b.length, 0)
    const alto = 40 + (totalLineas - 1) * 13.5 + (items.length - 1) * 5 + 16
    asegurarEspacio(alto + 8)

    relleno(C.tinte)
    trazo(C.tinteBorde)
    pdf.setLineWidth(0.75)
    pdf.roundedRect(M, y, ANCHO_UTIL, alto, 8, 8, 'FD')

    texto(C.azul)
    fuente('bold', 10)
    pdf.text('LECTURA RÁPIDA', M + 16, y + 20)

    let ty = y + 40
    bloques.forEach((lineasBloque) => {
      relleno(C.azul)
      pdf.circle(M + 19, ty - 3, 1.8, 'F')
      texto(C.texto)
      fuente('normal', 10)
      lineasBloque.forEach((linea) => {
        pdf.text(linea, M + 30, ty)
        ty += 13.5
      })
      ty += 5
    })

    y += alto + 12
  }

  // ---------- Encabezado de la primera página ----------
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
  texto(C.claro)
  fuente('normal', 9)
  pdf.text('Valle de Aburrá', ANCHO - M, 60, { align: 'right' })

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

    // Crédito del mapa base (OpenStreetMap pide acreditarlo en las imágenes)
    texto(C.suave)
    fuente('italic', 7.5)
    pdf.text('Mapa base: © OpenStreetMap contributors (ODbL)', M, y + LADO + 12)
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

  y += LADO + 36

  // ---------- Lectura rápida (frases simples a partir de los datos) ----------
  const lectura = []

  if (Number.isFinite(Number(total))) {
    const partes = []
    if (areaKm2 != null) partes.push(`en ${Number(areaKm2).toFixed(2)} km²`)
    if (Number.isFinite(equipamientos) && Number.isFinite(lugares)) {
      partes.push(`(${equipamientos} equipamientos y ${lugares} lugares)`)
    }
    let frase = `Hay ${Number(total).toLocaleString('es-CO')} elementos ${partes.join(' ')}`.trim()
    if (densidad != null) frase += `, unos ${Number(densidad).toFixed(1)} por km²`
    lectura.push(frase + '.')
  }

  if (categorias && categorias.length > 0 && total > 0) {
    const top = categorias[0]
    lectura.push(
      `La categoría más frecuente es ${top.etiqueta}: ${top.cantidad} elementos (${((top.cantidad / total) * 100).toFixed(1)} %).`
    )
  }

  if (sueloEstadisticas) {
    const s = sueloEstadisticas
    const claseBase = s.clases.find((c) => c.categoria === s.base.predominante)
    const clasePro = s.clases.find((c) => c.categoria === 'proteccion')
    const claseRie = s.clases.find((c) => c.categoria === 'riesgo')
    const partesSuelo = []
    if (claseBase) {
      partesSuelo.push(
        `Predomina el suelo ${String(claseBase.etiquetaCorta).toLowerCase()} (${claseBase.porcentaje.toFixed(1)} % de la zona).`
      )
    }
    if (clasePro && claseRie) {
      partesSuelo.push(
        `El ${clasePro.porcentaje.toFixed(1)} % está en suelo de protección y el ${claseRie.porcentaje.toFixed(1)} % en zona de riesgo.`
      )
    }
    if (partesSuelo.length > 0) lectura.push(partesSuelo.join(' '))
  }

  if (usos && usos.categorias && usos.categorias.length > 0) {
    lectura.push(
      `Según el POT de Medellín, el uso con mayor superficie es “${usos.mayor || 'sin datos'}”; el ${usos.sinDatoPct.toFixed(1)} % de la zona no tiene información en esa capa.`
    )
  }

  if (riesgo) {
    lectura.push(
      `${riesgo.enProteccion} equipamientos están en suelo de protección y ${riesgo.enRiesgo} en zona de riesgo (de ${riesgo.total} analizados).`
    )
  }

  if (cobertura) {
    lectura.push(
      `El ${Number(cobertura.coberturaPct).toFixed(1)} % de la zona queda a menos de ${cobertura.bufferM} m de un servicio (${cobertura.etiqueta}).`
    )
  }

  cajaLectura(lectura)

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

  // ---------- Clasificación del suelo (POT) ----------
  if (sueloEstadisticas || (suelo && suelo.length > 0)) {
    titulo('Clasificación del suelo (POT)')

    if (sueloEstadisticas) {
      const s = sueloEstadisticas
      const claseBase = s.clases.find((c) => c.categoria === s.base.predominante)
      const predominante = claseBase
        ? `${claseBase.etiquetaCorta} (${claseBase.porcentaje.toFixed(1)} %)`
        : 'sin datos'

      parrafo(
        `Área analizada: ${s.zonaKm2.toFixed(2)} km² · Base predominante (urbano/rural): ${predominante} · Sin clasificar: ${s.base.sinClasificarPct.toFixed(1)} %`,
        { despues: 10 }
      )

      s.clases.forEach((c) => {
        filaBarra({
          etiqueta: c.etiqueta,
          valor: `${c.porcentaje.toFixed(1)} %`,
          proporcion: c.porcentaje / 100,
          color: c.color,
          detalle: `${c.areaKm2.toFixed(2)} km² de superficie · ${c.poligonos} polígonos de origen`
        })

        c.subclases.forEach((sub) => {
          asegurarEspacio(14)
          texto(C.texto)
          fuente('normal', 8.5)
          pdf.text(`- ${sub.etiqueta}: ${sub.porcentaje.toFixed(1)} % (${sub.areaKm2.toFixed(2)} km²)`, M + 14, y)
          y += 13
        })
        if (c.subclases.length > 0) y += 6
      })

      if (s.combinaciones.length > 0) {
        asegurarEspacio(50)
        texto(C.texto)
        fuente('bold', 10)
        pdf.text('Superficie donde coinciden dos clases', M, y + 4)
        y += 22
        s.combinaciones.forEach((c) => {
          asegurarEspacio(16)
          texto(C.texto)
          fuente('normal', 9.5)
          pdf.text(c.etiqueta.replace(' ∩ ', ' y '), M, y)
          fuente('bold', 9.5)
          pdf.text(`${c.areaKm2.toFixed(2)} km² · ${c.porcentaje.toFixed(1)} %`, ANCHO - M, y, { align: 'right' })
          y += 16
        })
      }
    } else {
      suelo.forEach((f) => {
        const pct = Number(f.porcentaje) || 0
        filaBarra({
          etiqueta: f.etiqueta,
          valor: `${pct.toFixed(1)} %`,
          proporcion: pct / 100,
          color: f.color,
          detalle: `${num(f.areaKm2, 2)} km² · ${f.poligonos} polígonos`
        })
      })
    }

    nota(
      'Porcentaje de superficie sobre el área de la zona (cálculo geodésico). Las clases se superponen (protección y riesgo cubren parte del suelo urbano y rural), por eso no suman 100 %. El número de polígonos es de elementos de la fuente y no es comparable con la superficie. Es clasificación del suelo del POT, no uso del suelo.'
    )
  }

  // ---------- Usos del suelo oficiales (POT 48 de 2014, Medellín) ----------
  if (usos && usos.categorias && usos.categorias.length > 0) {
    titulo('Usos del suelo (POT 48 de 2014 - Medellín)')

    parrafo(
      `Área analizada: ${usos.zonaKm2.toFixed(2)} km² · Mayor superficie: ${usos.mayor || 'sin datos'} · Sin información en la capa: ${usos.sinDatoPct.toFixed(1)} %`,
      { despues: 10 }
    )

    usos.categorias.forEach((c) => {
      filaBarra({
        etiqueta: c.titulo,
        valor: `${c.porcentaje.toFixed(1)} %`,
        proporcion: c.porcentaje / 100,
        color: c.color,
        detalle: `${c.areaKm2.toFixed(2)} km² · Nombre oficial: ${c.oficial}`
      })
    })

    asegurarEspacio(20)
    texto(C.texto)
    fuente('normal', 9.5)
    pdf.text(
      `Sin información en esta capa: ${usos.sinDatoKm2.toFixed(2)} km² (${usos.sinDatoPct.toFixed(1)} %)`,
      M,
      y
    )
    y += 18

    nota(
      `Fuente: Alcaldía de Medellín, Departamento Administrativo de Planeación (POT, Acuerdo 48 de 2014). ${VERSION_USOS} Indica para qué se permite usar el suelo según el plan de la ciudad, no lo que existe hoy. Solo cubre el suelo urbano de Medellín; la Alcaldía la describe como una aproximación técnica. Esta capa corresponde al POT de 2014: en noviembre de 2026 el Concejo de Medellín aprobó una revisión del POT. "Sin información" es la parte de la zona sin ningún polígono de esta fuente (suelo rural, otros municipios o huecos de la capa). Los títulos simples son texto de la aplicación; el nombre oficial es el de la fuente. No existe una categoría comercial pura: el comercio aparece dentro de las áreas de media y alta mixtura. Porcentajes de superficie (geometría original).`
    )
  }

  // ---------- Equipamientos en suelo de protección o riesgo ----------
  if (riesgo) {
    titulo('Equipamientos en suelo de protección o riesgo')
    parrafo(
      `${riesgo.enProteccion} en suelo de protección · ${riesgo.enRiesgo} en zona de riesgo (de ${riesgo.total} analizados)`,
      { despues: 8 }
    )
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
    titulo(`Cobertura de servicios: ${cobertura.etiqueta}`)
    const pct = Number(cobertura.coberturaPct) || 0
    filaBarra({
      etiqueta: `Área a menos de ${cobertura.bufferM} m de un servicio`,
      valor: `${pct.toFixed(1)} %`,
      proporcion: pct / 100,
      color: '#16a34a',
      detalle: `${cobertura.deficitKm2} km² sin cobertura de ${cobertura.zonaKm2} km² · ${cobertura.servicios} servicios considerados`
    })
    nota('La cobertura se mide en línea recta, no por las calles.')
  }

  // ---------- Teselado de equipamientos ----------
  if (teselado) {
    titulo(`Teselado de equipamientos (hexágonos de ${teselado.ladoM} m)`)
    parrafo(
      `${teselado.totalEquipamientos} equipamientos en ${teselado.celdasConEquipamientos} de ${teselado.celdasTotal} celdas · máximo ${teselado.maxPorCelda} en una celda`,
      { despues: 8 }
    )

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

    nota(
      'Solo cuenta equipamientos del AMVA, por eso difiere del total de arriba, que incluye lugares. Las celdas del borde se ven completas, pero solo cuentan lo que cae dentro del círculo.'
    )
  }

  // ---------- Fuentes, licencias y advertencias ----------
  titulo('Fuentes, licencias y advertencias', 130)

  const fuentesUsadas = FUENTES_DATOS.filter(
    (f) => f.id === 'amva' || (f.id === 'osm' && usaOSM) || (f.id === 'alcaldia' && usos)
  )

  fuentesUsadas.forEach((f) => {
    asegurarEspacio(60)
    texto(C.texto)
    fuente('bold', 10)
    pdf.text(f.titulo, M, y)
    y += 13
    parrafo(f.usa, { tam: 9, estilo: 'bold', color: C.suave, despues: 1 })
    parrafo(f.texto, { tam: 9, color: C.suave, despues: 1 })
    if (f.enlace) {
      asegurarEspacio(14)
      texto(C.azul)
      fuente('normal', 9)
      pdf.textWithLink(f.enlace.texto, M, y, { url: f.enlace.url })
      y += 14
    }
    y += 6
  })

  asegurarEspacio(40)
  texto(C.texto)
  fuente('bold', 10)
  pdf.text('Advertencias', M, y)
  y += 13
  AVISOS_DATOS.forEach((aviso) => {
    parrafo(`- ${aviso}`, { tam: 9, color: C.suave, despues: 3, x: M + 4, ancho: ANCHO_UTIL - 4 })
  })

  // ---------- Encabezado corriente y pie de página en todas las hojas ----------
  const partesFuentes = ['AMVA']
  if (usaOSM) partesFuentes.push('OpenStreetMap contributors')
  if (usos) partesFuentes.push('Alcaldía de Medellín')
  const fuentesDatos =
    partesFuentes.length > 1
      ? `${partesFuentes.slice(0, -1).join(', ')} y ${partesFuentes[partesFuentes.length - 1]}`
      : partesFuentes[0]

  const paginas = pdf.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    pdf.setPage(i)

    // Encabezado discreto desde la segunda página
    if (i > 1) {
      texto(C.suave)
      fuente('normal', 8)
      pdf.text(
        pdf.splitTextToSize(`Informe de zona · ${String(zona.nombre)}`, ANCHO_UTIL - 90)[0],
        M,
        26
      )
      pdf.text('GeoAburrá', ANCHO - M, 26, { align: 'right' })
      trazo(C.pista)
      pdf.setLineWidth(0.75)
      pdf.line(M, 33, ANCHO - M, 33)
    }

    // Pie
    trazo(C.pista)
    pdf.setLineWidth(0.75)
    pdf.line(M, ALTO - 40, ANCHO - M, ALTO - 40)
    texto(C.suave)
    fuente('normal', 8)
    pdf.text(`GeoAburrá · Datos: ${fuentesDatos}`, M, ALTO - 28)
    pdf.text(`Página ${i} de ${paginas}`, ANCHO - M, ALTO - 28, { align: 'right' })
    if (usaOSM) {
      fuente('normal', 7)
      pdf.text('Mapa base y lugares: © OpenStreetMap contributors (ODbL) · openstreetmap.org/copyright', M, ALTO - 17)
    }
  }

  pdf.save(nombreArchivo)
}