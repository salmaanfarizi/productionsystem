import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

export default function LowStockAlert({ onClose }) {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToday, setShowToday] = useState(true);

  useEffect(() => {
    // Check if user dismissed alert today
    const dismissedDate = localStorage.getItem('lowStockAlertDismissed');
    const today = new Date().toISOString().split('T')[0];

    if (dismissedDate === today) {
      setShowToday(false);
      return;
    }

    loadLowStockItems();
  }, []);

  const loadLowStockItems = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('Finished Goods Inventory');
      const inventory = parseSheetData(rawData);

      // Filter items where:
      // 1. Minimum Stock > 0 (minimum level set)
      // 2. Current Stock < Minimum Stock (below minimum)
      const lowItems = inventory.filter(item => {
        const current = parseFloat(item['Current Stock']) || 0;
        const minimum = parseFloat(item['Minimum Stock']) || 0;
        return minimum > 0 && current < minimum;
      }).map(item => ({
        sku: item['SKU'],
        productType: item['Product Type'],
        packageSize: item['Package Size'],
        region: item['Region'] || 'N/A',
        currentStock: parseFloat(item['Current Stock']) || 0,
        minimumStock: parseFloat(item['Minimum Stock']) || 0,
        shortage: (parseFloat(item['Minimum Stock']) || 0) - (parseFloat(item['Current Stock']) || 0),
        status: item['Status']
      })).sort((a, b) => b.shortage - a.shortage); // Sort by shortage (worst first)

      setLowStockItems(lowItems);
    } catch (error) {
      console.error('Error loading low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissToday = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lowStockAlertDismissed', today);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!showToday && lowStockItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold">Low Stock Alert</h2>
              <p className="text-orange-100 text-sm">Items below minimum stock level</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-orange-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">All Stock Levels OK!</h3>
              <p className="mt-2 text-gray-600">No items are currently below minimum stock.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                <p className="text-sm text-orange-800">
                  <strong>{lowStockItems.length} item(s)</strong> need to be produced to reach minimum stock levels.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Minimum</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Need to Produce</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockItems.map((item, index) => (
                      <tr key={index} className={
                        item.status === 'CRITICAL' ? 'bg-red-50' :
                        item.status === 'OUT' ? 'bg-red-100' :
                        'bg-yellow-50'
                      }>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'OUT' ? 'bg-red-100 text-red-800' :
                            item.status === 'CRITICAL' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.sku}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {item.productType}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {item.packageSize}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {item.region}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                          {item.currentStock.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                          {item.minimumStock.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            +{item.shortage.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={handleDismissToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Don't Show Today
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
