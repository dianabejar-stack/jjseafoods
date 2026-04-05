/**
 * App.jsx
 * Componente raíz — gestiona autenticación y navegación por permisos.
 * El navbar muestra solo las vistas a las que el usuario tiene acceso.
 */
import { useState } from 'react'
import { useAuth, AuthProvider } from './context/AuthContext'

import LoginPage           from './pages/LoginPage'
import DashboardFiltrado   from './pages/DashboardFiltrado'
import RecepcionCalidad    from './pages/RecepcionCalidad'
import AprobacionesPage    from './pages/AprobacionesPage'
import AdminUsuarios       from './pages/AdminUsuarios'
import RecepcionesPage     from './pages/RecepcionesPage'
import MantenimientosPage  from './pages/MantenimientosPage'

// ── Vistas disponibles en el navbar ──────────────────────────────────────────
// permiso: código requerido para que el botón aparezca
const VISTAS = [
  { id: 'recepciones',  label: 'Recepciones',     permiso: 'vista_recepciones'    },
  { id: 'dashboard',    label: 'Dashboard',        permiso: 'vista_dashboard'      },
  { id: 'registro',     label: 'Nueva Recepción',  permiso: 'vista_registro'       },
  { id: 'revisiones',   label: 'Revisiones',       permiso: 'vista_aprobacion'     },
  { id: 'mantenimientos', label: 'Mantenimientos', permiso: 'vista_mantenimientos' },
  { id: 'admin',        label: 'Usuarios',         permiso: 'vista_admin'          },
]

// ── Layout principal (usuario autenticado) ────────────────────────────────────
function AppLayout() {
  const { usuario, logout, tiene } = useAuth()

  // Primera vista accesible como estado inicial
  const vistaInicial = VISTAS.find(v => tiene(v.permiso))?.id ?? 'dashboard'
  const [vista, setVista] = useState(vistaInicial)

  const navItems = VISTAS.filter(v => tiene(v.permiso))

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header className="bg-[#1F7A63] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">

          {/* Logo + nombre */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="JJ SeaFoods"
              className="w-12 h-12 object-contain rounded-full bg-white p-0.5"
              onError={e => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling.style.display = 'flex'
              }}
            />
            <div className="w-12 h-12 bg-white rounded-full items-center justify-center hidden" aria-hidden>
              <span className="text-[#1F7A63] font-bold text-sm">JJ</span>
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">JJ SeaFoods</h1>
              <p className="text-xs text-green-200">Sistema de Trazabilidad</p>
            </div>
          </div>

          {/* Botones de navegación + usuario */}
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {navItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setVista(id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition
                    ${vista === id
                      ? 'bg-white text-[#1F7A63]'
                      : 'text-white hover:bg-[#2a9478]'}`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Info usuario + cerrar sesión */}
            <div className="flex items-center gap-2 ml-2 border-l border-green-600 pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium">{usuario.nombre}</p>
                <p className="text-xs text-green-300">{usuario.rol}</p>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="text-xs text-green-200 hover:text-white transition px-2 py-1 rounded hover:bg-[#2a9478]"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenido principal ─────────────────────────────────────── */}
      <main>
        {vista === 'recepciones'    && <RecepcionesPage />}
        {vista === 'dashboard'      && <DashboardFiltrado onNavigate={setVista} />}
        {vista === 'registro'       && <RecepcionCalidad  onVolver={() => setVista('dashboard')} />}
        {vista === 'revisiones'     && <AprobacionesPage />}
        {vista === 'mantenimientos' && <MantenimientosPage />}
        {vista === 'admin'          && <AdminUsuarios />}
      </main>
    </div>
  )
}

// ── Raíz: decide si mostrar login o app ───────────────────────────────────────
function Root() {
  const { usuario } = useAuth()
  return usuario ? <AppLayout /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}
