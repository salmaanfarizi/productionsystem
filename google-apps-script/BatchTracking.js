/**
 * ========================================
 * PRODUCTION SYSTEM - BATCH TRACKING v3.0
 * Integrated with Production, Packing, and Inventory Apps
 * Includes Seed Variety Support
 * ========================================
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
  SHEETS: {
    PRODUCTION_DATA: 'Production Data',
    WIP_INVENTORY: 'WIP Inventory',
    BATCH_TRACKING: 'Batch Tracking',
    PACKING_TRANSFERS: 'Packing Transfers',
    FINISHED_GOODS: 'Finished Goods Inventory',
    STOCK_OUTWARDS: 'Stock Outwards',
    SETTINGS: 'Settings'
  },

  // WIP Batch Prefixes by Product Type
  BATCH_PREFIX: {
    'Sunflower Seeds': 'SUN',
    'Melon Seeds': 'MEL',
    'Pumpkin Seeds': 'PUM',
    'Peanuts': 'PEA'
  },

  // Seed Varieties by Product
  SEED_VARIETIES: {
    'Sunflower Seeds': ['T6', '361', '363', '601', 'S9'],
    'Melon Seeds': ['Shabah', 'Roomy'],
    'Pumpkin Seeds': ['Shine Skin', 'Lady Nail'],
    'Peanuts': []
  },

  COLORS: {
    ACTIVE: '#d4edda',
    CONSUMED: '#f8d7da',
    WARNING: '#fff3cd',
    HEADER: '#1f4e79'
  },

  NORMAL_LOSS_PERCENT: 2 // 2% normal loss in production
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get active spreadsheet
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Get sheet with error handling
 */
function getSheet(sheetName, createIfMissing = false) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet && createIfMissing) {
    sheet = ss.insertSheet(sheetName);
  }

  return sheet;
}

/**
 * Safe number parsing
 */
function safeParseFloat(value, defaultValue = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Format date consistently
 */
function formatDate(date, format = 'yyyy-MM-dd') {
  if (!date) return '';
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), format);
}

/**
 * Validate required data
 */
