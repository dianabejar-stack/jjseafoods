// =====================================================
// DashboardFiltrado.jsx
// Dashboard principal de JJ SeaFoods con filtros por tipo de producto.
// Permite al usuario cambiar entre vistas: General, Camarón y Pescado.
// Cada vista muestra KPIs, gráficas y tabla de recepciones filtradas.
//
// Props:
//   onNavigate (función) — se llama cuando el usuario quiere ir al formulario de recepción
//
// Dependencias: recharts (ya instalada en el proyecto)
// =====================================================

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import api from '../api'

// =====================================================
// === Constantes de color — Paleta verde JJ SeaFoods ===
// =====================================================
const COLOR = {
  darkGreen:  '#1F7A63', // Verde oscuro — encabezados, chips activos General
  mainGreen:  '#3AAE8D', // Verde principal — chips activos Camarón, acentos
  midGreen:   '#2a9478', // Verde medio — chips activos Pescado
  lightBg:    '#e8f5ee', // Verde muy claro — fondos de sección
  pieA:       '#1F7A63',
  pieB:       '#3AAE8D',
  pieC:       '#5dca9e',
  pieD:       '#9fe1cb',
  danger:     '#dc2626', // Rojo — alertas críticas
  warn:       '#d97706', // Ámbar — advertencias
  ok:         '#16a34a', // Verde — estado OK
  textPrimary:'#111827',
  textMuted:  '#6b7280',
  border:     '#e5e7eb',
  cardBg:     '#ffffff',
  pageBg:     '#f3f4f6',
}

// =====================================================
// === Datos mock — reemplazar con llamadas a la API ===
// =====================================================

// Colores para el gráfico de dona (proveedores) — compartido por todas las vistas
const COLORES_DONA = [COLOR.pieA, COLOR.pieB, COLOR.pieC, COLOR.pieD]

// (sin datos mock — el componente carga todo desde la API)

// =====================================================
// === Componentes auxiliares ===
// =====================================================

// ----- ChipFiltro -----
// Botón tipo "chip" para seleccionar la vista activa.
// Props:
//   label     — texto visible del chip (incluye emoji)
//   activo    — booleano, si este chip está seleccionado
//   colorActivo — color de fondo cuando está activo
//   onClick   — función al hacer clic
function ChipFiltro({ label, activo, colorActivo, onClick }) {
  const estiloBase = {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           '4px',
    padding:       '6px 14px',
    borderRadius:  '999px',
    fontSize:      '13px',
    fontWeight:    600,
    cursor:        'pointer',
    border:        `2px solid ${colorActivo}`,
    transition:    'background 0.18s, color 0.18s',
    userSelect:    'none',
    // Si está activo: fondo de color; si no: fondo blanco con texto de color
    background:    activo ? colorActivo : COLOR.cardBg,
    color:         activo ? '#fff' : colorActivo,
  }

  return (
    <button style={estiloBase} onClick={onClick} aria-pressed={activo}>
      {label}
    </button>
  )
}

// ----- TarjetaKPI -----
// Muestra un indicador clave de rendimiento (KPI) con título, valor grande y subtexto.
// Props:
//   label   — nombre del KPI
//   value   — valor principal (string)
//   sub     — texto secundario / aclaración
//   isAlert — booleano, si es true el valor se muestra en rojo
function TarjetaKPI({ label, value, sub, isAlert }) {
  return (
    <div style={{
      background:   COLOR.cardBg,
      borderRadius: '10px',
      border:       `1px solid ${COLOR.border}`,
      padding:      '16px',
      display:      'flex',
      flexDirection:'column',
      gap:          '4px',
    }}>
      {/* Título del KPI */}
      <span style={{ fontSize: '12px', fontWeight: 700, color: COLOR.darkGreen, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>

      {/* Valor principal — en rojo si es alerta */}
      <span style={{ fontSize: '26px', fontWeight: 800, color: isAlert ? COLOR.danger : COLOR.textPrimary, lineHeight: 1.1 }}>
        {value}
      </span>

      {/* Subtexto aclaratorio */}
      <span style={{ fontSize: '12px', color: COLOR.textMuted }}>
        {sub}
      </span>
    </div>
  )
}

// ----- Contenedor -----
// Tarjeta genérica de sección (card wrapper).
// Props:
//   titulo  — título de la sección (string)
//   children— contenido interno
//   style   — estilos adicionales opcionales
function Contenedor({ titulo, children, style = {} }) {
  return (
    <div style={{
      background:   COLOR.cardBg,
      borderRadius: '10px',
      border:       `1px solid ${COLOR.border}`,
      padding:      '16px',
      ...style,
    }}>
      {/* Título de la sección */}
      {titulo && (
        <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: COLOR.darkGreen }}>
          {titulo}
        </p>
      )}
      {children}
    </div>
  )
}

