// Run with: npm run test:apps-script
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStoreSync, MockSheet, MockSpreadsheet } from './appsScriptMock.mjs';

const HEADER = ['No', 'Item Code', 'ITEM', 'Opening', 'Production', 'Despatch', 'Closing', 'Mini Level', 'Suggested Mini', 'Required Qty', 'Specific Order', 'Deliver By', 'Order Status'];

// A daily tab shaped like "Packing and dispach 2026" (merged cells only keep their first value)
function storeTab(date, items, { absentees = '2S' } = {}) {
  const rows = [
    [''],
    ['ARS INTERNATIONAL CO SPC'],
    ['STORE UPDATE- COMPANY FINISHED GOODS'],
    ['Date', date, 'Company', '', '', '', 'No. of Absentees (e.g. 2S 1O)', '', absentees],
    HEADER
  ];
  let section = '';
  let no = 1;
  items.forEach(([itemSection, code, name, opening, production, despatch, closing, min]) => {
    if (itemSection !== section) {
      rows.push([itemSection]);
      section = itemSection;
    }
    rows.push([String(no++), code, name, opening, production, despatch, closing, min, '', '', '', '', '']);
  });
  rows.push(['']);
  rows.push(['SUNFLOWER PACKING ROLLS ISSUED', '', '', '', '', 'PACKING COVER/CARTON ISSUED']);
  rows.push(['No', 'Item', 'ROLL', 'Today Wastage', '', 'Item', 'Size', 'COVER']);
  rows.push(['1', '200 Gram', '6', '1.85 Kg', '', '100gm bndl', '67*43', '']);
  return rows;
}

const REGULAR = 'REGULAR SUNFLOWER SEEDS IN BUNDLES/BAGS/CARTON';
const RIYADH = 'RIYADH SUNFLOWER SEEDS IN BUNDLE/BAGS/CARTON';
const MELON_PUMPKIN = 'MELON & PUMPKIN SEEDS IN CARTON/BAGS';

const DAY_1 = storeTab('9/14/2026', [
  [REGULAR, '4402', '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)', 100, 50, 30, 120, 800],
  [REGULAR, '1126', '10kg Blue Sunflower Seeds AHL(PRM)', 10, '', 5, 5, 300],
  [REGULAR, '1126', '10kg Blue Sunflower Seeds DAMMAM SPL(STD)', 20, '', '', 20, 300],
  [RIYADH, '4402', '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)', 40, '', 10, 30, 500],
  [MELON_PUMPKIN, '1181', 'Sunflower & Pumpkin Combo(130+15) 12 pcs', 3, '', '', 3, '']
]);

const DAY_2 = storeTab(new Date(Date.UTC(2026, 8, 15)), [
  [REGULAR, '4402', '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)', 125, '', '#REF!', 125, 800],
  [REGULAR, '1126', '10kg Blue Sunflower Seeds AHL(PRM)', 5, '', '', 5, 300],
  [REGULAR, '1126', '10kg Blue Sunflower Seeds DAMMAM SPL(STD)', 20, '', 25, -5, 300],
  [RIYADH, '4402', '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)', 30, '', '', 30, 500],
  [MELON_PUMPKIN, '9999', 'Mystery item', 1, '', '', 1, '']
], { absentees: '1O' });

const DASHBOARD = [
  ['ARS INTERNATIONAL CO SPC  —  INVENTORY DASHBOARD'],
  [''],
  ['Store Update · Company Finished Goods'],
  ['ITEMS TRACKED', '', 'BELOW MIN LEVEL'],
  ['36', '', '23'],
  ['']
];

function setup() {
  const store = new MockSpreadsheet([
    new MockSheet('9/14/2026', DAY_1),
    new MockSheet('INVENTORY DASHBOARD', DASHBOARD),
    new MockSheet('9/15/2026', DAY_2)
  ]);
  const db = new MockSpreadsheet([new MockSheet('Production Data', [['Date']])]);
  const sync = loadStoreSync({ store, db });
  return { ...sync, store, db };
}

function body(sheet, width) {
  return sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
}

const formatDate = (date) => date.toISOString().slice(0, 10);

test('parses a daily tab into item rows', () => {
  const { context } = setup();
  const day1 = context.parseStoreUpdateGrid(DAY_1, formatDate);

  assert.equal(day1.isStoreUpdate, true);
  assert.equal(day1.date, '2026-09-14');
  assert.equal(day1.absentees, '2S');
  assert.equal(day1.items.length, 5);
  assert.equal(day1.problems.length, 0);

  const first = day1.items[0];
  assert.equal(first.group, 'REG');
  assert.equal(first.code, '4402');
  assert.equal(first.opening, 100);
  assert.equal(first.closing, 120);
  assert.equal(first.minLevel, 800);
  assert.equal(day1.items[1].production, null);
  assert.equal(day1.items[3].group, 'RUH');
});

