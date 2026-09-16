/**
 * Daily production sheet parser - pure functions, no Apps Script services.
 *
 * "Daily production data 2026" has one tab per month:
 *   USE RAW SEEDS & SALT DETAILS ( SACK ) <MONTH> <YEAR>
 *   DATE | <seed columns...> | TOTAL | SALT | RIYAD | 10 KG | REMARK | DIESEL (L) | WW BIG | ...
 *   one row per day, then a TOTAL row and notes.
 * The seed columns (type, size grade, supplier) change from month to month, so every
 * column is found by its header. Seed is counted in 20 kg sacks; RIYAD and 10 KG are
 * tonnes of that seed going to those products.
 *
 * Uses normalizeText_, parseStoreNumber_, parseStoreDate_ and isFriday_ from StoreUpdateParser.js.
 */

var PRODUCTION_TITLE_WORDS = 'RAW SEEDS';
var SACK_KG = 20;
var SALT_BAG_KG = 50;
var MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST',
  'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

// Where a day's seed goes. Same keys as shared/utils/productionLog.js
var PRODUCTION_DESTINATIONS = [
  { key: 'REGULAR', name: 'Regular' },
  { key: 'RIYADH', name: 'Riyadh' },
  { key: 'PRM10', name: '10 kg Premium' },
  { key: 'STD10', name: '10 kg Standard' },
  { key: 'ECO10', name: '10 kg Eco' }
];

var PRODUCTION_SHIFTS = ['Day', 'Night', 'Day and night', 'No production'];

/**
 * 'Riyadh' or 'RIYADH' -> 'RIYADH'. Anything else counts as Regular.
 */
function destinationKey(text) {
  var upper = normalizeText_(text).toUpperCase();
  for (var i = 0; i < PRODUCTION_DESTINATIONS.length; i++) {
    var destination = PRODUCTION_DESTINATIONS[i];
    if (upper === destination.key || upper === destination.name.toUpperCase()) return destination.key;
  }
  return 'REGULAR';
}

function destinationName(key) {
  for (var i = 0; i < PRODUCTION_DESTINATIONS.length; i++) {
    if (PRODUCTION_DESTINATIONS[i].key === key) return PRODUCTION_DESTINATIONS[i].name;
  }
  return '';
}

// Day columns after TOTAL, by header
var PRODUCTION_DAY_COLUMNS = {
  'SALT': 'saltBags',
  'RIYAD': 'riyadhTonnes',
  'RIYADH': 'riyadhTonnes',
  '10 KG': 'tenKgTonnes',
  '10 KG PREMIUM': 'prm10Tonnes',
  '10 KG STANDARD': 'std10Tonnes',
  '10 KG ECO': 'eco10Tonnes',
  'REMARK': 'remark',
  'DIESEL (L)': 'dieselLitres',
  'WW BIG': 'wwBig',
  'WW SMALL': 'wwSmall',
  'OT HOURS': 'otHours',
  'WASTE CROP': 'wasteCrop',
  'WASTE CROP (SACK)': 'wasteSacks',
  'WASTAGE (GRAMS)': 'wasteKg',
  'WASTAGE (KG)': 'wasteKg',
  'WASTE G/SACK': '',
  'WASTE KG/SACK': ''
};
var PRODUCTION_TEXT_FIELDS = ['remark', 'wasteCrop'];
var PRODUCTION_NUMBER_FIELDS = ['saltBags', 'riyadhTonnes', 'tenKgTonnes', 'prm10Tonnes', 'std10Tonnes',
  'eco10Tonnes', 'dieselLitres', 'wwBig', 'wwSmall', 'otHours', 'wasteSacks', 'wasteKg'];

var MONTH_ABBREVIATIONS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, SEPT: 9, OCT: 10, NOV: 11, DEC: 12 };

/**
 * Date cell -> 'yyyy-MM-dd', or null. Adds dd-MMM-yyyy text (01-Jan-2026) to parseStoreDate_.
 */
