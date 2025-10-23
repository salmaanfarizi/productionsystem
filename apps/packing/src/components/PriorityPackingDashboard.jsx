import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import { RETAIL_PRODUCTS } from '@shared/config/retailProducts';

export default function PriorityPackingDashboard() {
  const [priorityItems, setPriorityItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadPriorityItems();
    // Refresh every 5 minutes
    const interval = setInterval(loadPriorityItems, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadPriorityItems = async () => {
    try {
      setLoading(true);
      const rawData = await readSheetData('Finished Goods Inventory');
      const parsed = parseSheetData(rawData);

      // Find items below minimum stock
      const itemsNeedingPacking = parsed
        .map(row => {
          const currentStock = parseInt(row['Current Stock']) || 0;
          const minStock = parseInt(row['Minimum Stock']) || 0;
          const sku = row['SKU'];
          const product = RETAIL_PRODUCTS[sku];

          if (!product || minStock === 0) return null;

          const shortage = minStock - currentStock;

          // Only show items that are below minimum
          if (shortage > 0) {
            return {
              sku,
              productType: row['Product Type'],
              region: row['Region'],
              packageSize: row['Package Size'],
              currentStock,
              minStock,
              shortage,
              status: row['Status'],
              packagingType: product.packaging.type,
              packagingQty: product.packaging.quantity,
              priority: calculatePriority(currentStock, minStock)
            };
          }
          return null;
        })
        .filter(item => item !== null)
        .sort((a, b) => b.priority - a.priority); // Highest priority first

      setPriorityItems(itemsNeedingPacking);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading priority items:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePriority = (current, minimum) => {
    if (current === 0) return 100; // OUT - highest priority
    const percentage = (current / minimum) * 100;
    if (percentage < 25) return 80; // CRITICAL
    if (percentage < 50) return 60; // LOW
    return 40; // Below minimum but not critical
  };

  const getStatusColor = (status) => {
    const colors = {
      'OUT': 'bg-red-100 text-red-800 border-red-300',
      'CRITICAL': 'bg-orange-100 text-orange-800 border-orange-300',
      'LOW': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'OK': 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 100) return { text: 'URGENT', color: 'bg-red-600 text-white' };
    if (priority >= 80) return { text: 'HIGH', color: 'bg-orange-600 text-white' };
    if (priority >= 60) return { text: 'MEDIUM', color: 'bg-yellow-600 text-white' };
    return { text: 'LOW', color: 'bg-blue-600 text-white' };
  };

  if (loading && priorityItems.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">Loading priority items...</p>
      </div>
    );
  }

  if (priorityItems.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              ✓ All Items at Minimum Stock Level
            </h3>
            <p className="text-sm text-green-700 mt-1">
              No urgent packing needed at this time.
            </p>
          </div>
          {lastUpdate && (
            <p className="text-xs text-green-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-6 mb-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold">
            !
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-900">
              Priority Packing Required
            </h3>
            <p className="text-sm text-red-700">
              {priorityItems.length} item{priorityItems.length !== 1 ? 's' : ''} below minimum stock level
            </p>
          </div>
        </div>
        <div className="text-right">
          <button
            onClick={loadPriorityItems}
            className="text-sm text-red-700 hover:text-red-900 underline"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {lastUpdate && (
            <p className="text-xs text-red-600 mt-1">
              Updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Priority Items Table */}
      <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-red-200">
            <thead className="bg-red-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-red-900 uppercase">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-red-900 uppercase">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-red-900 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-red-900 uppercase">
                  Region
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-red-900 uppercase">
                  Current
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-red-900 uppercase">
                  Minimum
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-red-900 uppercase">
                  Need to Pack
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-red-900 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {priorityItems.map((item, index) => {
                const priorityBadge = getPriorityBadge(item.priority);
                const unitsNeeded = Math.ceil(item.shortage / item.packagingQty);

                return (
                  <tr
                    key={`${item.sku}-${item.region}-${index}`}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-red-50'}
                  >
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${priorityBadge.color}`}>
                        {priorityBadge.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 font-medium">
                        {item.productType}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.packageSize}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.region || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-900">
                      {item.currentStock}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {item.minStock}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-bold text-red-900">
                        {item.shortage} {item.packagingType === 'bag' ? 'bags' : item.packagingType + 's'}
                      </div>
                      <div className="text-xs text-gray-600">
                        ({unitsNeeded} {item.packagingType}{unitsNeeded !== 1 ? 's' : ''})
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 p-3 bg-red-100 rounded-lg">
        <p className="text-sm font-semibold text-red-900 mb-2">
          Quick Tips:
        </p>
        <ul className="text-xs text-red-800 space-y-1">
          <li>• Start with URGENT and HIGH priority items first</li>
          <li>• "Need to Pack" shows total units required to reach minimum stock</li>
          <li>• Click "Refresh" to update stock levels after packing</li>
        </ul>
      </div>
    </div>
  );
}
