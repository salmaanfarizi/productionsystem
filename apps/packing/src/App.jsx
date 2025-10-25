import React, { useState, useEffect } from 'react';
import PackingFormNew from './components/PackingFormNew';
import DailySummary from './components/DailySummary';
import AuthButton from './components/AuthButton';
import LowStockAlert from './components/LowStockAlert';
import { GoogleAuthHelper } from '@shared/utils/sheetsAPI';

function App() {
  const [authHelper, setAuthHelper] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('packing'); // 'packing' or 'summary'
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [configError, setConfigError] = useState(null);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);

  useEffect(() => {
    // Initialize Google Auth
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

  const handlePackingSuccess = () => {
    // Trigger refresh of batch display
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📦 Packing Department
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Daily Packaging Data Entry System
              </p>
            </div>
            <AuthButton
              authHelper={authHelper}
              isAuthenticated={isAuthenticated}
              onAuthSuccess={handleAuthSuccess}
              onAuthRevoke={handleAuthRevoke}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {configError ? (
          <div className="card text-center py-12 bg-red-50 border border-red-200">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-red-900 mb-2">
              Configuration Error
            </h2>
            <p className="text-red-700 mb-4 font-medium">
              {configError}
            </p>
            <div className="text-sm text-red-600 bg-red-100 p-4 rounded-lg max-w-2xl mx-auto">
              <p className="font-semibold mb-2">To fix this:</p>
              <ol className="text-left space-y-2">
                <li>1. Create a <code className="bg-red-200 px-1 rounded">.env</code> file in <code className="bg-red-200 px-1 rounded">apps/packing/</code></li>
                <li>2. Copy from <code className="bg-red-200 px-1 rounded">.env.example</code></li>
                <li>3. Add your Google Cloud credentials</li>
                <li>4. Restart the development server</li>
              </ol>
              <p className="mt-3 text-xs">See the README.md for detailed setup instructions.</p>
            </div>
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
              Please sign in with your Google account to access the packing system
            </p>
            <div className="text-sm text-gray-500">
              <p>You need permission to:</p>
              <ul className="mt-2 space-y-1">
                <li>✓ Read production data</li>
                <li>✓ Record packaging entries</li>
                <li>✓ Update batch information</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('packing')}
                  className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                    activeTab === 'packing'
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📦 Packing Entry
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                    activeTab === 'summary'
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📄 Daily Summary
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'packing' ? (
              <div className="max-w-4xl mx-auto">
                <PackingFormNew
                  authHelper={authHelper}
                  onSuccess={handlePackingSuccess}
                />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <DailySummary authHelper={authHelper} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Packing Department System v1.0 | Real-time Google Sheets Integration
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