function parseProductionDate_(value, formatDate) {
  var date = parseStoreDate_(value, formatDate);
  if (date) return date;
  var match = normalizeText_(value).toUpperCase().match(/^(\d{1,2})[- ]([A-Z]{3,4})[- ](\d{4})$/);
  if (!match || !MONTH_ABBREVIATIONS[match[2]]) return null;
  return match[3] + '-' + ('0' + MONTH_ABBREVIATIONS[match[2]]).slice(-2) + '-' + ('0' + match[1]).slice(-2);
}

function roundTo_(value, places) {
  var factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

function sacksToTonnes(sacks) {
  return roundTo_(sacks * SACK_KG / 1000, 3);
}

/**
 * Seed header as written on the sheet -> the name used for matching.
 * "361 190- 200  acme" -> "361 190-200 ACME"
 */
function normalizeSeedName(text) {
  return normalizeText_(text).toUpperCase().replace(/\s*-\s*/g, '-');
}

/**
 * "361 190-200 ACME" -> {id: '361-190-200-ACME', seed: '361', size: '190-200', supplier: 'ACME'}
 */
function seedLineFromHeader(header) {
  var name = normalizeSeedName(header);
  var tokens = name.split(' ');
  var seed = tokens.shift() || '';
  var size = '';
  var rest = [];
  tokens.forEach(function (token) {
    if (!size && /^\d{2,3}-\d{2,3}$/.test(token)) size = token;
    else rest.push(token);
  });
  return { id: name.replace(/ /g, '-'), seed: seed, size: size, supplier: rest.join(' '), name: name };
}

/**
 * Size grades are 10 wide (190-200). "269-270" is a typo for 260-270.
 * @returns {?string} the size it was probably meant to be
 */
function likelySize_(size) {
  var match = String(size || '').match(/^(\d+)-(\d+)$/);
  if (!match) return null;
  var upper = Number(match[2]);
  return upper - Number(match[1]) === 10 ? null : (upper - 10) + '-' + upper;
}

/**
 * Seed Lines tab rows -> objects.
 * Columns: Line ID | Seed | Size | Supplier | Sheet Names | Active | Notes
 */
function seedLinesFromRows(rows) {
  return rows
    .filter(function (row) { return normalizeText_(row[0]) !== ''; })
    .map(function (row) {
      var id = normalizeText_(row[0]);
      var names = String(row[4] || '').split('|').map(normalizeSeedName).filter(Boolean);
      return {
        id: id,
        seed: normalizeText_(row[1]),
        size: normalizeText_(row[2]),
        supplier: normalizeText_(row[3]),
        names: names,
        active: normalizeText_(row[5]).toUpperCase() !== 'NO'
      };
    });
}

/**
 * The Seed Lines entry for a column header, or null.
 * Matches the header against Sheet Names first, then against the Line ID.
 */
function matchSeedLine(lines, header) {
  var name = normalizeSeedName(header);
  var id = name.replace(/ /g, '-');
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].names.indexOf(name) !== -1) return lines[i];
  }
  for (var j = 0; j < lines.length; j++) {
    if (lines[j].id.toUpperCase() === id) return lines[j];
  }
  return null;
}

/**
 * Seed Lines rows to add for headers no line matches yet.
 * A header with a mistyped size is added to the line it was meant for instead.
 * @param {Array<Object>} lines - seedLinesFromRows()
 * @param {Array<{header: string, tab: string}>} headers - in sheet order
 * @returns {{newRows: Array<Array>, extraNames: Object<string, Array<string>>}}
 *          extraNames: line id -> sheet names to add to an existing or new line
 */
