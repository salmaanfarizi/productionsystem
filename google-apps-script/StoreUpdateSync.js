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
 *   Item Materials   - packing materials used by one unit of each item (written once)
 *   Material Issues  - rolls, covers and cartons issued, from the daily tabs
 *   Material Movements - deliveries and stock counts entered in the Packing app
 *   Material Stock   - balance, daily use and days left per material
 *
 * Runs as a standalone Apps Script project together with StoreUpdateParser.js,
 * ItemMasterSeed.js and MaterialStock.js. Setup steps: google-apps-script/STORE_SYNC_SETUP.md
 */

var SYNC_CONFIG = {
  // "Packing and dispach 2026" - only read, never changed
  STORE_SPREADSHEET_ID: 'PASTE_STORE_SPREADSHEET_ID',
  // "Enhanced Production Tracking System" - the apps' database
  DATABASE_SPREADSHEET_ID: 'PASTE_DATABASE_SPREADSHEET_ID',
  // Recent days are read again on every run because people correct them
  REREAD_DAYS: 14,
  // Automatic sync interval: 1, 2, 4, 6, 8 or 12 hours
  SYNC_EVERY_HOURS: 1,
  // Old "PACKING STOCK" sheet - only needed once, for importPackingStockSheet
  PACKING_STOCK_SPREADSHEET_ID: 'PASTE_PACKING_STOCK_SPREADSHEET_ID'
};

