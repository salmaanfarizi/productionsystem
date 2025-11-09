import React, { useState } from 'react';
import { loadFinishedGoodsOpeningInventory, FINISHED_GOODS_OPENING_INVENTORY } from '../utils/loadFinishedGoodsOpeningInventory';

export default function SetupPanel({ authHelper, isAuthenticated }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, item: '' });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleLoadOpeningInventory = async () => {
    if (!isAuthenticated || !authHelper?.accessToken) {
      setError('Please authenticate first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const loadResults = await loadFinishedGoodsOpeningInventory(
        authHelper.accessToken,
        (current, total, productName) => {
          setProgress({ current, total, item: productName });
        }
      );

      setResults(loadResults);
    } catch (err) {
      console.error('Error loading finished goods opening inventory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, item: '' });
    }
  };

  return (
    <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Setup & Admin</h2>
          <p className="text-sm text-gray-600">One-time setup and data loading</p>
        </div>
      </div>

      {/* Opening Inventory Section */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Load Finished Goods Opening Inventory</h3>
        <p className="text-sm text-gray-600 mb-4">
          Load {FINISHED_GOODS_OPENING_INVENTORY.length} finished goods SKUs into the system.
          Includes sunflower, melon, pumpkin seeds, popcorn, and nuts across all regions.
        </p>

        <button
          onClick={handleLoadOpeningInventory}
          disabled={loading || !isAuthenticated}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Load Finished Goods Inventory
            </span>
          )}
        </button>

        {!isAuthenticated && (
          <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Please authenticate to use this feature
          </p>
        )}
      </div>

      {/* Progress Indicator */}
      {loading && progress.total > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Loading... {progress.current} / {progress.total}
            </span>
            <span className="text-sm text-blue-700">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-blue-700 truncate">{progress.item}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900">Loading Complete</h4>
              <div className="mt-2 space-y-2">
                {results.success.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">New items created:</span>
                    <span className="font-semibold text-green-900">{results.success.length} SKUs</span>
                  </div>
                )}
                {results.updated && results.updated.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Existing items updated:</span>
                    <span className="font-semibold text-blue-900">{results.updated.length} SKUs</span>
                  </div>
                )}
                {results.failed.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Failed:</span>
                    <span className="font-semibold text-red-900">{results.failed.length} SKUs</span>
                  </div>
                )}
              </div>

              {/* Show failed items if any */}
              {results.failed.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                  <p className="text-xs font-semibold text-red-900 mb-1">Failed Items:</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {results.failed.map((fail, idx) => (
                      <li key={idx}>
                        {fail.sku} - {fail.productType}: {fail.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success message */}
              {results.failed.length === 0 && (
                <p className="text-sm text-green-700 mt-2">
                  All items loaded successfully! Check the Finished Goods Inventory sheet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Note:</span> This will load all finished goods opening inventory into the Finished Goods Inventory sheet.
          Existing SKUs will have their quantities updated (added). New SKUs will be created. Run this only once during initial setup.
        </p>
      </div>
    </div>
  );
}