function newSeedLines(lines, headers) {
  var known = lines.map(function (line) { return Object.assign({}, line); });
  var newRows = [];
  var extraNames = {};
  var typos = [];

  headers.forEach(function (entry) {
    if (matchSeedLine(known, entry.header)) return;
    var line = seedLineFromHeader(entry.header);
    if (!line.seed) return;
    if (likelySize_(line.size)) {
      typos.push(entry);
      return;
    }
    var row = [line.id, line.seed, line.size, line.supplier, line.name, 'YES', 'Added from the ' + entry.tab + ' tab'];
    newRows.push(row);
    known.push({ id: line.id, seed: line.seed, size: line.size, supplier: line.supplier, names: [line.name], active: true });
  });

  typos.forEach(function (entry) {
    if (matchSeedLine(known, entry.header)) return;
    var line = seedLineFromHeader(entry.header);
    var meant = line.name.replace(line.size, likelySize_(line.size));
    var target = matchSeedLine(known, meant);
    if (target) {
      target.names = target.names.concat([line.name]);
      var newRow = newRows.filter(function (row) { return row[0] === target.id; })[0];
      if (newRow) {
        newRow[4] += ' | ' + line.name;
        newRow[6] += '; also written as ' + line.name + ' (' + entry.tab + ')';
      } else {
        (extraNames[target.id] = extraNames[target.id] || []).push(line.name);
      }
      return;
    }
    newRows.push([line.id, line.seed, line.size, line.supplier, line.name, 'YES',
      'Added from the ' + entry.tab + ' tab - check the size']);
    known.push({ id: line.id, seed: line.seed, size: line.size, supplier: line.supplier, names: [line.name], active: true });
  });

  return { newRows: newRows, extraNames: extraNames };
}

/**
 * "DAYNIGHT SHIFT" -> {shift: 'Day and night', note: ''}; "FRIDAY" -> {shift: 'No production', note: 'Friday'}
 */
function shiftFromRemark(remark) {
  var text = normalizeText_(remark).toUpperCase();
  if (text === '') return { shift: '', note: '' };
  var compact = text.replace(/[^A-Z]/g, '');
  if (/^DAYNIGHT(SHIFT)?$/.test(compact) || /^DAYANDNIGHT(SHIFT)?$/.test(compact)) return { shift: 'Day and night', note: '' };
  if (/^DAY(SHIFT)?$/.test(compact)) return { shift: 'Day', note: '' };
  if (/^NIGHT(SHIFT)?$/.test(compact)) return { shift: 'Night', note: '' };
  if (compact === 'NOPRODUCTION') return { shift: 'No production', note: '' };
  if (compact === 'FRIDAY') return { shift: 'No production', note: 'Friday' };
  if (compact.indexOf('EID') !== -1) return { shift: 'No production', note: 'Eid' };
  if (compact.indexOf('NOPRODUCTION') === 0) {
    return { shift: 'No production', note: normalizeText_(remark).replace(/no\s*production/i, '').trim() };
  }
  return { shift: '', note: normalizeText_(remark) };
}

function monthOfTitle_(title) {
  var upper = normalizeText_(title).toUpperCase();
  for (var m = 0; m < MONTH_NAMES.length; m++) {
    var match = upper.match(new RegExp('\\b' + MONTH_NAMES[m] + '\\s+(\\d{4})\\b'));
    if (match) return match[1] + '-' + ('0' + (m + 1)).slice(-2);
  }
  return '';
}

/**
 * Parse one monthly tab.
 * @param {Array<Array<*>>} values - sheet.getDataRange().getValues()
 * @param {function(Date): string} formatDate - Date -> 'yyyy-MM-dd'
 * @returns {{isProductionLog: boolean, month: string, seedHeaders: string[],
 *            days: Array<Object>, problems: Array<Object>}}
 *   days: {date, row, remark, seeds: [{header, sacks}], totalSacks, sheetTotal, <PRODUCTION_NUMBER_FIELDS>, wasteCrop}
 *   problems: {row, issue, details}
 */
