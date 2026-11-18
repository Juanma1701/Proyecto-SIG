// Norma urbanística de Itagüí: Acuerdo 09 de 2023 (revisión y ajuste de largo plazo del POT).
// Archivo único de datos, generado por scripts/unificar-itagui.mjs a partir de los archivos por tandas de lectura
// (tipologías C/S/R/I/D, zonas residenciales, comerciales, de expansión y de actividad múltiple, ruido,
// reglas dotacionales y disposiciones). Desde aquí se edita a mano.
// Todo se transcribió de la imagen del PDF escaneado (214 páginas); las páginas citadas son páginas del PDF.
// Las limitaciones conocidas (rural, inventario ZU-D, geometría) están en el campo `limitaciones`.

import { congelar } from './esquema.js'

export const ITAGUI = congelar({
  "municipioSlug": "Itagui",
  "nombre": "Acuerdo 09 de 2023 (revisión y ajuste de largo plazo del POT de Itagüí)",
  "tipo": "acuerdo",
  "numero": "09",
  "anio": 2023,
  "fechaAdopcion": "2023-12-05",
  "fechaConsulta": "2026-11-14",
  "vigencia": {
    "estado": "vigente_segun_fuente_municipal",
    "fuente": "Documentos municipales de Itagüí (decretos en proyecto y documento técnico DIVIPOLA, 2024) lo citan como POT vigente. No se verificó en la Gaceta."
  },
  "cobertura": "parcial",
  "fuente": {
    "url": "https://itagui.gov.co/kcfinder/upload/files/Acuerdo-09-diciembre-05-de-2023.pdf",
    "nota": "PDF escaneado de 214 páginas sin texto. Las páginas citadas son páginas del PDF, no del documento."
  },
  "capaAmva": {
    "servicio": "POT_Itagui",
    "capaId": 2,
    "nota": "Hipótesis sin confirmar: esa capa sigue una norma anterior (usa palabras y códigos distintos de este acuerdo). No usarla como norma vigente."
  },
  "tipologias": [
    {
      "codigo": "C-1",
      "uso": "comercial",
      "nombre": "Comercio minorista básico, de índole cotidiana",
      "areaMinimaM2": 10,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Se admiten combinaciones de dos o más actividades de la tipología si no hay incompatibilidad.", "Incluye la venta de licor sin consumo en el establecimiento.", "Los establecimientos con música deben estar insonorizados.", "Puede ejercerse por debajo del área mínima sin abrir folio de matrícula inmobiliaria."],
      "remite": ["C-11 (locales de más de 500 m²)"],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 122,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-2",
      "uso": "comercial",
      "nombre": "Comercio minorista de tipo medio y de índole frecuente (licoreras y estanquillos)",
      "areaMinimaM2": 20,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "establecimientos de educación básica primaria, secundaria y media, y servicios religiosos",
          "metros": 40,
          "medidaEntre": "accesos de ambos establecimientos"
        },
        {
          "destino": "centros asistenciales, hospitales o clínicas y hogares geriátricos",
          "metros": 40,
          "medidaEntre": "puntos más próximos de ambos predios"
        }
      ],
      "restricciones": ["No se puede vender licor con consumo en el establecimiento."],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 122,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-3",
      "uso": "comercial",
      "nombre": "Comercio minorista de tipo barrial, de índole suntuario",
      "areaMinimaM2": 10,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["No se permite la venta de materiales de playa para la construcción (ver C-5)."],
      "remite": ["C-4 (áreas mayores a 200 m²)"],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 122,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-4",
      "uso": "comercial",
      "nombre": "Comercio industrial liviano",
      "areaMinimaM2": 200,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["No se permite la venta de materiales de playa para la construcción (ver C-5).", "El comercio de motocicletas debe cumplir las restricciones del Acuerdo 06 de 2014 o la norma que lo modifique."],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 122,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-5",
      "uso": "comercial",
      "nombre": "Comercio industrial pesado",
      "areaMinimaM2": 200,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe tener área de cargue y descargue dentro del establecimiento.", "Se admiten combinaciones de actividades de la tipología, sin combinar depósito o expendio simultáneo de materiales potencialmente tóxicos o peligrosos."],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 122,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-6",
      "uso": "comercial",
      "nombre": "Comercio de recuperación de materiales",
      "areaMinimaM2": 200,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 50
        }
      ],
      "restricciones": [],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-7",
      "uso": "comercial",
      "nombre": "Comercio automotriz",
      "areaMinimaM2": 300,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": [],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-8",
      "uso": "comercial",
      "nombre": "Comercio mayorista",
      "areaMinimaM2": 200,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": [],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-9",
      "uso": "comercial",
      "nombre": "Comercio mayorista de exposición (galerías)",
      "areaMinimaM2": 100,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": [],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-10",
      "uso": "comercial",
      "nombre": "Centrales mayoristas de abastos",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": [],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-11",
      "uso": "comercial",
      "nombre": "Supermercados y almacenes por departamentos",
      "areaMinimaM2": 500,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Todo establecimiento comercial de más de 500 m² requiere 1 parqueadero por cada 100 m² de área de comercialización; puede compensarse según reglamentación posterior."],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-12",
      "uso": "comercial",
      "nombre": "Centros comerciales",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["El cálculo de parqueaderos sale de un estudio de tránsito anexo a la licencia urbanística."],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-13",
      "uso": "comercial",
      "nombre": "Pasajes comerciales",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": [],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "C-14",
      "uso": "comercial",
      "nombre": "Comercio de alto riesgo",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["No se permite."],
      "remite": [],
      "fuente": {
        "articulo": "175",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-1",
      "uso": "servicios",
      "nombre": "Servicios mayores de reparación y mantenimiento",
      "areaMinimaM2": 200,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 15
        }
      ],
      "restricciones": ["En áreas descubiertas pueden funcionar si se cumplen los requisitos de ubicación: lote en piso duro y muro de cierre de al menos 3 m.", "También pueden funcionar en unidades industriales cerradas, según su reglamentación."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-2",
      "uso": "servicios",
      "nombre": "Servicios medios de reparación, mantenimiento de equipo industrial y talleres industriales en escala pesada",
      "areaMinimaM2": 200,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 15
        }
      ],
      "restricciones": [],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-3",
      "uso": "servicios",
      "nombre": "Talleres industriales en escala media",
      "areaMinimaM2": 70,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas (en reparación de muebles)",
          "metros": 15
        }
      ],
      "restricciones": ["Debe cumplir las restricciones del Acuerdo 06 de 2014 y las normas que lo modifiquen."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 124,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-4",
      "uso": "servicios",
      "nombre": "Talleres de servicio liviano",
      "areaMinimaM2": 10,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Puede ejercerse por debajo del área mínima sin abrir folio de matrícula inmobiliaria."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 124,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-5",
      "uso": "servicios",
      "nombre": "Servicios medios y específicos",
      "areaMinimaM2": 20,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["En zonas residenciales no se permiten los códigos CIIU 9601, 1811, 1812, 5621 y 7120."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 124,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-6",
      "uso": "servicios",
      "nombre": "Servicios personales",
      "areaMinimaM2": 30,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "establecimientos de educación básica primaria, secundaria y media, y servicios religiosos",
          "metros": 40,
          "medidaEntre": "accesos de ambos establecimientos"
        },
        {
          "destino": "centros asistenciales, hospitales o clínicas y hogares geriátricos, seminarios y conventos",
          "metros": 40,
          "medidaEntre": "puntos más próximos de ambos predios"
        }
      ],
      "restricciones": ["Los juegos electrónicos de suerte y azar solo van en establecimientos dedicados exclusivamente a esa actividad, sin venta ni consumo de licor.", "Máximo tres establecimientos de esta tipología por lado de manzana, salvo en el polígono ZU_C_01, donde no aplica la restricción de saturación.", "Los establecimientos con música deben estar insonorizados."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 124,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-7",
      "uso": "servicios",
      "nombre": "Servicios personales generales",
      "areaMinimaM2": 10,
      "areaMinimaLoteM2": null,
      "variantes": [
        {
          "descripcion": "restaurantes y cafeterías",
          "areaMinimaM2": 30
        }
      ],
      "retiros": [],
      "restricciones": ["No se puede vender licor con consumo en el establecimiento, solo como acompañante o aperitivo de las comidas."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 124,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-8",
      "uso": "servicios",
      "nombre": "Servicios de oficina",
      "areaMinimaM2": 10,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": [],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 124,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-9",
      "uso": "servicios",
      "nombre": "Servicios básicos",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["No se permiten cajeros automáticos adosados a la fachada.", "Debe haber un área interna para la zona de cajeros de al menos 10 m²."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 124,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-10",
      "uso": "servicios",
      "nombre": "Servicios generales de depósito y logística (bodegas)",
      "areaMinimaM2": 100,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["No se permite el almacenamiento de sustancias peligrosas.", "No se permite sobre el corredor del Metroplús."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 125,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-11",
      "uso": "servicios",
      "nombre": "Servicios al vehículo liviano y motocicletas",
      "areaMinimaM2": 50,
      "areaMinimaLoteM2": null,
      "variantes": [
        {
          "descripcion": "servicios para motos",
          "areaMinimaM2": 50
        },
        {
          "descripcion": "servicios para vehículos livianos",
          "areaMinimaM2": 150
        }
      ],
      "retiros": [],
      "restricciones": ["Debe cumplir las restricciones del Acuerdo 06 de 2014 o la norma que lo modifique.", "El acceso para parqueaderos, lavaderos y talleres de motos debe ser de al menos 2,0 m.", "En polígonos residenciales se prohíben las actividades de mantenimiento y lavado.", "Parqueaderos de más de 30 celdas requieren estudio de tránsito (art. 2.2.6.1.2.1.12 del Decreto Único del Sector Vivienda)."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 125,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-12",
      "uso": "servicios",
      "nombre": "Servicios al vehículo pesado",
      "areaMinimaM2": 600,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 15
        }
      ],
      "restricciones": ["Debe cumplir las restricciones del Acuerdo 06 de 2014 o la norma que lo modifique.", "Parqueaderos de más de 30 celdas requieren estudio de tránsito."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 125,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-13",
      "uso": "servicios",
      "nombre": "Servicios funerarios",
      "areaMinimaM2": 60,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 15,
          "medidaEntre": "accesos de ambos predios"
        }
      ],
      "restricciones": ["Solo se permiten salas de velación; las demás actividades del código S9603 solo en el parque cementerio Jardines Montesacro."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 125,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-14",
      "uso": "servicios",
      "nombre": "Servicios personales especiales (alojamiento)",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": 120,
      "variantes": [],
      "retiros": [
        {
          "destino": "establecimientos educativos, hospitalarios, hogares geriátricos, servicios religiosos y similares",
          "metros": 40
        }
      ],
      "restricciones": [],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 125,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "R-U",
      "uso": "residencial",
      "nombre": "Vivienda unifamiliar",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Edificación en un lote, de uno o más pisos, para una sola vivienda."],
      "remite": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "R-B",
      "uso": "residencial",
      "nombre": "Vivienda bifamiliar",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Edificación en un lote, de uno o más pisos, para dos viviendas."],
      "remite": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "R-T",
      "uso": "residencial",
      "nombre": "Vivienda trifamiliar",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Edificación en un lote, de uno o más pisos, para tres viviendas."],
      "remite": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "R-M1",
      "uso": "residencial",
      "nombre": "Vivienda multifamiliar 1",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Edificación de más de tres viviendas, de máximo tres pisos."],
      "remite": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "R-M2",
      "uso": "residencial",
      "nombre": "Vivienda multifamiliar 2",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Edificación de más de tres viviendas, de más de tres y hasta cinco pisos."],
      "remite": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "R-M3",
      "uso": "residencial",
      "nombre": "Vivienda multifamiliar 3",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Edificios y conjuntos multifamiliares de seis o más pisos, en suelo urbano."],
      "remite": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-15",
      "uso": "servicios",
      "nombre": "Servicios especiales (salud y estética)",
      "areaMinimaM2": 10,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["No se permite cirugía ni hospitalización (exclusivas de las edificaciones D-3).", "Se excluyen las actividades de servicios personales reguladas por S-23.", "En consultorios veterinarios no se permite hospitalización, solo cirugías ambulatorias."],
      "remite": ["S-23", "D-3"],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 126,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-16",
      "uso": "servicios",
      "nombre": "Servicios religiosos",
      "areaMinimaM2": 150,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "establecimientos con tipología S-6 y C-2",
          "metros": 40,
          "medidaEntre": "accesos de ambos establecimientos"
        }
      ],
      "restricciones": ["El área mínima es de 150 m² en una sola planta.", "Debe cumplir normas urbanísticas y constructivas específicas que garanticen condiciones locativas adecuadas."],
      "remite": ["D-12 (el parágrafo 2 permite optar por equipamiento religioso)"],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 126,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-17",
      "uso": "servicios",
      "nombre": "Estaciones de servicio",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 50
        },
        {
          "destino": "establecimientos educativos, hospitalarios y hogares geriátricos",
          "metros": 50
        }
      ],
      "restricciones": ["Área mínima y retiros a linderos según la Norma Técnica de Construcción."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 126,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-18",
      "uso": "servicios",
      "nombre": "Servicios de esparcimiento (cine y teatros)",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["El área mínima del local sale de la Norma Técnica de Construcción."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 126,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-19",
      "uso": "servicios",
      "nombre": "Servicio de telecomunicaciones",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normatividad sectorial vigente para este uso."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 126,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-20",
      "uso": "servicios",
      "nombre": "Servicios ecológicos",
      "areaMinimaM2": 200,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 50
        }
      ],
      "restricciones": ["El tratamiento de residuos peligrosos solo se permite en el polígono ZU-AM-25, en las manzanas entre las calles 25 y 27 y entre la carrera 42 y el corredor del río, con máximo 2 operadores locales.", "Se prohíbe el tratamiento por incineración."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 126,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-21",
      "uso": "servicios",
      "nombre": "Servicios ecoturísticos y hospedaje hotelero (campin y glamping)",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normatividad vigente para este uso."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 126,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-22",
      "uso": "servicios",
      "nombre": "Servicios de hoteles",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": 120,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Un parqueadero como mínimo por cada tres habitaciones, conforme a la reglamentación complementaria."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 126,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-23",
      "uso": "servicios",
      "nombre": "Servicios de alto impacto social",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Actividad sujeta a reglamentación específica."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-24",
      "uso": "servicios",
      "nombre": "CDA para vehículos livianos y motos",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la NTC 5385 de 2014 o la norma que la modifique o sustituya."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-25",
      "uso": "servicios",
      "nombre": "CDA para vehículos pesados",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la NTC 5385 de 2014 o la norma que la modifique o sustituya."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "S-26",
      "uso": "servicios",
      "nombre": "Servicio de entretenimiento por plataformas digitales para adultos en la web",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "establecimientos educativos",
          "metros": 80,
          "medidaEntre": "accesos de ambos establecimientos"
        }
      ],
      "restricciones": ["En el predio no puede existir ningún inmueble con destinación residencial."],
      "remite": [],
      "fuente": {
        "articulo": "176",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "I-3",
      "uso": "industrial",
      "nombre": "Industria mediana",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 15
        }
      ],
      "restricciones": ["Área construida mayor a 600 m²."],
      "remite": [],
      "fuente": {
        "articulo": "177",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "I-4",
      "uso": "industrial",
      "nombre": "Industria liviana",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 15
        }
      ],
      "restricciones": ["Área construida menor o igual a 600 m²."],
      "remite": [],
      "fuente": {
        "articulo": "177",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "I-5",
      "uso": "industrial",
      "nombre": "Industria artesanal o familiar",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["El área construida debe ser menor o igual a 200 m²; si se supera, se clasifica como I-4.", "No puede estar en unidades residenciales cerradas.", "No se permite si en los pisos inferiores se localiza vivienda."],
      "remite": ["I-4"],
      "fuente": {
        "articulo": "177",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-1",
      "uso": "dotacional",
      "nombre": "Deportivas y recreativas",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos deportivos y recreativos."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-2",
      "uso": "dotacional",
      "nombre": "Educativas",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos educativos."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-3",
      "uso": "dotacional",
      "nombre": "Salud",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos de salud."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-4",
      "uso": "dotacional",
      "nombre": "Bienestar social",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos de bienestar social."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-5",
      "uso": "dotacional",
      "nombre": "Administración pública",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos de administración pública."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-6",
      "uso": "dotacional",
      "nombre": "Seguridad",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos de seguridad."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-7",
      "uso": "dotacional",
      "nombre": "Transporte",
      "areaMinimaM2": 300,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Se permite combinarla con las tipologías de servicios, comerciales y residenciales."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-8",
      "uso": "dotacional",
      "nombre": "Cultura",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos culturales."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-9",
      "uso": "dotacional",
      "nombre": "Prevención y atención de desastres",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos de prevención y atención de desastres."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-10",
      "uso": "dotacional",
      "nombre": "Comunitario",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos comunitarios."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-11",
      "uso": "dotacional",
      "nombre": "Servicios públicos (plantas de tratamiento y subestaciones eléctricas)",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [
        {
          "destino": "viviendas",
          "metros": 30
        },
        {
          "destino": "establecimientos educativos, hospitalarios, hogares geriátricos, seminarios y conventos",
          "metros": 30
        }
      ],
      "restricciones": ["Los equipamientos y áreas de disposición de residuos no pueden ocupar espacio público (andenes, zonas verdes, antejardines y vías)."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "D-12",
      "uso": "dotacional",
      "nombre": "Religioso",
      "areaMinimaM2": null,
      "areaMinimaLoteM2": null,
      "variantes": [],
      "retiros": [],
      "restricciones": ["Debe cumplir la normativa específica de los equipamientos religiosos."],
      "remite": [],
      "fuente": {
        "articulo": "178",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    }
  ],
  "zonas": [
    {
      "codigo": "ZU-AM-01",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Calle 27, desde la carrera 64 hasta la carrera 70.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-3", "S-4", "S-5", "S-6", "S-11", "S-16", "S-19", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "182",
        "paginaPdf": 136,
        "verificacion": "transcrito_de_imagen"
      },
      "marcas": {},
      "notasMarcas": {}
    },
    {
      "codigo": "ZU-AM-02",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Carrera 70, desde la calle 27 hasta la calle 36.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "C-1", "C-9", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "S-3", "S-4", "S-5", "S-11", "S-16", "S-19", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "182",
        "paginaPdf": 136,
        "verificacion": "transcrito_de_imagen"
      },
      "marcas": {},
      "notasMarcas": {}
    },
    {
      "codigo": "ZU-AM-04",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Carrera 61, desde la calle 36 hasta la calle 38.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "S-5", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-3", "S-4", "S-6", "S-11", "S-16", "S-19", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "182",
        "paginaPdf": 136,
        "verificacion": "transcrito_de_imagen"
      },
      "marcas": {},
      "notasMarcas": {}
    },
    {
      "codigo": "ZU-R-01",
      "areaActividad": "residencial",
      "delimitacion": "Sector San Fernando.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "C-2", "I-5", "S-4", "S-5", "S-6", "S-11", "S-14", "S-16", "S-19", "S-22", "D-1", "D-2", "D-3"],
      "marcas": {
        "C-2": "*",
        "S-6": "*"
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La capa oficial del municipio no lista S-14 ni S-22 entre los condicionados de esta zona, pero la transcripción del acuerdo sí. Falta contrastar con el PDF (art. 181, p. 131) [verificar]."],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      },
      "notasMarcas": {
        "*": {
          "texto": "Sobre la calle 87 el uso se restringe; en el resto del polígono se prohíbe.",
          "paginaPdf": 134,
          "restoDelPoligono": "prohibido"
        }
      }
    },
    {
      "codigo": "ZU-R-02",
      "areaActividad": "residencial",
      "delimitacion": "Sector Santa María N. 3.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {},
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      },
      "notasMarcas": {}
    },
    {
      "codigo": "ZU-R-03",
      "areaActividad": "residencial",
      "delimitacion": "Sector Santa María N. 2.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-3", "S-4", "S-5", "S-6", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "C-2": "*",
        "C-3": "*",
        "S-6": "*",
        "S-11": "*"
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      },
      "notasMarcas": {
        "*": {
          "texto": "Sobre la carrera 50, la carrera 50A entre calles 77B y 83 y la calle 77 entre carreras 50 y 52; en el resto del polígono se prohíbe.",
          "paginaPdf": 134,
          "restoDelPoligono": "prohibido"
        }
      }
    },
    {
      "codigo": "ZU-R-24",
      "areaActividad": "residencial",
      "delimitacion": "Sector Asturias.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-4", "S-5", "S-6", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {
        "C-2": "*",
        "C-3": "*",
        "S-6": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se restringe en la carrera 47; en el resto del polígono se prohíbe.",
          "paginaPdf": 135,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "181",
        "paginaPdf": 134,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-25",
      "areaActividad": "residencial",
      "delimitacion": "Sectores El Porvenir, Los Gómez y El Ajizal.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-4", "S-5", "S-6", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "C-2": "*",
        "S-6": "*",
        "C-3": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Sobre la vía principal de El Ajizal, El Porvenir y Los Gómez, C-2 se considera permitida con retiro de 100 m a otra C-2, y S-6 con área mínima de 30 m² y retiro de 100 m a otra S-6. En el resto del polígono se prohíbe.",
          "paginaPdf": 135,
          "restoDelPoligono": "prohibido",
          "condiciones": {
            "C-2": {
              "retiroAOtraDeLaMismaTipologiaM": 100
            },
            "S-6": {
              "areaMinimaM2": 30,
              "retiroAOtraDeLaMismaTipologiaM": 100
            }
          }
        },
        "**": {
          "texto": "Se restringe sobre la vía principal de El Ajizal, El Porvenir y Los Gómez; en el resto del polígono se prohíbe.",
          "paginaPdf": 135,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "181",
        "paginaPdf": 134,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-26",
      "areaActividad": "residencial",
      "delimitacion": "Sector El Pedregal.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-4", "S-5", "S-6", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "C-2": "*",
        "S-6": "*",
        "C-3": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Sobre la vía principal de El Pedregal, C-2 se considera permitida con retiro de 100 m a otra C-2, y S-6 con área mínima de 30 m² y retiro de 100 m a otra S-6. En el resto del polígono se prohíbe.",
          "paginaPdf": 135,
          "restoDelPoligono": "prohibido",
          "condiciones": {
            "C-2": {
              "retiroAOtraDeLaMismaTipologiaM": 100
            },
            "S-6": {
              "areaMinimaM2": 30,
              "retiroAOtraDeLaMismaTipologiaM": 100
            }
          }
        },
        "**": {
          "texto": "Se restringe sobre la vía principal de El Pedregal; en el resto del polígono se prohíbe.",
          "paginaPdf": 135,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "181",
        "paginaPdf": 134,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-27",
      "areaActividad": "residencial",
      "delimitacion": "Sectores La Gloria, Araucaria y San José.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-4", "S-5", "S-6", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {
        "C-2": "*",
        "C-3": "*",
        "S-6": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se restringe en las carreras 47 y 48; en el resto del polígono se prohíbe.",
          "paginaPdf": 135,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "181",
        "paginaPdf": 134,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-28",
      "areaActividad": "residencial",
      "delimitacion": "Sector La María.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "C-3": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se restringe sobre la vía principal La María; en el resto del polígono se prohíbe.",
          "paginaPdf": 135,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "181",
        "paginaPdf": 134,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZE-R-01",
      "areaActividad": "residencial (expansión urbana)",
      "delimitacion": "Sector La María.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "C-1", "S-7", "S-8", "S-15", "D-5", "D-10"],
      "condicionados": ["C-2", "C-3", "S-5", "S-9", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "C-2": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo en áreas comerciales.",
          "paginaPdf": 135,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "181",
        "paginaPdf": 135,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZE-R-02",
      "areaActividad": "residencial (expansión urbana)",
      "delimitacion": "Expansión corregimiento.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-5", "S-9", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "C-2": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo en áreas comerciales.",
          "paginaPdf": 135,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La capa oficial del municipio no lista D-8 entre los compatibles de esta zona, pero la transcripción del acuerdo sí (ZE-R-01 no lo trae). Falta contrastar con el PDF (art. 181, p. 135) [verificar]."],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 135,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-C-01",
      "areaActividad": "comercial",
      "delimitacion": "Centro.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-4", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-8", "C-9", "S-3", "S-4", "S-6", "S-10", "S-11", "S-13", "S-16", "S-19", "S-22", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3", "D-6"],
      "marcas": {
        "S-13": "*",
        "D-6": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 144,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Excepto cárceles y centros de reclusión.",
          "paginaPdf": 144,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "183",
        "paginaPdf": 143,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-C-02",
      "areaActividad": "comercial",
      "delimitacion": "Sector Las Mercedes.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-4", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-9", "S-3", "S-4", "S-6", "S-11", "S-13", "S-16", "S-19", "S-22", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "S-13": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 144,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "183",
        "paginaPdf": 143,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-C-03",
      "areaActividad": "comercial",
      "delimitacion": "Santa María II.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-4", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-8", "C-9", "S-4", "S-6", "S-10", "S-11", "S-16", "S-19", "S-24", "S-26", "I-4", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "S-10": "*",
        "I-4": "*",
        "C-2": "**",
        "S-6": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo lo relacionado con la confección, la moda y el calzado.",
          "paginaPdf": 144,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Sobre las calles 72, 77 y 80 el uso es restringido; en el resto del polígono se prohíbe.",
          "paginaPdf": 144,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "183",
        "paginaPdf": 143,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-C-04",
      "areaActividad": "comercial",
      "delimitacion": "Centro de la Moda.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-4", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-5", "C-7", "C-8", "C-9", "S-3", "S-4", "S-6", "S-10", "S-11", "S-13", "S-16", "S-19", "S-22", "S-24", "S-26", "I-3", "I-4", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "C-5": "*",
        "S-13": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo en bodegas ubicadas entre la calle 72A y la calle 76 y entre la carrera 54 y la carrera 57, exceptuando los códigos CIIU 4664 y 4661; en el resto del polígono se prohíbe.",
          "paginaPdf": 144,
          "restoDelPoligono": "prohibido"
        },
        "**": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 144,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "fuente": {
        "articulo": "183",
        "paginaPdf": 143,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-04",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Santa María N. 1, Balcones de Sevilla, Ferrara, Loma Linda, Terranova.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["El texto del acuerdo no lista R-M1 entre los compatibles de esta zona (R-U, R-B, R-T, R-M2, R-M3)."],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 131,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-05",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Simón Bolívar, La Esmeralda.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "S-22", "D-1", "D-2", "D-3"],
      "marcas": {
        "S-22": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se permite sobre el corredor de la carrera 52 entre calles 63 y 64.",
          "paginaPdf": 134,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["En la tabla impresa se lee \"S-22* I-5\" sin separador entre ambos códigos."],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 132,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-06",
      "areaActividad": "residencial",
      "delimitacion": "Sectores La Aldea, Las Américas, El Tablazo, Calatrava.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 132,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-07",
      "areaActividad": "residencial",
      "delimitacion": "Sectores El Progreso, Fátima, El Rosario, Barrio Olivares, Loma de los Zuleta.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "C-3": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se restringe en la calle 48 y la 47C (vía principal al Pedregal); en el resto del polígono se prohíbe.",
          "paginaPdf": 134,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 132,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-08",
      "areaActividad": "residencial",
      "delimitacion": "Sectores La Unión, El Rosario, Santa María la Nueva, Barrio Olivares.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["R-M2", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {
        "R-M2": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "No se permite en el barrio Los Olivares por encima de la cota 1590 msnm.",
          "paginaPdf": 134,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La tabla escribe \"RM-1\" y \"RM-2*\" sin el guion interno; aquí se normalizan a R-M1 y R-M2."],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 132,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-09",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Playa Rica.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 132,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-10",
      "areaActividad": "residencial",
      "delimitacion": "Sectores San Isidro, Glorieta Pilsen.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 132,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-11",
      "areaActividad": "residencial",
      "delimitacion": "Sectores La Independencia, San Juan Bautista.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 132,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-12",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Camparola, Monte Verde, San Pío X, La Palma, Yarumito, La Finca.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "S-6", "D-1", "D-2", "D-7"],
      "marcas": {
        "C-2": "*",
        "S-6": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se permite solo sobre las calles 32 y 33 entre la carrera 50A y la Diagonal 47, sobre la Diagonal 47, la calle 47 entre calles 32 y 33, la carrera 56A entre calles 26 y 31, y la calle 31 entre la carrera 50A y la calle 37B; en el resto del polígono se prohíbe el uso.",
          "paginaPdf": 134,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 132,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-13",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Malta, Las Brisas, Glorieta Pilsen, Santa Ana, Samaria, El Palmar, Las Margaritas, Robles del Sur.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 132,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-14",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Villa Lía, San Javier.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {
        "C-3": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Sobre la calle 39 se restringe; en el resto del polígono se prohíbe.",
          "paginaPdf": 134,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-15",
      "areaActividad": "residencial",
      "delimitacion": "Sectores 19 de Abril, Pilsen.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["R-M2", "C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {
        "R-M2": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo se permite en el barrio Pilsen y en desarrollos urbanísticos nuevos; en el resto del polígono se prohíbe.",
          "paginaPdf": 134,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["R-M2 aparece a la vez como compatible y como condicionado con asterisco (R-M2*): contradicción dentro del texto del acuerdo."],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-16",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Ditaires.",
      "compatibles": ["R-U", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "C-11", "C-12", "C-13", "S-5", "S-9", "S-11", "S-16", "S-17", "S-18", "S-19", "S-22", "I-5", "D-1", "D-2", "D-3", "D-4", "D-6", "D-7"],
      "marcas": {
        "S-17": "*",
        "C-11": "**",
        "C-12": "**",
        "C-13": "**",
        "S-9": "**",
        "S-18": "**",
        "D-7": "***",
        "D-6": "****"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se restringe en la carrera 64; en el resto del polígono se prohíbe.",
          "paginaPdf": 134,
          "restoDelPoligono": "prohibido"
        },
        "**": {
          "texto": "Se permite en desarrollos nuevos.",
          "paginaPdf": 134,
          "restoDelPoligono": null
        },
        "****": {
          "texto": "Excepto cárceles y centros de reclusión.",
          "paginaPdf": 135,
          "restoDelPoligono": null
        },
        "***": {
          "texto": "La nota dice: uso permitido exclusivamente en el predio denominado \"Automóviles Itagüí S.A.S.\" y la cita solo para ZU-R-17; el texto no dice nada propio para ZU-R-16.",
          "paginaPdf": 134,
          "restoDelPoligono": null,
          "soloAplicaA": ["ZU-R-17"]
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["ZU-R-16 y ZU-R-17 comparten una sola celda de usos en la tabla."],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-17",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Ditaires.",
      "compatibles": ["R-U", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "C-11", "C-12", "C-13", "S-5", "S-9", "S-11", "S-16", "S-17", "S-18", "S-19", "S-22", "I-5", "D-1", "D-2", "D-3", "D-4", "D-6", "D-7"],
      "marcas": {
        "S-17": "*",
        "C-11": "**",
        "C-12": "**",
        "C-13": "**",
        "S-9": "**",
        "S-18": "**",
        "D-7": "***",
        "D-6": "****"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se restringe en la carrera 64; en el resto del polígono se prohíbe.",
          "paginaPdf": 134,
          "restoDelPoligono": "prohibido"
        },
        "**": {
          "texto": "Se permite en desarrollos nuevos.",
          "paginaPdf": 134,
          "restoDelPoligono": null
        },
        "****": {
          "texto": "Excepto cárceles y centros de reclusión.",
          "paginaPdf": 135,
          "restoDelPoligono": null
        },
        "***": {
          "texto": "Uso permitido exclusivamente en el predio denominado \"Automóviles Itagüí S.A.S.\"",
          "paginaPdf": 134,
          "restoDelPoligono": null,
          "soloAplicaA": ["ZU-R-17"]
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["ZU-R-16 y ZU-R-17 comparten una sola celda de usos en la tabla."],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-18",
      "areaActividad": "residencial",
      "delimitacion": "Sectores San Gabriel, San Antonio, Triana, San Francisco.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-19",
      "areaActividad": "residencial",
      "delimitacion": "Sectores San Francisco.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-20",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Ditaires (Bariloche), San Francisco.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "S-4", "S-5", "S-11", "S-16", "S-19", "I-5", "D-1", "D-2"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-21",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Santa Catalina.",
      "compatibles": ["R-U", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-3", "C-11", "C-12", "C-13", "S-5", "S-11", "S-16", "S-17", "S-18", "S-19", "S-22", "I-5", "D-1", "D-2", "D-3", "D-4"],
      "marcas": {
        "C-11": "*",
        "C-12": "*",
        "C-13": "*",
        "S-17": "*",
        "S-18": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se permite en desarrollos nuevos.",
          "paginaPdf": 135,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-22",
      "areaActividad": "residencial",
      "delimitacion": "Sectores 19 de Abril (Territorio Verde).",
      "compatibles": ["R-M2", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["S-4", "S-5", "S-19", "D-1", "D-2"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-R-23",
      "areaActividad": "residencial",
      "delimitacion": "Sectores Áreas incorporadas a zona urbana en 2007.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-11", "C-12", "C-13", "S-4", "S-5", "S-6", "S-11", "S-16", "S-18", "S-19", "I-5", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "C-2": "*",
        "C-3": "*",
        "S-6": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se restringe sobre áreas comerciales.",
          "paginaPdf": 135,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "181",
        "paginaPdf": 133,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-03",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Calle 36 y sectores aledaños, desde la carrera 70 hasta la carrera 50A.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "S-5", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-4", "C-5", "C-6", "C-7", "C-8", "C-9", "C-11", "C-12", "C-13", "S-3", "S-4", "S-6", "S-9", "S-10", "S-11", "S-13", "S-16", "S-18", "S-19", "S-20", "S-24", "S-26", "I-3", "I-4", "I-5", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "C-5": "*",
        "C-6": "*",
        "C-7": "*",
        "C-8": "*",
        "S-10": "*",
        "S-20": "*",
        "I-3": "*",
        "I-4": "*",
        "S-13": "**",
        "S-6": "***"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo en bodegas ubicadas entre la calle 35 y la calle 36 y las carreras 64 y el límite con ZU-R-18 (Urbanización Ditaires de Alcalá, calle 35D No. 69A-70), que no tengan acceso sobre la calle 36 (exceptuando los códigos 4661 y 4664).",
          "paginaPdf": 141,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Solo en bodegas con la misma ubicación y condición de la nota anterior, y solo servicios de salas de velación.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        },
        "***": {
          "texto": "Excepto en los locales del COMPLEX de Ditaires, donde la tipología se considera prohibida.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["C-9 aparece a la vez como compatible y como condicionado, sin marca, en el texto del acuerdo."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 136,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-05",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Corredor de la quebrada Doña María desde la calle 38 hasta el parque del Artista y calle 48 desde la carrera 55 hasta la carrera 58.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "S-5", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-11", "C-12", "C-13", "S-3", "S-4", "S-6", "S-11", "S-16", "S-18", "S-19", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La fila empieza al final de la p. 136 y sigue en la p. 137."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 136,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-06",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Calle 12 sur, entre carrera 48, carrera 50G y carrera 46A.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "S-5", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-4", "C-5", "C-7", "C-8", "C-11", "I-3", "I-4", "I-5", "S-1", "S-2", "S-3", "S-4", "S-6", "S-10", "S-11", "S-12", "S-16", "S-19", "S-24", "S-25", "S-26", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "R-U": "*",
        "R-B": "*",
        "R-T": "*",
        "R-M1": "*",
        "R-M2": "*",
        "C-2": "**",
        "C-5": "**",
        "C-7": "**",
        "C-8": "**",
        "C-11": "**",
        "I-3": "**",
        "I-4": "**",
        "S-1": "**",
        "S-2": "**",
        "S-6": "**",
        "S-10": "**",
        "S-11": "**",
        "S-12": "**",
        "S-25": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se excluye el uso residencial en la ciudadela industrial (bodegas ubicadas entre la carrera 50G y la carrera 51).",
          "paginaPdf": 141,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Solamente se permite en la ciudadela industrial (bodegas ubicadas entre la carrera 50G y la carrera 51); en el resto del polígono se prohíbe.",
          "paginaPdf": 141,
          "restoDelPoligono": "prohibido"
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["En la celda de compatibles el texto lista \"C-1, S-5, C-9\" en ese orden, y en la de condicionados I-3 e I-4 van entre los comerciales y los de servicios."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 137,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-07",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sobre la calle 56, desde la carrera 53A hasta la carrera 68; y por la carrera 68 desde la calle 56 hasta la calle 64.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "S-5", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-3", "S-4", "S-6", "S-11", "S-16", "S-19", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La tabla escribe algunos códigos residenciales sin el guion interno (RM1, R-M-2); aquí se normalizan a R-M1 y R-M2."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 137,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-08",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Carrera 61 entre la calle 56 y la calle 63, luego baja por toda la calle 63, y por la calle 64 hasta la carrera 53.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "C-1", "C-9", "S-5", "S-7", "S-8", "S-15", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-3", "S-4", "S-6", "S-11", "S-16", "S-19", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La tabla escribe algunos códigos residenciales sin el guion interno (RM1, R-M-2); aquí se normalizan a R-M1 y R-M2.", "El texto no lista R-M3 entre los compatibles de esta zona."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 137,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-09",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Carrera 52D y carrera 52, desde el parque del Artista hasta la calle 87, sobre la calle 69 y calle 70 desde carrera 52D hasta la carrera 54A.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "S-3", "S-4", "S-6", "S-11", "S-13", "S-16", "S-19", "S-22", "S-24", "S-26", "I-4", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "I-4": "*",
        "S-13": "**",
        "S-6": "***"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo lo relacionado con la confección, la moda y el calzado.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        },
        "***": {
          "texto": "Excepto sobre el corredor de la carrera 52 entre calles 63 y 85, donde la tipología se considera prohibida.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["En la nota de I-4 el símbolo sale impreso con una comilla pegada (`\"*`); se lee como el asterisco simple."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 137,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-10",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Calle 63 desde la quebrada Doña María hasta la carrera 44 y carrera 45A entre calles 63 y 67B.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-4", "C-8", "S-3", "S-4", "S-6", "S-10", "S-11", "S-13", "S-16", "S-19", "S-22", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "C-8": "*",
        "S-10": "*",
        "S-13": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo sobre la calle 63.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La fila empieza en la p. 137 y termina en la p. 138."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 137,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-11",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Calle 46, desde la quebrada Doña María hasta 1 predio antes de la carrera 42 (autopista Sur).",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-4", "C-8", "C-9", "S-3", "S-4", "S-6", "S-10", "S-11", "S-13", "S-16", "S-19", "S-22", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "S-13": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["C-9 aparece a la vez como compatible y como condicionado, sin marca, en el texto del acuerdo."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 138,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-12",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Por la carrera 49 entre la calle 46 hasta la calle 39; por la calle 39 entre la carrera 49 y 50A. Por la carrera 50A entre la glorieta Pilsen y la calle 46. Por la calle 40 desde el costado sur de la quebrada Doña María hasta la carrera 50A.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-4", "C-8", "S-3", "S-4", "S-6", "S-10", "S-11", "S-13", "S-16", "S-19", "S-22", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "S-13": "*",
        "C-2": "**",
        "C-8": "**",
        "S-6": "**",
        "S-10": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Se prohíben sobre la calle 41 entre carreras 53 y 55 y en la carrera 54 entre calle 40 y 42.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 138,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-13",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Por la Avenida Pilsen o calle 37B desde la glorieta Pilsen hasta la calle 31B. Predios sobre la calle 31B y 34A. Predios en el costado norte de la calle 31B hasta la diagonal 42B.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-4", "C-7", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-5", "C-8", "C-9", "S-3", "S-4", "S-6", "S-10", "S-11", "S-13", "S-14", "S-16", "S-17", "S-19", "S-22", "S-24", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3"],
      "marcas": {
        "S-13": "*",
        "C-5": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Exceptuando los códigos 4664 y 4661.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["C-9 aparece a la vez como compatible y como condicionado, sin marca, en el texto del acuerdo."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 138,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-14",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Desde la glorieta Pilsen por la carrera 50A hasta la calle 31, por la calle 31; incluye bodegas sobre la calle 31 y costado norte de la calle 36 desde la carrera 50A hasta la diagonal 46 y costado sur hasta la diagonal 44.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-8", "S-3", "S-4", "S-6", "S-10", "S-11", "S-13", "S-16", "S-19", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {
        "C-2": "*",
        "S-3": "*",
        "S-6": "*",
        "S-13": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Solo en la CR 50A; en el resto del polígono se prohíbe.",
          "paginaPdf": 141,
          "restoDelPoligono": "prohibido"
        },
        "**": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La fila empieza en la p. 138 y termina en la p. 139 (la delimitación continúa allí)."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 138,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-15",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Diagonal 40, desde la calle 37B hasta la carrera 49.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-8", "S-3", "S-4", "S-6", "S-10", "S-11", "S-16", "S-19", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 139,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-16",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Entre calle 83 y calle 85, entre las carreras 50A y 51, calle 86, barrio San Fernando entre calles 86 y 85, hasta 1 predio de la carrera 52.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-4", "C-8", "S-3", "S-4", "S-6", "S-10", "S-11", "S-13", "S-14", "S-16", "S-19", "S-22", "S-23", "S-24", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3"],
      "marcas": {
        "S-23": "*",
        "C-11": "**",
        "C-12": "**",
        "C-13": "**",
        "S-18": "**",
        "C-4": "**",
        "C-8": "**",
        "S-3": "**",
        "S-10": "**",
        "I-3": "**",
        "I-4": "**",
        "S-13": "***",
        "C-2": "****",
        "S-6": "****"
      },
      "notasMarcas": {
        "*": {
          "texto": "Las actividades de alto impacto solo sobre el costado sur de la calle 85 entre las carreras 51 y 50A.",
          "paginaPdf": 141,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Excepto predios ubicados entre la calle 81 y la calle 84A y las carreras 50A y 51.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "***": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "****": {
          "texto": "Excepto predios ubicados sobre la calle 81 a la calle 84A.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La delimitación habla de las calles 83-85, pero las notas excluyen predios de las calles 81-84A; el acuerdo no lo aclara."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 139,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-17",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sectores costado norte de la carrera 42, Autopista Sur (Zona Industrial No. 2).",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-4", "C-5", "C-7", "C-8", "C-9", "C-11", "C-12", "C-13", "S-4", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-6", "S-1", "S-2", "S-3", "S-6", "S-10", "S-11", "S-12", "S-13", "S-14", "S-16", "S-17", "S-19", "S-20", "S-22", "S-24", "S-25", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "R-U": "*",
        "R-B": "*",
        "R-T": "*",
        "R-M1": "*",
        "R-M2": "*",
        "R-M3": "*",
        "C-6": "**",
        "S-1": "**",
        "S-2": "**",
        "S-14": "**",
        "S-20": "**",
        "S-13": "***",
        "C-5": "****",
        "C-7": "****",
        "C-8": "****",
        "S-10": "****",
        "S-12": "****",
        "S-25": "****",
        "I-3": "****",
        "I-4": "****"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se establece una distancia de separación de 100 m desde el eje de la autopista para desarrollos residenciales.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Solo sobre el corredor de la autopista y las calles 54 y 55.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "***": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "****": {
          "texto": "Excepto predios ubicados sobre la calle 50 entre la carrera 47 y un predio antes de la carrera 42 sur.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La tabla escribe algunos códigos residenciales sin el guion interno (RM1, R-M-2); aquí se normalizan a R-M1 y R-M2."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 139,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-18",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sector Coltejer, entre la calle 63 y la calle 56, entre la carrera 52 y 50 y la carrera 42 (Autopista Sur).",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-3", "C-8", "S-4", "S-6", "S-10", "S-11", "S-16", "S-19", "S-24", "S-26", "I-5", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["C-3 aparece a la vez como compatible y como condicionado, sin marca, en el texto del acuerdo."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 139,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-19",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sector plaza Mayorista.",
      "compatibles": ["C-1", "C-3", "C-4", "C-8", "C-9", "C-10", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-18", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-5", "C-6", "C-7", "S-1", "S-2", "S-3", "S-4", "S-6", "S-10", "S-11", "S-12", "S-14", "S-15", "S-16", "S-19", "S-20", "S-22", "S-24", "S-25", "S-26", "I-3", "I-4", "D-1", "D-2"],
      "marcas": {
        "C-5": "*",
        "C-6": "**",
        "S-1": "**",
        "S-2": "**",
        "S-3": "**",
        "S-12": "**",
        "S-14": "**",
        "S-20": "**",
        "S-25": "**",
        "S-26": "**",
        "I-3": "**",
        "I-4": "**",
        "S-11": "***"
      },
      "notasMarcas": {
        "*": {
          "texto": "En la Central Mayorista solo se permiten los códigos 4653 y 4664; los demás códigos solo sobre el corredor de la autopista.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Solo sobre el corredor de la autopista.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "***": {
          "texto": "En la Central Mayorista no se permiten actividades de mantenimiento ni reparación de vehículos y motos.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["No hay tipologías residenciales entre los compatibles ni entre los condicionados."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 139,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-20",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sector Fábrica de Licores de Antioquia.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-4", "C-7", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-8", "S-4", "S-6", "S-10", "S-11", "S-16", "S-19", "S-22", "S-24", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "R-M1": "*",
        "R-M2": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se establece una distancia de separación de 100 m desde el eje de la autopista para desarrollos residenciales.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 140,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-21",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sector Aluminio Nacional.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "C-1", "C-3", "C-4", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-5", "C-8", "S-4", "S-6", "S-10", "S-11", "S-16", "S-19", "S-24", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3"],
      "marcas": {
        "C-5": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Exceptuando el código CIIU 4661.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["El texto no lista R-M3 entre los compatibles de esta zona."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 140,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-22",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sector Pilsen.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-4", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-9", "S-15", "S-18", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-5", "C-6", "C-8", "S-3", "S-4", "S-6", "S-10", "S-11", "S-13", "S-16", "S-19", "S-24", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "C-5": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Exceptuando el código CIIU 4661.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 140,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-23",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Manzana entre calle 32 y 34 y carrera 51A y 53.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "R-M3", "C-1", "C-3", "C-4", "C-9", "S-5", "S-7", "S-8", "S-15", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-8", "S-3", "S-4", "S-6", "S-10", "S-11", "S-16", "S-19", "S-24", "S-26", "D-1", "D-2", "D-3"],
      "marcas": {},
      "notasMarcas": {},
      "prohibidos": "los demás usos no determinados",
      "observaciones": [],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 140,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-24",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Satexco.",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "C-1", "C-3", "C-4", "C-9", "C-11", "C-12", "C-13", "S-5", "S-7", "S-8", "S-15", "S-18", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-5", "C-6", "C-8", "S-3", "S-4", "S-6", "S-10", "S-11", "S-16", "S-19", "S-24", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3"],
      "marcas": {
        "C-5": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Exceptuando el código CIIU 4661.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["El texto no lista R-M3 entre los compatibles, y sus compatibles de servicios son S-5, S-7, S-8, S-15 y S-18 (sin S-9, a diferencia de otras zonas)."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 140,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-25",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Centralidad Sur.",
      "compatibles": ["R-M3", "C-1", "C-3", "C-4", "C-5", "C-7", "C-8", "C-9", "C-11", "C-12", "C-13", "S-4", "S-5", "S-7", "S-8", "S-9", "S-11", "S-15", "S-18", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-6", "S-1", "S-2", "S-3", "S-6", "S-10", "S-12", "S-16", "S-17", "S-19", "S-20", "S-22", "S-24", "S-25", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "S-20": "*"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se permitirá el tratamiento de residuos peligrosos exclusivamente en las manzanas entre las calles 25 y 27 y entre la carrera 42 y el corredor del Río, donde se permitirá un máximo de 2 operadores. Se prohíbe el tratamiento por incineración.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["Entre los residenciales solo figura R-M3 como compatible."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 140,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-26",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sectores costado norte de la carrera 42, Autopista Sur (La Esmeralda, Simón Bolívar).",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "C-1", "C-3", "C-4", "C-5", "C-7", "C-8", "C-9", "C-11", "C-12", "C-13", "S-4", "S-5", "S-7", "S-8", "S-9", "S-11", "S-15", "S-18", "S-24", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-6", "S-1", "S-2", "S-3", "S-6", "S-10", "S-12", "S-13", "S-14", "S-16", "S-17", "S-19", "S-20", "S-22", "S-24", "S-25", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "R-U": "*",
        "R-B": "*",
        "R-T": "*",
        "R-M1": "*",
        "R-M2": "*",
        "S-1": "**",
        "S-2": "**",
        "S-20": "**",
        "S-13": "***",
        "S-14": "****",
        "S-22": "****"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se establece una distancia de separación de 100 m desde el eje de la autopista para desarrollos residenciales.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Solo sobre el corredor de la autopista y la calle 73A.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "***": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "****": {
          "texto": "Solo sobre el corredor de la autopista.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La tabla escribe algunos códigos residenciales sin el guion interno (RM1, R-M-2); aquí se normalizan a R-M1 y R-M2.", "S-24 aparece a la vez como compatible y como condicionado, sin marca; el texto no lista R-M3 entre los compatibles. La fila empieza en la p. 140 y termina en la p. 141."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 140,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-27",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sectores costado norte de la carrera 42, Autopista Sur (San Fernando).",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "C-1", "C-3", "C-4", "C-5", "C-7", "C-8", "C-9", "C-11", "C-12", "C-13", "S-4", "S-5", "S-7", "S-8", "S-9", "S-11", "S-15", "S-18", "S-24", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-6", "S-1", "S-2", "S-3", "S-6", "S-10", "S-12", "S-13", "S-14", "S-16", "S-17", "S-19", "S-20", "S-22", "S-24", "S-25", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "R-U": "*",
        "R-B": "*",
        "R-T": "*",
        "R-M1": "*",
        "R-M2": "*",
        "S-14": "**",
        "S-22": "**",
        "S-13": "***"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se establece una distancia de separación de 100 m desde el eje de la autopista para desarrollos residenciales.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Solo sobre el corredor de la autopista.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "***": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La tabla escribe algunos códigos residenciales sin el guion interno (RM1, R-M-2); aquí se normalizan a R-M1 y R-M2.", "S-24 aparece a la vez como compatible y como condicionado, sin marca; el texto no lista R-M3 entre los compatibles. Las notas de esta zona salen impresas entre comillas."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 141,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "codigo": "ZU-AM-28",
      "areaActividad": "actividad múltiple",
      "delimitacion": "Sectores costado norte de la carrera 42, Autopista Sur (Zona Industrial No. 3).",
      "compatibles": ["R-U", "R-B", "R-T", "R-M1", "R-M2", "C-1", "C-3", "C-4", "C-5", "C-7", "C-8", "C-9", "C-11", "C-12", "C-13", "S-4", "S-5", "S-7", "S-8", "S-9", "S-11", "S-15", "S-18", "S-24", "I-5", "D-5", "D-8", "D-10"],
      "condicionados": ["C-2", "C-6", "S-1", "S-2", "S-3", "S-6", "S-10", "S-12", "S-13", "S-14", "S-16", "S-17", "S-19", "S-20", "S-22", "S-24", "S-25", "S-26", "I-3", "I-4", "D-1", "D-2", "D-3", "D-7"],
      "marcas": {
        "R-U": "*",
        "R-B": "*",
        "R-T": "*",
        "R-M1": "*",
        "R-M2": "*",
        "S-13": "**"
      },
      "notasMarcas": {
        "*": {
          "texto": "Se establece una distancia de separación de 100 m desde el eje de la autopista para desarrollos residenciales.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        },
        "**": {
          "texto": "Solo servicios de salas de velación.",
          "paginaPdf": 142,
          "restoDelPoligono": null
        }
      },
      "prohibidos": "los demás usos no determinados",
      "observaciones": ["La tabla escribe algunos códigos residenciales sin el guion interno (RM1, R-M-2); aquí se normalizan a R-M1 y R-M2.", "S-24 aparece a la vez como compatible y como condicionado, sin marca; el texto no lista R-M3 entre los compatibles."],
      "fuente": {
        "articulo": "182",
        "paginaPdf": 141,
        "verificacion": "transcrito_de_imagen"
      }
    }
  ],
  "estandaresRuido": [
    {
      "sector": "A. Tranquilidad y silencio",
      "subsector": "Hospitales, bibliotecas, guarderías, sanatorios y hogares geriátricos",
      "dbDia": 55,
      "dbNoche": 50,
      "tipologias": [],
      "categoriasUso": ["dotacional (salud)"],
      "actividadesNombradas": ["hospitales", "bibliotecas", "guarderías", "sanatorios", "hogares geriátricos"],
      "fuente": {
        "articulo": "179",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "sector": "B. Tranquilidad y ruido moderado",
      "subsector": "Zonas residenciales o exclusivamente habitacionales, hotelería y hospedajes",
      "dbDia": 65,
      "dbNoche": 55,
      "tipologias": ["S-22"],
      "categoriasUso": ["residencial", "corredores de actividad múltiple"],
      "actividadesNombradas": ["hotelería", "hospedajes"],
      "fuente": {
        "articulo": "179",
        "paginaPdf": 129,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "sector": "B. Tranquilidad y ruido moderado",
      "subsector": "Universidades, colegios, escuelas, centros de estudio e investigación",
      "dbDia": 65,
      "dbNoche": 55,
      "tipologias": [],
      "categoriasUso": ["dotacional (educativo)"],
      "actividadesNombradas": ["universidades", "colegios", "escuelas"],
      "fuente": {
        "articulo": "179",
        "paginaPdf": 129,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "sector": "B. Tranquilidad y ruido moderado",
      "subsector": "Parques en zonas urbanas distintos de los parques mecánicos al aire libre",
      "dbDia": 65,
      "dbNoche": 55,
      "tipologias": [],
      "categoriasUso": ["espacio público"],
      "actividadesNombradas": ["parques"],
      "fuente": {
        "articulo": "179",
        "paginaPdf": 129,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "sector": "C. Ruido intermedio restringido",
      "subsector": "Zonas con usos industriales (industrias en general, zonas portuarias, parques industriales, zonas francas)",
      "dbDia": 75,
      "dbNoche": 75,
      "tipologias": ["I-3", "I-4", "C-5", "S-1", "S-10", "S-17"],
      "categoriasUso": ["industria pesada (I-1 e I-2)", "industria mediana y liviana"],
      "actividadesNombradas": ["industrias", "zonas portuarias", "parques industriales", "zonas francas"],
      "fuente": {
        "articulo": "179",
        "paginaPdf": 129,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "sector": "C. Ruido intermedio restringido",
      "subsector": "Zonas con usos comerciales (centros comerciales, almacenes, locales, talleres de mecánica, centros deportivos y recreativos, gimnasios, restaurantes, bares, tabernas, discotecas, bingos, casinos)",
      "dbDia": 70,
      "dbNoche": 60,
      "tipologias": ["C-1", "C-2", "S-4", "S-5", "S-6", "S-7", "S-13", "S-14", "S-16", "S-23", "I-5"],
      "categoriasUso": [],
      "actividadesNombradas": ["centros comerciales", "almacenes", "talleres de mecánica", "centros deportivos y recreativos", "gimnasios", "restaurantes", "bares", "tabernas", "discotecas", "bingos", "casinos"],
      "fuente": {
        "articulo": "179",
        "paginaPdf": 129,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "sector": "C. Ruido intermedio restringido",
      "subsector": "Zonas con usos de oficinas",
      "dbDia": 65,
      "dbNoche": 55,
      "tipologias": ["S-8", "S-15"],
      "categoriasUso": [],
      "actividadesNombradas": ["oficinas"],
      "fuente": {
        "articulo": "179",
        "paginaPdf": 130,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "sector": "C. Ruido intermedio restringido",
      "subsector": "Zonas con usos institucionales",
      "dbDia": 65,
      "dbNoche": 55,
      "tipologias": [],
      "categoriasUso": ["dotacional"],
      "actividadesNombradas": [],
      "fuente": {
        "articulo": "179",
        "paginaPdf": 130,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "sector": "C. Ruido intermedio restringido",
      "subsector": "Zonas con otros usos relacionados (parques mecánicos al aire libre, espectáculos públicos al aire libre)",
      "dbDia": 80,
      "dbNoche": 75,
      "tipologias": ["S-18"],
      "categoriasUso": [],
      "actividadesNombradas": ["parques mecánicos", "espectáculos públicos al aire libre"],
      "fuente": {
        "articulo": "179",
        "paginaPdf": 130,
        "verificacion": "transcrito_de_imagen"
      }
    }
  ],
  "disposicionesGenerales": [
    {
      "tema": "licencia para uso comercial",
      "resumen": "El local debe tener licencia de construcción con uso diferente al residencial.",
      "fuente": {
        "articulo": "175",
        "paginaPdf": 122,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "licencia para uso de servicios",
      "resumen": "El establecimiento debe tener licencia como local comercial y las condiciones locativas y de seguridad requeridas.",
      "fuente": {
        "articulo": "176",
        "paginaPdf": 123,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "licencia para uso industrial",
      "resumen": "El establecimiento debe tener licencia como industria y las condiciones locativas y de seguridad requeridas.",
      "fuente": {
        "articulo": "177",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "licencia para uso dotacional",
      "resumen": "El establecimiento debe tener licencia de construcción y uso dotacional.",
      "fuente": {
        "articulo": "178",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "antejardín con aprovechamiento económico",
      "resumen": "Se permite el uso temporal del antejardín con venta de comidas preparadas o licor: no suma al área efectiva del local, no puede usarse para almacenaje ni construcciones y no admite cerramiento. Las condiciones salen de la reglamentación de aprovechamiento económico del espacio público.",
      "fuente": {
        "articulo": "176 (parágrafo 1)",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "servicios religiosos como equipamiento",
      "resumen": "Los servicios religiosos (S-16) pueden optar por su categorización y licenciamiento como equipamiento religioso (D-12).",
      "fuente": {
        "articulo": "176 (parágrafo 2)",
        "paginaPdf": 127,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "parqueaderos en cualquier área de actividad",
      "resumen": "Se permite localizar parqueaderos públicos y privados en cualquier área de actividad.",
      "fuente": {
        "articulo": "178 (parágrafo)",
        "paginaPdf": 128,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "áreas saturadas",
      "resumen": "La administración municipal puede declarar áreas saturadas de usos complementarios y restringidos cuando cambie la vocación.",
      "fuente": {
        "articulo": "180 (parágrafo)",
        "paginaPdf": 130,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "Antejardín de restaurantes en áreas de actividad múltiple",
      "resumen": "Los restaurantes o similares pueden usar el antejardín de forma temporal o transitoria, previo contrato de aprovechamiento económico con el municipio. El espacio no puede cerrarse, usarse para almacenar mercancía ni edificarse, y el mobiliario no puede obstaculizar el libre tránsito. Las condiciones se definen en el Marco Regulatorio de Aprovechamiento Económico del Espacio Público.",
      "fuente": {
        "articulo": "182 (parágrafo 1)",
        "paginaPdf": 142,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "Industrias con Programa de Prevención de Accidentes Mayores (PPAM)",
      "resumen": "Las industrias que deban adoptar el PPAM (Decreto Único Nacional 1072 de 2015) deben suministrar al municipio la información de los análisis técnicos de riesgos de accidentes mayores del informe de seguridad. El municipio decide qué información usará en futuras revisiones del acuerdo.",
      "fuente": {
        "articulo": "182 (parágrafo 2)",
        "paginaPdf": 143,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "Áreas dotacionales: reemplazo de equipamientos y usos complementarios",
      "resumen": "Si un equipamiento ubicado en un área dotacional de dominio público se desmonta, se mantiene el uso dotacional y puede reemplazarse por otra tipología dotacional. Los predios proyectados para equipamientos y espacio público se identifican como uso dotacional. Los equipamientos con un uso diferente al principal pueden desarrollar usos complementarios (educativo, deportivo o recreativo, cultural, salud, administración pública, transporte, seguridad, religioso, bienestar social, comunitario, servicios públicos o mixto).",
      "fuente": {
        "articulo": "184",
        "paginaPdf": 144,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "Predios privados calificados como dotacional proyectado",
      "resumen": "Los predios privados en polígonos dotacionales calificados como dotacional proyectado para espacio público o equipamiento pueden desarrollar los usos y aprovechamientos del polígono de tratamiento al que pertenecen. En todo caso deben pagar las obligaciones urbanísticas en suelo en el mismo predio, que en ningún caso podrán compensarse en dinero.",
      "fuente": {
        "articulo": "184",
        "paginaPdf": 155,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "Servicios de alto impacto referidos a la prostitución y actividades afines",
      "resumen": "Integran la tipología residencias, salones de masajes sex, sex show, grilles y similares referidos a la prostitución. Solo se permiten en el polígono ZU-AM-16, sobre la calle 85 entre las carreras 51 y 50A.",
      "fuente": {
        "articulo": "185",
        "paginaPdf": 164,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "Usos del suelo establecidos",
      "resumen": "Los usos preexistentes clasificados como restringidos o prohibidos pueden aceptarse como usos establecidos si: (1) la edificación cumple las condiciones urbanísticas, constructivas, estructurales y locativas vigentes, probado con planos aprobados; (2) la actividad se ha desarrollado de forma permanente y continua; (3) el uso era permitido en la norma vigente cuando se estableció, probado con licencia de funcionamiento o concepto de ubicación y usos del suelo anterior o vigente al Acuerdo 020 de 2007, o con resolución o recibo de pago de Industria y Comercio anterior a la entrada en vigor del Acuerdo 020 de 2007 (continúa en la p. 165). El parágrafo (p. 165) permite autorizar obras de mantenimiento, seguridad, saneamiento ambiental e higiene que hagan tolerable la actividad mientras se hace el traslado y cierre definitivo, o la reconversión a tecnologías limpias, que se reglamentará.",
      "fuente": {
        "articulo": "186",
        "paginaPdf": 164,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tema": "Intensidad de usos por área de actividad según tratamiento (renovación)",
      "resumen": "En las áreas de actividad múltiple con tratamiento de renovación (reactivación y redesarrollo), parte de la centralidad sur, donde se actúa con base en las directrices metropolitanas, la intensidad residencial es de máximo 80% del aprovechamiento y para otros usos es todo el aprovechamiento. En los polígonos de la franja de la carrera 42, Autopista Sur, la vivienda se prohíbe en una franja de 100 m desde la autopista; los polígonos sobre la autopista, en esa franja, pueden desarrollar usos diferentes al residencial.",
      "fuente": {
        "articulo": "187",
        "paginaPdf": 165,
        "verificacion": "transcrito_de_imagen"
      }
    }
  ],
  "reglasDotacionales": [
    {
      "tipo": "Educación",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": [],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 155,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Deportivo y Recreativo",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": [],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 157,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Cultura",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": [],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 160,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Salud",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": [],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 161,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Transporte",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3", "D-7"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": ["La celda imprime \"D-1, D-2, D-3 D-7\" sin separador antes de D-7."],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 161,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Seguridad",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3", "D-6"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": [],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 161,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Bienestar social",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3", "D-4"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": ["La celda imprime \"D-1, D-2, D-3 D-4\" sin separador antes de D-4."],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 161,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Comunitario",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": [],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 162,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Servicios Públicos",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": [],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 163,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Institucional",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3", "D-5"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": ["La celda imprime \"D-1, D-2, D-3 D-5\" sin separador antes de D-5."],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 163,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Multipropósito",
      "areaActividad": "dotacional",
      "compatibles": ["D-1", "D-2", "D-3", "R-M2"],
      "condicionados": ["C-1", "S-8", "S-7", "S-19"],
      "observaciones": ["La celda imprime \"RM2\" sin guion interno; aquí se normaliza a R-M2."],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 164,
        "verificacion": "transcrito_de_imagen"
      }
    },
    {
      "tipo": "Sanitario",
      "areaActividad": "dotacional",
      "compatibles": ["D-2", "D-3"],
      "condicionados": ["C-1", "S-8", "S-7", "S-13", "S-19"],
      "observaciones": ["Tipo visto solo en la tabla de reglas (ZU-D-66 / ZU-D-126); su fila en el listado de nombres no se ha leído."],
      "fuente": {
        "articulo": "184",
        "paginaPdf": 164,
        "verificacion": "transcrito_de_imagen"
      }
    }
  ],
  "notasTablaPendientes": [],
  "limitaciones": ["Suelo rural: la tabla de interrelación de usos (art. 254, p. 199-202) no se cargó. En el PDF escaneado la tabla está cortada en el margen derecho y falta la columna de usos condicionados o restringidos; solo se leen zona, uso principal y usos complementarios con su CIIU. Requiere otra versión del texto (Gaceta, Planeación o Concejo) [verificar].", "Dotacional: el inventario de 275 equipamientos ZU-D (art. 184, p. 144-155) no se transcribió; solo están las reglas por tipo (p. 155-164).", "Geometría: ninguna zona trae geometría; sin una fuente geográfica oficial no se puede ubicar un punto en su polígono.", "Actividades sin tipología nombrada en el acuerdo (gimnasio, farmacia, discoteca, tienda de tecnología) no se infieren.", "Vigencia no verificada en la Gaceta; Acuerdo 20 de 2007 no cargado (la capa AMVA POT_Itagui/2 parece seguirlo, hipótesis sin confirmar)."]
})
