/**
 * Store Update Parser
 * Turns one daily "STORE UPDATE- COMPANY FINISHED GOODS" tab into plain rows
 * and matches each row to the Item Master.
 *
 * Plain JavaScript with no Apps Script services, so the same code runs in
 * Apps Script and in the Node tests (google-apps-script/tests).
 */

var STORE_UPDATE_TITLE = 'STORE UPDATE';

// Header text on the daily tab -> field name (compared lower-case, single spaces)
var STORE_UPDATE_COLUMNS = {
  'no': 'no',
  'item code': 'code',
  'item': 'name',
  'opening': 'opening',
  'production': 'production',
  'despatch': 'despatch',
  'dispatch': 'despatch',
  'closing': 'closing',
  'mini level': 'minLevel',
  'min level': 'minLevel',
  'minimum level': 'minLevel',
  'suggested mini': 'suggestedMin',
  'required qty': 'requiredQty',
  'specific order': 'specificOrder',
  'deliver by': 'deliverBy',
  'order status': 'orderStatus'
};

var STORE_UPDATE_NUMBER_FIELDS = [
  'opening', 'production', 'despatch', 'closing',
  'minLevel', 'suggestedMin', 'requiredQty', 'specificOrder'
];

// Blocks that sit below the item table on every daily tab
var STORE_UPDATE_END_MARKERS = ['PACKING ROLLS', 'ROLLS ISSUED', 'COVER/CARTON', 'MACHINE WORK LOG'];

// Section title on the sheet -> group key used in the Item Master
var STORE_GROUPS = [
  { key: 'REG', name: 'Regular sunflower', sectionWord: 'REGULAR' },
  { key: 'RUH', name: 'Riyadh sunflower', sectionWord: 'RIYADH' },
  { key: 'QAT', name: 'Qatar sunflower', sectionWord: 'QATAR' },
  { key: 'BAH', name: 'Bahrain sunflower', sectionWord: 'BAHRAIN' },
  { key: 'MP', name: 'Melon & pumpkin', sectionWord: 'MELON' },
  { key: 'POP', name: 'Popcorn', sectionWord: 'POPCORN' },
  { key: 'CC', name: 'Cotton candy', sectionWord: 'COTTON' }
];

function normalizeText_(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim();
}

function isDateValue_(value) {
  // instanceof fails for dates created in another realm (Node vm tests)
  return Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime());
}

/**
 * Number from a cell: '' -> null, '1,234' -> 1234, anything else -> NaN
 */
function parseStoreNumber_(value) {
  if (typeof value === 'number') return value;
  var text = normalizeText_(value).replace(/,/g, '');
  if (text === '') return null;
  var number = Number(text);
  return isNaN(number) ? NaN : number;
}

/**
 * Date cell -> 'yyyy-MM-dd', or null.
 * Accepts real dates (formatted by formatDate, which knows the sheet's time zone),
 * M/D/YYYY text as typed on the daily tabs, and yyyy-MM-dd text.
 */
function parseStoreDate_(value, formatDate) {
  if (isDateValue_(value)) return formatDate(value);

  var text = normalizeText_(value);
  var match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    return match[3] + '-' + ('0' + match[1]).slice(-2) + '-' + ('0' + match[2]).slice(-2);
  }
  match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? text : null;
}

function firstFilledAfter_(row, index) {
  for (var c = index + 1; c < row.length; c++) {
    if (normalizeText_(row[c]) !== '') return c;
  }
  return -1;
}

function groupForSection(section) {
  var upper = normalizeText_(section).toUpperCase();
  for (var i = 0; i < STORE_GROUPS.length; i++) {
    if (upper.indexOf(STORE_GROUPS[i].sectionWord) !== -1) return STORE_GROUPS[i].key;
  }
  return '';
}

/**
 * Parse one daily tab.
 * @param {Array<Array<*>>} values - sheet.getDataRange().getValues()
 * @param {function(Date): string} formatDate - Date -> 'yyyy-MM-dd'
 * @returns {{isStoreUpdate: boolean, date: ?string, absentees: string,
 *            items: Array<Object>, problems: Array<Object>}}
 */
