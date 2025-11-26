import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

export default function CashReconciliation() {
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    route: 'all',
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [collections, filters]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('Cash Collection');
      const parsed = parseSheetData(rawData);
      // Sort by date descending
      const sorted = parsed.sort((a, b) =>
        new Date(b['Date'] || 0) - new Date(a['Date'] || 0)
      );
      setCollections(sorted);
    } catch (error) {
      console.error('Error loading collections:', error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...collections];

    if (filters.status !== 'all') {
      filtered = filtered.filter(item =>
        (item['Status'] || 'pending') === filters.status
      );
    }

    if (filters.route !== 'all') {
      filtered = filtered.filter(item =>
        item['Route'] === filters.route
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(item =>
        new Date(item['Date']) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(item =>
        new Date(item['Date']) <= new Date(filters.dateTo)
      );
    }

    setFilteredCollections(filtered);
  };

  // Calculate summary
  const summary = {
    total: filteredCollections.length,
    totalAmount: filteredCollections.reduce((sum, item) =>
      sum + (parseFloat(item['Amount']) || 0), 0
    ),
    pending: filteredCollections.filter(item => (item['Status'] || 'pending') === 'pending').length,
    reconciled: filteredCollections.filter(item => item['Status'] === 'reconciled').length,
    byMethod: {}
  };

  ['cash', 'bank_transfer', 'check', 'card'].forEach(method => {
    const items = filteredCollections.filter(item => item['Payment Method'] === method);
    summary.byMethod[method] = {
      count: items.length,
      amount: items.reduce((sum, item) => sum + (parseFloat(item['Amount']) || 0), 0)
    };
  });

  const getStatusBadge = (status) => {
    const s = status || 'pending';
    return s === 'reconciled'
      ? 'badge badge-success'
      : s === 'pending'
      ? 'badge badge-warning'
      : 'badge badge-danger';
  };

  const getStatusLabel = (status) => {
    const s = status || 'pending';
    return s === 'reconciled'
      ? '✅ Reconciled'
      : s === 'pending'
      ? '⏳ Pending'
      : '❌ Disputed';
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
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-gray-600">Total Collections</p>
          <p className="text-3xl font-bold text-blue-700">{summary.total}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-3xl font-bold text-green-700">SAR {summary.totalAmount.toFixed(2)}</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-yellow-700">{summary.pending}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-gray-600">Reconciled</p>
          <p className="text-3xl font-bold text-purple-700">{summary.reconciled}</p>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">By Payment Method</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl mb-1">💵</div>
            <div className="text-xs text-gray-600 mb-1">Cash</div>
            <div className="text-xl font-bold text-gray-900">{summary.byMethod.cash?.count || 0}</div>
            <div className="text-sm text-gray-600">SAR {(summary.byMethod.cash?.amount || 0).toFixed(2)}</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-1">🏦</div>
            <div className="text-xs text-gray-600 mb-1">Bank Transfer</div>
            <div className="text-xl font-bold text-gray-900">{summary.byMethod.bank_transfer?.count || 0}</div>
            <div className="text-sm text-gray-600">SAR {(summary.byMethod.bank_transfer?.amount || 0).toFixed(2)}</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl mb-1">📝</div>
            <div className="text-xs text-gray-600 mb-1">Check</div>
            <div className="text-xl font-bold text-gray-900">{summary.byMethod.check?.count || 0}</div>
            <div className="text-sm text-gray-600">SAR {(summary.byMethod.check?.amount || 0).toFixed(2)}</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-1">💳</div>
            <div className="text-xs text-gray-600 mb-1">Card</div>
            <div className="text-xl font-bold text-gray-900">{summary.byMethod.card?.count || 0}</div>
            <div className="text-sm text-gray-600">SAR {(summary.byMethod.card?.amount || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reconciled">Reconciled</option>
            </select>
          </div>

          <div>
            <label className="label">Route</label>
            <select
              className="input"
              value={filters.route}
              onChange={(e) => setFilters({ ...filters, route: e.target.value })}
            >
              <option value="all">All Routes</option>
              <option value="Al-Hasa 1">Al-Hasa 1</option>
              <option value="Al-Hasa 2">Al-Hasa 2</option>
              <option value="Al-Hasa 3">Al-Hasa 3</option>
              <option value="Al-Hasa 4">Al-Hasa 4</option>
              <option value="Al-Hasa Wholesale">Al-Hasa Wholesale</option>
            </select>
          </div>

          <div>
            <label className="label">Date From</label>
            <input
              type="date"
              className="input"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Date To</label>
            <input
              type="date"
              className="input"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Cash Collections ({filteredCollections.length})
          </h3>
          <button
            onClick={loadCollections}
            className="btn btn-secondary text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollections.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {item['Date']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Route']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Salesman Name']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Payment Method']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                    SAR {parseFloat(item['Amount']).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {item['Reference Number'] || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={getStatusBadge(item['Status'])}>
                      {getStatusLabel(item['Status'])}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCollections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No cash collections found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
