#!/usr/bin/env python3
"""Parser de la Tabla 27 (Acuerdo 010 de 2011, Envigado) desde el TEXTO del PDF.
Uso: python3 -I parse-tabla27-envigado.py <texto.txt> <salida.json>
El texto plano NO conserva la posición de columna: solo las filas con 9 letras (una por zona) se asignan a zonas;
el resto va a `sinInterpretar` con sus letras crudas. Con el PDF binario se debe repetir en modo -layout [verificar]."""
import re, sys, json
ZONAS = ['IND-LV','IND-LCP','CT','CU','COR1','COR2','COR3','RES','EXP']
src, dst = sys.argv[1], sys.argv[2]
L = open(src, encoding='utf-8').read().split('\n')
ini = next(i for i,l in enumerate(L) if l.startswith('Tabla 27'))
fin = next(i for i in range(ini, len(L)) if L[i].startswith('Parágrafo 1. El uso no definido'))
# páginas: el número impreso cierra cada página
pag, pagina, bloques = [], None, []
buf = []
for l in L[ini:fin]:
    s = l.strip()
    if re.fullmatch(r'1[1-4]\d', s):
        bloques.append((int(s), buf)); buf = []
    else: buf.append(s)
if buf: bloques.append((None, buf))
CAB = re.compile(r'^(Plan de Ordenamiento.*?Envigado|Componente Urbano y de Expansión Urbana|Tabla 27\.|Usos del suelo urbano y de expansión urbana\.|CLASIFICACIÓN CIIU INDUSTRIAL LAS VEGAS|INDUSTRIAL|LAS CASITAS|PRIMAVERA|CENTRO|TRADICIONAL|URBANOS|CORREDOR|TIPO [123]|TIPO 3 RESIDENCIAL SUELO DE EXPANSIÓN)\s*', re.I)
filas, sin = [], []
porPagina = {}
for num, lineas in bloques:
    txt = ' '.join(lineas)
    txt = re.sub(r'Plan de Ordenamiento Territorial 2011 - 2023 Municipio de Envigado|Componente Urbano y de Expansión Urbana|Tabla 27\.|Usos del suelo urbano y de expansión urbana\.|CLASIFICACIÓN CIIU INDUSTRIAL LAS VEGAS|INDUSTRIAL LAS CASITAS PRIMAVERA|CENTRO TRADICIONAL|CENTROS URBANOS|CORREDOR TIPO [123]|RESIDENCIAL SUELO DE EXPANSIÓN', ' ', ' '.join(l for l in lineas))
    txt = re.sub(r'\b(INDUSTRIAL|LAS CASITAS|PRIMAVERA|CENTRO|TRADICIONAL|CENTROS|URBANOS|CORREDOR|TIPO [123]|RESIDENCIAL|SUELO DE EXPANSIÓN)\b(?= |$)', ' ', txt) if False else txt
    # separar encabezados Sección/División del texto de filas
    txt = re.sub(r'(Sección [A-Q] - .*?)(?=\s\d{3}\s)', lambda m: ' ', txt)
    txt = re.sub(r'División \d\d ?- ?.*?(?=\s\d{3}\s)', ' ', txt)
    # pegado: letra seguida de CIIU (R159) o de 'Sección'/'División'
    txt = re.sub(r'(?<=[PCR])(?=\d{3}\s)', ' ', txt)
    txt = re.sub(r'(?<=[PCR])(?=(Sección|División))', ' ', txt)
    partes = re.split(r'(?<![\w.])(?=\d{3}\s+[A-ZÁÉÍÓÚ])', txt)
    n = 0
    for p in partes:
        p = p.strip()
        m = re.match(r'(\d{3})\s+(.*)$', p, re.S)
        if not m: continue
        ciiu, resto = m.groups()
        # letras finales
        mm = re.search(r'((?:\s[PCR])+)\s*$', ' '+resto)
        letras = mm.group(1).split() if mm else []
        desc = (resto[:len(resto)-len(mm.group(0).strip())] if mm else resto).strip()
        desc = re.sub(r'\s+', ' ', re.sub(r'(Sección|División) .*$', '', desc)).strip()
        fila = dict(ciiu=ciiu, descripcion=desc, letras=letras, paginaImpresa=num)
        n += 1
        if len(letras) == 9 and desc:
            fila['porZona'] = {z: l for z, l in zip(ZONAS, letras)}
            filas.append(fila)
        else:
            fila['motivo'] = ('sin letras' if not letras else f'{len(letras)} letras para 9 zonas: sin posición de columna') if desc else 'sin descripción'
            sin.append(fila)
    porPagina[num] = n
tot = len(filas) + len(sin)
bad = [f for f in filas+sin if any(x not in 'PCR' for x in f['letras'])]
informe = dict(zonas=ZONAS, filasTotal=tot, filasResueltas=len(filas), sinInterpretar=len(sin), filasPorPagina=porPagina,
               letrasInvalidas=len(bad), ciiuRepetidos=sorted({f['ciiu'] for f in filas+sin if [g['ciiu'] for g in filas+sin].count(f['ciiu'])>1}),
               nota='Texto plano sin columnas: solo filas con 9 letras se asignan a zonas [verificar con PDF -layout].')
json.dump(dict(informe=informe, filas=filas, sinInterpretar=sin), open(dst,'w',encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(informe, ensure_ascii=False))
