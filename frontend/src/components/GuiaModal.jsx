import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { FUNCIONES, PASOS, FUENTES, AVISOS_DATOS } from '../utils/contenidoGuia'
import '../styles/GuiaModal.css'

const PESTANAS = [
  { id: 'pasos', etiqueta: 'Paso a paso' },
  { id: 'funciones', etiqueta: '¿Qué puede hacer?' },
  { id: 'fuentes', etiqueta: 'Datos y licencias' }
]

export default function GuiaModal({ onCerrar }) {
  const [pestana, setPestana] = useState('pasos')
  const cerrarRef = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    cerrarRef.current?.focus()
    return () => {
      if (anterior && typeof anterior.focus === 'function') anterior.focus()
    }
  }, [])

  useEffect(() => {
    function alPulsar(evento) {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [onCerrar])

  return (
    <div
      className="guia-modal"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      <div className="guia-modal__caja" role="dialog" aria-modal="true" aria-labelledby="guia-modal-titulo">
        <div className="guia-modal__cabecera">
          <h2 id="guia-modal-titulo">Guía de uso</h2>
          <button type="button" className="guia-modal__cerrar" onClick={onCerrar} ref={cerrarRef}>
            <X size={18} aria-hidden="true" />
            Cerrar
          </button>
        </div>

        <div className="guia-modal__pestanas" role="tablist" aria-label="Secciones de la guía">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pestana === p.id}
              className={`guia-modal__pestana ${pestana === p.id ? 'activa' : ''}`}
              onClick={() => setPestana(p.id)}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>

        <div className="guia-modal__cuerpo">
          {pestana === 'pasos' && (
            <ol className="guia-modal__pasos">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="guia-modal__paso">
                  <span className="guia-modal__numero" aria-hidden="true">{i + 1}</span>
                  <div>
                    <h3>{paso.titulo}</h3>
                    <p>{paso.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {pestana === 'funciones' && (
            <>
              <ul className="guia-modal__rejilla">
                {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
                  <li key={titulo} className="guia-modal__tarjeta">
                    <span className="guia-modal__icono">
                      <Icono size={18} aria-hidden="true" />
                    </span>
                    <h3>{titulo}</h3>
                    <p>{texto}</p>
                  </li>
                ))}
              </ul>
              <p className="guia-modal__nota">
                <strong>Ten en cuenta:</strong> el suelo y los usos muestran lo que el POT permite o
                planea, no lo que existe hoy en cada predio. Los usos solo cubren el suelo urbano de
                Medellín y corresponden al POT de 2014.
              </p>
            </>
          )}

          {pestana === 'fuentes' && (
            <>
              <p className="guia-modal__intro">
                Estos son los datos que usa GeoAburrá y de dónde vienen.
              </p>

              <ul className="guia-modal__fuentes">
                {FUENTES.map(({ icono: Icono, titulo, usa, texto, enlace }) => (
                  <li key={titulo} className="guia-modal__fuente">
                    <span className="guia-modal__icono">
                      <Icono size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <h3>{titulo}</h3>
                      <p className="guia-modal__usa">{usa}</p>
                      <p>{texto}</p>
                      {enlace && (
                        <a
                          className="guia-modal__enlace"
                          href={enlace.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {enlace.texto}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="guia-modal__nota">
                <strong>Importante</strong>
                <ul className="guia-modal__avisos">
                  {AVISOS_DATOS.map((aviso) => (
                    <li key={aviso}>{aviso}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}