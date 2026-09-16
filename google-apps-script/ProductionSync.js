/**
 * Production Sync
 *
 * Reads the monthly tabs of "Daily production data 2026" (read-only) and keeps these
 * tabs in the apps' database spreadsheet up to date:
 *   Seed Lines        - one row per seed type / size / supplier (new sheet columns are added)
 *   Production Log    - daily entries made in the Production app
 *   Production Days   - one row per day: shift, sacks, salt, destinations, diesel, waste water, waste
 *   Seed Use          - one row per day per seed line
 *   Production Check  - Production app entries compared with the sheet (trial)
 *   Production Issues - problems found on the production sheet
 *
 * Part of the same Apps Script project as StoreUpdateSync.js (uses its SYNC_CONFIG and helpers)
 * and runs with every store sync once PRODUCTION_SPREADSHEET_ID is set.
 */

var PRODUCTION_SHEETS = {
  LINES: 'Seed Lines',
  LOG: 'Production Log',
  DAYS: 'Production Days',
  SEED_USE: 'Seed Use',
  CHECK: 'Production Check',
  ISSUES: 'Production Issues'
};

var SEED_LINE_HEADERS = ['Line ID', 'Seed', 'Size', 'Supplier', 'Sheet Names', 'Active', 'Notes'];

// Written by the Production app (shared/utils/productionLog.js uses the same columns)
var PRODUCTION_LOG_HEADERS = [
  'Save ID', 'Date', 'Kind', 'Line ID', 'Sacks', 'Destination', 'Shift', 'Salt Bags', 'Diesel L',
  'WW Big', 'WW Small', 'OT Hours', 'Waste Kg', 'Waste Sacks', 'Note', 'Entered By', 'Entered At'
];

var PRODUCTION_DAY_HEADERS = [
  'Date', 'Shift', 'Sacks', 'Tonnes', 'Salt Bags', 'Regular t', 'Riyadh t', '10 kg t',
  '10 kg Premium t', '10 kg Standard t', '10 kg Eco t', 'Diesel L', 'WW Big', 'WW Small', 'OT Hours',
  'Waste Kg', 'Waste Sacks', 'Waste Kg per Sack', 'Note', 'Source', 'Source Tab', 'Source Row', 'Synced At'
];

var SEED_USE_HEADERS = [
  'Date', 'Line ID', 'Seed', 'Size', 'Supplier', 'Sacks', 'Tonnes', 'Destination',
  'Source', 'Source Tab', 'Source Row', 'Synced At'
];

var PRODUCTION_CHECK_HEADERS = [
  'Date', 'Sheet Sacks', 'App Sacks', 'Sheet Salt', 'App Salt', 'Sheet Riyadh t', 'App Riyadh t',
  'Sheet 10 kg t', 'App 10 kg t', 'Seed Differences', 'Result'
];

var PRODUCTION_ISSUE_HEADERS = ['Date', 'Source Tab', 'Source Row', 'Seed Line', 'Issue', 'Details'];

var SEED_LINE_TEXT_COLUMNS = ['Line ID', 'Size'];
var PRODUCTION_LOG_TEXT_COLUMNS = ['Save ID', 'Date', 'Line ID', 'Entered At'];
var PRODUCTION_DAY_TEXT_COLUMNS = ['Date', 'Synced At'];
var SEED_USE_TEXT_COLUMNS = ['Date', 'Line ID', 'Size', 'Synced At'];
var PRODUCTION_CHECK_TEXT_COLUMNS = ['Date'];
var PRODUCTION_ISSUE_TEXT_COLUMNS = ['Date'];

var PRODUCTION_MAX_COLUMNS = 40;

/**
 * Run only the production part (the hourly store sync runs it too).
 */
function syncProduction() {
  checkSyncConfig_();
  if (!productionConfigured_()) {
    throw new Error('Set PRODUCTION_SPREADSHEET_ID in SYNC_CONFIG first.');
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) {
    Logger.log('Another sync is still running - skipped.');
    return;
  }
  try {
    Logger.log(syncProduction_(SpreadsheetApp.openById(SYNC_CONFIG.DATABASE_SPREADSHEET_ID)));
  } finally {
    lock.releaseLock();
  }
}

function productionConfigured_() {
  var id = String(SYNC_CONFIG.PRODUCTION_SPREADSHEET_ID || '');
  return id !== '' && id.indexOf('PASTE_') !== 0;
}

function productionAppFrom_() {
  var value = String(SYNC_CONFIG.PRODUCTION_APP_FROM || '').trim();
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('PRODUCTION_APP_FROM must look like 2026-10-01 (or be blank).');
  }
  return value;
}

/**
 * Called by setupConsolidation: creates the production tabs.
 */