function parseStoreUpdateGrid(values, formatDate) {
  var result = { isStoreUpdate: false, date: null, absentees: '', items: [], problems: [] };

  var top = values.slice(0, 6).map(function (row) {
    return row.map(normalizeText_).join(' ').toUpperCase();
  }).join(' ');
  // The store file also has an "INVENTORY DASHBOARD" tab with the same title words
  if (top.indexOf(STORE_UPDATE_TITLE) === -1 || top.indexOf('DASHBOARD') !== -1) return result;
  result.isStoreUpdate = true;

  var headerRow = -1;
  var columns = {};
  for (var r = 0; r < Math.min(values.length, 15); r++) {
    var row = values[r];
    var headers = row.map(function (cell) { return normalizeText_(cell).toLowerCase(); });

    if (headers[0] === 'date' && result.date === null) {
      var dateCol = firstFilledAfter_(row, 0);
      result.date = dateCol === -1 ? null : parseStoreDate_(row[dateCol], formatDate);

      var absentCol = -1;
      headers.forEach(function (header, c) {
        if (absentCol === -1 && header.indexOf('absentees') !== -1) absentCol = c;
      });
      if (absentCol !== -1) {
        var valueCol = firstFilledAfter_(row, absentCol);
        result.absentees = valueCol === -1 ? '' : normalizeText_(row[valueCol]);
      }
    }

    if (headers.indexOf('item code') !== -1 && headers.indexOf('closing') !== -1) {
      headerRow = r;
      headers.forEach(function (header, c) {
        var field = STORE_UPDATE_COLUMNS[header];
        if (field && columns[field] === undefined) columns[field] = c;
      });
      break;
    }
  }

  if (!result.date) {
    result.problems.push({ row: '', issue: 'No date', details: 'Could not read the date at the top of the tab' });
  }
  if (headerRow === -1) {
    result.problems.push({ row: '', issue: 'No item table', details: 'Header row with "Item Code" and "Closing" not found' });
    return result;
  }

  var section = '';
  for (r = headerRow + 1; r < values.length; r++) {
    var cells = values[r].map(normalizeText_);
    var line = cells.join(' ').toUpperCase();
    if (STORE_UPDATE_END_MARKERS.some(function (marker) { return line.indexOf(marker) !== -1; })) break;

    var code = cells[columns.code] || '';
    var name = cells[columns.name] || '';
    if (!code && !name) {
      // Section title rows (merged across the table) or blank spacer rows
      var label = cells.filter(function (cell) { return cell !== ''; })[0] || '';
      if (/[A-Za-z]/.test(label)) section = label;
      continue;
    }

    var item = { row: r + 1, section: section, group: groupForSection(section), code: code, name: name };
    STORE_UPDATE_NUMBER_FIELDS.forEach(function (field) {
      if (columns[field] === undefined) {
        item[field] = null;
        return;
      }
      var number = parseStoreNumber_(values[r][columns[field]]);
      if (isNaN(number)) {
        result.problems.push({
          row: r + 1, code: code, name: name, issue: 'Not a number',
          details: field + ' is "' + cells[columns[field]] + '"'
        });
        number = null;
      }
      item[field] = number;
    });

    var deliverBy = columns.deliverBy === undefined ? '' : values[r][columns.deliverBy];
    item.deliverBy = parseStoreDate_(deliverBy, formatDate) || normalizeText_(deliverBy);
    item.orderStatus = columns.orderStatus === undefined ? '' : cells[columns.orderStatus];

    if (!code) {
      result.problems.push({ row: r + 1, code: '', name: name, issue: 'Missing item code', details: '' });
    }
    result.items.push(item);
  }

  return result;
}

function matchWordsOf_(entry) {
  return normalizeText_(entry.matchWords).toUpperCase().split(',')
    .map(function (word) { return word.trim(); })
    .filter(function (word) { return word !== ''; });
}

function bestWordMatch_(entries, upperName) {
  return entries
    .filter(function (entry) {
      var words = matchWordsOf_(entry);
      return words.length > 0 && words.every(function (word) { return upperName.indexOf(word) !== -1; });
    })
    .sort(function (a, b) { return matchWordsOf_(b).length - matchWordsOf_(a).length; })[0] || null;
}

