// Correcciones a la capa oficial de Itagüí, verificadas contra el texto del Acuerdo 09 de 2023.
// Solo agregan códigos que la capa omite y el acuerdo sí trae. Si la capa llega a corregirse, no duplican nada.
// Función pura: sin red ni React.

export const CORRECCIONES_CAPA_ITAGUI = Object.freeze([
  {
    zona: 'ZU-R-01',
    agregarCondicionados: ['S-14', 'S-22'],
    fuente: { articulo: '181', paginaPdf: 131 }
  },
  {
    zona: 'ZE-R-02',
    agregarCompatibles: ['D-8'],
    fuente: { articulo: '181', paginaPdf: 135 }
  }
])

function agregar(lista, codigos) {
  const nuevos = (codigos ?? []).filter((c) => !lista.includes(c))
  return { lista: [...lista, ...nuevos], nuevos }
}

export function aplicarCorreccionesCapa(zona, correcciones = CORRECCIONES_CAPA_ITAGUI) {
  if (!zona?.codigo) return zona
  const aplicables = correcciones.filter((c) => c.zona === zona.codigo)
  if (aplicables.length === 0) return zona

  let compatibles = zona.compatibles
  let condicionados = zona.condicionados
  const avisos = []

  for (const c of aplicables) {
    const comp = agregar(compatibles, c.agregarCompatibles)
    const cond = agregar(condicionados, c.agregarCondicionados)
    compatibles = comp.lista
    condicionados = cond.lista
    const donde = `artículo ${c.fuente.articulo}, p. ${c.fuente.paginaPdf} del PDF del Acuerdo 09 de 2023`
    if (comp.nuevos.length) {
      avisos.push(
        `La capa oficial omite ${comp.nuevos.join(', ')} en los usos compatibles de ${zona.codigo}; se agregó según el ${donde}.`
      )
    }
    if (cond.nuevos.length) {
      avisos.push(
        `La capa oficial omite ${cond.nuevos.join(', ')} en los usos condicionados de ${zona.codigo}; se agregó según el ${donde}.`
      )
    }
  }

  if (avisos.length === 0) return zona
  return {
    ...zona,
    compatibles,
    condicionados,
    avisosDeLectura: [...(zona.avisosDeLectura ?? []), ...avisos]
  }
}