import React, { useState, useEffect } from 'react';
import ProductionForm from './components/ProductionForm';
import ProductionSummary from './components/ProductionSummary';
import AuthButton from './components/AuthButton';
import { GoogleAuthHelper } from '@shared/utils/sheetsAPI';

function App() {
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

  const handleProductionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="heading-xl text-gray-900">
                🏭 Production Department
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
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

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 md:py-8">
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
                <li>1. Create a <code className="bg-red-200 px-1 rounded">.env</code> file in <code className="bg-red-200 px-1 rounded">apps/production/</code></li>
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