// ----- GraficaBarras -----
// Gráfica de barras horizontales con los datos de la vista activa.
// Props:
//   titulo  — título de la gráfica
//   datos   — array { nombre, kg }
function GraficaBarras({ titulo, datos }) {
  return (
    <Contenedor titulo={titulo}>
      {/* ResponsiveContainer adapta la gráfica al ancho del contenedor padre */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={datos} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          {/* Cuadrícula horizontal sutil */}
          <CartesianGrid strokeDasharray="3 3" stroke={COLOR.border} vertical={false} />

          {/* Eje X: nombres de producto/talla */}
          <XAxis
            dataKey="nombre"
            tick={{ fontSize: 11, fill: COLOR.textMuted }}
            axisLine={false}
            tickLine={false}
          />

          {/* Eje Y: kilogramos/libras */}
          <YAxis
            tick={{ fontSize: 11, fill: COLOR.textMuted }}
            axisLine={false}
            tickLine={false}
            width={50}
          />

          {/* Tooltip al pasar el cursor */}
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: `1px solid ${COLOR.border}`, fontSize: '12px' }}
            cursor={{ fill: COLOR.lightBg }}
          />

          {/* Barras en color verde principal */}
          <Bar dataKey="kg" fill={COLOR.mainGreen} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </Contenedor>
  )
}

// Etiqueta personalizada para el centro de la dona (porcentaje al pasar el mouse)
// Se usa en GraficaDonut para mostrar el nombre al hacer hover.
// Recharts no tiene soporte nativo para label central, lo hacemos con posición absoluta.

// ----- GraficaDonut -----
// Gráfica de dona (pie con hueco) mostrando distribución por proveedor.
// Props: ninguno (siempre usa DATOS_PROVEEDORES y COLORES_DONA)
// Props: datos — array { nombre, pct }
function GraficaDonut({ datos = [] }) {
  return (
    <Contenedor titulo="Distribución por proveedor (%)">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={datos}
            dataKey="pct"
            nameKey="nombre"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
          >
            {datos.map((_, idx) => (
              <Cell key={idx} fill={COLORES_DONA[idx % COLORES_DONA.length]} />
            ))}
          </Pie>

          {/* Leyenda debajo de la dona */}
          <Legend
            iconType="circle"
            iconSize={9}
            formatter={(value) => (
              <span style={{ fontSize: '11px', color: COLOR.textMuted }}>{value}</span>
            )}
          />

          {/* Tooltip */}
          <Tooltip
            formatter={(value, name) => [`${value}%`, name]}
            contentStyle={{ borderRadius: '8px', border: `1px solid ${COLOR.border}`, fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Contenedor>
  )
}

// ----- GraficaTendencia -----
// Gráfica de área (line chart con área rellena) para la tendencia de 7 días.
// Props:
//   titulo  — título de la sección
//   datos   — array { dia, kg }
function GraficaTendencia({ titulo, datos }) {
  return (
    <Contenedor titulo={titulo}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={datos} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          {/* Definición del degradado para el área */}
          <defs>
            <linearGradient id="degradadoVerde" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLOR.mainGreen} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLOR.mainGreen} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Cuadrícula */}
          <CartesianGrid strokeDasharray="3 3" stroke={COLOR.border} />

          {/* Eje X: días */}
          <XAxis
            dataKey="dia"
            tick={{ fontSize: 11, fill: COLOR.textMuted }}
            axisLine={false}
            tickLine={false}
          />

          {/* Eje Y: kg */}
          <YAxis
            tick={{ fontSize: 11, fill: COLOR.textMuted }}
            axisLine={false}
            tickLine={false}
            width={50}
          />

          {/* Tooltip */}
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: `1px solid ${COLOR.border}`, fontSize: '12px' }}
          />

          {/* Área con línea verde y relleno degradado */}
          <Area
            type="monotone"
            dataKey="kg"
            stroke={COLOR.mainGreen}
            strokeWidth={2.5}
            fill="url(#degradadoVerde)"
            dot={{ r: 4, fill: COLOR.darkGreen, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: COLOR.darkGreen }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Contenedor>
  )
}

