/**
 * api.js
 * Cliente Axios con interceptor JWT.
 * El token se lee de localStorage en cada petición.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

// Adjunta el token en cada request si existe
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jjsf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el servidor devuelve 401, limpiar sesión y recargar al login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jjsf_token')
      localStorage.removeItem('jjsf_usuario')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

export default api
