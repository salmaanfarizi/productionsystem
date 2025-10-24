/**
 * ========================================
 * INTEGRATED BATCH TRACKING SYSTEM v2.0
 * Enhanced with Modern UI and Better Error Handling
 * ========================================
 */

// ==================== CONFIGURATION ====================
const BATCH_CONFIG = {
  SHEETS: {
    PRODUCTION: 'Daily - Jul 2025',
    BATCH_MASTER: 'Batch Master',
    BATCH_TRACKING: 'Batch Tracking',
    PACKING_CONSUMPTION: 'Packing Consumption',
    BATCH_HISTORY: 'Batch History'
  },
  BATCH_PREFIX: {
    'T6': 'BT6',
    '361': 'B361',
    '363': 'B363',
    '601': 'B601',
    'S9': 'BS9'
  },
  COLORS: {
    ACTIVE: '#d4edda',
    COMPLETE: '#f8d7da',
    WARNING: '#fff3cd',
    HEADER: '#1f4e79'
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get active spreadsheet (no hardcoded ID needed)
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
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
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), format);
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

// ==================== BATCH GENERATION SYSTEM ====================

/**
 * Initialize batch tracking sheets with improved structure
 */
function initializeBatchSystem() {
  try {
    const ss = getSpreadsheet();

    // Create Batch Master sheet
    const batchMaster = initBatchMasterSheet();

    // Create Batch Tracking sheet
    const tracking = initBatchTrackingSheet();

    // Create Packing Consumption sheet
    const consumption = initPackingConsumptionSheet();

    // Create Batch History sheet
    const history = initBatchHistorySheet();

    return {
      success: true,
      message: 'Batch system initialized successfully!\n\nSheets created:\n• Batch Master\n• Batch Tracking\n• Packing Consumption\n• Batch History'
    };
  } catch (error) {
    Logger.log('Error initializing batch system: ' + error.toString());
    return {
      success: false,
      message: 'Error initializing batch system: ' + error.toString()
    };
  }
}

/**
 * Initialize Batch Master sheet
 */
function initBatchMasterSheet() {
  let sheet = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  if (!sheet) {
    const ss = getSpreadsheet();
    sheet = ss.insertSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

    const headers = [
      'Batch ID', 'Production Date', 'Seed Type', 'Size', 'Production Variant',
      'Initial Weight (T)', 'Consumed Weight (T)', 'Remaining Weight (T)',
      'Status', 'Start Time', 'Complete Time', 'Linked Production Rows', 'Notes'
    ];

    sheet.appendRow(headers);
    sheet.setFrozenRows(1);

    // Format header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(BATCH_CONFIG.COLORS.HEADER);
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setWrap(true);

    // Set column widths
    const widths = [140, 110, 90, 70, 120, 110, 110, 110, 90, 140, 140, 180, 200];
    widths.forEach((width, i) => {
      sheet.setColumnWidth(i + 1, width);
    });

    // Add data validation for Status column
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['ACTIVE', 'COMPLETE', 'ON_HOLD'], true)
      .build();
    sheet.getRange(2, 9, 1000).setDataValidation(statusRule);
  }

  return sheet;
}

/**
 * Initialize Batch Tracking sheet
 */
function initBatchTrackingSheet() {
  let sheet = getSheet(BATCH_CONFIG.SHEETS.BATCH_TRACKING);

  if (!sheet) {
    const ss = getSpreadsheet();
    sheet = ss.insertSheet(BATCH_CONFIG.SHEETS.BATCH_TRACKING);

    const headers = [
      'Timestamp', 'Batch ID', 'Seed Type', 'Size', 'Variant',
      'Action', 'Weight Change (T)', 'Running Total (T)', 'Department', 'User', 'Reference', 'Notes'
    ];

    sheet.appendRow(headers);
    sheet.setFrozenRows(1);

    // Format header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(BATCH_CONFIG.COLORS.HEADER);
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    // Set column widths
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 140);
  }

  return sheet;
}