function setupProduction_(db) {
  ensureSheet_(db, PRODUCTION_SHEETS.LINES, SEED_LINE_HEADERS, SEED_LINE_TEXT_COLUMNS);
  ensureSheet_(db, PRODUCTION_SHEETS.LOG, PRODUCTION_LOG_HEADERS, PRODUCTION_LOG_TEXT_COLUMNS);
  ensureSheet_(db, PRODUCTION_SHEETS.DAYS, PRODUCTION_DAY_HEADERS, PRODUCTION_DAY_TEXT_COLUMNS);
  ensureSheet_(db, PRODUCTION_SHEETS.SEED_USE, SEED_USE_HEADERS, SEED_USE_TEXT_COLUMNS);
  ensureSheet_(db, PRODUCTION_SHEETS.CHECK, PRODUCTION_CHECK_HEADERS, PRODUCTION_CHECK_TEXT_COLUMNS);
  ensureSheet_(db, PRODUCTION_SHEETS.ISSUES, PRODUCTION_ISSUE_HEADERS, PRODUCTION_ISSUE_TEXT_COLUMNS);
}

/**
 * The production tabs, or null when setup hasn't created them yet.
 */
function productionTabs_(db) {
  var tabs = {
    lines: [PRODUCTION_SHEETS.LINES, SEED_LINE_HEADERS],
    log: [PRODUCTION_SHEETS.LOG, PRODUCTION_LOG_HEADERS],
    days: [PRODUCTION_SHEETS.DAYS, PRODUCTION_DAY_HEADERS],
    seedUse: [PRODUCTION_SHEETS.SEED_USE, SEED_USE_HEADERS],
    check: [PRODUCTION_SHEETS.CHECK, PRODUCTION_CHECK_HEADERS],
    issues: [PRODUCTION_SHEETS.ISSUES, PRODUCTION_ISSUE_HEADERS]
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
 * Re-read the whole production sheet (it is small) and rewrite the production tabs.
 * @returns {string} summary for the log
 */
function syncProduction_(db) {
  var tabs = productionTabs_(db);
  if (!tabs) return 'Production sync is off - run setupConsolidation to turn it on.';

  var source = SpreadsheetApp.openById(SYNC_CONFIG.PRODUCTION_SPREADSHEET_ID);
  var timeZone = source.getSpreadsheetTimeZone();
  var formatDate = function (date) { return Utilities.formatDate(date, timeZone, 'yyyy-MM-dd'); };
  var syncedAt = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm');
  var appFrom = productionAppFrom_();

  var days = [];
  var headers = [];
  var issues = [];
  var tabsRead = 0;
  source.getSheets().forEach(function (sheet) {
    var lastRow = sheet.getLastRow();
    var lastColumn = Math.min(sheet.getLastColumn(), PRODUCTION_MAX_COLUMNS);
    if (lastRow < 5 || lastColumn < 5) return;
    var parsed = parseProductionGrid(sheet.getRange(1, 1, lastRow, lastColumn).getValues(), formatDate);
    if (!parsed.isProductionLog) return;
    tabsRead++;
    var tab = sheet.getName();
    parsed.seedHeaders.forEach(function (header) { headers.push({ header: header, tab: tab }); });
    parsed.problems.forEach(function (problem) {
      issues.push({ date: problem.date || '', sourceTab: tab, sourceRow: problem.row, line: '', issue: problem.issue, details: problem.details });
    });
    parsed.days.forEach(function (day) {
      if (appFrom && day.date >= appFrom) return;
      day.sourceTab = tab;
      days.push(day);
    });
  });

  var lines = updateSeedLines_(tabs.lines, headers);
  var lineById = {};
  lines.forEach(function (line) { lineById[line.id] = line; });

  days.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.sourceTab !== b.sourceTab) return a.sourceTab < b.sourceTab ? -1 : 1;
    return a.row - b.row;
  });
  issues = issues.concat(checkProductionDays(days));
  var seen = {};
  var sheetDays = days.filter(function (day) {
    if (seen[day.date]) return false;
    seen[day.date] = true;
    return true;
  });

  var dayRows = sheetDays.map(productionDayFromSheet);
  var seedUse = [];
  sheetDays.forEach(function (day) {
    day.seeds.forEach(function (seed) {
      var line = matchSeedLine(lines, seed.header);
      seedUse.push({
        date: day.date, lineId: line ? line.id : '', header: seed.header, sacks: seed.sacks,
        destination: '', source: 'Sheet', sourceTab: day.sourceTab, sourceRow: day.row
      });
    });
  });

  var logs = latestProductionLogs(readBody_(tabs.log).map(function (values) {
    return productionLogFromValues_(values, formatDate);
  }));
  if (appFrom) {
    var fromApp = buildProductionFromApp(logs, appFrom);
    dayRows = dayRows.concat(fromApp.days);
    seedUse = seedUse.concat(fromApp.seedUse);
  }
  seedUse.forEach(function (use) {
    if (use.lineId && lineById[use.lineId]) return;
    issues.push({
      date: use.date, sourceTab: use.sourceTab, sourceRow: use.sourceRow, line: use.lineId || use.header,
      issue: 'Unknown seed line', details: 'Not in Seed Lines - add it, or add the name to a line\'s Sheet Names'
    });
  });

  // Trial period: app entries for the days the sheet is still the source
  var trialLogs = {};
  Object.keys(logs).forEach(function (date) {
    if (!appFrom || date < appFrom) trialLogs[date] = logs[date];
  });
  var checks = compareProduction(
    dayRows.filter(function (row) { return row.source === 'Sheet'; }),
    seedUse.filter(function (use) { return use.source === 'Sheet'; }),
    trialLogs
  );

  issues.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  writeBody_(tabs.days, dayRows.map(function (row) { return productionDayValues_(row, syncedAt); }),
    PRODUCTION_DAY_HEADERS, PRODUCTION_DAY_TEXT_COLUMNS);
  writeBody_(tabs.seedUse, seedUse.map(function (use) { return seedUseValues_(use, lineById[use.lineId], syncedAt); }),
    SEED_USE_HEADERS, SEED_USE_TEXT_COLUMNS);
  writeBody_(tabs.check, checks.map(productionCheckValues_), PRODUCTION_CHECK_HEADERS, PRODUCTION_CHECK_TEXT_COLUMNS);
  writeBody_(tabs.issues, issues.map(productionIssueValues_), PRODUCTION_ISSUE_HEADERS, PRODUCTION_ISSUE_TEXT_COLUMNS);

  return 'Production: ' + tabsRead + ' month tabs read, ' + dayRows.length + ' days, ' + issues.length + ' issues' +
    (appFrom ? ', from the app since ' + appFrom : '') + '.';
}

