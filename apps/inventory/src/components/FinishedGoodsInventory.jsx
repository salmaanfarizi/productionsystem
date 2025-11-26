import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import { PACKING_PRODUCT_TYPES, REGIONS } from '@shared/config/retailProducts';
import { getStockLevelStatus, getStockPercentage } from '@shared/utils/stockLevels';
import { getStockLevelSettings } from '@shared/utils/settingsManager';

export default function FinishedGoodsInventory({ refreshTrigger }) {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockLevelSettings, setStockLevelSettings] = useState({});
  const [filters, setFilters] = useState({
    productType: 'all',
    region: 'all',
    status: 'all'
  });
  const [summary, setSummary] = useState({
    total: 0,
    normal: 0,
    belowMin: 0,
    low: 0,
    critical: 0,
    overstock: 0
  });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadStockLevelSettings();
  }, []);

  useEffect(() => {
    loadInventory();
  }, [refreshTrigger, stockLevelSettings]);

  useEffect(() => {
    applyFilters();
  }, [inventory, filters]);

  const loadStockLevelSettings = async () => {
    const settings = await getStockLevelSettings();
    setStockLevelSettings(settings);
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('Finished Goods Inventory');
      const parsed = parseSheetData(rawData);

      // Calculate status using stock level settings
      const inventoryWithStatus = parsed.map(item => {
        const sku = item['SKU'];
        const currentStock = parseFloat(item['Current Stock']) || 0;
        const settings = stockLevelSettings[sku];

        // Get stock level status
        const statusInfo = getStockLevelStatus(
          currentStock,
          settings?.minLevel,
          settings?.maxLevel
        );

        return {
          ...item,
          statusInfo,
          minLevel: settings?.minLevel || 0,
          maxLevel: settings?.maxLevel || 0,
          percentage: getStockPercentage(currentStock, settings?.minLevel, settings?.maxLevel)
        };
      });

      setInventory(inventoryWithStatus);

      // Generate alerts for critical and low items
      const criticalItems = inventoryWithStatus.filter(item =>
        item.statusInfo.status === 'critical' || item.statusInfo.status === 'low'
      );
      setAlerts(criticalItems);

      // Calculate summary
      const stats = {
        total: inventoryWithStatus.length,
        normal: inventoryWithStatus.filter(r => r.statusInfo.status === 'normal').length,
        belowMin: inventoryWithStatus.filter(r => r.statusInfo.status === 'below-min').length,
        low: inventoryWithStatus.filter(r => r.statusInfo.status === 'low').length,
        critical: inventoryWithStatus.filter(r => r.statusInfo.status === 'critical').length,
        overstock: inventoryWithStatus.filter(r => r.statusInfo.status === 'overstock' || r.statusInfo.status === 'high').length
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
      filtered = filtered.filter(item => item.statusInfo?.status === filters.status);
    }

    setFilteredInventory(filtered);
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
      {/* Alert Section for Critical/Low Items */}
      {alerts.length > 0 && (
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Stock Level Alerts</h3>
              <p className="text-sm text-red-700">{alerts.length} item(s) require immediate attention</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 6).map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${item.statusInfo.borderColor} ${item.statusInfo.bgColor}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{item['SKU']}</span>
                  <span className={`text-xs font-semibold ${item.statusInfo.textColor}`}>
                    {item.statusInfo.icon}
                  </span>
                </div>
                <p className="text-xs text-gray-700 mb-2">{item['Product Type']}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Current: {item['Current Stock']}</span>
                  <span className="text-gray-600">Min: {item.minLevel}</span>
                </div>
                <p className={`text-xs font-medium mt-1 ${item.statusInfo.textColor}`}>
                  {item.statusInfo.message}
                </p>
              </div>
            ))}
          </div>
          {alerts.length > 6 && (
            <p className="text-sm text-red-700 mt-3 text-center">
              + {alerts.length - 6} more item(s) need attention
            </p>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-gray-600">Total SKUs</p>
          <p className="text-3xl font-bold text-blue-700">{summary.total}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-gray-600">🟢 Normal</p>
          <p className="text-3xl font-bold text-green-700">{summary.normal}</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-sm text-gray-600">🟡 Below Min</p>
          <p className="text-3xl font-bold text-yellow-700">{summary.belowMin}</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <p className="text-sm text-gray-600">🟠 Low</p>
          <p className="text-3xl font-bold text-orange-700">{summary.low}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <p className="text-sm text-gray-600">🔴 Critical</p>
          <p className="text-3xl font-bold text-red-700">{summary.critical}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-gray-600">🟣 Overstock</p>
          <p className="text-3xl font-bold text-purple-700">{summary.overstock}</p>
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
              <option value="normal">🟢 Normal</option>
              <option value="below-min">🟡 Below Minimum</option>
              <option value="low">🟠 Low Stock</option>
              <option value="critical">🔴 Critical</option>
              <option value="overstock">🟣 Overstock</option>
              <option value="high">🔵 Above Maximum</option>
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
                  Min / Max
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item, index) => {
                const statusInfo = item.statusInfo || {};
                return (
                  <tr
                    key={index}
                    className={`hover:bg-gray-50 ${statusInfo.bgColor || ''}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusInfo.borderColor} ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {statusInfo.icon} {statusInfo.status?.toUpperCase()}
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
                      {item.minLevel > 0 ? `${item.minLevel} / ${item.maxLevel}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              statusInfo.status === 'critical' ? 'bg-red-600' :
                              statusInfo.status === 'low' ? 'bg-orange-500' :
                              statusInfo.status === 'below-min' ? 'bg-yellow-500' :
                              statusInfo.status === 'normal' ? 'bg-green-500' :
                              statusInfo.status === 'overstock' ? 'bg-purple-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, item.percentage || 0)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-10 text-right">
                          {Math.round(item.percentage || 0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