/**
 * Initialize Packing Consumption sheet
 */
function initPackingConsumptionSheet() {
  let sheet = getSheet(BATCH_CONFIG.SHEETS.PACKING_CONSUMPTION);

  if (!sheet) {
    const ss = getSpreadsheet();
    sheet = ss.insertSheet(BATCH_CONFIG.SHEETS.PACKING_CONSUMPTION);

    const headers = [
      'Timestamp', 'Batch ID', 'SKU', 'Package Size', 'Packages Produced',
      'Weight Consumed (T)', 'Remaining Batch Weight (T)', 'Operator', 'Shift', 'Line', 'Notes'
    ];

    sheet.appendRow(headers);
    sheet.setFrozenRows(1);

    // Format header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(BATCH_CONFIG.COLORS.HEADER);
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
  }

  return sheet;
}

/**
 * Initialize Batch History sheet
 */
function initBatchHistorySheet() {
  let sheet = getSheet(BATCH_CONFIG.SHEETS.BATCH_HISTORY);

  if (!sheet) {
    const ss = getSpreadsheet();
    sheet = ss.insertSheet(BATCH_CONFIG.SHEETS.BATCH_HISTORY);

    const headers = [
      'Batch ID', 'Production Date', 'Seed Type', 'Size', 'Variant',
      'Initial Weight (T)', 'Total Consumed (T)', 'Start Time', 'Complete Time',
      'Duration (Hours)', 'Production Rows', 'Total Packages', 'Archive Date'
    ];

    sheet.appendRow(headers);
    sheet.setFrozenRows(1);

    // Format header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(BATCH_CONFIG.COLORS.HEADER);
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
  }

  return sheet;
}

/**
 * Generate batch from production data
 */
function generateProductionBatch(productionRow) {
  try {
    const ss = getSpreadsheet();
    const prodSheet = getSheet(BATCH_CONFIG.SHEETS.PRODUCTION);
    const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

    if (!prodSheet || !batchMaster) {
      throw new Error('Required sheets not found. Please initialize the batch system first.');
    }

    // Get production data
    const rowData = prodSheet.getRange(productionRow, 1, 1, 16).getValues()[0];

    const date = rowData[0];
    const productionType = rowData[1];
    const seedType = rowData[2];
    const size = rowData[3];
    const variant = rowData[5] || '';
    const quantity = safeParseFloat(rowData[6]);
    const weight = safeParseFloat(rowData[7]);

    // Validate data
    if (productionType === 'Non Production Day' || weight === 0) {
      return {
        success: false,
        message: 'Skipped: Non-production day or zero weight',
        batchId: null
      };
    }

    if (!seedType || !size) {
      throw new Error(`Invalid production data at row ${productionRow}: Missing seed type or size`);
    }

    // Check for existing active batch
    const existingBatch = findActiveBatch(seedType, size, variant);

    if (existingBatch) {
      updateBatchWeight(existingBatch.batchId, weight, productionRow);
      return {
        success: true,
        message: 'Weight added to existing batch',
        batchId: existingBatch.batchId,
        action: 'UPDATED'
      };
    } else {
      const batchId = createNewBatch({
        date: date,
        seedType: seedType,
        size: size,
        variant: variant,
        weight: weight,
        productionRow: productionRow
      });

      return {
        success: true,
        message: 'New batch created',
        batchId: batchId,
        action: 'CREATED'
      };
    }
  } catch (error) {
    Logger.log('Error generating batch: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString(),
      batchId: null
    };
  }
}

/**
 * Create new batch with validation
 */
