/**
 * Store Update Sync
 *
 * Reads the daily "STORE UPDATE" tabs in "Packing and dispach 2026" (read-only)
 * and keeps these tabs in the apps' database spreadsheet up to date:
 *   Item Master      - one row per item, store codes (written once from ItemMasterSeed.js)
 *   Material Master  - packing materials (written once)
 *   FG Daily         - one row per item per day
 *   Sync Issues      - problems found on the daily tabs
 *   Store Movements  - packed / despatched entries made in the Packing app
 *   Parallel Check   - app entries compared with the store sheet, per day and item
 *
 * Runs as a standalone Apps Script project together with StoreUpdateParser.js
 * and ItemMasterSeed.js. Setup steps: google-apps-script/STORE_SYNC_SETUP.md
 */

var SYNC_CONFIG = {
  // "Packing and dispach 2026" - only read, never changed
  STORE_SPREADSHEET_ID: 'PASTE_STORE_SPREADSHEET_ID',
  // "Enhanced Production Tracking System" - the apps' database
  DATABASE_SPREADSHEET_ID: 'PASTE_DATABASE_SPREADSHEET_ID',
  // Recent days are read again on every run because people correct them
  REREAD_DAYS: 14,
  // Automatic sync interval: 1, 2, 4, 6, 8 or 12 hours
  SYNC_EVERY_HOURS: 1
};

var SYNC_SHEETS = {
  ITEMS: 'Item Master',
  MATERIALS: 'Material Master',
  DAILY: 'FG Daily',
  ISSUES: 'Sync Issues',
  MOVEMENTS: 'Store Movements',
  PARALLEL: 'Parallel Check'
};

var FG_DAILY_HEADERS = [
  'Date', 'Item Key', 'Code', 'Group', 'Item', 'Opening', 'Production', 'Despatch',
  'Closing', 'Min Level', 'Suggested Min', 'Required Qty', 'Specific Order',
  'Deliver By', 'Order Status', 'Absentees', 'Source Tab', 'Source Row', 'Synced At'
];

var SYNC_ISSUE_HEADERS = [
  'Date', 'Source Tab', 'Source Row', 'Item Key', 'Code', 'Item', 'Issue', 'Details'
];

// Written by the Packing app (shared/utils/storeUpdate.js uses the same columns)
var STORE_MOVEMENT_HEADERS = [
  'Entry ID', 'Date', 'Type', 'Item Key', 'Code', 'Group', 'Item', 'Units',
  'Reference', 'Note', 'Entered By', 'Entered At', 'Status'
];

var PARALLEL_CHECK_HEADERS = [
  'Date', 'Item Key', 'Code', 'Group', 'Item', 'Sheet Packed', 'App Packed',
  'Sheet Despatched', 'App Despatched', 'Result'
];

// Columns kept as plain text so dates stay "yyyy-MM-dd" and codes like "1" stay text
var FG_DAILY_TEXT_COLUMNS = ['Date', 'Code', 'Deliver By', 'Synced At'];
var SYNC_ISSUE_TEXT_COLUMNS = ['Date', 'Code'];
var STORE_MOVEMENT_TEXT_COLUMNS = ['Entry ID', 'Date', 'Code', 'Entered At'];
var PARALLEL_CHECK_TEXT_COLUMNS = ['Date', 'Code'];

// Issues found while reading a tab; other issues are recalculated from FG Daily on every run
var READ_ISSUES = ['No date', 'No item table', 'Not a number', 'Missing item code'];

// Widest part of a daily tab that the item table can use
var STORE_MAX_COLUMNS = 30;

/**
 * One-time setup: creates the tabs, writes the master data, and loads every day.
 */
