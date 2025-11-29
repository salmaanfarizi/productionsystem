import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData, writeSheetData } from '@shared/utils/sheetsAPI';

const PRODUCT_CATALOG = {
  'Sunflower Seeds': [
    { code: '4402', name: '200g', unit: 'bag', price: 58, bundle: 5 },
    { code: '4401', name: '100g', unit: 'bag', price: 34, bundle: 5 },
    { code: '1129', name: '25g', unit: 'bag', price: 16, bundle: 6 },
    { code: '1116', name: '800g', unit: 'bag', price: 17, carton: 12 },
    { code: '1145', name: '130g', unit: 'box', price: 54, carton: 6 },
    { code: '1126', name: '10KG', unit: 'sack', price: 170 }
  ],
  'Pumpkin Seeds': [
    { code: '8001', name: '15g', unit: 'box', price: 16, carton: 6 },
    { code: '8002', name: '110g', unit: 'box', price: 54, carton: 6 },
    { code: '1142', name: '10KG', unit: 'sack', price: 230 }
  ],
  'Melon Seeds': [
    { code: '9001', name: '15g', unit: 'box', price: 16, carton: 6 },
    { code: '9002', name: '110g', unit: 'box', price: 54, carton: 6 }
  ],
  'Popcorn': [
    { code: '1710', name: 'Cheese', unit: 'bag', price: 5, carton: 8 },
    { code: '1711', name: 'Butter', unit: 'bag', price: 5, carton: 8 },
    { code: '1703', name: 'Lightly Salted', unit: 'bag', price: 5, carton: 8 }
  ]
};

const ROUTES = ['Al-Hasa 1', 'Al-Hasa 2', 'Al-Hasa 3', 'Al-Hasa 4', 'Al-Hasa Wholesale'];

const CATEGORY_ICONS = {
  'Sunflower Seeds': '🌻',
  'Pumpkin Seeds': '🎃',
  'Melon Seeds': '🍉',
  'Popcorn': '🍿'
};