function createNewBatch(data) {
  // Validate required fields
  const validation = validateData(data, ['date', 'seedType', 'size', 'weight']);
  if (!validation.isValid) {
    throw new Error('Validation failed: ' + validation.errors.join(', '));
  }

  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  // Generate batch ID
  const dateStr = formatDate(data.date, 'yyMMdd');
  const prefix = BATCH_CONFIG.BATCH_PREFIX[data.seedType] || 'B';
  const sequence = getNextBatchSequence(prefix, dateStr);
  const batchId = `${prefix}-${dateStr}-${sequence}`;

  // Create batch record
  const now = new Date();
  const row = [
    batchId,
    data.date,
    data.seedType,
    data.size,
    data.variant || '',
    data.weight,
    0, // Consumed weight
    data.weight, // Remaining weight
    'ACTIVE',
    now,
    '', // Complete time
    data.productionRow.toString(),
    data.notes || ''
  ];

  batchMaster.appendRow(row);

  // Format the new row
  const lastRow = batchMaster.getLastRow();
  const range = batchMaster.getRange(lastRow, 1, 1, 13);
  range.setBorder(true, true, true, true, false, false);
  batchMaster.getRange(lastRow, 9).setBackground(BATCH_CONFIG.COLORS.ACTIVE);

  // Add to tracking
  logBatchAction({
    batchId: batchId,
    action: 'CREATED',
    weight: data.weight,
    department: 'Production',
    user: Session.getActiveUser().getEmail(),
    reference: `Row ${data.productionRow}`,
    notes: `Initial batch creation: ${data.weight}T`
  });

  return batchId;
}

/**
 * Update batch weight when production continues same product
 */
function updateBatchWeight(batchId, additionalWeight, productionRow) {
  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  const lastRow = batchMaster.getLastRow();
  if (lastRow <= 1) {
    throw new Error('No batch data found');
  }

  const data = batchMaster.getRange(2, 1, lastRow - 1, 13).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === batchId) {
      const rowNum = i + 2;
      const currentWeight = safeParseFloat(data[i][5]);
      const consumedWeight = safeParseFloat(data[i][6]);
      const newTotalWeight = currentWeight + additionalWeight;
      const newRemainingWeight = newTotalWeight - consumedWeight;

      // Update weights
      batchMaster.getRange(rowNum, 6).setValue(newTotalWeight);
      batchMaster.getRange(rowNum, 8).setValue(newRemainingWeight);

      // Add production row to linked rows
      const linkedRows = data[i][11] || '';
      const updatedRows = linkedRows ? `${linkedRows},${productionRow}` : productionRow.toString();
      batchMaster.getRange(rowNum, 12).setValue(updatedRows);

      // Log action
      logBatchAction({
        batchId: batchId,
        action: 'WEIGHT_ADDED',
        weight: additionalWeight,
        department: 'Production',
        user: Session.getActiveUser().getEmail(),
        reference: `Row ${productionRow}`,
        notes: `Added ${additionalWeight}T to existing batch`
      });

      return true;
    }
  }

  throw new Error(`Batch ${batchId} not found`);
}

/**
 * Find active batch for same product
 */
function findActiveBatch(seedType, size, variant) {
  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  const lastRow = batchMaster.getLastRow();
  if (lastRow <= 1) return null;

  const data = batchMaster.getRange(2, 1, lastRow - 1, 13).getValues();

  // Look for active batch with same product specs (search from newest to oldest)
  for (let i = data.length - 1; i >= 0; i--) {
    const row = data[i];
    const remainingWeight = safeParseFloat(row[7]);

    if (row[2] === seedType &&
        row[3] === size &&
        (row[4] || '') === (variant || '') &&
        row[8] === 'ACTIVE' &&
        remainingWeight > 0.001) { // Has remaining weight > 1kg
      return {
        batchId: row[0],
        remainingWeight: remainingWeight,
        row: i + 2
      };
    }
  }

  return null;
}

/**
 * Process packing consumption with improved error handling
 */