/**
 * Find the Item Master entry for a daily row.
 * Entries in the same group with the same code are told apart by their match
 * words (all must appear in the item name); the entry with the most matching
 * words wins. An entry without match words is used only when no worded entry fits.
 * When the code doesn't fit, the name alone may still identify a worded entry:
 * the sheet has had codes swapped between items, and the stock follows the name.
 * @returns {{entry: Object, codeMismatch: boolean}|null} null when unknown or ambiguous
 */
function matchStoreItem(itemMaster, group, code, name) {
  var upperName = normalizeText_(name).toUpperCase();
  var inGroup = itemMaster.filter(function (entry) { return entry.group === group; });
  var sameCode = inGroup.filter(function (entry) {
    return normalizeText_(entry.code) === normalizeText_(code);
  });

  var match = bestWordMatch_(sameCode, upperName);
  if (match) return { entry: match, codeMismatch: false };

  var plain = sameCode.filter(function (entry) { return matchWordsOf_(entry).length === 0; });
  if (plain.length === 1) return { entry: plain[0], codeMismatch: false };

  match = bestWordMatch_(inGroup, upperName);
  return match ? { entry: match, codeMismatch: true } : null;
}

/**
 * Checks across days: continuity, arithmetic, negatives, duplicates, item codes.
 * Code problems repeat on every day an item is listed, so they are reported
 * once per item with the date range.
 * @param {Array<Object>} rows - flat rows sorted by date, each with date, itemKey,
 *        codeMismatch, masterCode, group, code, name, opening, production,
 *        despatch, closing, sourceTab, sourceRow
 */
function checkStoreRows(rows) {
  var issues = [];
  var lastByKey = {};
  var seen = {};
  var repeated = {};

  function report(row, issue, details) {
    issues.push({
      date: row.date, sourceTab: row.sourceTab, sourceRow: row.sourceRow,
      itemKey: row.itemKey, code: row.code, name: row.name, issue: issue, details: details
    });
  }

  function reportOnce(row, issue, details) {
    var id = issue + '|' + row.group + '|' + row.code + '|' + normalizeText_(row.name).toUpperCase();
    var entry = repeated[id];
    if (!entry) {
      entry = repeated[id] = { row: row, issue: issue, details: details, first: row.date, last: row.date, days: {} };
    }
    entry.last = row.date;
    entry.days[row.date] = true;
  }

  rows.forEach(function (row) {
    if (!row.itemKey) {
      reportOnce(row, 'Unknown item', 'Code ' + row.code + ' in group ' + (row.group || '(none)') + ' is not in the Item Master, or its name does not match');
      return;
    }
    if (row.codeMismatch) {
      reportOnce(row, 'Code differs from Item Master', 'Sheet code ' + row.code + ', Item Master code ' + row.masterCode + ' (' + row.itemKey + ')');
    }

    var dupKey = row.date + '|' + row.itemKey;
    if (seen[dupKey]) {
      report(row, 'Duplicate item', 'Also on row ' + seen[dupKey]);
    } else {
      seen[dupKey] = row.sourceRow;
    }

    var opening = row.opening || 0;
    var expected = opening + (row.production || 0) - (row.despatch || 0);
    if (row.closing !== null && Math.abs(expected - row.closing) > 0.001) {
      report(row, 'Closing does not add up', opening + ' + ' + (row.production || 0) + ' - ' + (row.despatch || 0) + ' = ' + expected + ', sheet says ' + row.closing);
    }

    if (row.closing !== null && row.closing < 0) {
      // Stock left below zero repeats every day until corrected - report it once
      reportOnce(row, 'Negative closing', 'Closing is ' + row.closing);
    }

    var previous = lastByKey[row.itemKey];
    if (previous && previous.closing !== null && row.opening !== null &&
        previous.date !== row.date && Math.abs(previous.closing - row.opening) > 0.001) {
      report(row, 'Opening differs from previous closing', 'Closing on ' + previous.date + ' was ' + previous.closing + ', opening is ' + row.opening);
    }
    lastByKey[row.itemKey] = row;
  });

  Object.keys(repeated).forEach(function (id) {
    var entry = repeated[id];
    var dayCount = Object.keys(entry.days).length;
    var range = entry.first === entry.last ? entry.first : entry.first + ' to ' + entry.last;
    report(entry.row, entry.issue, entry.details + ' - ' + range + ' (' + dayCount + (dayCount === 1 ? ' day)' : ' days)'));
  });

  return issues.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
}