/**
 * Add Seed Lines rows for new sheet columns and return all lines.
 */
function updateSeedLines_(sheet, headers) {
  var body = readBody_(sheet);
  var added = newSeedLines(seedLinesFromRows(body), headers);
  var namesColumn = SEED_LINE_HEADERS.indexOf('Sheet Names');
  body.forEach(function (row, index) {
    var extra = added.extraNames[String(row[0]).trim()];
    if (!extra) return;
    var names = String(row[namesColumn]).trim();
    sheet.getRange(index + 2, namesColumn + 1, 1, 1).setValues([[(names ? names + ' | ' : '') + extra.join(' | ')]]);
  });
  appendRows_(sheet, added.newRows, SEED_LINE_HEADERS, SEED_LINE_TEXT_COLUMNS);
  if (added.newRows.length === 0 && Object.keys(added.extraNames).length === 0) {
    return seedLinesFromRows(body);
  }
  return seedLinesFromRows(readBody_(sheet));
}

function productionLogFromValues_(values, formatDate) {
  return {
    saveId: String(values[0]).trim(),
    date: cellToDate_(values[1], formatDate),
    kind: String(values[2]).trim().toUpperCase(),
    lineId: String(values[3]).trim(),
    sacks: cellToNumber_(values[4]),
    destination: destinationKey(values[5]),
    shift: String(values[6]).trim(),
    saltBags: cellToNumber_(values[7]),
    dieselLitres: cellToNumber_(values[8]),
    wwBig: cellToNumber_(values[9]),
    wwSmall: cellToNumber_(values[10]),
    otHours: cellToNumber_(values[11]),
    wasteKg: cellToNumber_(values[12]),
    wasteSacks: cellToNumber_(values[13]),
    note: String(values[14]),
    enteredBy: String(values[15]),
    enteredAt: cellToDate_(values[16], formatDate)
  };
}

function productionDayValues_(row, syncedAt) {
  var perSack = row.wasteKg && row.wasteSacks ? roundTo_(row.wasteKg / row.wasteSacks, 2) : '';
  return [
    row.date, row.shift, row.totalSacks, row.totalTonnes, blankIfNull_(row.saltBags),
    blankIfNull_(row.regularTonnes), blankIfNull_(row.riyadhTonnes), blankIfNull_(row.tenKgTonnes),
    blankIfNull_(row.prm10Tonnes), blankIfNull_(row.std10Tonnes), blankIfNull_(row.eco10Tonnes),
    blankIfNull_(row.dieselLitres), blankIfNull_(row.wwBig), blankIfNull_(row.wwSmall), blankIfNull_(row.otHours),
    blankIfNull_(row.wasteKg), blankIfNull_(row.wasteSacks), perSack, row.note,
    row.source, row.sourceTab, row.sourceRow, syncedAt
  ];
}

function seedUseValues_(use, line, syncedAt) {
  return [
    use.date, use.lineId, line ? line.seed : (use.header || ''), line ? line.size : '', line ? line.supplier : '',
    use.sacks, sacksToTonnes(use.sacks), destinationName(use.destination),
    use.source, use.sourceTab, use.sourceRow, syncedAt
  ];
}

function productionCheckValues_(check) {
  return [
    check.date, check.sheetSacks, check.appSacks, check.sheetSalt, check.appSalt, check.sheetRiyadh,
    check.appRiyadh, check.sheetTenKg, check.appTenKg, check.lineDifferences, check.result
  ];
}

function productionIssueValues_(issue) {
  return [issue.date, issue.sourceTab, issue.sourceRow, issue.line, issue.issue, issue.details];
}