function processPackingConsumption(consumptionData) {
  try {
    // Validate input
    const validation = validateData(consumptionData, ['seedType', 'size', 'weight', 'sku']);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed: ' + validation.errors.join(', ')
      };
    }

    const ss = getSpreadsheet();
    const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);
    const consumption = getSheet(BATCH_CONFIG.SHEETS.PACKING_CONSUMPTION);

    if (!batchMaster || !consumption) {
      throw new Error('Required sheets not found');
    }

    let batch = findBatchForConsumption(
      consumptionData.seedType,
      consumptionData.size,
      consumptionData.variant || ''
    );

    if (!batch) {
      return {
        success: false,
        message: `No active batch available for ${consumptionData.seedType} ${consumptionData.size}`
      };
    }

    let remainingToConsume = safeParseFloat(consumptionData.weight);
    const consumedBatches = [];

    while (remainingToConsume > 0.001 && batch) {
      const consumeFromBatch = Math.min(remainingToConsume, batch.remainingWeight);

      // Update batch consumption
      updateBatchConsumption(batch.batchId, consumeFromBatch);

      // Record consumption
      const now = new Date();
      const consumptionRow = [
        now,
        batch.batchId,
        consumptionData.sku,
        consumptionData.packageSize || '',
        safeParseFloat(consumptionData.packages),
        consumeFromBatch,
        batch.remainingWeight - consumeFromBatch,
        consumptionData.operator || Session.getActiveUser().getEmail(),
        consumptionData.shift || '',
        consumptionData.line || '',
        consumptionData.notes || ''
      ];

      consumption.appendRow(consumptionRow);

      consumedBatches.push({
        batchId: batch.batchId,
        consumed: consumeFromBatch
      });

      remainingToConsume -= consumeFromBatch;

      // Check if batch is complete
      if (batch.remainingWeight - consumeFromBatch <= 0.001) {
        completeBatch(batch.batchId);

        // Get next batch if needed
        if (remainingToConsume > 0.001) {
          batch = findBatchForConsumption(
            consumptionData.seedType,
            consumptionData.size,
            consumptionData.variant || ''
          );

          if (!batch) {
            return {
              success: false,
              message: `Partially processed. Short by ${remainingToConsume.toFixed(3)}T`,
              consumedBatches: consumedBatches
            };
          }
        }
      } else {
        batch.remainingWeight -= consumeFromBatch;
      }
    }

    return {
      success: true,
      message: `Successfully consumed ${consumptionData.weight}T from ${consumedBatches.length} batch(es)`,
      consumedBatches: consumedBatches
    };

  } catch (error) {
    Logger.log('Error processing consumption: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

/**
 * Find batch for consumption (FIFO)
 */
function findBatchForConsumption(seedType, size, variant) {
  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  const lastRow = batchMaster.getLastRow();
  if (lastRow <= 1) return null;

  const data = batchMaster.getRange(2, 1, lastRow - 1, 13).getValues();

  // Find oldest active batch (FIFO) - search from top to bottom
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const remainingWeight = safeParseFloat(row[7]);

    if (row[2] === seedType &&
        row[3] === size &&
        (row[4] || '') === (variant || '') &&
        row[8] === 'ACTIVE' &&
        remainingWeight > 0) {
      return {
        batchId: row[0],
        remainingWeight: remainingWeight,
        row: i + 2
      };
    }
  }

  return null;
}

/**
 * Update batch consumption
 */
function updateBatchConsumption(batchId, consumedWeight) {
  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  const lastRow = batchMaster.getLastRow();
  const data = batchMaster.getRange(2, 1, lastRow - 1, 13).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === batchId) {
      const rowNum = i + 2;
      const currentConsumed = safeParseFloat(data[i][6]);
      const currentRemaining = safeParseFloat(data[i][7]);

      const newConsumed = currentConsumed + consumedWeight;
      const newRemaining = Math.max(0, currentRemaining - consumedWeight);

      batchMaster.getRange(rowNum, 7).setValue(newConsumed);
      batchMaster.getRange(rowNum, 8).setValue(newRemaining);

      // Log action
      logBatchAction({
        batchId: batchId,
        action: 'CONSUMED',
        weight: -consumedWeight,
        department: 'Packing',
        user: Session.getActiveUser().getEmail(),
        reference: 'Packing consumption',
        notes: `${consumedWeight.toFixed(3)}T consumed, ${newRemaining.toFixed(3)}T remaining`
      });

      return true;
    }
  }

  throw new Error(`Batch ${batchId} not found`);
}

