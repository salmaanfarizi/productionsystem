import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import { PACKING_PRODUCT_TYPES, REGIONS } from '@shared/config/retailProducts';

export default function ClosingInventory({ refreshTrigger }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({
    totalSKUs: 0,
    totalStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0
  });

  useEffect(() => {
    loadClosingInventory();
  }, [refreshTrigger, selectedDate]);

  const loadClosingInventory = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('Finished Goods Inventory');
      const parsed = parseSheetData(rawData);

      // Calculate summary statistics
      let totalStock = 0;
      let lowStock = 0;
      let outOfStock = 0;

      parsed.forEach(item => {
        const current = parseInt(item['Current Stock']) || 0;
        totalStock += current;

        if (item['Status'] === 'OUT') outOfStock++;
        else if (item['Status'] === 'LOW' || item['Status'] === 'CRITICAL') lowStock++;
      });

      setSummary({
        totalSKUs: parsed.length,
        totalStock,
        lowStockItems: lowStock,
        outOfStockItems: outOfStock,
        totalValue: 0 // Can be calculated if unit prices are available
      });

      setInventory(parsed);
    } catch (error) {
      console.error('Error loading closing inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['SKU', 'Product Type', 'Package Size', 'Region', 'Current Stock', 'Minimum Stock', 'Status'];
    const rows = inventory.map(item => [
      item['SKU'],
      item['Product Type'],
      item['Package Size'],
      item['Region'] || 'N/A',
      item['Current Stock'],
      item['Minimum Stock'] || '0',
      item['Status']
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `closing-inventory-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getProductTypeTotal = (productType) => {
    return inventory
      .filter(item => item['Product Type'] === productType)
      .reduce((sum, item) => sum + (parseInt(item['Current Stock']) || 0), 0);
  };

  const getRegionTotal = (region) => {
    return inventory
      .filter(item => item['Region'] === region || (!item['Region'] && region === 'N/A'))
      .reduce((sum, item) => sum + (parseInt(item['Current Stock']) || 0), 0);
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
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Closing Inventory</h2>
            <p className="text-sm text-gray-600 mt-1">Current stock levels snapshot</p>
          </div>

          <div className="flex gap-3 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
            <button
              onClick={exportToCSV}
              className="btn btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Total SKUs</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{summary.totalSKUs}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Total Stock</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{summary.totalStock.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Low Stock</p>
            <p className="text-3xl font-bold text-yellow-700 mt-1">{summary.lowStockItems}</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Out of Stock</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{summary.outOfStockItems}</p>
          </div>
        </div>

        {/* Breakdown by Product Type */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Stock by Product Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(PACKING_PRODUCT_TYPES).map(productType => {
              const total = getProductTypeTotal(productType);
              return (
                <div key={productType} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600">{productType}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{total}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown by Region */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Stock by Region</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[...REGIONS, 'N/A'].map(region => {
              const total = getRegionTotal(region);
              return (
                <div key={region} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600">{region === 'N/A' ? 'Non-Regional' : region}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{total}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Inventory</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Minimum</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
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
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item['Status'] === 'OK' ? 'bg-green-100 text-green-800' :
                      item['Status'] === 'LOW' ? 'bg-yellow-100 text-yellow-800' :
                      item['Status'] === 'CRITICAL' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item['Status']}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