function setupConsolidation() {
  checkSyncConfig_();
  var db = SpreadsheetApp.openById(SYNC_CONFIG.DATABASE_SPREADSHEET_ID);

  var items = ensureSheet_(db, SYNC_SHEETS.ITEMS, ITEM_MASTER_HEADERS, ['Code']);
  var addedItems = appendMissingRows_(items, ITEM_MASTER_SEED);
  var materials = ensureSheet_(db, SYNC_SHEETS.MATERIALS, MATERIAL_MASTER_HEADERS, ['Code']);
  var addedMaterials = appendMissingRows_(materials, MATERIAL_MASTER_SEED);
  ensureSheet_(db, SYNC_SHEETS.DAILY, FG_DAILY_HEADERS, FG_DAILY_TEXT_COLUMNS);
  ensureSheet_(db, SYNC_SHEETS.ISSUES, SYNC_ISSUE_HEADERS, SYNC_ISSUE_TEXT_COLUMNS);
  ensureSheet_(db, SYNC_SHEETS.MOVEMENTS, STORE_MOVEMENT_HEADERS, STORE_MOVEMENT_TEXT_COLUMNS);
  ensureSheet_(db, SYNC_SHEETS.PARALLEL, PARALLEL_CHECK_HEADERS, PARALLEL_CHECK_TEXT_COLUMNS);

  Logger.log('Item Master: ' + addedItems + ' rows added. Material Master: ' + addedMaterials + ' rows added.');
  rebuildStoreUpdates();
}

/**
 * Normal sync: re-reads the last REREAD_DAYS days. Used by the automatic trigger.
 */
function syncStoreUpdates() {
  runStoreSync_(false);
}

/**
 * Full sync: re-reads every daily tab. Use after editing the Item Master.
 */
function rebuildStoreUpdates() {
  runStoreSync_(true);
}

function installAutoSync() {
  removeAutoSync();
  ScriptApp.newTrigger('syncStoreUpdates')
    .timeBased()
    .everyHours(SYNC_CONFIG.SYNC_EVERY_HOURS)
    .create();
  Logger.log('Automatic sync every ' + SYNC_CONFIG.SYNC_EVERY_HOURS + ' hour(s) is on.');
}

