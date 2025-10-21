import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import { calculateRemainingWeight } from '@shared/utils/batchGenerator';

export default function BatchDisplay({ refreshTrigger }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE');

  useEffect(() => {
    loadBatches();
  }, [refreshTrigger, filter]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('Batch Master');
      const parsed = parseSheetData(rawData);

      // Convert and filter
      const formattedBatches = parsed
        .map(row => ({
          batchId: row['Batch ID'],
          productionDate: row['Production Date'],
          seedType: row['Seed Type'],
          size: row['Size'],
          variant: row['Production Variant'] || '',
          initialWeight: parseFloat(row['Initial Weight (T)']) || 0,
          consumedWeight: parseFloat(row['Consumed Weight (T)']) || 0,
          remainingWeight: parseFloat(row['Remaining Weight (T)']) || 0,
          status: row['Status'],
          startTime: row['Start Time'],
        }))
        .filter(batch => !filter || batch.status === filter)
        .sort((a, b) => new Date(b.productionDate) - new Date(a.productionDate));

      setBatches(formattedBatches);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card sticky top-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Active Batches</h3>
        <button
          onClick={loadBatches}
          className="text-blue-600 hover:text-blue-800"
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
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Batch List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">Loading batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No batches found</p>
          </div>
        ) : (
          batches.map(batch => (
            <div
              key={batch.batchId}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-gray-900">{batch.batchId}</p>
                  <p className="text-sm text-gray-600">
                    {batch.seedType} - {batch.size}
                  </p>
                  {batch.variant && (
                    <p className="text-xs text-gray-500">{batch.variant}</p>
                  )}
                </div>
                <span
                  className={`badge ${
                    batch.status === 'ACTIVE'
                      ? 'badge-active'
                      : batch.status === 'COMPLETE'
                      ? 'badge-complete'
                      : 'badge-warning'
                  }`}
                >
                  {batch.status}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Initial:</span>
                  <span className="font-medium">{batch.initialWeight.toFixed(3)}T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consumed:</span>
                  <span className="font-medium">{batch.consumedWeight.toFixed(3)}T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className={`font-bold ${
                    batch.remainingWeight > 0.1 ? 'text-green-600' :
                    batch.remainingWeight > 0.01 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {batch.remainingWeight.toFixed(3)}T
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (batch.consumedWeight / batch.initialWeight) * 100)}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {((batch.consumedWeight / batch.initialWeight) * 100).toFixed(1)}% consumed
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
