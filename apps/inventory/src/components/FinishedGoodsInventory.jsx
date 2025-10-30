import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import { PACKING_PRODUCT_TYPES, REGIONS } from '@shared/config/retailProducts';

export default function FinishedGoodsInventory({ refreshTrigger }) {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    productType: 'all',
    region: 'all',
    status: 'all'
  });
  const [summary, setSummary] = useState({
    total: 0,
    ok: 0,
    low: 0,
    critical: 0,
    out: 0
  });

  useEffect(() => {
    loadInventory();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [inventory, filters]);

  const calculateStatus = (currentStock, minimumStock) => {
    const current = parseInt(currentStock) || 0;
    const minimum = parseInt(minimumStock) || 0;

    if (minimum === 0) return 'OK'; // No minimum set
    if (current === 0) return 'OUT';
    if (current < minimum * 0.3) return 'CRITICAL';
    if (current < minimum) return 'LOW';
    return 'OK';
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('Finished Goods Inventory');
      const parsed = parseSheetData(rawData);

      // Calculate status if not present or empty
      const inventoryWithStatus = parsed.map(item => {
        if (!item['Status'] || item['Status'] === '' || item['Status'] === '0') {
          item['Status'] = calculateStatus(item['Current Stock'], item['Minimum Stock']);
        }
        return item;
      });

      setInventory(inventoryWithStatus);

      // Calculate summary
      const stats = {
        total: inventoryWithStatus.length,
        ok: inventoryWithStatus.filter(r => r['Status'] === 'OK').length,
        low: inventoryWithStatus.filter(r => r['Status'] === 'LOW').length,
        critical: inventoryWithStatus.filter(r => r['Status'] === 'CRITICAL').length,
        out: inventoryWithStatus.filter(r => r['Status'] === 'OUT').length
      };
      setSummary(stats);

    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...inventory];

    if (filters.productType !== 'all') {
      filtered = filtered.filter(item => item['Product Type'] === filters.productType);
    }

    if (filters.region !== 'all') {
      filtered = filtered.filter(item => item['Region'] === filters.region);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item['Status'] === filters.status);
    }

    setFilteredInventory(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'OK': 'bg-green-100 text-green-800',
      'LOW': 'bg-yellow-100 text-yellow-800',
      'CRITICAL': 'bg-orange-100 text-orange-800',
      'OUT': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'OK': '✓',
      'LOW': '⚠',
      'CRITICAL': '⚠',
      'OUT': '✕'
    };
    return icons[status] || '?';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-gray-600">Total SKUs</p>
          <p className="text-3xl font-bold text-blue-700">{summary.total}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-gray-600">OK</p>
          <p className="text-3xl font-bold text-green-700">{summary.ok}</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-sm text-gray-600">Low</p>
          <p className="text-3xl font-bold text-yellow-700">{summary.low}</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <p className="text-sm text-gray-600">Critical</p>
          <p className="text-3xl font-bold text-orange-700">{summary.critical}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-3xl font-bold text-red-700">{summary.out}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Product Type</label>
            <select
              className="input"
              value={filters.productType}
              onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
            >
              <option value="all">All Products</option>
              {Object.values(PACKING_PRODUCT_TYPES).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Region</label>
            <select
              className="input"
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            >
              <option value="all">All Regions</option>
              {REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
              <option value="N/A">N/A (Non-regional)</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="OK">OK</option>
              <option value="LOW">Low</option>
              <option value="CRITICAL">Critical</option>
              <option value="OUT">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Finished Goods Inventory ({filteredInventory.length} items)
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Region
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Current
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Minimum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Packaging
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${
                    item['Status'] === 'OUT' ? 'bg-red-25' :
                    item['Status'] === 'CRITICAL' ? 'bg-orange-25' :
                    item['Status'] === 'LOW' ? 'bg-yellow-25' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item['Status'])}`}>
                      {getStatusIcon(item['Status'])} {item['Status']}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item['SKU']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Product Type']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Package Size']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Region'] || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {item['Current Stock']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                    {item['Minimum Stock'] || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {item['Packaging Info']}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items match the selected filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
