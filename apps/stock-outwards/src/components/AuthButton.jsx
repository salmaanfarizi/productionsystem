import React, { useState } from 'react';

export default function AuthButton({ authHelper, isAuthenticated, onAuthSuccess, onAuthRevoke }) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!authHelper) {
      alert('Authentication is still initializing. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    try {
      await authHelper.requestAccessToken();
      onAuthSuccess();
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      onAuthRevoke();
    }
  };

  // Show loading state while authHelper is initializing
  if (!authHelper) {
    return (
      <button
        disabled
        className="btn bg-gray-300 text-gray-600 cursor-not-allowed flex items-center space-x-2"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span>Initializing...</span>
      </button>
    );
  }

  return (
    <div>
      {isAuthenticated ? (
        <button
          onClick={handleSignOut}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="btn btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span>{loading ? 'Signing in...' : 'Sign In with Google'}</span>
        </button>
      )}
    </div>
  );
}