var STORE_MOVEMENT_TYPES = { PACKED: 'PACKED', DESPATCHED: 'DESPATCHED' };

/**
 * Compare entries made in the apps (Store Movements) with the store sheet (FG Daily),
 * for every day that has at least one app entry. Used during the trial period
 * when both are filled in.
 * @param {Array<Object>} dailyRows - FG Daily rows: date, itemKey, code, group, name, production, despatch
 * @param {Array<Object>} movements - Store Movements rows: date, type, itemKey, code, group, name, units, status
 * @returns {Array<Object>} one row per day and item with sheet and app totals and a result
 */
function compareStoreMovements(dailyRows, movements) {
  var days = {};
  var byId = {};
  var order = [];

  function entryFor(source) {
    var id = source.date + '|' + source.itemKey;
    if (!byId[id]) {
      byId[id] = {
        date: source.date, itemKey: source.itemKey, code: source.code, group: source.group, name: source.name,
        sheetPacked: 0, appPacked: 0, sheetDespatched: 0, appDespatched: 0, inSheet: false
      };
      order.push(id);
    }
    return byId[id];
  }

  movements.forEach(function (movement) {
    if (normalizeText_(movement.status).toUpperCase() === 'CANCELLED') return;
    if (movement.date && movement.itemKey) days[movement.date] = true;
  });

  dailyRows.forEach(function (row) {
    if (!days[row.date] || !row.itemKey) return;
    var entry = entryFor(row);
    entry.inSheet = true;
    entry.sheetPacked += row.production || 0;
    entry.sheetDespatched += row.despatch || 0;
  });

  movements.forEach(function (movement) {
    if (normalizeText_(movement.status).toUpperCase() === 'CANCELLED') return;
    if (!movement.date || !movement.itemKey) return;
    var entry = entryFor(movement);
    var units = Number(movement.units) || 0;
    if (movement.type === STORE_MOVEMENT_TYPES.PACKED) entry.appPacked += units;
    if (movement.type === STORE_MOVEMENT_TYPES.DESPATCHED) entry.appDespatched += units;
  });

  return order
    .map(function (id) {
      var entry = byId[id];
      var same = Math.abs(entry.sheetPacked - entry.appPacked) < 0.001 &&
        Math.abs(entry.sheetDespatched - entry.appDespatched) < 0.001;
      entry.result = !entry.inSheet ? 'Not on store sheet' : same ? 'Match' : 'Different';
      return entry;
    })
    .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
}

function isFriday_(isoDate) {
  var parts = isoDate.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).getUTCDay() === 5;
}

function nextDay_(isoDate) {
  var parts = isoDate.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1)).toISOString().slice(0, 10);
}

/**
 * The store sheet's minimum level suggestion:
 * MAX(average daily despatch x 2, biggest single-day despatch), rounded up to 10,
 * over the store days of the current month.
 */
function suggestMinLevel_(despatchByDay) {
  var days = despatchByDay.length;
  var total = despatchByDay.reduce(function (sum, value) { return sum + value; }, 0);
  if (days === 0 || total === 0) return null;
  var biggest = Math.max.apply(null, despatchByDay);
  return Math.ceil(Math.max(total / days * 2, biggest) / 10) * 10;
}

/**
 * Daily store rows built from the Packing app's entries, from the switch-over day to today.
 * Opening = the previous day's closing (the store sheet's last closing on the first day),
 * Production / Despatch = packed / despatched entries, Min Level = Item Master (or the
 * last value on the store sheet), Required Qty = Min Level - Closing.
 *
 * @param {Object} input
 * @param {Array<Object>} input.itemMaster - entries with key, code, group, name, active, minLevel
 * @param {Array<Object>} input.movements - Store Movements: date, type, itemKey, units, status
 * @param {Array<Object>} input.sheetRows - FG Daily rows from the store sheet, sorted by date
 * @param {string} input.fromDate - switch-over day (yyyy-MM-dd)
 * @param {string} input.toDate - last day to build, usually today
 * @param {boolean} input.skipFridays - leave out Fridays that have no entries
 * @param {Array<Object>} [input.orders] - Store Orders (see ordersOnDay)
 * @param {Object<string, Object>} [input.dayLogs] - latestDayLogs(): absentees per date
 * @returns {Array<Object>} rows shaped like FG Daily rows, with sourceTab 'App'
 */
