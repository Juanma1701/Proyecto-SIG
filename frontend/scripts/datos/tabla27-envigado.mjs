// Tabla 27 del Acuerdo 010 de 2011 de Envigado (art. 186, "Usos en el suelo urbano y de expansión urbana"),
// págs. 118 a 132 del PDF (el número impreso coincide con el del PDF). 123 filas CIIU x 9 zonas.
// Las letras se leyeron POR POSICIÓN con pdfplumber (las páginas están giradas): cada celda se asignó a la columna
// cuyo rango de coordenadas contiene la letra. Sin revisión humana [verificar].
// Cada fila: [CIIU, página del PDF, cadena de 9 caracteres, descripción]. En la cadena, el orden de las columnas es
// el de COLUMNAS; P = uso principal, C = complementario, R = restringido, "." = celda vacía (el acuerdo no la define).

export const COLUMNAS = Object.freeze([
  'Industrial Las Vegas',
  'Industrial Las Casitas Primavera',
  'Centro tradicional',
  'Centros urbanos',
  'Corredor tipo 1',
  'Corredor tipo 2',
  'Corredor tipo 3',
  'Residencial',
  'Suelo de expansión'
])

const sinTildes = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

// Índice de la columna (0 a 8) a la que corresponde una zona de ENVIGADO.zonas, según su nombre; null si no se sabe.
export function columnaDeZona(zona) {
  const t = sinTildes(zona?.nombre ?? zona?.descripcion ?? zona?.nombreZona)
  if (!t) return null
  if (t.includes('vegas')) return 0
  if (t.includes('casitas') || t.includes('primavera')) return 1
  if (t.includes('tradicional')) return 2
  if (t.includes('urbanos')) return 3
  if (/tipo\s*1\b/.test(t)) return 4
  if (/tipo\s*2\b/.test(t)) return 5
  if (/tipo\s*3\b/.test(t)) return 6
  if (t.includes('expansi')) return 8
  if (t.includes('residencial')) return 7
  return null
}

