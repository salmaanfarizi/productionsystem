/**
 * Google Apps Script: Sheet Cleanup Utility
 *
 * This script helps manage and clean up your Google Spreadsheet by:
 * 1. Listing all sheets in the spreadsheet
 * 2. Identifying required vs optional sheets
 * 3. Safely deleting unwanted sheets
 * 4. Creating a backup before deletion
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Define which sheets are REQUIRED and should NEVER be deleted
 * Add or remove sheet names as needed for your system
 */
const REQUIRED_SHEETS = [
  // Production App
  'Production Data',
  'Batch Master',
  'Batch Tracking',

  // Packing App
  'Packing Transfers',
  'WIP Inventory',
  'Daily Packing Summary',

  // Inventory App
  'Finished Goods Inventory',
  'Stock Outwards',

  // Raw Material App
  'Raw Material Inventory',
  'Raw Material Transactions',

  // Shared/System
  'Settings',

  // Optional but recommended
  'Dashboard',
  'Monthly Reports',
  'Audit Log'
];

/**
 * Sheets that are safe to delete (examples of common unwanted sheets)
 */
const COMMON_UNWANTED_SHEETS = [
  'Sheet1',
  'Sheet2',
  'Sheet3',
  'Test',
  'Backup',
  'Old Data',
  'Temp',
  'Copy of',
  'Untitled'
];

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * List all sheets in the spreadsheet
 * Run this first to see what sheets exist
 */
function listAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  Logger.log('=== ALL SHEETS IN SPREADSHEET ===');
  Logger.log(`Total sheets: ${sheets.length}\n`);

  sheets.forEach((sheet, index) => {
    const name = sheet.getName();
    const isRequired = REQUIRED_SHEETS.includes(name);
    const rowCount = sheet.getLastRow();
    const colCount = sheet.getLastColumn();

    Logger.log(`${index + 1}. ${name}`);
    Logger.log(`   - Status: ${isRequired ? '✅ REQUIRED' : '⚠️  Optional'}`);
    Logger.log(`   - Size: ${rowCount} rows × ${colCount} columns`);
    Logger.log(`   - Has data: ${rowCount > 1 ? 'Yes' : 'No'}\n`);
  });

  // Show summary
  const requiredCount = sheets.filter(s => REQUIRED_SHEETS.includes(s.getName())).length;
  const optionalCount = sheets.length - requiredCount;

  Logger.log('=== SUMMARY ===');
  Logger.log(`Required sheets: ${requiredCount}`);
  Logger.log(`Optional sheets: ${optionalCount}`);
  Logger.log('\nTo delete unwanted sheets, run: deleteUnwantedSheets()');
}

/**
 * Identify sheets that don't match required sheets
 * This is a safe check before deletion
 */
function identifyUnwantedSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  const unwantedSheets = sheets.filter(sheet => {
    const name = sheet.getName();
    return !REQUIRED_SHEETS.includes(name);
  });

  Logger.log('=== UNWANTED SHEETS (Safe to Delete) ===');
  Logger.log(`Found ${unwantedSheets.length} sheets that are not in the required list:\n`);

  if (unwantedSheets.length === 0) {
    Logger.log('✅ No unwanted sheets found! Your spreadsheet is clean.');
    return [];
  }

  unwantedSheets.forEach((sheet, index) => {
    Logger.log(`${index + 1}. "${sheet.getName()}"`);
    Logger.log(`   - Rows: ${sheet.getLastRow()}`);
    Logger.log(`   - Data: ${sheet.getLastRow() > 1 ? 'Contains data' : 'Empty'}\n`);
  });

  Logger.log('To delete these sheets, run: deleteUnwantedSheets()');
  Logger.log('⚠️  WARNING: This action cannot be undone!');

  return unwantedSheets;
}

/**
 * Delete all sheets that are not in REQUIRED_SHEETS list
 * IMPORTANT: This will permanently delete sheets!
 */
function deleteUnwantedSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  // Safety check: Don't delete if only 1 sheet exists
  if (sheets.length === 1) {
    Logger.log('❌ ERROR: Cannot delete the only sheet in the spreadsheet.');
    return;
  }

  const unwantedSheets = sheets.filter(sheet => {
    return !REQUIRED_SHEETS.includes(sheet.getName());
  });

  if (unwantedSheets.length === 0) {
    Logger.log('✅ No unwanted sheets to delete!');
    return;
  }

  Logger.log('=== DELETING UNWANTED SHEETS ===');
  Logger.log(`Preparing to delete ${unwantedSheets.length} sheets...\n`);

  let deletedCount = 0;
  let skippedCount = 0;

  unwantedSheets.forEach(sheet => {
    const sheetName = sheet.getName();

    try {
      // Double-check: never delete required sheets
      if (REQUIRED_SHEETS.includes(sheetName)) {
        Logger.log(`⚠️  SKIPPED (Protected): ${sheetName}`);
        skippedCount++;
        return;
      }

      // Safety check: don't delete if it's the last sheet
      if (ss.getSheets().length === 1) {
        Logger.log(`⚠️  SKIPPED (Last sheet): ${sheetName}`);
        skippedCount++;
        return;
      }

      ss.deleteSheet(sheet);
      Logger.log(`✅ DELETED: ${sheetName}`);
      deletedCount++;

    } catch (error) {
      Logger.log(`❌ ERROR deleting ${sheetName}: ${error.message}`);
      skippedCount++;
    }
  });

  Logger.log('\n=== DELETION COMPLETE ===');
  Logger.log(`✅ Deleted: ${deletedCount} sheets`);
  Logger.log(`⚠️  Skipped: ${skippedCount} sheets`);
  Logger.log(`📊 Remaining: ${ss.getSheets().length} sheets`);
}

/**
 * Delete specific sheets by name
 * Use this for targeted deletion
 *
 * @param {Array<string>} sheetNames - Array of sheet names to delete
 */
function deleteSpecificSheets(sheetNames) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('=== DELETING SPECIFIC SHEETS ===');
  Logger.log(`Attempting to delete ${sheetNames.length} sheets...\n`);

  let deletedCount = 0;
  let skippedCount = 0;

  sheetNames.forEach(sheetName => {
    try {
      // Safety check: don't delete required sheets
      if (REQUIRED_SHEETS.includes(sheetName)) {
        Logger.log(`⚠️  SKIPPED (Protected): ${sheetName} - This is a required sheet!`);
        skippedCount++;
        return;
      }

      const sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        Logger.log(`⚠️  SKIPPED: ${sheetName} - Sheet not found`);
        skippedCount++;
        return;
      }

      // Don't delete if it's the last sheet
      if (ss.getSheets().length === 1) {
        Logger.log(`⚠️  SKIPPED: ${sheetName} - Cannot delete the last sheet`);
        skippedCount++;
        return;
      }

      ss.deleteSheet(sheet);
      Logger.log(`✅ DELETED: ${sheetName}`);
      deletedCount++;

    } catch (error) {
      Logger.log(`❌ ERROR deleting ${sheetName}: ${error.message}`);
      skippedCount++;
    }
  });

  Logger.log('\n=== DELETION COMPLETE ===');
  Logger.log(`✅ Deleted: ${deletedCount} sheets`);
  Logger.log(`⚠️  Skipped: ${skippedCount} sheets`);
}

/**
 * Delete sheets that match a pattern (e.g., all "Copy of" sheets)
 *
 * @param {string} pattern - Pattern to match (case-insensitive)
 */
function deleteSheetsByPattern(pattern) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  const matchingSheets = sheets.filter(sheet => {
    const name = sheet.getName().toLowerCase();
    return name.includes(pattern.toLowerCase()) &&
           !REQUIRED_SHEETS.includes(sheet.getName());
  });

  if (matchingSheets.length === 0) {
    Logger.log(`No sheets found matching pattern: "${pattern}"`);
    return;
  }

  Logger.log(`Found ${matchingSheets.length} sheets matching pattern: "${pattern}"`);

  const sheetNames = matchingSheets.map(s => s.getName());
  deleteSpecificSheets(sheetNames);
}

/**
 * Hide sheets instead of deleting (safer option)
 * Hidden sheets can be unhidden later if needed
 *
 * @param {Array<string>} sheetNames - Array of sheet names to hide
 */
function hideSheets(sheetNames) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('=== HIDING SHEETS ===');

  let hiddenCount = 0;
  let skippedCount = 0;

  sheetNames.forEach(sheetName => {
    try {
      const sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        Logger.log(`⚠️  SKIPPED: ${sheetName} - Sheet not found`);
        skippedCount++;
        return;
      }

      if (sheet.isSheetHidden()) {
        Logger.log(`⚠️  SKIPPED: ${sheetName} - Already hidden`);
        skippedCount++;
        return;
      }

      sheet.hideSheet();
      Logger.log(`✅ HIDDEN: ${sheetName}`);
      hiddenCount++;

    } catch (error) {
      Logger.log(`❌ ERROR hiding ${sheetName}: ${error.message}`);
      skippedCount++;
    }
  });

  Logger.log('\n=== HIDING COMPLETE ===');
  Logger.log(`✅ Hidden: ${hiddenCount} sheets`);
  Logger.log(`⚠️  Skipped: ${skippedCount} sheets`);
}