function validateData(data, requiredFields) {
  const errors = [];

  requiredFields.forEach(field => {
    if (!data[field] || data[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// ==================== SHEET INITIALIZATION ====================

/**
 * Initialize all required sheets
 */
function initializeSheets() {
  try {
    initProductionDataSheet();
    initWIPInventorySheet();
    initBatchTrackingSheet();
    initPackingTransfersSheet();
    initFinishedGoodsSheet();
    initStockOutwardsSheet();
    initSettingsSheet();

    return {
      success: true,
      message: 'All sheets initialized successfully!\n\nSheets created/updated:\n• Production Data\n• WIP Inventory\n• Batch Tracking\n• Packing Transfers\n• Finished Goods Inventory\n• Stock Outwards\n• Settings (Dynamic Configuration)'
    };
  } catch (error) {
    Logger.log('Error initializing sheets: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

/**
 * Initialize Production Data sheet (18 columns)
 */
function initProductionDataSheet() {
  let sheet = getSheet(CONFIG.SHEETS.PRODUCTION_DATA);

  if (!sheet || sheet.getLastRow() === 0) {
    if (!sheet) {
      sheet = getSheet(CONFIG.SHEETS.PRODUCTION_DATA, true);
    }

    const headers = [
      'Date',
      'Product Type',
      'Seed Variety',
      'Size Range',
      'Variant/Region',
      'Bag Type',
      'Number of Bags',
      'Total Raw Material (T)',
      'Salt Added (kg)',
      'Normal Loss (T)',
      'WIP Weight (T)',
      'Employee',
      'Truck/Transport',
      'Shift',
      'Line',
      'Notes',
      'Batch ID',
      'Created At'
    ];

    sheet.appendRow(headers);
    formatHeaderRow(sheet, headers.length);
  }

  return sheet;
}

/**
 * Initialize WIP Inventory sheet (13 columns)
 */
function initWIPInventorySheet() {
  let sheet = getSheet(CONFIG.SHEETS.WIP_INVENTORY);

  if (!sheet || sheet.getLastRow() === 0) {
    if (!sheet) {
      sheet = getSheet(CONFIG.SHEETS.WIP_INVENTORY, true);
    }

    const headers = [
      'WIP Batch ID',
      'Production Date',
      'Product Type',
      'Seed Variety',
      'Size Range',
      'Variant/Region',
      'Initial WIP (T)',
      'Consumed (T)',
      'Remaining (T)',
      'Status',
      'Created At',
      'Completed At',
      'Notes'
    ];

    sheet.appendRow(headers);
    formatHeaderRow(sheet, headers.length);

    // Add data validation for Status
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['ACTIVE', 'CONSUMED', 'ON_HOLD'], true)
      .build();
    sheet.getRange(2, 10, 1000).setDataValidation(statusRule);
  }

  return sheet;
}

/**
 * Initialize Batch Tracking sheet (13 columns)
 */
function initBatchTrackingSheet() {
  let sheet = getSheet(CONFIG.SHEETS.BATCH_TRACKING);

  if (!sheet || sheet.getLastRow() === 0) {
    if (!sheet) {
      sheet = getSheet(CONFIG.SHEETS.BATCH_TRACKING, true);
    }

    const headers = [
      'Timestamp',
      'WIP Batch ID',
      'Product Type',
      'Seed Variety',
      'Size Range',
      'Variant/Region',
      'Action',
      'Weight Change (T)',
      'Running Balance (T)',
      'Department',
      'User',
      'Reference',
      'Notes'
    ];

    sheet.appendRow(headers);
    formatHeaderRow(sheet, headers.length);
  }

  return sheet;
}

/**
 * Initialize Packing Transfers sheet
 */
function initPackingTransfersSheet() {
  let sheet = getSheet(CONFIG.SHEETS.PACKING_TRANSFERS);

  if (!sheet || sheet.getLastRow() === 0) {
    if (!sheet) {
      sheet = getSheet(CONFIG.SHEETS.PACKING_TRANSFERS, true);
    }

    const headers = [
      'Transfer ID',
      'Date',
      'Product Type',
      'Region',
      'SKU',
      'SKU Description',
      'Units Packed',
      'WIP Consumed (T)',
      'WIP Batch ID',
      'Operator',
      'Shift',
      'Line',
      'Notes',
      'Created At'
    ];

    sheet.appendRow(headers);
    formatHeaderRow(sheet, headers.length);
  }

  return sheet;
}

/**
 * Initialize Finished Goods Inventory sheet
 */
function initFinishedGoodsSheet() {
  let sheet = getSheet(CONFIG.SHEETS.FINISHED_GOODS);

  if (!sheet || sheet.getLastRow() === 0) {
    if (!sheet) {
      sheet = getSheet(CONFIG.SHEETS.FINISHED_GOODS, true);
    }

    const headers = [
      'SKU',
      'Product Type',
      'Region',
      'Package Size',
      'Current Stock',
      'Minimum Stock',
      'Status',
      'Last Updated',
      'Notes'
    ];

    sheet.appendRow(headers);
    formatHeaderRow(sheet, headers.length);
  }

  return sheet;
}

/**
 * Initialize Stock Outwards sheet
 */
function initStockOutwardsSheet() {
  let sheet = getSheet(CONFIG.SHEETS.STOCK_OUTWARDS);

  if (!sheet || sheet.getLastRow() === 0) {
    if (!sheet) {
      sheet = getSheet(CONFIG.SHEETS.STOCK_OUTWARDS, true);
    }

    const headers = [
      'Date',
      'Category',
      'SKU',
      'Product Type',
      'Package Size',
      'Region',
      'Quantity',
      'Customer',
      'Invoice',
      'Notes',
      'Source',
      'Timestamp'
    ];

    sheet.appendRow(headers);
    formatHeaderRow(sheet, headers.length);

    // Add data validation for Category
    const categoryRule = SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Salesman Transfer',
        'Damaged Goods',
        'Sample/Promotion',
        'Return to Supplier',
        'Internal Use',
        'Other'
      ], true)
      .build();
    sheet.getRange(2, 2, 1000).setDataValidation(categoryRule);

    // Add data validation for Source
    const sourceRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['manual', 'arsinv'], true)
      .build();
    sheet.getRange(2, 11, 1000).setDataValidation(sourceRule);
  }

  return sheet;
}

/**
 * Initialize Settings sheet - Dynamic configuration for all apps
 * This sheet contains all configurable data that was previously hardcoded
 */
function initSettingsSheet() {
  let sheet = getSheet(CONFIG.SHEETS.SETTINGS);

  // If sheet exists, clear it completely
  if (sheet) {
    sheet.clear();
  } else {
    sheet = getSheet(CONFIG.SHEETS.SETTINGS, true);
  }

  let currentRow = 1;

  // ========== SECTION 1: PRODUCTS ==========
  sheet.getRange(currentRow, 1).setValue('PRODUCTS');
  sheet.getRange(currentRow, 1, 1, 3).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 3).setValues([['Product Code', 'Product Name', 'Batch Prefix']]);
  sheet.getRange(currentRow, 1, 1, 3).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const products = [
    ['SUNFLOWER', 'Sunflower Seeds', 'SUN'],
    ['MELON', 'Melon Seeds', 'MEL'],
    ['PUMPKIN', 'Pumpkin Seeds', 'PUM'],
    ['PEANUTS', 'Peanuts', 'PEA']
  ];
  sheet.getRange(currentRow, 1, products.length, 3).setValues(products);
  currentRow += products.length + 2;

  // ========== SECTION 2: SEED VARIETIES ==========
  sheet.getRange(currentRow, 1).setValue('SEED VARIETIES');
  sheet.getRange(currentRow, 1, 1, 3).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 3).setValues([['Product Type', 'Variety Code', 'Variety Name']]);
  sheet.getRange(currentRow, 1, 1, 3).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const varieties = [
    ['Sunflower Seeds', 'T6', 'T6'],
    ['Sunflower Seeds', '361', '361'],
    ['Sunflower Seeds', '363', '363'],
    ['Sunflower Seeds', '601', '601'],
    ['Sunflower Seeds', 'S9', 'S9'],
    ['Melon Seeds', 'SHABAH', 'Shabah'],
    ['Melon Seeds', 'ROOMY', 'Roomy'],
    ['Pumpkin Seeds', 'SHINE_SKIN', 'Shine Skin'],
    ['Pumpkin Seeds', 'LADY_NAIL', 'Lady Nail']
  ];
  sheet.getRange(currentRow, 1, varieties.length, 3).setValues(varieties);
  currentRow += varieties.length + 2;

  // ========== SECTION 3: SUNFLOWER SIZES ==========
  sheet.getRange(currentRow, 1).setValue('SUNFLOWER SIZE RANGES');
  sheet.getRange(currentRow, 1, 1, 2).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 2).setValues([['Size Code', 'Size Range']]);
  sheet.getRange(currentRow, 1, 1, 2).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const sizes = [
    ['200-210', '200-210'],
    ['210-220', '210-220'],
    ['220-230', '220-230'],
    ['230-240', '230-240'],
    ['240-250', '240-250'],
    ['250-260', '250-260'],
    ['260-270', '260-270'],
    ['270-280', '270-280'],
    ['280-290', '280-290'],
    ['290-300', '290-300']
  ];
  sheet.getRange(currentRow, 1, sizes.length, 2).setValues(sizes);
  currentRow += sizes.length + 2;

  // ========== SECTION 4: REGIONS/VARIANTS ==========
  sheet.getRange(currentRow, 1).setValue('REGIONS / VARIANTS');
  sheet.getRange(currentRow, 1, 1, 2).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 2).setValues([['Region Code', 'Region Name']]);
  sheet.getRange(currentRow, 1, 1, 2).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const regions = [
    ['EASTERN', 'Eastern Province'],
    ['RIYADH', 'Riyadh'],
    ['BAHRAIN', 'Bahrain'],
    ['QATAR', 'Qatar']
  ];
  sheet.getRange(currentRow, 1, regions.length, 2).setValues(regions);
  currentRow += regions.length + 2;

  // ========== SECTION 5: EMPLOYEES ==========
  sheet.getRange(currentRow, 1).setValue('EMPLOYEES');
  sheet.getRange(currentRow, 1, 1, 3).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 3).setValues([['Employee ID', 'Employee Name', 'Status']]);
  sheet.getRange(currentRow, 1, 1, 3).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const employees = [
    ['EMP001', 'Sikander', 'Active'],
    ['EMP002', 'Shihan', 'Active'],
    ['EMP003', 'Ajmal Ihjas', 'Active'],
    ['EMP004', 'Ram', 'Active'],
    ['EMP005', 'Mushraf', 'Active'],
    ['EMP006', 'Ugrah', 'Active']
  ];
  sheet.getRange(currentRow, 1, employees.length, 3).setValues(employees);
  currentRow += employees.length + 2;

  // ========== SECTION 6: BAG TYPES ==========
  sheet.getRange(currentRow, 1).setValue('BAG TYPES');
  sheet.getRange(currentRow, 1, 1, 3).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 3).setValues([['Bag Code', 'Bag Label', 'Weight (kg)']]);
  sheet.getRange(currentRow, 1, 1, 3).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const bagTypes = [
    ['25KG', '25 kg', 25],
    ['20KG', '20 kg', 20],
    ['OTHER', 'Other (Enter Weight)', 0]
  ];
  sheet.getRange(currentRow, 1, bagTypes.length, 3).setValues(bagTypes);
  currentRow += bagTypes.length + 2;

  // ========== SECTION 7: DIESEL TRUCKS ==========
  sheet.getRange(currentRow, 1).setValue('DIESEL TRUCKS');
  sheet.getRange(currentRow, 1, 1, 3).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 3).setValues([['Truck Code', 'Label', 'Capacity (L)']]);
  sheet.getRange(currentRow, 1, 1, 3).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const dieselTrucks = [
    ['SMALL', 'Small (6,000 L)', 6000],
    ['MEDIUM', 'Medium (7,000 L)', 7000],
    ['LARGE', 'Large (15,000 L)', 15000]
  ];
  sheet.getRange(currentRow, 1, dieselTrucks.length, 3).setValues(dieselTrucks);
  currentRow += dieselTrucks.length + 2;

  // ========== SECTION 8: WASTEWATER TRUCKS ==========
  sheet.getRange(currentRow, 1).setValue('WASTEWATER TRUCKS');
  sheet.getRange(currentRow, 1, 1, 3).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 3).setValues([['Truck Code', 'Label', 'Capacity (L)']]);
  sheet.getRange(currentRow, 1, 1, 3).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const wastewaterTrucks = [
    ['SMALL_WW', 'Small (10,000 L)', 10000],
    ['LARGE_WW', 'Large (22,000 L)', 22000]
  ];
  sheet.getRange(currentRow, 1, wastewaterTrucks.length, 3).setValues(wastewaterTrucks);
  currentRow += wastewaterTrucks.length + 2;

  // ========== SECTION 9: ROUTES ==========
  sheet.getRange(currentRow, 1).setValue('DELIVERY ROUTES');
  sheet.getRange(currentRow, 1, 1, 4).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 4).setValues([['Route Code', 'Route Name', 'Region', 'Status']]);
  sheet.getRange(currentRow, 1, 1, 4).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const routes = [
    ['RT001', 'Eastern Province Main', 'Eastern Province', 'Active'],
    ['RT002', 'Riyadh Central', 'Riyadh', 'Active'],
    ['RT003', 'Bahrain Export', 'Bahrain', 'Active'],
    ['RT004', 'Qatar Export', 'Qatar', 'Active']
  ];
  sheet.getRange(currentRow, 1, routes.length, 4).setValues(routes);
  currentRow += routes.length + 2;

  // ========== SECTION 10: SYSTEM CONFIGURATION ==========
  sheet.getRange(currentRow, 1).setValue('SYSTEM CONFIGURATION');
  sheet.getRange(currentRow, 1, 1, 3).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 3).setValues([['Config Key', 'Config Value', 'Description']]);
  sheet.getRange(currentRow, 1, 1, 3).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const systemConfig = [
    ['NORMAL_LOSS_PERCENT', 2, 'Normal production loss percentage'],
    ['SALT_BAG_WEIGHT', 50, 'Salt bag weight in kg'],
    ['LOW_STOCK_THRESHOLD', 100, 'Low stock alert threshold in kg']
  ];
  sheet.getRange(currentRow, 1, systemConfig.length, 3).setValues(systemConfig);
  currentRow += systemConfig.length + 2;

  // ========== SECTION 11: OPENING BALANCES ==========
  sheet.getRange(currentRow, 1).setValue('OPENING BALANCES');
  sheet.getRange(currentRow, 1, 1, 5).merge();
  sheet.getRange(currentRow, 1).setBackground('#1f4e79').setFontColor('white').setFontWeight('bold').setFontSize(12);
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 5).setValues([['Item Type', 'Item Name', 'Opening Quantity', 'Unit', 'Date']]);
  sheet.getRange(currentRow, 1, 1, 5).setBackground('#4472c4').setFontColor('white').setFontWeight('bold');
  currentRow++;

  const openingBalances = [
    ['Raw Material', 'Sunflower Seeds - T6', 0, 'kg', new Date()],
    ['Raw Material', 'Melon Seeds - Shabah', 0, 'kg', new Date()],
    ['Finished Goods', 'Sunflower 25kg', 0, 'bags', new Date()],
    ['Consumables', 'Salt', 0, 'bags', new Date()]
  ];
  sheet.getRange(currentRow, 1, openingBalances.length, 5).setValues(openingBalances);

  // Auto-resize columns
  sheet.autoResizeColumns(1, 5);

  // Freeze header rows
  sheet.setFrozenRows(1);

  return sheet;
}

