import { useState, useEffect } from 'react'
import api from '../api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts'

const COLORS = ['#1F7A63', '#3AAE8D', '#5BC8A8', '#8ED6C5', '#B2E4D8', '#F4A261']

function KpiCard({ icon, label, value, unit, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {unit && <p className="text-xs text-gray-400">{unit}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [kpis, setKpis] = useState({ recepciones: 0, kg_hoy: 0, proveedores: 0, piezas: 0 })
  const [porEspecie, setPorEspecie] = useState([])
  const [porProveedor, setPorProveedor] = useState([])
  const [tablaHoy, setTablaHoy] = useState([])
  const [alertas, setAlertas] = useState([])
  const [tendencia, setTendencia] = useState([])
  const [porTalla, setPorTalla] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [k, e, pr, t, a, tend, talla] = await Promise.all([
          api.get('/api/dashboard/kpis'),
          api.get('/api/dashboard/por-especie'),
          api.get('/api/dashboard/por-proveedor'),
          api.get('/api/dashboard/tabla-hoy'),
          api.get('/api/dashboard/alertas'),
          api.get('/api/dashboard/tendencia'),
          api.get('/api/dashboard/por-talla'),
        ])
        setKpis(k.data)
        setPorEspecie(e.data.map(d => ({ ...d, total_kg: parseFloat(d.total_kg) })))
        setPorProveedor(pr.data.map(d => ({ ...d, total_kg: parseFloat(d.total_kg) })))
        setTablaHoy(t.data)
        setAlertas(a.data)
        setTendencia(tend.data.map(d => ({
          fecha: d.fecha.slice(5),
          kg: parseFloat(d.total_kg),
          recepciones: parseInt(d.recepciones)
        })))
        setPorTalla(talla.data.map(d => ({ ...d, total_kg: parseFloat(d.total_kg) })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const formatHora = (h) => h ? String(h).slice(0, 5) : '-'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#1F7A63] text-lg font-semibold">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="📦" label="Recepciones hoy" value={kpis.recepciones} color="bg-green-50" />
        <KpiCard icon="🐟" label="Kg recibidos hoy" value={Number(kpis.kg_hoy).toLocaleString()} unit="kg neto" color="bg-teal-50" />
        <KpiCard icon="🚚" label="Proveedores activos" value={kpis.proveedores} unit="hoy" color="bg-emerald-50" />
        <KpiCard icon="📊" label="Productos recibidos" value={kpis.piezas} unit="registros" color="bg-cyan-50" />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Por especie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Recepción por Especie (Kg) — Últimos 30 días</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porEspecie} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="producto" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v.toLocaleString()} kg`, 'Peso neto']} />
              <Bar dataKey="total_kg" fill="#1F7A63" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Por proveedor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Participación por Proveedor — Últimos 30 días</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={porProveedor}
                dataKey="total_kg"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ nombre, percent }) => `${nombre.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {porProveedor.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v.toLocaleString()} kg`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tendencia 7 días */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Tendencia de Recepción — Últimos 7 días (Kg)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={tendencia} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v.toLocaleString()} kg`, 'Kg recibidos']} />
            <Line type="monotone" dataKey="kg" stroke="#1F7A63" strokeWidth={2} dot={{ fill: '#1F7A63', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla del día + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tabla del día */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Recepciones de Hoy</h3>
          {tablaHoy.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No hay recepciones registradas hoy.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="px-3 py-2 text-left">Hora</th>
                    <th className="px-3 py-2 text-left">Proveedor</th>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-left">Talla</th>
                    <th className="px-3 py-2 text-right">Kg</th>
                    <th className="px-3 py-2 text-center">N° Rec.</th>
                  </tr>
                </thead>
                <tbody>
                  {tablaHoy.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{formatHora(row.hora)}</td>
                      <td className="px-3 py-2 font-medium">{row.proveedor}</td>
                      <td className="px-3 py-2">{row.producto}</td>
                      <td className="px-3 py-2 text-gray-500">{row.talla}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#1F7A63]">{Number(row.kg).toLocaleString()}</td>
                      <td className="px-3 py-2 text-center text-gray-400 text-xs">{row.numero_recepcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>⚠️</span> Alertas del día
          </h3>
          {alertas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-green-600 text-sm font-medium">Sin alertas hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-amber-800">{a.proveedor} — {formatHora(a.hora)}</p>
                  <ul className="mt-1 space-y-1">
                    {!a.transporte_limpio && <li className="text-amber-700">• Transporte no limpio</li>}
                    {!a.suficiente_hielo && <li className="text-amber-700">• Sin suficiente hielo</li>}
                    {a.combustible_cerca && <li className="text-red-600">• Combustible junto a MP</li>}
                    {a.animales_cerca && <li className="text-red-600">• Animales junto a MP</li>}
                    {a.objetos_cerca && <li className="text-amber-700">• Objetos extraños</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Por talla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Recepción por Talla y Especie — Últimos 30 días</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={porTalla} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="talla" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v, n, p) => [`${v.toLocaleString()} kg`, p.payload.producto]}
              labelFormatter={(l) => `Talla: ${l}`}
            />
            <Bar dataKey="total_kg" radius={[4, 4, 0, 0]}>
              {porTalla.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