export default function SalesmanInventory({ authHelper }) {
  const [currentRoute, setCurrentRoute] = useState('');
  const [inventoryDate, setInventoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [inventoryData, setInventoryData] = useState({});
  const [loading, setLoading] = useState(false);

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const updateInventoryItem = (code, field, value) => {
    setInventoryData(prev => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: value
      }
    }));
  };

  const calculateDifference = (code) => {
    const item = inventoryData[code] || {};
    const physical = parseFloat(item.physical) || 0;
    const system = parseFloat(item.system) || 0;
    return system - physical;
  };

  // Reduce Finished Goods Inventory for a single SKU
  const reduceFinishedGoodsInventory = async (sku, quantity, accessToken) => {
    try {
      console.log(`📦 Reducing Finished Goods Inventory: SKU=${sku}, Qty=${quantity}`);

      const rawData = await readSheetData('Finished Goods Inventory', 'A1:I1000', accessToken);
      if (!rawData || rawData.length < 2) {
        console.warn('⚠️ Finished Goods Inventory is empty or has no data');
        return { success: false, message: 'Finished Goods Inventory is empty', sku };
      }

      const headers = rawData[0];
      const inventory = parseSheetData(rawData);

      const skuColIndex = headers.findIndex(h => h && h.toLowerCase() === 'sku');
      const stockColIndex = headers.findIndex(h => h && h.toLowerCase().includes('current stock'));
      const lastUpdatedColIndex = headers.findIndex(h => h && h.toLowerCase().includes('last updated'));

      if (skuColIndex === -1 || stockColIndex === -1) {
        console.error('❌ Required columns not found in Finished Goods Inventory');
        return { success: false, message: 'Required columns not found', sku };
      }

      // Find matching row by SKU
      let matchIndex = -1;
      for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i];
        const itemSku = item['SKU'] || '';
        if (itemSku === sku) {
          matchIndex = i;
          break;
        }
      }

      if (matchIndex === -1) {
        console.warn(`⚠️ SKU "${sku}" not found in Finished Goods Inventory`);
        return { success: false, message: `SKU "${sku}" not found`, sku };
      }

      const currentStock = parseFloat(inventory[matchIndex]['Current Stock']) || 0;
      const newStock = Math.max(0, currentStock - quantity);
      const rowIndex = matchIndex + 2; // +2 for header row and 0-index

      console.log(`📊 SKU ${sku}: Current Stock: ${currentStock}, Reducing by: ${quantity}, New Stock: ${newStock}`);

      const stockColLetter = String.fromCharCode(65 + stockColIndex);
      await writeSheetData(
        'Finished Goods Inventory',
        `${stockColLetter}${rowIndex}`,
        [[newStock]],
        accessToken
      );

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
        sku,
        previousStock: currentStock,
        newStock: newStock,
        reduced: quantity
      };
    } catch (error) {
      console.error(`❌ Error reducing inventory for SKU ${sku}:`, error);
      return { success: false, message: error.message, sku };
    }
  };

  const handleSave = async () => {
    if (!currentRoute) {
      alert('Please select a route first');
      return;
    }

    // Check if Google Apps Script URL is configured
    const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (!SCRIPT_URL) {
      alert('⚠️ Configuration Error: VITE_GOOGLE_SCRIPT_URL is not set.\n\nPlease add your Google Apps Script URL to the environment variables in Netlify:\n1. Go to Site Settings → Environment Variables\n2. Add VITE_GOOGLE_SCRIPT_URL with your script URL\n3. Redeploy the site');
      return;
    }

    // Check if authenticated for inventory reduction
    const hasAuth = authHelper && authHelper.getAccessToken();

    setLoading(true);
    try {
      // Collect items with transfers
      const transferItems = [];
      const dataToSave = Object.entries(inventoryData)
        .filter(([code, data]) =>
          data.physical || data.transfer || data.addTransfer || data.system
        )
        .map(([code, data]) => {
          // Find product details
          let productInfo = null;
          let category = '';

          for (const [cat, products] of Object.entries(PRODUCT_CATALOG)) {
            const found = products.find(p => p.code === code);
            if (found) {
              productInfo = found;
              category = cat;
              break;
            }
          }

          // Track items with transfers for inventory reduction
          const transfer = parseFloat(data.transfer) || 0;
          const addTransfer = parseFloat(data.addTransfer) || 0;
          const totalTransfer = transfer + addTransfer;

          if (totalTransfer > 0) {
            transferItems.push({
              code,
              quantity: totalTransfer,
              category,
              name: productInfo?.name || ''
            });
          }

          return [
            inventoryDate,
            new Date().toLocaleTimeString(),
            currentRoute,
            category,
            code,
            productInfo?.name || '',
            parseFloat(data.physical) || 0,
            data.physicalUnit || 'bag',
            parseFloat(data.transfer) || 0,
            data.transferUnit || 'bag',
            parseFloat(data.addTransfer) || 0,
            data.addTransferUnit || 'bag',
            parseFloat(data.system) || 0,
            data.systemUnit || 'bag',
            calculateDifference(code),
            parseFloat(data.reimburse) || 0,
            'pcs'
          ];
        });

      if (dataToSave.length === 0) {
        alert('No data to save');
        return;
      }

      // Call Google Apps Script to save salesman inventory data
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'saveInventoryData',
          payload: JSON.stringify({
            route: currentRoute,
            date: inventoryDate,
            items: dataToSave
          })
        })
      });

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.data || 'Save failed');
      }

      // Now reduce Finished Goods Inventory for each transfer
      let inventoryResults = { success: 0, failed: 0, details: [] };

      if (hasAuth && transferItems.length > 0) {
        const accessToken = authHelper.getAccessToken();

        for (const item of transferItems) {
          const result = await reduceFinishedGoodsInventory(item.code, item.quantity, accessToken);
          if (result.success) {
            inventoryResults.success++;
            inventoryResults.details.push(`✅ ${item.code} (${item.name}): ${result.previousStock} → ${result.newStock}`);
          } else {
            inventoryResults.failed++;
            inventoryResults.details.push(`❌ ${item.code} (${item.name}): ${result.message}`);
          }
        }
      }

      // Build success message
      let message = `Data saved successfully! (${dataToSave.length} items)`;

      if (transferItems.length > 0) {
        if (hasAuth) {
          message += `\n\n📦 Finished Goods Inventory Updates:`;
          message += `\n• Successful: ${inventoryResults.success}`;
          message += `\n• Failed: ${inventoryResults.failed}`;
          if (inventoryResults.details.length > 0 && inventoryResults.details.length <= 5) {
            message += `\n\nDetails:\n${inventoryResults.details.join('\n')}`;
          }
        } else {
          message += `\n\n⚠️ ${transferItems.length} transfers recorded but Finished Goods Inventory was NOT reduced (not authenticated).`;
          message += `\nPlease sign in to enable automatic inventory reduction.`;
        }
      }

      alert(message);

      // Clear form
      setInventoryData({});
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Authentication Warning */}
      {(!authHelper || !authHelper.getAccessToken()) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <strong>⚠️ Note:</strong> You are not signed in. Salesman inventory data will be saved, but Finished Goods Inventory will NOT be automatically reduced. Please sign in to enable automatic inventory updates.
        </div>
      )}

      {/* Route Selection */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">🚚 Select Sales Route</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {ROUTES.map(route => (
            <button
              key={route}
              onClick={() => setCurrentRoute(route)}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                currentRoute === route
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {route}
            </button>
          ))}
        </div>
      </div>

      {/* Date Selection */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">📅 Inventory Date</h3>
        <input
          type="date"
          value={inventoryDate}
          onChange={(e) => setInventoryDate(e.target.value)}
          className="input max-w-xs"
        />
        {currentRoute && (
          <div className="mt-3 inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
            <span className="font-semibold">Current Route:</span>
            <span className="ml-2">{currentRoute}</span>
          </div>
        )}
      </div>

      {/* Product Categories */}
      {!currentRoute ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-lg text-gray-600">Select a route to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(PRODUCT_CATALOG).map(([category, products]) => (
            <div key={category} className="card">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{CATEGORY_ICONS[category]}</span>
                  <span className="text-xl font-bold">{category.toUpperCase()}</span>
                </div>
                <span className="text-2xl">
                  {expandedCategories.has(category) ? '▼' : '▶'}
                </span>
              </button>

              {expandedCategories.has(category) && (
                <div className="mt-4 space-y-4">
                  {products.map(product => {
                    const itemData = inventoryData[product.code] || {};
                    const diff = calculateDifference(product.code);

                    return (
                      <div key={product.code} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {/* Product Header */}
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <span className="inline-block bg-primary-600 text-white px-3 py-1 rounded font-bold text-sm">
                              {product.code}
                            </span>
                            <span className="ml-3 font-semibold text-gray-900">
                              {product.name}
                            </span>
                          </div>
                          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">
                            SAR {product.price}
                          </span>
                        </div>

                        {/* Input Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Physical Stock */}
                          <div>
                            <label className="label">📦 Physical Stock</label>
                            <input
                              type="number"
                              value={itemData.physical || ''}
                              onChange={(e) => updateInventoryItem(product.code, 'physical', e.target.value)}
                              className="input"
                              placeholder="0"
                              min="0"
                            />
                          </div>

                          {/* Transfer */}
                          <div>
                            <label className="label">🚚 Stock Transfer</label>
                            <input
                              type="number"
                              value={itemData.transfer || ''}
                              onChange={(e) => updateInventoryItem(product.code, 'transfer', e.target.value)}
                              className="input"
                              placeholder="0"
                              min="0"
                            />
                          </div>

                          {/* Additional Transfer */}
                          <div>
                            <label className="label">➕ Additional Transfer</label>
                            <input
                              type="number"
                              value={itemData.addTransfer || ''}
                              onChange={(e) => updateInventoryItem(product.code, 'addTransfer', e.target.value)}
                              className="input"
                              placeholder="0"
                              min="0"
                            />
                          </div>

                          {/* System Stock */}
                          <div>
                            <label className="label">💻 System Stock</label>
                            <input
                              type="number"
                              value={itemData.system || ''}
                              onChange={(e) => updateInventoryItem(product.code, 'system', e.target.value)}
                              className="input"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                        </div>

                        {/* Difference Display */}
                        {(itemData.physical || itemData.system) && (
                          <div className="mt-4 p-3 bg-white rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Difference:</span>
                              <span className={`text-2xl font-bold ${
                                diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {diff}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      {currentRoute && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-end space-x-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary px-8 py-3 text-lg font-bold disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>💾 Save & Update Inventory</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
