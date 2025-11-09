import React from 'react';

export default function SummaryCards({ cards }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`card ${card.bgClass || 'bg-gradient-to-br from-blue-50 to-blue-100'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${card.labelClass || 'text-gray-600'}`}>
                {card.label}
              </p>
              <p className={`text-3xl font-bold ${card.valueClass || 'text-blue-700'}`}>
                {card.value}
              </p>
              {card.subtitle && (
                <p className={`text-xs mt-1 ${card.subtitleClass || 'text-gray-500'}`}>
                  {card.subtitle}
                </p>
              )}
            </div>
            {card.icon && (
              <div className={`rounded-full p-3 ${card.iconBgClass || 'bg-blue-200 bg-opacity-30'}`}>
                {card.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
