import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData, appendSheetData, writeSheetData } from '@shared/utils/sheetsAPI';
import { PACKING_PRODUCT_TYPES, REGIONS, getSKUsForProduct } from '@shared/config/retailProducts';
import { OUTWARDS_CATEGORIES, OUTWARDS_TYPES, CATEGORY_METADATA, REGIONAL_WAREHOUSES } from '@shared/config/outwardsConfig';
import {
  fetchSalesmanTransfers,
  getSalesmanTransfersSummary,
  isArsinvConfigured,
  getLastSyncTimestamp,
  saveLastSyncTimestamp
} from '@shared/utils/arsinvSync';

export default function StockOutwards({ refreshTrigger, authHelper, onRefresh }) {
  const [outwardsList, setOutwardsList] = useState([]);
  const [salesmanTransfers, setSalesmanTransfers] = useState([]);
  const [filteredOutwards, setFilteredOutwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    productType: 'all',
    region: 'all',
    dateFrom: new Date().toISOString().split('T')[0], // Default to today
    dateTo: new Date().toISOString().split('T')[0] // Default to today
  });

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: OUTWARDS_CATEGORIES.DAMAGED,
    sku: '',
    productType: '',
    packageSize: '',
    region: '',
    quantity: '',
    customer: '',
    warehouse: '', // For regional warehouse transfer
    invoiceRef: '',
    notes: ''
  });

  const [availableSKUs, setAvailableSKUs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const arsinvConfigured = isArsinvConfigured();

  useEffect(() => {
    loadOutwards();
    loadLastSyncTime();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [outwardsList, salesmanTransfers, filters]);

  // Update available SKUs when product type changes
  useEffect(() => {
    if (formData.productType) {
      const skus = getSKUsForProduct(formData.productType);
      setAvailableSKUs(skus);
      setFormData(prev => ({ ...prev, sku: '' }));
    } else {
      setAvailableSKUs([]);
    }
  }, [formData.productType]);

  const loadLastSyncTime = () => {
    const timestamp = getLastSyncTimestamp();
    setLastSync(timestamp);
  };

  const loadOutwards = async () => {
    if (!authHelper || !authHelper.getAccessToken()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const accessToken = authHelper.getAccessToken();
      const rawData = await readSheetData('Stock Outwards', 'A1:L1000', accessToken);
      const parsed = parseSheetData(rawData);
      // Sort by date descending
      const sorted = parsed.sort((a, b) =>
        new Date(b['Date'] || 0) - new Date(a['Date'] || 0)
      );
      setOutwardsList(sorted);
    } catch (error) {
      console.error('Error loading outwards:', error);
      // If sheet doesn't exist, start with empty array
      setOutwardsList([]);
    } finally {
      setLoading(false);
    }
  };

  const syncSalesmanData = async () => {
    if (!arsinvConfigured) {
      alert('Arsinv API key not configured. Please add VITE_GOOGLE_SHEETS_API_KEY to your .env file.');
      return;
    }

    if (!authHelper || !authHelper.getAccessToken()) {
      alert('Please sign in first to sync salesman data.');
      return;
    }

    const accessToken = authHelper.getAccessToken();

    setSyncing(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
      const transfers = await fetchSalesmanTransfers(apiKey, {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });

      // Process each transfer and reduce inventory
      let inventoryUpdates = 0;
      let inventoryErrors = 0;

      for (const transfer of transfers) {
        const sku = transfer.sku || transfer['SKU'];
        const quantity = parseFloat(transfer.quantity || transfer['Quantity']) || 0;
        const region = transfer.region || transfer['Region'] || 'N/A';

        if (sku && quantity > 0) {
          // Save to Stock Outwards sheet
          const rowData = [
            transfer.date || transfer['Date'] || new Date().toISOString().split('T')[0],
            'Salesman Transfer',
            sku,
            transfer.productType || transfer['Product Type'] || '',
            transfer.packageSize || transfer['Package Size'] || '',
            region,
            quantity,
            transfer.customer || transfer['Customer'] || '',
            transfer.invoiceRef || transfer['Invoice'] || '',
            transfer.notes || transfer['Notes'] || 'Synced from Salesman App',
            'arsinv',
            new Date().toISOString()
          ];

          await appendSheetData('Stock Outwards', rowData, accessToken);

          // Reduce Finished Goods Inventory
          const result = await reduceFinishedGoodsInventory(sku, quantity, region, accessToken);
          if (result.success) {
            inventoryUpdates++;
          } else {
            inventoryErrors++;
            console.warn(`Failed to update inventory for SKU ${sku}: ${result.message}`);
          }
        }
      }

      setSalesmanTransfers(transfers);
      saveLastSyncTimestamp();
      setLastSync(new Date());

      // Reload outwards list to show new entries
      loadOutwards();

      alert(`Successfully synced ${transfers.length} salesman transfers!\n\n` +
            `Inventory Updates:\n` +
            `• Successful: ${inventoryUpdates}\n` +
            `• Failed: ${inventoryErrors}`);
    } catch (error) {
      console.error('Error syncing salesman data:', error);
      alert('Failed to sync salesman data: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const applyFilters = () => {
    // Combine manual outwards and synced salesman transfers
    const combined = [
      ...outwardsList.map(item => ({
        ...item,
        source: item['Source'] || 'manual'
      })),
      ...salesmanTransfers
    ];

    let filtered = [...combined];

    if (filters.category !== 'all') {
      filtered = filtered.filter(item =>
        (item['Category'] || item.category) === filters.category
      );
    }

    if (filters.productType !== 'all') {
      filtered = filtered.filter(item =>
        (item['Product Type'] || item.productType) === filters.productType
      );
    }

    if (filters.region !== 'all') {
      filtered = filtered.filter(item =>
        (item['Region'] || item.region) === filters.region
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(item =>
        new Date(item['Date'] || item.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(item =>
        new Date(item['Date'] || item.date) <= new Date(filters.dateTo)
      );
    }

    // Sort by date descending
    filtered.sort((a, b) =>
      new Date(b['Date'] || b.date || 0) - new Date(a['Date'] || a.date || 0)
    );

    setFilteredOutwards(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reduce Finished Goods Inventory when stock goes out
  const reduceFinishedGoodsInventory = async (sku, quantity, region, accessToken) => {
    try {
      console.log(`📦 Reducing Finished Goods Inventory: SKU=${sku}, Qty=${quantity}, Region=${region}`);

      // Read Finished Goods Inventory
      const rawData = await readSheetData('Finished Goods Inventory', 'A1:I1000', accessToken);
      if (!rawData || rawData.length < 2) {
        console.warn('⚠️ Finished Goods Inventory is empty or has no data');
        return { success: false, message: 'Finished Goods Inventory is empty' };
      }

      const headers = rawData[0];
      const inventory = parseSheetData(rawData);

      // Find SKU column index
      const skuColIndex = headers.findIndex(h => h && h.toLowerCase() === 'sku');
      const stockColIndex = headers.findIndex(h => h && h.toLowerCase().includes('current stock'));
      const regionColIndex = headers.findIndex(h => h && h.toLowerCase() === 'region');
      const lastUpdatedColIndex = headers.findIndex(h => h && h.toLowerCase().includes('last updated'));

      if (skuColIndex === -1 || stockColIndex === -1) {
        console.error('❌ Required columns not found in Finished Goods Inventory');
        return { success: false, message: 'Required columns not found' };
      }

      // Find matching row (match by SKU and optionally Region)
      let matchIndex = -1;
      for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i];
        const itemSku = item['SKU'] || '';
        const itemRegion = item['Region'] || '';

        // Match by SKU (and region if specified)
        if (itemSku === sku) {
          if (region && region !== 'N/A' && regionColIndex !== -1) {
            if (itemRegion === region) {
              matchIndex = i;
              break;
            }
          } else {
            matchIndex = i;
            break;
          }
        }
      }

      if (matchIndex === -1) {
        console.warn(`⚠️ SKU "${sku}" not found in Finished Goods Inventory`);
        return { success: false, message: `SKU "${sku}" not found in inventory` };
      }

      // Get current stock and calculate new stock
      const currentStock = parseFloat(inventory[matchIndex]['Current Stock']) || 0;
      const newStock = Math.max(0, currentStock - quantity);
      const rowIndex = matchIndex + 2; // +2 for header row and 0-index

      console.log(`📊 Current Stock: ${currentStock}, Reducing by: ${quantity}, New Stock: ${newStock}`);

      // Update Current Stock (Column E = index 4)
      const stockColLetter = String.fromCharCode(65 + stockColIndex);
      await writeSheetData(
        'Finished Goods Inventory',
        `${stockColLetter}${rowIndex}`,
        [[newStock]],
        accessToken
      );

      // Update Last Updated timestamp (Column H = index 7)
      if (lastUpdatedColIndex !== -1) {
        const lastUpdatedColLetter = String.fromCharCode(65 + lastUpdatedColIndex);
        await writeSheetData(
          'Finished Goods Inventory',
          `${lastUpdatedColLetter}${rowIndex}`,
          [[new Date().toISOString()]],
          accessToken
        );
      }

      console.log(`✅ Finished Goods Inventory updated: ${sku} reduced from ${currentStock} to ${newStock}`);

      return {
        success: true,
        previousStock: currentStock,
        newStock: newStock,
        reduced: quantity
      };
    } catch (error) {
      console.error('❌ Error reducing Finished Goods Inventory:', error);
      return { success: false, message: error.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authHelper || !authHelper.getAccessToken()) {
      alert('Please sign in first to record stock outwards.');
      return;
    }

    if (!formData.sku || !formData.quantity || !formData.productType || !formData.category) {
      alert('Please fill in all required fields (Category, SKU, Product Type, and Quantity)');
      return;
    }

    // Don't allow manual entry of Salesman Transfer category
    if (formData.category === OUTWARDS_CATEGORIES.SALESMAN_TRANSFER) {
      alert('Salesman Transfers are auto-synced from the Salesman App. Please select a different category.');
      return;
    }

    const accessToken = authHelper.getAccessToken();

    setSubmitting(true);
    try {
      const customerField = formData.category === OUTWARDS_CATEGORIES.REGIONAL_WAREHOUSE
        ? formData.warehouse
        : formData.customer;

      const rowData = [
        formData.date,
        formData.category,
        formData.sku,
        formData.productType,
        formData.packageSize,
        formData.region || 'N/A',
        parseFloat(formData.quantity),
        customerField,
        formData.invoiceRef,
        formData.notes,
        'manual',
        new Date().toISOString()
      ];

      await appendSheetData('Stock Outwards', rowData, accessToken);

      // Reduce Finished Goods Inventory
      const inventoryResult = await reduceFinishedGoodsInventory(
        formData.sku,
        parseFloat(formData.quantity),
        formData.region || 'N/A',
        accessToken
      );

      if (inventoryResult.success) {
        alert(`Stock outwards recorded successfully!\n\nFinished Goods Inventory updated:\n• SKU: ${formData.sku}\n• Previous Stock: ${inventoryResult.previousStock}\n• Reduced by: ${inventoryResult.reduced}\n• New Stock: ${inventoryResult.newStock}`);
      } else {
        alert(`Stock outwards recorded, but inventory update failed:\n${inventoryResult.message}\n\nPlease manually update the Finished Goods Inventory.`);
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: OUTWARDS_CATEGORIES.DAMAGED,
        sku: '',
        productType: '',
        packageSize: '',
        region: '',
        quantity: '',
        customer: '',
        warehouse: '',
        invoiceRef: '',
        notes: ''
      });

      setShowForm(false);
      loadOutwards(); // Reload data
    } catch (error) {
      console.error('Error saving outwards:', error);
      alert('Error recording stock outwards: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate summary statistics
  const summary = {
    total: filteredOutwards.length,
    totalQuantity: filteredOutwards.reduce((sum, item) =>
      sum + (parseFloat(item['Quantity'] || item.quantity) || 0), 0
    ),
    uniqueProducts: new Set(filteredOutwards.map(item => item['SKU'] || item.sku)).size,
    byCategory: {}
  };

  // Calculate by category
  OUTWARDS_TYPES.forEach(cat => {
    summary.byCategory[cat] = filteredOutwards.filter(item =>
      (item['Category'] || item.category) === cat
    ).length;
  });

  const getCategoryBadgeColor = (category) => {
    const metadata = CATEGORY_METADATA[category];
    if (!metadata) return 'bg-gray-100 text-gray-800';

    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      teal: 'bg-teal-100 text-teal-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    return colors[metadata.color] || 'bg-gray-100 text-gray-800';
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
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-3xl font-bold text-purple-700">{summary.total}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <p className="text-sm text-gray-600">Total Quantity Out</p>
          <p className="text-3xl font-bold text-red-700">{summary.totalQuantity.toFixed(0)}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-gray-600">Unique Products</p>
          <p className="text-3xl font-bold text-blue-700">{summary.uniqueProducts}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-gray-600">Salesman Transfers</p>
          <p className="text-3xl font-bold text-green-700">{summary.byCategory[OUTWARDS_CATEGORIES.SALESMAN_TRANSFER] || 0}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">By Category</h3>
        <div className="grid grid-cols-6 gap-3">
          {OUTWARDS_TYPES.map(category => {
            const metadata = CATEGORY_METADATA[category];
            const count = summary.byCategory[category] || 0;
            return (
              <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">{metadata.icon}</div>
                <div className="text-xs text-gray-600 mb-1">{category}</div>
                <div className="text-xl font-bold text-gray-900">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Stock Outwards Transactions</h2>
        <div className="flex space-x-3">
          {arsinvConfigured && (
            <button
              onClick={syncSalesmanData}
              disabled={syncing}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Salesman Data</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{showForm ? 'Cancel' : 'Add Manual Entry'}</span>
          </button>
        </div>
      </div>

      {/* Last Sync Info */}
      {lastSync && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <strong>Last sync:</strong> {lastSync.toLocaleString()} |
          <strong className="ml-2">Salesman transfers loaded:</strong> {salesmanTransfers.length}
        </div>
      )}

      {/* Manual Entry Form */}
      {showForm && (
        <div className="card bg-gradient-to-br from-purple-50 to-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Record Stock Outwards (Manual)</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="label">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  {OUTWARDS_TYPES.filter(cat => cat !== OUTWARDS_CATEGORIES.SALESMAN_TRANSFER).map(category => {
                    const metadata = CATEGORY_METADATA[category];
                    return (
                      <option key={category} value={category}>
                        {metadata.icon} {category} - {metadata.description}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Note: Salesman Transfers are auto-synced and cannot be entered manually
                </p>
              </div>

              <div>
                <label className="label">Product Type *</label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select Product Type</option>
                  {Object.values(PACKING_PRODUCT_TYPES).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">SKU *</label>
                <select
                  name="sku"
                  value={formData.sku}
                  onChange={(e) => {
                    const selectedProduct = availableSKUs.find(p => p.sku === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      sku: e.target.value,
                      packageSize: selectedProduct ? selectedProduct.size : ''
                    }));
                  }}
                  className="input"
                  required
                  disabled={!formData.productType}
                >
                  <option value="">Select SKU</option>
                  {availableSKUs.map(product => (
                    <option key={product.sku} value={product.sku}>
                      {product.code} - {product.size} ({product.unit})
                    </option>
                  ))}
                </select>
                {!formData.productType && (
                  <p className="text-xs text-gray-500 mt-1">Select product type first</p>
                )}
              </div>

              <div>
                <label className="label">Package Size</label>
                <input
                  type="text"
                  name="packageSize"
                  value={formData.packageSize}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., 200g"
                />
              </div>

              <div>
                <label className="label">Region</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select Region</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {formData.category === OUTWARDS_CATEGORIES.REGIONAL_WAREHOUSE && (
                <div>
                  <label className="label">Warehouse *</label>
                  <select
                    name="warehouse"
                    value={formData.warehouse}
                    onChange={handleInputChange}
                    className="input"
                    required
                  >
                    <option value="">Select Warehouse</option>
                    {REGIONAL_WAREHOUSES.map(warehouse => (
                      <option key={warehouse} value={warehouse}>{warehouse}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div>
                <label className="label">Customer/Recipient</label>
                <input
                  type="text"
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="label">Reference Number</label>
                <input
                  type="text"
                  name="invoiceRef"
                  value={formData.invoiceRef}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="REF-001"
                />
              </div>

              <div className="col-span-3">
                <label className="label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Additional notes"
                  rows="2"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Saving...' : 'Save Outwards'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="all">All Categories</option>
              {OUTWARDS_TYPES.map(category => (
                <option key={category} value={category}>{CATEGORY_METADATA[category].icon} {category}</option>
              ))}
            </select>
          </div>

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
            <label className="label">Date From</label>
            <input
              type="date"
              className="input"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Date To</label>
            <input
              type="date"
              className="input"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Outwards History Table */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Outwards History ({filteredOutwards.length} transactions)
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
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
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOutwards.map((item, index) => {
                const category = item['Category'] || item.category || 'Other';
                const source = item.source || 'manual';
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item['Date'] || item.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeColor(category)}`}>
                        {CATEGORY_METADATA[category]?.icon} {category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-purple-600">
                      {item['SKU'] || item.sku}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item['Product Type'] || item.productType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item['Package Size'] || item.packageSize}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item['Region'] || item.region || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                      -{item['Quantity'] || item.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item['Customer'] || item.customer || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {item['Invoice'] || item.invoiceRef || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${source === 'arsinv' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {source === 'arsinv' ? '🔄 Synced' : '✍️ Manual'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOutwards.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No outwards transactions found. {!arsinvConfigured && 'Configure arsinv sync or add manual entries.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
