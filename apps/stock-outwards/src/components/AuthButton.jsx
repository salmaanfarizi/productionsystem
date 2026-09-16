import React, { useState, useEffect } from 'react';

export default function AuthButton({ authHelper, isAuthenticated, onAuthSuccess, onAuthRevoke }) {
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Google tokens expire after an hour - keep the button in sync so the user
  // can reconnect without signing out (which would clear the form they're on)
  useEffect(() => {
    if (!authHelper) return undefined;

    const refresh = () => setTokenValid(authHelper.hasValidToken());
    refresh();
    const unsubscribe = authHelper.onChange(refresh);
    const intervalId = setInterval(refresh, 30 * 1000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [authHelper]);

  const handleSignIn = async () => {
    if (!authHelper) return;

    setLoading(true);
    try {
      await authHelper.requestAccessToken();
      onAuthSuccess();
    } catch (error) {
      console.error('Auth error:', error);
      alert(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      onAuthRevoke();
    }
  };

  if (!authHelper) {
    return (
      <button
        disabled
        className="btn bg-gray-300 text-gray-600 cursor-not-allowed flex items-center space-x-2"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span>Loading sign-in...</span>
      </button>
    );
  }

  if (isAuthenticated && tokenValid) {
    return (
      <button
        onClick={handleSignOut}
        className="btn btn-secondary flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Sign Out</span>
      </button>
    );
  }

  const expired = isAuthenticated && !tokenValid;

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className={`btn flex items-center space-x-2 ${expired ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'btn-primary'}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
      <span>{loading ? 'Signing in...' : expired ? 'Reconnect Google' : 'Sign In with Google'}</span>
    </button>
  );
}
