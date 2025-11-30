import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

// Packing time configuration (minutes per unit)
const PACKING_TIME_CONFIG = {
  'SUN-4402': { time: 1, unit: 'bundle', description: '200g' },      // 1 minute per bundle
  'SUN-4401': { time: 1, unit: 'bundle', description: '100g' },      // 1 minute per bundle
  'SUN-1116': { time: 3, unit: 'carton', description: '800g' },      // 3 minutes per carton
};

export default function LowStockAlert({ onClose }) {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToday, setShowToday] = useState(true);
  const [availableMinutes, setAvailableMinutes] = useState(480); // Default 8 hours (480 minutes)

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
      }).map(item => {
        const sku = item['SKU'];
        const shortage = (parseFloat(item['Minimum Stock']) || 0) - (parseFloat(item['Current Stock']) || 0);
        const packingConfig = PACKING_TIME_CONFIG[sku];
        const timeNeeded = packingConfig ? shortage * packingConfig.time : null;

        return {
          sku,
          productType: item['Product Type'],
          packageSize: item['Package Size'],
          region: item['Region'] || 'N/A',
          currentStock: parseFloat(item['Current Stock']) || 0,
          minimumStock: parseFloat(item['Minimum Stock']) || 0,
          shortage,
          status: item['Status'],
          hasTimeConfig: !!packingConfig,
          timePerUnit: packingConfig?.time || null,
          packingUnit: packingConfig?.unit || null,
          timeNeeded // Total minutes needed to produce shortage
        };
      }).sort((a, b) => b.shortage - a.shortage); // Sort by shortage (worst first)

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
              {/* Summary Stats */}
              {(() => {
                const itemsWithTime = lowStockItems.filter(i => i.hasTimeConfig);
                // Since all machines run in parallel, actual time = MAX time (bottleneck)
                const maxTimeNeeded = itemsWithTime.length > 0
                  ? Math.max(...itemsWithTime.map(i => i.timeNeeded || 0))
                  : 0;
                const bottleneckItem = itemsWithTime.find(i => i.timeNeeded === maxTimeNeeded);
                const hoursNeeded = Math.floor(maxTimeNeeded / 60);
                const minsNeeded = Math.round(maxTimeNeeded % 60);

                return (
                  <div className="mb-4 space-y-3">
                    <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                      <p className="text-sm text-orange-800">
                        <strong>{lowStockItems.length} item(s)</strong> need to be produced to reach minimum stock levels.
                      </p>
                    </div>

                    {itemsWithTime.length > 0 && (
                      <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Time Required (Parallel Machines):
                            </p>
                            <p className="text-2xl font-bold text-blue-900">
                              {hoursNeeded > 0 ? `${hoursNeeded}h ` : ''}{minsNeeded}m
                              <span className="text-sm font-normal text-blue-600 ml-2">
                                ({maxTimeNeeded.toLocaleString()} minutes)
                              </span>
                            </p>
                            {bottleneckItem && (
                              <p className="text-xs text-blue-600 mt-1">
                                Bottleneck: {bottleneckItem.packageSize} ({bottleneckItem.sku})
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <label className="text-sm text-blue-800">Available Time:</label>
                            <input
                              type="number"
                              value={availableMinutes}
                              onChange={(e) => setAvailableMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-24 px-3 py-2 border border-blue-300 rounded-md text-center font-medium"
                              min="0"
                            />
                            <span className="text-sm text-blue-600">minutes</span>
                          </div>
                        </div>

                        {/* Per-machine breakdown */}
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-xs font-medium text-blue-700 mb-2">Machine Time Breakdown:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {itemsWithTime.map((item, idx) => {
                              const h = Math.floor(item.timeNeeded / 60);
                              const m = Math.round(item.timeNeeded % 60);
                              const isBottleneck = item.timeNeeded === maxTimeNeeded;
                              return (
                                <div
                                  key={idx}
                                  className={`text-center p-2 rounded ${isBottleneck ? 'bg-blue-200 ring-2 ring-blue-400' : 'bg-blue-100'}`}
                                >
                                  <p className="text-xs text-blue-600">{item.packageSize}</p>
                                  <p className={`text-sm font-bold ${isBottleneck ? 'text-blue-800' : 'text-blue-700'}`}>
                                    {h > 0 ? `${h}h ` : ''}{m}m
                                  </p>
                                  {isBottleneck && <p className="text-xs text-blue-500">Longest</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {availableMinutes > 0 && maxTimeNeeded > 0 && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-700">
                                Coverage: {Math.min(100, (availableMinutes / maxTimeNeeded * 100)).toFixed(1)}%
                              </span>
                              <span className={`text-sm font-medium ${
                                availableMinutes >= maxTimeNeeded ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {availableMinutes >= maxTimeNeeded
                                  ? `✓ Sufficient (+${Math.floor((availableMinutes - maxTimeNeeded) / 60)}h ${Math.round((availableMinutes - maxTimeNeeded) % 60)}m spare)`
                                  : `✗ Short by ${Math.floor((maxTimeNeeded - availableMinutes) / 60)}h ${Math.round((maxTimeNeeded - availableMinutes) % 60)}m`
                                }
                              </span>
                            </div>
                            <div className="mt-2 bg-blue-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  availableMinutes >= maxTimeNeeded ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, (availableMinutes / maxTimeNeeded * 100))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Minimum</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Need</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Time/Unit</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockItems.map((item, index) => (
                      <tr key={index} className={
                        item.status === 'CRITICAL' ? 'bg-red-50' :
                        item.status === 'OUT' ? 'bg-red-100' :
                        'bg-yellow-50'
                      }>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'OUT' ? 'bg-red-100 text-red-800' :
                            item.status === 'CRITICAL' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.sku}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                          {item.productType}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                          {item.packageSize}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                          {item.currentStock.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                          {item.minimumStock.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            +{item.shortage.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                          {item.hasTimeConfig ? (
                            <span className="text-blue-600">{item.timePerUnit}m/{item.packingUnit}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-right">
                          {item.hasTimeConfig ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {Math.floor(item.timeNeeded / 60) > 0 ? `${Math.floor(item.timeNeeded / 60)}h ` : ''}
                              {Math.round(item.timeNeeded % 60)}m
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
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
