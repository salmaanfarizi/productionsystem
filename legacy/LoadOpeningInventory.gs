/**
 * Load Opening Inventory Data for Google Apps Script
 * Utility to batch load opening inventory items into Raw Material Inventory
 */

// Opening Inventory Data - Update this array with actual data
var OPENING_INVENTORY_ITEMS = [
  // Example format:
  // {
  //   date: '2025-01-01',
  //   material: 'Sunflower Seeds',
  //   category: 'Base Item',
  //   unit: 'KG',
  //   quantity: 5000,
  //   supplier: 'ABC Suppliers',
  //   batchNumber: 'BATCH-2025-001',
  //   expiryDate: '2025-12-31',
  //   unitPrice: 2.50,
  //   notes: 'Grade: T6 | Size: 240-250 | Unit Weight: 25 kg | ID: See High'
  // },
  // Add your opening inventory items here...
];

/**
 * Load opening inventory items to Google Sheets
 */
function loadOpeningInventoryGS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inventorySheet = ss.getSheetByName('Raw Material Inventory');
  var transactionSheet = ss.getSheetByName('Raw Material Transactions');

  if (!inventorySheet) {
    throw new Error('Raw Material Inventory sheet not found');
  }

  if (!transactionSheet) {
    throw new Error('Raw Material Transactions sheet not found');
  }

  // Check if there are items to load
  if (OPENING_INVENTORY_ITEMS.length === 0) {
    throw new Error('No opening inventory items to load. Please add items to OPENING_INVENTORY_ITEMS array.');
  }

  var results = {
    success: [],
    failed: []
  };

  for (var i = 0; i < OPENING_INVENTORY_ITEMS.length; i++) {
    var item = OPENING_INVENTORY_ITEMS[i];

    try {
      // Validate required fields
      if (!item.date || !item.material || !item.category || !item.unit || item.quantity === undefined) {
        throw new Error('Missing required fields: date, material, category, unit, or quantity');
      }

      var quantity = parseFloat(item.quantity);
      var unitPrice = parseFloat(item.unitPrice) || 0;

      // Validate quantity is a valid number
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Invalid quantity: ' + item.quantity);
      }

      var totalCost = quantity * unitPrice;

      // Prepare inventory row
      var inventoryRow = [
        item.date,
        item.material,
        item.category,
        item.unit,
        quantity.toFixed(2),
        item.supplier || 'N/A',
        item.batchNumber || 'N/A',
        item.expiryDate || 'N/A',
        unitPrice.toFixed(2),
        totalCost.toFixed(2),
        'ACTIVE',
        new Date().toISOString(),
        item.notes || 'Opening Inventory'
      ];

      // Add to Raw Material Inventory
      inventorySheet.appendRow(inventoryRow);

      // Prepare transaction row
      var transactionRow = [
        new Date().toISOString(),
        item.date,
        'Stock In',
        item.material,
        item.category,
        item.unit,
        quantity.toFixed(2),
        '0',
        item.supplier || 'N/A',
        item.batchNumber || 'N/A',
        unitPrice.toFixed(2),
        totalCost.toFixed(2),
        item.notes || 'Opening Inventory',
        'System'
      ];

      // Add to Transaction History
      transactionSheet.appendRow(transactionRow);

      results.success.push(item.material);

    } catch (error) {
      Logger.log('Failed to load ' + item.material + ': ' + error.toString());
      results.failed.push({
        material: item.material,
        error: error.toString()
      });
    }
  }

  // Show results
  var ui = SpreadsheetApp.getUi();
  var message = 'Opening Inventory Load Complete\n\n';
  message += 'Success: ' + results.success.length + ' items\n';

  if (results.failed.length > 0) {
    message += 'Failed: ' + results.failed.length + ' items\n\n';
    message += 'Failed items:\n';
    for (var i = 0; i < results.failed.length; i++) {
      message += '- ' + results.failed[i].material + ': ' + results.failed[i].error + '\n';
    }
  }

  ui.alert('Load Opening Inventory', message, ui.ButtonSet.OK);

  return results;
}

/**
 * Create custom menu
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Opening Inventory')
    .addItem('Load Opening Inventory', 'loadOpeningInventoryGS')
    .addToUi();
}
