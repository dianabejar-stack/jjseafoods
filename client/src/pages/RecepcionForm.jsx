import { useState, useEffect } from 'react'
import api from '../api'
import ProductoRow from '../components/ProductoRow'

const hoy = new Date().toISOString().split('T')[0]
const horaActual = new Date().toTimeString().slice(0, 5)

const productoVacio = () => ({
  producto: '', talla: '', calidad: '',
  peso1: '', peso2: '', peso3: '', peso4: '', peso5: '',
  peso6: '', peso7: '', peso8: '', peso9: '', peso10: '',
  descuento_pct: 2
})

export default function RecepcionForm({ onGuardado }) {
  const [proveedores, setProveedores] = useState([])
  const [form, setForm] = useState({
    fecha: hoy,
    hora: horaActual,
    id_proveedor: '',
    procedencia: '',
    responsable: '',
    observaciones: '',
  })
  const [condiciones, setCondiciones] = useState({
    transporte_limpio: false,
    suficiente_hielo: false,
    combustible_cerca: false,
    animales_cerca: false,
    objetos_cerca: false,
  })
  const [productos, setProductos] = useState([productoVacio()])
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.get('/api/proveedores')
      .then(res => setProveedores(res.data))
      .catch(() => setProveedores([]))
  }, [])

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCondicionChange = (field) => {
    setCondiciones(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleProductoChange = (index, productoActualizado) => {
    setProductos(prev => prev.map((p, i) => i === index ? productoActualizado : p))
  }

  const agregarProducto = () => {
    setProductos(prev => [...prev, productoVacio()])
  }

  const eliminarProducto = (index) => {
    if (productos.length === 1) return
    setProductos(prev => prev.filter((_, i) => i !== index))
  }

  const pesoTotalGeneral = productos.reduce((sum, prod) => {
    const PESOS = ['peso1','peso2','peso3','peso4','peso5','peso6','peso7','peso8','peso9','peso10']
    return sum + PESOS.reduce((s, k) => s + (parseFloat(prod[k]) || 0), 0)
  }, 0)

  const pesoNetoGeneral = productos.reduce((sum, prod) => {
    const PESOS = ['peso1','peso2','peso3','peso4','peso5','peso6','peso7','peso8','peso9','peso10']
    const total = PESOS.reduce((s, k) => s + (parseFloat(prod[k]) || 0), 0)
    const desc = parseFloat(prod.descuento_pct) || 2
    return sum + total * (1 - desc / 100)
  }, 0)

  const guardar = async () => {
    if (!form.id_proveedor) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un proveedor.' })
      return
    }
    const productosValidos = productos.filter(p => p.producto.trim() !== '')
    if (productosValidos.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Debe registrar al menos un producto.' })
      return
    }
    const sinPeso = productosValidos.find(p => {
      const PESOS = ['peso1','peso2','peso3','peso4','peso5','peso6','peso7','peso8','peso9','peso10']
      return PESOS.every(k => !p[k])
    })
    if (sinPeso) {
      setMensaje({ tipo: 'error', texto: `El producto "${sinPeso.producto}" no tiene pesos registrados.` })
      return
    }

    setGuardando(true)
    try {
      const res = await api.post('/api/recepciones', {
        ...form,
        productos: productosValidos,
        condiciones
      })
      setMensaje({ tipo: 'ok', texto: `Recepción guardada exitosamente. N° ${res.data.numero_recepcion}` })
      if (onGuardado) onGuardado()
      setProductos([productoVacio()])
      setForm({ fecha: hoy, hora: horaActual, id_proveedor: '', procedencia: '', responsable: '', observaciones: '' })
      setCondiciones({ transporte_limpio: false, suficiente_hielo: false, combustible_cerca: false, animales_cerca: false, objetos_cerca: false })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar. Verifique la conexión.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">

        {/* Mensaje */}
        {mensaje && (
          <div className={`p-4 rounded-lg border ${mensaje.tipo === 'ok' ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800'}`}>
            {mensaje.texto}
            <button onClick={() => setMensaje(null)} className="ml-4 font-bold">×</button>
          </div>
        )}

        {/* SECCIÓN 1: Datos Generales */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#1F7A63] px-6 py-3">
            <h2 className="text-white font-semibold text-lg">Datos Generales</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Fecha *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => handleFormChange('fecha', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Hora *</label>
              <input
                type="time"
                value={form.hora}
                onChange={e => handleFormChange('hora', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Proveedor *</label>
              <select
                value={form.id_proveedor}
                onChange={e => handleFormChange('id_proveedor', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
              >
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map(p => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Procedencia</label>
              <input
                type="text"
                value={form.procedencia}
                onChange={e => handleFormChange('procedencia', e.target.value)}
                placeholder="Ej: Esmeraldas"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Responsable</label>
              <input
                type="text"
                value={form.responsable}
                onChange={e => handleFormChange('responsable', e.target.value)}
                placeholder="Nombre del responsable"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3AAE8D]"
              />
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: Productos */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#1F7A63] px-6 py-3 flex justify-between items-center">
            <h2 className="text-white font-semibold text-lg">Registro de Productos y Pesos</h2>
            <button
              type="button"
              onClick={agregarProducto}
              className="bg-white text-[#1F7A63] px-4 py-1 rounded-lg text-sm font-semibold hover:bg-green-50 transition"
            >
              + Agregar Producto
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-2 py-2 text-left">Producto *</th>
                  <th className="px-2 py-2 text-left">Talla</th>
                  <th className="px-2 py-2 text-left">Cal.</th>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <th key={n} className="px-1 py-2 text-center">P{n}</th>
                  ))}
                  <th className="px-2 py-2 text-right">Total</th>
                  <th className="px-2 py-2 text-center">%Desc</th>
                  <th className="px-2 py-2 text-right text-[#1F7A63]">Neto</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod, i) => (
                  <ProductoRow
                    key={i}
                    index={i}
                    producto={prod}
                    onChange={handleProductoChange}
                    onRemove={eliminarProducto}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#e8f5f1] font-bold border-t-2 border-[#1F7A63]">
                  <td colSpan={13} className="px-2 py-2 text-right text-gray-600">TOTALES:</td>
                  <td className="px-2 py-2 text-right text-gray-800">{pesoTotalGeneral.toFixed(0)}</td>
                  <td></td>
                  <td className="px-2 py-2 text-right text-[#1F7A63]">{pesoNetoGeneral.toFixed(0)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* SECCIÓN 3: Condiciones de transporte */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#1F7A63] px-6 py-3">
            <h2 className="text-white font-semibold text-lg">Condiciones del Transporte</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'transporte_limpio', label: 'El transporte se encuentra limpio' },
              { key: 'suficiente_hielo', label: 'Viene con suficiente hielo' },
              { key: 'combustible_cerca', label: 'Trae combustible junto a la materia prima' },
              { key: 'animales_cerca', label: 'Trae otros animales junto a la materia prima' },
              { key: 'objetos_cerca', label: 'Trae otros objetos junto a la materia prima' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={condiciones[key]}
                  onChange={() => handleCondicionChange(key)}
                  className="w-5 h-5 accent-[#1F7A63]"
                />
                <span className="text-sm text-gray-700 group-hover:text-[#1F7A63]">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* SECCIÓN 4: Observaciones */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#1F7A63] px-6 py-3">
            <h2 className="text-white font-semibold text-lg">Observaciones</h2>
          </div>
          <div className="p-6">
            <textarea
              value={form.observaciones}
              onChange={e => handleFormChange('observaciones', e.target.value)}
              rows={3}
              placeholder="Escriba observaciones generales de la recepción..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3AAE8D] resize-none"
            />
          </div>
        </section>

        {/* Botones */}
        <div className="flex gap-4 pb-8">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="bg-[#3AAE8D] hover:bg-[#1F7A63] text-white px-8 py-3 rounded-lg font-semibold text-base transition disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar Recepción'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold text-base transition"
          >
            Imprimir
          </button>
          <button
            type="button"
            onClick={() => {
              setProductos([productoVacio()])
              setForm({ fecha: hoy, hora: horaActual, id_proveedor: '', procedencia: '', responsable: '', observaciones: '' })
              setCondiciones({ transporte_limpio: false, suficiente_hielo: false, combustible_cerca: false, animales_cerca: false, objetos_cerca: false })
              setMensaje(null)
            }}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 px-8 py-3 rounded-lg font-semibold text-base transition"
          >
            Cancelar
          </button>
        </div>
    </div>
  )
}
