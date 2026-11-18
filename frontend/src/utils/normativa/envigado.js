// Norma de usos del suelo urbano y de expansión de Envigado: Acuerdo 010 de 2011 (POT 2011-2023), Tabla 27 (art. 186).
// Generado por scripts/aplicar-tabla27-envigado.mjs con los datos de scripts/datos/tabla27-envigado.mjs.
// Las letras P, C y R se ubicaron por posición (pdfplumber), sin revisión humana. Desde aquí se puede editar a mano.

import { congelar } from './esquema.js'

export const ENVIGADO = congelar({
  "municipioSlug": "Envigado",
  "nombre": "Acuerdo 010 de 2011 - Plan de Ordenamiento Territorial 2011-2023 (Envigado)",
  "fechaAdopcion": "2011-04-12",
  "fechaConsulta": "2026-11-17",
  "vigencia": {
    "estado": "por_verificar",
    "fuente": "POT 2011-2023 vencido; modificaciones posibles: Decreto 600 de 2019, Decreto 651 de 2024 y un Compendio normativo, sin contrastar [verificar]"
  },
  "cobertura": "parcial",
  "fuente": {
    "url": "https://www.envigado.gov.co",
    "nota": "[verificar] URL exacta del acuerdo; datos tomados del PDF aportado por el usuario"
  },
  "limitaciones": [
    "Vigencia por verificar: el POT 2011-2023 está vencido y pudo ser modificado (Decreto 600 de 2019, Decreto 651 de 2024, Compendio normativo). Contrastar con Planeación de Envigado.",
    "Un uso restringido (R) nunca es un permiso: depende de los criterios del art. 184.",
    "Los usos no definidos en la Tabla 27 requieren concepto del Comité Municipal de Usos del Suelo (par. 1 art. 186).",
    "Las letras P, C y R de la Tabla 27 (art. 186, págs. 118 a 132 del PDF) se ubicaron por la posición de cada celda con un programa, sin revisión humana [verificar]. Una celda vacía significa que el acuerdo no define la actividad en esa zona; no equivale a \"prohibido\"."
  ],
  "zonas": [
    {
      "codigo": "IND-LV",
      "nombre": "Industrial Las Vegas",
      "descripcion": "Polígono industrial Las Vegas (art. 185).",
      "fuente": {
        "articulo": "185-186 (Tabla 27)",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "codigo": "IND-LCP",
      "nombre": "Industrial Las Casitas-Primavera",
      "descripcion": "Polígono industrial Las Casitas-Primavera (art. 185).",
      "fuente": {
        "articulo": "185-186 (Tabla 27)",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "codigo": "CT",
      "nombre": "Centro tradicional",
      "descripcion": "Columna «Centro tradicional» de la Tabla 27; polígonos en el plano UF-04.",
      "fuente": {
        "articulo": "185-186 (Tabla 27)",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "codigo": "CU",
      "nombre": "Centros urbanos",
      "descripcion": "Columna «Centros urbanos» de la Tabla 27 (centralidades, art. 185).",
      "fuente": {
        "articulo": "185-186 (Tabla 27)",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "codigo": "COR1",
      "nombre": "Corredor tipo 1",
      "descripcion": "Columna «Corredor tipo 1» de la Tabla 27 (corredores de actividad múltiple).",
      "fuente": {
        "articulo": "185-186 (Tabla 27)",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "codigo": "COR2",
      "nombre": "Corredor tipo 2",
      "descripcion": "Columna «Corredor tipo 2» de la Tabla 27.",
      "fuente": {
        "articulo": "185-186 (Tabla 27)",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "codigo": "COR3",
      "nombre": "Corredor tipo 3",
      "descripcion": "Columna «Corredor tipo 3» de la Tabla 27.",
      "fuente": {
        "articulo": "185-186 (Tabla 27)",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "codigo": "RES",
      "nombre": "Residencial",
      "descripcion": "Columna «Residencial» de la Tabla 27 (polígonos residenciales, art. 185).",
      "fuente": {
        "articulo": "185-186 (Tabla 27)",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "codigo": "EXP",
      "nombre": "Suelo de expansión",
      "descripcion": "Columna «Suelo de expansión» de la Tabla 27.",
      "fuente": {
        "articulo": "185-186 (Tabla 27)",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    }
  ],
  "reglasPorCiiu": [
    {
      "ciiu": "151",
      "descripcion": "Producción, procesamiento y conservación de carne y pescado",
      "porZona": {
        "IND-LV": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "152",
      "descripcion": "Procesamiento de frutas, legumbres, hortalizas, aceites y grasas",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "153",
      "descripcion": "Elaboración de productos lácteos",
      "porZona": {
        "IND-LV": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "154",
      "descripcion": "Elaboración de productos de molinería, almidones y productos derivados del almidón, y de alimentos preparados para animales",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "156",
      "descripcion": "Elaboración de productos de café",
      "porZona": {
        "IND-LV": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "158",
      "descripcion": "Elaboración de otros productos alimenticios",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "R",
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "159",
      "descripcion": "Elaboración de bebidas",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "171",
      "descripcion": "Preparación e hilatura de fibras textiles",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "172",
      "descripcion": "Tejedura de productos textiles",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "173",
      "descripcion": "Acabado de productos textiles no producidos en la misma unidad de producción",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "174",
      "descripcion": "Fabricación de otros productos textiles",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "P",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 118,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "175",
      "descripcion": "Fabricación de tejidos y artículos de punto y ganchillo",
      "porZona": {
        "IND-LCP": "P",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "181",
      "descripcion": "Confección de prendas de vestir, excepto prendas de piel",
      "porZona": {
        "IND-LCP": "P",
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "192",
      "descripcion": "Fabricación de calzado",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "193",
      "descripcion": "Fabricación de artículos de viaje, bolsos de mano y artículos similares, y fabricación de artículos de talabartería y guarnicionería",
      "porZona": {
        "IND-LCP": "C",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "201",
      "descripcion": "Aserrado, acepillado e impregnación de la madera",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "202",
      "descripcion": "Fabricación de hojas de madera para enchapado; fabricación de tableros contrachapados, tableros laminados, tableros de partículas y otros tableros y paneles",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "203",
      "descripcion": "Fabricación de partes y piezas de carpintería para edificios y construcciones",
      "porZona": {
        "IND-LCP": "P",
        "COR2": "R",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 119,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "204",
      "descripcion": "Fabricación de recipientes de madera",
      "porZona": {
        "IND-LCP": "P",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "209",
      "descripcion": "Fabricación de otros productos de madera; fabricación de artículos de corcho, cestería y espartería",
      "porZona": {
        "IND-LCP": "P",
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "210",
      "descripcion": "Fabricación de papel, cartón y productos de papel y cartón",
      "porZona": {
        "IND-LV": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "221",
      "descripcion": "Actividades de edición",
      "porZona": {
        "CT": "P",
        "CU": "C",
        "COR1": "P",
        "COR2": "P",
        "COR3": "P",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "222",
      "descripcion": "Actividades de impresión",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "P",
        "CT": "R",
        "COR1": "C",
        "COR2": "C",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "223",
      "descripcion": "Actividades de servicios relacionadas con la impresión",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "P",
        "CT": "R",
        "COR1": "C",
        "COR2": "C",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "224",
      "descripcion": "Reproducción de grabaciones",
      "porZona": {
        "CT": "C",
        "COR1": "C",
        "COR2": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "241",
      "descripcion": "Fabricación de sustancias químicas básicas",
      "porZona": {
        "IND-LV": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "242",
      "descripcion": "Fabricación de otros productos químicos",
      "porZona": {
        "IND-LV": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "243",
      "descripcion": "Fabricación de fibras sintéticas y artificiales",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "252",
      "descripcion": "Fabricación de productos de plástico",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 120,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "261",
      "descripcion": "Fabricación de vidrio y productos de vidrio",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 121,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "273",
      "descripcion": "Fundición de metales",
      "porZona": {
        "IND-LV": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 121,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "281",
      "descripcion": "Fabricación de productos metálicos para uso estructural, tanques, depósitos y generadores de vapor",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 121,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "289",
      "descripcion": "Fabricación de otros productos elaborados de metal y actividades de servicios relacionadas con el trabajo de metales",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 121,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "291",
      "descripcion": "Fabricación de maquinaria de uso general",
      "porZona": {
        "IND-LV": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 121,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "293",
      "descripcion": "Fabricación de aparatos de uso doméstico ncp",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 121,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "300",
      "descripcion": "Fabricación de maquinaria de oficina, contabilidad e informática",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 121,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "311",
      "descripcion": "Fabricación de motores, generadores y transformadores eléctricos",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 122,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "312",
      "descripcion": "Fabricación de aparatos de distribución y control de la energía eléctrica",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 122,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "313",
      "descripcion": "Fabricación de hilos y cables aislados",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 122,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "314",
      "descripcion": "Fabricación de acumuladores y de pilas eléctricas",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 122,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "315",
      "descripcion": "Fabricación de lámparas eléctricas y equipo de iluminación",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 122,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "319",
      "descripcion": "Fabricación de otros tipos de equipo eléctrico ncp",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 122,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "321",
      "descripcion": "Fabricación de tubos y válvulas electrónicas y de otros componentes electrónicos",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 122,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "322",
      "descripcion": "Fabricación de transmisores de radio y televisión y de aparatos para telefonía y telegrafía",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 122,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "323",
      "descripcion": "Fabricación de receptores de radio y televisión, de aparatos de grabación y de reproducción de sonido o de la imagen, y de productos conexos",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 122,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "331",
      "descripcion": "Fabricación de aparatos e instrumentos médicos y de aparatos para medir, verificar, ensayar, navegar y otros fines, excepto instrumentos de óptica",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 123,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "332",
      "descripcion": "Fabricación de instrumentos ópticos y de equipo fotográfico",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 123,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "333",
      "descripcion": "Fabricación de relojes",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 123,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "341",
      "descripcion": "Fabricación de vehículos automotores y sus motores",
      "porZona": {
        "IND-LV": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 123,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "342",
      "descripcion": "Fabricación de carrocerías para vehículos automotores; fabricación de remolques y semirremolques",
      "porZona": {
        "IND-LV": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 123,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "343",
      "descripcion": "Fabricación de partes, piezas (autopartes) y accesorios (lujos) para vehículos automotores y para sus motores",
      "porZona": {
        "IND-LV": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 123,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "359",
      "descripcion": "Fabricación de otros tipos de equipo de transporte ncp",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 123,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "361",
      "descripcion": "Fabricación de muebles",
      "porZona": {
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 123,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "369",
      "descripcion": "Industrias manufactureras ncp",
      "porZona": {
        "IND-LCP": "C",
        "CT": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 124,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "371",
      "descripcion": "Reciclaje de desperdicios y de desechos metálicos",
      "porZona": {
        "IND-LV": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 124,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "372",
      "descripcion": "Reciclaje de desperdicios y desechos no metálicos",
      "porZona": {
        "IND-LV": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 124,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "501",
      "descripcion": "Comercio de vehículos automotores",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "R",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 124,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "502",
      "descripcion": "Mantenimiento y reparación de vehículos automotores",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 124,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "503",
      "descripcion": "Comercio de partes, piezas (autopartes) y accesorios (lujos) para vehículos automotores",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 124,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "504",
      "descripcion": "Comercio, mantenimiento y reparación de motocicletas y de sus partes, piezas y accesorios",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 124,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "505",
      "descripcion": "Comercio al por menor de combustible, lubricantes, aditivos y productos de limpieza para automotores",
      "porZona": {
        "IND-LV": "R",
        "IND-LCP": "R",
        "CT": "R",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 124,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "511",
      "descripcion": "Comercio al por mayor a cambio de una retribución o por contrata",
      "porZona": {
        "IND-LV": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 125,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "513",
      "descripcion": "Comercio al por mayor de productos de uso doméstico",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 125,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "514",
      "descripcion": "Comercio al por mayor de materiales de construcción, vidrio, equipo y materiales de fontanería",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 125,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "515",
      "descripcion": "Comercio al por mayor de productos intermedios, desperdicios y desechos no agropecuarios",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 125,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "516",
      "descripcion": "Comercio al por mayor de todo tipo de maquinaria y equipo, excepto comercio de vehículos automotores",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 125,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "517",
      "descripcion": "Mantenimiento y reparación de maquinaria y equipo",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 125,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "519",
      "descripcion": "Comercio al por mayor de productos diversos ncp",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 125,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "521",
      "descripcion": "Comercio al por menor en establecimientos no especializados",
      "porZona": {
        "IND-LCP": "R",
        "CT": "P",
        "CU": "C",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 125,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "522",
      "descripcion": "Comercio al por menor de alimentos, bebidas y tabacos y en establecimientos especializados",
      "porZona": {
        "IND-LCP": "R",
        "CT": "P",
        "CU": "C",
        "COR1": "C",
        "COR2": "C",
        "COR3": "C",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 126,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "523",
      "descripcion": "Comercio al por menor de productos nuevos de consumo doméstico, en establecimientos especializados",
      "porZona": {
        "CT": "P",
        "CU": "C",
        "COR1": "P",
        "COR2": "P",
        "COR3": "P",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 126,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "524",
      "descripcion": "Comercio al por menor de otros nuevos productos de consumo, en establecimientos especializados",
      "porZona": {
        "CT": "P",
        "CU": "C",
        "COR1": "P",
        "COR2": "P",
        "COR3": "P",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 126,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "525",
      "descripcion": "Comercio al por menor de artículos usados y actividades de compraventa con pacto de retroventa, en establecimientos especializados",
      "porZona": {
        "CT": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 126,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "527",
      "descripcion": "Reparación de efectos personales y enseres domésticos",
      "porZona": {
        "CT": "C",
        "CU": "C",
        "COR1": "C",
        "COR2": "C",
        "COR3": "C",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 126,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "551",
      "descripcion": "Alojamiento en hoteles, campamentos y otros tipos de hospedaje no permanente",
      "porZona": {
        "CT": "R",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 126,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "552",
      "descripcion": "Expendio de alimentos preparados en el sitio de venta",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "P",
        "CU": "C",
        "COR1": "P",
        "COR2": "P",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 126,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "553",
      "descripcion": "Expendio de bebidas alcohólicas para el consumo dentro del establecimiento",
      "porZona": {
        "CT": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 126,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "631",
      "descripcion": "Manipulación de carga",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 127,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "632",
      "descripcion": "Almacenamiento y depósito",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 127,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "633",
      "descripcion": "Actividades de las estaciones, vías y servicios complementarios para el transporte",
      "porZona": {
        "IND-LV": "P",
        "IND-LCP": "C",
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 127,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "634",
      "descripcion": "Actividades de agencias de viajes y organizadores de viajes; actividades de asistencia a turistas ncp",
      "porZona": {
        "CT": "P",
        "CU": "C",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 127,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "641",
      "descripcion": "Actividades postales y de correo",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 127,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "642",
      "descripcion": "Telecomunicaciones",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "C",
        "CU": "C",
        "COR1": "P",
        "COR2": "P",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 127,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "651",
      "descripcion": "Intermediación monetaria",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "P",
        "CU": "C",
        "COR1": "C",
        "COR2": "C",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 127,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "659",
      "descripcion": "Otros tipos de intermediación financiera",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "P",
        "CU": "C",
        "COR1": "C",
        "COR2": "C",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 127,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "660",
      "descripcion": "Establecimiento y gestión de planes de seguros, de pensiones y cesantías, excepto los planes de seguridad social de afiliación obligatoria",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "P",
        "CU": "C",
        "COR1": "C",
        "COR2": "C",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 128,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "671",
      "descripcion": "Actividades de servicios auxiliares de la intermediación financiera, excepto el establecimiento y gestión de planes de seguros, de pensiones y cesantías",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "P",
        "CU": "C",
        "COR1": "C",
        "COR2": "C",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 128,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "672",
      "descripcion": "Actividades de servicios auxiliares del establecimiento y gestión de planes de seguros, de pensiones y cesantías",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "P",
        "CU": "C",
        "COR1": "C",
        "COR2": "C",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 128,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "701",
      "descripcion": "Actividades inmobiliarias realizadas con bienes propios o arrendados",
      "porZona": {
        "CT": "P",
        "CU": "P",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 128,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "702",
      "descripcion": "Actividades inmobiliarias realizadas a cambio de una retribución o por contrata",
      "porZona": {
        "CT": "P",
        "CU": "P",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 128,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "711",
      "descripcion": "Alquiler de equipo de transporte",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 128,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "712",
      "descripcion": "Alquiler de otros tipos de maquinaria y equipo",
      "porZona": {
        "IND-LV": "C",
        "IND-LCP": "C",
        "CT": "R",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 128,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "713",
      "descripcion": "Alquiler de efectos personales y enseres domésticos ncp",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 129,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "721",
      "descripcion": "Consultores en equipo de informática",
      "porZona": {
        "IND-LCP": "C",
        "CT": "P",
        "CU": "P",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 129,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "722",
      "descripcion": "Consultores en programas de informática, elaboración y suministro de programas de informática",
      "porZona": {
        "IND-LCP": "C",
        "CT": "P",
        "CU": "P",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 129,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "723",
      "descripcion": "Procesamiento de datos",
      "porZona": {
        "IND-LCP": "C",
        "CT": "P",
        "CU": "P",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 129,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "724",
      "descripcion": "Actividades relacionadas con bases de datos y distribución en línea de contenidos electrónicos",
      "porZona": {
        "IND-LCP": "C",
        "CT": "P",
        "CU": "P",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C",
        "RES": "C",
        "EXP": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 129,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "725",
      "descripcion": "Mantenimiento y reparación de maquinaria de oficina, contabilidad e informática",
      "porZona": {
        "CT": "P",
        "CU": "C",
        "COR1": "P",
        "COR2": "C",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 129,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "729",
      "descripcion": "Otras actividades de informática",
      "porZona": {
        "IND-LCP": "C",
        "CT": "P",
        "CU": "P",
        "COR1": "P",
        "COR2": "C",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 129,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "731",
      "descripcion": "Investigación y desarrollo experimental en el campo de las ciencias naturales, ciencias de la salud, ciencias agropecuarias y la ingeniería",
      "porZona": {
        "IND-LV": "R",
        "IND-LCP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 129,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "732",
      "descripcion": "Investigación y desarrollo experimental en el campo de las ciencias sociales y las humanidades",
      "porZona": {
        "IND-LV": "R",
        "IND-LCP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 129,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "741",
      "descripcion": "Actividades jurídicas y de contabilidad, teneduría de libros y auditoría; asesoramiento en materia de impuestos; estudio de mercados y realización de encuestas de opinión pública; asesoramiento empresarial y en materia de gestión",
      "porZona": {
        "CT": "P",
        "CU": "P",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 130,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "742",
      "descripcion": "Actividades de arquitectura e ingeniería y otras actividades técnicas",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 130,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "743",
      "descripcion": "Publicidad",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 130,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "749",
      "descripcion": "Actividades empresariales ncp",
      "porZona": {
        "CT": "P",
        "CU": "P",
        "COR1": "P",
        "COR2": "P",
        "COR3": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 130,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "751",
      "descripcion": "Administración del estado y aplicación de la política económica y social de la comunidad",
      "porZona": {
        "CT": "P",
        "CU": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 130,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "752",
      "descripcion": "Prestación de servicios a la comunidad en general",
      "porZona": {
        "IND-LV": "C",
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 130,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "753",
      "descripcion": "Actividades de planes de seguridad social de afiliación obligatoria",
      "porZona": {
        "IND-LV": "R",
        "IND-LCP": "R",
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 130,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "801",
      "descripcion": "Educación preescolar y básica primaria",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 130,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "802",
      "descripcion": "Educación secundaria",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 130,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "803",
      "descripcion": "Educación superior",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "809",
      "descripcion": "Otros tipos de educación",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "851",
      "descripcion": "Actividades relacionadas con la salud humana",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "852",
      "descripcion": "Actividades veterinarias",
      "porZona": {
        "CT": "R",
        "COR1": "R",
        "COR2": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "853",
      "descripcion": "Actividades de servicios sociales",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "911",
      "descripcion": "Actividades de organizaciones empresariales, profesionales y de empleadores",
      "porZona": {
        "CT": "C",
        "CU": "C",
        "COR1": "P",
        "COR2": "P",
        "COR3": "P"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "912",
      "descripcion": "Actividades de sindicatos",
      "porZona": {
        "CT": "C",
        "COR1": "C",
        "COR2": "C"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "919",
      "descripcion": "Actividades de otras asociaciones",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "921",
      "descripcion": "Actividades de cinematografía, radio y televisión y otras actividades de entretenimiento",
      "porZona": {
        "CT": "C",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "923",
      "descripcion": "Actividades de bibliotecas, archivos, museos y otras actividades culturales",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "924",
      "descripcion": "Actividades deportivas y otras actividades de esparcimiento",
      "porZona": {
        "IND-LV": "R",
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 131,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "930",
      "descripcion": "Otras actividades de servicios",
      "porZona": {
        "CT": "R",
        "CU": "R",
        "COR1": "R",
        "COR2": "R",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 132,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "ciiu": "990",
      "descripcion": "Organizaciones y órganos extraterritoriales",
      "porZona": {
        "CT": "C",
        "CU": "R",
        "COR1": "C",
        "COR2": "C",
        "COR3": "R",
        "RES": "R",
        "EXP": "R"
      },
      "fuente": {
        "articulo": "186",
        "paginaPdf": 132,
        "verificacion": "extraido_de_texto"
      }
    }
  ],
  "sinInterpretar": [],
  "criteriosRestringido": {
    "articulo": "184",
    "paginaPdf": 117,
    "criterios": [
      "Reglamentación específica del uso (establecimientos abiertos al público, distancias entre estaciones de servicio, entre droguerías, etc.).",
      "Análisis urbanístico de ubicación e impacto.",
      "Dimensión del inmueble.",
      "Impacto ambiental y sanitario.",
      "Impacto urbanístico y social.",
      "Del análisis de un uso restringido puede concluirse que no está permitido."
    ]
  },
  "disposicionesGenerales": [
    {
      "tema": "Usos principales, complementarios, restringidos y prohibidos",
      "resumen": "Los usos prohibidos son los que riñen con la vocación de la zona. Una celda vacía en la Tabla 27 no está definida: no se toma como prohibición expresa [verificar].",
      "fuente": {
        "articulo": "183",
        "paginaPdf": 116,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "tema": "Usos restringidos",
      "resumen": "El uso restringido se limita al cumplimiento de criterios específicos; puede terminar en no permitido.",
      "fuente": {
        "articulo": "184",
        "paginaPdf": 117,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "tema": "Usos prohibidos expresos",
      "resumen": "Casinos, bingos, videobingos y máquinas tragamonedas de juegos de azar, y los usos del art. 1 del Decreto 4002 de 2004, están prohibidos.",
      "fuente": {
        "articulo": "186 par. 2",
        "paginaPdf": 133,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "tema": "Venta de licor para consumo en el sitio",
      "resumen": "Solo en cinco polígonos dentro del Centro Tradicional [verificar texto exacto].",
      "fuente": {
        "articulo": "197",
        "paginaPdf": 138,
        "verificacion": "extraido_de_texto"
      }
    },
    {
      "tema": "Saturación de usos",
      "resumen": "Los arts. 190-193 fijan límites de saturación por cara de manzana según el tipo de corredor [verificar].",
      "fuente": {
        "articulo": "190-193",
        "paginaPdf": 135,
        "verificacion": "extraido_de_texto"
      }
    }
  ]
})

// ---- Zona del punto (capa 11 de POT_Envigado, campo DESCRIPCION) ----
// Solo se emparejan las descripciones que coinciden por nombre con una columna de la Tabla 27.
// Las demás (baja mixtura, mediana mixtura, corredores, área alta mixtura) NO se adivinan [verificar con el acuerdo].
const sinTildesEnv = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
const ZONA_POR_DESCRIPCION = { 'centro tradicional': 'CT' }
const SIN_COLUMNA = ['ep proyectado']

export function zonaDeEnvigado(resultadoTerritorial) {
  const lecturas = (resultadoTerritorial?.bloques ?? [])
    .filter((b) => b.tipo === 'uso_normativo_pot')
    .flatMap((b) => b.registros ?? [])
    .map((r) => {
      const a = Object.assign({}, r, r?.atributos, r?.atributosLimpios, r?.atributosOriginales)
      return a.DESCRIPCION ?? a.descripcion ?? null
    })
    .filter(Boolean)
  const descripciones = [...new Set(lecturas.map((d) => String(d).trim()))]
  if (descripciones.length === 0) return { estado: 'sin_registros' }
  if (descripciones.length > 1) return { estado: 'varias_zonas', descripciones }
  const descripcion = descripciones[0]
  const clave = sinTildesEnv(descripcion)
  if (ZONA_POR_DESCRIPCION[clave]) return { estado: 'ok', zonaCodigo: ZONA_POR_DESCRIPCION[clave], descripcion }
  if (SIN_COLUMNA.includes(clave)) return { estado: 'sin_columna', descripcion }
  return { estado: 'sin_equivalencia', descripcion }
}

// Actividades que la Tabla 27 no nombra: filas CIIU entre las que la persona elige. Son suposiciones [verificar].
export const CIIU_CANDIDATOS = Object.freeze({
  licorera: ['522', '553'],
  supermercado: ['521', '522'],
  minimercado: ['521', '522'],
  gimnasio: ['924', '930'],
  farmacia: ['523', '522'],
  tienda_tecnologia: ['524', '523']
})
