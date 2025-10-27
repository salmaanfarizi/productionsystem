import React, { useState, useEffect } from 'react';
import FinishedGoodsInventory from './components/FinishedGoodsInventory';
import StockDashboard from './components/StockDashboard';
import BatchMonitor from './components/BatchMonitor';
import ProductBreakdown from './components/ProductBreakdown';
import StockOutwards from './components/StockOutwards';
import ClosingInventory from './components/ClosingInventory';

function App() {
  const [activeView, setActiveView] = useState('finished'); // 'finished', 'wip', 'outwards', or 'closing'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📊 Inventory Department
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time Stock Monitoring & Analytics
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="btn btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh All</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveView('finished')}
              className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                activeView === 'finished'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🛍️ Finished Goods
            </button>
            <button
              onClick={() => setActiveView('wip')}
              className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                activeView === 'wip'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🏭 WIP Inventory
            </button>
            <button
              onClick={() => setActiveView('outwards')}
              className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                activeView === 'outwards'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📤 Stock Outwards
            </button>
            <button
              onClick={() => setActiveView('closing')}
              className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                activeView === 'closing'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📋 Closing Inventory
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeView === 'finished' ? (
          <FinishedGoodsInventory refreshTrigger={refreshTrigger} />
        ) : activeView === 'wip' ? (
          <div className="space-y-8">
            {/* Stock Overview Cards */}
            <StockDashboard refreshTrigger={refreshTrigger} />

            {/* Batch Monitor and Product Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BatchMonitor refreshTrigger={refreshTrigger} />
              <ProductBreakdown refreshTrigger={refreshTrigger} />
            </div>
          </div>
        ) : activeView === 'outwards' ? (
          <StockOutwards refreshTrigger={refreshTrigger} />
        ) : (
          <ClosingInventory refreshTrigger={refreshTrigger} />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Inventory Department System v1.0 | Real-time Google Sheets Integration
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
