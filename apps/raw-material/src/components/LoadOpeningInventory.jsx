import React, { useState } from 'react';
import { loadOpeningInventory, OPENING_INVENTORY_ITEMS } from '../utils/loadOpeningInventory';

export default function LoadOpeningInventory({ authHelper }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, item: '' });
  const [results, setResults] = useState(null);

  const handleLoadInventory = async () => {
    if (!authHelper || !authHelper.getAccessToken()) {
      alert('Please authenticate first');
      return;
    }

    if (OPENING_INVENTORY_ITEMS.length === 0) {
      alert('No opening inventory items configured. Please add items to loadOpeningInventory.js');
      return;
    }

    const confirmed = window.confirm(
      `This will load ${OPENING_INVENTORY_ITEMS.length} opening inventory items. Continue?`
    );

    if (!confirmed) return;

    setLoading(true);
    setResults(null);

    try {
      const accessToken = authHelper.getAccessToken();

      const loadResults = await loadOpeningInventory(
        accessToken,
        (current, total, itemName) => {
          setProgress({ current, total, item: itemName });
        }
      );

      setResults(loadResults);

    } catch (error) {
      console.error('Error loading opening inventory:', error);
      alert('Error loading opening inventory: ' + error.message);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, item: '' });
    }
  };

  return (
    <div className="card">
      <h2 className="heading-lg mb-4 text-gray-900">Load Opening Inventory</h2>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Update the OPENING_INVENTORY_ITEMS array in <code className="bg-blue-100 px-1 rounded">loadOpeningInventory.js</code></li>
            <li>Make sure you're authenticated with Google</li>
            <li>Click the button below to load all items</li>
            <li>Wait for the process to complete</li>
          </ol>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Items configured:</strong> {OPENING_INVENTORY_ITEMS.length}
          </p>
        </div>

        {loading && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-900 font-semibold">Loading...</p>
            {progress.total > 0 && (
              <p className="text-sm text-yellow-800 mt-2">
                Processing {progress.current} of {progress.total}: {progress.item}
              </p>
            )}
            <div className="mt-2 w-full bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-2">
            {results.success.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-green-900">
                  ✓ Successfully loaded {results.success.length} items
                </p>
                <ul className="mt-2 text-sm text-green-800 list-disc list-inside">
                  {results.success.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.failed.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-red-900">
                  ✗ Failed to load {results.failed.length} items
                </p>
                <ul className="mt-2 text-sm text-red-800 space-y-1">
                  {results.failed.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.material}</strong>: {item.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleLoadInventory}
          disabled={loading || OPENING_INVENTORY_ITEMS.length === 0}
          className={`w-full btn btn-primary py-3 text-lg font-semibold ${
            loading || OPENING_INVENTORY_ITEMS.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Loading...' : `Load ${OPENING_INVENTORY_ITEMS.length} Opening Inventory Items`}
        </button>
      </div>
    </div>
  );
}