function parseProductionGrid(values, formatDate) {
  var result = { isProductionLog: false, month: '', seedHeaders: [], days: [], problems: [] };
  var headerRow = -1;
  for (var r = 0; r < Math.min(values.length, 10); r++) {
    var first = normalizeText_(values[r][0]).toUpperCase();
    if (first.indexOf(PRODUCTION_TITLE_WORDS) !== -1) {
      result.isProductionLog = true;
      result.month = monthOfTitle_(values[r][0]);
    }
    if (first === 'DATE' && values[r].some(function (cell) { return normalizeText_(cell).toUpperCase() === 'TOTAL'; })) {
      headerRow = r;
      break;
    }
  }
  if (!result.isProductionLog) return result;
  if (headerRow === -1) {
    result.problems.push({ row: '', issue: 'No production table', details: 'No header row starting with DATE and containing TOTAL' });
    return result;
  }

  var header = values[headerRow].map(function (cell) { return normalizeText_(cell).toUpperCase(); });
  var totalColumn = header.indexOf('TOTAL');
  var seedColumns = [];
  for (var c = 1; c < totalColumn; c++) {
    seedColumns.push({ column: c, header: normalizeSeedName(values[headerRow][c]) });
    if (header[c] !== '') result.seedHeaders.push(normalizeSeedName(values[headerRow][c]));
  }
  // Day columns run until the first blank header (a separate table may follow)
  var dayColumns = [];
  for (var d = totalColumn + 1; d < header.length && header[d] !== ''; d++) {
    var field = PRODUCTION_DAY_COLUMNS[header[d]];
    if (field === undefined) {
      result.problems.push({ row: headerRow + 1, issue: 'Unknown column', details: 'Column "' + normalizeText_(values[headerRow][d]) + '" is not read' });
    } else if (field) {
      dayColumns.push({ column: d, field: field });
    }
  }

  var unnamedReported = {};
  for (var row = headerRow + 1; row < values.length; row++) {
    var line = values[row];
    var label = normalizeText_(line[0]).toUpperCase();
    if (label === 'TOTAL') break;
    var date = parseProductionDate_(line[0], formatDate);
    if (!date) continue;

    var day = { date: date, row: row + 1, seeds: [], totalSacks: 0, sheetTotal: null, remark: '', wasteCrop: '' };
    PRODUCTION_NUMBER_FIELDS.forEach(function (name) { day[name] = null; });
    var hasData = false;
    var badNumber = function (column, cell) {
      result.problems.push({
        row: row + 1, date: date, issue: 'Not a number',
        details: '"' + normalizeText_(cell) + '" in column ' + normalizeText_(values[headerRow][column])
      });
    };

    seedColumns.forEach(function (seedColumn) {
      var cell = line[seedColumn.column];
      var sacks = parseStoreNumber_(cell);
      if (sacks === null) return;
      if (isNaN(sacks)) {
        badNumber(seedColumn.column, cell);
        return;
      }
      if (sacks === 0) return;
      hasData = true;
      if (!seedColumn.header) {
        if (!unnamedReported[seedColumn.column]) {
          unnamedReported[seedColumn.column] = true;
          result.problems.push({ row: row + 1, date: date, issue: 'Seed column without a name', details: 'Column ' + (seedColumn.column + 1) + ' has sacks but no header' });
        }
        return;
      }
      day.seeds.push({ header: seedColumn.header, sacks: sacks });
      day.totalSacks += sacks;
    });

    var total = parseStoreNumber_(line[totalColumn]);
    if (total !== null && isNaN(total)) badNumber(totalColumn, line[totalColumn]);
    else day.sheetTotal = total;

    dayColumns.forEach(function (dayColumn) {
      var cell = line[dayColumn.column];
      if (PRODUCTION_TEXT_FIELDS.indexOf(dayColumn.field) !== -1) {
        day[dayColumn.field] = normalizeText_(cell);
        if (day[dayColumn.field] !== '') hasData = true;
        return;
      }
      var number = parseStoreNumber_(cell);
      if (number === null) return;
      if (isNaN(number)) {
        badNumber(dayColumn.column, cell);
        return;
      }
      day[dayColumn.field] = number;
      hasData = true;
    });

    if (!hasData && day.sheetTotal === null) continue;
    if (result.month && date.slice(0, 7) !== result.month) {
      result.problems.push({
        row: row + 1, date: date, issue: 'Day outside the month',
        details: date + ' is on the ' + result.month + ' tab - not read. Move its numbers to the right tab or fix the date.'
      });
      continue;
    }
    result.days.push(day);
  }
  return result;
}

