import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

export default function StockDashboard({ refreshTrigger }) {
  const [stats, setStats] = useState({
    totalStock: 0,
    activeBatches: 0,
    products: 0,
    lowStock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('WIP Inventory');
      const batches = parseSheetData(rawData);

      const activeBatches = batches.filter(b => b['Status'] === 'ACTIVE');
      const totalStock = activeBatches.reduce((sum, b) => {
        return sum + (parseFloat(b['Remaining (T)']) || 0);
      }, 0);

      const products = new Set(
        activeBatches.map(b => `${b['Product Type']}-${b['Size Range']}`)
      ).size;

      const lowStock = activeBatches.filter(b => {
        const remaining = parseFloat(b['Remaining (T)']) || 0;
        return remaining < 1.0; // Less than 1 tonne
      }).length;

      setStats({
        totalStock,
        activeBatches: activeBatches.length,
        products,
        lowStock
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Stock */}
      <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">Total Stock</p>
            {loading ? (
              <div className="h-10 w-20 bg-purple-400 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-4xl font-bold">{stats.totalStock.toFixed(1)}</p>
            )}
            <p className="text-purple-200 text-xs mt-1">Tonnes</p>
          </div>
          <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Batches */}
      <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Active Batches</p>
            {loading ? (
              <div className="h-10 w-16 bg-green-400 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-4xl font-bold">{stats.activeBatches}</p>
            )}
            <p className="text-green-200 text-xs mt-1">In Progress</p>
          </div>
          <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Product Types */}
      <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Product Types</p>
            {loading ? (
              <div className="h-10 w-16 bg-blue-400 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-4xl font-bold">{stats.products}</p>
            )}
            <p className="text-blue-200 text-xs mt-1">Varieties</p>
          </div>
          <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm">Low Stock Alerts</p>
            {loading ? (
              <div className="h-10 w-16 bg-red-400 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-4xl font-bold">{stats.lowStock}</p>
            )}
            <p className="text-red-200 text-xs mt-1">Batches &lt; 1T</p>
          </div>
          <div className="bg-red-400 bg-opacity-30 rounded-full p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