/**
 * Complete a batch when fully consumed
 */
function completeBatch(batchId) {
  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  const lastRow = batchMaster.getLastRow();
  const data = batchMaster.getRange(2, 1, lastRow - 1, 13).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === batchId) {
      const rowNum = i + 2;
      const now = new Date();

      batchMaster.getRange(rowNum, 9).setValue('COMPLETE');
      batchMaster.getRange(rowNum, 11).setValue(now);
      batchMaster.getRange(rowNum, 9).setBackground(BATCH_CONFIG.COLORS.COMPLETE);

      // Log completion
      logBatchAction({
        batchId: batchId,
        action: 'COMPLETED',
        weight: 0,
        department: 'System',
        user: 'System',
        reference: 'Automatic completion',
        notes: 'Batch fully consumed'
      });

      // Archive to history
      archiveBatchToHistory(batchId, data[i]);

      return true;
    }
  }

  return false;
}

/**
 * Get next batch sequence number
 */
function getNextBatchSequence(prefix, dateStr) {
  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  const lastRow = batchMaster.getLastRow();
  if (lastRow <= 1) return '001';

  const data = batchMaster.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxSequence = 0;

  const pattern = `${prefix}-${dateStr}-`;

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
 * Log batch action with improved structure
 */
function logBatchAction(params) {
  const ss = getSpreadsheet();
  const tracking = getSheet(BATCH_CONFIG.SHEETS.BATCH_TRACKING);

  if (!tracking) return;

  const batchDetails = getBatchDetails(params.batchId);
  const now = new Date();

  const row = [
    now,
    params.batchId,
    batchDetails ? batchDetails.seedType : '',
    batchDetails ? batchDetails.size : '',
    batchDetails ? batchDetails.variant : '',
    params.action,
    params.weight || 0,
    batchDetails ? batchDetails.remainingWeight : 0,
    params.department || '',
    params.user || Session.getActiveUser().getEmail(),
    params.reference || '',
    params.notes || ''
  ];

  tracking.appendRow(row);
}

/**
 * Get batch details with error handling
 */
function getBatchDetails(batchId) {
  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  if (!batchMaster) return null;

  const lastRow = batchMaster.getLastRow();
  if (lastRow <= 1) return null;

  const data = batchMaster.getRange(2, 1, lastRow - 1, 13).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === batchId) {
      return {
        batchId: data[i][0],
        date: data[i][1],
        seedType: data[i][2],
        size: data[i][3],
        variant: data[i][4],
        initialWeight: safeParseFloat(data[i][5]),
        consumedWeight: safeParseFloat(data[i][6]),
        remainingWeight: safeParseFloat(data[i][7]),
        status: data[i][8],
        startTime: data[i][9],
        completeTime: data[i][10],
        linkedRows: data[i][11],
        notes: data[i][12]
      };
    }
  }

  return null;
}

/**
 * Archive completed batch to history
 */
function archiveBatchToHistory(batchId, batchData) {
  const ss = getSpreadsheet();
  let history = getSheet(BATCH_CONFIG.SHEETS.BATCH_HISTORY, true);

  // Ensure headers exist
  if (history.getLastRow() === 0) {
    history = initBatchHistorySheet();
  }

  const startTime = batchData[9];
  const endTime = batchData[10] || new Date();
  const duration = (endTime - startTime) / (1000 * 60 * 60); // Hours

  // Get total packages from consumption sheet
  const totalPackages = getTotalPackagesForBatch(batchId);

  const archiveRow = [
    batchId,
    batchData[1], // Production date
    batchData[2], // Seed type
    batchData[3], // Size
    batchData[4], // Variant
    batchData[5], // Initial weight
    batchData[6], // Total consumed
    startTime,
    endTime,
    duration.toFixed(2),
    batchData[11], // Production rows
    totalPackages,
    new Date() // Archive date
  ];

  history.appendRow(archiveRow);
}