// ----- TablaRecepciones -----
// Tabla de recepciones del día, filtrada según la vista activa.
// Props:
//   filas — array de objetos recepción ya filtrados
function TablaRecepciones({ filas }) {
  // Estilos de celda de encabezado
  const th = {
    padding:       '8px 10px',
    textAlign:     'left',
    fontSize:      '11px',
    fontWeight:    700,
    color:         COLOR.darkGreen,
    background:    COLOR.lightBg,
    borderBottom:  `2px solid ${COLOR.border}`,
    whiteSpace:    'nowrap',
  }

  // Estilos de celda de dato
  const td = {
    padding:      '9px 10px',
    fontSize:     '12px',
    color:        COLOR.textPrimary,
    borderBottom: `1px solid ${COLOR.border}`,
    whiteSpace:   'nowrap',
  }

  // Color de fondo de fila según tipo de producto
  const bgFila = (tipo) => tipo === 'camaron' ? '#f0fdf8' : '#f0f7ff'

  // Badge de calidad: A = verde, B = ámbar
  const badgeCalidad = (cal) => ({
    display:      'inline-block',
    padding:      '2px 8px',
    borderRadius: '999px',
    fontSize:     '11px',
    fontWeight:   700,
    background:   cal === 'A' ? '#dcfce7' : '#fef3c7',
    color:        cal === 'A' ? '#15803d' : '#b45309',
  })

  return (
    <Contenedor titulo={`Recepciones de hoy (${filas.length})`}>
      {/* div con scroll horizontal para pantallas pequeñas */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Hora</th>
              <th style={th}>Tipo</th>
              <th style={th}>Proveedor</th>
              <th style={th}>Producto</th>
              <th style={th}>Peso</th>
              <th style={th}>T°</th>
              <th style={th}>Calidad</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, idx) => (
              <tr key={idx} style={{ background: bgFila(fila.tipo) }}>
                <td style={td}>{fila.hora}</td>
                <td style={td}>
                  {/* Emoji indicador de tipo */}
                  {fila.tipo === 'camaron' ? '🦐 Camarón' : '🐟 Pescado'}
                </td>
                <td style={td}>{fila.proveedor}</td>
                <td style={td}>{fila.producto}</td>
                <td style={{ ...td, fontWeight: 600 }}>{fila.peso}</td>
                <td style={td}>{fila.temp}</td>
                <td style={td}>
                  <span style={badgeCalidad(fila.calidad)}>{fila.calidad}</span>
                </td>
              </tr>
            ))}

            {/* Fila vacía si no hay resultados */}
            {filas.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', color: COLOR.textMuted, padding: '24px' }}>
                  No hay recepciones para esta vista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Contenedor>
  )
}

// ----- PanelAlertas -----
// Panel lateral con alertas del día (peligro, advertencia, OK).
// No recibe props — usa la constante ALERTAS directamente.
// Props: alertas — array { tipo:'danger'|'warn'|'ok', proveedor, hora, mensaje }
function PanelAlertas({ alertas = [] }) {
  const cfg = {
    danger: { icono: '🚨', bg: '#fef2f2', border: '#fca5a5', texto: COLOR.danger },
    warn:   { icono: '⚠️',  bg: '#fffbeb', border: '#fcd34d', texto: '#92400e' },
    ok:     { icono: '✅',  bg: '#f0fdf4', border: '#86efac', texto: '#15803d' },
  }

  if (alertas.length === 0) {
    return (
      <Contenedor titulo="Alertas del día">
        <p style={{ fontSize: 12, color: COLOR.textMuted, margin: 0 }}>Sin alertas registradas hoy.</p>
      </Contenedor>
    )
  }

  return (
    <Contenedor titulo="Alertas del día">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alertas.map((alerta, idx) => {
          const c = cfg[alerta.tipo]
          return (
            <div
              key={idx}
              style={{
                background:   c.bg,
                border:       `1px solid ${c.border}`,
                borderRadius: '8px',
                padding:      '10px 12px',
              }}
            >
              {/* Fila superior: icono + proveedor + hora */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: c.texto }}>
                  {c.icono} {alerta.proveedor ?? 'Sistema'}
                </span>
                {alerta.hora && (
                  <span style={{ fontSize: '11px', color: COLOR.textMuted }}>{alerta.hora}</span>
                )}
              </div>

              {/* Mensaje de la alerta */}
              <p style={{ margin: 0, fontSize: '12px', color: c.texto }}>
                {alerta.mensaje}
              </p>
            </div>
          )
        })}
      </div>
    </Contenedor>
  )
}