export const FILAS = Object.freeze([
  ['151', 118, 'P........', 'Producción, procesamiento y conservación de carne y pescado'],
  ['152', 118, 'PC..RRRRR', 'Procesamiento de frutas, legumbres, hortalizas, aceites y grasas'],
  ['153', 118, 'P........', 'Elaboración de productos lácteos'],
  ['154', 118, 'PC.......', 'Elaboración de productos de molinería, almidones y productos derivados del almidón, y de alimentos preparados para animales'],
  ['156', 118, 'P........', 'Elaboración de productos de café'],
  ['158', 118, 'CRRRRRRRR', 'Elaboración de otros productos alimenticios'],
  ['159', 118, 'PC.......', 'Elaboración de bebidas'],
  ['171', 118, 'PP.......', 'Preparación e hilatura de fibras textiles'],
  ['172', 118, 'PP.......', 'Tejedura de productos textiles'],
  ['173', 118, 'CP.......', 'Acabado de productos textiles no producidos en la misma unidad de producción'],
  ['174', 118, 'CP..RRRRR', 'Fabricación de otros productos textiles'],
  ['175', 119, '.P..RRRRR', 'Fabricación de tejidos y artículos de punto y ganchillo'],
  ['181', 119, '.PRRRRRRR', 'Confección de prendas de vestir, excepto prendas de piel'],
  ['192', 119, 'PR.......', 'Fabricación de calzado'],
  ['193', 119, '.C..RRRRR', 'Fabricación de artículos de viaje, bolsos de mano y artículos similares, y fabricación de artículos de talabartería y guarnicionería'],
  ['201', 119, 'PP.......', 'Aserrado, acepillado e impregnación de la madera'],
  ['202', 119, 'PC.......', 'Fabricación de hojas de madera para enchapado; fabricación de tableros contrachapados, tableros laminados, tableros de partículas y otros tableros y paneles'],
  ['203', 119, '.P...RR..', 'Fabricación de partes y piezas de carpintería para edificios y construcciones'],
  ['204', 120, '.P....R..', 'Fabricación de recipientes de madera'],
  ['209', 120, '.PRRRRR..', 'Fabricación de otros productos de madera; fabricación de artículos de corcho, cestería y espartería'],
  ['210', 120, 'R........', 'Fabricación de papel, cartón y productos de papel y cartón'],
  ['221', 120, '..PCPPPRR', 'Actividades de edición'],
  ['222', 120, 'CPR.CCC..', 'Actividades de impresión'],
  ['223', 120, 'CPR.CCC..', 'Actividades de servicios relacionadas con la impresión'],
  ['224', 120, '..C.CC...', 'Reproducción de grabaciones'],
  ['241', 120, 'R........', 'Fabricación de sustancias químicas básicas'],
  ['242', 120, 'R........', 'Fabricación de otros productos químicos'],
  ['243', 120, 'PC.......', 'Fabricación de fibras sintéticas y artificiales'],
  ['252', 120, 'PC.......', 'Fabricación de productos de plástico'],
  ['261', 121, 'PC.......', 'Fabricación de vidrio y productos de vidrio'],
  ['273', 121, 'R........', 'Fundición de metales'],
  ['281', 121, 'C........', 'Fabricación de productos metálicos para uso estructural, tanques, depósitos y generadores de vapor'],
  ['289', 121, 'CC.......', 'Fabricación de otros productos elaborados de metal y actividades de servicios relacionadas con el trabajo de metales'],
  ['291', 121, 'P........', 'Fabricación de maquinaria de uso general'],
  ['293', 121, 'PC.......', 'Fabricación de aparatos de uso doméstico ncp'],
  ['300', 121, 'CC.......', 'Fabricación de maquinaria de oficina, contabilidad e informática'],
  ['311', 122, 'C........', 'Fabricación de motores, generadores y transformadores eléctricos'],
  ['312', 122, 'C........', 'Fabricación de aparatos de distribución y control de la energía eléctrica'],
  ['313', 122, 'C........', 'Fabricación de hilos y cables aislados'],
  ['314', 122, 'C........', 'Fabricación de acumuladores y de pilas eléctricas'],
  ['315', 122, 'CC.......', 'Fabricación de lámparas eléctricas y equipo de iluminación'],
  ['319', 122, 'C........', 'Fabricación de otros tipos de equipo eléctrico ncp'],
  ['321', 122, 'C........', 'Fabricación de tubos y válvulas electrónicas y de otros componentes electrónicos'],
  ['322', 122, 'C........', 'Fabricación de transmisores de radio y televisión y de aparatos para telefonía y telegrafía'],
  ['323', 122, 'C........', 'Fabricación de receptores de radio y televisión, de aparatos de grabación y de reproducción de sonido o de la imagen, y de productos conexos'],
  ['331', 123, 'CP.......', 'Fabricación de aparatos e instrumentos médicos y de aparatos para medir, verificar, ensayar, navegar y otros fines, excepto instrumentos de óptica'],
  ['332', 123, 'CP.......', 'Fabricación de instrumentos ópticos y de equipo fotográfico'],
  ['333', 123, 'CP.......', 'Fabricación de relojes'],
  ['341', 123, 'P........', 'Fabricación de vehículos automotores y sus motores'],
  ['342', 123, 'P........', 'Fabricación de carrocerías para vehículos automotores; fabricación de remolques y semirremolques'],
  ['343', 123, 'P........', 'Fabricación de partes, piezas (autopartes) y accesorios (lujos) para vehículos automotores y para sus motores'],
  ['359', 123, 'PC.......', 'Fabricación de otros tipos de equipo de transporte ncp'],
  ['361', 123, '.C.......', 'Fabricación de muebles'],
  ['369', 124, '.CR.RRR..', 'Industrias manufactureras ncp'],
  ['371', 124, 'R........', 'Reciclaje de desperdicios y de desechos metálicos'],
  ['372', 124, 'R........', 'Reciclaje de desperdicios y desechos no metálicos'],
  ['501', 124, 'CCR.RR...', 'Comercio de vehículos automotores'],
  ['502', 124, 'CC..RR...', 'Mantenimiento y reparación de vehículos automotores'],
  ['503', 124, 'CCR.RRR..', 'Comercio de partes, piezas (autopartes) y accesorios (lujos) para vehículos automotores'],
  ['504', 124, 'CCR.RRR..', 'Comercio, mantenimiento y reparación de motocicletas y de sus partes, piezas y accesorios'],
  ['505', 124, 'RRR.RR...', 'Comercio al por menor de combustible, lubricantes, aditivos y productos de limpieza para automotores'],
  ['511', 125, 'C........', 'Comercio al por mayor a cambio de una retribución o por contrata'],
  ['513', 125, 'CC..RR...', 'Comercio al por mayor de productos de uso doméstico'],
  ['514', 125, 'CC..RR...', 'Comercio al por mayor de materiales de construcción, vidrio, equipo y materiales de fontanería'],
  ['515', 125, 'CC..RR...', 'Comercio al por mayor de productos intermedios, desperdicios y desechos no agropecuarios'],
  ['516', 125, 'CC..RR...', 'Comercio al por mayor de todo tipo de maquinaria y equipo, excepto comercio de vehículos automotores'],
  ['517', 125, 'CC.......', 'Mantenimiento y reparación de maquinaria y equipo'],
  ['519', 125, 'CC..RR...', 'Comercio al por mayor de productos diversos ncp'],
  ['521', 125, '.RPCPPCCC', 'Comercio al por menor en establecimientos no especializados'],
  ['522', 126, '.RPCCCCCC', 'Comercio al por menor de alimentos, bebidas y tabacos y en establecimientos especializados'],
  ['523', 126, '..PCPPPCC', 'Comercio al por menor de productos nuevos de consumo doméstico, en establecimientos especializados'],
  ['524', 126, '..PCPPPCC', 'Comercio al por menor de otros nuevos productos de consumo, en establecimientos especializados'],
  ['525', 126, '..R.RRR..', 'Comercio al por menor de artículos usados y actividades de compraventa con pacto de retroventa, en establecimientos especializados'],
  ['527', 126, '..CCCCCRR', 'Reparación de efectos personales y enseres domésticos'],
  ['551', 126, '..R.RR...', 'Alojamiento en hoteles, campamentos y otros tipos de hospedaje no permanente'],
  ['552', 126, 'CCPCPPRRR', 'Expendio de alimentos preparados en el sitio de venta'],
  ['553', 126, '..R......', 'Expendio de bebidas alcohólicas para el consumo dentro del establecimiento'],
  ['631', 127, 'PC.......', 'Manipulación de carga'],
  ['632', 127, 'PC.......', 'Almacenamiento y depósito'],
  ['633', 127, 'PCRRRRRRR', 'Actividades de las estaciones, vías y servicios complementarios para el transporte'],
  ['634', 127, '..PCPPCCC', 'Actividades de agencias de viajes y organizadores de viajes; actividades de asistencia a turistas ncp'],
  ['641', 127, 'CCR.RRR..', 'Actividades postales y de correo'],
  ['642', 127, 'CCCCPPRRR', 'Telecomunicaciones'],
  ['651', 127, 'CCPCCCC..', 'Intermediación monetaria'],
  ['659', 127, 'CCPCCCC..', 'Otros tipos de intermediación financiera'],
  ['660', 128, 'CCPCCCC..', 'Establecimiento y gestión de planes de seguros, de pensiones y cesantías, excepto los planes de seguridad social de afiliación obligatoria'],
  ['671', 128, 'CCPCCCC..', 'Actividades de servicios auxiliares de la intermediación financiera, excepto el establecimiento y gestión de planes de seguros, de pensiones y cesantías'],
  ['672', 128, 'CCPCCCC..', 'Actividades de servicios auxiliares del establecimiento y gestión de planes de seguros, de pensiones y cesantías'],
  ['701', 128, '..PPPPCCC', 'Actividades inmobiliarias realizadas con bienes propios o arrendados'],
  ['702', 128, '..PPPPCCC', 'Actividades inmobiliarias realizadas a cambio de una retribución o por contrata'],
  ['711', 128, 'CCRRRRR..', 'Alquiler de equipo de transporte'],
  ['712', 128, 'CCR.RR...', 'Alquiler de otros tipos de maquinaria y equipo'],
  ['713', 129, '..RRRRRRR', 'Alquiler de efectos personales y enseres domésticos ncp'],
  ['721', 129, '.CPPPPCCC', 'Consultores en equipo de informática'],
  ['722', 129, '.CPPPPCCC', 'Consultores en programas de informática, elaboración y suministro de programas de informática'],
  ['723', 129, '.CPPPPCCC', 'Procesamiento de datos'],
  ['724', 129, '.CPPPPCCC', 'Actividades relacionadas con bases de datos y distribución en línea de contenidos electrónicos'],
  ['725', 129, '..PCPCC..', 'Mantenimiento y reparación de maquinaria de oficina, contabilidad e informática'],
  ['729', 129, '.CPPPCC..', 'Otras actividades de informática'],
  ['731', 129, 'RR.......', 'Investigación y desarrollo experimental en el campo de las ciencias naturales, ciencias de la salud, ciencias agropecuarias y la ingeniería'],
  ['732', 129, 'RR.......', 'Investigación y desarrollo experimental en el campo de las ciencias sociales y las humanidades'],
  ['741', 130, '..PPPPCRR', 'Actividades jurídicas y de contabilidad, teneduría de libros y auditoría; asesoramiento en materia de impuestos; estudio de mercados y realización de encuestas de opinión pública; asesoramiento empresarial y en materia de gestión'],
  ['742', 130, '..RRRRRRR', 'Actividades de arquitectura e ingeniería y otras actividades técnicas'],
  ['743', 130, '..RRRRRRR', 'Publicidad'],
  ['749', 130, '..PPPPC..', 'Actividades empresariales ncp'],
  ['751', 130, '..PC.....', 'Administración del estado y aplicación de la política económica y social de la comunidad'],
  ['752', 130, 'C.RRRRRRR', 'Prestación de servicios a la comunidad en general'],
  ['753', 130, 'RRRRRRR..', 'Actividades de planes de seguridad social de afiliación obligatoria'],
  ['801', 130, '..RRRRRRR', 'Educación preescolar y básica primaria'],
  ['802', 130, '..RRRRRRR', 'Educación secundaria'],
  ['803', 131, '..RRRRRRR', 'Educación superior'],
  ['809', 131, '..RRRRRRR', 'Otros tipos de educación'],
  ['851', 131, '..RRRRRRR', 'Actividades relacionadas con la salud humana'],
  ['852', 131, '..R.RR...', 'Actividades veterinarias'],
  ['853', 131, '..RRRRRRR', 'Actividades de servicios sociales'],
  ['911', 131, '..CCPPP..', 'Actividades de organizaciones empresariales, profesionales y de empleadores'],
  ['912', 131, '..C.CC...', 'Actividades de sindicatos'],
  ['919', 131, '..RRRRRRR', 'Actividades de otras asociaciones'],
  ['921', 131, '..CRRRRRR', 'Actividades de cinematografía, radio y televisión y otras actividades de entretenimiento'],
  ['923', 131, '..RRRRRRR', 'Actividades de bibliotecas, archivos, museos y otras actividades culturales'],
  ['924', 131, 'R.RRRRRRR', 'Actividades deportivas y otras actividades de esparcimiento'],
  ['930', 132, '..RRRRRRR', 'Otras actividades de servicios'],
  ['990', 132, '..CRCCRRR', 'Organizaciones y órganos extraterritoriales']
])