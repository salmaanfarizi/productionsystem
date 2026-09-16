// Run with: npm run test:apps-script
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStoreSync, MockSheet, MockSpreadsheet } from './appsScriptMock.mjs';

const ITEM_HEADER = ['No', 'Item Code', 'ITEM', 'Opening', 'Production', 'Despatch', 'Closing', 'Mini Level'];

// Daily tab with the item table and the issued blocks below it
function storeTab(date, items, rolls, covers) {
  const rows = [
    [''],
    ['ARS INTERNATIONAL CO SPC'],
    ['STORE UPDATE- COMPANY FINISHED GOODS'],
    ['Date', date, 'Company', '', '', '', 'No. of Absentees', '', '2S'],
    ITEM_HEADER,
    ['REGULAR SUNFLOWER SEEDS IN BUNDLES/BAGS/CARTON'],
    ...items.map(([code, name, opening, production, despatch, closing], i) =>
      [String(i + 1), code, name, opening, production, despatch, closing, 800]),
    [''],
    ['SUNFLOWER PACKING ROLLS ISSUED', '', '', '', '', 'PACKING COVER/CARTON ISSUED'],
    ['No', 'Item', 'ROLL', 'Today Wastage', '', 'Item', 'Size', 'COVER']
  ];
  const lines = Math.max(rolls.length, covers.length);
  for (let i = 0; i < lines; i++) {
    const [rollName = '', rollQty = '', waste = ''] = rolls[i] || [];
    const [coverName = '', size = '', coverQty = ''] = covers[i] || [];
    rows.push([String(i + 1), rollName, rollQty, waste, '', coverName, size, coverQty]);
  }
  rows.push(['']);
  rows.push(['🛠 MACHINE WORK LOG — minutes']);
  rows.push(['MACHINE', '', '', 'Units today']);
  return rows;
}

const BUNDLE = '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)';

const DAY_1 = storeTab('9/14/2026',
  [['4402', BUNDLE, 100, 50, 30, 120], ['1145', '130gm Sunflower Seeds (6x12 Pcs) Master Carton', 10, 4, 0, 14]],
  [['200 Gram', 2, '1.85 Kg'], ['25/20  Gram', '', ''], ['Mystery Roll', 1, '']],
  [['200 gm bndl', '88*42', 1], ['Master Carton Small', 'Master Carton Small', '400 Pcs']]);

const DAY_2 = storeTab('9/15/2026',
  [['4402', BUNDLE, 120, 50, 20, 150], ['1145', '130gm Sunflower Seeds (6x12 Pcs) Master Carton', 14, 1, 0, 15]],
  [['200 Gram', 3, '215 Grams'], ['CLEAR TAPE', 'two', '']],
  [['200 gm bndl', '88*42', '']]);

const PACKING_STOCK = [
  ['ARS International Co SPC — Packing Stock (Cartons · Rolls · Covers · Tape)'],
  ['August 2026  •  Opening stock as of 01-09-2026  •  Used & Added update automatically'],
  [''],
  ['Sunflower Packing Rolls  (unit: rolls)'],
  ['ID', 'Code', 'Item', 'Size', 'Hotpack Dubai', 'China Old', 'China New', 'Al Hasa', 'Opening / Total', 'Used', 'Added', 'Closing'],
  ['RS-2', '2568', '200 Gram', '370 x 240', '230', '', '', '', '100.', '5.', '10.', '105.'],
  ['PC-4', '3357', '200 Gram Bundle Cover', '88 x 42', '', '', '', '', '8', '0', '0', '8'],
  ['XX-9', '', 'Not in the master', '', '', '', '', '', '5', '0', '0', '5'],
  [''],
  ['Daily Movements — August 2026'],
  ['ID', 'Item (auto-fills from Summary)', '1', '2', 'Total Used', 'Added'],
  ['RS-2', '200 Gram', '1', '4', '5', '10']
];

function setup() {
  const store = new MockSpreadsheet([new MockSheet('14', DAY_1), new MockSheet('15', DAY_2)]);
  const packing = new MockSpreadsheet([new MockSheet('Summary', PACKING_STOCK)]);
  const db = new MockSpreadsheet([]);
  const sync = loadStoreSync({ store, db, packing });
  sync.context.SYNC_CONFIG.PACKING_STOCK_SPREADSHEET_ID = 'packing';
  return { ...sync, store, db };
}

