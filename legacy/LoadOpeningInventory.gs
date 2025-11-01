/**
 * Load Opening Inventory Data for Google Apps Script
 * Utility to batch load opening inventory items into Raw Material Inventory
 */

var OPENING_INVENTORY_ITEMS = [
  // SUNFLOWER SEEDS
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds T6 (230-240) 20kg New',
    category: 'Base Item',
    unit: 'unit',
    quantity: 8112,
    supplier: 'SEEHIGH',
    batchNumber: 'BATCH-2025-001',
    expiryDate: '2027-05-31',
    unitPrice: 130,
    notes: 'Grade: T6 | Size: 230-240 | Unit Weight: 20 kg | Status: New'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds T6 (230-240) Old',
    category: 'Base Item',
    unit: 'unit',
    quantity: 40,
    supplier: 'SEEHIGH',
    batchNumber: 'BATCH-2025-002',
    expiryDate: '2026-10-31',
    unitPrice: 130,
    notes: 'Grade: T6 | Size: 230-240 | Status: Old'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds T6 (240-250)',
    category: 'Base Item',
    unit: 'unit',
    quantity: 566,
    supplier: 'SEEHIGH',
    batchNumber: 'BATCH-2025-003',
    expiryDate: '2026-10-31',
    unitPrice: 130,
    notes: 'Grade: T6 | Size: 240-250'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds 361 (240-250)',
    category: 'Base Item',
    unit: 'unit',
    quantity: 29,
    supplier: 'SEEHIGH',
    batchNumber: 'BATCH-2025-004',
    expiryDate: '2026-09-30',
    unitPrice: 130,
    notes: 'Grade: 361 | Size: 240-250 | Unit Weight: 25 kg'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds 361 (230-240)',
    category: 'Base Item',
    unit: 'unit',
    quantity: 1064,
    supplier: 'SEEHIGH',
    batchNumber: 'BATCH-2025-005',
    expiryDate: '2026-06-30',
    unitPrice: 130,
    notes: 'Grade: 361 | Size: 230-240 | Unit Weight: 25 kg'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds NUTS & CO (230-240) & (240-250)',
    category: 'Base Item',
    unit: 'unit',
    quantity: 1827,
    supplier: 'NUTS & CO',
    batchNumber: 'BATCH-2025-006',
    expiryDate: '2026-09-30',
    unitPrice: 130,
    notes: 'Mixed Sizes: 230-240 & 240-250'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds 361 (240-250) CHINA',
    category: 'Base Item',
    unit: 'unit',
    quantity: 1541,
    supplier: 'CHINA',
    batchNumber: 'BATCH-2025-007',
    expiryDate: '2026-09-30',
    unitPrice: 130,
    notes: 'Grade: 361 | Size: 240-250 | Unit Weight: 25 kg | Origin: China'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds 361 (290-300)',
    category: 'Base Item',
    unit: 'unit',
    quantity: 18,
    supplier: 'SEEHIGH',
    batchNumber: 'BATCH-2025-008',
    expiryDate: '2026-10-31',
    unitPrice: 130,
    notes: 'Grade: 361 | Size: 290-300 | Unit Weight: 25 kg'
  },
  {
    date: '2025-01-01',
    material: 'Pumpkin Seeds ARS 10mm',
    category: 'Base Item',
    unit: 'unit',
    quantity: 152,
    supplier: 'ARS',
    batchNumber: 'BATCH-2025-009',
    expiryDate: '2026-10-31',
    unitPrice: 130,
    notes: 'Size: 10mm | Supplier: ARS'
  },
  {
    date: '2025-01-01',
    material: 'Popcorn (NOURIZ)',
    category: 'Seeds',
    unit: 'unit',
    quantity: 165,
    supplier: 'NOURIZ',
    batchNumber: 'BATCH-2025-011',
    expiryDate: '2026-03-31',
    unitPrice: 130,
    notes: 'Brand: NOURIZ | Status: Regular'
  },
  {
    date: '2025-01-01',
    material: 'Melon Seeds Egypt',
    category: 'Seeds',
    unit: 'unit',
    quantity: 127,
    supplier: 'ARS',
    batchNumber: 'BATCH-2025-013',
    expiryDate: '2026-05-31',
    unitPrice: 130,
    notes: 'Origin: Egypt | Unit Weight: 25 kg | Supplier: ARS'
  },
  {
    date: '2025-01-01',
    material: 'Melon Seeds AL WALEED',
    category: 'Seeds',
    unit: 'unit',
    quantity: 5,
    supplier: 'AL WALEED',
    batchNumber: 'BATCH-2025-014',
    expiryDate: '2027-05-31',
    unitPrice: 130,
    notes: 'Brand: AL WALEED | Unit Weight: 25 kg'
  },
  {
    date: '2025-01-01',
    material: 'Melon Seeds AL WALEED',
    category: 'Seeds',
    unit: 'unit',
    quantity: 96,
    supplier: 'AL WALEED',
    batchNumber: 'BATCH-2025-015',
    expiryDate: '2025-12-31',
    unitPrice: 130,
    notes: 'Brand: AL WALEED | Unit Weight: 50 kg | CRITICAL: Near Expiry'
  },
  {
    date: '2025-01-01',
    material: 'Melon Seeds AL WALEED BLUE',
    category: 'Seeds',
    unit: 'unit',
    quantity: 15,
    supplier: 'AL WALEED',
    batchNumber: 'BATCH-2025-016',
    expiryDate: '2026-08-31',
    unitPrice: 130,
    notes: 'Brand: AL WALEED BLUE | Unit Weight: 50 kg'
  }
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
