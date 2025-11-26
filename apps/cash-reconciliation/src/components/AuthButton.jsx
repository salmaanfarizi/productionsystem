import React from 'react';
import { GoogleAuthHelper } from '@shared/utils/sheetsAPI';

export default function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const authHelper = GoogleAuthHelper.getInstance();
    setIsAuthenticated(authHelper.hasValidToken());
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    try {
      const authHelper = GoogleAuthHelper.getInstance();
      const success = await authHelper.authenticate();
      setIsAuthenticated(success);
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    const authHelper = GoogleAuthHelper.getInstance();
    authHelper.signOut();
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Authenticated
        </span>
        <button
          onClick={handleSignOut}
          className="btn btn-secondary text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAuth}
      disabled={loading}
      className="btn btn-primary"
    >
      {loading ? '⏳ Authenticating...' : '🔐 Sign in with Google'}
    </button>
  );
}
