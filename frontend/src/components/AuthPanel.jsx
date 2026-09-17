import { useState } from 'react'
import { toast } from 'sonner'
import { LogIn, LogOut, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import '../styles/AuthPanel.css'

export default function AuthPanel() {
  const { user, cargando, iniciarSesion, registrarse, cerrarSesion } = useAuth()
  const [modo, setModo] = useState('login') // 'login' | 'registro'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando) return null

  if (user) {
    return (
      <div className="auth-panel">
        <div className="auth-panel__usuario">
          <span className="auth-panel__email" title={user.email}>{user.email}</span>
          <button className="auth-panel__boton-salir" onClick={cerrarSesion} title="Cerrar sesión">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    )
  }

  async function manejarSubmit(evento) {
    evento.preventDefault()
    if (!email || !password) return

    setEnviando(true)
    try {
      if (modo === 'login') {
        await iniciarSesion(email, password)
        toast.success('Sesión iniciada')
      } else {
        await registrarse(email, password)
        toast.success('Cuenta creada. Revisa tu correo si pide confirmación.')
      }
    } catch (error) {
      toast.error(error.message || 'No se pudo completar la acción')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-panel">
      <form className="auth-panel__form" onSubmit={manejarSubmit}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit" disabled={enviando}>
          {modo === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
          {enviando ? 'Espera…' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
      </form>

      <button
        type="button"
        className="auth-panel__toggle-modo"
        onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
      >
        {modo === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  )
}