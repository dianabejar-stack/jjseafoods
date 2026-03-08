export default function ProductoRow({ index, producto, onChange, onRemove }) {
  const PESOS = ['peso1','peso2','peso3','peso4','peso5','peso6','peso7','peso8','peso9','peso10']

  const pesoTotal = PESOS.reduce((sum, key) => {
    return sum + (parseFloat(producto[key]) || 0)
  }, 0)

  const descuento = parseFloat(producto.descuento_pct) || 2
  const pesoNeto = pesoTotal * (1 - descuento / 100)

  const handleChange = (field, value) => {
    onChange(index, { ...producto, [field]: value })
  }

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-2 py-2">
        <input
          type="text"
          value={producto.producto || ''}
          onChange={e => handleChange('producto', e.target.value)}
          placeholder="Ej: Tuna YF"
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#3AAE8D]"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={producto.talla || ''}
          onChange={e => handleChange('talla', e.target.value)}
          placeholder="100+"
          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#3AAE8D]"
        />
      </td>
      <td className="px-2 py-2">
        <select
          value={producto.calidad || ''}
          onChange={e => handleChange('calidad', e.target.value)}
          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#3AAE8D]"
        >
          <option value="">-</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="1+">1+</option>
          <option value="1-">1-</option>
        </select>
      </td>
      {PESOS.map(key => (
        <td key={key} className="px-1 py-2">
          <input
            type="number"
            value={producto[key] || ''}
            onChange={e => handleChange(key, e.target.value)}
            placeholder="-"
            className="w-16 border border-gray-300 rounded px-1 py-1 text-sm text-right focus:outline-none focus:border-[#3AAE8D]"
          />
        </td>
      ))}
      <td className="px-2 py-2 text-right font-semibold text-gray-700">
        {pesoTotal > 0 ? pesoTotal.toFixed(0) : '-'}
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          value={producto.descuento_pct || 2}
          onChange={e => handleChange('descuento_pct', e.target.value)}
          className="w-14 border border-gray-300 rounded px-1 py-1 text-sm text-right focus:outline-none focus:border-[#3AAE8D]"
        />
      </td>
      <td className="px-2 py-2 text-right font-semibold text-[#1F7A63]">
        {pesoNeto > 0 ? pesoNeto.toFixed(0) : '-'}
      </td>
      <td className="px-2 py-2 text-center">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-600 font-bold text-lg"
        >
          ×
        </button>
      </td>
    </tr>
  )
}