/**
 * Problems in the parsed days across all tabs.
 * @param {Array<Object>} days - parsed days with sourceTab
 * @returns {Array<{date, sourceTab, sourceRow, line, issue, details}>}
 */
function checkProductionDays(days) {
  var issues = [];
  var seen = {};
  var add = function (day, issue, details) {
    issues.push({ date: day.date, sourceTab: day.sourceTab, sourceRow: day.row, line: '', issue: issue, details: details });
  };
  days.forEach(function (day) {
    if (seen[day.date]) {
      add(day, 'Duplicate day', 'Also on ' + seen[day.date].sourceTab + ' row ' + seen[day.date].row + ' - only the first is used');
      return;
    }
    seen[day.date] = day;

    if (day.sheetTotal !== null && Math.abs(day.sheetTotal - day.totalSacks) > 0.001) {
      add(day, 'Total does not add up', 'TOTAL is ' + day.sheetTotal + ', the seed columns add up to ' + day.totalSacks);
    }
    var shift = shiftFromRemark(day.remark);
    if (shift.shift === 'No production' && day.totalSacks > 0) {
      add(day, 'Seed used on a day off', day.totalSacks + ' sacks on a "' + day.remark + '" day');
    }
    if (shift.shift !== 'No production' && day.totalSacks > 0 && !day.remark) {
      add(day, 'No shift', day.totalSacks + ' sacks but no remark');
    }
    if (shift.note === 'Friday' && !isFriday_(day.date)) {
      add(day, 'Friday on another day', day.date + ' is not a Friday');
    }
    if (!shift.shift && day.remark) {
      add(day, 'Unknown remark', '"' + day.remark + '" - use DAY SHIFT, NIGHT SHIFT, DAYNIGHT SHIFT, NO PRODUCTION or FRIDAY');
    }
    var destinationTonnes = (day.riyadhTonnes || 0) + (day.tenKgTonnes || 0) + (day.prm10Tonnes || 0) +
      (day.std10Tonnes || 0) + (day.eco10Tonnes || 0);
    if (destinationTonnes > sacksToTonnes(day.totalSacks) + 0.001) {
      add(day, 'More tonnes than seed used', 'RIYAD and 10 KG add up to ' + roundTo_(destinationTonnes, 3) +
        ' t, but only ' + sacksToTonnes(day.totalSacks) + ' t of seed was used');
    }
  });
  return issues;
}

/**
 * One Production Days row per parsed sheet day.
 */
function productionDayFromSheet(day) {
  var shift = shiftFromRemark(day.remark);
  var tenKg = day.tenKgTonnes !== null || day.prm10Tonnes !== null || day.std10Tonnes !== null || day.eco10Tonnes !== null
    ? roundTo_((day.tenKgTonnes || 0) + (day.prm10Tonnes || 0) + (day.std10Tonnes || 0) + (day.eco10Tonnes || 0), 3)
    : null;
  var totalTonnes = sacksToTonnes(day.totalSacks);
  return {
    date: day.date,
    shift: shift.shift,
    totalSacks: day.totalSacks,
    totalTonnes: totalTonnes,
    saltBags: day.saltBags,
    regularTonnes: day.totalSacks > 0 ? roundTo_(totalTonnes - (day.riyadhTonnes || 0) - (tenKg || 0), 3) : null,
    riyadhTonnes: day.riyadhTonnes,
    tenKgTonnes: tenKg,
    prm10Tonnes: day.prm10Tonnes,
    std10Tonnes: day.std10Tonnes,
    eco10Tonnes: day.eco10Tonnes,
    dieselLitres: day.dieselLitres,
    wwBig: day.wwBig,
    wwSmall: day.wwSmall,
    otHours: day.otHours,
    wasteKg: day.wasteKg,
    wasteSacks: day.wasteSacks,
    note: [shift.note, day.wasteCrop ? 'Waste measured on ' + day.wasteCrop : ''].filter(Boolean).join('; '),
    source: 'Sheet',
    sourceTab: day.sourceTab,
    sourceRow: day.row
  };
}

