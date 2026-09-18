import { useState } from 'react'
import { toast } from 'sonner'
import { CloudUpload, Check } from 'lucide-react'
import { guardarCapaEnNube } from '../utils/supabaseCapas'
import '../styles/BotonGuardarNube.css'

export default function BotonGuardarNube({ capa, setCapas }) {
  const [guardando, setGuardando] = useState(false)

  async function manejarGuardar() {
    setGuardando(true)
    try {
      await guardarCapaEnNube(capa)

     
      setCapas((prev) =>
        prev.map((c) =>
          c.id === capa.id ? { ...c, guardadaEnNube: true } : c
        )
      )

      toast.success(`"${capa.nombre}" guardada en Supabase`)
    } catch (error) {
      console.error(error)
      toast.error('No se pudo guardar en la nube: ' + error.message)
    } finally {
      setGuardando(false)
    }
  }

  if (capa.guardadaEnNube) {
    return (
      <span className="capa-guardada" title="Ya guardada en Supabase">
        <Check size={12} /> Guardada
      </span>
    )
  }

  return (
    <button
      onClick={manejarGuardar}
      disabled={guardando}
      className="dropzone-boton"
      style={{ display: 'block', width: '100%' }}
    >
      {guardando ? (
        <>
          <span className="spinner"></span>Guardando...
        </>
      ) : (
        <>
          <CloudUpload size={20} /> <span>Guardar en la nube</span>
        </>
      )}
    </button>
  )
}