import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

export default function RawMaterialInventory({ refreshTrigger }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'low'

  useEffect(() => {
    loadInventory();
  }, [refreshTrigger]);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawData = await readSheetData('Raw Material Inventory', 'A1:N1000');
      const parsed = parseSheetData(rawData);

      // Map the data with helper function to handle different column names
      const mappedInventory = parsed.map(item => {
        const keys = Object.keys(item);
        return {
          date: item['Date'] || item['date'] || (keys[0] ? item[keys[0]] : ''),
          material: item['Material'] || item['Item'] || item['Raw Material'] || item['material'] || (keys[1] ? item[keys[1]] : ''),
          category: item['Category'] || item['category'] || (keys[2] ? item[keys[2]] : ''),
          unit: item['Unit'] || item['UOM'] || item['unit'] || (keys[3] ? item[keys[3]] : 'KG'),
          quantity: parseFloat(item['Quantity'] || item['Qty'] || item['Stock'] || (keys[4] ? item[keys[4]] : '0')) || 0,
          supplier: item['Supplier'] || item['supplier'] || (keys[5] ? item[keys[5]] : ''),
          batchNumber: item['Batch Number'] || item['Batch'] || (keys[6] ? item[keys[6]] : ''),
          expiryDate: item['Expiry Date'] || item['Expiry'] || (keys[7] ? item[keys[7]] : ''),
          unitPrice: parseFloat(item['Unit Price'] || item['Price'] || (keys[8] ? item[keys[8]] : '0')) || 0,
          totalCost: parseFloat(item['Total Cost'] || item['Total'] || (keys[9] ? item[keys[9]] : '0')) || 0,
          status: (item['Status'] || item['status'] || (keys[10] ? item[keys[10]] : 'ACTIVE')).toUpperCase(),
          timestamp: item['Timestamp'] || item['timestamp'] || (keys[11] ? item[keys[11]] : ''),
          notes: item['Notes'] || item['notes'] || (keys[12] ? item[keys[12]] : ''),
          rawItem: item // Keep original for debugging
        };
      }).filter(item => item.material); // Filter out empty rows

      setInventory(mappedInventory);
    } catch (err) {
      console.error('Error loading raw material inventory:', err);
      if (err.message.includes('404') || err.message.includes('400')) {
        setError('Sheet "Raw Material Inventory" not found. Please create this sheet in your Google Spreadsheet.');
      } else if (err.message.includes('403')) {
        setError('Permission denied. Please check that the spreadsheet is shared or the API key has access.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter inventory based on selected filter
  const filteredInventory = inventory.filter(item => {
    if (filter === 'active') return item.status === 'ACTIVE';
    if (filter === 'low') return item.status === 'ACTIVE' && item.quantity < 100; // Low stock threshold
    return true;
  });

  // Calculate summary stats
  const activeItems = inventory.filter(i => i.status === 'ACTIVE');
  const totalValue = activeItems.reduce((sum, i) => sum + i.totalCost, 0);
  const lowStockCount = activeItems.filter(i => i.quantity < 100).length;

  // Group by material for summary
  const materialSummary = activeItems.reduce((acc, item) => {
    const key = item.material;
    if (!acc[key]) {
      acc[key] = { material: key, totalQty: 0, unit: item.unit, totalValue: 0 };
    }
    acc[key].totalQty += item.quantity;
    acc[key].totalValue += item.totalCost;
    return acc;
  }, {});

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Active Items</p>
          <p className="text-2xl font-bold text-green-600">{activeItems.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Low Stock Items</p>
          <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-purple-600">
            {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Material Summary */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Material Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(materialSummary).map((summary, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="font-medium text-gray-900 truncate" title={summary.material}>
                {summary.material}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.totalQty.toFixed(2)} {summary.unit}
              </p>
              <p className="text-sm text-gray-500">
                Value: {summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Raw Material Inventory</h3>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Items</option>
              <option value="active">Active Only</option>
              <option value="low">Low Stock</option>
            </select>
            <button
              onClick={loadInventory}
              className="btn btn-primary flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
            Error loading inventory: {error}
          </div>
        )}

        {filteredInventory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No raw materials found</p>
            <p className="text-sm">Add raw materials using the Raw Material app</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item, index) => (
                  <tr key={index} className={`hover:bg-gray-50 ${item.status !== 'ACTIVE' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate" title={item.material}>
                      {item.material}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.category || '-'}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                      item.quantity < 100 ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      {item.quantity.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.totalCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