// ----- GrillaTemperatura -----
// Grilla de tarjetas con lecturas de temperatura por lote (PCC 1).
// Muestra advertencia visual si la temperatura >= TEMP_UMBRAL.
// Props: lecturas — array { lote, temp, ok }
function GrillaTemperatura({ lecturas = [] }) {
  if (lecturas.length === 0) {
    return (
      <Contenedor titulo="Temperaturas de recepción — PCC 1 (límite crítico: 4°C)">
        <p style={{ fontSize: 12, color: COLOR.textMuted, margin: 0 }}>Sin lecturas de temperatura hoy.</p>
      </Contenedor>
    )
  }
  return (
    <Contenedor titulo="Temperaturas de recepción — PCC 1 (límite crítico: 4°C)">
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap:                 '10px',
      }}>
        {lecturas.map((item, idx) => {
          const esAlerta = item.temp >= 3.5

          return (
            <div
              key={idx}
              style={{
                background:   esAlerta ? '#fef2f2' : COLOR.lightBg,
                border:       `1px solid ${esAlerta ? '#fca5a5' : '#a7f3d0'}`,
                borderRadius: '8px',
                padding:      '12px',
                textAlign:    'center',
              }}
            >
              {/* Nombre del lote */}
              <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 600, color: COLOR.textMuted }}>
                {item.lote}
              </p>

              {/* Temperatura — en rojo si es alerta */}
              <p style={{
                margin:     '0 0 4px 0',
                fontSize:   '22px',
                fontWeight: 800,
                color:      esAlerta ? COLOR.danger : COLOR.darkGreen,
              }}>
                {item.temp}°C
              </p>

              {/* Estado OK / ALERTA */}
              <span style={{
                fontSize:     '11px',
                fontWeight:   700,
                color:        esAlerta ? COLOR.danger : COLOR.ok,
              }}>
                {esAlerta ? '⚠️ ALERTA' : '✓ OK'}
              </span>
            </div>
          )
        })}
      </div>
    </Contenedor>
  )
}

