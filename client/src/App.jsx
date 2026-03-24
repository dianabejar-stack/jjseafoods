/**
 * App.jsx
 * Componente raíz de la aplicación JJ SeaFoods
 * Gestiona la navegación entre las distintas vistas del sistema
 */

import { useState } from 'react'

// Vistas originales (prototipo inicial)
import Dashboard from './pages/Dashboard'
import RecepcionForm from './pages/RecepcionForm'

// Vistas nuevas (versión con filtros y formularios de calidad detallados)
import DashboardFiltrado from './pages/DashboardFiltrado'
import RecepcionCalidad from './pages/RecepcionCalidad'

// ─── Opciones de navegación ────────────────────────────────────────────────
// Cada entrada define el id de la vista, el texto del botón y si es "nuevo"
const NAV_ITEMS = [
  { id: 'dashboard-v2',     label: 'Dashboard',       nuevo: false },
  { id: 'recepcion-calidad', label: 'Nueva Recepción', nuevo: false },
  { id: 'dashboard-v1',     label: 'Dashboard v1',    nuevo: false },
  { id: 'recepcion-v1',     label: 'Recepción v1',    nuevo: false },
]

function App() {
  // Vista activa: empieza en el dashboard filtrado (nueva versión)
  const [vista, setVista] = useState('dashboard-v2')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Barra de navegación superior ──────────────────────────── */}
      <header className="bg-[#1F7A63] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">

          {/* Logo + nombre */}
          <div className="flex items-center gap-3">
            {/* Logo: coloca logo.png en client/public/ para mostrarlo */}
            <img
              src="/logo.png"
              alt="JJ SeaFoods"
              className="w-12 h-12 object-contain rounded-full bg-white p-0.5"
              onError={(e) => {
                // Si no existe la imagen, muestra el texto "JJ"
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling.style.display = 'flex'
              }}
            />
            {/* Fallback de logo (visible solo si la imagen falla) */}
            <div
              className="w-12 h-12 bg-white rounded-full items-center justify-center hidden"
              aria-hidden="true"
            >
              <span className="text-[#1F7A63] font-bold text-sm">JJ</span>
            </div>

            <div>
              <h1 className="text-xl font-bold leading-tight">JJ SeaFoods</h1>
              <p className="text-xs text-green-200">Sistema de Trazabilidad</p>
            </div>
          </div>

          {/* Botones de navegación */}
          <nav className="flex flex-wrap gap-2">
            {NAV_ITEMS.map(({ id, label, nuevo }) => (
              <button
                key={id}
                onClick={() => setVista(id)}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  vista === id
                    ? 'bg-white text-[#1F7A63]'
                    : 'text-white hover:bg-[#2a9478]'
                }`}
              >
                {label}
                {/* Indicador "Nuevo" en versiones actualizadas */}
                {nuevo && (
                  <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1 rounded-full leading-tight">
                    NEW
                  </span>
                )}
              </button>
            ))}
          </nav>

        </div>
      </header>

      {/* ── Contenido principal ────────────────────────────────────── */}
      <main>
        {vista === 'dashboard-v2' && (
          <DashboardFiltrado onNavigate={setVista} />
        )}

        {vista === 'recepcion-calidad' && (
          <RecepcionCalidad onVolver={() => setVista('dashboard-v2')} />
        )}

        {/* Vistas originales (prototipo inicial) */}
        {vista === 'dashboard-v1' && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Dashboard />
          </div>
        )}

        {vista === 'recepcion-v1' && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <RecepcionForm onGuardado={() => setVista('dashboard-v1')} />
          </div>
        )}
      </main>

    </div>
  )
}

export default App
