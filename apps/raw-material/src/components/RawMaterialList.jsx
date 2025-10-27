import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import {
  RAW_MATERIAL_CATEGORIES,
  getAllMaterials,
  getCategoryForMaterial,
  EXPIRY_WARNING_DAYS
} from '@shared/config/rawMaterials';

export default function RawMaterialList({ authHelper, refreshTrigger }) {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);

  useEffect(() => {
    if (authHelper && authHelper.getAccessToken()) {
      loadData();
    }
  }, [authHelper, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const accessToken = authHelper.getAccessToken();

      // Load inventory
      const inventoryData = await readSheetData('Raw Material Inventory', 'A1:M1000', accessToken);
      const parsedInventory = parseSheetData(inventoryData);
      setInventory(parsedInventory);

      // Load recent transactions
      const transactionData = await readSheetData('Raw Material Transactions', 'A1:N100', accessToken);
      const parsedTransactions = parseSheetData(transactionData);
      setTransactions(parsedTransactions.slice(0, 10)); // Show last 10 transactions

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stock summary by material
  const calculateStockSummary = () => {
    const summary = {};

    inventory.forEach(item => {
      const material = item['Material Name'] || item.Material;
      const quantity = parseFloat(item['Quantity'] || item['Current Stock'] || 0);
      const status = item['Status'];
      const expiryDate = item['Expiry Date'];
      const unit = item['Unit'];

      if (status === 'ACTIVE' && quantity > 0) {
        if (!summary[material]) {
          summary[material] = {
            totalStock: 0,
            unit: unit,
            category: getCategoryForMaterial(material),
            batches: [],
            nearestExpiry: null
          };
        }

        summary[material].totalStock += quantity;
        summary[material].batches.push({
          quantity,
          expiryDate,
          supplier: item['Supplier'],
          batchNumber: item['Batch Number']
        });

        // Track nearest expiry
        if (expiryDate && expiryDate !== 'N/A') {
          const expiry = new Date(expiryDate);
          if (!summary[material].nearestExpiry || expiry < new Date(summary[material].nearestExpiry)) {
            summary[material].nearestExpiry = expiryDate;
          }
        }
      }
    });

    return summary;
  };

  const stockSummary = calculateStockSummary();

  // Check if item is expiring soon
  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate || expiryDate === 'N/A') return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= EXPIRY_WARNING_DAYS;
  };

  // Check if item is expired
  const isExpired = (expiryDate) => {
    if (!expiryDate || expiryDate === 'N/A') return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  // Filter materials based on selected category
  const filteredMaterials = Object.entries(stockSummary).filter(([material, data]) => {
    if (selectedCategory === 'ALL') return true;
    return data.category === selectedCategory;
  }).filter(([material, data]) => {
    if (!showExpiringSoon) return true;
    return data.nearestExpiry && (isExpiringSoon(data.nearestExpiry) || isExpired(data.nearestExpiry));
  });

  // Count alerts
  const expiringCount = Object.values(stockSummary).filter(data =>
    data.nearestExpiry && isExpiringSoon(data.nearestExpiry)
  ).length;

  const expiredCount = Object.values(stockSummary).filter(data =>
    data.nearestExpiry && isExpired(data.nearestExpiry)
  ).length;

  if (loading) {
    return (
      <div className="card text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Summary Card */}
      <div className="card">
        <h2 className="heading-lg mb-4 text-gray-900">Current Stock</h2>

        {/* Alert Summary */}
        {(expiringCount > 0 || expiredCount > 0) && (
          <div className="mb-4 space-y-2">
            {expiredCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-red-900">
                    {expiredCount} item{expiredCount > 1 ? 's' : ''} EXPIRED
                  </span>
                </div>
              </div>
            )}
            {expiringCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-yellow-900">
                    {expiringCount} item{expiringCount > 1 ? 's' : ''} expiring within {EXPIRY_WARNING_DAYS} days
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`btn text-xs ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All ({Object.keys(stockSummary).length})
          </button>
          {Object.values(RAW_MATERIAL_CATEGORIES).map(category => {
            const count = Object.values(stockSummary).filter(data => data.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`btn text-xs ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        {/* Expiring Soon Filter */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showExpiringSoon}
              onChange={(e) => setShowExpiringSoon(e.target.checked)}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Show only expiring/expired items</span>
          </label>
        </div>

        {/* Stock List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No materials found</p>
            </div>
          ) : (
            filteredMaterials.map(([material, data]) => {
              const expiryStatus = data.nearestExpiry
                ? isExpired(data.nearestExpiry)
                  ? 'expired'
                  : isExpiringSoon(data.nearestExpiry)
                  ? 'expiring'
                  : 'good'
                : 'none';

              return (
                <div
                  key={material}
                  className={`p-3 rounded-lg border-2 ${
                    expiryStatus === 'expired'
                      ? 'bg-red-50 border-red-300'
                      : expiryStatus === 'expiring'
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{material}</h3>
                      <p className="text-xs text-gray-600">{data.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {data.totalStock.toFixed(2)} {data.unit}
                      </p>
                      <p className="text-xs text-gray-600">{data.batches.length} batch{data.batches.length > 1 ? 'es' : ''}</p>
                    </div>
                  </div>

                  {data.nearestExpiry && data.nearestExpiry !== 'N/A' && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        {expiryStatus === 'expired' ? (
                          <span className="badge badge-danger">EXPIRED</span>
                        ) : expiryStatus === 'expiring' ? (
                          <span className="badge badge-warning">EXPIRING SOON</span>
                        ) : (
                          <span className="badge badge-success">GOOD</span>
                        )}
                        <span className="text-xs text-gray-600">
                          Nearest expiry: {new Date(data.nearestExpiry).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="heading-lg mb-4 text-gray-900">Recent Transactions</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((txn, index) => {
              const isStockIn = txn['Transaction Type'] === 'Stock In';
              return (
                <div key={index} className="p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${isStockIn ? 'badge-success' : 'badge-danger'}`}>
                          {txn['Transaction Type']}
                        </span>
                        <span className="font-semibold">{txn['Material Name'] || txn.Material}</span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {new Date(txn['Transaction Date'] || txn.Date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {isStockIn ? '+' : '-'}
                        {isStockIn ? txn['Stock In Qty'] : txn['Stock Out Qty']} {txn['Unit']}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
