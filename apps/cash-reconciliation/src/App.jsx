import React, { useState } from 'react';
import CashCollection from './components/CashCollection';
import CashReconciliation from './components/CashReconciliation';
import PaymentTracking from './components/PaymentTracking';
import AuthButton from './components/AuthButton';

function App() {
  const [activeTab, setActiveTab] = useState('collection');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                💰 Cash Reconciliation System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Daily Cash Collection & Payment Tracking
              </p>
            </div>
            <AuthButton />
          </div>

          {/* Tabs */}
          <div className="mt-4 flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-200 border-b-2 ${
                activeTab === 'collection'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              💵 Cash Collection
            </button>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-200 border-b-2 ${
                activeTab === 'reconciliation'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              🧾 Reconciliation
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-200 border-b-2 ${
                activeTab === 'payments'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              📊 Payment Tracking
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'collection' && <CashCollection />}
        {activeTab === 'reconciliation' && <CashReconciliation />}
        {activeTab === 'payments' && <PaymentTracking />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            ARS Production System - Cash Reconciliation © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