/**
 * Format header row
 */
function formatHeaderRow(sheet, columnCount) {
  const headerRange = sheet.getRange(1, 1, 1, columnCount);
  headerRange.setBackground(CONFIG.COLORS.HEADER);
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setWrap(true);
  sheet.setFrozenRows(1);
}

// ==================== PRODUCTION & WIP BATCH CREATION ====================

/**
 * Create WIP batch from production entry
 * This should be called automatically when production data is entered
 */
function createWIPFromProduction(productionRow) {
  try {
    const prodSheet = getSheet(CONFIG.SHEETS.PRODUCTION_DATA);

    if (!prodSheet) {
      throw new Error('Production Data sheet not found');
    }

    // Read production data (18 columns)
    const data = prodSheet.getRange(productionRow, 1, 1, 18).getValues()[0];

    const productionData = {
      date: data[0],
      productType: data[1],
      seedVariety: data[2] || 'N/A',
      sizeRange: data[3] || 'N/A',
      variant: data[4] || '',
      bagType: data[5],
      numBags: safeParseFloat(data[6]),
      rawMaterial: safeParseFloat(data[7]),
      salt: safeParseFloat(data[8]),
      normalLoss: safeParseFloat(data[9]),
      wipWeight: safeParseFloat(data[10]),
      employee: data[11] || '',
      truck: data[12] || '',
      shift: data[13] || '',
      line: data[14] || '',
      notes: data[15] || ''
    };

    // Validate
    if (!productionData.productType || productionData.wipWeight <= 0) {
      return {
        success: false,
        message: 'Invalid production data: missing product type or WIP weight'
      };
    }

    // Generate WIP Batch ID
    const batchId = generateWIPBatchId(
      productionData.productType,
      productionData.date
    );

    // Create WIP Inventory record
    const wipResult = createWIPInventoryRecord({
      batchId: batchId,
      productionDate: productionData.date,
      productType: productionData.productType,
      seedVariety: productionData.seedVariety,
      sizeRange: productionData.sizeRange,
      variant: productionData.variant,
      wipWeight: productionData.wipWeight,
      notes: `From production row ${productionRow}`
    });

    if (!wipResult.success) {
      return wipResult;
    }

    // Update Production Data with Batch ID
    prodSheet.getRange(productionRow, 17).setValue(batchId);
    prodSheet.getRange(productionRow, 18).setValue(new Date());

    // Log to Batch Tracking
    logBatchAction({
      batchId: batchId,
      productType: productionData.productType,
      seedVariety: productionData.seedVariety,
      sizeRange: productionData.sizeRange,
      variant: productionData.variant,
      action: 'CREATED',
      weightChange: productionData.wipWeight,
      runningBalance: productionData.wipWeight,
      department: 'Production',
      user: Session.getActiveUser().getEmail(),
      reference: `Production Row ${productionRow}`,
      notes: `Initial WIP creation: ${productionData.wipWeight}T`
    });

    return {
      success: true,
      message: `WIP batch created: ${batchId}`,
      batchId: batchId
    };

  } catch (error) {
    Logger.log('Error creating WIP batch: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

/**
 * Generate WIP Batch ID
 * Format: WIP-{PREFIX}-{YYMMDD}-{SEQ}
 * Example: WIP-SUN-241023-001
 */
function generateWIPBatchId(productType, date) {
  const prefix = CONFIG.BATCH_PREFIX[productType] || 'WIP';
  const dateStr = formatDate(date, 'yyMMdd');
  const sequence = getNextWIPSequence(prefix, dateStr);

  return `WIP-${prefix}-${dateStr}-${sequence}`;
}

/**
 * Get next WIP sequence number for the day
 */
function getNextWIPSequence(prefix, dateStr) {
  const wipSheet = getSheet(CONFIG.SHEETS.WIP_INVENTORY);

  if (!wipSheet || wipSheet.getLastRow() <= 1) {
    return '001';
  }

  const data = wipSheet.getRange(2, 1, wipSheet.getLastRow() - 1, 1).getValues();
  let maxSequence = 0;

  const pattern = `WIP-${prefix}-${dateStr}-`;

  data.forEach(row => {
    const batchId = row[0];
    if (batchId && batchId.toString().startsWith(pattern)) {
      const parts = batchId.toString().split('-');
      const sequence = parseInt(parts[parts.length - 1]);
      if (!isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  });

  return String(maxSequence + 1).padStart(3, '0');
}

/**
 * Create WIP Inventory record
 */
function createWIPInventoryRecord(params) {
  try {
    const wipSheet = getSheet(CONFIG.SHEETS.WIP_INVENTORY);

    if (!wipSheet) {
      throw new Error('WIP Inventory sheet not found');
    }

    const now = new Date();

    // WIP Inventory row (13 columns)
    const row = [
      params.batchId,                    // A: WIP Batch ID
      params.productionDate,             // B: Production Date
      params.productType,                // C: Product Type
      params.seedVariety || 'N/A',       // D: Seed Variety
      params.sizeRange || 'N/A',         // E: Size Range
      params.variant || '',              // F: Variant/Region
      params.wipWeight,                  // G: Initial WIP (T)
      0,                                 // H: Consumed (T)
      params.wipWeight,                  // I: Remaining (T)
      'ACTIVE',                          // J: Status
      now,                               // K: Created At
      '',                                // L: Completed At
      params.notes || ''                 // M: Notes
    ];

    wipSheet.appendRow(row);

    // Format the new row
    const lastRow = wipSheet.getLastRow();
    wipSheet.getRange(lastRow, 10).setBackground(CONFIG.COLORS.ACTIVE);

    return {
      success: true,
      message: 'WIP inventory record created',
      batchId: params.batchId
    };

  } catch (error) {
    Logger.log('Error creating WIP record: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

// ==================== PACKING CONSUMPTION ====================

/**
 * Process WIP consumption from packing
 * Called when packing entry is submitted
 */
function consumeWIPForPacking(packingData) {
  try {
    // Validate input
    const validation = validateData(packingData, [
      'productType',
      'wipConsumed',
      'sku'
    ]);

    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed: ' + validation.errors.join(', ')
      };
    }

    // Find available WIP batch (FIFO)
    const batch = findAvailableWIPBatch(
      packingData.productType,
      packingData.sizeRange || '',
      packingData.region || ''
    );

    if (!batch) {
      return {
        success: false,
        message: `No WIP available for ${packingData.productType}`
      };
    }

    const wipConsumed = safeParseFloat(packingData.wipConsumed);

    if (wipConsumed > batch.remaining) {
      return {
        success: false,
        message: `Insufficient WIP. Available: ${batch.remaining}T, Requested: ${wipConsumed}T`
      };
    }

    // Update WIP Inventory
    const updateResult = updateWIPConsumption(batch.batchId, wipConsumed, batch.rowNumber);

    if (!updateResult.success) {
      return updateResult;
    }

    // Create Packing Transfer record
    const transferId = generateTransferId(packingData.date);
    createPackingTransferRecord({
      transferId: transferId,
      date: packingData.date,
      productType: packingData.productType,
      region: packingData.region || '',
      sku: packingData.sku,
      skuDescription: packingData.skuDescription || '',
      unitsPacked: packingData.unitsPacked,
      wipConsumed: wipConsumed,
      wipBatchId: batch.batchId,
      operator: packingData.operator || '',
      shift: packingData.shift || '',
      line: packingData.line || '',
      notes: packingData.notes || ''
    });

    // Update Finished Goods Inventory
    updateFinishedGoodsInventory({
      sku: packingData.sku,
      productType: packingData.productType,
      region: packingData.region || '',
      packageSize: packingData.packageSize || '',
      unitsAdded: packingData.unitsPacked
    });

    // Log to Batch Tracking
    logBatchAction({
      batchId: batch.batchId,
      productType: batch.productType,
      seedVariety: batch.seedVariety,
      sizeRange: batch.sizeRange,
      variant: batch.variant,
      action: 'CONSUMED',
      weightChange: -wipConsumed,
      runningBalance: updateResult.newRemaining,
      department: 'Packing',
      user: packingData.operator || Session.getActiveUser().getEmail(),
      reference: transferId,
      notes: `Packing consumption: ${wipConsumed}T for ${packingData.sku}`
    });

    return {
      success: true,
      message: `Successfully consumed ${wipConsumed}T from ${batch.batchId}`,
      transferId: transferId,
      batchId: batch.batchId,
      remaining: updateResult.newRemaining
    };

  } catch (error) {
    Logger.log('Error consuming WIP: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

/**
 * Find available WIP batch (FIFO - First In First Out)
 */
function findAvailableWIPBatch(productType, sizeRange, variant) {
  const wipSheet = getSheet(CONFIG.SHEETS.WIP_INVENTORY);

  if (!wipSheet || wipSheet.getLastRow() <= 1) {
    return null;
  }

  const data = wipSheet.getRange(2, 1, wipSheet.getLastRow() - 1, 13).getValues();

  // Search from top to bottom (FIFO - oldest first)
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const remaining = safeParseFloat(row[8]);

    // Match criteria
    const matchesProduct = row[2] === productType;
    const matchesSize = !sizeRange || row[4] === sizeRange || sizeRange === 'N/A';
    const matchesVariant = !variant || row[5] === variant || variant === '';
    const isActive = row[9] === 'ACTIVE';
    const hasRemaining = remaining > 0.001; // More than 1kg

    if (matchesProduct && matchesSize && matchesVariant && isActive && hasRemaining) {
      return {
        batchId: row[0],
        productType: row[2],
        seedVariety: row[3],
        sizeRange: row[4],
        variant: row[5],
        remaining: remaining,
        rowNumber: i + 2
      };
    }
  }

  return null;
}

/**
 * Update WIP consumption
 */
function updateWIPConsumption(batchId, consumedWeight, rowNumber) {
  try {
    const wipSheet = getSheet(CONFIG.SHEETS.WIP_INVENTORY);

    const currentConsumed = safeParseFloat(wipSheet.getRange(rowNumber, 8).getValue());
    const currentRemaining = safeParseFloat(wipSheet.getRange(rowNumber, 9).getValue());

    const newConsumed = currentConsumed + consumedWeight;
    const newRemaining = Math.max(0, currentRemaining - consumedWeight);

    // Update values
    wipSheet.getRange(rowNumber, 8).setValue(newConsumed);
    wipSheet.getRange(rowNumber, 9).setValue(newRemaining);

    // Update status if fully consumed
    if (newRemaining <= 0.001) {
      wipSheet.getRange(rowNumber, 10).setValue('CONSUMED');
      wipSheet.getRange(rowNumber, 10).setBackground(CONFIG.COLORS.CONSUMED);
      wipSheet.getRange(rowNumber, 12).setValue(new Date()); // Completed At
    }

    return {
      success: true,
      newConsumed: newConsumed,
      newRemaining: newRemaining
    };

  } catch (error) {
    Logger.log('Error updating WIP consumption: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

/**
 * Generate Transfer ID
 * Format: T-{YYMMDD}-{SEQ}
 */
function generateTransferId(date) {
  const dateStr = formatDate(date, 'yyMMdd');
  const sequence = getNextTransferSequence(dateStr);
  return `T-${dateStr}-${sequence}`;
}

/**
 * Get next transfer sequence
 */
function getNextTransferSequence(dateStr) {
  const transferSheet = getSheet(CONFIG.SHEETS.PACKING_TRANSFERS);

  if (!transferSheet || transferSheet.getLastRow() <= 1) {
    return '001';
  }

  const data = transferSheet.getRange(2, 1, transferSheet.getLastRow() - 1, 1).getValues();
  let maxSequence = 0;

  const pattern = `T-${dateStr}-`;

  data.forEach(row => {
    const transferId = row[0];
    if (transferId && transferId.toString().startsWith(pattern)) {
      const parts = transferId.toString().split('-');
      const sequence = parseInt(parts[parts.length - 1]);
      if (!isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  });

  return String(maxSequence + 1).padStart(3, '0');
}

/**
 * Create Packing Transfer record
 */
function createPackingTransferRecord(params) {
  const transferSheet = getSheet(CONFIG.SHEETS.PACKING_TRANSFERS);

  if (!transferSheet) return;

  const row = [
    params.transferId,
    params.date,
    params.productType,
    params.region,
    params.sku,
    params.skuDescription,
    params.unitsPacked,
    params.wipConsumed,
    params.wipBatchId,
    params.operator,
    params.shift,
    params.line,
    params.notes,
    new Date()
  ];

  transferSheet.appendRow(row);
}

/**
 * Update Finished Goods Inventory
 */
function updateFinishedGoodsInventory(params) {
  const fgSheet = getSheet(CONFIG.SHEETS.FINISHED_GOODS);

  if (!fgSheet) return;

  // Find existing inventory row
  const lastRow = fgSheet.getLastRow();

  if (lastRow <= 1) {
    // No data yet, create new row
    createFinishedGoodsRow(fgSheet, params);
    return;
  }

  const data = fgSheet.getRange(2, 1, lastRow - 1, 9).getValues();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const matchesSKU = row[0] === params.sku;
    const matchesRegion = !params.region || row[2] === params.region;

    if (matchesSKU && matchesRegion) {
      // Update existing row
      const rowNum = i + 2;
      const currentStock = safeParseFloat(row[4]);
      const newStock = currentStock + safeParseFloat(params.unitsAdded);

      fgSheet.getRange(rowNum, 5).setValue(newStock);
      fgSheet.getRange(rowNum, 8).setValue(new Date());

      // Update status
      const minStock = safeParseFloat(row[5]);
      const status = calculateInventoryStatus(newStock, minStock);
      fgSheet.getRange(rowNum, 7).setValue(status);

      return;
    }
  }

  // Not found, create new row
  createFinishedGoodsRow(fgSheet, params);
}

/**
 * Create new Finished Goods row
 */
function createFinishedGoodsRow(sheet, params) {
  const row = [
    params.sku,
    params.productType,
    params.region,
    params.packageSize,
    params.unitsAdded,
    0, // Minimum stock (set manually or from config)
    'OK',
    new Date(),
    ''
  ];

  sheet.appendRow(row);
}

/**
 * Calculate inventory status
 */
function calculateInventoryStatus(currentStock, minStock) {
  if (minStock === 0) return 'OK';

  if (currentStock === 0) return 'OUT';
  if (currentStock < minStock * 0.25) return 'CRITICAL';
  if (currentStock < minStock * 0.5) return 'LOW';
  return 'OK';
}

// ==================== BATCH TRACKING ====================

/**
 * Log batch action to tracking sheet
 */
function logBatchAction(params) {
  const trackingSheet = getSheet(CONFIG.SHEETS.BATCH_TRACKING);

  if (!trackingSheet) return;

  const row = [
    new Date(),
    params.batchId,
    params.productType || '',
    params.seedVariety || 'N/A',
    params.sizeRange || 'N/A',
    params.variant || '',
    params.action,
    params.weightChange || 0,
    params.runningBalance || 0,
    params.department || '',
    params.user || Session.getActiveUser().getEmail(),
    params.reference || '',
    params.notes || ''
  ];

  trackingSheet.appendRow(row);
}

// ==================== QUERY FUNCTIONS ====================

/**
 * Get WIP inventory status
 */
function getWIPInventoryStatus() {
  const wipSheet = getSheet(CONFIG.SHEETS.WIP_INVENTORY);

  if (!wipSheet || wipSheet.getLastRow() <= 1) {
    return {
      success: true,
      batches: [],
      summary: { totalActive: 0, totalWeight: 0, totalRemaining: 0 }
    };
  }

  const data = wipSheet.getRange(2, 1, wipSheet.getLastRow() - 1, 13).getValues();
  const batches = [];
  let totalActive = 0;
  let totalWeight = 0;
  let totalRemaining = 0;

  data.forEach((row, index) => {
    const batch = {
      batchId: row[0],
      productionDate: formatDate(row[1]),
      productType: row[2],
      seedVariety: row[3],
      sizeRange: row[4],
      variant: row[5],
      initialWIP: safeParseFloat(row[6]),
      consumed: safeParseFloat(row[7]),
      remaining: safeParseFloat(row[8]),
      status: row[9],
      createdAt: formatDate(row[10]),
      completedAt: formatDate(row[11]),
      notes: row[12],
      rowNumber: index + 2
    };

    batches.push(batch);

    if (batch.status === 'ACTIVE') {
      totalActive++;
      totalWeight += batch.initialWIP;
      totalRemaining += batch.remaining;
    }
  });

  return {
    success: true,
    batches: batches,
    summary: {
      totalActive: totalActive,
      totalWeight: totalWeight,
      totalRemaining: totalRemaining
    }
  };
}

/**
 * Get batch details by ID
 */
function getBatchDetails(batchId) {
  const wipSheet = getSheet(CONFIG.SHEETS.WIP_INVENTORY);

  if (!wipSheet || wipSheet.getLastRow() <= 1) {
    return null;
  }

  const data = wipSheet.getRange(2, 1, wipSheet.getLastRow() - 1, 13).getValues();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] === batchId) {
      return {
        batchId: row[0],
        productionDate: formatDate(row[1]),
        productType: row[2],
        seedVariety: row[3],
        sizeRange: row[4],
        variant: row[5],
        initialWIP: safeParseFloat(row[6]),
        consumed: safeParseFloat(row[7]),
        remaining: safeParseFloat(row[8]),
        status: row[9],
        createdAt: formatDate(row[10]),
        completedAt: formatDate(row[11]),
        notes: row[12],
        rowNumber: i + 2
      };
    }
  }

  return null;
}

/**
 * Search batches
 */
function searchBatches(searchTerm) {
  const wipSheet = getSheet(CONFIG.SHEETS.WIP_INVENTORY);

  if (!wipSheet || wipSheet.getLastRow() <= 1) {
    return [];
  }

  const data = wipSheet.getRange(2, 1, wipSheet.getLastRow() - 1, 13).getValues();
  const results = [];
  const term = searchTerm.toString().toLowerCase();

  data.forEach((row, index) => {
    const searchableText = [
      row[0], // Batch ID
      row[2], // Product Type
      row[3], // Seed Variety
      row[4], // Size Range
      row[5], // Variant
      row[9]  // Status
    ].join(' ').toLowerCase();

    if (searchableText.includes(term)) {
      results.push({
        batchId: row[0],
        productionDate: formatDate(row[1]),
        productType: row[2],
        seedVariety: row[3],
        sizeRange: row[4],
        variant: row[5],
        initialWIP: safeParseFloat(row[6]),
        consumed: safeParseFloat(row[7]),
        remaining: safeParseFloat(row[8]),
        status: row[9],
        rowNumber: index + 2
      });
    }
  });

  return results;
}

// ==================== WEB API ====================

/**
 * API endpoint for external systems (React apps)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.action) {
      case 'createWIP':
        const wipResult = createWIPFromProduction(data.productionRow);
        return createJsonResponse(wipResult);

      case 'consumeWIP':
        const consumeResult = consumeWIPForPacking(data.packingData);
        return createJsonResponse(consumeResult);

      case 'getWIPStatus':
        const statusResult = getWIPInventoryStatus();
        return createJsonResponse(statusResult);

      case 'getBatchDetails':
        const batch = getBatchDetails(data.batchId);
        return createJsonResponse({
          success: batch !== null,
          batch: batch
        });

      case 'searchBatches':
        const searchResults = searchBatches(data.searchTerm);
        return createJsonResponse({
          success: true,
          results: searchResults,
          count: searchResults.length
        });

      default:
        throw new Error('Invalid action: ' + data.action);
    }
  } catch (error) {
    Logger.log('API Error: ' + error.toString());
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * API endpoint for GET requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'getWIPStatus':
        const statusResult = getWIPInventoryStatus();
        return createJsonResponse(statusResult);

      case 'getBatchDetails':
        const batch = getBatchDetails(e.parameter.batchId);
        return createJsonResponse({
          success: batch !== null,
          batch: batch
        });

      default:
        return createJsonResponse({
          success: false,
          error: 'Invalid action'
        });
    }
  } catch (error) {
    Logger.log('API Error: ' + error.toString());
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Create JSON response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== UI & MENU ====================

/**
 * Create custom menu on open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Production System')
    .addItem('Initialize Sheets', 'initializeSheetsUI')
    .addSeparator()
    .addItem('WIP Inventory Status', 'showWIPStatusUI')
    .addItem('Search Batches', 'showBatchSearchUI')
    .addSeparator()
    .addItem('Help', 'showHelpUI')
    .addToUi();
}

/**
 * UI wrapper for sheet initialization
 */
function initializeSheetsUI() {
  const result = initializeSheets();
  const ui = SpreadsheetApp.getUi();

  if (result.success) {
    ui.alert('Success', result.message, ui.ButtonSet.OK);
  } else {
    ui.alert('Error', result.message, ui.ButtonSet.OK);
  }
}

/**
 * Show WIP status dialog
 */
function showWIPStatusUI() {
  const status = getWIPInventoryStatus();
  const ui = SpreadsheetApp.getUi();

  let message = `WIP Inventory Status\n\n`;
  message += `Active Batches: ${status.summary.totalActive}\n`;
  message += `Total Initial Weight: ${status.summary.totalWeight.toFixed(3)} T\n`;
  message += `Total Remaining: ${status.summary.totalRemaining.toFixed(3)} T\n\n`;

  if (status.batches.length > 0) {
    message += 'Recent Batches:\n';
    status.batches.slice(-5).reverse().forEach(batch => {
      message += `\n${batch.batchId}: ${batch.remaining.toFixed(3)}T (${batch.status})`;
    });
  }

  ui.alert('WIP Inventory', message, ui.ButtonSet.OK);
}

/**
 * Show batch search dialog
 */
function showBatchSearchUI() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Search Batches', 'Enter search term (Batch ID, Product Type, Seed Variety, etc.):', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() === ui.Button.OK) {
    const searchTerm = response.getResponseText();
    const results = searchBatches(searchTerm);

    if (results.length === 0) {
      ui.alert('Search Results', 'No batches found matching: ' + searchTerm, ui.ButtonSet.OK);
    } else {
      let message = `Found ${results.length} batch(es):\n\n`;
      results.forEach(batch => {
        message += `${batch.batchId}\n`;
        message += `  ${batch.productType} - ${batch.seedVariety}\n`;
        message += `  Remaining: ${batch.remaining.toFixed(3)}T (${batch.status})\n\n`;
      });
      ui.alert('Search Results', message, ui.ButtonSet.OK);
    }
  }
}

/**
 * Show help dialog
 */
function showHelpUI() {
  const ui = SpreadsheetApp.getUi();

  const message =
    'PRODUCTION SYSTEM HELP\n\n' +
    'This Google Sheet integrates with Production, Packing, and Inventory web apps.\n\n' +
    'SHEETS:\n' +
    '• Production Data: Records from Production app\n' +
    '• WIP Inventory: Work-in-progress batches\n' +
    '• Batch Tracking: All batch movements\n' +
    '• Packing Transfers: Packing records\n' +
    '• Finished Goods Inventory: Final product stock\n\n' +
    'WORKFLOW:\n' +
    '1. Enter production data → Creates WIP batch\n' +
    '2. Pack products → Consumes WIP, updates Finished Goods\n' +
    '3. Monitor inventory → Real-time status\n\n' +
    'For support, contact your system administrator.';

  ui.alert('Help', message, ui.ButtonSet.OK);
}
