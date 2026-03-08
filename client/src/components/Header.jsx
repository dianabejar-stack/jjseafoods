export default function Header() {
  return (
    <header className="bg-[#1F7A63] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
          <span className="text-[#1F7A63] font-bold text-sm">JJ</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">JJ SeaFoods</h1>
          <p className="text-sm text-green-200">Recepción de Productos Pesqueros</p>
        </div>
      </div>
    </header>
  )
}
