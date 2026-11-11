import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Compass, ListChecks } from 'lucide-react'
import { FUNCIONES, PASOS } from '../utils/contenidoGuia'
import '../styles/Inicio.css'

export default function Inicio({ onIrAlVisor }) {
  const [vista, setVista] = useState('inicio')
  const tituloRef = useRef(null)

  useEffect(() => {
    tituloRef.current?.focus({ preventScroll: true })
  }, [vista])

  return (
    <main className="inicio">
      <title>GeoAburrá</title>

      <div className="inicio__panel">
        {vista === 'inicio' && (
          <>
            <h1 className="inicio__titulo" ref={tituloRef} tabIndex={-1}>
              GeoAburrá
            </h1>
            <p className="inicio__lema">Visor de equipamientos urbanos y suelo del Valle de Aburrá</p>
            <p className="inicio__descripcion">
              Explora los equipamientos del Valle de Aburrá (salud, educación, recreación y más) y
              descubre cómo está clasificado el suelo de una zona y qué servicios tiene cerca.
            </p>

            <div className="inicio__botones">
              <button
                type="button"
                className="inicio__boton inicio__boton--funciones"
                onClick={() => setVista('funciones')}
              >
                <Compass size={20} aria-hidden="true" />
                ¿Qué puede hacer?
              </button>

              <button
                type="button"
                className="inicio__boton inicio__boton--visor"
                onClick={onIrAlVisor}
              >
                Ir al visor
                <ArrowRight size={20} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="inicio__boton inicio__boton--guia"
                onClick={() => setVista('guia')}
              >
                <ListChecks size={20} aria-hidden="true" />
                Guía paso a paso
              </button>
            </div>

            <p className="inicio__pie">
              Proyecto universitario · Datos: AMVA, OpenStreetMap y Alcaldía de Medellín
            </p>
          </>
        )}

        {vista === 'funciones' && (
          <>
            <button type="button" className="inicio__volver" onClick={() => setVista('inicio')}>
              <ArrowLeft size={18} aria-hidden="true" />
              Volver al inicio
            </button>

            <h2 className="inicio__subtitulo" ref={tituloRef} tabIndex={-1}>
              ¿Qué puede hacer GeoAburrá?
            </h2>

            <ul className="inicio__rejilla">
              {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
                <li key={titulo} className="inicio__tarjeta">
                  <span className="inicio__tarjeta-icono">
                    <Icono size={20} aria-hidden="true" />
                  </span>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </li>
              ))}
            </ul>

            <p className="inicio__nota">
              <strong>Ten en cuenta:</strong> el suelo y los usos muestran lo que el POT permite o
              planea, no lo que existe hoy en cada predio. Los usos solo cubren el suelo urbano de
              Medellín y corresponden al POT de 2014.
            </p>

            <div className="inicio__acciones">
              <button
                type="button"
                className="inicio__boton inicio__boton--visor"
                onClick={onIrAlVisor}
              >
                Ir al visor
                <ArrowRight size={20} aria-hidden="true" />
              </button>
            </div>
          </>
        )}

        {vista === 'guia' && (
          <>
            <button type="button" className="inicio__volver" onClick={() => setVista('inicio')}>
              <ArrowLeft size={18} aria-hidden="true" />
              Volver al inicio
            </button>

            <h2 className="inicio__subtitulo" ref={tituloRef} tabIndex={-1}>
              Guía paso a paso
            </h2>

            <ol className="inicio__pasos">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="inicio__paso">
                  <span className="inicio__paso-numero" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{paso.titulo}</h3>
                    <p>{paso.texto}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="inicio__acciones">
              <button
                type="button"
                className="inicio__boton inicio__boton--visor"
                onClick={onIrAlVisor}
              >
                Ir al visor
                <ArrowRight size={20} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}