/**
 * Get total packages produced from a batch
 */
function getTotalPackagesForBatch(batchId) {
  const ss = getSpreadsheet();
  const consumption = getSheet(BATCH_CONFIG.SHEETS.PACKING_CONSUMPTION);

  if (!consumption) return 0;

  const lastRow = consumption.getLastRow();
  if (lastRow <= 1) return 0;

  const data = consumption.getRange(2, 1, lastRow - 1, 11).getValues();
  let totalPackages = 0;

  data.forEach(row => {
    if (row[1] === batchId) {
      totalPackages += safeParseFloat(row[4]);
    }
  });

  return totalPackages;
}

// ==================== INTEGRATION FUNCTIONS ====================

/**
 * Process daily production for batch generation
 */
function processDailyProductionForBatches(targetDate) {
  try {
    const ss = getSpreadsheet();
    const prodSheet = getSheet(BATCH_CONFIG.SHEETS.PRODUCTION);

    if (!prodSheet) {
      return {
        success: false,
        message: 'Production sheet not found'
      };
    }

    const date = targetDate ? new Date(targetDate) : new Date();
    date.setHours(0, 0, 0, 0);

    const lastRow = prodSheet.getLastRow();
    let processedCount = 0;
    let batchesCreated = [];
    let errors = [];

    for (let row = 5; row <= lastRow; row++) {
      const rowDate = prodSheet.getRange(row, 1).getValue();
      const batchProcessed = prodSheet.getRange(row, 17).getValue();

      if (rowDate instanceof Date) {
        rowDate.setHours(0, 0, 0, 0);

        // Process if not already processed and matches target date
        if (!batchProcessed && rowDate.getTime() === date.getTime()) {
          const result = generateProductionBatch(row);

          if (result.success && result.batchId) {
            // Mark as processed
            prodSheet.getRange(row, 17).setValue(result.batchId);
            prodSheet.getRange(row, 17).setNote(
              `Batch: ${result.batchId}\n` +
              `Action: ${result.action}\n` +
              `Processed: ${new Date()}`
            );

            processedCount++;
            if (!batchesCreated.includes(result.batchId)) {
              batchesCreated.push(result.batchId);
            }
          } else if (!result.success && result.message !== 'Skipped: Non-production day or zero weight') {
            errors.push(`Row ${row}: ${result.message}`);
          }
        }
      }
    }

    return {
      success: true,
      message: `Processed ${processedCount} production rows\nBatches: ${batchesCreated.join(', ')}`,
      processedCount: processedCount,
      batchesCreated: batchesCreated,
      errors: errors
    };

  } catch (error) {
    Logger.log('Error processing daily production: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

/**
 * Get list of active batches with filters
 */
function getActiveBatchList(filters) {
  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  if (!batchMaster) return [];

  const lastRow = batchMaster.getLastRow();
  if (lastRow <= 1) return [];

  const data = batchMaster.getRange(2, 1, lastRow - 1, 13).getValues();
  const activeBatches = [];

  data.forEach((row, index) => {
    // Apply filters
    const matchesStatus = !filters || !filters.status || row[8] === filters.status;
    const matchesSeedType = !filters || !filters.seedType || row[2] === filters.seedType;
    const matchesSize = !filters || !filters.size || row[3] === filters.size;
    const matchesVariant = !filters || !filters.variant || row[4] === filters.variant;

    if (matchesStatus && matchesSeedType && matchesSize && matchesVariant) {
      activeBatches.push({
        batchId: row[0],
        date: row[1],
        seedType: row[2],
        size: row[3],
        variant: row[4],
        initialWeight: safeParseFloat(row[5]),
        consumedWeight: safeParseFloat(row[6]),
        remainingWeight: safeParseFloat(row[7]),
        status: row[8],
        startTime: row[9],
        completeTime: row[10],
        linkedRows: row[11],
        notes: row[12],
        rowNumber: index + 2
      });
    }
  });

  return activeBatches;
}

/**
 * Search batches by multiple criteria
 */
function searchBatches(searchTerm) {
  const ss = getSpreadsheet();
  const batchMaster = getSheet(BATCH_CONFIG.SHEETS.BATCH_MASTER);

  if (!batchMaster) return [];

  const lastRow = batchMaster.getLastRow();
  if (lastRow <= 1) return [];

  const data = batchMaster.getRange(2, 1, lastRow - 1, 13).getValues();
  const results = [];

  const term = searchTerm.toString().toLowerCase();

  data.forEach((row, index) => {
    // Search in batch ID, seed type, size, variant
    const searchableText = [
      row[0], // Batch ID
      row[2], // Seed type
      row[3], // Size
      row[4], // Variant
      row[8], // Status
      row[11] // Linked rows
    ].join(' ').toLowerCase();

    if (searchableText.includes(term)) {
      results.push({
        batchId: row[0],
        date: row[1],
        seedType: row[2],
        size: row[3],
        variant: row[4],
        initialWeight: safeParseFloat(row[5]),
        consumedWeight: safeParseFloat(row[6]),
        remainingWeight: safeParseFloat(row[7]),
        status: row[8],
        startTime: row[9],
        completeTime: row[10],
        linkedRows: row[11],
        notes: row[12],
        rowNumber: index + 2
      });
    }
  });

  return results;
}

// ==================== API ENDPOINTS ====================

/**
 * Web API endpoint for external systems
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.action) {
      case 'consumeBatch':
        const result = processPackingConsumption(data.params);
        return createJsonResponse(result);

      case 'getBatchStatus':
        const batch = getBatchDetails(data.batchId);
        return createJsonResponse({
          success: batch !== null,
          batch: batch
        });

      case 'getActiveBatches':
        const batches = getActiveBatchList(data.filters);
        return createJsonResponse({
          success: true,
          batches: batches,
          count: batches.length
        });

      case 'searchBatches':
        const searchResults = searchBatches(data.searchTerm);
        return createJsonResponse({
          success: true,
          results: searchResults,
          count: searchResults.length
        });

      case 'processDailyProduction':
        const processResult = processDailyProductionForBatches(data.date);
        return createJsonResponse(processResult);

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
 * Create JSON response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== UI FUNCTIONS ====================

/**
 * Show main dashboard
 */
function showDashboard() {
  const html = HtmlService.createHtmlOutputFromFile('Dashboard')
    .setTitle('Batch Tracking Dashboard')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show packing consumption form
 */
function showPackingForm() {
  const html = HtmlService.createHtmlOutputFromFile('PackingForm')
    .setTitle('Packing Consumption')
    .setWidth(350);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show batch analytics
 */
function showAnalyticsDashboard() {
  const html = HtmlService.createHtmlOutputFromFile('Analytics')
    .setTitle('Batch Analytics')
    .setWidth(500);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show batch search
 */
function showBatchSearch() {
  const html = HtmlService.createHtmlOutputFromFile('BatchSearch')
    .setTitle('Search Batches')
    .setWidth(450);

  SpreadsheetApp.getUi().showSidebar(html);
}

// ==================== REPORTING FUNCTIONS ====================

/**
 * Get batch statistics
 */
function getBatchStatistics() {
  const batches = getActiveBatchList({});

  const stats = {
    total: batches.length,
    active: batches.filter(b => b.status === 'ACTIVE').length,
    complete: batches.filter(b => b.status === 'COMPLETE').length,
    onHold: batches.filter(b => b.status === 'ON_HOLD').length,
    totalWeight: 0,
    consumedWeight: 0,
    remainingWeight: 0,
    byProduct: {},
    byVariant: {},
    byStatus: {
      ACTIVE: 0,
      COMPLETE: 0,
      ON_HOLD: 0
    }
  };

  batches.forEach(batch => {
    stats.totalWeight += batch.initialWeight;
    stats.consumedWeight += batch.consumedWeight;
    stats.remainingWeight += batch.remainingWeight;

    // By product
    const productKey = `${batch.seedType} ${batch.size}`;
    if (!stats.byProduct[productKey]) {
      stats.byProduct[productKey] = {
        count: 0,
        totalWeight: 0,
        remainingWeight: 0
      };
    }
    stats.byProduct[productKey].count++;
    stats.byProduct[productKey].totalWeight += batch.initialWeight;
    stats.byProduct[productKey].remainingWeight += batch.remainingWeight;

    // By variant
    const variantKey = batch.variant || 'No Variant';
    if (!stats.byVariant[variantKey]) {
      stats.byVariant[variantKey] = {
        count: 0,
        totalWeight: 0
      };
    }
    stats.byVariant[variantKey].count++;
    stats.byVariant[variantKey].totalWeight += batch.initialWeight;

    // By status
    if (stats.byStatus[batch.status] !== undefined) {
      stats.byStatus[batch.status]++;
    }
  });

  return stats;
}

/**
 * Get product options for dropdowns
 */
function getProductOptions() {
  const ss = getSpreadsheet();
  const prodSheet = getSheet(BATCH_CONFIG.SHEETS.PRODUCTION);

  if (!prodSheet) return { seedTypes: [], sizes: [], variants: [] };

  const lastRow = prodSheet.getLastRow();
  if (lastRow <= 4) return { seedTypes: [], sizes: [], variants: [] };

  const data = prodSheet.getRange(5, 1, lastRow - 4, 16).getValues();

  const seedTypes = new Set();
  const sizes = new Set();
  const variants = new Set();

  data.forEach(row => {
    if (row[2]) seedTypes.add(row[2]); // Seed Type
    if (row[3]) sizes.add(row[3]); // Size
    if (row[5]) variants.add(row[5]); // Variant
  });

  return {
    seedTypes: Array.from(seedTypes).sort(),
    sizes: Array.from(sizes).sort(),
    variants: Array.from(variants).sort()
  };
}

// ==================== MENU SETUP ====================

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Batch System')
    .addItem('Dashboard', 'showDashboard')
    .addSeparator()
    .addItem('Initialize System', 'initializeBatchSystemUI')
    .addItem('Process Today\'s Production', 'processTodayProductionUI')
    .addSeparator()
    .addItem('Packing Consumption', 'showPackingForm')
    .addItem('Search Batches', 'showBatchSearch')
    .addItem('Analytics', 'showAnalyticsDashboard')
    .addToUi();
}

/**
 * UI wrapper for initialization
 */
function initializeBatchSystemUI() {
  const result = initializeBatchSystem();
  const ui = SpreadsheetApp.getUi();

  if (result.success) {
    ui.alert('Success', result.message, ui.ButtonSet.OK);
  } else {
    ui.alert('Error', result.message, ui.ButtonSet.OK);
  }
}

/**
 * UI wrapper for processing production
 */
function processTodayProductionUI() {
  const result = processDailyProductionForBatches();
  const ui = SpreadsheetApp.getUi();

  let message = result.message;
  if (result.errors && result.errors.length > 0) {
    message += '\n\nErrors:\n' + result.errors.join('\n');
  }

  if (result.success) {
    ui.alert('Production Processed', message, ui.ButtonSet.OK);
  } else {
    ui.alert('Error', message, ui.ButtonSet.OK);
  }
}
