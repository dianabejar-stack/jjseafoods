/**
 * AprobacionesPage.jsx
 * Lista de recepciones de calidad con su estado de aprobación.
 * Permite aprobar o rechazar registros con observación opcional.
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../api'

// ── Constantes ────────────────────────────────────────────────────────────────
const ESTADOS = [
  { value: 'todos',     label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobado',  label: 'Aprobados' },
  { value: 'rechazado', label: 'Rechazados' },
]
const TIPOS = [
  { value: 'todos',   label: 'Todos' },
  { value: 'camaron', label: 'Camarón' },
  { value: 'pescado', label: 'Pescado' },
]

const COLOR_ESTADO = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado:  'bg-green-100  text-green-800',
  rechazado: 'bg-red-100    text-red-800',
}

// ── Tarjeta de KPI ────────────────────────────────────────────────────────────
function KPI({ label, valor, color = 'text-gray-800' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{valor ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

// ── Modal de acción (aprobar / rechazar) ──────────────────────────────────────
function ModalAccion({ registro, accion, onConfirm, onClose }) {
  const [observacion, setObservacion] = useState('')
  const [cargando,    setCargando]    = useState(false)

  async function handleConfirm() {
    setCargando(true)
    await onConfirm(registro.id, accion, observacion)
    setCargando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">
          {accion === 'aprobado' ? '✔ Aprobar' : '✘ Rechazar'} registro
        </h3>
        <p className="text-sm text-gray-600">
          <strong>{registro.tipo === 'camaron' ? 'Camarón' : 'Pescado'}</strong>{' '}
          · Nro. {registro.nro_recepcion} · {registro.proveedor || 'Sin proveedor'}
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Observación {accion === 'rechazado' ? '(requerida)' : '(opcional)'}
          </label>
          <textarea
            rows={3}
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            placeholder="Ingrese una observación..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={cargando || (accion === 'rechazado' && !observacion.trim())}
            className={`px-4 py-2 text-sm text-white rounded-lg transition disabled:opacity-50
              ${accion === 'aprobado' ? 'bg-[#1F7A63] hover:bg-[#185e4c]' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {cargando ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AprobacionesPage() {
  const [registros,  setRegistros]  = useState([])
  const [kpis,       setKpis]       = useState(null)
  const [cargando,   setCargando]   = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo,   setFiltroTipo]   = useState('todos')
  const [modal,      setModal]      = useState(null)  // { registro, accion }

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const [resReg, resKpi] = await Promise.all([
        api.get('/api/aprobaciones', { params: { estado: filtroEstado, tipo: filtroTipo } }),
        api.get('/api/aprobaciones/kpis'),
      ])
      setRegistros(resReg.data)
      setKpis(resKpi.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroTipo])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  async function handleAccion(id, estado, observacion) {
    try {
      await api.put(`/api/aprobaciones/${id}`, { estado, observacion })
      setModal(null)
      cargarDatos()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* Título */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Aprobación de Registros</h2>
        <p className="text-sm text-gray-500">Revisa y aprueba las recepciones de calidad ingresadas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPI label="Total"           valor={kpis?.total}           color="text-gray-800" />
        <KPI label="Pendientes"      valor={kpis?.pendientes}      color="text-yellow-600" />
        <KPI label="Aprobados"       valor={kpis?.aprobados}       color="text-green-700" />
        <KPI label="Rechazados"      valor={kpis?.rechazados}      color="text-red-600" />
        <KPI label="Registros hoy"   valor={kpis?.registros_hoy}   color="text-blue-600" />
        <KPI label="Aprobados hoy"   valor={kpis?.aprobados_hoy}   color="text-green-600" />
        <KPI label="Tasa aprobación" valor={kpis?.tasa_aprobacion != null ? `${kpis.tasa_aprobacion}%` : '—'} color="text-[#1F7A63]" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {ESTADOS.map(e => (
            <button
              key={e.value}
              onClick={() => setFiltroEstado(e.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${filtroEstado === e.value
                  ? 'bg-[#1F7A63] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#3AAE8D]'}`}
            >
              {e.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {TIPOS.map(t => (
            <button
              key={t.value}
              onClick={() => setFiltroTipo(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${filtroTipo === t.value
                  ? 'bg-[#3AAE8D] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#3AAE8D]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <p className="text-center py-12 text-gray-400 text-sm">Cargando...</p>
        ) : registros.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">No hay registros para los filtros seleccionados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Nro. Recepción', 'Tipo', 'Fecha', 'Proveedor', 'Estado', 'Aprobado por', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map(reg => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{reg.nro_recepcion}</td>
                    <td className="px-4 py-3 capitalize">{reg.tipo}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {reg.fecha ? new Date(reg.fecha).toLocaleDateString('es-EC') : '—'}
                    </td>
                    <td className="px-4 py-3">{reg.proveedor || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_ESTADO[reg.estado]}`}>
                        {reg.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{reg.aprobado_por_nombre || '—'}</td>
                    <td className="px-4 py-3">
                      {reg.estado === 'pendiente' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModal({ registro: reg, accion: 'aprobado' })}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => setModal({ registro: reg, accion: 'rechazado' })}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                      {reg.estado !== 'pendiente' && reg.observacion && (
                        <span className="text-gray-400 text-xs italic" title={reg.observacion}>
                          Con observación
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ModalAccion
          registro={modal.registro}
          accion={modal.accion}
          onConfirm={handleAccion}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
