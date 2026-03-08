import { useState } from 'react'
import RecepcionForm from './pages/RecepcionForm'
import Dashboard from './pages/Dashboard'

function App() {
  const [vista, setVista] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <header className="bg-[#1F7A63] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#1F7A63] font-bold text-sm">JJ</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">JJ SeaFoods</h1>
              <p className="text-sm text-green-200">Sistema de Trazabilidad</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => setVista('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                vista === 'dashboard'
                  ? 'bg-white text-[#1F7A63]'
                  : 'text-white hover:bg-[#2a9478]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setVista('recepcion')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                vista === 'recepcion'
                  ? 'bg-white text-[#1F7A63]'
                  : 'text-white hover:bg-[#2a9478]'
              }`}
            >
              Nueva Recepción
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {vista === 'dashboard' ? <Dashboard /> : <RecepcionForm onGuardado={() => setVista('dashboard')} />}
      </main>
    </div>
  )
}

export default App
