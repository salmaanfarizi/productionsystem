import React, { useState } from 'react';
import SalesmanInventory from './components/SalesmanInventory';
import StockOutwards from './components/StockOutwards';
import AuthButton from './components/AuthButton';

function App() {
  const [activeTab, setActiveTab] = useState('salesman');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📦 Stock Management System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Salesman Inventory & Stock Outwards Tracking
              </p>
            </div>
            <AuthButton />
          </div>

          {/* Tabs */}
          <div className="mt-4 flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('salesman')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-200 border-b-2 ${
                activeTab === 'salesman'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              🚚 Salesman Inventory
            </button>
            <button
              onClick={() => setActiveTab('outwards')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-200 border-b-2 ${
                activeTab === 'outwards'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              📊 Stock Outwards
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'salesman' ? (
          <SalesmanInventory />
        ) : (
          <StockOutwards refreshTrigger={0} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            ARS Production System - Stock Management © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
