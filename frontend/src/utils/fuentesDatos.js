// Fuentes de datos y avisos. Es la ÚNICA copia de estos textos: la guía de uso
// (utils/contenidoGuia.js) y el informe PDF (utils/informePDF.js) los leen de aquí.
// Solo se afirma lo verificado. Si el AMVA llega a publicar una licencia para estos datos,
// se agrega en el campo `texto` de esa fuente.

// Versión de la capa de usos, según la propia tabla (fecha_adopcion y creado_en)
export const VERSION_USOS =
  'Capa con fecha de adopción del 17 de diciembre de 2014, descargada el 4 de noviembre de 2026.'

// La licencia CC BY-SA 4.0 exige indicar los cambios hechos al dato original
export const CAMBIOS_USOS =
  'Cambios hechos por GeoAburrá: se reproyectó a WGS84, el dibujo del mapa se simplificó (~4 m) y 12 polígonos no se pudieron descargar.'

export const FUENTES_DATOS = [
  {
    id: 'osm',
    titulo: 'OpenStreetMap',
    usa: 'Mapa base y capa de lugares',
    texto: 'Datos abiertos bajo la licencia ODbL. Crédito: “© OpenStreetMap contributors”.',
    enlace: { texto: 'openstreetmap.org/copyright', url: 'https://www.openstreetmap.org/copyright' }
  },
  {
    id: 'amva',
    titulo: 'Área Metropolitana del Valle de Aburrá (AMVA)',
    usa: 'Equipamientos, capas de datos abiertos, clasificación del suelo del POT y panel Territorio',
    texto:
      'Información geográfica compilada por el AMVA con datos proporcionados por las Alcaldías de los 10 municipios del Valle de Aburrá (compilación de septiembre de 2022; el año de cada dato depende de la vigencia del POT de cada municipio). ' +
      'Los datos de las capas, las estadísticas y el informe se descargaron y se guardaron en la base de datos del proyecto; entre ellos, una copia de la clasificación del suelo en Supabase. ' +
      'El panel Territorio, en cambio, consulta en vivo en cada clic los servicios REST de datos abiertos del AMVA (portalidem.metropol.gov.co) y muestra lo que esos servicios responden en ese momento. ' +
      'Los servicios consultados no declaran una licencia: se usa con fines académicos y citando la fuente. Los términos de uso de cada servicio deben consultarse en el portal del AMVA.',
    enlace: {
      texto: 'Servicios de mapas del AMVA',
      url: 'https://portalidem.metropol.gov.co/server/rest/services'
    }
  },
  {
    id: 'alcaldia',
    titulo: 'Alcaldías de Medellín, Itagüí, Envigado, Sabaneta y La Estrella',
    usa: 'Normas de uso del suelo de la tarjeta “¿Qué dice la norma?” (panel Territorio)',
    texto:
      'La evaluación normativa usa información pública de las alcaldías (acuerdos y planes de ordenamiento territorial). ' +
      'Esa información pertenece a sus entidades; GeoAburrá la presenta de forma orientativa. ' +
      'Las tablas se transcribieron de los documentos y pueden tener errores de transcripción. ' +
      'No se declara aquí ninguna licencia: los términos de uso de cada fuente deben consultarse en el portal de cada alcaldía.'
  },
  {
    id: 'alcaldia',
    titulo: 'Alcaldía de Medellín (GeoMedellín)',
    usa: 'Usos generales del suelo urbano (POT, Acuerdo 48 de 2014)',
    texto:
      'Titular: Distrito Especial de Ciencia, Tecnología e Innovación de Medellín (GeoMedellín). ' +
      'Recurso: “Usos Generales del Suelo Urbano”, creado por el Departamento Administrativo de Planeación, Subdirección de Planeación Territorial y Estratégica de Ciudad. ' +
      'Licencia: abierta CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0/deed.es). ' +
      'La propia Alcaldía describe esta capa como una aproximación técnica: la información oficial es el mapa protocolizado del Acuerdo 48 de 2014. ' +
      VERSION_USOS +
      ' ' +
      CAMBIOS_USOS +
      ' Los datos derivados de esta capa se ofrecen bajo la misma licencia. ' +
      'La Alcaldía de Medellín no se hace responsable por el uso, tratamiento o transformación de estos datos, ni por responsabilidades legales o económicas derivadas de su uso directo o indirecto.',
    enlace: {
      texto: 'Registro de la capa en el catálogo de GeoMedellín',
      url: 'https://www.medellin.gov.co/giscatalogacion/srv/api/records/45fe3f84-ce3e-4325-860f-b9c60435b65e'
    }
  }
]

export const AVISOS_DATOS = [
  'GeoAburrá es un proyecto universitario sin fines comerciales.',
  'La información se muestra como referencia: no reemplaza los mapas oficiales ni constituye un concepto de uso del suelo, de riesgo o un trámite ante ninguna entidad.',
  'La lectura de la norma por actividad es orientativa: no es un concepto de uso del suelo ni una licencia, y debe confirmarse con la oficina de Planeación del municipio.',
  'La vigencia de las normas cargadas no está verificada en la gaceta oficial; algunas están vencidas o pueden haber sido modificadas.',
  'Los datos de las capas, las estadísticas y el informe se descargaron una vez y se guardaron en la base del proyecto, por eso pueden no reflejar cambios posteriores de la fuente. El panel Territorio consulta los servicios del AMVA en el momento de cada consulta.',
  'Cada entidad conserva los derechos sobre sus datos. Si vas a reutilizarlos, revisa la licencia que publica cada una.'
]