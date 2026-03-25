/**
 * AdminUsuarios.jsx
 * Gestión de usuarios: crear, editar, activar/desactivar y asignar permisos.
 * Solo accesible para el rol Administrador (permiso vista_admin).
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../api'

const ESPECIES = [
  { value: 'ambas',   label: 'Camarón y Pescado' },
  { value: 'camaron', label: 'Solo Camarón' },
  { value: 'pescado', label: 'Solo Pescado' },
]

// ── Componente de campo de formulario ─────────────────────────────────────────
function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, required }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
    />
  )
}

// ── Modal crear / editar usuario ──────────────────────────────────────────────
function ModalUsuario({ usuario, roles, permisos, onGuardar, onClose }) {
  const esNuevo = !usuario?.id

  const [form, setForm] = useState({
    nombre:        usuario?.nombre        || '',
    email:         usuario?.email         || '',
    telefono:      usuario?.telefono      || '',
    password:      '',
    rol_id:        usuario?.rol_id        || (roles[0]?.id ?? ''),
    especie_acceso: usuario?.especie_acceso || 'ambas',
    activo:        usuario?.activo ?? true,
  })

  // Overrides de permisos individuales: { permiso_id: true|false }
  const [overrides, setOverrides] = useState(() => {
    const map = {}
    for (const p of (usuario?.permisos_override || [])) {
      map[p.permiso_id] = p.activo
    }
    return map
  })

  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (esNuevo && form.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres')
    }
    setCargando(true)
    setError('')
    try {
      await onGuardar(form, overrides, usuario?.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setCargando(false)
    }
  }

  // Agrupar permisos por categoría
  const porCategoria = permisos.reduce((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = []
    acc[p.categoria].push(p)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">
            {esNuevo ? 'Nuevo Usuario' : `Editar — ${usuario.nombre}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

          {/* Datos básicos */}
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Nombre *">
              <Input value={form.nombre} onChange={v => set('nombre', v)} required placeholder="Nombre completo" />
            </Campo>
            <Campo label="Teléfono">
              <Input value={form.telefono} onChange={v => set('telefono', v)} placeholder="09XXXXXXXX" />
            </Campo>
          </div>

          <Campo label="Correo electrónico *">
            <Input type="email" value={form.email} onChange={v => set('email', v)} required placeholder="correo@jjseafoods.com" />
          </Campo>

          <Campo label={esNuevo ? 'Contraseña *' : 'Nueva contraseña (dejar vacío para no cambiar)'}>
            <Input type="password" value={form.password} onChange={v => set('password', v)}
              required={esNuevo} placeholder={esNuevo ? 'Mínimo 6 caracteres' : '••••••••'} />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Rol *">
              <select
                value={form.rol_id}
                onChange={e => set('rol_id', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
              >
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </Campo>
            <Campo label="Acceso por especie">
              <select
                value={form.especie_acceso}
                onChange={e => set('especie_acceso', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
              >
                {ESPECIES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </Campo>
          </div>

          {!esNuevo && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={e => set('activo', e.target.checked)}
                className="accent-[#1F7A63]"
              />
              Usuario activo
            </label>
          )}

          {/* Permisos individuales (override) */}
          {permisos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Permisos individuales (override del rol)
              </p>
              {Object.entries(porCategoria).map(([cat, items]) => (
                <div key={cat} className="mb-3">
                  <p className="text-xs font-medium text-[#1F7A63] capitalize mb-1">{cat}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {items.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={overrides[p.id] ?? false}
                          onChange={e => setOverrides(prev => ({ ...prev, [p.id]: e.target.checked }))}
                          className="accent-[#3AAE8D]"
                        />
                        {p.descripcion}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400">
                Activa solo permisos adicionales que el rol no otorgue por defecto.
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2 bg-[#1F7A63] hover:bg-[#185e4c] text-white text-sm rounded-lg transition disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AdminUsuarios() {
  const [usuarios,  setUsuarios]  = useState([])
  const [roles,     setRoles]     = useState([])
  const [permisos,  setPermisos]  = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [modal,     setModal]     = useState(null)  // null | usuario (o {} para nuevo)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [u, r, p] = await Promise.all([
        api.get('/api/usuarios'),
        api.get('/api/usuarios/roles'),
        api.get('/api/usuarios/permisos'),
      ])
      setUsuarios(u.data)
      setRoles(r.data)
      setPermisos(p.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function handleGuardar(form, overrides, id) {
    if (id) {
      await api.put(`/api/usuarios/${id}`, form)
    } else {
      const r = await api.post('/api/usuarios', form)
      id = r.data.id
    }
    // Guardar overrides de permisos
    const permisosList = Object.entries(overrides)
      .filter(([, activo]) => activo)
      .map(([permiso_id]) => ({ permiso_id: parseInt(permiso_id), activo: true }))
    await api.put(`/api/usuarios/${id}/permisos`, { permisos: permisosList })
    setModal(null)
    cargar()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Administración de Usuarios</h2>
          <p className="text-sm text-gray-500">Gestiona accesos, roles y permisos del sistema</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="px-4 py-2 bg-[#1F7A63] hover:bg-[#185e4c] text-white text-sm rounded-lg transition"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <p className="text-center py-12 text-gray-400 text-sm">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Nombre', 'Email', 'Teléfono', 'Rol', 'Especie', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.telefono || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#e8f5f1] text-[#1F7A63] text-xs rounded-full font-medium">
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{u.especie_acceso}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal(u)}
                        className="text-[#1F7A63] hover:underline text-xs font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <ModalUsuario
          usuario={modal.id ? modal : null}
          roles={roles}
          permisos={permisos}
          onGuardar={handleGuardar}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
