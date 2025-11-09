import React from 'react';

export default function MovementCard({
  title,
  icon,
  type, // 'in' or 'out'
  data,
  loading,
  emptyMessage = "No movements recorded"
}) {
  const getCardStyle = (type) => {
    if (type === 'in') {
      return {
        border: 'border-green-200',
        bg: 'bg-green-50',
        header: 'bg-green-100',
        icon: 'text-green-600',
        badge: 'bg-green-600'
      };
    } else if (type === 'out') {
      return {
        border: 'border-red-200',
        bg: 'bg-red-50',
        header: 'bg-red-100',
        icon: 'text-red-600',
        badge: 'bg-red-600'
      };
    }
    return {
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      header: 'bg-gray-100',
      icon: 'text-gray-600',
      badge: 'bg-gray-600'
    };
  };

  const style = getCardStyle(type);

  if (loading) {
    return (
      <div className={`border ${style.border} rounded-lg p-4`}>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border ${style.border} rounded-lg overflow-hidden`}>
      {/* Header */}
      <div className={`${style.header} px-4 py-3 flex items-center space-x-2`}>
        {icon && <span className={`text-xl ${style.icon}`}>{icon}</span>}
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>

      {/* Content */}
      <div className={`${style.bg} p-4`}>
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name || item.product}</p>
                    {item.description && (
                      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    )}
                    {item.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-bold ${type === 'in' ? 'text-green-700' : 'text-red-700'}`}>
                      {type === 'in' ? '+' : '-'}{item.quantity || item.amount}
                    </p>
                    {item.unit && (
                      <p className="text-xs text-gray-500">{item.unit}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
