import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

export default function ProductionSummary({ refreshTrigger }) {
  const [todayProduction, setTodayProduction] = useState([]);
  const [recentBatches, setRecentBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWeight: 0,
    batchesCreated: 0,
    productsProcessed: 0
  });

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Load today's production
      const prodRaw = await readSheetData('Production Data');
      const prodData = parseSheetData(prodRaw);
      const todayProd = prodData.filter(row => {
        const rowDate = row['Date'] || row[Object.keys(row)[0]];
        return rowDate && rowDate.toString().includes(today);
      });
      setTodayProduction(todayProd);

      // Load recent WIP batches
      const batchRaw = await readSheetData('WIP Inventory');
      const batchData = parseSheetData(batchRaw);
      const recent = batchData
        .sort((a, b) => new Date(b['Date']) - new Date(a['Date']))
        .slice(0, 10);
      setRecentBatches(recent);

      // Calculate stats
      const totalWeight = todayProd.reduce((sum, row) => {
        const weight = parseFloat(row['WIP Output (T)'] || row['Raw Material Weight (T)']) || 0;
        return sum + weight;
      }, 0);

      setStats({
        totalWeight,
        batchesCreated: recent.filter(b => {
          const bDate = new Date(b['Date']).toISOString().split('T')[0];
          return bDate === today;
        }).length,
        productsProcessed: todayProd.length
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Today's Summary</h3>
          <button
            onClick={loadData}
            className="text-green-600 hover:text-green-800"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-700">Total Production</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalWeight.toFixed(2)} T
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700">Batches Created</p>
                <p className="text-2xl font-bold text-blue-600">{stats.batchesCreated}</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-700">Entries</p>
                <p className="text-2xl font-bold text-purple-600">{stats.productsProcessed}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Batches */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Batches</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {recentBatches.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No batches yet</p>
          ) : (
            recentBatches.map((batch, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{batch['WIP Batch ID']}</p>
                    <p className="text-sm text-gray-600">
                      {batch['Product Type']} - {batch['Size Range']}
                      {batch['Variant/Region'] && batch['Variant/Region'] !== 'N/A' && ` (${batch['Variant/Region']})`}
                    </p>
                  </div>
                  <span className={`badge ${
                    batch['Status'] === 'ACTIVE' ? 'badge-success' : 'badge-info'
                  }`}>
                    {batch['Status']}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Remaining: {parseFloat(batch['Remaining (T)'] || 0).toFixed(2)}T / {parseFloat(batch['Initial WIP (T)'] || 0).toFixed(2)}T
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
