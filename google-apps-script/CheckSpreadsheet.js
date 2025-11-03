/**
 * Google Apps Script - Spreadsheet Diagnostic Tool
 *
 * This script checks your spreadsheet structure and data.
 * No API key needed - runs directly in Google's environment.
 *
 * HOW TO USE:
 * 1. Open your spreadsheet: https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit
 * 2. Go to: Extensions → Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire file
 * 5. Click "Save" (disk icon)
 * 6. Run the function: checkSpreadsheet()
 * 7. Allow permissions when prompted
 * 8. Check Execution log (View → Logs) for results
 */

/**
 * Main diagnostic function - checks entire spreadsheet
 */
function checkSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('========================================');
  Logger.log('GOOGLE SPREADSHEET DIAGNOSTIC REPORT');
  Logger.log('========================================');
  Logger.log('');
  Logger.log('Spreadsheet Name: ' + ss.getName());
  Logger.log('Spreadsheet ID: ' + ss.getId());
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  Logger.log('Owner: ' + ss.getOwner().getEmail());
  Logger.log('Time: ' + new Date().toString());
  Logger.log('');

  // Get all sheets
  const sheets = ss.getSheets();
  Logger.log('Total Sheets: ' + sheets.length);
  Logger.log('');

  // Check each sheet
  sheets.forEach((sheet, index) => {
    Logger.log('==========================================');
    Logger.log('SHEET #' + (index + 1) + ': ' + sheet.getName());
    Logger.log('==========================================');

    checkSheet(sheet);
    Logger.log('');
  });

  Logger.log('========================================');
  Logger.log('DIAGNOSTIC COMPLETE');
  Logger.log('========================================');
}

/**
 * Check individual sheet details
 */
function checkSheet(sheet) {
  const sheetName = sheet.getName();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  Logger.log('Sheet Name: ' + sheetName);
  Logger.log('Last Row: ' + lastRow);
  Logger.log('Last Column: ' + lastCol);
  Logger.log('Max Rows: ' + sheet.getMaxRows());
  Logger.log('Max Columns: ' + sheet.getMaxColumns());

  if (lastRow === 0) {
    Logger.log('⚠️  WARNING: Sheet is empty!');
    return;
  }

  // Get headers
  Logger.log('');
  Logger.log('--- HEADERS (Row 1) ---');
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  Logger.log('Columns: ' + headers.join(', '));
  Logger.log('Column Count: ' + headers.length);

  // Get sample data (first 3 rows after header)
  Logger.log('');
  Logger.log('--- SAMPLE DATA (First 3 rows) ---');

  if (lastRow > 1) {
    const sampleRows = Math.min(3, lastRow - 1);
    const data = sheet.getRange(2, 1, sampleRows, lastCol).getValues();

    data.forEach((row, index) => {
      Logger.log('');
      Logger.log('Row ' + (index + 2) + ':');
      headers.forEach((header, colIndex) => {
        const value = row[colIndex];
        Logger.log('  ' + header + ': ' + (value === '' ? '(empty)' : value));
      });
    });

    Logger.log('');
    Logger.log('Total Data Rows: ' + (lastRow - 1));
  } else {
    Logger.log('No data rows (only header exists)');
  }

  // Check for empty cells in first data row
  if (lastRow > 1) {
    Logger.log('');
    Logger.log('--- DATA QUALITY CHECK ---');
    const firstDataRow = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
    const emptyCells = firstDataRow.filter(cell => cell === '').length;

    if (emptyCells > 0) {
      Logger.log('⚠️  First data row has ' + emptyCells + ' empty cells');
    } else {
      Logger.log('✓ First data row is complete');
    }
  }
}

/**
 * Quick check - just lists all sheets and row counts
 */
function quickCheck() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  Logger.log('=== QUICK SPREADSHEET CHECK ===');
  Logger.log('Spreadsheet: ' + ss.getName());
  Logger.log('ID: ' + ss.getId());
  Logger.log('');

  sheets.forEach((sheet, index) => {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const status = lastRow === 0 ? '⚠️  EMPTY' : '✓ ' + (lastRow - 1) + ' data rows';

    Logger.log((index + 1) + '. ' + sheet.getName());
    Logger.log('   Rows: ' + lastRow + ', Columns: ' + lastCol + ' - ' + status);
  });

  Logger.log('');
  Logger.log('=== CHECK COMPLETE ===');
}

/**
 * Check specific sheets that are commonly used
 */
function checkProductionSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const commonSheets = [
    'Batch Master',
    'Daily - Jul 2025',
    'Daily - Aug 2025',
    'Packing Consumption',
    'Raw Material Inventory',
    'Finished Goods Inventory'
  ];

  Logger.log('=== PRODUCTION SHEETS CHECK ===');
  Logger.log('');

  commonSheets.forEach(sheetName => {
    try {
      const sheet = ss.getSheetByName(sheetName);

      if (sheet) {
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();

        Logger.log('✓ ' + sheetName);
        Logger.log('  Rows: ' + lastRow + ', Columns: ' + lastCol);

        if (lastRow > 0) {
          const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
          Logger.log('  Headers: ' + headers.join(', '));
        }

        Logger.log('');
      } else {
        Logger.log('✗ ' + sheetName + ' - NOT FOUND');
        Logger.log('');
      }
    } catch (e) {
      Logger.log('✗ ' + sheetName + ' - ERROR: ' + e.message);
      Logger.log('');
    }
  });

  Logger.log('=== CHECK COMPLETE ===');
}

/**
 * Test API access simulation - validates what the API would see
 */
function simulateAPIAccess() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('=== SIMULATING API ACCESS ===');
  Logger.log('This simulates what your apps would see via Google Sheets API');
  Logger.log('');

  Logger.log('Spreadsheet ID: ' + ss.getId());
  Logger.log('Sharing Status: ' + (ss.getSharingAccess() === SpreadsheetApp.Access.ANYONE_WITH_LINK ? '✓ Public' : '⚠️  Restricted'));
  Logger.log('Sharing Permission: ' + ss.getSharingPermission());
  Logger.log('');

  const sheets = ss.getSheets();
  Logger.log('Available Sheets for API:');

  sheets.forEach((sheet, index) => {
    Logger.log('');
    Logger.log('Sheet: ' + sheet.getName());
    Logger.log('  API Range: ' + sheet.getName() + '!A1:' + columnToLetter(sheet.getLastColumn()) + sheet.getLastRow());
    Logger.log('  Data Size: ' + sheet.getLastRow() + ' rows × ' + sheet.getLastColumn() + ' cols');

    // Sample API call format
    if (sheet.getLastRow() > 0) {
      Logger.log('  Sample API URL:');
      Logger.log('  https://sheets.googleapis.com/v4/spreadsheets/' + ss.getId() + '/values/' + encodeURIComponent(sheet.getName()) + '?key=YOUR_API_KEY');
    }
  });

  Logger.log('');
  Logger.log('=== SIMULATION COMPLETE ===');
}

/**
 * Helper function to convert column number to letter
 */
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

/**
 * Check for common issues
 */
function checkCommonIssues() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  Logger.log('=== CHECKING FOR COMMON ISSUES ===');
  Logger.log('');

  let issues = 0;

  // Check 1: Empty sheets
  Logger.log('1. Checking for empty sheets...');
  sheets.forEach(sheet => {
    if (sheet.getLastRow() === 0) {
      Logger.log('   ⚠️  EMPTY: ' + sheet.getName());
      issues++;
    }
  });
  if (issues === 0) Logger.log('   ✓ All sheets have data');
  Logger.log('');

  // Check 2: Sheets with only headers
  Logger.log('2. Checking for sheets with only headers...');
  let headerOnlyCount = 0;
  sheets.forEach(sheet => {
    if (sheet.getLastRow() === 1) {
      Logger.log('   ⚠️  HEADER ONLY: ' + sheet.getName());
      headerOnlyCount++;
      issues++;
    }
  });
  if (headerOnlyCount === 0) Logger.log('   ✓ All sheets have data rows');
  Logger.log('');

  // Check 3: Duplicate sheet names
  Logger.log('3. Checking for duplicate sheet names...');
  const sheetNames = sheets.map(s => s.getName());
  const duplicates = sheetNames.filter((name, index) => sheetNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    Logger.log('   ⚠️  DUPLICATES: ' + duplicates.join(', '));
    issues++;
  } else {
    Logger.log('   ✓ No duplicate sheet names');
  }
  Logger.log('');

  // Check 4: Sharing permissions
  Logger.log('4. Checking sharing permissions...');
  const access = ss.getSharingAccess();
  if (access === SpreadsheetApp.Access.ANYONE_WITH_LINK || access === SpreadsheetApp.Access.ANYONE) {
    Logger.log('   ✓ Spreadsheet is publicly accessible');
  } else {
    Logger.log('   ⚠️  Spreadsheet is NOT public - API may not work');
    Logger.log('   Current access: ' + access);
    issues++;
  }
  Logger.log('');

  // Summary
  Logger.log('=== ISSUES SUMMARY ===');
  if (issues === 0) {
    Logger.log('✓ No issues found! Spreadsheet looks good.');
  } else {
    Logger.log('⚠️  Found ' + issues + ' potential issue(s)');
    Logger.log('Review the warnings above');
  }
  Logger.log('');
  Logger.log('=== CHECK COMPLETE ===');
}

/**
 * Create a test menu in the spreadsheet UI
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Diagnostic Tools')
    .addItem('🔍 Full Check', 'checkSpreadsheet')
    .addItem('⚡ Quick Check', 'quickCheck')
    .addItem('🏭 Production Sheets', 'checkProductionSheets')
    .addItem('🌐 Simulate API Access', 'simulateAPIAccess')
    .addItem('⚠️  Check Issues', 'checkCommonIssues')
    .addToUi();
}
