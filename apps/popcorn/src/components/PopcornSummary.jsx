import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

export default function PopcornSummary({ refreshTrigger, fullView = false }) {
  const [todayData, setTodayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBatches: 0,
    totalRawKg: 0,
    totalOutputKg: 0,
    totalPouches: 0,
    avgLoss: 0
  });

  useEffect(() => {
    loadTodayData();
  }, [refreshTrigger]);

  const loadTodayData = async () => {
    try {
      setLoading(true);
      const rawData = await readSheetData('Popcorn Production', 'A1:U1000');
      if (!rawData || rawData.length <= 1) {
        setTodayData([]);
        setSummary({
          totalBatches: 0,
          totalRawKg: 0,
          totalOutputKg: 0,
          totalPouches: 0,
          avgLoss: 0
        });
        return;
      }

      const data = parseSheetData(rawData);
      const today = new Date().toISOString().split('T')[0];

      // Filter today's data
      const todayEntries = data.filter(row => row['Date'] === today);
      setTodayData(todayEntries);

      // Calculate summary
      let totalRawKg = 0;
      let totalOutputKg = 0;
      let totalPouches = 0;
      let totalLoss = 0;

      todayEntries.forEach(entry => {
        totalRawKg += parseFloat(entry['Raw Weight (kg)']) || 0;
        totalOutputKg += parseFloat(entry['Output Weight (kg)']) || 0;
        totalPouches += parseInt(entry['Total Pouches']) || 0;
        totalLoss += parseFloat(entry['Loss %']) || 0;
      });

      const avgLoss = todayEntries.length > 0 ? totalLoss / todayEntries.length : 0;

      setSummary({
        totalBatches: todayEntries.length,
        totalRawKg,
        totalOutputKg,
        totalPouches,
        avgLoss
      });

    } catch (error) {
      console.error('Error loading popcorn data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="heading-lg mb-4 text-gray-900">
        📊 Today's Production Summary
      </h3>

      {/* Summary Cards */}
      <div className={`grid ${fullView ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2'} gap-4 mb-6`}>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <p className="text-xs text-yellow-800">Batches</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.totalBatches}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <p className="text-xs text-orange-800">Raw Input</p>
          <p className="text-2xl font-bold text-orange-600">{summary.totalRawKg.toFixed(1)} kg</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-xs text-green-800">Total Pouches</p>
          <p className="text-2xl font-bold text-green-600">{summary.totalPouches.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-xs text-blue-800">Output Weight</p>
          <p className="text-2xl font-bold text-blue-600">{summary.totalOutputKg.toFixed(1)} kg</p>
        </div>
        {fullView && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-xs text-gray-800">Avg Loss</p>
            <p className={`text-2xl font-bold ${summary.avgLoss > 10 ? 'text-red-600' : 'text-gray-600'}`}>
              {summary.avgLoss.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Recent Batches */}
      <h4 className="font-semibold text-gray-800 mb-3">Recent Batches</h4>

      {todayData.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No production recorded today</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {todayData.slice().reverse().slice(0, fullView ? 20 : 5).map((entry, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-yellow-700">{entry['Batch ID']}</p>
                  <p className="text-sm text-gray-600">
                    {entry['Flavor']} • {entry['Package Size']}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{entry['Total Pouches']} pcs</p>
                  <p className="text-xs text-gray-500">{entry['Output Weight (kg)']} kg</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadTodayData}
        className="mt-4 w-full py-2 text-sm text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors border border-yellow-200"
      >
        ↻ Refresh
      </button>
    </div>
  );
}
