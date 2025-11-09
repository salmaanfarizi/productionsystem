import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import InventorySection from './InventorySection';
import MovementCard from './MovementCard';

export default function RawMaterialsTab({ refreshTrigger }) {
  const [openingData, setOpeningData] = useState([]);
  const [movementsInData, setMovementsInData] = useState([]);
  const [movementsOutData, setMovementsOutData] = useState([]);
  const [closingData, setClosingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingSummary, setOpeningSummary] = useState({
    totalItems: 0,
    totalStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [movementsSummary, setMovementsSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    netMovement: 0
  });
  const [closingSummary, setClosingSummary] = useState({
    totalItems: 0,
    totalStock: 0,
    lowStock: 0,
    outOfStock: 0
  });

  useEffect(() => {
    loadAllData();
  }, [refreshTrigger]);

  const calculateStatus = (currentStock, minimumStock) => {
    const current = parseFloat(currentStock) || 0;
    const minimum = parseFloat(minimumStock) || 0;

    if (minimum === 0) return 'OK';
    if (current === 0) return 'OUT';
    if (current < minimum * 0.3) return 'CRITICAL';
    if (current < minimum) return 'LOW';
    return 'OK';
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOpeningBalance(),
        loadMovements(),
        loadClosingBalance()
      ]);
    } catch (error) {
      console.error('Error loading raw materials data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOpeningBalance = async () => {
    try {
      const rawData = await readSheetData('Raw Material Inventory');
      const parsed = parseSheetData(rawData);

      // Add status calculation
      const dataWithStatus = parsed.map(item => ({
        ...item,
        Status: calculateStatus(item['Current Stock'], item['Minimum Stock'])
      }));

      setOpeningData(dataWithStatus);

      // Calculate summary
      const totalStock = dataWithStatus.reduce((sum, item) =>
        sum + (parseFloat(item['Current Stock']) || 0), 0);
      const lowStock = dataWithStatus.filter(item =>
        item.Status === 'LOW' || item.Status === 'CRITICAL').length;
      const outOfStock = dataWithStatus.filter(item =>
        item.Status === 'OUT').length;

      setOpeningSummary({
        totalItems: dataWithStatus.length,
        totalStock,
        lowStock,
        outOfStock
      });
    } catch (error) {
      console.error('Error loading raw materials opening balance:', error);
      // Set empty data if sheet doesn't exist
      setOpeningData([]);
      setOpeningSummary({
        totalItems: 0,
        totalStock: 0,
        lowStock: 0,
        outOfStock: 0
      });
    }
  };

  const loadMovements = async () => {
    try {
      // Load movements IN from purchases/receipts
      // This would come from a purchases or receipts sheet
      const movementsIn = [];

      // Load movements OUT to production (consumption)
      // This would come from production logs showing raw material consumption
      const productionData = await readSheetData('Production Logs');
      const productionParsed = parseSheetData(productionData);

      const movementsOut = productionParsed.slice(0, 10).map(item => ({
        name: `Raw materials for ${item['Product Type'] || 'Production'}`,
        quantity: item['Raw Material Used'] || 0,
        unit: 'kg',
        date: item['Date'] || item['Production Date'],
        description: 'Consumed in production'
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
      console.error('Error loading raw materials movements:', error);
      setMovementsInData([]);
      setMovementsOutData([]);
      setMovementsSummary({ totalIn: 0, totalOut: 0, netMovement: 0 });
    }
  };

  const loadClosingBalance = async () => {
    try {
      // Closing = Opening + In - Out
      const rawData = await readSheetData('Raw Material Inventory');
      const parsed = parseSheetData(rawData);

      const dataWithStatus = parsed.map(item => ({
        ...item,
        Status: calculateStatus(item['Current Stock'], item['Minimum Stock'])
      }));

      setClosingData(dataWithStatus);

      // Calculate summary
      const totalStock = dataWithStatus.reduce((sum, item) =>
        sum + (parseFloat(item['Current Stock']) || 0), 0);
      const lowStock = dataWithStatus.filter(item =>
        item.Status === 'LOW' || item.Status === 'CRITICAL').length;
      const outOfStock = dataWithStatus.filter(item =>
        item.Status === 'OUT').length;

      setClosingSummary({
        totalItems: dataWithStatus.length,
        totalStock,
        lowStock,
        outOfStock
      });
    } catch (error) {
      console.error('Error loading raw materials closing balance:', error);
      setClosingData([]);
      setClosingSummary({
        totalItems: 0,
        totalStock: 0,
        lowStock: 0,
        outOfStock: 0
      });
    }
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

  const rawMaterialColumns = [
    {
      header: 'Material Code',
      key: 'Material Code',
      className: 'font-medium text-gray-900'
    },
    {
      header: 'Material Name',
      key: 'Material Name',
      className: 'text-gray-700'
    },
    {
      header: 'Category',
      key: 'Category',
      render: (value) => value || 'N/A',
      className: 'text-gray-700'
    },
    {
      header: 'Unit',
      key: 'Unit',
      className: 'text-gray-700'
    },
    {
      header: 'Current Stock',
      key: 'Current Stock',
      align: 'right',
      render: (value) => parseFloat(value || 0).toFixed(2),
      className: 'font-semibold text-gray-900'
    },
    {
      header: 'Minimum Stock',
      key: 'Minimum Stock',
      align: 'right',
      render: (value) => value ? parseFloat(value).toFixed(2) : '-',
      className: 'text-gray-600'
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
        columns={rawMaterialColumns}
        summaryCards={[
          {
            label: 'Total Items',
            value: openingSummary.totalItems,
            bgClass: 'bg-gradient-to-br from-blue-50 to-blue-100',
            valueClass: 'text-blue-700'
          },
          {
            label: 'Total Stock',
            value: openingSummary.totalStock.toFixed(2),
            bgClass: 'bg-gradient-to-br from-green-50 to-green-100',
            valueClass: 'text-green-700',
            subtitle: 'kg'
          },
          {
            label: 'Low Stock',
            value: openingSummary.lowStock,
            bgClass: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
            valueClass: 'text-yellow-700'
          },
          {
            label: 'Out of Stock',
            value: openingSummary.outOfStock,
            bgClass: 'bg-gradient-to-br from-red-50 to-red-100',
            valueClass: 'text-red-700'
          }
        ]}
        emptyMessage="No raw material inventory data available. Please ensure the 'Raw Material Inventory' sheet exists."
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
            <p className="text-sm text-gray-600">Purchases/Receipts</p>
            <p className="text-3xl font-bold text-green-700 mt-1">
              +{movementsSummary.totalIn.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">kg</p>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <p className="text-sm text-gray-600">To Production</p>
            <p className="text-3xl font-bold text-red-700 mt-1">
              -{movementsSummary.totalOut.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">kg</p>
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
            <p className="text-xs text-gray-500 mt-1">kg</p>
          </div>
        </div>

        {/* Movement Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MovementCard
            title="Purchases & Receipts"
            icon="📥"
            type="in"
            data={movementsInData}
            emptyMessage="No purchases or receipts recorded"
          />
          <MovementCard
            title="To Production"
            icon="🏭"
            type="out"
            data={movementsOutData}
            emptyMessage="No production consumption recorded"
          />
        </div>
      </div>

      {/* Closing Balance Section */}
      <InventorySection
        title="Closing Balance"
        icon="📦"
        type="closing"
        data={closingData}
        columns={rawMaterialColumns}
        summaryCards={[
          {
            label: 'Total Items',
            value: closingSummary.totalItems,
            bgClass: 'bg-gradient-to-br from-purple-50 to-purple-100',
            valueClass: 'text-purple-700'
          },
          {
            label: 'Total Stock',
            value: closingSummary.totalStock.toFixed(2),
            bgClass: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
            valueClass: 'text-indigo-700',
            subtitle: 'kg'
          },
          {
            label: 'Low Stock',
            value: closingSummary.lowStock,
            bgClass: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
            valueClass: 'text-yellow-700'
          },
          {
            label: 'Out of Stock',
            value: closingSummary.outOfStock,
            bgClass: 'bg-gradient-to-br from-red-50 to-red-100',
            valueClass: 'text-red-700'
          }
        ]}
        emptyMessage="No raw material inventory data available. Please ensure the 'Raw Material Inventory' sheet exists."
      />
    </div>
  );
}
