import React, { useState, useEffect } from 'react';
import FinishedGoodsInventory from './components/FinishedGoodsInventory';
import StockDashboard from './components/StockDashboard';
import BatchMonitor from './components/BatchMonitor';
import ProductBreakdown from './components/ProductBreakdown';
import ClosingInventory from './components/ClosingInventory';
import PendingPackingEntries from './components/PendingPackingEntries';
import { GoogleAuthHelper } from '@shared/utils/sheetsAPI';

function App() {
  const [activeView, setActiveView] = useState('finished'); // 'finished', 'wip', 'raw-material', or 'pending'
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [authHelper, setAuthHelper] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('Missing Google Client ID');
        return;
      }

      try {
        const helper = new GoogleAuthHelper(clientId);
        await helper.initialize();
        setAuthHelper(helper);

        const cachedToken = localStorage.getItem('gapi_access_token');
        const tokenExpires = localStorage.getItem('gapi_token_expires');
        if (cachedToken && tokenExpires && Date.now() < parseInt(tokenExpires)) {
          helper.accessToken = cachedToken;
        }
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
      }
    };

    initAuth();
  }, []);

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
                📊 Inventory Dashboard (Read-Only)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View Opening, Movement & Closing Stock Levels
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
              onClick={() => setActiveView('pending')}
              className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                activeView === 'pending'
                  ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              ⏳ Pending Approval
            </button>
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
              🏭 Work in Progress
            </button>
            <button
              onClick={() => setActiveView('raw-material')}
              className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                activeView === 'raw-material'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📦 Raw Material
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeView === 'pending' ? (
          <PendingPackingEntries authHelper={authHelper} />
        ) : activeView === 'finished' ? (
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
        ) : (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📦 Raw Material Inventory</h2>
              <p className="text-gray-600 mb-6">View opening stock, movement and closing balance for raw materials</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-700 font-medium">
                  Coming Soon: Raw Material inventory tracking with opening, movement, and closing stock levels
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Inventory Dashboard (Read-Only) | For stock outwards management, use the Stock Outwards app
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
