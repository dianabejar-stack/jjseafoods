/**
 * MantenimientosPage.jsx
 * Tablas de mantenimiento del sistema: placas, especies, colores camarón,
 * supervisores, jefes y proveedores.
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../api'

// ── Componentes de formulario ─────────────────────────────────────────────────
function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, required, type = 'text' }) {
  return (
    <input
      type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
    />
  )
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value ?? ''} onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
    >
      {children}
    </select>
  )
}

// ── Modal genérico Crear / Editar ─────────────────────────────────────────────
function ModalForm({ titulo, onClose, onGuardar, cargando, error, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {children}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancelar
          </button>
          <button
            onClick={onGuardar} disabled={cargando}
            className="px-4 py-2 text-sm text-white bg-[#1F7A63] hover:bg-[#185e4c]
                       rounded-lg transition disabled:opacity-50"
          >
            {cargando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tabla genérica de mantenimiento ───────────────────────────────────────────
function TablaMantenimiento({ columnas, filas, onEditar, onEliminar }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {filas.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">Sin registros</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columnas.map(c => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filas.map(fila => (
                <tr key={fila.id ?? fila.id_proveedor} className="hover:bg-gray-50">
                  {columnas.map(c => (
                    <td key={c.key} className="px-4 py-3 text-gray-700">
                      {c.render ? c.render(fila) : (fila[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditar(fila)}
                        className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onEliminar(fila)}
                        className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SECCIÓN: PLACAS
// ════════════════════════════════════════════════════════════════════════════
function SeccionPlacas() {
  const [filas,   setFilas]   = useState([])
  const [modal,   setModal]   = useState(null)   // null | 'nuevo' | fila
  const [form,    setForm]    = useState({ placa: '' })
  const [carg,    setCarg]    = useState(false)
  const [error,   setError]   = useState('')

  const cargar = useCallback(async () => {
    const r = await api.get('/api/mantenimientos/placas')
    setFilas(r.data)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirNuevo() { setForm({ placa: '' }); setError(''); setModal('nuevo') }
  function abrirEditar(fila) { setForm({ placa: fila.placa, activo: fila.activo }); setError(''); setModal(fila) }

  async function guardar() {
    setCarg(true); setError('')
    try {
      if (modal === 'nuevo') {
        await api.post('/api/mantenimientos/placas', form)
      } else {
        await api.put(`/api/mantenimientos/placas/${modal.id}`, form)
      }
      setModal(null); cargar()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setCarg(false) }
  }

  async function eliminar(fila) {
    if (!confirm(`¿Eliminar placa ${fila.placa}?`)) return
    await api.delete(`/api/mantenimientos/placas/${fila.id}`)
    cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirNuevo}
          className="px-4 py-2 bg-[#1F7A63] hover:bg-[#185e4c] text-white text-sm rounded-lg">
          + Nueva Placa
        </button>
      </div>
      <TablaMantenimiento
        columnas={[
          { key: 'placa',  label: 'Placa' },
          { key: 'activo', label: 'Activo', render: f => f.activo ? 'Sí' : 'No' },
        ]}
        filas={filas}
        onEditar={abrirEditar}
        onEliminar={eliminar}
      />
      {modal && (
        <ModalForm
          titulo={modal === 'nuevo' ? 'Nueva Placa' : 'Editar Placa'}
          onClose={() => setModal(null)} onGuardar={guardar} cargando={carg} error={error}
        >
          <Campo label="Placa *">
            <Input value={form.placa} onChange={v => setForm(f => ({ ...f, placa: v }))} placeholder="GBP-7498" required />
          </Campo>
        </ModalForm>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SECCIÓN: ESPECIES
// ════════════════════════════════════════════════════════════════════════════
function SeccionEspecies() {
  const [filas, setFilas] = useState([])
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({ nombre: '', tipo: '', nombre_cientifico: '' })
  const [carg,  setCarg]  = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const r = await api.get('/api/mantenimientos/especies')
    setFilas(r.data)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirNuevo() {
    setForm({ nombre: '', tipo: '', nombre_cientifico: '' }); setError(''); setModal('nuevo')
  }
  function abrirEditar(fila) {
    setForm({ nombre: fila.nombre, tipo: fila.tipo || '', nombre_cientifico: fila.nombre_cientifico || '', activo: fila.activo })
    setError(''); setModal(fila)
  }

  async function guardar() {
    setCarg(true); setError('')
    try {
      if (modal === 'nuevo') {
        await api.post('/api/mantenimientos/especies', form)
      } else {
        await api.put(`/api/mantenimientos/especies/${modal.id}`, form)
      }
      setModal(null); cargar()
    } catch (e) { setError(e.response?.data?.error || 'Error') }
    finally { setCarg(false) }
  }

  async function eliminar(fila) {
    if (!confirm(`¿Eliminar especie ${fila.nombre}?`)) return
    await api.delete(`/api/mantenimientos/especies/${fila.id}`)
    cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirNuevo}
          className="px-4 py-2 bg-[#1F7A63] hover:bg-[#185e4c] text-white text-sm rounded-lg">
          + Nueva Especie
        </button>
      </div>
      <TablaMantenimiento
        columnas={[
          { key: 'nombre',           label: 'Nombre' },
          { key: 'tipo',             label: 'Tipo' },
          { key: 'nombre_cientifico', label: 'Nombre Científico' },
          { key: 'activo',           label: 'Activo', render: f => f.activo ? 'Sí' : 'No' },
        ]}
        filas={filas}
        onEditar={abrirEditar}
        onEliminar={eliminar}
      />
      {modal && (
        <ModalForm
          titulo={modal === 'nuevo' ? 'Nueva Especie' : 'Editar Especie'}
          onClose={() => setModal(null)} onGuardar={guardar} cargando={carg} error={error}
        >
          <Campo label="Nombre *">
            <Input value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Ej: Atún" required />
          </Campo>
          <Campo label="Tipo">
            <Input value={form.tipo} onChange={v => setForm(f => ({ ...f, tipo: v }))} placeholder="Ej: Atún rojo" />
          </Campo>
          <Campo label="Nombre científico">
            <Input value={form.nombre_cientifico} onChange={v => setForm(f => ({ ...f, nombre_cientifico: v }))} placeholder="Ej: Thunnus thynnus" />
          </Campo>
        </ModalForm>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SECCIÓN: COLORES CAMARÓN
// ════════════════════════════════════════════════════════════════════════════
function SeccionColores() {
  const [filas, setFilas] = useState([])
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({ nombre_color: '' })
  const [carg,  setCarg]  = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const r = await api.get('/api/mantenimientos/colores-camaron')
    setFilas(r.data)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirNuevo() { setForm({ nombre_color: '' }); setError(''); setModal('nuevo') }
  function abrirEditar(fila) { setForm({ nombre_color: fila.nombre_color, activo: fila.activo }); setError(''); setModal(fila) }

  async function guardar() {
    setCarg(true); setError('')
    try {
      if (modal === 'nuevo') {
        await api.post('/api/mantenimientos/colores-camaron', form)
      } else {
        await api.put(`/api/mantenimientos/colores-camaron/${modal.id}`, form)
      }
      setModal(null); cargar()
    } catch (e) { setError(e.response?.data?.error || 'Error') }
    finally { setCarg(false) }
  }

  async function eliminar(fila) {
    if (!confirm(`¿Eliminar color "${fila.nombre_color}"?`)) return
    await api.delete(`/api/mantenimientos/colores-camaron/${fila.id}`)
    cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirNuevo}
          className="px-4 py-2 bg-[#1F7A63] hover:bg-[#185e4c] text-white text-sm rounded-lg">
          + Nuevo Color
        </button>
      </div>
      <TablaMantenimiento
        columnas={[
          { key: 'nombre_color', label: 'Color' },
          { key: 'activo',       label: 'Activo', render: f => f.activo ? 'Sí' : 'No' },
        ]}
        filas={filas}
        onEditar={abrirEditar}
        onEliminar={eliminar}
      />
      {modal && (
        <ModalForm
          titulo={modal === 'nuevo' ? 'Nuevo Color' : 'Editar Color'}
          onClose={() => setModal(null)} onGuardar={guardar} cargando={carg} error={error}
        >
          <Campo label="Nombre del color *">
            <Input value={form.nombre_color} onChange={v => setForm(f => ({ ...f, nombre_color: v }))} placeholder="Ej: Rosado / Rojo" required />
          </Campo>
        </ModalForm>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SECCIÓN: EMPLEADOS (supervisores y jefes)
// ════════════════════════════════════════════════════════════════════════════
function SeccionEmpleados({ cargo, titulo }) {
  const [filas, setFilas] = useState([])
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({ nombre: '', cargo })
  const [carg,  setCarg]  = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const r = await api.get(`/api/mantenimientos/empleados?cargo=${cargo}`)
    setFilas(r.data)
  }, [cargo])

  useEffect(() => { cargar() }, [cargar])

  function abrirNuevo() { setForm({ nombre: '', cargo }); setError(''); setModal('nuevo') }
  function abrirEditar(fila) { setForm({ nombre: fila.nombre, cargo: fila.cargo, activo: fila.activo }); setError(''); setModal(fila) }

  async function guardar() {
    setCarg(true); setError('')
    try {
      if (modal === 'nuevo') {
        await api.post('/api/mantenimientos/empleados', form)
      } else {
        await api.put(`/api/mantenimientos/empleados/${modal.id}`, form)
      }
      setModal(null); cargar()
    } catch (e) { setError(e.response?.data?.error || 'Error') }
    finally { setCarg(false) }
  }

  async function eliminar(fila) {
    if (!confirm(`¿Eliminar ${fila.nombre}?`)) return
    await api.delete(`/api/mantenimientos/empleados/${fila.id}`)
    cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirNuevo}
          className="px-4 py-2 bg-[#1F7A63] hover:bg-[#185e4c] text-white text-sm rounded-lg">
          + Nuevo {titulo}
        </button>
      </div>
      <TablaMantenimiento
        columnas={[
          { key: 'nombre', label: 'Nombre' },
          { key: 'activo', label: 'Activo', render: f => f.activo ? 'Sí' : 'No' },
        ]}
        filas={filas}
        onEditar={abrirEditar}
        onEliminar={eliminar}
      />
      {modal && (
        <ModalForm
          titulo={`${modal === 'nuevo' ? 'Nuevo' : 'Editar'} ${titulo}`}
          onClose={() => setModal(null)} onGuardar={guardar} cargando={carg} error={error}
        >
          <Campo label="Nombre *">
            <Input value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder={`Nombre del ${titulo.toLowerCase()}`} required />
          </Campo>
        </ModalForm>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SECCIÓN: PROVEEDORES
// ════════════════════════════════════════════════════════════════════════════
function SeccionProveedores() {
  const [filas, setFilas] = useState([])
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({
    nombre: '', tipo_identificacion: 'ruc', numero_identificacion: '', direccion: '', telefono: ''
  })
  const [carg,  setCarg]  = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const r = await api.get('/api/mantenimientos/proveedores')
    setFilas(r.data)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirNuevo() {
    setForm({ nombre: '', tipo_identificacion: 'ruc', numero_identificacion: '', direccion: '', telefono: '' })
    setError(''); setModal('nuevo')
  }
  function abrirEditar(fila) {
    setForm({
      nombre: fila.nombre,
      tipo_identificacion: fila.tipo_identificacion || 'ruc',
      numero_identificacion: fila.numero_identificacion || '',
      direccion: fila.direccion || '',
      telefono: fila.telefono || '',
    })
    setError(''); setModal(fila)
  }

  async function guardar() {
    setCarg(true); setError('')
    try {
      if (modal === 'nuevo') {
        await api.post('/api/mantenimientos/proveedores', form)
      } else {
        await api.put(`/api/mantenimientos/proveedores/${modal.id_proveedor}`, form)
      }
      setModal(null); cargar()
    } catch (e) { setError(e.response?.data?.error || 'Error') }
    finally { setCarg(false) }
  }

  async function eliminar(fila) {
    if (!confirm(`¿Eliminar proveedor "${fila.nombre}"?`)) return
    try {
      await api.delete(`/api/mantenimientos/proveedores/${fila.id_proveedor}`)
      cargar()
    } catch (e) { alert(e.response?.data?.error || 'No se pudo eliminar') }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirNuevo}
          className="px-4 py-2 bg-[#1F7A63] hover:bg-[#185e4c] text-white text-sm rounded-lg">
          + Nuevo Proveedor
        </button>
      </div>
      <TablaMantenimiento
        columnas={[
          { key: 'nombre',               label: 'Nombre' },
          { key: 'tipo_identificacion',  label: 'Tipo ID' },
          { key: 'numero_identificacion', label: 'Nro. ID' },
          { key: 'telefono',             label: 'Teléfono' },
          { key: 'direccion',            label: 'Dirección' },
        ]}
        filas={filas}
        onEditar={abrirEditar}
        onEliminar={eliminar}
      />
      {modal && (
        <ModalForm
          titulo={modal === 'nuevo' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
          onClose={() => setModal(null)} onGuardar={guardar} cargando={carg} error={error}
        >
          <Campo label="Nombre *">
            <Input value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Nombre del proveedor" required />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Tipo de identificación">
              <Select value={form.tipo_identificacion} onChange={v => setForm(f => ({ ...f, tipo_identificacion: v }))}>
                <option value="ruc">RUC</option>
                <option value="cedula">Cédula</option>
                <option value="pasaporte">Pasaporte</option>
              </Select>
            </Campo>
            <Campo label="Número de identificación">
              <Input value={form.numero_identificacion} onChange={v => setForm(f => ({ ...f, numero_identificacion: v }))} placeholder="0891234567001" />
            </Campo>
          </div>
          <Campo label="Dirección">
            <Input value={form.direccion} onChange={v => setForm(f => ({ ...f, direccion: v }))} placeholder="Ciudad / Dirección" />
          </Campo>
          <Campo label="Teléfono">
            <Input value={form.telefono} onChange={v => setForm(f => ({ ...f, telefono: v }))} placeholder="0991234567" />
          </Campo>
        </ModalForm>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'placas',       label: 'Placas' },
  { id: 'especies',     label: 'Especies' },
  { id: 'colores',      label: 'Colores Camarón' },
  { id: 'supervisores', label: 'Supervisores' },
  { id: 'jefes',        label: 'Jefes CC' },
  { id: 'proveedores',  label: 'Proveedores' },
]

export default function MantenimientosPage() {
  const [tab, setTab] = useState('placas')

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

      {/* Título */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Mantenimientos</h2>
        <p className="text-sm text-gray-500">Gestión de catálogos y datos maestros del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition
              ${tab === t.id
                ? 'bg-[#1F7A63] text-white'
                : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab activo */}
      <div className="pt-1">
        {tab === 'placas'       && <SeccionPlacas />}
        {tab === 'especies'     && <SeccionEspecies />}
        {tab === 'colores'      && <SeccionColores />}
        {tab === 'supervisores' && <SeccionEmpleados cargo="supervisor" titulo="Supervisor" />}
        {tab === 'jefes'        && <SeccionEmpleados cargo="jefe" titulo="Jefe CC" />}
        {tab === 'proveedores'  && <SeccionProveedores />}
      </div>
    </div>
  )
}