/**
 * The latest saved Production Log for each date.
 * Each save writes a DAY row and SEED rows under one Save ID; a later save replaces the earlier one.
 * @param {Array<Object>} rows - saveId, date, kind, lineId, sacks, destination, shift, saltBags,
 *        dieselLitres, wwBig, wwSmall, otHours, wasteKg, wasteSacks, note, enteredBy, enteredAt
 * @returns {Object<string, Object>} by date: {date, saveId, shift, ..., seeds: [{lineId, sacks, destination}]}
 */
function latestProductionLogs(rows) {
  var latestSave = {};
  rows.forEach(function (row) {
    if (!row.date || !row.saveId) return;
    var stamp = row.enteredAt + '|' + row.saveId;
    if (!latestSave[row.date] || stamp > latestSave[row.date]) latestSave[row.date] = stamp;
  });

  var logs = {};
  rows.forEach(function (row) {
    if (!row.date || row.enteredAt + '|' + row.saveId !== latestSave[row.date]) return;
    var log = logs[row.date] || (logs[row.date] = {
      date: row.date, saveId: row.saveId, shift: '', seeds: [], enteredBy: row.enteredBy, enteredAt: row.enteredAt
    });
    if (row.kind === 'DAY') {
      ['shift', 'saltBags', 'dieselLitres', 'wwBig', 'wwSmall', 'otHours', 'wasteKg', 'wasteSacks', 'note']
        .forEach(function (name) { log[name] = row[name]; });
    } else if (row.kind === 'SEED' && row.lineId && row.sacks) {
      log.seeds.push({ lineId: row.lineId, sacks: row.sacks, destination: row.destination || 'REGULAR' });
    }
  });
  return logs;
}

/**
 * Production Days rows and Seed Use rows for the days entered in the Production app.
 * @param {Object<string, Object>} logs - latestProductionLogs()
 * @param {string} fromDate - first day taken from the app
 * @returns {{days: Array<Object>, seedUse: Array<Object>}}
 */
function buildProductionFromApp(logs, fromDate) {
  var days = [];
  var seedUse = [];
  Object.keys(logs).sort().forEach(function (date) {
    if (date < fromDate) return;
    var log = logs[date];
    var tonnesBy = {};
    var totalSacks = 0;
    log.seeds.forEach(function (seed) {
      totalSacks += seed.sacks;
      tonnesBy[seed.destination] = (tonnesBy[seed.destination] || 0) + seed.sacks;
      seedUse.push({ date: date, lineId: seed.lineId, sacks: seed.sacks, destination: seed.destination, source: 'App', sourceTab: log.saveId, sourceRow: '' });
    });
    var tonnes = function (key) { return tonnesBy[key] ? sacksToTonnes(tonnesBy[key]) : null; };
    var tenKg = ['PRM10', 'STD10', 'ECO10'].reduce(function (sum, key) { return sum + (tonnesBy[key] || 0); }, 0);
    days.push({
      date: date,
      shift: log.shift || '',
      totalSacks: totalSacks,
      totalTonnes: sacksToTonnes(totalSacks),
      saltBags: log.saltBags,
      regularTonnes: tonnes('REGULAR'),
      riyadhTonnes: tonnes('RIYADH'),
      tenKgTonnes: tenKg ? sacksToTonnes(tenKg) : null,
      prm10Tonnes: tonnes('PRM10'),
      std10Tonnes: tonnes('STD10'),
      eco10Tonnes: tonnes('ECO10'),
      dieselLitres: log.dieselLitres,
      wwBig: log.wwBig,
      wwSmall: log.wwSmall,
      otHours: log.otHours,
      wasteKg: log.wasteKg,
      wasteSacks: log.wasteSacks !== null && log.wasteSacks !== undefined ? log.wasteSacks : (log.wasteKg ? totalSacks : null),
      note: log.note || '',
      source: 'App',
      sourceTab: log.saveId,
      sourceRow: ''
    });
  });
  return { days: days, seedUse: seedUse };
}

