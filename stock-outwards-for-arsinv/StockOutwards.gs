/**
 * Google Apps Script Functions for Stock Outwards Management
 *
 * Add these functions to your existing Code.gs file or create a new
 * file in your Apps Script project.
 *
 * REQUIRED: Update handleAction() router to include these cases:
 *
 * case 'getStockOutwards':
 *   return getStockOutwards();
 *
 * case 'saveStockOutwards':
 *   return saveStockOutwards(d);
 */

const STOCK_OUTWARDS_SHEET = 'Stock Outwards';

/**
 * Initialize Stock Outwards sheet if it doesn't exist
 */
function initStockOutwardsSheet() {
  var ss = _ss();
  var sheet = ss.getSheetByName(STOCK_OUTWARDS_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(STOCK_OUTWARDS_SHEET);

    // Set up headers
    var headers = [
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

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4361ee');
    headerRange.setFontColor('#ffffff');

    // Freeze header row
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

/**
 * Get all stock outwards records
 * Returns array of objects with all outwards data
 */
function getStockOutwards() {
  try {
    var sheet = initStockOutwardsSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      // No data
      return createResponse('success', []);
    }

    // Get all data
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    var data = dataRange.getValues();

    // Convert to array of objects
    var records = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var record = {};

      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        var value = row[j];

        // Format date if it's a Date object
        if (header === 'Date' && value instanceof Date) {
          record[header] = Utilities.formatDate(value, TZ, 'yyyy-MM-dd');
        } else if (header === 'Timestamp' && value instanceof Date) {
          record[header] = value.toISOString();
        } else {
          record[header] = value;
        }
      }

      // Only add non-empty rows
      if (record['Date'] || record['SKU']) {
        records.push(record);
      }
    }

    return createResponse('success', records);
  } catch (error) {
    Logger.log('Error in getStockOutwards: ' + error.toString());
    return createResponse('error', 'Failed to retrieve stock outwards: ' + error.toString());
  }
}

/**
 * Save a new stock outwards entry
 * @param {Object} d - Data object containing outwards information
 */
function saveStockOutwards(d) {
  try {
    var sheet = initStockOutwardsSheet();

    // Validate required fields
    if (!d.date || !d.category || !d.sku || !d.quantity) {
      return createResponse('error', 'Missing required fields: date, category, sku, quantity');
    }

    // Don't allow manual entry of salesman transfers
    if (d.category === 'Salesman Transfer') {
      return createResponse('error', 'Salesman Transfers are auto-synced and cannot be entered manually');
    }

    // Prepare row data
    var rowData = [
      _normYmd_(d.date),                    // Date
      d.category || '',                     // Category
      d.sku || '',                          // SKU
      d.productType || '',                  // Product Type
      d.packageSize || '',                  // Package Size
      d.region || 'N/A',                    // Region
      parseFloat(d.quantity) || 0,          // Quantity
      d.customer || '',                     // Customer
      d.invoiceRef || '',                   // Invoice
      d.notes || '',                        // Notes
      d.source || 'manual',                 // Source
      new Date()                            // Timestamp
    ];

    // Append to sheet
    sheet.appendRow(rowData);

    // Log the transaction
    Logger.log('Stock outwards saved: ' + JSON.stringify({
      date: rowData[0],
      category: rowData[1],
      sku: rowData[2],
      quantity: rowData[6]
    }));

    return createResponse('success', {
      message: 'Stock outwards recorded successfully',
      data: rowData
    });
  } catch (error) {
    Logger.log('Error in saveStockOutwards: ' + error.toString());
    return createResponse('error', 'Failed to save stock outwards: ' + error.toString());
  }
}

/**
 * Get stock outwards summary
 * Returns aggregated statistics
 */
function getStockOutwardsSummary(d) {
  try {
    var result = getStockOutwards();
    if (result.status !== 'success') {
      return result;
    }

    var records = JSON.parse(result.data);

    // Filter by date range if provided
    var dateFrom = d.dateFrom ? new Date(d.dateFrom) : null;
    var dateTo = d.dateTo ? new Date(d.dateTo) : null;

    var filtered = records.filter(function(record) {
      if (!record.Date) return false;

      var recordDate = new Date(record.Date);
      if (dateFrom && recordDate < dateFrom) return false;
      if (dateTo && recordDate > dateTo) return false;

      return true;
    });

    // Calculate summary
    var summary = {
      total: filtered.length,
      totalQuantity: 0,
      byCategory: {},
      byProduct: {},
      byRegion: {}
    };

    filtered.forEach(function(record) {
      var qty = parseFloat(record.Quantity) || 0;
      summary.totalQuantity += qty;

      // By category
      var category = record.Category || 'Other';
      summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;

      // By product
      var product = record['Product Type'] || 'Unknown';
      summary.byProduct[product] = (summary.byProduct[product] || 0) + qty;

      // By region
      var region = record.Region || 'N/A';
      summary.byRegion[region] = (summary.byRegion[region] || 0) + qty;
    });

    return createResponse('success', summary);
  } catch (error) {
    Logger.log('Error in getStockOutwardsSummary: ' + error.toString());
    return createResponse('error', 'Failed to get summary: ' + error.toString());
  }
}

/**
 * Delete stock outwards entry (admin only)
 * @param {Object} d - Data object containing row number to delete
 */
function deleteStockOutwards(d) {
  try {
    if (!d.rowNumber || d.rowNumber < 2) {
      return createResponse('error', 'Invalid row number');
    }

    var sheet = initStockOutwardsSheet();
    var lastRow = sheet.getLastRow();

    if (d.rowNumber > lastRow) {
      return createResponse('error', 'Row does not exist');
    }

    // Delete the row
    sheet.deleteRow(d.rowNumber);

    Logger.log('Stock outwards deleted: row ' + d.rowNumber);

    return createResponse('success', 'Entry deleted successfully');
  } catch (error) {
    Logger.log('Error in deleteStockOutwards: ' + error.toString());
    return createResponse('error', 'Failed to delete entry: ' + error.toString());
  }
}

/**
 * ADD THESE CASES TO THE handleAction() ROUTER IN Code.gs:
 *
 * case 'getStockOutwards':
 *   return getStockOutwards();
 *
 * case 'saveStockOutwards':
 *   return saveStockOutwards(d);
 *
 * case 'getStockOutwardsSummary':
 *   return getStockOutwardsSummary(d);
 *
 * case 'deleteStockOutwards':
 *   return deleteStockOutwards(d);
 */
