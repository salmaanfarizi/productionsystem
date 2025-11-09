import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import InventorySection from './InventorySection';
import MovementCard from './MovementCard';

export default function WIPTab({ refreshTrigger }) {
  const [openingData, setOpeningData] = useState([]);
  const [movementsInData, setMovementsInData] = useState([]);
  const [movementsOutData, setMovementsOutData] = useState([]);
  const [closingData, setClosingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingSummary, setOpeningSummary] = useState({
    totalBatches: 0,
    totalStock: 0,
    activeBatches: 0,
    completeBatches: 0
  });
  const [movementsSummary, setMovementsSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    netMovement: 0
  });
  const [closingSummary, setClosingSummary] = useState({
    totalBatches: 0,
    totalStock: 0,
    activeBatches: 0,
    completeBatches: 0
  });

  useEffect(() => {
    loadAllData();
  }, [refreshTrigger]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOpeningBalance(),
        loadMovements(),
        loadClosingBalance()
      ]);
    } catch (error) {
      console.error('Error loading WIP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOpeningBalance = async () => {
    try {
      const rawData = await readSheetData('WIP Inventory');
      const parsed = parseSheetData(rawData);

      setOpeningData(parsed);

      // Calculate summary
      const totalStock = parsed.reduce((sum, item) =>
        sum + (parseFloat(item['Remaining (T)']) || 0), 0);
      const activeBatches = parsed.filter(item =>
        item.Status === 'ACTIVE').length;
      const completeBatches = parsed.filter(item =>
        item.Status === 'COMPLETE').length;

      setOpeningSummary({
        totalBatches: parsed.length,
        totalStock,
        activeBatches,
        completeBatches
      });
    } catch (error) {
      console.error('Error loading WIP opening balance:', error);
    }
  };

  const loadMovements = async () => {
    try {
      // Load movements IN from Production Logs (production started)
      const productionData = await readSheetData('Production Logs');
      const productionParsed = parseSheetData(productionData);

      const movementsIn = productionParsed.slice(0, 10).map(item => ({
        name: `${item['Product Type'] || 'Unknown'} - ${item['Size Range'] || 'N/A'}`,
        quantity: item['Initial WIP (T)'] || 0,
        unit: 'tonnes',
        date: item['Date'] || item['Production Date'],
        description: 'Production started'
      }));

      // Movements OUT to finished goods (production completed)
      const movementsOut = productionParsed
        .filter(item => item.Status === 'COMPLETE')
        .slice(0, 10)
        .map(item => ({
          name: `${item['Product Type'] || 'Unknown'} - ${item['Size Range'] || 'N/A'}`,
          quantity: item['Consumed (T)'] || 0,
          unit: 'tonnes',
          date: item['Date'] || item['Completion Date'],
          description: 'Moved to finished goods'
        }));

      setMovementsInData(movementsIn);
      setMovementsOutData(movementsOut);

      // Calculate movements summary
      const totalIn = movementsIn.reduce((sum, m) =>
        sum + (parseFloat(m.quantity) || 0), 0);
      const totalOut = movementsOut.reduce((sum, m) =>
        sum + (parseFloat(m.quantity) || 0), 0);

      setMovementsSummary({
        totalIn,
        totalOut,
        netMovement: totalIn - totalOut
      });
    } catch (error) {
      console.error('Error loading WIP movements:', error);
    }
  };

  const loadClosingBalance = async () => {
    try {
      // Closing = Opening + In - Out
      const rawData = await readSheetData('WIP Inventory');
      const parsed = parseSheetData(rawData);

      setClosingData(parsed);

      // Calculate summary
      const totalStock = parsed.reduce((sum, item) =>
        sum + (parseFloat(item['Remaining (T)']) || 0), 0);
      const activeBatches = parsed.filter(item =>
        item.Status === 'ACTIVE').length;
      const completeBatches = parsed.filter(item =>
        item.Status === 'COMPLETE').length;

      setClosingSummary({
        totalBatches: parsed.length,
        totalStock,
        activeBatches,
        completeBatches
      });
    } catch (error) {
      console.error('Error loading WIP closing balance:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'COMPLETE': 'bg-blue-100 text-blue-800',
      'PENDING': 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const wipColumns = [
    {
      header: 'Batch ID',
      key: 'WIP Batch ID',
      className: 'font-medium text-gray-900'
    },
    {
      header: 'Product',
      key: 'Product Type',
      className: 'text-gray-700'
    },
    {
      header: 'Size Range',
      key: 'Size Range',
      className: 'text-gray-700'
    },
    {
      header: 'Variant/Region',
      key: 'Variant/Region',
      render: (value) => value || 'N/A',
      className: 'text-gray-700'
    },
    {
      header: 'Initial (T)',
      key: 'Initial WIP (T)',
      align: 'right',
      render: (value) => parseFloat(value || 0).toFixed(3),
      className: 'text-gray-900'
    },
    {
      header: 'Remaining (T)',
      key: 'Remaining (T)',
      align: 'right',
      render: (value) => {
        const val = parseFloat(value || 0);
        return (
          <span className={`font-semibold ${
            val > 1 ? 'text-green-700' :
            val > 0.1 ? 'text-yellow-700' :
            'text-red-700'
          }`}>
            {val.toFixed(3)}
          </span>
        );
      }
    },
    {
      header: 'Status',
      key: 'Status',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(value)}`}>
          {value}
        </span>
      )
    }
  ];

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
    <div className="space-y-8">
      {/* Opening Balance Section */}
      <InventorySection
        title="Opening Balance"
        icon="📊"
        type="opening"
        data={openingData}
        columns={wipColumns}
        summaryCards={[
          {
            label: 'Total Batches',
            value: openingSummary.totalBatches,
            bgClass: 'bg-gradient-to-br from-blue-50 to-blue-100',
            valueClass: 'text-blue-700'
          },
          {
            label: 'Total Stock',
            value: openingSummary.totalStock.toFixed(2),
            bgClass: 'bg-gradient-to-br from-purple-50 to-purple-100',
            valueClass: 'text-purple-700',
            subtitle: 'tonnes'
          },
          {
            label: 'Active Batches',
            value: openingSummary.activeBatches,
            bgClass: 'bg-gradient-to-br from-green-50 to-green-100',
            valueClass: 'text-green-700'
          },
          {
            label: 'Complete Batches',
            value: openingSummary.completeBatches,
            bgClass: 'bg-gradient-to-br from-gray-50 to-gray-100',
            valueClass: 'text-gray-700'
          }
        ]}
      />

      {/* Movements Section */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🔄</span>
            <h2 className="text-2xl font-bold">Movements</h2>
          </div>
        </div>

        {/* Movement Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm text-gray-600">Production Started</p>
            <p className="text-3xl font-bold text-green-700 mt-1">
              +{movementsSummary.totalIn.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">tonnes</p>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <p className="text-sm text-gray-600">To Finished Goods</p>
            <p className="text-3xl font-bold text-red-700 mt-1">
              -{movementsSummary.totalOut.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">tonnes</p>
          </div>
          <div className={`card ${
            movementsSummary.netMovement >= 0
              ? 'bg-gradient-to-br from-blue-50 to-blue-100'
              : 'bg-gradient-to-br from-orange-50 to-orange-100'
          }`}>
            <p className="text-sm text-gray-600">Net Movement</p>
            <p className={`text-3xl font-bold mt-1 ${
              movementsSummary.netMovement >= 0 ? 'text-blue-700' : 'text-orange-700'
            }`}>
              {movementsSummary.netMovement >= 0 ? '+' : ''}{movementsSummary.netMovement.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">tonnes</p>
          </div>
        </div>

        {/* Movement Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MovementCard
            title="Production Started"
            icon="▶️"
            type="in"
            data={movementsInData}
            emptyMessage="No new production batches"
          />
          <MovementCard
            title="To Finished Goods"
            icon="✅"
            type="out"
            data={movementsOutData}
            emptyMessage="No completed batches"
          />
        </div>
      </div>

      {/* Closing Balance Section */}
      <InventorySection
        title="Closing Balance"
        icon="📦"
        type="closing"
        data={closingData}
        columns={wipColumns}
        summaryCards={[
          {
            label: 'Total Batches',
            value: closingSummary.totalBatches,
            bgClass: 'bg-gradient-to-br from-purple-50 to-purple-100',
            valueClass: 'text-purple-700'
          },
          {
            label: 'Total Stock',
            value: closingSummary.totalStock.toFixed(2),
            bgClass: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
            valueClass: 'text-indigo-700',
            subtitle: 'tonnes'
          },
          {
            label: 'Active Batches',
            value: closingSummary.activeBatches,
            bgClass: 'bg-gradient-to-br from-green-50 to-green-100',
            valueClass: 'text-green-700'
          },
          {
            label: 'Complete Batches',
            value: closingSummary.completeBatches,
            bgClass: 'bg-gradient-to-br from-gray-50 to-gray-100',
            valueClass: 'text-gray-700'
          }
        ]}
      />
    </div>
  );
}