var SYNC_SHEETS = {
  ITEMS: 'Item Master',
  MATERIALS: 'Material Master',
  DAILY: 'FG Daily',
  ISSUES: 'Sync Issues',
  MOVEMENTS: 'Store Movements',
  PARALLEL: 'Parallel Check',
  ITEM_MATERIALS: 'Item Materials',
  MATERIAL_ISSUES: 'Material Issues',
  MATERIAL_MOVEMENTS: 'Material Movements',
  MATERIAL_STOCK: 'Material Stock'
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

var MATERIAL_ISSUE_HEADERS = [
  'Date', 'Material ID', 'Block', 'Sheet Item', 'Size', 'Issued', 'Wastage (kg)', 'Source Tab', 'Source Row'
];

// Written by the Packing app (shared/utils/materials.js uses the same columns)
var MATERIAL_MOVEMENT_HEADERS = [
  'Entry ID', 'Date', 'Type', 'Material ID', 'Material', 'Qty', 'Unit',
  'Reference', 'Note', 'Entered By', 'Entered At', 'Status'
];

var MATERIAL_STOCK_HEADERS = [
  'Material ID', 'Code', 'Material', 'Category', 'Unit', 'Usage From', 'Count Date', 'Counted',
  'Received Since', 'Used Since', 'Balance', 'Used (30 days)', 'Avg Daily Use', 'Days Left',
  'Status', 'Expected Use (30 days)', 'Last Used', 'Updated At'
];

var PACKING_STOCK_REFERENCE = 'PACKING STOCK sheet';

// Columns kept as plain text so dates stay "yyyy-MM-dd" and codes like "1" stay text
var FG_DAILY_TEXT_COLUMNS = ['Date', 'Code', 'Deliver By', 'Synced At'];
var SYNC_ISSUE_TEXT_COLUMNS = ['Date', 'Code'];
var STORE_MOVEMENT_TEXT_COLUMNS = ['Entry ID', 'Date', 'Code', 'Entered At'];
var PARALLEL_CHECK_TEXT_COLUMNS = ['Date', 'Code'];
var MATERIAL_ISSUE_TEXT_COLUMNS = ['Date'];
var MATERIAL_MOVEMENT_TEXT_COLUMNS = ['Entry ID', 'Date', 'Entered At'];
var MATERIAL_STOCK_TEXT_COLUMNS = ['Code', 'Count Date', 'Last Used', 'Updated At'];

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
  // Tabs made before Step 4 lack the store sheet columns
  fillBlankColumns_(materials, MATERIAL_MASTER_SEED, MATERIAL_MASTER_HEADERS, ['Store Sheet Block', 'Store Sheet Names']);
  var links = ensureSheet_(db, SYNC_SHEETS.ITEM_MATERIALS, ITEM_MATERIAL_HEADERS, []);
  var addedLinks = appendMissingRows_(links, ITEM_MATERIAL_SEED, function (row) {
    return String(row[0]).trim() + '|' + String(row[1]).trim();
  });
  ensureSheet_(db, SYNC_SHEETS.DAILY, FG_DAILY_HEADERS, FG_DAILY_TEXT_COLUMNS);
  ensureSheet_(db, SYNC_SHEETS.ISSUES, SYNC_ISSUE_HEADERS, SYNC_ISSUE_TEXT_COLUMNS);
  ensureSheet_(db, SYNC_SHEETS.MOVEMENTS, STORE_MOVEMENT_HEADERS, STORE_MOVEMENT_TEXT_COLUMNS);
  ensureSheet_(db, SYNC_SHEETS.PARALLEL, PARALLEL_CHECK_HEADERS, PARALLEL_CHECK_TEXT_COLUMNS);
  ensureSheet_(db, SYNC_SHEETS.MATERIAL_ISSUES, MATERIAL_ISSUE_HEADERS, MATERIAL_ISSUE_TEXT_COLUMNS);
  ensureSheet_(db, SYNC_SHEETS.MATERIAL_MOVEMENTS, MATERIAL_MOVEMENT_HEADERS, MATERIAL_MOVEMENT_TEXT_COLUMNS);
  ensureSheet_(db, SYNC_SHEETS.MATERIAL_STOCK, MATERIAL_STOCK_HEADERS, MATERIAL_STOCK_TEXT_COLUMNS);

  Logger.log('Item Master: ' + addedItems + ' rows added. Material Master: ' + addedMaterials +
    ' rows added. Item Materials: ' + addedLinks + ' rows added.');
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

    var materialTabs = materialTabs_(db);
    var materialLines = materialTabs
      ? readBody_(materialTabs.issues)
        .map(function (values) { return materialIssueFromValues_(values, formatDate); })
        .filter(function (line) { return line.date && line.date < cutoff; })
      : [];

    var tabsRead = 0;
    store.getSheets().forEach(function (sheet) {
      var lastRow = sheet.getLastRow();
      var lastColumn = Math.min(sheet.getLastColumn(), STORE_MAX_COLUMNS);
      if (lastRow < 5 || lastColumn < 5) return;

      // Check the title and date first so old days are skipped without reading the whole tab
      var peek = parseStoreUpdateGrid(sheet.getRange(1, 1, 6, lastColumn).getValues(), formatDate);
      if (!peek.isStoreUpdate || (peek.date && peek.date < cutoff)) return;

      var values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
      var parsed = parseStoreUpdateGrid(values, formatDate);
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

      if (!materialTabs) return;
      var materialsOnTab = parseMaterialIssues(values);
      materialsOnTab.problems.forEach(function (problem) {
        issues.push({
          date: parsed.date, sourceTab: sheet.getName(), sourceRow: problem.row, itemKey: '',
          code: '', name: problem.name, issue: problem.issue, details: problem.details
        });
      });
      materialsOnTab.lines.forEach(function (line) {
        materialLines.push({
          date: parsed.date, block: line.block, name: line.name, size: line.size,
          quantity: line.quantity, wastageKg: line.wastageKg,
          sourceTab: sheet.getName(), sourceRow: line.row
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

    issues = issues.concat(checkStoreRows(rows));
    var materialSummary = ' Material stock is off - run setupConsolidation to turn it on.';
    if (materialTabs) {
      var materialResult = syncMaterials_(materialTabs, rows, materialLines, formatDate, syncedAt);
      issues = issues.concat(materialResult.issues);
      materialSummary = ' ' + materialResult.summary;
    }
    issues.sort(function (a, b) {
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
      rows.length + ' rows in ' + SYNC_SHEETS.DAILY + ', ' + issues.length + ' issues.' + materialSummary);
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

  // A tab made by an earlier version may lack the newest columns at the end
  var actual = sheet.getRange(1, 1, 1, headers.length).getValues()[0].map(function (cell) {
    return String(cell).trim();
  });
  var matching = 0;
  while (matching < headers.length && actual[matching] === headers[matching]) matching++;
  var restBlank = actual.slice(matching).every(function (cell) { return cell === ''; });
  if (matching > 0 && matching < headers.length && restBlank) {
    sheet.getRange(1, matching + 1, 1, headers.length - matching)
      .setValues([headers.slice(matching)])
      .setFontWeight('bold');
    textColumns.forEach(function (header) {
      var column = headers.indexOf(header);
      if (column >= matching) sheet.getRange(1, column + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
    });
    Logger.log('Tab "' + name + '": added columns ' + headers.slice(matching).join(', '));
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
 * Add seed rows whose key isn't on the sheet yet. Existing rows are left alone.
 * @param {function(Array): string} keyOf - row key (default: first column)
 */
function appendMissingRows_(sheet, seedRows, keyOf) {
  keyOf = keyOf || function (row) { return String(row[0]).trim(); };
  var existingKeys = {};
  readBody_(sheet).forEach(function (row) { existingKeys[keyOf(row)] = true; });
  var missing = seedRows.filter(function (row) { return !existingKeys[keyOf(row)]; });
  if (missing.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, missing.length, missing[0].length).setValues(missing);
  }
  return missing.length;
}

/**
 * Fill blank cells in the given columns from the seed row with the same key (first column).
 * Used when a newer version adds columns to an existing tab; filled cells are left alone.
 */
function fillBlankColumns_(sheet, seedRows, headers, columnNames) {
  var body = readBody_(sheet);
  if (body.length === 0) return;
  var seedByKey = {};
  seedRows.forEach(function (row) { seedByKey[row[0]] = row; });

  columnNames.forEach(function (columnName) {
    var column = headers.indexOf(columnName);
    var changed = false;
    var values = body.map(function (row) {
      var current = row[column] === undefined ? '' : row[column];
      var seed = seedByKey[String(row[0]).trim()];
      if (current === '' && seed && seed[column] !== '') {
        changed = true;
        return [seed[column]];
      }
      return [current];
    });
    if (changed) sheet.getRange(2, column + 1, body.length, 1).setValues(values);
  });
}

function appendRows_(sheet, rows, headers, textColumns) {
  if (rows.length === 0) return;
  var firstRow = sheet.getLastRow() + 1;
  textColumns.forEach(function (header) {
    sheet.getRange(firstRow, headers.indexOf(header) + 1, rows.length, 1).setNumberFormat('@');
  });
  sheet.getRange(firstRow, 1, rows.length, headers.length).setValues(rows);
}

/**
 * The Step 4 tabs, or null when setup hasn't created them yet.
 */
function materialTabs_(db) {
  var tabs = {
    materials: [SYNC_SHEETS.MATERIALS, MATERIAL_MASTER_HEADERS],
    links: [SYNC_SHEETS.ITEM_MATERIALS, ITEM_MATERIAL_HEADERS],
    issues: [SYNC_SHEETS.MATERIAL_ISSUES, MATERIAL_ISSUE_HEADERS],
    movements: [SYNC_SHEETS.MATERIAL_MOVEMENTS, MATERIAL_MOVEMENT_HEADERS],
    stock: [SYNC_SHEETS.MATERIAL_STOCK, MATERIAL_STOCK_HEADERS]
  };
  var sheets = {};
  var keys = Object.keys(tabs);
  for (var i = 0; i < keys.length; i++) {
    var sheet = db.getSheetByName(tabs[keys[i]][0]);
    if (!sheet) return null;
    checkHeaders_(sheet, tabs[keys[i]][1]);
    sheets[keys[i]] = sheet;
  }
  return sheets;
}

/**
 * Match the issued lines, recalculate every material's stock, and fill
 * Suggested per Unit in Item Materials.
 */
function syncMaterials_(tabs, dailyRows, lines, formatDate, syncedAt) {
  var materials = materialMasterFromRows(readBody_(tabs.materials));
  lines.forEach(function (line) {
    var material = matchMaterial(materials, line.block, line.name);
    line.materialId = material ? material.id : '';
  });
  lines.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.sourceTab !== b.sourceTab) return a.sourceTab < b.sourceTab ? -1 : 1;
    return a.sourceRow - b.sourceRow;
  });

  var linkRows = readBody_(tabs.links);
  var movements = readBody_(tabs.movements).map(function (values) {
    return materialMovementFromValues_(values, formatDate);
  });
  var result = computeMaterialStock({
    materials: materials,
    links: itemMaterialsFromRows(linkRows),
    movements: movements,
    issues: lines,
    dailyRows: dailyRows
  });

  writeBody_(tabs.issues, lines.map(materialIssueValues_), MATERIAL_ISSUE_HEADERS, MATERIAL_ISSUE_TEXT_COLUMNS);
  writeBody_(tabs.stock, result.stock.map(function (row) { return materialStockValues_(row, syncedAt); }),
    MATERIAL_STOCK_HEADERS, MATERIAL_STOCK_TEXT_COLUMNS);

  if (linkRows.length > 0) {
    var suggested = linkRows.map(function (row) {
      var value = result.suggestions[String(row[0]).trim() + '|' + String(row[1]).trim()];
      return [value === undefined ? '' : value];
    });
    tabs.links.getRange(2, ITEM_MATERIAL_HEADERS.indexOf('Suggested per Unit') + 1, linkRows.length, 1)
      .setValues(suggested);
  }

  var counted = result.stock.filter(function (row) { return row.countDate; }).length;
  return {
    issues: checkMaterialLines(lines),
    summary: lines.length + ' material lines, ' + result.stock.length + ' materials (' + counted + ' counted).'
  };
}

/**
 * One-time import of the opening stock (and that month's receipts) from the old
 * PACKING STOCK sheet into Material Movements, so balances start from real numbers.
 */
function importPackingStockSheet() {
  checkSyncConfig_();
  if (SYNC_CONFIG.PACKING_STOCK_SPREADSHEET_ID.indexOf('PASTE_') === 0) {
    throw new Error('Set PACKING_STOCK_SPREADSHEET_ID in SYNC_CONFIG first.');
  }
  var db = SpreadsheetApp.openById(SYNC_CONFIG.DATABASE_SPREADSHEET_ID);
  var tabs = materialTabs_(db);
  if (!tabs) {
    throw new Error('Material tabs are missing - run setupConsolidation first.');
  }

  var timeZone = db.getSpreadsheetTimeZone();
  var formatDate = function (date) { return Utilities.formatDate(date, timeZone, 'yyyy-MM-dd'); };
  var alreadyImported = readBody_(tabs.movements).some(function (values) {
    return materialMovementFromValues_(values, formatDate).reference === PACKING_STOCK_REFERENCE;
  });
  if (alreadyImported) {
    Logger.log('The PACKING STOCK sheet was already imported - nothing to do.');
    return;
  }

  var summary = null;
  SpreadsheetApp.openById(SYNC_CONFIG.PACKING_STOCK_SPREADSHEET_ID).getSheets().some(function (sheet) {
    var parsed = parsePackingStockSummary(sheet.getDataRange().getValues());
    if (parsed.rows.length > 0 && parsed.asOf) summary = parsed;
    return summary !== null;
  });
  if (!summary) {
    throw new Error('Could not find the summary tab with "Opening stock as of" and "Opening / Total".');
  }

  var materials = {};
  materialMasterFromRows(readBody_(tabs.materials)).forEach(function (material) {
    materials[material.id] = material;
  });
  var countDate = shiftDate_(summary.asOf, -1);
  var enteredAt = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm');
  var rows = [];
  summary.rows.forEach(function (row) {
    var material = materials[row.id];
    if (!material) return;
    if (row.opening !== null) {
      rows.push(['IMP-COUNT-' + row.id, countDate, MATERIAL_MOVEMENT_TYPES.COUNT, row.id, material.name,
        row.opening, material.unit, PACKING_STOCK_REFERENCE, 'Opening stock as of ' + summary.asOf,
        'Import', enteredAt, 'ACTIVE']);
    }
    if (row.added) {
      rows.push(['IMP-RECEIVED-' + row.id, summary.asOf, MATERIAL_MOVEMENT_TYPES.RECEIVED, row.id, material.name,
        row.added, material.unit, PACKING_STOCK_REFERENCE, 'Received that month (day not recorded)',
        'Import', enteredAt, 'ACTIVE']);
    }
  });

  appendRows_(tabs.movements, rows, MATERIAL_MOVEMENT_HEADERS, MATERIAL_MOVEMENT_TEXT_COLUMNS);
  Logger.log('Imported ' + rows.length + ' rows from the PACKING STOCK sheet (opening stock as of ' + summary.asOf + ').');
  syncStoreUpdates();
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

function blankIfNull_(value) {
  return value === null || value === undefined ? '' : value;
}

function materialIssueFromValues_(values, formatDate) {
  return {
    date: cellToDate_(values[0], formatDate), block: String(values[2]).trim(), name: String(values[3]),
    size: String(values[4]), quantity: cellToNumber_(values[5]), wastageKg: cellToNumber_(values[6]),
    sourceTab: String(values[7]), sourceRow: Number(values[8])
  };
}

function materialIssueValues_(line) {
  return [
    line.date, line.materialId, line.block, line.name, line.size, line.quantity,
    blankIfNull_(line.wastageKg), line.sourceTab, line.sourceRow
  ];
}

function materialMovementFromValues_(values, formatDate) {
  return {
    entryId: String(values[0]), date: cellToDate_(values[1], formatDate), type: String(values[2]).trim(),
    materialId: String(values[3]).trim(), qty: cellToNumber_(values[5]), reference: String(values[7]),
    enteredAt: cellToDate_(values[10], formatDate), status: String(values[11])
  };
}

function materialStockValues_(row, syncedAt) {
  return [
    row.materialId, row.code, row.name, row.category, row.unit, row.usageSource, row.countDate,
    blankIfNull_(row.counted), blankIfNull_(row.receivedSince), blankIfNull_(row.usedSince),
    blankIfNull_(row.balance), row.used30, row.avgDaily, blankIfNull_(row.daysLeft), row.status,
    blankIfNull_(row.expected30), row.lastUsed, syncedAt
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