function removeAutoSync() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncStoreUpdates') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function runStoreSync_(fullRebuild) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) {
    Logger.log('Another sync is still running - skipped.');
    return;
  }

  try {
    checkSyncConfig_();
    var db = SpreadsheetApp.openById(SYNC_CONFIG.DATABASE_SPREADSHEET_ID);
    var store = SpreadsheetApp.openById(SYNC_CONFIG.STORE_SPREADSHEET_ID);
    var timeZone = store.getSpreadsheetTimeZone();
    var formatDate = function (date) { return Utilities.formatDate(date, timeZone, 'yyyy-MM-dd'); };
    var syncedAt = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm');

    var dailySheet = requireSheet_(db, SYNC_SHEETS.DAILY, FG_DAILY_HEADERS);
    var issuesSheet = requireSheet_(db, SYNC_SHEETS.ISSUES, SYNC_ISSUE_HEADERS);
    var itemMaster = itemMasterFromRows(readBody_(requireSheet_(db, SYNC_SHEETS.ITEMS, ITEM_MASTER_HEADERS)));

    var existing = readBody_(dailySheet).map(function (values) { return dailyRowFromValues_(values, formatDate); });
    var cutoff = '';
    if (!fullRebuild && existing.length > 0) {
      var latest = existing.reduce(function (max, row) { return row.date > max ? row.date : max; }, '');
      cutoff = shiftDate_(latest, -SYNC_CONFIG.REREAD_DAYS);
    }

    var rows = existing.filter(function (row) { return row.date && row.date < cutoff; });
    var issues = readBody_(issuesSheet)
      .map(function (values) { return issueFromValues_(values, formatDate); })
      .filter(function (issue) { return issue.date && issue.date < cutoff && READ_ISSUES.indexOf(issue.issue) !== -1; });

    var tabsRead = 0;
    store.getSheets().forEach(function (sheet) {
      var lastRow = sheet.getLastRow();
      var lastColumn = Math.min(sheet.getLastColumn(), STORE_MAX_COLUMNS);
      if (lastRow < 5 || lastColumn < 5) return;

      // Check the title and date first so old days are skipped without reading the whole tab
      var peek = parseStoreUpdateGrid(sheet.getRange(1, 1, 6, lastColumn).getValues(), formatDate);
      if (!peek.isStoreUpdate || (peek.date && peek.date < cutoff)) return;

      var parsed = parseStoreUpdateGrid(sheet.getRange(1, 1, lastRow, lastColumn).getValues(), formatDate);
      tabsRead++;
      parsed.problems.forEach(function (problem) {
        issues.push({
          date: parsed.date || '', sourceTab: sheet.getName(), sourceRow: problem.row, itemKey: '',
          code: problem.code || '', name: problem.name || '', issue: problem.issue, details: problem.details
        });
      });
      if (!parsed.date) return;

      parsed.items.forEach(function (item) {
        rows.push({
          date: parsed.date, code: item.code, group: item.group, name: item.name,
          opening: item.opening, production: item.production, despatch: item.despatch,
          closing: item.closing, minLevel: item.minLevel, suggestedMin: item.suggestedMin,
          requiredQty: item.requiredQty, specificOrder: item.specificOrder,
          deliverBy: item.deliverBy, orderStatus: item.orderStatus, absentees: parsed.absentees,
          sourceTab: sheet.getName(), sourceRow: item.row, syncedAt: syncedAt
        });
      });
    });

    // Match every row again so Item Master edits apply to the whole history
    rows.forEach(function (row) {
      var match = matchStoreItem(itemMaster, row.group, row.code, row.name);
      row.itemKey = match ? match.entry.key : '';
      row.masterCode = match ? match.entry.code : '';
      row.codeMismatch = match ? match.codeMismatch : false;
    });
    rows.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      if (a.sourceTab !== b.sourceTab) return a.sourceTab < b.sourceTab ? -1 : 1;
      return a.sourceRow - b.sourceRow;
    });

    issues = issues.concat(checkStoreRows(rows)).sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });

    writeBody_(dailySheet, rows.map(dailyValuesFromRow_), FG_DAILY_HEADERS, FG_DAILY_TEXT_COLUMNS);
    writeBody_(issuesSheet, issues.map(issueValues_), SYNC_ISSUE_HEADERS, SYNC_ISSUE_TEXT_COLUMNS);

    // Trial period: compare app entries with the store sheet (tabs exist once setup has run with them)
    var movementsSheet = db.getSheetByName(SYNC_SHEETS.MOVEMENTS);
    var parallelSheet = db.getSheetByName(SYNC_SHEETS.PARALLEL);
    if (movementsSheet && parallelSheet) {
      checkHeaders_(movementsSheet, STORE_MOVEMENT_HEADERS);
      checkHeaders_(parallelSheet, PARALLEL_CHECK_HEADERS);
      var movements = readBody_(movementsSheet).map(function (values) { return movementFromValues_(values, formatDate); });
      var checks = compareStoreMovements(rows, movements);
      writeBody_(parallelSheet, checks.map(parallelValues_), PARALLEL_CHECK_HEADERS, PARALLEL_CHECK_TEXT_COLUMNS);
    }

    Logger.log((fullRebuild ? 'Full sync' : 'Sync') + ' done: ' + tabsRead + ' tabs read, ' +
      rows.length + ' rows in ' + SYNC_SHEETS.DAILY + ', ' + issues.length + ' issues.');
  } finally {
    lock.releaseLock();
  }
}

function checkSyncConfig_() {
  if (SYNC_CONFIG.STORE_SPREADSHEET_ID.indexOf('PASTE_') === 0 ||
      SYNC_CONFIG.DATABASE_SPREADSHEET_ID.indexOf('PASTE_') === 0) {
    throw new Error('Set STORE_SPREADSHEET_ID and DATABASE_SPREADSHEET_ID in SYNC_CONFIG first.');
  }
}

/**
 * Create a tab with its header row, or check that an existing tab has the same headers.
 * @param {Array<string>} textColumns - headers of columns kept as plain text
 */
function ensureSheet_(spreadsheet, name, headers, textColumns) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    textColumns.forEach(function (header) {
      sheet.getRange(1, headers.indexOf(header) + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
    });
    return sheet;
  }
  checkHeaders_(sheet, headers);
  return sheet;
}

function requireSheet_(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    throw new Error('Tab "' + name + '" is missing - run setupConsolidation first.');
  }
  checkHeaders_(sheet, headers);
  return sheet;
}

