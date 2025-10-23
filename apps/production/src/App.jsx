import React, { useState, useEffect } from 'react';
import ProductionForm from './components/ProductionForm';
import ProductionSummary from './components/ProductionSummary';
import AuthButton from './components/AuthButton';
import { GoogleAuthHelper } from '@shared/utils/sheetsAPI';

function App() {
  const [authHelper, setAuthHelper] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const initAuth = async () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (clientId) {
        const helper = new GoogleAuthHelper(clientId);
        await helper.initialize();
        setAuthHelper(helper);

        const cachedToken = localStorage.getItem('gapi_access_token');
        const tokenExpires = localStorage.getItem('gapi_token_expires');
        if (cachedToken && tokenExpires && Date.now() < parseInt(tokenExpires)) {
          helper.accessToken = cachedToken;
          setIsAuthenticated(true);
        }
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

  const handleProductionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏭 Production Department
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Daily Production Data Entry & Batch Creation
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
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
              Please sign in with your Google account to access the production system
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ProductionForm
                authHelper={authHelper}
                onSuccess={handleProductionSuccess}
              />
            </div>

            <div className="lg:col-span-1">
              <ProductionSummary
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Production Department System v1.0 | Real-time Google Sheets Integration
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