function buildStoreRowsFromApp(input) {
  var closing = {};
  var lastMin = {};
  var despatchHistory = {};
  input.sheetRows.forEach(function (row) {
    if (!row.itemKey || row.date >= input.fromDate) return;
    if (row.closing !== null && row.closing !== undefined) closing[row.itemKey] = row.closing;
    if (row.minLevel !== null && row.minLevel !== undefined) lastMin[row.itemKey] = row.minLevel;
    var history = despatchHistory[row.itemKey] || (despatchHistory[row.itemKey] = {});
    history[row.date] = (history[row.date] || 0) + (row.despatch || 0);
  });

  var entries = {};
  input.movements.forEach(function (movement) {
    if (normalizeText_(movement.status).toUpperCase() === 'CANCELLED') return;
    if (!movement.itemKey || movement.date < input.fromDate || movement.date > input.toDate) return;
    var byItem = entries[movement.date] || (entries[movement.date] = {});
    var totals = byItem[movement.itemKey] || (byItem[movement.itemKey] = { packed: 0, despatched: 0 });
    var units = Number(movement.units) || 0;
    if (movement.type === STORE_MOVEMENT_TYPES.PACKED) totals.packed += units;
    if (movement.type === STORE_MOVEMENT_TYPES.DESPATCHED) totals.despatched += units;
  });

  var hasEntries = {};
  Object.keys(entries).forEach(function (day) {
    Object.keys(entries[day]).forEach(function (key) { hasEntries[key] = true; });
  });
  // Inactive items stay listed while they still hold stock or get entries
  var items = input.itemMaster.filter(function (item) {
    var active = normalizeText_(item.active).toUpperCase() !== 'NO';
    return active || hasEntries[item.key] || (closing[item.key] || 0) !== 0;
  });

  var rows = [];
  var storeDaysByMonth = {};
  input.sheetRows.forEach(function (row) {
    if (row.date >= input.fromDate) return;
    var month = row.date.slice(0, 7);
    (storeDaysByMonth[month] = storeDaysByMonth[month] || {})[row.date] = true;
  });

  var orders = input.orders || [];
  var dayLogs = input.dayLogs || {};

  for (var day = input.fromDate; day <= input.toDate; day = nextDay_(day)) {
    if (input.skipFridays && isFriday_(day) && !entries[day] && !dayLogs[day]) continue;
    var month = day.slice(0, 7);
    var dayOrders = ordersOnDay(orders, day);
    var dayLog = dayLogs[day];
    var absentees = dayLog ? (dayLog.holiday ? 'HOLIDAY' : dayLog.absentees) : '';
    (storeDaysByMonth[month] = storeDaysByMonth[month] || {})[day] = true;
    var monthDays = Object.keys(storeDaysByMonth[month]).sort();

    items.forEach(function (item, index) {
      var totals = (entries[day] || {})[item.key] || { packed: 0, despatched: 0 };
      var opening = closing[item.key] || 0;
      var closingToday = opening + totals.packed - totals.despatched;
      closing[item.key] = closingToday;

      var history = despatchHistory[item.key] || (despatchHistory[item.key] = {});
      history[day] = totals.despatched;
      var suggested = suggestMinLevel_(monthDays.map(function (d) { return history[d] || 0; }));

      var ownMin = item.minLevel === '' || item.minLevel === null || item.minLevel === undefined
        ? null
        : Number(item.minLevel);
      var minLevel = ownMin !== null && !isNaN(ownMin) ? ownMin : lastMin[item.key] !== undefined ? lastMin[item.key] : null;

      var order = dayOrders[item.key];
      rows.push({
        date: day, itemKey: item.key, code: item.code, group: item.group, name: item.name,
        opening: opening,
        production: totals.packed || null,
        despatch: totals.despatched || null,
        closing: closingToday,
        minLevel: minLevel,
        suggestedMin: suggested,
        requiredQty: minLevel === null ? null : minLevel - closingToday,
        specificOrder: order ? order.qty : null,
        deliverBy: order ? order.deliverBy : '',
        orderStatus: order ? order.status : '',
        absentees: absentees,
        sourceTab: 'App', sourceRow: index + 1,
        itemMatched: true
      });
    });
  }

  return rows;
}

