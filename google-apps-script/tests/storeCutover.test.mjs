// Run with: npm run test:apps-script
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStoreSync, MockSheet, MockSpreadsheet } from './appsScriptMock.mjs';

const BUNDLE = '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)';
const REGULAR = 'REGULAR SUNFLOWER SEEDS IN BUNDLES/BAGS/CARTON';
const RIYADH = 'RIYADH SUNFLOWER SEEDS IN BUNDLE/BAGS/CARTON';

function storeTab(date, items, rolls) {
  const rows = [
    [''],
    ['ARS INTERNATIONAL CO SPC'],
    ['STORE UPDATE- COMPANY FINISHED GOODS'],
    ['Date', date, 'Company', '', '', '', 'No. of Absentees', '', '2S'],
    ['No', 'Item Code', 'ITEM', 'Opening', 'Production', 'Despatch', 'Closing', 'Mini Level']
  ];
  let section = '';
  items.forEach(([itemSection, code, name, opening, production, despatch, closing, min], i) => {
    if (itemSection !== section) {
      rows.push([itemSection]);
      section = itemSection;
    }
    rows.push([String(i + 1), code, name, opening, production, despatch, closing, min]);
  });
  rows.push(['']);
  rows.push(['SUNFLOWER PACKING ROLLS ISSUED', '', '', '', '', 'PACKING COVER/CARTON ISSUED']);
  rows.push(['No', 'Item', 'ROLL', 'Today Wastage', '', 'Item', 'Size', 'COVER']);
  rolls.forEach(([name, qty], i) => rows.push([String(i + 1), name, qty, '', '', '', '', '']));
  return rows;
}

const DAY_14 = storeTab('9/14/2026', [
  [REGULAR, '4402', BUNDLE, 100, 50, 30, 120, 800],
  [RIYADH, '4402', BUNDLE, 40, '', 10, 30, 500]
], [['200 Gram', 2]]);

// Still typed on the switch-over day, but no longer read
const DAY_15 = storeTab('9/15/2026', [
  [REGULAR, '4402', BUNDLE, 120, 999, 0, 1119, 800],
  [RIYADH, '4402', BUNDLE, 30, '', '', 30, 500]
], [['200 Gram', 3]]);

function movement(id, date, type, itemKey, units, status = 'ACTIVE') {
  const [code, group] = itemKey.split('-');
  return [id, date, type, itemKey, code, group, BUNDLE, units, '', '', 'Tester', `${date} 10:00`, status];
}

function setup({ appFrom = '2026-09-15' } = {}) {
  const store = new MockSpreadsheet([new MockSheet('14', DAY_14), new MockSheet('15', DAY_15)]);
  const db = new MockSpreadsheet([]);
  const sync = loadStoreSync({ store, db });
  sync.context.setupConsolidation();
  sync.context.SYNC_CONFIG.STORE_APP_FROM = appFrom;
  return { ...sync, db };
}

function body(sheet) {
  return sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function addMovements(db, rows) {
  const sheet = db.getSheetByName('Store Movements');
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 13).setValues(rows);
}

test('builds daily store rows from app entries', () => {
  const { context } = setup();
  const itemMaster = [
    { key: '4402-REG', code: '4402', group: 'REG', name: '200 g', active: 'YES', minLevel: '' },
    { key: '4402-RUH', code: '4402', group: 'RUH', name: '200 g', active: 'YES', minLevel: 50 },
    { key: '4402-BAH', code: '4402', group: 'BAH', name: '200 g', active: 'NO', minLevel: '' },
    { key: '4401-BAH', code: '4401', group: 'BAH', name: '100 g', active: 'NO', minLevel: '' }
  ];
  const sheetRows = [
    { date: '2026-09-10', itemKey: '4402-REG', closing: 80, minLevel: 700, despatch: 5 },
    { date: '2026-09-14', itemKey: '4402-REG', closing: 120, minLevel: 800, despatch: 30 },
    { date: '2026-09-14', itemKey: '4402-RUH', closing: 30, minLevel: 500, despatch: 10 },
    { date: '2026-09-14', itemKey: '4401-BAH', closing: 7, minLevel: null, despatch: null }
  ];
  const movements = [
    { date: '2026-09-15', type: 'PACKED', itemKey: '4402-REG', units: 30, status: 'ACTIVE' },
    { date: '2026-09-15', type: 'DESPATCHED', itemKey: '4402-REG', units: 10, status: 'ACTIVE' },
    { date: '2026-09-15', type: 'DESPATCHED', itemKey: '4402-REG', units: 500, status: 'CANCELLED' },
    { date: '2026-09-17', type: 'DESPATCHED', itemKey: '4402-REG', units: 5, status: 'ACTIVE' },
    { date: '2026-09-25', type: 'PACKED', itemKey: '4402-BAH', units: 2, status: 'ACTIVE' },
    { date: '2026-09-14', type: 'PACKED', itemKey: '4402-REG', units: 77, status: 'ACTIVE' }
  ];

  const rows = context.buildStoreRowsFromApp({
    itemMaster, movements, sheetRows, fromDate: '2026-09-15', toDate: '2026-09-25', skipFridays: true
  });
  const days = [...new Set(rows.map((row) => row.date))];
  // 18 Sep is a Friday without entries; 25 Sep is a Friday with an entry
  assert.deepEqual(days, ['2026-09-15', '2026-09-16', '2026-09-17', '2026-09-19', '2026-09-20',
    '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25']);

  const row = (date, key) => rows.find((r) => r.date === date && r.itemKey === key);
  const reg15 = row('2026-09-15', '4402-REG');
  assert.deepEqual(
    [reg15.opening, reg15.production, reg15.despatch, reg15.closing, reg15.minLevel, reg15.requiredQty, reg15.sourceTab],
    [120, 30, 10, 140, 800, 660, 'App']
  );
  // Suggested min for September: days 10, 14, 15 -> despatch 5, 30, 10: max(15 x 2, 30) = 30
  assert.equal(reg15.suggestedMin, 30);

  const reg17 = row('2026-09-17', '4402-REG');
  assert.deepEqual([reg17.opening, reg17.production, reg17.despatch, reg17.closing], [140, null, 5, 135]);

  // Item Master min level wins over the sheet's
  assert.equal(row('2026-09-15', '4402-RUH').minLevel, 50);
  assert.equal(row('2026-09-15', '4402-RUH').closing, 30);

  // Inactive items: listed while they hold stock or get entries
  assert.ok(row('2026-09-15', '4401-BAH'));
  assert.equal(row('2026-09-15', '4402-BAH').closing, 0);
  assert.equal(row('2026-09-25', '4402-BAH').closing, 2);
});

