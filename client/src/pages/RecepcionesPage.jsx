/**
 * RecepcionesPage.jsx
 * Listado de recepciones realizadas con filtros y exportación a Excel.
 */
import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import api from '../api'

// ── Utilidades ────────────────────────────────────────────────────────────────
function hoy() {
  return new Date().toISOString().split('T')[0]
}

// ── Fila de detalle en modal ──────────────────────────────────────────────────
function Fila({ label, valor }) {
  if (valor === null || valor === undefined || valor === '') return null
  return (
    <div className="flex gap-2 text-sm py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 min-w-[160px] shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{String(valor)}</span>
    </div>
  )
}

// ── Modal Ver detalle ─────────────────────────────────────────────────────────
function ModalVer({ recepcionId, onClose }) {
  const [datos,    setDatos]    = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get(`/api/recepciones-calidad/${recepcionId}/detalle`)
      .then(r => setDatos(r.data))
      .catch(() => setDatos(null))
      .finally(() => setCargando(false))
  }, [recepcionId])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#1F7A63] rounded-t-xl">
          <div>
            <h3 className="font-bold text-white text-lg">
              {datos
                ? `${datos.tipo === 'camaron' ? 'Camarón' : 'Pescado'} — ${datos.nro_recepcion}`
                : 'Detalle de Recepción'}
            </h3>
            {datos && (
              <p className="text-green-200 text-xs mt-0.5">
                {datos.proveedor || 'Sin proveedor'}
                {' · '}
                {datos.fecha ? new Date(datos.fecha).toLocaleDateString('es-EC') : '—'}
                {datos.es_exportacion && (
                  <span className="ml-2 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                    EXPORTACIÓN
                  </span>
                )}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white hover:text-green-200 text-xl font-bold">✕</button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
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
              <Fila label="Org. promedio"        valor={datos.detalle.org_promedio} />
              <Fila label="Org. clasificación"   valor={datos.detalle.org_clasificacion} />
              <p className="text-xs font-bold text-[#1F7A63] uppercase mt-4 mb-2">Firmas</p>
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

              {datos.detalle.romaneo?.length > 0 && (
                <>
                  <p className="text-xs font-bold text-[#1F7A63] uppercase mt-4 mb-2">
                    Romaneo ({datos.detalle.romaneo.length} piezas)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-200 rounded">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Hora', 'Especie', 'Talla', 'Cal. Prov.', 'Peso (lb)', 'Temp.', 'Calif.', 'Clasif.'].map(h => (
                            <th key={h} className="px-2 py-1.5 text-left font-semibold text-gray-600 border-b">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {datos.detalle.romaneo.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5">{String(r.hora || '').slice(0, 5) || '—'}</td>
                            <td className="px-2 py-1.5">{r.especie}</td>
                            <td className="px-2 py-1.5">{r.talla || '—'}</td>
                            <td className="px-2 py-1.5">{r.calidad_proveedor || '—'}</td>
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function RecepcionesPage() {
  const [registros,      setRegistros]      = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [fechaInicio,    setFechaInicio]    = useState(hoy)
  const [fechaFin,       setFechaFin]       = useState(hoy)
  const [filtroTipo,     setFiltroTipo]     = useState('todos')
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroSupervisor, setFiltroSupervisor] = useState('')
  const [detalleId,      setDetalleId]      = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const params = {
        fecha_inicio: fechaInicio,
        fecha_fin:    fechaFin,
        tipo:         filtroTipo,
      }
      if (filtroProveedor.trim())  params.proveedor  = filtroProveedor.trim()
      if (filtroSupervisor.trim()) params.supervisor = filtroSupervisor.trim()

      const r = await api.get('/api/recepciones-calidad', { params })
      setRegistros(r.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }, [fechaInicio, fechaFin, filtroTipo, filtroProveedor, filtroSupervisor])

  useEffect(() => { cargar() }, [cargar])

  // ── Exportar a Excel ─────────────────────────────────────────────────────
  async function exportarExcel() {
    // Construir filas con datos de cada recepción + detalle de romaneo para pescado
    const filas = []

    for (const reg of registros) {
      const base = {
        'Nro. Recepción': reg.nro_recepcion,
        'Tipo':           reg.tipo === 'camaron' ? 'Camarón' : 'Pescado',
        'Fecha':          reg.fecha ? new Date(reg.fecha).toLocaleDateString('es-EC') : '',
        'Hora llegada':   reg.hora_llegada ? String(reg.hora_llegada).slice(0, 5) : '',
        'Proveedor':      reg.proveedor || '',
        'Supervisor':     reg.supervisor || '',
        'Exportación':    reg.es_exportacion ? 'Sí' : 'No',
      }

      // Para pescado: cargar el detalle del romaneo
      try {
        const det = await api.get(`/api/recepciones-calidad/${reg.id}/detalle`)
        const d = det.data

        if (d.tipo === 'pescado' && d.detalle?.romaneo?.length > 0) {
          for (const rom of d.detalle.romaneo) {
            filas.push({
              ...base,
              'Especie':         rom.especie || '',
              'Talla':           rom.talla || '',
              'Cal. Proveedor':  rom.calidad_proveedor || '',
              'Peso (lb)':       rom.peso_lb || '',
              'N° Piezas':       rom.nro_piezas || '',
              'Temperatura °C':  rom.temperatura || '',
              'Hielo':           rom.presencia_hielo ? 'Sí' : 'No',
              'Obj. Extraños':   rom.objetos_extranos ? 'Sí' : 'No',
              'Color':           rom.org_color ?? '',
              'Olor':            rom.org_olor ?? '',
              'Textura':         rom.org_textura ?? '',
              'Ojos':            rom.org_ojos ?? '',
              'Branquias':       rom.org_branquias ?? '',
              'Calificación':    rom.calificacion || '',
              'Clasificación':   rom.clasificacion || '',
            })
          }
        } else if (d.tipo === 'camaron' && d.detalle) {
          filas.push({
            ...base,
            'Especie':         d.detalle.especie || '',
            'Libras reportadas': d.detalle.libras_reportadas || '',
            'Libras recibidas':  d.detalle.libras_recibidas || '',
            'Temperatura °C':  d.detalle.temperatura || '',
            'Calidad':         d.detalle.calidad || '',
            'SO₂ (ppm)':       d.detalle.so2_ppm || '',
            'Org. Promedio':   d.detalle.org_promedio || '',
            'Clasificación org.': d.detalle.org_clasificacion || '',
          })
        } else {
          filas.push(base)
        }
      } catch {
        filas.push(base)
      }
    }

    const ws  = XLSX.utils.json_to_sheet(filas)
    const wb  = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Recepciones')
    XLSX.writeFile(wb, `recepciones_${fechaInicio}_${fechaFin}.xlsx`)
  }

  const TIPOS = [
    { value: 'todos',   label: 'Todos' },
    { value: 'pescado', label: 'Pescado' },
    { value: 'camaron', label: 'Camarón' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

      {/* Título */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Recepciones</h2>
          <p className="text-sm text-gray-500">Listado de recepciones registradas por rango de fechas</p>
        </div>
        <button
          onClick={exportarExcel}
          disabled={registros.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-40
                     text-white text-sm font-medium rounded-lg transition"
        >
          ⬇ Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Fecha inicio */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
            />
          </div>
          {/* Fecha fin */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
            />
          </div>
          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de producto</label>
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
            >
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {/* Proveedor */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor</label>
            <input
              type="text"
              value={filtroProveedor}
              onChange={e => setFiltroProveedor(e.target.value)}
              placeholder="Nombre del proveedor"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
            />
          </div>
          {/* Supervisor */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Supervisor</label>
            <input
              type="text"
              value={filtroSupervisor}
              onChange={e => setFiltroSupervisor(e.target.value)}
              placeholder="Nombre del supervisor"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={cargar}
            className="px-4 py-2 bg-[#1F7A63] hover:bg-[#185e4c] text-white text-sm
                       font-medium rounded-lg transition"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <p className="text-center py-12 text-gray-400 text-sm">Cargando...</p>
        ) : registros.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">
            No hay recepciones para los filtros seleccionados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Nro. Recepción', 'Tipo', 'Fecha', 'Hora', 'Proveedor', 'Supervisor', 'Exportación', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map(reg => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{reg.nro_recepcion}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${reg.tipo === 'pescado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-pink-100 text-pink-800'}`}>
                        {reg.tipo === 'pescado' ? 'Pescado' : 'Camarón'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {reg.fecha ? new Date(reg.fecha).toLocaleDateString('es-EC') : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {reg.hora_llegada ? String(reg.hora_llegada).slice(0, 5) : '—'}
                    </td>
                    <td className="px-4 py-3">{reg.proveedor || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{reg.supervisor || '—'}</td>
                    <td className="px-4 py-3">
                      {reg.es_exportacion && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Sí
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetalleId(reg.id)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded border border-gray-300"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contador */}
      {!cargando && registros.length > 0 && (
        <p className="text-xs text-gray-400 text-right">{registros.length} registros encontrados</p>
      )}

      {/* Modal detalle */}
      {detalleId && (
        <ModalVer recepcionId={detalleId} onClose={() => setDetalleId(null)} />
      )}
    </div>
  )
}
