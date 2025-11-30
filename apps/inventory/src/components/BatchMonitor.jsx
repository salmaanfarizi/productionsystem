import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

export default function BatchMonitor({ refreshTrigger }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE');

  useEffect(() => {
    loadBatches();
  }, [refreshTrigger, filter]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('WIP Inventory');
      const parsed = parseSheetData(rawData);

      const filtered = parsed
        .filter(b => !filter || b['Status'] === filter)
        .sort((a, b) => new Date(a['Date']) - new Date(b['Date'])); // FIFO

      setBatches(filtered);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Batch Queue (FIFO)</h3>
        <button
          onClick={loadBatches}
          className="text-purple-600 hover:text-purple-800"
          title="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-gray-200">
        {['ACTIVE', 'COMPLETE', 'ALL'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status === 'ALL' ? '' : status)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              filter === (status === 'ALL' ? '' : status)
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Batch List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No batches found</p>
          </div>
        ) : (
          batches.map((batch, idx) => {
            const remaining = parseFloat(batch['Remaining (T)']) || 0;
            const initial = parseFloat(batch['Initial WIP (T)']) || 0;
            // Calculate consumed as Initial - Remaining (more reliable than reading from sheet)
            const consumed = Math.max(0, initial - remaining);
            const consumedPercentage = initial > 0 ? (consumed / initial) * 100 : 0;
            const remainingPercentage = initial > 0 ? (remaining / initial) * 100 : 0;

            return (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{batch['WIP Batch ID']}</p>
                    <p className="text-sm text-gray-600">
                      {batch['Product Type']} - {batch['Size Range']}
                      {batch['Variant/Region'] && batch['Variant/Region'] !== 'N/A' && ` (${batch['Variant/Region']})`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(batch['Date']).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge ${
                    batch['Status'] === 'ACTIVE'
                      ? 'badge-active'
                      : 'badge-complete'
                  }`}>
                    {batch['Status']}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className={`font-bold ${
                      remaining > 1 ? 'text-green-600' :
                      remaining > 0.1 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {remaining.toFixed(3)}T
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Initial:</span>
                    <span className="text-gray-700">{initial.toFixed(3)}T</span>
                  </div>
                </div>

                {/* Progress Bar - shows consumed amount */}
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, consumedPercentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{consumedPercentage.toFixed(1)}% consumed</span>
                    <span>{remainingPercentage.toFixed(1)}% remaining</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
