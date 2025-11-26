import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

export default function PaymentTracking() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('route'); // route, salesman, or date

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('Cash Collection');
      const parsed = parseSheetData(rawData);
      setCollections(parsed);
    } catch (error) {
      console.error('Error loading data:', error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedData = () => {
    const groups = {};

    collections.forEach(item => {
      let key;
      if (groupBy === 'route') {
        key = item['Route'] || 'Unknown';
      } else if (groupBy === 'salesman') {
        key = item['Salesman Name'] || 'Unknown';
      } else {
        key = item['Date'] || 'Unknown';
      }

      if (!groups[key]) {
        groups[key] = {
          items: [],
          totalAmount: 0,
          cashAmount: 0,
          transferAmount: 0,
          checkAmount: 0,
          cardAmount: 0,
          pending: 0,
          reconciled: 0
        };
      }

      groups[key].items.push(item);
      const amount = parseFloat(item['Amount']) || 0;
      groups[key].totalAmount += amount;

      // By payment method
      const method = item['Payment Method'];
      if (method === 'cash') groups[key].cashAmount += amount;
      else if (method === 'bank_transfer') groups[key].transferAmount += amount;
      else if (method === 'check') groups[key].checkAmount += amount;
      else if (method === 'card') groups[key].cardAmount += amount;

      // By status
      const status = item['Status'] || 'pending';
      if (status === 'pending') groups[key].pending++;
      else if (status === 'reconciled') groups[key].reconciled++;
    });

    return groups;
  };

  const groups = groupedData();
  const sortedKeys = Object.keys(groups).sort();

  // Overall summary
  const overallSummary = {
    totalCollections: collections.length,
    totalAmount: collections.reduce((sum, item) => sum + (parseFloat(item['Amount']) || 0), 0),
    totalPending: collections.filter(item => (item['Status'] || 'pending') === 'pending').length,
    totalReconciled: collections.filter(item => item['Status'] === 'reconciled').length
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100">
          <p className="text-sm text-gray-600">Total Collections</p>
          <p className="text-3xl font-bold text-indigo-700">{overallSummary.totalCollections}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-3xl font-bold text-green-700">SAR {overallSummary.totalAmount.toFixed(2)}</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-yellow-700">{overallSummary.totalPending}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-gray-600">Reconciled</p>
          <p className="text-3xl font-bold text-purple-700">{overallSummary.totalReconciled}</p>
        </div>
      </div>

      {/* Group By Controls */}
      <div className="card">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Payment Tracking</h3>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Group by:</label>
            <select
              className="input w-auto"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="route">Route</option>
              <option value="salesman">Salesman</option>
              <option value="date">Date</option>
            </select>
            <button
              onClick={loadData}
              className="btn btn-secondary text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Cards */}
      <div className="grid grid-cols-1 gap-4">
        {sortedKeys.map(key => {
          const group = groups[key];
          return (
            <div key={key} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{key}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {group.items.length} collection{group.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    SAR {group.totalAmount.toFixed(2)}
                  </p>
                  <div className="flex space-x-2 mt-1">
                    {group.pending > 0 && (
                      <span className="badge badge-warning">{group.pending} pending</span>
                    )}
                    {group.reconciled > 0 && (
                      <span className="badge badge-success">{group.reconciled} reconciled</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-xl mb-1">💵</div>
                  <div className="text-xs text-gray-600">Cash</div>
                  <div className="text-sm font-semibold text-gray-900">
                    SAR {group.cashAmount.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-1">🏦</div>
                  <div className="text-xs text-gray-600">Transfer</div>
                  <div className="text-sm font-semibold text-gray-900">
                    SAR {group.transferAmount.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-1">📝</div>
                  <div className="text-xs text-gray-600">Check</div>
                  <div className="text-sm font-semibold text-gray-900">
                    SAR {group.checkAmount.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-1">💳</div>
                  <div className="text-xs text-gray-600">Card</div>
                  <div className="text-sm font-semibold text-gray-900">
                    SAR {group.cardAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedKeys.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg text-gray-600">No payment data available</p>
        </div>
      )}
    </div>
  );
}
