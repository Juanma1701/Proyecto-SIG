#!/usr/bin/env python3
"""Genera src/utils/normativa/envigado.js (datos puros) desde data/tabla27-envigado.json. Uso: python3 -I generar-envigado.py <json> <salida.js>"""
import json, sys
d = json.load(open(sys.argv[1], encoding='utf-8'))
V = 'extraido_de_texto'
def fuente(art, pag): return dict(articulo=art, paginaPdf=pag, verificacion=V)
Z = [('IND-LV','Industrial Las Vegas','Polígono industrial Las Vegas (art. 185).'),
 ('IND-LCP','Industrial Las Casitas-Primavera','Polígono industrial Las Casitas-Primavera (art. 185).'),
 ('CT','Centro tradicional','Columna «Centro tradicional» de la Tabla 27; polígonos en el plano UF-04.'),
 ('CU','Centros urbanos','Columna «Centros urbanos» de la Tabla 27 (centralidades, art. 185).'),
 ('COR1','Corredor tipo 1','Columna «Corredor tipo 1» de la Tabla 27 (corredores de actividad múltiple).'),
 ('COR2','Corredor tipo 2','Columna «Corredor tipo 2» de la Tabla 27.'),
 ('COR3','Corredor tipo 3','Columna «Corredor tipo 3» de la Tabla 27.'),
 ('RES','Residencial','Columna «Residencial» de la Tabla 27 (polígonos residenciales, art. 185).'),
 ('EXP','Suelo de expansión','Columna «Suelo de expansión» de la Tabla 27.')]
assert [z[0] for z in Z] == d['informe']['zonas']
reglas = [dict(ciiu=f['ciiu'], descripcion=f['descripcion'], porZona=f['porZona'],
               fuente=fuente('186 (Tabla 27)', f['paginaImpresa'])) for f in d['filas']]
sin = [dict(ciiu=f['ciiu'], descripcion=f['descripcion'], letras=f['letras'], paginaPdf=f['paginaImpresa'], motivo=f['motivo']) for f in d['sinInterpretar']]
inst = dict(
 municipioSlug='Envigado', nombre='Acuerdo 010 de 2011 - Plan de Ordenamiento Territorial 2011-2023 (Envigado)',
 fechaAdopcion='2011-04-12', fechaConsulta='2026-11-17',
 vigencia=dict(estado='por_verificar', fuente='POT 2011-2023 vencido; modificaciones posibles: Decreto 600 de 2019, Decreto 651 de 2024 y un Compendio normativo, sin contrastar [verificar]'),
 cobertura='parcial', fuente=dict(url='https://www.envigado.gov.co', nota='[verificar] URL exacta del acuerdo; datos tomados del PDF aportado por el usuario'),
 limitaciones=[
  'Vigencia por verificar: el POT 2011-2023 está vencido y pudo ser modificado (Decreto 600 de 2019, Decreto 651 de 2024, Compendio normativo). Contrastar con Planeación de Envigado.',
  f"Tabla 27 leída del texto del PDF, sin posición de columnas: solo {len(reglas)} de {len(reglas)+len(sin)} filas CIIU tienen sus letras asignadas a zonas; el resto está en sinInterpretar [verificar con el PDF].",
  'Un uso restringido (R) nunca es un permiso: depende de los criterios del art. 184.',
  'Los usos no definidos en la Tabla 27 requieren concepto del Comité Municipal de Usos del Suelo (par. 1 art. 186).'],
 zonas=[dict(codigo=c, nombre=n, descripcion=ds, fuente=fuente('185-186 (Tabla 27)', 119)) for c,n,ds in Z],
 reglasPorCiiu=reglas, sinInterpretar=sin,
 criteriosRestringido=dict(articulo='184', paginaPdf=117, criterios=[
  'Reglamentación específica del uso (establecimientos abiertos al público, distancias entre estaciones de servicio, entre droguerías, etc.).',
  'Análisis urbanístico de ubicación e impacto.', 'Dimensión del inmueble.', 'Impacto ambiental y sanitario.', 'Impacto urbanístico y social.',
  'Del análisis de un uso restringido puede concluirse que no está permitido.']),
 disposicionesGenerales=[
  dict(tema='Usos principales, complementarios, restringidos y prohibidos', resumen='Lo que la Tabla 27 no señala para una zona se considera prohibido.', fuente=fuente('183', 116)),
  dict(tema='Usos restringidos', resumen='El uso restringido se limita al cumplimiento de criterios específicos; puede terminar en no permitido.', fuente=fuente('184', 117)),
  dict(tema='Usos prohibidos expresos', resumen='Casinos, bingos, videobingos y máquinas tragamonedas de juegos de azar, y los usos del art. 1 del Decreto 4002 de 2004, están prohibidos.', fuente=fuente('186 par. 2', 133)),
  dict(tema='Venta de licor para consumo en el sitio', resumen='Solo en cinco polígonos dentro del Centro Tradicional [verificar texto exacto].', fuente=fuente('197', 138)),
  dict(tema='Saturación de usos', resumen='Los arts. 190-193 fijan límites de saturación por cara de manzana según el tipo de corredor [verificar].', fuente=fuente('190-193', 135))])
js = ("// Norma de usos del suelo de Envigado (Acuerdo 010 de 2011, Tabla 27). Archivo GENERADO por scripts/generar-envigado.py: no editar a mano.\n"
 "// Datos puros: sin red, sin React. Modelo por CIIU y zona (ver esquema.js).\n\nimport { congelar } from './esquema.js'\n\n"
 "export const ENVIGADO = congelar(" + json.dumps(inst, ensure_ascii=False, indent=2) + ")\n")
open(sys.argv[2], 'w', encoding='utf-8').write(js)
print(len(reglas), len(sin))
