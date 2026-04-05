// =====================================================
// RecepcionCalidad.jsx
// Formulario de recepción de calidad para camarón y pescado fresco
// Diseñado para personal de control de calidad
// =====================================================

import { useState, useRef, useEffect } from 'react'
import api from '../api'

// === Constantes ===
const COLOR = {
  verde: '#1F7A63',
  verdeMain: '#3AAE8D',
  verdeBg: '#e8f5ee',
  verdeBorde: '#c8eedd',
  naranja: '#e67e22',
  naranjaBg: '#fdebd0',
  rojo: '#c0392b',
  rojoBg: '#fce4e4',
  amarillo: '#e9c46a',
  amarilloBg: '#fef9e7',
}

const PROVEEDORES = ['Antonio Maurini', 'Bryan Intriago', 'Joao Cevillano', 'Scarleth Copete']

const ESPECIES_PESCADO = ['Tuna YF', 'Dorado', 'Wahoo', 'Mahi Mahi', 'Pargo Seda']

// Genera número de recepción automático
function generarNroRecepcion() {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `REC-${yy}${mm}${dd}-${rand}`
}

// Fecha de hoy en formato YYYY-MM-DD
function hoy() {
  return new Date().toISOString().split('T')[0]
}

// Hora actual en formato HH:MM
function horaActual() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// =====================================================
// === Componentes auxiliares ===
// =====================================================

function SelectorTipo({ tipo, onChange }) {
  const tarjetas = [
    {
      id: 'camaron',
      emoji: '🦐',
      titulo: 'Camarón',
      subtitulo: 'FPD-CI-C-01-RG-01',
    },
    {
      id: 'pescado',
      emoji: '🐟',
      titulo: 'Pescado Fresco',
      subtitulo: 'FPD-CI-P-01-RG-01',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
      {tarjetas.map((t) => {
        const seleccionado = tipo === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              border: `2px solid ${seleccionado ? COLOR.verde : '#e5e7eb'}`,
              borderRadius: 12,
              padding: '20px 16px',
              background: seleccionado ? COLOR.verde : '#fff',
              color: seleccionado ? '#fff' : '#374151',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
              boxShadow: seleccionado ? '0 4px 14px rgba(31,122,99,0.25)' : '0 1px 4px rgba(0,0,0,0.07)',
              transform: seleccionado ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 6 }}>{t.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{t.titulo}</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>{t.subtitulo}</div>
          </button>
        )
      })}
    </div>
  )
}