function checkHeaders_(sheet, headers) {
  var actual = sheet.getRange(1, 1, 1, headers.length).getValues()[0].map(function (cell) {
    return String(cell).trim();
  });
  if (actual.join('|') !== headers.join('|')) {
    throw new Error('Tab "' + sheet.getName() + '" has different column headers than expected. ' +
      'Expected: ' + headers.join(', '));
  }
}

function readBody_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
}

function writeBody_(sheet, rows, headers, textColumns) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }
  if (rows.length === 0) return;

  // Rows added past the formatted area would otherwise turn date text into dates
  textColumns.forEach(function (header) {
    sheet.getRange(2, headers.indexOf(header) + 1, rows.length, 1).setNumberFormat('@');
  });
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

/**
 * Add seed rows whose key (first column) isn't on the sheet yet. Existing rows are left alone.
 */
function appendMissingRows_(sheet, seedRows) {
  var existingKeys = {};
  readBody_(sheet).forEach(function (row) { existingKeys[String(row[0]).trim()] = true; });
  var missing = seedRows.filter(function (row) { return !existingKeys[row[0]]; });
  if (missing.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, missing.length, missing[0].length).setValues(missing);
  }
  return missing.length;
}

function shiftDate_(isoDate, days) {
  var parts = isoDate.split('-').map(Number);
  var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
  return date.toISOString().slice(0, 10);
}

function cellToNumber_(value) {
  return value === '' || value === null ? null : Number(value);
}

function cellToDate_(value, formatDate) {
  return Object.prototype.toString.call(value) === '[object Date]' ? formatDate(value) : String(value);
}

function dailyValuesFromRow_(row) {
  var blank = function (value) { return value === null || value === undefined ? '' : value; };
  return [
    row.date, row.itemKey, row.code, row.group, row.name,
    blank(row.opening), blank(row.production), blank(row.despatch), blank(row.closing),
    blank(row.minLevel), blank(row.suggestedMin), blank(row.requiredQty), blank(row.specificOrder),
    blank(row.deliverBy), blank(row.orderStatus), blank(row.absentees),
    row.sourceTab, row.sourceRow, row.syncedAt
  ];
}

function dailyRowFromValues_(values, formatDate) {
  return {
    date: cellToDate_(values[0], formatDate),
    code: String(values[2]).trim(),
    group: String(values[3]).trim(),
    name: String(values[4]),
    opening: cellToNumber_(values[5]),
    production: cellToNumber_(values[6]),
    despatch: cellToNumber_(values[7]),
    closing: cellToNumber_(values[8]),
    minLevel: cellToNumber_(values[9]),
    suggestedMin: cellToNumber_(values[10]),
    requiredQty: cellToNumber_(values[11]),
    specificOrder: cellToNumber_(values[12]),
    deliverBy: cellToDate_(values[13], formatDate),
    orderStatus: String(values[14]),
    absentees: String(values[15]),
    sourceTab: String(values[16]),
    sourceRow: Number(values[17]),
    syncedAt: cellToDate_(values[18], formatDate)
  };
}

function movementFromValues_(values, formatDate) {
  return {
    entryId: String(values[0]), date: cellToDate_(values[1], formatDate), type: String(values[2]).trim(),
    itemKey: String(values[3]).trim(), code: String(values[4]).trim(), group: String(values[5]).trim(),
    name: String(values[6]), units: cellToNumber_(values[7]), status: String(values[12])
  };
}

function parallelValues_(check) {
  return [
    check.date, check.itemKey, check.code, check.group, check.name,
    check.sheetPacked, check.appPacked, check.sheetDespatched, check.appDespatched, check.result
  ];
}

function issueValues_(issue) {
  return [issue.date, issue.sourceTab, issue.sourceRow, issue.itemKey, issue.code, issue.name, issue.issue, issue.details];
}

function issueFromValues_(values, formatDate) {
  return {
    date: cellToDate_(values[0], formatDate), sourceTab: String(values[1]), sourceRow: values[2],
    itemKey: String(values[3]), code: String(values[4]), name: String(values[5]),
    issue: String(values[6]), details: String(values[7])
  };
}
