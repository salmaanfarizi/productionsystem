import React, { useState, useEffect } from 'react';
import SalesmanInventory from './components/SalesmanInventory';
import StockOutwards from './components/StockOutwards';
import AuthButton from './components/AuthButton';
import { GoogleAuthHelper } from '@shared/utils/sheetsAPI';

function App() {
  const [activeTab, setActiveTab] = useState('outwards');
  const [authHelper, setAuthHelper] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setConfigError('Missing Google Client ID. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
        return;
      }

      try {
        const helper = new GoogleAuthHelper(clientId);
        await helper.initialize();
        setAuthHelper(helper);

        // Check for cached token
        const cachedToken = localStorage.getItem('gapi_access_token');
        const tokenExpires = localStorage.getItem('gapi_token_expires');
        if (cachedToken && tokenExpires && Date.now() < parseInt(tokenExpires)) {
          helper.accessToken = cachedToken;
          setIsAuthenticated(true);
        }
      } catch (error) {
        setConfigError(`Failed to initialize Google Auth: ${error.message}`);
      }
    };

    initAuth();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleAuthRevoke = () => {
    if (authHelper) {
      authHelper.revokeToken();
      setIsAuthenticated(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
            <AuthButton
              authHelper={authHelper}
              isAuthenticated={isAuthenticated}
              onAuthSuccess={handleAuthSuccess}
              onAuthRevoke={handleAuthRevoke}
            />
          </div>

          {/* Tabs */}
          <div className="mt-4 flex space-x-4 border-b">
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
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {configError ? (
          <div className="card text-center py-12 bg-red-50 border border-red-200">
            <h2 className="text-2xl font-semibold text-red-900 mb-2">
              Configuration Error
            </h2>
            <p className="text-red-700 mb-4">{configError}</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="card text-center py-12">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in with your Google account to access Stock Management
            </p>
          </div>
        ) : activeTab === 'salesman' ? (
          <SalesmanInventory />
        ) : (
          <StockOutwards
            refreshTrigger={refreshTrigger}
            authHelper={authHelper}
            onRefresh={handleRefresh}
          />
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