test('reads real date cells and flags text in number columns', () => {
  const { context } = setup();
  const day2 = context.parseStoreUpdateGrid(DAY_2, formatDate);

  assert.equal(day2.date, '2026-09-15');
  assert.equal(day2.items[0].despatch, null);
  assert.equal(day2.problems.length, 1);
  assert.equal(day2.problems[0].issue, 'Not a number');
  assert.match(day2.problems[0].details, /#REF!/);
});

test('ignores tabs that are not daily store updates', () => {
  const { context } = setup();
  assert.equal(context.parseStoreUpdateGrid(DASHBOARD, formatDate).isStoreUpdate, false);
  assert.equal(context.parseStoreUpdateGrid([['Something else']], formatDate).isStoreUpdate, false);
});

test('matches items by code, variant words, and name when codes are swapped', () => {
  const { context } = setup();
  const master = context.itemMasterFromRows(context.ITEM_MASTER_SEED);
  const match = (group, code, name) => {
    const result = context.matchStoreItem(master, group, code, name);
    return result && { key: result.entry.key, codeMismatch: result.codeMismatch };
  };

  assert.deepEqual(match('REG', '1126', '10kg Blue Sunflower Seeds AHL(PRM)'), { key: '1126-REG-PRM', codeMismatch: false });
  assert.deepEqual(match('REG', '1126', '10kg Blue Sunflower Seeds DAMMAM SPL(STD)'), { key: '1126-REG-STD', codeMismatch: false });
  assert.deepEqual(match('RUH', '4402', 'anything'), { key: '4402-RUH', codeMismatch: false });
  assert.deepEqual(match('MP', '1181', 'Sunflower & Pumpkin Combo(130+15) 12 pcs'), { key: '1182-MP', codeMismatch: true });
  assert.deepEqual(match('POP', '1712', 'PC- Salted-16 gm (8 x 8) Master Carton(Return)'), { key: '1712-POP-RET', codeMismatch: false });
  assert.deepEqual(match('POP', '1712', 'PC- Salted-16 gm (8 x 8) Master Carton'), { key: '1712-POP', codeMismatch: false });
  assert.equal(match('MP', '9999', 'Mystery item'), null);
});

test('item master seed has unique keys and full rows', () => {
  const { context } = setup();
  const keys = context.ITEM_MASTER_SEED.map((row) => row[0]);
  assert.equal(new Set(keys).size, keys.length);
  context.ITEM_MASTER_SEED.forEach((row) => assert.equal(row.length, context.ITEM_MASTER_HEADERS.length, row[0]));
  context.MATERIAL_MASTER_SEED.forEach((row) => assert.equal(row.length, context.MATERIAL_MASTER_HEADERS.length, row[0]));
  const groups = new Set(context.STORE_GROUPS.map((group) => group.key));
  context.ITEM_MASTER_SEED.forEach((row) => assert.ok(groups.has(row[3]), `${row[0]} has unknown group ${row[3]}`));
});

test('setup creates the tabs, loads every day, and reports issues', () => {
  const { context, db } = setup();
  context.setupConsolidation();

  const items = db.getSheetByName('Item Master');
  assert.equal(items.getLastRow() - 1, context.ITEM_MASTER_SEED.length);

  const daily = body(db.getSheetByName('FG Daily'), 19);
  assert.equal(daily.length, 10);
  assert.ok(daily.every((row) => typeof row[0] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row[0])));
  assert.deepEqual(daily[0].slice(0, 10), ['2026-09-14', '4402-REG', '4402', 'REG', '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)', 100, 50, 30, 120, 800]);
  assert.equal(daily[5][15], '1O');

  const issues = body(db.getSheetByName('Sync Issues'), 8).map((row) => `${row[0]} ${row[3] || row[4]} ${row[6]}`);
  assert.deepEqual(issues.sort(), [
    '2026-09-14 1182-MP Code differs from Item Master',
    '2026-09-15 1126-REG-STD Negative closing',
    '2026-09-15 4402 Not a number',
    '2026-09-15 4402-REG Opening differs from previous closing',
    '2026-09-15 9999 Unknown item'
  ]);
});

test('sync is repeatable and picks up corrections', () => {
  const { context, db, store } = setup();
  context.setupConsolidation();
  const snapshot = () => JSON.stringify([body(db.getSheetByName('FG Daily'), 19), body(db.getSheetByName('Sync Issues'), 8)]);
  const first = snapshot();

  context.syncStoreUpdates();
  assert.equal(snapshot(), first);

  context.setupConsolidation();
  assert.equal(snapshot(), first);
  assert.equal(db.getSheetByName('Item Master').getLastRow() - 1, context.ITEM_MASTER_SEED.length);

  // Fix the opening on day 2 in the store sheet
  const day2 = store.getSheetByName('9/15/2026');
  const row = day2.cells.findIndex((cells) => cells[1] === '4402');
  day2.cells[row][3] = 120;
  day2.cells[row][6] = 120;
  context.syncStoreUpdates();

  const fixed = body(db.getSheetByName('FG Daily'), 19).find((cells) => cells[0] === '2026-09-15' && cells[1] === '4402-REG');
  assert.equal(fixed[5], 120);
  const issues = body(db.getSheetByName('Sync Issues'), 8).map((cells) => cells[6]);
  assert.ok(!issues.includes('Opening differs from previous closing'));
});

test('stops with a clear message when setup has not run', () => {
  const { context } = setup();
  assert.throws(() => context.syncStoreUpdates(), /run setupConsolidation first/);
});

test('installs a single automatic sync trigger', () => {
  const { context, triggers } = setup();
  context.installAutoSync();
  context.installAutoSync();
  assert.deepEqual(triggers.map((trigger) => [trigger.handler, trigger.hours]), [['syncStoreUpdates', 1]]);
});