/**
 * Staff names and types from the EMPLOYEE grid of a daily tab ("Arun Nath  (O)").
 * @returns {Array<{name: string, type: string}>}
 */
function parseStaffList(values) {
  var staff = [];
  var inGrid = false;
  for (var r = 0; r < values.length; r++) {
    var first = normalizeText_(values[r][0]);
    if (/^EMPLOYEE\b/i.test(first)) {
      inGrid = true;
      continue;
    }
    if (!inGrid) continue;
    if (first === '' || /^TOTAL\b/i.test(first)) break;
    var match = first.match(/^(.*?)\s*\((S|O)\)$/i);
    if (match && match[1]) staff.push({ name: match[1], type: match[2].toUpperCase() });
  }
  return staff;
}

/**
 * The latest saved Day Log for each date.
 * Each save writes a full snapshot of the day (a DAY row, MACHINE rows, STAFF rows)
 * under one Save ID; a later save for the same date replaces the earlier one.
 * @param {Array<Object>} rows - saveId, date, kind, name, start, end, workers, absent, reason, enteredAt
 * @returns {Object<string, {absentees: string, holiday: boolean, machines: Array, staff: Array}>}
 */
function latestDayLogs(rows) {
  var latestSave = {};
  rows.forEach(function (row) {
    if (!row.date || !row.saveId) return;
    var current = latestSave[row.date];
    var stamp = String(row.enteredAt) + '|' + row.saveId;
    if (!current || stamp > current) latestSave[row.date] = stamp;
  });

  var days = {};
  rows.forEach(function (row) {
    if (!row.date || String(row.enteredAt) + '|' + row.saveId !== latestSave[row.date]) return;
    var day = days[row.date] || (days[row.date] = { absentees: '', holiday: false, machines: [], staff: [] });
    if (row.kind === 'DAY') {
      day.absentees = normalizeText_(row.reason);
      day.holiday = normalizeText_(row.absent).toUpperCase() === 'HOLIDAY';
    } else if (row.kind === 'MACHINE') {
      day.machines.push({ machine: row.name, start: row.start, end: row.end, workers: splitNames_(row.workers) });
    } else if (row.kind === 'STAFF') {
      day.staff.push({ name: row.name, absent: normalizeText_(row.absent).toUpperCase() === 'YES', reason: row.reason });
    }
  });
  return days;
}

function splitNames_(text) {
  return String(text || '').split(',').map(function (name) { return name.trim(); }).filter(Boolean);
}

/**
 * Specific orders shown on an item's store update for one day.
 * An order shows as PENDING from the day it was entered until it is met or cancelled,
 * and as MET on the day it was met.
 * @param {Array<Object>} orders - enteredOn, itemKey, qty, deliverBy, status, statusDate
 * @returns {Object<string, {qty: number, deliverBy: string, status: string}>} by item key
 */
function ordersOnDay(orders, day) {
  var byItem = {};
  orders.forEach(function (order) {
    if (!order.itemKey || !order.enteredOn || order.enteredOn > day) return;
    var status = normalizeText_(order.status).toUpperCase();
    var shownAs;
    if (status === 'PENDING') shownAs = 'PENDING';
    else if (!order.statusDate || day < order.statusDate) shownAs = 'PENDING';
    else if (status === 'MET' && day === order.statusDate) shownAs = 'MET';
    else return;

    var entry = byItem[order.itemKey] || (byItem[order.itemKey] = { qty: 0, deliverBy: '', status: 'MET' });
    entry.qty += Number(order.qty) || 0;
    if (order.deliverBy && (!entry.deliverBy || order.deliverBy < entry.deliverBy)) entry.deliverBy = order.deliverBy;
    if (shownAs === 'PENDING') entry.status = 'PENDING';
  });
  return byItem;
}
