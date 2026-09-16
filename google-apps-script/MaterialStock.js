/**
 * Packing material stock
 * - Reads the ROLLS ISSUED and COVER/CARTON ISSUED blocks of a daily store tab
 * - Matches those lines to the Material Master
 * - Works out each material's balance, daily use and days left
 * - Reads the old PACKING STOCK sheet so its opening stock can be imported
 *
 * Plain JavaScript (uses normalizeText_ from StoreUpdateParser.js), so it runs in
 * Apps Script and in the Node tests.
 */

var MATERIAL_BLOCKS = { ROLLS: 'ROLLS', COVERS: 'COVERS' };
var MATERIAL_MOVEMENT_TYPES = { RECEIVED: 'RECEIVED', COUNT: 'COUNT' };

// Same bands as the PACKING STOCK sheet
var MATERIAL_REORDER_DAYS = 30;
var MATERIAL_PLAN_DAYS = 60;
var MATERIAL_USE_WINDOW_DAYS = 30;
var MATERIAL_SUGGEST_WINDOW_DAYS = 60;

/**
 * Leading number of a cell: 5 -> 5, '400 Pcs' -> 400, '' -> null, 'n/a' -> NaN
 */
function parseLeadingNumber_(value) {
  if (typeof value === 'number') return value;
  var text = normalizeText_(value).replace(/,/g, '');
  if (text === '') return null;
  var match = text.match(/^-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

/**
 * Wastage text -> kg: '1.85 Kg' -> 1.85, '215 Grams' -> 0.215, '2' -> 2 (kg is the usual unit)
 */
function parseWastageKg_(value) {
  var number = parseLeadingNumber_(value);
  if (number === null || isNaN(number)) return null;
  var unit = normalizeText_(value).toLowerCase().replace(/[\d.,\s]/g, '');
  if (unit.indexOf('kg') === 0) return number;
  if (unit.indexOf('g') === 0) return number / 1000;
  return number;
}

function sameMaterialName_(a, b) {
  return normalizeText_(a).toUpperCase() === normalizeText_(b).toUpperCase();
}

/**
 * Lines of the ROLLS ISSUED (left) and COVER/CARTON ISSUED (right) blocks.
 * @param {Array<Array<*>>} values - the whole daily tab
 * @returns {{lines: Array<Object>, problems: Array<Object>}}
 */
function parseMaterialIssues(values) {
  var result = { lines: [], problems: [] };

  var titleRow = -1;
  for (var r = 0; r < values.length; r++) {
    if (values[r].map(normalizeText_).join(' ').toUpperCase().indexOf('ROLLS ISSUED') !== -1) {
      titleRow = r;
      break;
    }
  }
  if (titleRow === -1 || titleRow + 1 >= values.length) return result;

  var header = values[titleRow + 1].map(function (cell) { return normalizeText_(cell).toLowerCase(); });
  var rollItem = header.indexOf('item');
  var rollQty = header.indexOf('roll');
  var rollWaste = header.indexOf('today wastage');
  var coverItem = rollItem === -1 ? -1 : header.indexOf('item', rollItem + 1);
  var coverSize = header.indexOf('size');
  var coverQty = header.indexOf('cover');

  function addLine(row, block, nameCol, sizeCol, qtyCol, wasteCol, cells) {
    if (nameCol === -1 || qtyCol === -1) return;
    var name = cells[nameCol] || '';
    if (!name) return;
    var quantity = parseLeadingNumber_(values[row][qtyCol]);
    if (isNaN(quantity)) {
      result.problems.push({ row: row + 1, name: name, issue: 'Not a number', details: 'Issued quantity is "' + cells[qtyCol] + '"' });
      return;
    }
    if (!quantity) return;
    var size = sizeCol === -1 ? '' : cells[sizeCol] || '';
    result.lines.push({
      row: row + 1,
      block: block,
      name: name,
      size: sameMaterialName_(size, name) ? '' : size,
      quantity: quantity,
      wastageKg: wasteCol === -1 ? null : parseWastageKg_(values[row][wasteCol])
    });
  }

  var seenLine = false;
  for (r = titleRow + 2; r < values.length; r++) {
    var cells = values[r].map(normalizeText_);
    var line = cells.join(' ').toUpperCase();
    if (line.indexOf('MACHINE WORK LOG') !== -1) break;
    if (line.trim() === '') {
      if (seenLine) break;
      continue;
    }
    seenLine = true;
    addLine(r, MATERIAL_BLOCKS.ROLLS, rollItem, -1, rollQty, rollWaste, cells);
    addLine(r, MATERIAL_BLOCKS.COVERS, coverItem, coverSize, coverQty, -1, cells);
  }

  return result;
}

/**
 * Material Master entry whose store sheet names include this line's name.
 */
function matchMaterial(materialMaster, block, name) {
  for (var i = 0; i < materialMaster.length; i++) {
    var material = materialMaster[i];
    if (normalizeText_(material.sheetBlock).toUpperCase() !== block) continue;
    var names = String(material.sheetNames || '').split('|');
    for (var n = 0; n < names.length; n++) {
      if (names[n].trim() && sameMaterialName_(names[n], name)) return material;
    }
  }
  return null;
}

function roundTo_(value, places) {
  var factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

function hasSheetNames_(material) {
  return normalizeText_(material.sheetBlock) !== '' && normalizeText_(material.sheetNames) !== '';
}

/**
 * Stock position of every material, plus suggested quantities per unit for the per-item list.
 *
 * Usage per material:
 * - materials written on the daily store sheet (Store Sheet Names set): what the sheet says was issued
 * - other materials: packed units (FG Daily production) x Qty per Unit from Item Materials
 * A COUNT is the stock at the end of its day; receipts and usage after that day move the balance.
 *
 * @param {Object} input
 * @param {Array<Object>} input.materials - Material Master entries
 * @param {Array<Object>} input.links - Item Materials: itemKey, materialId, qtyPerUnit, shareWeight
 * @param {Array<Object>} input.movements - Material Movements: date, type, materialId, qty, enteredAt, status
 * @param {Array<Object>} input.issues - Material Issues: date, materialId, quantity
 * @param {Array<Object>} input.dailyRows - FG Daily: date, itemKey, production
 * @returns {{stock: Array<Object>, suggestions: Object<string, number>}} suggestions by "itemKey|materialId"
 */
function computeMaterialStock(input) {
  var storeDays = {};
  var production = {};
  input.dailyRows.forEach(function (row) {
    if (!row.date) return;
    storeDays[row.date] = true;
    if (!row.itemKey || !row.production) return;
    var byDate = production[row.itemKey] || (production[row.itemKey] = {});
    byDate[row.date] = (byDate[row.date] || 0) + row.production;
  });
  var days = Object.keys(storeDays).sort();
  var useWindow = days.slice(-MATERIAL_USE_WINDOW_DAYS);
  var suggestWindow = days.slice(-MATERIAL_SUGGEST_WINDOW_DAYS);
  var inUseWindow = {};
  useWindow.forEach(function (day) { inUseWindow[day] = true; });
  var inSuggestWindow = {};
  suggestWindow.forEach(function (day) { inSuggestWindow[day] = true; });

  var issuedByMaterial = {};
  input.issues.forEach(function (issue) {
    if (!issue.materialId || !issue.quantity) return;
    var byDate = issuedByMaterial[issue.materialId] || (issuedByMaterial[issue.materialId] = {});
    byDate[issue.date] = (byDate[issue.date] || 0) + issue.quantity;
  });

  var linksByMaterial = {};
  input.links.forEach(function (link) {
    if (!link.itemKey || !link.materialId) return;
    (linksByMaterial[link.materialId] = linksByMaterial[link.materialId] || []).push(link);
  });

  function producedIn(itemKey, window) {
    var byDate = production[itemKey] || {};
    return Object.keys(byDate).reduce(function (sum, date) {
      return window[date] ? sum + byDate[date] : sum;
    }, 0);
  }

  function sumIn(byDate, window) {
    return Object.keys(byDate || {}).reduce(function (sum, date) {
      return window[date] ? sum + byDate[date] : sum;
    }, 0);
  }

  var suggestions = {};
  var stock = input.materials.map(function (material) {
    var links = linksByMaterial[material.id] || [];
    var fromSheet = hasSheetNames_(material);

    // Suggested quantity per unit: issued on the sheet, shared across the linked items by weight
    if (fromSheet && links.length > 0) {
      var weighted = links.reduce(function (sum, link) {
        return sum + producedIn(link.itemKey, inSuggestWindow) * (Number(link.shareWeight) || 1);
      }, 0);
      var issued = sumIn(issuedByMaterial[material.id], inSuggestWindow);
      links.forEach(function (link) {
        if (weighted > 0) {
          suggestions[link.itemKey + '|' + material.id] = roundTo_(issued / weighted * (Number(link.shareWeight) || 1), 6);
        }
      });
    }

    var usageByDate = {};
    if (fromSheet) {
      usageByDate = issuedByMaterial[material.id] || {};
    } else {
      links.forEach(function (link) {
        var perUnit = Number(link.qtyPerUnit) || 0;
        if (!perUnit) return;
        var byDate = production[link.itemKey] || {};
        Object.keys(byDate).forEach(function (date) {
          usageByDate[date] = (usageByDate[date] || 0) + byDate[date] * perUnit;
        });
      });
    }

    var movements = input.movements.filter(function (movement) {
      return movement.materialId === material.id && normalizeText_(movement.status).toUpperCase() !== 'CANCELLED';
    });
    var counts = movements
      .filter(function (movement) { return movement.type === MATERIAL_MOVEMENT_TYPES.COUNT; })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return String(a.enteredAt) < String(b.enteredAt) ? -1 : 1;
      });
    var count = counts[counts.length - 1] || null;

    var receivedSince = 0;
    var usedSince = 0;
    if (count) {
      movements.forEach(function (movement) {
        if (movement.type === MATERIAL_MOVEMENT_TYPES.RECEIVED && movement.date > count.date) {
          receivedSince += Number(movement.qty) || 0;
        }
      });
      Object.keys(usageByDate).forEach(function (date) {
        if (date > count.date) usedSince += usageByDate[date];
      });
    }

    var used30 = sumIn(usageByDate, inUseWindow);
    var avgDaily = useWindow.length > 0 ? used30 / useWindow.length : 0;
    var balance = count ? (Number(count.qty) || 0) + receivedSince - usedSince : null;
    var daysLeft = balance !== null && balance >= 0 && avgDaily > 0 ? balance / avgDaily : null;

    var expected30 = null;
    if (links.length > 0) {
      expected30 = links.reduce(function (sum, link) {
        var perUnit = Number(link.qtyPerUnit) || suggestions[link.itemKey + '|' + material.id] || 0;
        return sum + producedIn(link.itemKey, inUseWindow) * perUnit;
      }, 0);
    }

    var status;
    if (!count) status = 'No count';
    else if (balance < 0) status = 'Check count';
    else if (avgDaily === 0) status = 'No recent use';
    else if (daysLeft < MATERIAL_REORDER_DAYS) status = 'Reorder now';
    else if (daysLeft < MATERIAL_PLAN_DAYS) status = 'Plan reorder';
    else status = 'Healthy';

    var lastUsed = Object.keys(usageByDate).filter(function (date) { return usageByDate[date] > 0; }).sort().pop() || '';

    return {
      materialId: material.id,
      code: material.code,
      name: material.name,
      category: material.category,
      unit: material.unit,
      usageSource: fromSheet ? 'Store sheet' : links.some(function (link) { return Number(link.qtyPerUnit); }) ? 'Packing' : 'None',
      countDate: count ? count.date : '',
      counted: count ? Number(count.qty) || 0 : null,
      receivedSince: count ? roundTo_(receivedSince, 2) : null,
      usedSince: count ? roundTo_(usedSince, 2) : null,
      balance: balance === null ? null : roundTo_(balance, 2),
      used30: roundTo_(used30, 2),
      avgDaily: roundTo_(avgDaily, 2),
      daysLeft: daysLeft === null ? null : roundTo_(daysLeft, 1),
      status: status,
      expected30: expected30 === null ? null : roundTo_(expected30, 2),
      lastUsed: lastUsed
    };
  });

  return { stock: stock, suggestions: suggestions };
}

/**
 * Opening stock from the old "PACKING STOCK" sheet (summary tab).
 * @returns {{asOf: ?string, rows: Array<{id: string, opening: ?number, added: ?number}>}}
 *          asOf is the "Opening stock as of DD-MM-YYYY" date as yyyy-MM-dd
 */
function parsePackingStockSummary(values) {
  var result = { asOf: null, rows: [] };
  values.slice(0, 8).forEach(function (row) {
    var match = row.map(normalizeText_).join(' ').match(/opening stock as of (\d{2})-(\d{2})-(\d{4})/i);
    if (match && !result.asOf) result.asOf = match[3] + '-' + match[2] + '-' + match[1];
  });

  var openingCol = -1;
  var addedCol = -1;
  values.forEach(function (row) {
    var cells = row.map(normalizeText_);
    var lower = cells.map(function (cell) { return cell.toLowerCase(); });
    if (lower.indexOf('opening / total') !== -1) {
      openingCol = lower.indexOf('opening / total');
      addedCol = lower.indexOf('added');
      return;
    }
    if (lower.indexOf('total used') !== -1) {
      // Daily movements grid: not opening stock
      openingCol = -1;
      return;
    }
    if (openingCol !== -1 && /^[A-Z]{2}-\d+$/.test(cells[0])) {
      var opening = parseLeadingNumber_(row[openingCol]);
      var added = addedCol === -1 ? null : parseLeadingNumber_(row[addedCol]);
      result.rows.push({
        id: cells[0],
        opening: opening === null || isNaN(opening) ? null : opening,
        added: added === null || isNaN(added) ? null : added
      });
    }
  });

  return result;
}

/**
 * Issued lines that don't match any material, reported once per name with the date range.
 */
function checkMaterialLines(lines) {
  var unknown = {};
  var order = [];
  lines.forEach(function (line) {
    if (line.materialId) return;
    var id = line.block + '|' + normalizeText_(line.name).toUpperCase();
    if (!unknown[id]) {
      unknown[id] = { line: line, first: line.date, last: line.date, days: {} };
      order.push(id);
    }
    unknown[id].last = line.date;
    unknown[id].days[line.date] = true;
  });

  return order.map(function (id) {
    var entry = unknown[id];
    var dayCount = Object.keys(entry.days).length;
    var range = entry.first === entry.last ? entry.first : entry.first + ' to ' + entry.last;
    return {
      date: entry.first, sourceTab: entry.line.sourceTab, sourceRow: entry.line.sourceRow, itemKey: '',
      code: '', name: entry.line.name, issue: 'Unknown material',
      details: 'Not in Material Master (Store Sheet Names, ' + entry.line.block + ') - ' + range +
        ' (' + dayCount + (dayCount === 1 ? ' day)' : ' days)')
    };
  });
}