function CabeceraSeccion({ numero, titulo, badge }) {
  return (
    <div
      style={{
        background: COLOR.verde,
        color: '#fff',
        padding: '9px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            background: 'rgba(255,255,255,0.25)',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {numero}
        </span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{titulo}</span>
      </div>
      {badge && (
        <span
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  )
}

function Seccion({ numero, titulo, badge, children }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        marginBottom: 14,
        overflow: 'hidden',
      }}
    >
      <CabeceraSeccion numero={numero} titulo={titulo} badge={badge} />
      <div style={{ padding: '16px 16px 18px' }}>{children}</div>
    </div>
  )
}

function Campo({ label, required, children, style }) {
  return (
    <div style={{ ...style }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 11,
            color: '#6b7280',
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {label}
          {required && <span style={{ color: COLOR.rojo, marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
    </div>
  )
}

const estiloInput = {
  border: '1px solid #d1d5db',
  borderRadius: 7,
  padding: '7px 10px',
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  color: '#111827',
  background: '#fff',
}

const estiloSelect = {
  ...estiloInput,
  cursor: 'pointer',
}

const estiloTextarea = {
  ...estiloInput,
  resize: 'vertical',
  minHeight: 70,
}

function GrupoToggle({ opciones, valor, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {opciones.map((op) => {
        const activo = valor === op
        return (
          <button
            key={op}
            type="button"
            onClick={() => onChange(op)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1.5px solid ${activo ? COLOR.verde : '#d1d5db'}`,
              background: activo ? COLOR.verde : '#fff',
              color: activo ? '#fff' : '#374151',
              fontSize: 13,
              fontWeight: activo ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {op}
          </button>
        )
      })}
    </div>
  )
}

function FilaDefecto({ nombre, valor, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 0',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{nombre}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={valor}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: 58,
            border: '1px solid #d1d5db',
            borderRadius: 5,
            padding: '4px 6px',
            fontSize: 12,
            textAlign: 'right',
          }}
        />
        <span style={{ fontSize: 11, color: '#6b7280' }}>%</span>
      </div>
    </div>
  )
}

function SelectorCalidad({ valor, onChange }) {
  const opciones = [
    {
      id: 'A',
      label: 'CALIDAD A',
      rango: '2.6 – 3.0',
      borde: COLOR.verde,
      bg: COLOR.verdeBg,
      textColor: COLOR.verde,
    },
    {
      id: 'B',
      label: 'CALIDAD B',
      rango: '2.0 – 2.59',
      borde: COLOR.amarillo,
      bg: COLOR.amarilloBg,
      textColor: '#7d6900',
    },
    {
      id: 'C',
      label: 'CALIDAD C',
      rango: '1.5 – 1.99',
      borde: COLOR.naranja,
      bg: COLOR.naranjaBg,
      textColor: '#7d3900',
    },
    {
      id: 'R',
      label: 'RECHAZO',
      rango: '< 1.5',
      borde: COLOR.rojo,
      bg: COLOR.rojoBg,
      textColor: COLOR.rojo,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {opciones.map((op) => {
        const sel = valor === op.id
        return (
          <button
            key={op.id}
            type="button"
            onClick={() => onChange(op.id)}
            style={{
              border: `2px solid ${op.borde}`,
              borderRadius: 10,
              padding: '14px 8px',
              background: sel ? op.borde : op.bg,
              color: sel ? '#fff' : op.textColor,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
              transform: sel ? 'scale(1.05)' : 'scale(1)',
              boxShadow: sel ? `0 4px 12px ${op.borde}55` : 'none',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18 }}>{op.id}</div>
            <div style={{ fontWeight: 600, fontSize: 11, marginTop: 3 }}>{op.label}</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{op.rango}</div>
          </button>
        )
      })}
    </div>
  )
}

function TablaOrganolectica({ valores, onChange }) {
  const caracteristicas = ['Color', 'Olor', 'Textura', 'Ojos', 'Apariencia']
  const puntajes = [3, 2, 1, 0]

  const colorBoton = (p, activo) => {
    if (!activo) return { bg: '#f3f4f6', color: '#374151' }
    if (p === 3) return { bg: '#1d9e75', color: '#fff' }
    if (p === 2) return { bg: '#e9c46a', color: '#222' }
    if (p === 1) return { bg: '#e76f51', color: '#fff' }
    return { bg: '#c0392b', color: '#fff' }
  }

  const promedio =
    Object.values(valores).length > 0
      ? (Object.values(valores).reduce((a, b) => a + b, 0) / Object.values(valores).length).toFixed(1)
      : '0.0'

  const clasifFinal = (prom) => {
    const p = parseFloat(prom)
    if (p >= 2.6) return 'A'
    if (p >= 2.0) return 'B'
    if (p >= 1.5) return 'C'
    return 'R'
  }

  const clasifColor = (c) => {
    if (c === 'A') return { color: COLOR.verde, bg: COLOR.verdeBg }
    if (c === 'B') return { color: '#7d6900', bg: COLOR.amarilloBg }
    if (c === 'C') return { color: '#7d3900', bg: COLOR.naranjaBg }
    return { color: COLOR.rojo, bg: COLOR.rojoBg }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          background: '#f0fdf8',
          border: `1px solid ${COLOR.verdeBorde}`,
          borderRadius: 7,
          padding: '8px 12px',
          marginBottom: 12,
          fontSize: 12,
          color: COLOR.verde,
          fontWeight: 500,
        }}
      >
        Registre el puntaje para cada característica: 3 = óptimo, 0 = rechazo
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={thStyle}>Característica</th>
            <th style={thStyle} colSpan={4}>Puntaje</th>
            <th style={thStyle}>Calificación</th>
            <th style={thStyle}>Clasificación</th>
          </tr>
        </thead>
        <tbody>
          {caracteristicas.map((car) => {
            const val = valores[car] ?? 3
            const cc = clasifColor(clasifFinal(val.toFixed(1)))
            return (
              <tr key={car} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={tdStyle}>{car}</td>
                {puntajes.map((p) => {
                  const activo = val === p
                  const cb = colorBoton(p, activo)
                  return (
                    <td key={p} style={{ ...tdStyle, textAlign: 'center', padding: '6px 4px' }}>
                      <button
                        type="button"
                        onClick={() => onChange(car, p)}
                        style={{
                          width: 40,
                          height: 32,
                          borderRadius: 6,
                          border: activo ? 'none' : '1px solid #e5e7eb',
                          background: cb.bg,
                          color: cb.color,
                          fontWeight: activo ? 700 : 400,
                          cursor: 'pointer',
                          fontSize: 13,
                          transition: 'all 0.1s',
                        }}
                      >
                        {p}
                      </button>
                    </td>
                  )
                })}
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{val.toFixed(1)}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span
                    style={{
                      background: cc.bg,
                      color: cc.color,
                      borderRadius: 20,
                      padding: '2px 10px',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {clasifFinal(val.toFixed(1))}
                  </span>
                </td>
              </tr>
            )
          })}
          <tr style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
            <td style={{ ...tdStyle, fontWeight: 700 }}>PROMEDIO</td>
            <td colSpan={4} />
            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{promedio}</td>
            <td style={{ ...tdStyle, textAlign: 'center' }}>
              {(() => {
                const cf = clasifFinal(promedio)
                const cc = clasifColor(cf)
                return (
                  <span
                    style={{
                      background: cc.bg,
                      color: cc.color,
                      borderRadius: 20,
                      padding: '3px 12px',
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {cf}
                  </span>
                )
              })()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const thStyle = {
  padding: '8px 10px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  color: '#374151',
  borderBottom: '2px solid #e5e7eb',
}

const tdStyle = {
  padding: '8px 10px',
  fontSize: 13,
  color: '#111827',
  verticalAlign: 'middle',
}

// Tabla de romaneo para pescado
function TablaRomaneo({ filas, onChange, onAgregar, onEliminar }) {
  const calcCalif = (fila) => {
    const sum = fila.color + fila.olor + fila.textura + fila.ojos + fila.branquias
    return (sum / 5).toFixed(1)
  }

  const calcClasif = (calif) => {
    const c = parseFloat(calif)
    if (c >= 2.6) return 'A'
    if (c >= 2.0) return 'B'
    if (c >= 1.5) return 'C'
    return 'R'
  }

  const clasifColor = (c) => {
    if (c === 'A') return { color: COLOR.verde, bg: COLOR.verdeBg }
    if (c === 'B') return { color: '#7d6900', bg: COLOR.amarilloBg }
    if (c === 'C') return { color: '#7d3900', bg: COLOR.naranjaBg }
    return { color: COLOR.rojo, bg: COLOR.rojoBg }
  }

  const totalPeso = filas.reduce((s, f) => s + (parseFloat(f.peso) || 0), 0).toFixed(2)
  const totalPiezas = filas.reduce((s, f) => s + (parseInt(f.nroPiezas) || 0), 0)

  const opcionesScore = [0, 1, 2, 3]

  return (
    <div>
      <div
        style={{
          background: '#fff8e1',
          border: '1px solid #e9c46a',
          borderRadius: 7,
          padding: '8px 14px',
          marginBottom: 12,
          fontSize: 12,
          color: '#7d6900',
          fontWeight: 500,
        }}
      >
        ⚠ Límite crítico: T° máxima 4°C — Registrar cada pieza recibida
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1100 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {[
                'Hora', 'Código/Romaneo', 'Proveedor', 'Especie', 'Talla', 'Cal. Prov.',
                'Presentación', 'Peso (lb)', 'N° Piezas', 'Presencia Hielo', 'T°C', 'Obj. Extraños',
                'Color', 'Olor', 'Textura', 'Ojos', 'Branquias',
                'Calificación', 'Clasificación', ''
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    ...thStyle,
                    background: COLOR.verde,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    fontSize: 11,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, idx) => {
              const calif = calcCalif(fila)
              const clasif = calcClasif(calif)
              const cc = clasifColor(clasif)
              return (
                <tr key={fila.id} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  {/* Hora */}
                  <td style={tdStyle}>
                    <input
                      type="time"
                      value={fila.hora}
                      onChange={(e) => onChange(idx, 'hora', e.target.value)}
                      style={{ ...estiloInput, width: 90, fontSize: 11, padding: '4px 6px' }}
                    />
                  </td>
                  {/* Código */}
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={fila.codigo}
                      onChange={(e) => onChange(idx, 'codigo', e.target.value)}
                      style={{ ...estiloInput, width: 90, fontSize: 11, padding: '4px 6px' }}
                    />
                  </td>
                  {/* Proveedor */}
                  <td style={tdStyle}>
                    <select
                      value={fila.proveedor}
                      onChange={(e) => onChange(idx, 'proveedor', e.target.value)}
                      style={{ ...estiloSelect, width: 110, fontSize: 11, padding: '4px 6px' }}
                    >
                      {PROVEEDORES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </td>
                  {/* Especie */}
                  <td style={tdStyle}>
                    <select
                      value={fila.especie}
                      onChange={(e) => onChange(idx, 'especie', e.target.value)}
                      style={{ ...estiloSelect, width: 100, fontSize: 11, padding: '4px 6px' }}
                    >
                      {ESPECIES_PESCADO.map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </td>
                  {/* Talla */}
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={fila.talla}
                      onChange={(e) => onChange(idx, 'talla', e.target.value)}
                      placeholder="100+"
                      style={{ ...estiloInput, width: 62, fontSize: 11, padding: '4px 6px' }}
                    />
                  </td>
                  {/* Calidad proveedor */}
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={fila.calidadProveedor}
                      onChange={(e) => onChange(idx, 'calidadProveedor', e.target.value)}
                      placeholder="1+"
                      style={{ ...estiloInput, width: 52, fontSize: 11, padding: '4px 6px' }}
                    />
                  </td>
                  {/* Presentación */}
                  <td style={tdStyle}>
                    <select
                      value={fila.presentacion}
                      onChange={(e) => onChange(idx, 'presentacion', e.target.value)}
                      style={{ ...estiloSelect, width: 90, fontSize: 11, padding: '4px 6px' }}
                    >
                      {['Entero', 'Filete'].map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </td>
                  {/* Peso */}
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={fila.peso}
                      onChange={(e) => onChange(idx, 'peso', e.target.value)}
                      style={{ ...estiloInput, width: 70, fontSize: 11, padding: '4px 6px' }}
                    />
                  </td>
                  {/* N° piezas */}
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min="1"
                      value={fila.nroPiezas}
                      onChange={(e) => onChange(idx, 'nroPiezas', parseInt(e.target.value) || 1)}
                      style={{ ...estiloInput, width: 60, fontSize: 11, padding: '4px 6px' }}
                    />
                  </td>
                  {/* Presencia hielo */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={fila.presenciaHielo}
                      onChange={(e) => onChange(idx, 'presenciaHielo', e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                  </td>
                  {/* Temperatura */}
                  <td style={tdStyle}>
                    <input
                      type="number"
                      step="0.1"
                      value={fila.temperatura}
                      onChange={(e) => onChange(idx, 'temperatura', e.target.value)}
                      style={{
                        ...estiloInput,
                        width: 60,
                        fontSize: 11,
                        padding: '4px 6px',
                        borderColor: parseFloat(fila.temperatura) > 4 ? COLOR.rojo : '#d1d5db',
                        color: parseFloat(fila.temperatura) > 4 ? COLOR.rojo : '#111827',
                      }}
                    />
                  </td>
                  {/* Obj extraños */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={fila.objExtranos}
                      onChange={(e) => onChange(idx, 'objExtranos', e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                  </td>
                  {/* Color, Olor, Textura, Ojos, Branquias */}
                  {['color', 'olor', 'textura', 'ojos', 'branquias'].map((campo) => (
                    <td key={campo} style={{ ...tdStyle, padding: '4px' }}>
                      <select
                        value={fila[campo]}
                        onChange={(e) => onChange(idx, campo, parseInt(e.target.value))}
                        style={{
                          border: '1px solid #d1d5db',
                          borderRadius: 5,
                          padding: '4px 4px',
                          fontSize: 11,
                          width: 52,
                        }}
                      >
                        {opcionesScore.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  ))}
                  {/* Calificación */}
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{calif}</td>
                  {/* Clasificación */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span
                      style={{
                        background: cc.bg,
                        color: cc.color,
                        borderRadius: 20,
                        padding: '2px 8px',
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {clasif}
                    </span>
                  </td>
                  {/* Eliminar */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {filas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onEliminar(idx)}
                        style={{
                          background: COLOR.rojoBg,
                          color: COLOR.rojo,
                          border: `1px solid ${COLOR.rojo}`,
                          borderRadius: 5,
                          padding: '3px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {/* Fila de totales */}
            <tr style={{ background: '#f0fdf8', borderTop: '2px solid #c8eedd', fontWeight: 700 }}>
              <td colSpan={7} style={{ ...tdStyle, textAlign: 'right', color: COLOR.verde }}>TOTALES →</td>
              <td style={{ ...tdStyle, fontWeight: 700 }}>{totalPeso} lb</td>
              <td style={{ ...tdStyle, fontWeight: 700 }}>{totalPiezas}</td>
              <td colSpan={10} />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={onAgregar}
        style={{
          marginTop: 10,
          background: COLOR.verdeBg,
          color: COLOR.verde,
          border: `1.5px solid ${COLOR.verdeBorde}`,
          borderRadius: 7,
          padding: '7px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Agregar fila
      </button>
    </div>
  )
}

// =====================================================
// === Formulario camarón ===
// =====================================================

function FormCamaron({ onVolver, onGuardar, onRegisterGetDatos }) {
  const [nroRecepcion] = useState(generarNroRecepcion)

  // Sección 1 - Datos generales
  const [datos, setDatos] = useState({
    fecha: hoy(),
    horaLlegada: horaActual(),
    proveedor: PROVEEDORES[0],
    nroLote: '',
    nroGavetas: '',
    nroPiscina: '',
    librasReportadas: '',
    librasRecibidas: '',
    temperaturaRecepcion: '',
    horaAnalisis: horaActual(),
    nombreChofer: '',
    nroGuia: '',
    nroPlaca: '',
  })

  // Sección 2 - Tipo y presentación
  const [presentacion, setPresentacion] = useState('Entero')
  const [origen, setOrigen] = useState('Camarón acuacultura')
  const [especie, setEspecie] = useState('Vannamei')

  // Sección 3a - Estado básico
  const [estado, setEstado] = useState({
    pesoMuestra: '',
    colorCamaron: 'Normal',
    gramos: '',
    uniformidad: '',
    juveniles: '',
    so2ppm: '',
    clasificacionPromedio: '',
    basuraPescados: '',
    camaronLeche: '',
    totalDefectos: '',
  })

  // Sección 3b - Defectos
  const defectosInicialesA = {
    'Fresco y sano': 0,
    'Flacidez': 0,
    'Mudado': 0,
    'Quebrado / Maltratado': 0,
    'Picado': 0,
    'Con necrosis': 0,
    'Cabeza floja': 0,
    'Cabeza roja': 0,
    'Cabeza anaranjada': 0,
    'Hepatopancreas reventado': 0,
  }
  const defectosInicialesB = {
    'Deforme': 0,
    'Deshidratado': 0,
    'Deshidratado fuerte': 0,
    'Con melanosis': 0,
    'Rosado / Rojo': 0,
    'Semi Rosado': 0,
    'Corbata Grande': 0,
    'Corbata Sucia': 0,
    'Lodo en branquias': 0,
    'Otros': 0,
  }
  const [defectosA, setDefectosA] = useState(defectosInicialesA)
  const [defectosB, setDefectosB] = useState(defectosInicialesB)

  // Sección 3c - Calidad
  const [calidadSeleccionada, setCalidadSeleccionada] = useState('A')

  // Sección 3d - Características (checkboxes cocido/crudo)
  const [caracteristicas, setCaracteristicas] = useState({
    textura: { cocido: false, crudo: false },
    apariencia: { cocido: false, crudo: false },
    olor: { cocido: false, crudo: false },
    sabor: { cocido: false, crudo: false },
  })

  // Sección 3e - Gramaje y dosificación
  const [gramaje, setGramaje] = useState({ grande: '', pequeno: '' })
  const [dosis, setDosis] = useState({ grPorLb: 0.3 })

  // Sección 3f - Contaminación y transporte
  const [contaminacion, setContaminacion] = useState('NO')
  const [condicionTransporte, setCondicionTransporte] = useState('LIMPIO')

  // Sección 4 - Organoléptica
  const [organolectica, setOrganolectica] = useState({
    Color: 3,
    Olor: 3,
    Textura: 2,
    Ojos: 3,
    Apariencia: 3,
  })

  // Sección 5 - Observaciones y firmas
  const [firmas, setFirmas] = useState({
    observaciones: '',
    accionesCorrectivas: '',
    supervisorCC: '',
    jefeCC: '',
  })

  const [esExportacion, setEsExportacion] = useState(false)

  const totalGramosDosis = datos.librasRecibidas
    ? (parseFloat(datos.librasRecibidas) * dosis.grPorLb).toFixed(2)
    : '—'

  // ── Mecanismo para exponer el estado al componente padre ──────────────
  // stateRef siempre apunta al estado más reciente sin re-registrar en cada render
  const stateRef = useRef()
  stateRef.current = {
    tipo: 'camaron',
    nroRecepcion,
    datos,
    tipo_camaron: { presentacion, origen, especie },
    estado,
    defectos: { ...defectosA, ...defectosB },
    calidad: calidadSeleccionada,
    organolectica,
    condiciones: { contaminacion, condicionTransporte },
    gramaje,
    dosis: {
      grPorLb: dosis.grPorLb,
      totalGramos: totalGramosDosis !== '—' ? parseFloat(totalGramosDosis) : null,
    },
    firmas,
    esExportacion,
  }
  // Se registra una sola vez al montar; el padre llama a esta función al guardar
  useEffect(() => {
    onRegisterGetDatos(() => stateRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const actualizarOrganolectica = (car, val) => {
    setOrganolectica((prev) => ({ ...prev, [car]: val }))
  }

  const actualizarDefectoA = (nombre, val) => {
    setDefectosA((prev) => ({ ...prev, [nombre]: val }))
  }

  const actualizarDefectoB = (nombre, val) => {
    setDefectosB((prev) => ({ ...prev, [nombre]: val }))
  }

  const actualizarCaracteristica = (campo, tipo, val) => {
    setCaracteristicas((prev) => ({
      ...prev,
      [campo]: { ...prev[campo], [tipo]: val },
    }))
  }

  return (
    <div>
      {/* Sección 1 - Datos generales */}
      <Seccion numero="1" titulo="Datos Generales" badge={`N° ${nroRecepcion}`}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <Campo label="Fecha" required>
            <input
              type="date"
              value={datos.fecha}
              onChange={(e) => setDatos((p) => ({ ...p, fecha: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="Hora de llegada" required>
            <input
              type="time"
              value={datos.horaLlegada}
              onChange={(e) => setDatos((p) => ({ ...p, horaLlegada: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="Proveedor" required>
            <select
              value={datos.proveedor}
              onChange={(e) => setDatos((p) => ({ ...p, proveedor: e.target.value }))}
              style={estiloSelect}
            >
              {PROVEEDORES.map((pv) => <option key={pv}>{pv}</option>)}
            </select>
          </Campo>
          <Campo label="N° de lote">
            <input
              type="text"
              value={datos.nroLote}
              onChange={(e) => setDatos((p) => ({ ...p, nroLote: e.target.value }))}
              style={estiloInput}
              placeholder="Ej: L2024-001"
            />
          </Campo>
          <Campo label="N° de gavetas">
            <input
              type="number"
              min="0"
              value={datos.nroGavetas}
              onChange={(e) => setDatos((p) => ({ ...p, nroGavetas: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="N° de piscina">
            <input
              type="text"
              value={datos.nroPiscina}
              onChange={(e) => setDatos((p) => ({ ...p, nroPiscina: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="Libras reportadas">
            <input
              type="number"
              min="0"
              step="0.01"
              value={datos.librasReportadas}
              onChange={(e) => setDatos((p) => ({ ...p, librasReportadas: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="Libras recibidas">
            <input
              type="number"
              min="0"
              step="0.01"
              value={datos.librasRecibidas}
              onChange={(e) => setDatos((p) => ({ ...p, librasRecibidas: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="Temperatura recepción (°C)">
            <input
              type="number"
              step="0.1"
              value={datos.temperaturaRecepcion}
              onChange={(e) => setDatos((p) => ({ ...p, temperaturaRecepcion: e.target.value }))}
              style={estiloInput}
              placeholder="°C"
            />
          </Campo>
          <Campo label="Hora de análisis">
            <input
              type="time"
              value={datos.horaAnalisis}
              onChange={(e) => setDatos((p) => ({ ...p, horaAnalisis: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="Nombre del chofer">
            <input
              type="text"
              value={datos.nombreChofer}
              onChange={(e) => setDatos((p) => ({ ...p, nombreChofer: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="N° de guía">
            <input
              type="text"
              value={datos.nroGuia}
              onChange={(e) => setDatos((p) => ({ ...p, nroGuia: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="N° de placa">
            <input
              type="text"
              value={datos.nroPlaca}
              onChange={(e) => setDatos((p) => ({ ...p, nroPlaca: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
        </div>
      </Seccion>

      {/* Exportación toggle — camarón */}
      <div
        style={{
          background: esExportacion ? '#e0f2fe' : '#fff',
          border: `1.5px solid ${esExportacion ? '#0284c7' : '#e5e7eb'}`,
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
        onClick={() => setEsExportacion(v => !v)}
      >
        <input
          type="checkbox"
          checked={esExportacion}
          onChange={e => setEsExportacion(e.target.checked)}
          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0284c7' }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: esExportacion ? '#0284c7' : '#374151' }}>
            Producto destinado a exportación
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
            Marcar si esta recepción corresponde a un lote de exportación
          </div>
        </div>
      </div>

      {/* Sección 2 - Tipo y presentación */}
      <Seccion numero="2" titulo="Tipo de Camarón y Presentación">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Campo label="Presentación" required>
            <GrupoToggle
              opciones={['Entero', 'Cola', 'Para descabezar']}
              valor={presentacion}
              onChange={setPresentacion}
            />
          </Campo>
          <Campo label="Origen" required>
            <GrupoToggle
              opciones={['Camarón acuacultura', 'Camarón de mar']}
              valor={origen}
              onChange={setOrigen}
            />
          </Campo>
          <Campo label="Especie" required>
            <GrupoToggle
              opciones={['Vannamei', 'Stylirostris']}
              valor={especie}
              onChange={setEspecie}
            />
          </Campo>
        </div>
      </Seccion>

      {/* Sección 3 - Estado del camarón */}
      <Seccion numero="3" titulo="Estado del Camarón (PCC 1)" badge="PCC 1">
        {/* 3a - Campos básicos */}
        <div
          style={{
            borderLeft: `3px solid ${COLOR.verde}`,
            paddingLeft: 12,
            marginBottom: 18,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, color: COLOR.verde, marginBottom: 10 }}>
            3a. Parámetros de evaluación
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <Campo label="Peso de muestra (lb)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={estado.pesoMuestra}
                onChange={(e) => setEstado((p) => ({ ...p, pesoMuestra: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
            <Campo label="Color del camarón">
              <select
                value={estado.colorCamaron}
                onChange={(e) => setEstado((p) => ({ ...p, colorCamaron: e.target.value }))}
                style={estiloSelect}
              >
                {['Normal', 'Rosado / Rojo', 'Semi rosado'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Campo>
            <Campo label="Gramos">
              <input
                type="number"
                min="0"
                step="0.1"
                value={estado.gramos}
                onChange={(e) => setEstado((p) => ({ ...p, gramos: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
            <Campo label="Uniformidad">
              <input
                type="number"
                min="0"
                step="0.1"
                value={estado.uniformidad}
                onChange={(e) => setEstado((p) => ({ ...p, uniformidad: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
            <Campo label="Juveniles (%)">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={estado.juveniles}
                onChange={(e) => setEstado((p) => ({ ...p, juveniles: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
            <Campo label="SO₂ (ppm)">
              <input
                type="number"
                min="0"
                step="0.1"
                value={estado.so2ppm}
                onChange={(e) => setEstado((p) => ({ ...p, so2ppm: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
            <Campo label="Clasificación promedio">
              <input
                type="number"
                min="0"
                step="0.01"
                value={estado.clasificacionPromedio}
                onChange={(e) => setEstado((p) => ({ ...p, clasificacionPromedio: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
            <Campo label="Basura / Pescados (%)">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={estado.basuraPescados}
                onChange={(e) => setEstado((p) => ({ ...p, basuraPescados: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
            <Campo label="Camarón leche (%)">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={estado.camaronLeche}
                onChange={(e) => setEstado((p) => ({ ...p, camaronLeche: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
            <Campo label="Total defectos (%)">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={estado.totalDefectos}
                onChange={(e) => setEstado((p) => ({ ...p, totalDefectos: e.target.value }))}
                style={{ ...estiloInput, fontWeight: 700, color: COLOR.rojo }}
              />
            </Campo>
          </div>
        </div>

        {/* 3b - Defectos en dos columnas */}
        <div
          style={{
            borderLeft: `3px solid ${COLOR.verde}`,
            paddingLeft: 12,
            marginBottom: 18,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, color: COLOR.verde, marginBottom: 10 }}>
            3b. Condición y defectos del camarón
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Columna 1 */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#374151',
                  background: '#f9fafb',
                  padding: '6px 10px',
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              >
                Condición del camarón
              </div>
              {Object.entries(defectosA).map(([nombre, val]) => (
                <FilaDefecto
                  key={nombre}
                  nombre={nombre}
                  valor={val}
                  onChange={(v) => actualizarDefectoA(nombre, v)}
                />
              ))}
            </div>
            {/* Columna 2 */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#374151',
                  background: '#f9fafb',
                  padding: '6px 10px',
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              >
                Defectos adicionales
              </div>
              {Object.entries(defectosB).map(([nombre, val]) => (
                <FilaDefecto
                  key={nombre}
                  nombre={nombre}
                  valor={val}
                  onChange={(v) => actualizarDefectoB(nombre, v)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3c - Selector de calidad */}
        <div
          style={{
            borderLeft: `3px solid ${COLOR.verde}`,
            paddingLeft: 12,
            marginBottom: 18,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, color: COLOR.verde, marginBottom: 10 }}>
            3c. Calidad determinada
          </div>
          <SelectorCalidad valor={calidadSeleccionada} onChange={setCalidadSeleccionada} />
        </div>

        {/* 3d - Características Vannamei/Stylirostris */}
        <div
          style={{
            borderLeft: `3px solid ${COLOR.verde}`,
            paddingLeft: 12,
            marginBottom: 18,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, color: COLOR.verde, marginBottom: 10 }}>
            3d. Características ({especie})
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={thStyle}>Característica</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Cocido</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Crudo</th>
                </tr>
              </thead>
              <tbody>
                {['textura', 'apariencia', 'olor', 'sabor'].map((campo) => (
                  <tr key={campo} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle} className="capitalize">
                      {campo.charAt(0).toUpperCase() + campo.slice(1)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={caracteristicas[campo].cocido}
                        onChange={(e) => actualizarCaracteristica(campo, 'cocido', e.target.checked)}
                        style={{ width: 15, height: 15, cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={caracteristicas[campo].crudo}
                        onChange={(e) => actualizarCaracteristica(campo, 'crudo', e.target.checked)}
                        style={{ width: 15, height: 15, cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3e - Gramaje + Dosificación */}
        <div
          style={{
            borderLeft: `3px solid ${COLOR.verde}`,
            paddingLeft: 12,
            marginBottom: 18,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, color: COLOR.verde, marginBottom: 10 }}>
            3e. Gramaje y Dosificación de Metabisulfito
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Gramaje */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#374151', marginBottom: 8 }}>
                Gramaje
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Campo label="Grande (g)">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={gramaje.grande}
                    onChange={(e) => setGramaje((p) => ({ ...p, grande: e.target.value }))}
                    style={estiloInput}
                  />
                </Campo>
                <Campo label="Pequeño (g)">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={gramaje.pequeno}
                    onChange={(e) => setGramaje((p) => ({ ...p, pequeno: e.target.value }))}
                    style={estiloInput}
                  />
                </Campo>
              </div>
            </div>
            {/* Dosificación */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#374151', marginBottom: 8 }}>
                Dosificación metabisulfito
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Campo label="g/lb">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dosis.grPorLb}
                    onChange={(e) =>
                      setDosis((p) => ({ ...p, grPorLb: parseFloat(e.target.value) || 0 }))
                    }
                    style={estiloInput}
                  />
                </Campo>
                <Campo label="Total (g)">
                  <div
                    style={{
                      ...estiloInput,
                      background: '#f9fafb',
                      color: COLOR.verde,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {totalGramosDosis}
                  </div>
                </Campo>
              </div>
            </div>
          </div>
        </div>

        {/* 3f - Contaminación y condición transporte */}
        <div
          style={{
            borderLeft: `3px solid ${COLOR.verde}`,
            paddingLeft: 12,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, color: COLOR.verde, marginBottom: 10 }}>
            3f. Condiciones de recepción
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Campo label="Contaminación cruzada">
              <GrupoToggle opciones={['SI', 'NO']} valor={contaminacion} onChange={setContaminacion} />
            </Campo>
            <Campo label="Condición del transporte">
              <GrupoToggle
                opciones={['LIMPIO', 'SUCIO']}
                valor={condicionTransporte}
                onChange={setCondicionTransporte}
              />
            </Campo>
          </div>
        </div>
      </Seccion>

      {/* Sección 4 - Ponderación organoléptica */}
      <Seccion numero="4" titulo="Ponderación Organoléptica">
        <TablaOrganolectica valores={organolectica} onChange={actualizarOrganolectica} />
      </Seccion>

      {/* Sección 5 - Observaciones y firmas */}
      <Seccion numero="5" titulo="Observaciones y Firmas">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Campo label="Observaciones">
            <textarea
              value={firmas.observaciones}
              onChange={(e) => setFirmas((p) => ({ ...p, observaciones: e.target.value }))}
              style={estiloTextarea}
              placeholder="Ingrese observaciones relevantes..."
            />
          </Campo>
          <Campo label="Acciones correctivas">
            <textarea
              value={firmas.accionesCorrectivas}
              onChange={(e) => setFirmas((p) => ({ ...p, accionesCorrectivas: e.target.value }))}
              style={estiloTextarea}
              placeholder="Acciones tomadas..."
            />
          </Campo>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <Campo label="Supervisor Control de Calidad" required>
              <input
                type="text"
                value={firmas.supervisorCC}
                onChange={(e) => setFirmas((p) => ({ ...p, supervisorCC: e.target.value }))}
                style={estiloInput}
                placeholder="Nombre y firma"
              />
            </Campo>
            <Campo label="Jefe de Control de Calidad" required>
              <input
                type="text"
                value={firmas.jefeCC}
                onChange={(e) => setFirmas((p) => ({ ...p, jefeCC: e.target.value }))}
                style={estiloInput}
                placeholder="Nombre y firma"
              />
            </Campo>
          </div>
        </div>
      </Seccion>
    </div>
  )
}

// =====================================================
// === Formulario pescado ===
// =====================================================

function FormPescado({ onVolver, onGuardar, onRegisterGetDatos }) {
  const [nroRecepcion] = useState(generarNroRecepcion)

  // Sección 1 - Datos generales
  const [datos, setDatos] = useState({
    fecha: hoy(),
    hora: horaActual(),
    proveedor: PROVEEDORES[0],
    nroLote: '',
    romaneoNumero: '',
  })
  const [presentacion,  setPresentacion]  = useState('Entero (HG)')
  const [esExportacion, setEsExportacion] = useState(false)

  // Sección 2 - Romaneo
  const filaVacia = () => ({
    id: Date.now() + Math.random(),
    hora: horaActual(),
    codigo: '',
    proveedor: PROVEEDORES[0],
    especie: 'Tuna YF',
    talla: '',
    calidadProveedor: '',
    presentacion: 'Entero',
    peso: '',
    nroPiezas: 1,
    presenciaHielo: true,
    temperatura: '',
    objExtranos: false,
    color: 3,
    olor: 3,
    textura: 3,
    ojos: 3,
    branquias: 3,
  })

  const [romaneoFilas, setRomaneoFilas] = useState([filaVacia(), filaVacia()])

  const actualizarFila = (idx, campo, valor) => {
    setRomaneoFilas((prev) => {
      const copia = [...prev]
      copia[idx] = { ...copia[idx], [campo]: valor }
      return copia
    })
  }

  const agregarFila = () => {
    setRomaneoFilas((prev) => [...prev, filaVacia()])
  }

  const eliminarFila = (idx) => {
    setRomaneoFilas((prev) => prev.filter((_, i) => i !== idx))
  }

  // Sección 3 - Observaciones y firmas
  const [firmas, setFirmas] = useState({
    observaciones: '',
    accionesCorrectivas: '',
    elaboradoPor: 'Paula Copete',
    revisadoPor: 'Gissella Reyes',
  })

  // ── Mecanismo para exponer el estado al componente padre ──────────────
  const stateRef = useRef()
  stateRef.current = {
    tipo: 'pescado',
    nroRecepcion,
    datos,
    presentacion,
    romaneoFilas,
    firmas,
    esExportacion,
  }
  useEffect(() => {
    onRegisterGetDatos(() => stateRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Sección 1 - Datos generales */}
      <Seccion numero="1" titulo="Datos Generales" badge={`N° ${nroRecepcion}`}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <Campo label="Fecha" required>
            <input
              type="date"
              value={datos.fecha}
              onChange={(e) => setDatos((p) => ({ ...p, fecha: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="Hora" required>
            <input
              type="time"
              value={datos.hora}
              onChange={(e) => setDatos((p) => ({ ...p, hora: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
          <Campo label="Proveedor" required>
            <select
              value={datos.proveedor}
              onChange={(e) => setDatos((p) => ({ ...p, proveedor: e.target.value }))}
              style={estiloSelect}
            >
              {PROVEEDORES.map((pv) => <option key={pv}>{pv}</option>)}
            </select>
          </Campo>
          <Campo label="N° de lote">
            <input
              type="text"
              value={datos.nroLote}
              onChange={(e) => setDatos((p) => ({ ...p, nroLote: e.target.value }))}
              style={estiloInput}
              placeholder="Ej: L2024-001"
            />
          </Campo>
          <Campo label="N° de pieza (Romaneo)">
            <input
              type="text"
              value={datos.romaneoNumero}
              onChange={(e) => setDatos((p) => ({ ...p, romaneoNumero: e.target.value }))}
              style={estiloInput}
            />
          </Campo>
        </div>
        <Campo label="Presentación" required>
          <GrupoToggle
            opciones={['Entero (HG)', 'Filete']}
            valor={presentacion}
            onChange={setPresentacion}
          />
        </Campo>
      </Seccion>

      {/* Exportación toggle — pescado */}
      <div
        style={{
          background: esExportacion ? '#e0f2fe' : '#fff',
          border: `1.5px solid ${esExportacion ? '#0284c7' : '#e5e7eb'}`,
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
        onClick={() => setEsExportacion(v => !v)}
      >
        <input
          type="checkbox"
          checked={esExportacion}
          onChange={e => setEsExportacion(e.target.checked)}
          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0284c7' }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: esExportacion ? '#0284c7' : '#374151' }}>
            Producto destinado a exportación
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
            Marcar si esta recepción corresponde a un lote de exportación
          </div>
        </div>
      </div>

      {/* Sección 2 - Control por pieza (romaneo) */}
      <Seccion numero="2" titulo="Control de Temperatura por Pieza (Romaneo)">
        <TablaRomaneo
          filas={romaneoFilas}
          onChange={actualizarFila}
          onAgregar={agregarFila}
          onEliminar={eliminarFila}
        />
      </Seccion>

      {/* Sección 3 - Observaciones y firmas */}
      <Seccion numero="3" titulo="Observaciones y Firmas">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Campo label="Observaciones">
            <textarea
              value={firmas.observaciones}
              onChange={(e) => setFirmas((p) => ({ ...p, observaciones: e.target.value }))}
              style={estiloTextarea}
              placeholder="Ingrese observaciones relevantes..."
            />
          </Campo>
          <Campo label="Acciones correctivas">
            <textarea
              value={firmas.accionesCorrectivas}
              onChange={(e) => setFirmas((p) => ({ ...p, accionesCorrectivas: e.target.value }))}
              style={estiloTextarea}
              placeholder="Acciones tomadas..."
            />
          </Campo>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <Campo label="Elaborado por" required>
              <input
                type="text"
                value={firmas.elaboradoPor}
                onChange={(e) => setFirmas((p) => ({ ...p, elaboradoPor: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
            <Campo label="Revisado por" required>
              <input
                type="text"
                value={firmas.revisadoPor}
                onChange={(e) => setFirmas((p) => ({ ...p, revisadoPor: e.target.value }))}
                style={estiloInput}
              />
            </Campo>
          </div>
        </div>
      </Seccion>
    </div>
  )
}

// =====================================================
// === Componente principal ===
// =====================================================

export default function RecepcionCalidad({ onVolver }) {
  const [tipo, setTipo] = useState('camaron')

  // Ref que guarda la función getDatos del form activo (camarón o pescado)
  const getFormDataRef = useRef(null)

  // Estados de la operación de guardado
  const [guardando, setGuardando]   = useState(false)
  const [mensaje,   setMensaje]     = useState(null) // { tipo:'ok'|'error', texto }

  // Al cambiar tipo de formulario, reseteamos el mensaje anterior
  const handleCambiarTipo = (nuevoTipo) => {
    setTipo(nuevoTipo)
    setMensaje(null)
  }

  // Guarda el registro llamando a la API según el tipo activo
  const handleGuardar = async () => {
    if (!getFormDataRef.current) return

    const payload = getFormDataRef.current()
    const endpoint = payload.tipo === 'camaron'
      ? '/api/recepciones-calidad/camaron'
      : '/api/recepciones-calidad/pescado'

    setGuardando(true)
    setMensaje(null)
    try {
      await api.post(endpoint, payload)
      setMensaje({
        tipo: 'ok',
        texto: `✓ Recepción ${payload.nroRecepcion} guardada correctamente.`,
      })
    } catch (err) {
      const detalle = err.response?.data?.error || err.message || 'Error desconocido'
      setMensaje({ tipo: 'error', texto: `✗ Error al guardar: ${detalle}` })
    } finally {
      setGuardando(false)
    }
  }

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div
      style={{
        maxWidth: 980,
        margin: '0 auto',
        padding: '20px 16px 60px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: COLOR.verdeBg,
        minHeight: '100vh',
      }}
    >
      {/* Encabezado de la página */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <button
            onClick={onVolver}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: COLOR.verde,
              fontSize: 22,
              lineHeight: 1,
              padding: 0,
            }}
            title="Volver al dashboard"
          >
            ←
          </button>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: COLOR.verde,
              }}
            >
              Recepción de Calidad
            </h1>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              JJ SeaFoods — Control de Calidad en recepción de materia prima
            </div>
          </div>
        </div>
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${COLOR.verde}, ${COLOR.verdeMain})`,
            borderRadius: 2,
            marginTop: 10,
          }}
        />
      </div>

      {/* Selector de tipo */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: '16px',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Seleccione el tipo de producto a recepcionar
        </div>
        <SelectorTipo tipo={tipo} onChange={handleCambiarTipo} />
      </div>

      {/* Banner de resultado (éxito o error) */}
      {mensaje && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 13,
            fontWeight: 600,
            background: mensaje.tipo === 'ok' ? COLOR.verdeBg   : COLOR.rojoBg,
            border:     `1px solid ${mensaje.tipo === 'ok' ? COLOR.verdeMain : COLOR.rojo}`,
            color:      mensaje.tipo === 'ok' ? COLOR.verde      : COLOR.rojo,
          }}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Formulario según tipo seleccionado */}
      {tipo === 'camaron' ? (
        <FormCamaron
          onVolver={onVolver}
          onGuardar={handleGuardar}
          onRegisterGetDatos={(fn) => { getFormDataRef.current = fn }}
        />
      ) : (
        <FormPescado
          onVolver={onVolver}
          onGuardar={handleGuardar}
          onRegisterGetDatos={(fn) => { getFormDataRef.current = fn }}
        />
      )}

      {/* Footer fijo con botones de acción */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          zIndex: 100,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.07)',
        }}
      >
        <button
          onClick={onVolver}
          style={{
            padding: '9px 20px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#374151',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleImprimir}
          style={{
            padding: '9px 20px',
            borderRadius: 8,
            border: `1.5px solid ${COLOR.verde}`,
            background: COLOR.verdeBg,
            color: COLOR.verde,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🖨 Imprimir
        </button>
        <button
          onClick={handleGuardar}
          style={{
            padding: '9px 24px',
            borderRadius: 8,
            border: 'none',
            background: COLOR.verde,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 2px 8px ${COLOR.verde}55`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {guardando ? '⏳ Guardando...' : '✓ Guardar registro'}
        </button>
      </div>
    </div>
  )
}