function body(sheet) {
  return sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function stockOf(db, id) {
  const headers = db.getSheetByName('Material Stock').getRange(1, 1, 1, 18).getValues()[0];
  const row = body(db.getSheetByName('Material Stock')).find((cells) => cells[0] === id);
  return Object.fromEntries(headers.map((header, i) => [header, row[i]]));
}

test('reads the issued blocks below the item table', () => {
  const { context } = setup();
  const day1 = context.parseMaterialIssues(DAY_1);
  const lines = day1.lines.map((line) => `${line.block} ${line.name} ${line.quantity} ${line.size} ${line.wastageKg}`);
  assert.deepEqual([...lines], [
    'ROLLS 200 Gram 2  1.85',
    'COVERS 200 gm bndl 1 88*42 null',
    'COVERS Master Carton Small 400  null',
    'ROLLS Mystery Roll 1  null'
  ]);
  assert.equal(day1.problems.length, 0);

  const day2 = context.parseMaterialIssues(DAY_2);
  assert.equal(day2.lines[0].wastageKg, 0.215);
  assert.equal(day2.problems.length, 1);
  assert.match(day2.problems[0].details, /two/);
});

test('matches issued lines by store sheet name, ignoring case and spacing', () => {
  const { context } = setup();
  const materials = context.materialMasterFromRows(context.MATERIAL_MASTER_SEED);
  const match = (block, name) => context.matchMaterial(materials, block, name)?.id || null;
  assert.equal(match('ROLLS', '25/20  gram'), 'RS-5');
  assert.equal(match('ROLLS', '25 Gram Outer Roll'), 'RS-6');
  assert.equal(match('COVERS', '100gm  bndl'), 'PC-1');
  assert.equal(match('COVERS', '15 Gram Melon/Pumpkin M. Carton'), 'MC-4');
  assert.equal(match('COVERS', '200 Gram'), null); // right name, wrong block
  assert.equal(match('ROLLS', 'Popcorn Roll (Salted/Cheese/Butter)'), null);
});

test('material seeds are complete and consistent', () => {
  const { context } = setup();
  const ids = context.MATERIAL_MASTER_SEED.map((row) => row[0]);
  assert.equal(new Set(ids).size, ids.length);
  context.MATERIAL_MASTER_SEED.forEach((row) => assert.equal(row.length, context.MATERIAL_MASTER_HEADERS.length, row[0]));

  const itemKeys = new Set(context.ITEM_MASTER_SEED.map((row) => row[0]));
  const links = context.ITEM_MATERIAL_SEED.map((row) => `${row[0]}|${row[1]}`);
  assert.equal(new Set(links).size, links.length);
  context.ITEM_MATERIAL_SEED.forEach((row) => {
    assert.equal(row.length, context.ITEM_MATERIAL_HEADERS.length, row.join());
    assert.ok(itemKeys.has(row[0]), `unknown item ${row[0]}`);
    assert.ok(ids.includes(row[1]), `unknown material ${row[1]}`);
  });
});

test('works out balance, daily use, days left and status', () => {
  const { context } = setup();
  const result = context.computeMaterialStock({
    materials: [
      { id: 'ROLL', name: 'Roll', sheetBlock: 'ROLLS', sheetNames: 'Roll' },
      { id: 'BOX', name: 'Box', sheetBlock: '', sheetNames: '' },
      { id: 'NEW', name: 'Never counted', sheetBlock: 'ROLLS', sheetNames: 'New' }
    ],
    links: [
      { itemKey: 'A', materialId: 'ROLL', qtyPerUnit: '', shareWeight: 2 },
      { itemKey: 'B', materialId: 'ROLL', qtyPerUnit: '', shareWeight: 1 },
      { itemKey: 'A', materialId: 'BOX', qtyPerUnit: 6, shareWeight: 6 }
    ],
    movements: [
      { date: '2026-09-01', type: 'COUNT', materialId: 'ROLL', qty: 50, enteredAt: '1', status: 'ACTIVE' },
      { date: '2026-09-01', type: 'COUNT', materialId: 'ROLL', qty: 40, enteredAt: '2', status: 'ACTIVE' },
      { date: '2026-09-01', type: 'RECEIVED', materialId: 'ROLL', qty: 99, enteredAt: '3', status: 'ACTIVE' },
      { date: '2026-09-02', type: 'RECEIVED', materialId: 'ROLL', qty: 10, enteredAt: '4', status: 'ACTIVE' },
      { date: '2026-09-02', type: 'RECEIVED', materialId: 'ROLL', qty: 500, enteredAt: '5', status: 'CANCELLED' },
      { date: '2026-09-01', type: 'COUNT', materialId: 'BOX', qty: 100, enteredAt: '6', status: 'ACTIVE' }
    ],
    issues: [
      { date: '2026-09-01', materialId: 'ROLL', quantity: 7 },
      { date: '2026-09-02', materialId: 'ROLL', quantity: 3 },
      { date: '2026-09-03', materialId: 'ROLL', quantity: 5 }
    ],
    dailyRows: [
      { date: '2026-09-01', itemKey: 'A', production: 10 },
      { date: '2026-09-02', itemKey: 'A', production: 10 },
      { date: '2026-09-02', itemKey: 'B', production: 5 },
      { date: '2026-09-03', itemKey: 'B', production: 5 }
    ]
  });
  const byId = Object.fromEntries(result.stock.map((row) => [row.materialId, row]));

  // Latest count (40) + receipt after the count day (10) - issues after the count day (3 + 5)
  assert.equal(byId.ROLL.balance, 42);
  assert.equal(byId.ROLL.usageSource, 'Store sheet');
  assert.equal(byId.ROLL.used30, 15);
  assert.equal(byId.ROLL.avgDaily, 5);
  assert.equal(byId.ROLL.daysLeft, 8.4);
  assert.equal(byId.ROLL.status, 'Reorder now');
  assert.equal(byId.ROLL.lastUsed, '2026-09-03');

  // 15 issued / (20 x 2 + 10 x 1) = 0.3 per weight
  assert.equal(result.suggestions['A|ROLL'], 0.6);
  assert.equal(result.suggestions['B|ROLL'], 0.3);
  assert.equal(byId.ROLL.expected30, 15);

  // Not on the store sheet: 10 units packed after the count x 6 per unit
  assert.equal(byId.BOX.usageSource, 'Packing');
  assert.equal(byId.BOX.balance, 40);
  assert.equal(byId.BOX.used30, 120);

  assert.equal(byId.NEW.status, 'No count');
  assert.equal(byId.NEW.balance, null);
});

test('reports a negative balance without days left', () => {
  const { context } = setup();
  const [row] = context.computeMaterialStock({
    materials: [{ id: 'M', name: 'M', sheetBlock: 'COVERS', sheetNames: 'M' }],
    links: [],
    movements: [{ date: '2026-09-01', type: 'COUNT', materialId: 'M', qty: 5, enteredAt: '', status: '' }],
    issues: [{ date: '2026-09-02', materialId: 'M', quantity: 9 }],
    dailyRows: [{ date: '2026-09-02', itemKey: '', production: 0 }]
  }).stock;
  assert.equal(row.balance, -4);
  assert.equal(row.daysLeft, null);
  assert.equal(row.status, 'Check count');
});

test('setup and sync fill the material tabs and flag unknown materials', () => {
  const { context, db } = setup();
  context.setupConsolidation();

  const issues = body(db.getSheetByName('Material Issues'));
  assert.deepEqual(issues.map((row) => `${row[0]} ${row[1]} ${row[3]} ${row[5]}`), [
    '2026-09-14 RS-2 200 Gram 2',
    '2026-09-14 PC-4 200 gm bndl 1',
    '2026-09-14 MC-2 Master Carton Small 400',
    '2026-09-14  Mystery Roll 1',
    '2026-09-15 RS-2 200 Gram 3'
  ]);

  const syncIssues = body(db.getSheetByName('Sync Issues')).map((row) => `${row[0]} ${row[5]} ${row[6]}`);
  assert.ok(syncIssues.includes('2026-09-14 Mystery Roll Unknown material'));
  assert.ok(syncIssues.includes('2026-09-15 CLEAR TAPE Not a number'));

  assert.equal(stockOf(db, 'RS-2').Status, 'No count');
  const links = body(db.getSheetByName('Item Materials'));
  const suggestion = links.find((row) => row[0] === '4402-REG' && row[1] === 'RS-2');
  assert.equal(suggestion[4], 0.05); // 5 rolls / (100 bundles x weight 50) x weight 50
});

test('imports opening stock from the PACKING STOCK sheet once', () => {
  const { context, db, logs } = setup();
  context.setupConsolidation();
  context.importPackingStockSheet();

  const movements = body(db.getSheetByName('Material Movements')).map((row) => `${row[1]} ${row[2]} ${row[3]} ${row[5]}`);
  assert.deepEqual(movements, [
    '2026-08-31 COUNT RS-2 100',
    '2026-09-01 RECEIVED RS-2 10',
    '2026-08-31 COUNT PC-4 8'
  ]);

  // 100 counted + 10 received - (2 + 3) issued
  assert.equal(stockOf(db, 'RS-2').Balance, 105);
  assert.equal(stockOf(db, 'PC-4').Balance, 7);

  logs.length = 0;
  context.importPackingStockSheet();
  assert.match(logs[0], /already imported/);
  assert.equal(body(db.getSheetByName('Material Movements')).length, 3);
});

test('adds the new columns to a Material Master made by the earlier version', () => {
  const { context, db } = setup();
  const oldHeaders = context.MATERIAL_MASTER_HEADERS.slice(0, 11);
  const oldRows = context.MATERIAL_MASTER_SEED.slice(0, 3).map((row) => row.slice(0, 11));
  oldRows[0][10] = 'My own note';
  db.sheets.push(new MockSheet('Material Master', [oldHeaders, ...oldRows]));

  context.setupConsolidation();

  const sheet = db.getSheetByName('Material Master');
  assert.deepEqual(sheet.getRange(1, 1, 1, 13).getValues()[0], [...context.MATERIAL_MASTER_HEADERS]);
  const rows = body(sheet);
  assert.equal(rows[0][10], 'My own note');
  assert.deepEqual(rows[2].slice(11), ['COVERS', '15 Gram Melon Seeds Box']);
  assert.equal(rows.length, context.MATERIAL_MASTER_SEED.length);
});
