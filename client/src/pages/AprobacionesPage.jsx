/**
 * AprobacionesPage.jsx
 * Lista de recepciones de calidad con su estado de aprobación.
 * Permite ver el detalle, aprobar o rechazar cada registro.
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../api'

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

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ label, valor, color = 'text-gray-800' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{valor ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

// ── Fila de detalle (etiqueta + valor) ────────────────────────────────────────
function Fila({ label, valor }) {
  if (valor === null || valor === undefined || valor === '') return null
  return (
    <div className="flex gap-2 text-sm py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 min-w-[160px] shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{String(valor)}</span>
    </div>
  )
}

// ── Modal detalle de recepción ─────────────────────────────────────────────────
function ModalDetalle({ aprobacionId, onClose, onAprobar, onRechazar }) {
  const [datos,    setDatos]    = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get(`/api/aprobaciones/${aprobacionId}/detalle`)
      .then(r => setDatos(r.data))
      .catch(() => setDatos(null))
      .finally(() => setCargando(false))
  }, [aprobacionId])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#1F7A63] rounded-t-xl">
          <div>
            <h3 className="font-bold text-white text-lg">
              {datos ? `${datos.tipo === 'camaron' ? 'Camarón' : 'Pescado'} — ${datos.nro_recepcion}` : 'Detalle de Recepción'}
            </h3>
            {datos && (
              <p className="text-green-200 text-xs mt-0.5">
                {datos.proveedor || 'Sin proveedor'} · {datos.fecha ? new Date(datos.fecha).toLocaleDateString('es-EC') : '—'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white hover:text-green-200 text-xl font-bold">✕</button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {cargando && <p className="text-center py-8 text-gray-400 text-sm">Cargando...</p>}

          {!cargando && !datos && (
            <p className="text-center py-8 text-gray-400 text-sm">No se pudo cargar el detalle</p>
          )}

          {!cargando && datos && datos.tipo === 'camaron' && datos.detalle && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#1F7A63] uppercase mb-2">Datos del lote</p>
              <Fila label="Nro. Lote"            valor={datos.detalle.nro_lote} />
              <Fila label="Especie"              valor={datos.detalle.especie} />
              <Fila label="Presentación"         valor={datos.detalle.presentacion} />
              <Fila label="Origen"               valor={datos.detalle.origen} />
              <Fila label="Nro. Gavetas"         valor={datos.detalle.nro_gavetas} />
              <Fila label="Libras reportadas"    valor={datos.detalle.libras_reportadas} />
              <Fila label="Libras recibidas"     valor={datos.detalle.libras_recibidas} />
              <Fila label="Temperatura"          valor={datos.detalle.temperatura} />
              <Fila label="Hora análisis"        valor={datos.detalle.hora_analisis} />
              <Fila label="Nombre chofer"        valor={datos.detalle.nombre_chofer} />
              <Fila label="Nro. Guía"            valor={datos.detalle.nro_guia} />
              <Fila label="Nro. Placa"           valor={datos.detalle.nro_placa} />

              <p className="text-xs font-bold text-[#1F7A63] uppercase mt-4 mb-2">Calidad</p>
              <Fila label="Calidad"              valor={datos.detalle.calidad} />
              <Fila label="Total defectos"       valor={datos.detalle.total_defectos} />
              <Fila label="SO₂ (ppm)"            valor={datos.detalle.so2_ppm} />
              <Fila label="Clasificación prom."  valor={datos.detalle.clasificacion_prom} />
              <Fila label="Org. promedio"        valor={datos.detalle.org_promedio} />
              <Fila label="Org. clasificación"   valor={datos.detalle.org_clasificacion} />

              <p className="text-xs font-bold text-[#1F7A63] uppercase mt-4 mb-2">Firmas y observaciones</p>
              <Fila label="Supervisor CC"        valor={datos.detalle.supervisor_cc} />
              <Fila label="Jefe CC"              valor={datos.detalle.jefe_cc} />
              <Fila label="Observaciones"        valor={datos.detalle.observaciones} />
              <Fila label="Acciones correctivas" valor={datos.detalle.acciones_correctivas} />
            </div>
          )}

          {!cargando && datos && datos.tipo === 'pescado' && datos.detalle && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#1F7A63] uppercase mb-2">Datos del lote</p>
              <Fila label="Nro. Lote"            valor={datos.detalle.cabecera?.nro_lote} />
              <Fila label="Presentación"         valor={datos.detalle.cabecera?.presentacion} />
              <Fila label="Nro. Romaneo"         valor={datos.detalle.cabecera?.romaneo_numero} />
              <Fila label="Elaborado por"        valor={datos.detalle.cabecera?.elaborado_por} />
              <Fila label="Revisado por"         valor={datos.detalle.cabecera?.revisado_por} />
              <Fila label="Observaciones"        valor={datos.detalle.cabecera?.observaciones} />
              <Fila label="Acciones correctivas" valor={datos.detalle.cabecera?.acciones_correctivas} />

              {datos.detalle.romaneo?.length > 0 && (
                <>
                  <p className="text-xs font-bold text-[#1F7A63] uppercase mt-4 mb-2">
                    Romaneo ({datos.detalle.romaneo.length} piezas)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-200 rounded">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Hora', 'Especie', 'Peso (lb)', 'Temp.', 'Calif.', 'Clasif.'].map(h => (
                            <th key={h} className="px-2 py-1.5 text-left font-semibold text-gray-600 border-b">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {datos.detalle.romaneo.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5">{String(r.hora || '').slice(0, 5) || '—'}</td>
                            <td className="px-2 py-1.5">{r.especie}</td>
                            <td className="px-2 py-1.5">{r.peso_lb}</td>
                            <td className="px-2 py-1.5">{r.temperatura != null ? `${r.temperatura}°C` : '—'}</td>
                            <td className="px-2 py-1.5">{r.calificacion}</td>
                            <td className="px-2 py-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-bold
                                ${r.clasificacion === 'A' ? 'bg-green-100 text-green-700' :
                                  r.clasificacion === 'B' ? 'bg-blue-100 text-blue-700' :
                                  r.clasificacion === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'}`}>
                                {r.clasificacion}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        {datos && datos.estado === 'pendiente' && (
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
            <button
              onClick={() => { onRechazar(datos); onClose() }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition"
            >
              Rechazar
            </button>
            <button
              onClick={() => { onAprobar(datos); onClose() }}
              className="px-4 py-2 bg-[#1F7A63] hover:bg-[#185e4c] text-white text-sm rounded-lg transition"
            >
              Aprobar
            </button>
          </div>
        )}
        {datos && datos.estado !== 'pendiente' && datos.observacion && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Observación:</span> {datos.observacion}
            </p>
          </div>
        )}
      </div>
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
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
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
  const [registros,    setRegistros]    = useState([])
  const [kpis,         setKpis]         = useState(null)
  const [cargando,     setCargando]     = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo,   setFiltroTipo]   = useState('todos')
  const [modal,        setModal]        = useState(null)   // { registro, accion }
  const [detalle,      setDetalle]      = useState(null)   // aprobacion id para ver detalle

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
            <button key={e.value} onClick={() => setFiltroEstado(e.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${filtroEstado === e.value ? 'bg-[#1F7A63] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#3AAE8D]'}`}>
              {e.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {TIPOS.map(t => (
            <button key={t.value} onClick={() => setFiltroTipo(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${filtroTipo === t.value ? 'bg-[#3AAE8D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#3AAE8D]'}`}>
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
                      <div className="flex gap-1.5 flex-wrap">
                        {/* Botón Ver — siempre visible */}
                        <button
                          onClick={() => setDetalle(reg.id)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded border border-gray-300"
                        >
                          Ver
                        </button>
                        {reg.estado === 'pendiente' && (
                          <>
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {detalle && (
        <ModalDetalle
          aprobacionId={detalle}
          onClose={() => setDetalle(null)}
          onAprobar={reg => setModal({ registro: reg, accion: 'aprobado' })}
          onRechazar={reg => setModal({ registro: reg, accion: 'rechazado' })}
        />
      )}

      {/* Modal aprobar/rechazar */}
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