test('sync builds FG Daily from the app from the switch-over day', () => {
  const { context, db, logs } = setup();
  addMovements(db, [
    movement('PK-1', '2026-09-15', 'PACKED', '4402-REG', 30),
    movement('DS-1', '2026-09-16', 'DESPATCHED', '4402-RUH', 12)
  ]);
  logs.length = 0;
  context.syncStoreUpdates();
  assert.match(logs.at(-1), /built from the app since 2026-09-15/);

  const daily = body(db.getSheetByName('FG Daily'));
  const byDay = (date) => daily.filter((row) => row[0] === date);
  assert.equal(byDay('2026-09-14').length, 2);
  assert.ok(byDay('2026-09-14').every((row) => row[16] !== 'App'));
  assert.ok(byDay('2026-09-15').length > 2, 'every active item is listed');
  assert.ok(byDay('2026-09-15').every((row) => row[16] === 'App'));

  const find = (date, key) => daily.find((row) => row[0] === date && row[1] === key);
  // The store sheet's 999 on 15 Sep is ignored
  assert.deepEqual(find('2026-09-15', '4402-REG').slice(5, 9), [120, 30, '', 150]);
  assert.deepEqual(find('2026-09-16', '4402-RUH').slice(5, 9), [30, '', 12, 18]);
  assert.equal(daily.at(-1)[0], '2026-09-16');

  // Nothing compared after the switch-over
  assert.equal(body(db.getSheetByName('Parallel Check')).length, 0);
});

test('material use comes from packing after the switch-over', () => {
  const { context, db } = setup();
  const movements = db.getSheetByName('Material Movements');
  movements.getRange(2, 1, 1, 12).setValues([
    ['MC-1', '2026-09-13', 'COUNT', 'RS-2', 'Sunflower Roll 200 Gram', 100, 'Roll', '', '', 'Tester', '2026-09-13 18:00', 'ACTIVE']
  ]);
  addMovements(db, [movement('PK-1', '2026-09-15', 'PACKED', '4402-REG', 30)]);
  context.syncStoreUpdates();

  const stock = body(db.getSheetByName('Material Stock')).find((row) => row[0] === 'RS-2');
  // Suggested per bundle from 14 Sep: 2 rolls / (50 bundles x 50) x 50 = 0.04
  // Balance: 100 - 2 issued on 14 Sep - 30 bundles x 0.04 on 15 Sep (the sheet's 3 rolls are ignored)
  assert.equal(stock[5], 'Store sheet, packing from 2026-09-15');
  assert.equal(stock[10], 96.8);
});

test('the store sheet stays the source while no switch-over day is set', () => {
  const { context, db } = setup({ appFrom: '' });
  context.syncStoreUpdates();
  const daily = body(db.getSheetByName('FG Daily'));
  assert.ok(daily.every((row) => row[16] !== 'App'));
  assert.equal(daily.find((row) => row[0] === '2026-09-15' && row[1] === '4402-REG')[6], 999);
});

test('rejects a badly written switch-over day', () => {
  const { context } = setup({ appFrom: '15/09/2026' });
  assert.throws(() => context.syncStoreUpdates(), /STORE_APP_FROM must look like/);
});