// =====================================================
// === Componente principal — DashboardFiltrado ===
// =====================================================
// Props:
//   onNavigate — función opcional para navegar a otra ruta (ej. formulario de recepción)
export default function DashboardFiltrado({ onNavigate }) {
  // Filtro activo: 'all' | 'camaron' | 'pescado'
  const [filtro, setFiltro] = useState('all')

  // Estado para todos los datos cargados desde la API
  const [kpis,         setKpis]        = useState([])
  const [barTitle,     setBarTitle]    = useState('')
  const [barData,      setBarData]     = useState([])
  const [trendTitle,   setTrendTitle]  = useState('')
  const [trendData,    setTrendData]   = useState([])
  const [proveedores,  setProveedores] = useState([])  // para gráfica de dona
  const [tablaHoy,     setTablaHoy]    = useState([])
  const [alertas,      setAlertas]     = useState([])
  const [temperaturas, setTemperaturas]= useState([])
  const [cargando,     setCargando]    = useState(true)

  // Convierte '2026-03-23' → '23-Mar' para el eje X de tendencia
  const formatFecha = (fechaStr) => {
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const d = new Date(fechaStr + 'T00:00:00')
    return `${d.getDate()}-${MESES[d.getMonth()]}`
  }

  // Carga todos los datos cuando cambia el filtro activo
  useEffect(() => {
    setCargando(true)

    // Peticiones paralelas — bar usa endpoint distinto según filtro
    const fetchBarData = filtro === 'camaron'
      ? api.get('/api/dashboard/calidad/por-talla')
      : api.get('/api/dashboard/calidad/por-especie')

    Promise.all([
      api.get(`/api/dashboard/calidad/kpis?tipo=${filtro}`),
      api.get(`/api/dashboard/calidad/tabla-hoy?tipo=${filtro}`),
      api.get(`/api/dashboard/calidad/tendencia?tipo=${filtro}`),
      api.get('/api/dashboard/calidad/por-proveedor'),
      fetchBarData,
    ])
      .then(([resKpis, resTabla, resTend, resProv, resBar]) => {
        const k = resKpis.data

        // ── KPIs ──────────────────────────────────────────────────────────
        // El shape de k varía según el filtro; construimos el array estándar
        let kpisArr
        if (filtro === 'camaron') {
          kpisArr = [
            { label: 'Lotes camarón hoy',  value: String(k.lotes),                               sub: 'lotes registrados hoy' },
            { label: 'Libras recibidas',   value: Number(k.libras).toLocaleString(),              sub: 'lb camarón total del día' },
            { label: 'Calidad promedio',   value: k.calidad_prom,                                 sub: `${k.calidad_pts} pts promedio` },
          ]
        } else if (filtro === 'pescado') {
          const tempAlerta = parseFloat(k.temp_prom) >= 4
          kpisArr = [
            { label: 'Lotes pescado hoy',       value: String(k.lotes),                           sub: 'romaneos registrados hoy' },
            { label: 'Kg neto recibidos',        value: Number(k.kg_total).toLocaleString(),       sub: 'kg pescado fresco' },
            { label: 'T° promedio recepción',    value: `${k.temp_prom}°C`,                        sub: 'Límite crítico: 4°C', isAlert: tempAlerta },
            { label: 'Piezas recibidas',         value: String(k.piezas),                          sub: 'piezas registradas' },
          ]
        } else {
          kpisArr = [
            { label: 'Recepciones hoy',      value: String(k.total),       sub: `${k.lotes_camaron} camarón · ${k.lotes_pescado} pescado` },
            { label: 'Proveedores activos',  value: String(k.proveedores), sub: 'proveedores con recepción hoy' },
            { label: 'Alertas activas',      value: String(k.alertas),     sub: 'calidad / transporte', isAlert: k.alertas > 0 },
          ]
        }
        setKpis(kpisArr)

        // ── Tabla de recepciones ──────────────────────────────────────────
        // Normaliza el shape distinto de cada tipo al formato que acepta TablaRecepciones
        const filas = resTabla.data.map(r => {
          if (filtro === 'camaron') {
            return {
              hora:      String(r.hora ?? '').slice(0, 5) || '—',
              tipo:      'camaron',
              proveedor: r.proveedor || '—',
              producto:  r.presentacion || r.nro_lote || '—',
              peso:      `${Number(r.libras ?? 0).toLocaleString()} lb`,
              temp:      r.temperatura != null ? `${r.temperatura}°C` : '—',
              calidad:   r.calidad || '—',
            }
          }
          if (filtro === 'pescado') {
            return {
              hora:      String(r.hora ?? '').slice(0, 5) || '—',
              tipo:      'pescado',
              proveedor: r.proveedor || '—',
              producto:  `${r.especie || '—'} ${r.presentacion || ''}`.trim(),
              peso:      `${Number(r.peso ?? 0).toLocaleString()} lb`,
              temp:      r.temperatura != null ? `${r.temperatura}°C` : '—',
              calidad:   r.clasificacion || r.calificacion || '—',
            }
          }
          // Vista general: solo tiene tipo, hora, proveedor y nro_recepcion
          return {
            hora:      String(r.hora ?? '').slice(0, 5) || '—',
            tipo:      r.tipo,
            proveedor: r.proveedor || '—',
            producto:  r.nro_recepcion || '—',
            peso:      '—',
            temp:      '—',
            calidad:   '—',
          }
        })
        setTablaHoy(filas)

        // ── Tendencia (eje X: '23-Mar') ───────────────────────────────────
        setTrendData(resTend.data.map(r => ({ dia: formatFecha(r.fecha), kg: parseFloat(r.kg) })))
        setTrendTitle(
          filtro === 'camaron' ? 'Tendencia camarón — 7 días (kg)' :
          filtro === 'pescado' ? 'Tendencia pescado — 7 días (kg)' :
                                 'Tendencia total — 7 días (recepciones)'
        )

        // ── Dona de proveedores (% sobre total) ───────────────────────────
        const totalRec = resProv.data.reduce((s, r) => s + parseInt(r.recepciones), 0) || 1
        setProveedores(resProv.data.map(r => ({
          nombre: r.nombre,
          pct:    Math.round(parseInt(r.recepciones) / totalRec * 100),
        })))

        // ── Barras ────────────────────────────────────────────────────────
        setBarData(resBar.data)
        setBarTitle(
          filtro === 'camaron' ? 'Distribución por talla — Últimos 30 días (lb)' :
                                 'Recepción por especie — Últimos 30 días (kg)'
        )

        // ── Alertas: detectamos incidencias en la tabla ───────────────────
        const nuevasAlertas = []
        if (filtro === 'pescado') {
          resTabla.data
            .filter(r => r.objetos_extranos)
            .forEach(r => nuevasAlertas.push({
              tipo:      'danger',
              proveedor: r.proveedor,
              hora:      String(r.hora ?? '').slice(0, 5) || null,
              mensaje:   'Objetos extraños detectados en la carga',
            }))
        }
        if (nuevasAlertas.length === 0) {
          nuevasAlertas.push({ tipo: 'ok', proveedor: null, hora: null, mensaje: 'Sin novedades en las recepciones del día.' })
        }
        setAlertas(nuevasAlertas)

        // ── Temperaturas PCC 1: extraídas de la tabla de hoy ─────────────
        setTemperaturas(
          resTabla.data
            .filter(r => r.temperatura != null)
            .map(r => ({
              lote: r.nro_lote || r.especie || r.nro_recepcion || '—',
              temp: parseFloat(r.temperatura),
              ok:   parseFloat(r.temperatura) < 4,
            }))
        )
      })
      .catch(err => console.error('Error cargando dashboard:', err))
      .finally(() => setCargando(false))
  }, [filtro])   // se re-ejecuta cada vez que el usuario cambia de chip

  // Chips de filtro
  const chips = [
    { key: 'all',     label: '🌐 General', colorActivo: COLOR.darkGreen },
    { key: 'camaron', label: '🦐 Camarón', colorActivo: COLOR.mainGreen },
    { key: 'pescado', label: '🐟 Pescado',  colorActivo: COLOR.midGreen  },
  ]

  return (
    <div style={{ background: COLOR.pageBg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '18px 16px' }}>

        {/* ---- Encabezado del dashboard ---- */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            '12px',
          marginBottom:   '20px',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: COLOR.darkGreen }}>
              Dashboard de Recepciones
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: COLOR.textMuted }}>
              JJ SeaFoods · {new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Botón para ir al formulario de recepción */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('recepcion-calidad')}
              style={{
                background:   COLOR.mainGreen,
                color:        '#fff',
                border:       'none',
                borderRadius: '8px',
                padding:      '8px 16px',
                fontSize:     '13px',
                fontWeight:   600,
                cursor:       'pointer',
              }}
            >
              + Nueva recepción
            </button>
          )}
        </div>

        {/* ---- Chips de filtro ---- */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {chips.map((chip) => (
            <ChipFiltro
              key={chip.key}
              label={chip.label}
              activo={filtro === chip.key}
              colorActivo={chip.colorActivo}
              onClick={() => setFiltro(chip.key)}
            />
          ))}
        </div>

        {/* ---- Indicador de carga ---- */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: COLOR.textMuted, fontSize: 14 }}>
            Cargando datos...
          </div>
        ) : (
          <>
            {/* ---- Grilla de KPIs (auto-fit: colapsa en pantallas angostas) ---- */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap:                 '12px',
              marginBottom:        '16px',
            }}>
              {kpis.map((kpi, idx) => (
                <TarjetaKPI key={idx} {...kpi} />
              ))}
            </div>

            {/* ---- Barras + Dona (colapsa a 1 columna en móvil) ---- */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap:                 '16px',
              marginBottom:        '16px',
              alignItems:          'start',
            }}>
              <GraficaBarras titulo={barTitle} datos={barData} />
              <GraficaDonut  datos={proveedores} />
            </div>

            {/* ---- Tendencia 7 días (ancho completo) ---- */}
            <div style={{ marginBottom: '16px' }}>
              <GraficaTendencia titulo={trendTitle} datos={trendData} />
            </div>

            {/* ---- Tabla de recepciones del día ---- */}
            <div style={{ marginBottom: '16px' }}>
              <TablaRecepciones filas={tablaHoy} />
            </div>

            {/* ---- Alertas + Temperaturas PCC 1 ---- */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap:                 '16px',
              marginBottom:        '16px',
              alignItems:          'start',
            }}>
              <PanelAlertas     alertas={alertas} />
              <GrillaTemperatura lecturas={temperaturas} />
            </div>
          </>
        )}

        {/* ---- Pie de página ---- */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: COLOR.textMuted, margin: '8px 0 0' }}>
          JJ SeaFoods · Sistema de trazabilidad · {new Date().getFullYear()}
        </p>

      </div>
    </div>
  )
}
