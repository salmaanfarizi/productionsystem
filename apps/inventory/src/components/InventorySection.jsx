import React from 'react';

export default function InventorySection({
  title,
  icon,
  type,
  data,
  columns,
  loading,
  summaryCards,
  emptyMessage = "No data available"
}) {
  const getSectionColor = (type) => {
    switch (type) {
      case 'opening':
        return 'from-blue-500 to-blue-600';
      case 'movements':
        return 'from-green-500 to-green-600';
      case 'closing':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className={`bg-gradient-to-r ${getSectionColor(type)} text-white rounded-lg p-4`}>
        <div className="flex items-center space-x-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
      </div>

      {/* Summary Cards if provided */}
      {summaryCards && summaryCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <div
              key={index}
              className={`card ${card.bgClass || 'bg-gradient-to-br from-blue-50 to-blue-100'}`}
            >
              <p className="text-sm text-gray-600">{card.label}</p>
              <p className={`text-3xl font-bold ${card.valueClass || 'text-blue-700'} mt-1`}>
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${
                      col.align === 'right' ? 'text-right' :
                      col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data && data.length > 0 ? (
                data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-4 py-3 whitespace-nowrap text-sm ${
                          col.align === 'right' ? 'text-right' :
                          col.align === 'center' ? 'text-center' : 'text-left'
                        } ${col.className || 'text-gray-700'}`}
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