/**
 * Production app entries compared with the production sheet, per day (trial period).
 * @param {Array<Object>} sheetDays - productionDayFromSheet() rows
 * @param {Array<Object>} sheetSeedUse - {date, lineId, sacks}
 * @param {Object<string, Object>} logs - latestProductionLogs(), already limited to the trial days
 * @returns {Array<Object>} date, sheet/app sacks, salt, riyadh, 10 kg, lines, result
 */
function compareProduction(sheetDays, sheetSeedUse, logs) {
  var sheetByDate = {};
  sheetDays.forEach(function (day) { sheetByDate[day.date] = day; });
  var sheetLines = {};
  sheetSeedUse.forEach(function (use) {
    var byLine = sheetLines[use.date] || (sheetLines[use.date] = {});
    byLine[use.lineId || '?'] = (byLine[use.lineId || '?'] || 0) + use.sacks;
  });
  var appBuilt = buildProductionFromApp(logs, '');
  var appLines = {};
  appBuilt.seedUse.forEach(function (use) {
    var byLine = appLines[use.date] || (appLines[use.date] = {});
    byLine[use.lineId] = (byLine[use.lineId] || 0) + use.sacks;
  });

  var same = function (a, b) { return Math.abs((a || 0) - (b || 0)) < 0.001; };
  return appBuilt.days.map(function (app) {
    var sheet = sheetByDate[app.date];
    var differences = [];
    var sheetByLine = sheetLines[app.date] || {};
    var appByLine = appLines[app.date] || {};
    Object.keys(sheetByLine).concat(Object.keys(appByLine)).sort().forEach(function (lineId, index, all) {
      if (all.indexOf(lineId) !== index) return;
      if (!same(sheetByLine[lineId], appByLine[lineId])) {
        differences.push(lineId + ': sheet ' + (sheetByLine[lineId] || 0) + ', app ' + (appByLine[lineId] || 0));
      }
    });
    var result;
    if (!sheet || (sheet.totalSacks === 0 && app.totalSacks > 0)) {
      result = 'Not on production sheet';
    } else {
      var matches = differences.length === 0 &&
        same(sheet.saltBags, app.saltBags) &&
        same(sheet.riyadhTonnes, app.riyadhTonnes) &&
        same(sheet.tenKgTonnes, app.tenKgTonnes);
      result = matches ? 'Match' : 'Different';
    }
    return {
      date: app.date,
      sheetSacks: sheet ? sheet.totalSacks : '',
      appSacks: app.totalSacks,
      sheetSalt: sheet ? blankNumber_(sheet.saltBags) : '',
      appSalt: blankNumber_(app.saltBags),
      sheetRiyadh: sheet ? blankNumber_(sheet.riyadhTonnes) : '',
      appRiyadh: blankNumber_(app.riyadhTonnes),
      sheetTenKg: sheet ? blankNumber_(sheet.tenKgTonnes) : '',
      appTenKg: blankNumber_(app.tenKgTonnes),
      lineDifferences: differences.join('; '),
      result: result
    };
  });
}

function blankNumber_(value) {
  return value === null || value === undefined ? '' : value;
}
