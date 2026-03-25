/**
 * AuthContext.jsx
 * Contexto global de autenticación.
 * Provee: usuario, permisos, login(), logout(), tiene(permiso)
 */
import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Recuperar sesión guardada en localStorage al iniciar
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = localStorage.getItem('jjsf_usuario')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // Iniciar sesión: llama a la API y guarda token + usuario
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('jjsf_token',   data.token)
    localStorage.setItem('jjsf_usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)
    return data.usuario
  }, [])

  // Cerrar sesión
  const logout = useCallback(() => {
    localStorage.removeItem('jjsf_token')
    localStorage.removeItem('jjsf_usuario')
    setUsuario(null)
  }, [])

  // Verificar si el usuario tiene un permiso específico
  const tiene = useCallback((codigo) => {
    return usuario?.permisos?.includes(codigo) ?? false
  }, [usuario])

  return (
    <AuthContext.Provider value={{ usuario, login, logout, tiene }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook de acceso rápido
export function useAuth() {
  return useContext(AuthContext)
}