/**
 * Create a backup sheet list before deletion
 * This creates a record of all sheets and their sizes
 */
function createBackupSheetList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  // Create or get backup sheet
  let backupSheet = ss.getSheetByName('_Backup_Sheet_List');
  if (backupSheet) {
    backupSheet.clear();
  } else {
    backupSheet = ss.insertSheet('_Backup_Sheet_List');
  }

  // Add header
  const headers = ['Timestamp', 'Sheet Name', 'Rows', 'Columns', 'Has Data', 'Status'];
  backupSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Add sheet data
  const timestamp = new Date();
  const data = sheets.map(sheet => {
    const name = sheet.getName();
    const rows = sheet.getLastRow();
    const cols = sheet.getLastColumn();
    const hasData = rows > 1 ? 'Yes' : 'No';
    const status = REQUIRED_SHEETS.includes(name) ? 'Required' : 'Optional';

    return [timestamp, name, rows, cols, hasData, status];
  });

  backupSheet.getRange(2, 1, data.length, headers.length).setValues(data);

  // Format
  backupSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  backupSheet.setFrozenRows(1);
  backupSheet.autoResizeColumns(1, headers.length);

  Logger.log(`✅ Backup sheet list created: "_Backup_Sheet_List"`);
  Logger.log(`📊 Recorded ${data.length} sheets`);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * EXAMPLE 1: Safe cleanup workflow
 */
function safeCleanupWorkflow() {
  Logger.log('Starting safe cleanup workflow...\n');

  // Step 1: List all sheets
  listAllSheets();

  Logger.log('\n---\n');

  // Step 2: Create backup
  createBackupSheetList();

  Logger.log('\n---\n');

  // Step 3: Identify unwanted
  identifyUnwantedSheets();

  Logger.log('\n---\n');
  Logger.log('Review the output above.');
  Logger.log('If you want to proceed with deletion, run: deleteUnwantedSheets()');
}

/**
 * EXAMPLE 2: Delete specific sheets
 */
function deleteMyUnwantedSheets() {
  // List sheets you want to delete
  const sheetsToDelete = [
    'Sheet1',
    'Sheet2',
    'Test',
    'Backup - Old'
  ];

  deleteSpecificSheets(sheetsToDelete);
}

/**
 * EXAMPLE 3: Delete all "Copy of" sheets
 */
function deleteAllCopySheets() {
  deleteSheetsByPattern('Copy of');
}

/**
 * EXAMPLE 4: Delete all empty sheets
 */
function deleteEmptySheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  const emptySheets = sheets.filter(sheet => {
    return sheet.getLastRow() <= 1 && // Only header or completely empty
           !REQUIRED_SHEETS.includes(sheet.getName());
  });

  if (emptySheets.length === 0) {
    Logger.log('No empty sheets found.');
    return;
  }

  const sheetNames = emptySheets.map(s => s.getName());
  Logger.log(`Found ${sheetNames.length} empty sheets: ${sheetNames.join(', ')}`);

  deleteSpecificSheets(sheetNames);
}

// ============================================================================
// CUSTOM MENU (Add to Google Sheets UI)
// ============================================================================

/**
 * Creates a custom menu in Google Sheets
 * This makes the cleanup tools easily accessible
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🧹 Sheet Cleanup')
    .addItem('📋 List All Sheets', 'listAllSheets')
    .addItem('🔍 Identify Unwanted Sheets', 'identifyUnwantedSheets')
    .addSeparator()
    .addItem('💾 Create Backup List', 'createBackupSheetList')
    .addSeparator()
    .addItem('🗑️ Delete Unwanted Sheets', 'deleteUnwantedSheets')
    .addItem('🗑️ Delete Empty Sheets', 'deleteEmptySheets')
    .addItem('🗑️ Delete "Copy of" Sheets', 'deleteAllCopySheets')
    .addSeparator()
    .addItem('👁️ Hide Unwanted Sheets', 'hideUnwantedSheetsMenu')
    .addToUi();
}

function hideUnwantedSheetsMenu() {
  const unwantedSheets = identifyUnwantedSheets();
  if (unwantedSheets.length > 0) {
    const sheetNames = unwantedSheets.map(s => s.getName());
    hideSheets(sheetNames);
  }
}
