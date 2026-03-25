/**
 * LoginPage.jsx
 * Pantalla de inicio de sesión con logo, formulario y opción de recuperar contraseña.
 */
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

// ── Subcomponente: campo de formulario ────────────────────────────────────────
function Campo({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-[#3AAE8D] focus:border-transparent"
      />
    </div>
  )
}

// ── Vista: Recuperar contraseña ────────────────────────────────────────────────
function FormRecuperar({ onVolver }) {
  const [email,   setEmail]   = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error,   setError]   = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      await api.post('/api/auth/forgot-password', { email })
      setEnviado(true)
    } catch {
      setError('No se pudo procesar la solicitud. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  if (enviado) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-green-600 text-xl">✓</span>
        </div>
        <p className="text-sm text-gray-600">
          Si el correo existe en el sistema, recibirás un enlace para restablecer tu contraseña.
        </p>
        <button onClick={onVolver} className="text-[#1F7A63] text-sm font-medium hover:underline">
          Volver al login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <Campo
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="correo@jjseafoods.com"
        autoComplete="email"
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={cargando}
        className="w-full bg-[#1F7A63] hover:bg-[#185e4c] text-white py-2 rounded-lg
                   text-sm font-medium transition disabled:opacity-50"
      >
        {cargando ? 'Enviando...' : 'Enviar enlace'}
      </button>
      <button
        type="button"
        onClick={onVolver}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        Volver al login
      </button>
    </form>
  )
}

// ── Vista principal: Login ─────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth()
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [error,      setError]      = useState('')
  const [cargando,   setCargando]   = useState(false)
  const [recuperar,  setRecuperar]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      await login(email, password)
      // La app detecta el cambio de usuario y muestra el contenido principal
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Tarjeta */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Cabecera verde con logo */}
          <div className="bg-[#1F7A63] px-8 py-8 flex flex-col items-center gap-3">
            <img
              src="/logo.png"
              alt="JJ SeaFoods"
              className="w-20 h-20 object-contain rounded-full bg-white p-1"
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex' }}
            />
            <div className="w-20 h-20 bg-white rounded-full items-center justify-center hidden" aria-hidden>
              <span className="text-[#1F7A63] font-bold text-xl">JJ</span>
            </div>
            <div className="text-center">
              <h1 className="text-white text-xl font-bold">JJ SeaFoods</h1>
              <p className="text-green-200 text-xs">Sistema de Trazabilidad</p>
            </div>
          </div>

          {/* Formulario */}
          <div className="px-8 py-6">
            {recuperar ? (
              <FormRecuperar onVolver={() => setRecuperar(false)} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Campo
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="correo@jjseafoods.com"
                  autoComplete="email"
                />
                <Campo
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />

                {error && (
                  <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-[#1F7A63] hover:bg-[#185e4c] text-white py-2.5 rounded-lg
                             font-medium transition disabled:opacity-50"
                >
                  {cargando ? 'Ingresando...' : 'Ingresar'}
                </button>

                <button
                  type="button"
                  onClick={() => setRecuperar(true)}
                  className="w-full text-xs text-[#1F7A63] hover:underline"
                >
                  Olvidé mi contraseña
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          F.P. Deriancomp S.A. — Confidencial
        </p>
      </div>
    </div>
  )
}
