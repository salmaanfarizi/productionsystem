// Run with: npm run test:apps-script
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStoreSync, MockSheet, MockSpreadsheet } from './appsScriptMock.mjs';

const utc = (iso) => new Date(`${iso}T00:00:00Z`);
const fmt = (date) => date.toISOString().slice(0, 10);

// Supplier names and numbers here are made up
const HEADER = ['DATE', 'T6 230-240', '361 190-200 ACME', '', 'TOTAL', 'SALT', 'RIYAD', '10 KG', 'REMARK',
  'DIESEL (L)', 'WW BIG', 'WW SMALL', 'OT HOURS', 'WASTE CROP', 'WASTE CROP (SACK)', 'WASTAGE (GRAMS)', 'WASTE g/SACK',
  '', 'DATE', 'T6 230-240', 'WASTAGE'];

function monthTab(month, header, rows) {
  return [
    ['ARS INTERNATIONAL CO.SPC'],
    [`USE  RAW SEEDS  &  SALT DETAILS ( SACK )  ${month} 2026`],
    header,
    ...rows,
    ['TOTAL', '', '', '', '999'],
    ['Riyad hub change to 361 190-200 ACME'],
    ['01-Aug-2026', '5']
  ];
}

const AUGUST = monthTab('AUGUST', HEADER, [
  ['31-Jul-2026', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '01-Aug-2026', '9', '9'],
  [utc('2026-08-01'), 100, 50, '', 150, 12, 2, '', 'DAY SHIFT', '6,000', 1, '', '', 'T6 230-240', 150, 300, 2],
  ['02-Aug-2026', 200, '', '', 250, 'n/a', '', 1.5, 'DAYNIGHT SHIFT', '', '', 1, '', '', '', '', ''],
  ['03-Aug-2026', '', '', '', '', '', '', '', 'NO PRODUCTION', '', 1, '', '', '', '', '', ''],
  ['07-Aug-2026', '', 40, 7, 47, '', '', '', 'FRIDAY', '', '', '', '', '', '', '', ''],
  ['05-Aug-2026', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
]);

const SEPT_HEADER = ['DATE', '361 269-270', '361 190- 200  acme', 'TOTAL', 'SALT', 'RIYAD', '10 KG PREMIUM',
  '10 KG STANDARD', '10 KG ECO', 'REMARK', 'DIESEL (L)', 'WW BIG', 'WW SMALL', 'OT HOURS'];
const SEPTEMBER = monthTab('SEPTEMBER', SEPT_HEADER, [
  ['31-Aug-2026', '', '', '', '', '', '', 3.5, '', '', '', '', '', ''],
  ['01-Sep-2026', 100, 100, 200, 10, 1, 1, '', '', 'DAYNIGHT SHIFT', '', '', '', ''],
  ['02-Sep-2026', 50, '', 50, 4, '', '', '', '', 'NIGHT SHIFT', '', '', '', 2]
]);

function parse(context, values) {
  return context.parseProductionGrid(values, fmt);
}

test('reads a monthly production tab by its headers', () => {
  const { context } = loadStoreSync({});
  const parsed = parse(context, AUGUST);
  assert.equal(parsed.isProductionLog, true);
  assert.equal(parsed.month, '2026-08');
  assert.deepEqual([...parsed.seedHeaders], ['T6 230-240', '361 190-200 ACME']);
  assert.deepEqual([...parsed.days.map((day) => day.date)], ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-07']);

  const first = parsed.days[0];
  assert.equal(first.totalSacks, 150);
  assert.equal(first.sheetTotal, 150);
  assert.equal(first.saltBags, 12);
  assert.equal(first.riyadhTonnes, 2);
  assert.equal(first.dieselLitres, 6000);
  assert.equal(first.wasteKg, 300);
  assert.equal(first.wasteCrop, 'T6 230-240');
  assert.equal(parsed.days[1].tenKgTonnes, 1.5);
  assert.equal(parsed.days[1].saltBags, null);

  const problems = parsed.problems.map((problem) => `${problem.row} ${problem.issue}`);
  assert.deepEqual([...problems], [
    '6 Not a number',
    '8 Seed column without a name'
  ]);
  // Sacks in the unnamed column are not counted
  assert.equal(parsed.days[3].totalSacks, 40);
});

test('ignores tabs that are not production logs', () => {
  const { context } = loadStoreSync({});
  const parsed = parse(context, [['DASHBOARD'], ['DATE', 'TOTAL']]);
  assert.equal(parsed.isProductionLog, false);
  assert.equal(parsed.days.length, 0);
});

test('turns remarks into shifts', () => {
  const { context } = loadStoreSync({});
  const shift = (remark) => {
    const result = context.shiftFromRemark(remark);
    return `${result.shift}/${result.note}`;
  };
  assert.equal(shift('DAY SHIFT'), 'Day/');
  assert.equal(shift('DAYNIGHT SHIFT'), 'Day and night/');
  assert.equal(shift(' night shift'), 'Night/');
  assert.equal(shift('NO PRODUCTION'), 'No production/');
  assert.equal(shift('FRIDAY'), 'No production/Friday');
  assert.equal(shift('NO PRODUCTION EID'), 'No production/Eid');
  assert.equal(shift(''), '/');
  assert.equal(shift('MAINTENANCE'), '/MAINTENANCE');
});

test('adds seed lines for new columns and folds in a mistyped size', () => {
  const { context } = loadStoreSync({});
  const headers = [
    { header: '361 269-270', tab: 'SEP' },
    { header: '361 260-270', tab: 'AUG' },
    { header: '361 190- 200 acme', tab: 'SEP' },
    { header: 'T6 199-200', tab: 'SEP' }
  ];
  const result = context.newSeedLines([], headers);
  const rows = result.newRows.map((row) => row.slice(0, 5).join('/'));
  assert.deepEqual([...rows], [
    '361-260-270/361/260-270//361 260-270 | 361 269-270',
    '361-190-200-ACME/361/190-200/ACME/361 190-200 ACME',
    'T6-199-200/T6/199-200//T6 199-200'
  ]);
  assert.match(result.newRows[2][6], /check the size/);

  // An existing line gets the typo as an extra sheet name
  const existing = context.seedLinesFromRows([['361-260-270', '361', '260-270', '', '361 260-270', 'YES', '']]);
  const again = context.newSeedLines(existing, [{ header: '361 269-270', tab: 'SEP' }]);
  assert.equal(again.newRows.length, 0);
  assert.deepEqual([...again.extraNames['361-260-270']], ['361 269-270']);
  assert.deepEqual([...existing[0].names], ['361 260-270']);

  assert.equal(context.matchSeedLine(existing, '361 260 - 270').id, '361-260-270');
  assert.equal(context.matchSeedLine(existing, '361 250-260'), null);
});

test('finds problems in the production days', () => {
  const { context } = loadStoreSync({});
  const day = (date, extra) => ({
    date, row: 5, sourceTab: 'AUG', seeds: [], totalSacks: 0, sheetTotal: null, remark: 'DAY SHIFT',
    riyadhTonnes: null, tenKgTonnes: null, prm10Tonnes: null, std10Tonnes: null, eco10Tonnes: null, ...extra
  });
  const issues = context.checkProductionDays([
    day('2026-08-01', { totalSacks: 100, sheetTotal: 110 }),
    day('2026-08-01', { totalSacks: 5, sourceTab: 'SEP' }),
    day('2026-08-02', { totalSacks: 40, remark: 'NO PRODUCTION' }),
    day('2026-08-03', { remark: 'FRIDAY' }),
    day('2026-08-07', { remark: 'FRIDAY' }),
    day('2026-08-08', { totalSacks: 100, riyadhTonnes: 1.5, tenKgTonnes: 1 }),
    day('2026-08-09', { totalSacks: 10, remark: '' }),
    day('2026-08-10', { remark: 'HALF DAY' })
  ]).map((issue) => `${issue.date} ${issue.issue}`);
  assert.deepEqual([...issues], [
    '2026-08-01 Total does not add up',
    '2026-08-01 Duplicate day',
    '2026-08-02 Seed used on a day off',
    '2026-08-03 Friday on another day',
    '2026-08-08 More tonnes than seed used',
    '2026-08-09 No shift',
    '2026-08-10 Unknown remark'
  ]);
});

test('builds days from the latest app save and compares them with the sheet', () => {
  const { context } = loadStoreSync({});
  const row = (saveId, enteredAt, kind, extra = {}) => ({
    saveId, date: '2026-09-01', kind, lineId: '', sacks: null, destination: 'REGULAR', shift: '', saltBags: null,
    dieselLitres: null, wwBig: null, wwSmall: null, otHours: null, wasteKg: null, wasteSacks: null,
    note: '', enteredBy: 'Tester', enteredAt, ...extra
  });
  const logs = context.latestProductionLogs([
    row('P1', '2026-09-01 10:00', 'DAY', { shift: 'Day', saltBags: 5 }),
    row('P1', '2026-09-01 10:00', 'SEED', { lineId: 'A', sacks: 10 }),
    row('P2', '2026-09-01 18:00', 'DAY', { shift: 'Day and night', saltBags: 10, wasteKg: 400 }),
    row('P2', '2026-09-01 18:00', 'SEED', { lineId: 'A', sacks: 150, destination: 'RIYADH' }),
    row('P2', '2026-09-01 18:00', 'SEED', { lineId: 'A', sacks: 50 }),
    row('P2', '2026-09-01 18:00', 'SEED', { lineId: 'B', sacks: 100, destination: 'PRM10' }),
    { ...row('P3', '2026-09-02 18:00', 'DAY', { shift: 'Night', saltBags: 4 }), date: '2026-09-02' },
    { ...row('P3', '2026-09-02 18:00', 'SEED', { lineId: 'C', sacks: 50 }), date: '2026-09-02' },
    { ...row('P4', '2026-09-03 18:00', 'SEED', { lineId: 'A', sacks: 20 }), date: '2026-09-03' }
  ]);
  const built = context.buildProductionFromApp(logs, '2026-09-01');
  const first = built.days[0];
  assert.equal(first.shift, 'Day and night');
  assert.equal(first.totalSacks, 300);
  assert.equal(first.totalTonnes, 6);
  assert.equal(first.regularTonnes, 1);
  assert.equal(first.riyadhTonnes, 3);
  assert.equal(first.tenKgTonnes, 2);
  assert.equal(first.prm10Tonnes, 2);
  assert.equal(first.wasteSacks, 300);
  assert.equal(built.seedUse.length, 5);
  assert.equal(context.buildProductionFromApp(logs, '2026-09-02').days.length, 2);

  const sheetDays = [
    { date: '2026-09-01', totalSacks: 300, saltBags: 10, riyadhTonnes: 3, tenKgTonnes: 2 },
    { date: '2026-09-02', totalSacks: 50, saltBags: 4, riyadhTonnes: null, tenKgTonnes: null },
    { date: '2026-09-03', totalSacks: 0, saltBags: null, riyadhTonnes: null, tenKgTonnes: null }
  ];
  const sheetSeedUse = [
    { date: '2026-09-01', lineId: 'A', sacks: 200 },
    { date: '2026-09-01', lineId: 'B', sacks: 100 },
    { date: '2026-09-02', lineId: 'D', sacks: 50 }
  ];
  const checks = context.compareProduction(sheetDays, sheetSeedUse, logs)
    .map((check) => `${check.date} ${check.result} ${check.lineDifferences}`);
  assert.deepEqual([...checks], [
    '2026-09-01 Match ',
    '2026-09-02 Different C: sheet 0, app 50; D: sheet 50, app 0',
    '2026-09-03 Not on production sheet A: sheet 0, app 20'
  ]);
});

function body(sheet) {
  return sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function productionSetup() {
  const store = new MockSpreadsheet([new MockSheet('14', [
    [''], ['ARS INTERNATIONAL CO SPC'], ['STORE UPDATE- COMPANY FINISHED GOODS'],
    ['Date', '9/14/2026'],
    ['No', 'Item Code', 'ITEM', 'Opening', 'Production', 'Despatch', 'Closing', 'Mini Level'],
    ['REGULAR SUNFLOWER SEEDS IN BUNDLES/BAGS/CARTON'],
    ['1', '4402', '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)', 100, 0, 0, 100, 800]
  ])]);
  const production = new MockSpreadsheet([
    new MockSheet('Dashboard', [['Summary'], ['a'], ['b'], ['c'], ['d', 'e', 'f', 'g', 'h']]),
    new MockSheet('AUGUST', AUGUST),
    new MockSheet('SEPTEMBER', SEPTEMBER)
  ]);
  const db = new MockSpreadsheet([]);
  const sync = loadStoreSync({ store, db, production });
  return { ...sync, db };
}

test('setup adds the production tabs and loads the sheet', () => {
  const { context, db, logs } = productionSetup();
  context.setupConsolidation();

  const lines = body(db.getSheetByName('Seed Lines')).map((row) => `${row[0]} | ${row[4]}`);
  assert.deepEqual(lines, [
    'T6-230-240 | T6 230-240',
    '361-190-200-ACME | 361 190-200 ACME',
    '361-269-270 | 361 269-270'
  ]);

  const days = body(db.getSheetByName('Production Days'));
  assert.deepEqual(days.map((row) => `${row[0]} ${row[1]} ${row[2]} ${row[3]}`), [
    '2026-08-01 Day 150 3',
    '2026-08-02 Day and night 200 4',
    '2026-08-03 No production 0 0',
    '2026-08-07 No production 40 0.8',
    '2026-09-01 Day and night 200 4',
    '2026-09-02 Night 50 1'
  ]);
  const first = days[0];
  assert.equal(first[5], 1); // Regular t = 3 - 2 Riyadh
  assert.equal(first[17], 2); // waste kg per sack
  assert.equal(first[18], 'Waste measured on T6 230-240');
  assert.equal(days[3][18], 'Friday');
  assert.equal(days[4][8], 1); // 10 kg Premium t
  assert.equal(days[5][14], 2); // OT hours

  const seedUse = body(db.getSheetByName('Seed Use')).map((row) => `${row[0]} ${row[1]} ${row[5]} ${row[6]}`);
  assert.deepEqual(seedUse, [
    '2026-08-01 T6-230-240 100 2',
    '2026-08-01 361-190-200-ACME 50 1',
    '2026-08-02 T6-230-240 200 4',
    '2026-08-07 361-190-200-ACME 40 0.8',
    '2026-09-01 361-269-270 100 2',
    '2026-09-01 361-190-200-ACME 100 2',
    '2026-09-02 361-269-270 50 1'
  ]);

  const issues = body(db.getSheetByName('Production Issues')).map((row) => `${row[0]} ${row[1]} ${row[4]}`);
  assert.deepEqual(issues, [
    '2026-08-02 AUGUST Not a number',
    '2026-08-02 AUGUST Total does not add up',
    '2026-08-07 AUGUST Seed column without a name',
    '2026-08-07 AUGUST Total does not add up',
    '2026-08-07 AUGUST Seed used on a day off',
    '2026-08-31 SEPTEMBER Day outside the month'
  ]);
  assert.ok(logs.some((line) => /^Production: 2 month tabs read, 6 days/.test(line)));
});

test('a mistyped column added later joins the right seed line', () => {
  const { context, db } = productionSetup();
  context.setupConsolidation();
  // Admin fixes the line by hand: 361-269-270 becomes 361-260-270
  const lines = db.getSheetByName('Seed Lines');
  lines.getRange(4, 1, 1, 7).setValues([['361-260-270', '361', '260-270', '', '361 260-270', 'YES', '']]);
  context.syncProduction();
  assert.equal(body(lines)[2][4], '361 260-270 | 361 269-270');
  assert.equal(body(lines).length, 3);
  const seedUse = body(db.getSheetByName('Seed Use')).map((row) => row[1]);
  assert.ok(seedUse.includes('361-260-270'));
  assert.ok(!seedUse.includes('361-269-270'));
});

test('app entries are checked against the sheet, then replace it after the switch', () => {
  const { context, db } = productionSetup();
  context.setupConsolidation();
  const log = db.getSheetByName('Production Log');
  const save = (saveId, date, rows) => rows.forEach((row) => {
    const values = [saveId, date, ...row];
    while (values.length < 15) values.push('');
    values.push('Tester', `${date} 18:00`);
    log.getRange(log.getLastRow() + 1, 1, 1, values.length).setValues([values]);
  });
  save('P1', '2026-09-01', [
    ['DAY', '', '', '', 'Day and night', 10],
    ['SEED', '361-269-270', 100, 'Regular'],
    ['SEED', '361-190-200-ACME', 50, '10 kg Premium'],
    ['SEED', '361-190-200-ACME', 50, 'Riyadh']
  ]);
  save('P2', '2026-09-03', [
    ['DAY', '', '', '', 'Day', 3],
    ['SEED', 'T6-230-240', 25, 'Regular']
  ]);
  context.syncProduction();
  const checks = body(db.getSheetByName('Production Check')).map((row) => `${row[0]} ${row[10]}`);
  assert.deepEqual(checks, ['2026-09-01 Match', '2026-09-03 Not on production sheet']);

  context.SYNC_CONFIG.PRODUCTION_APP_FROM = '2026-09-02';
  context.syncProduction();
  const days = body(db.getSheetByName('Production Days')).map((row) => `${row[0]} ${row[2]} ${row[19]}`);
  assert.deepEqual(days.slice(-3), ['2026-08-07 40 Sheet', '2026-09-01 200 Sheet', '2026-09-03 25 App']);
  const appUse = body(db.getSheetByName('Seed Use')).filter((row) => row[8] === 'App');
  assert.deepEqual(appUse.map((row) => `${row[1]} ${row[5]} ${row[7]}`), ['T6-230-240 25 Regular']);
  assert.deepEqual(body(db.getSheetByName('Production Check')).map((row) => row[0]), ['2026-09-01']);

  context.SYNC_CONFIG.PRODUCTION_APP_FROM = 'October';
  assert.throws(() => context.syncProduction(), /PRODUCTION_APP_FROM/);
});

test('the store sync leaves production alone until it is configured', () => {
  const store = new MockSpreadsheet([new MockSheet('14', [
    [''], ['ARS'], ['STORE UPDATE- COMPANY FINISHED GOODS'], ['Date', '9/14/2026'],
    ['No', 'Item Code', 'ITEM', 'Opening', 'Production', 'Despatch', 'Closing', 'Mini Level'],
    ['REGULAR SUNFLOWER SEEDS IN BUNDLES/BAGS/CARTON'],
    ['1', '4402', '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)', 100, 0, 0, 100, 800]
  ])]);
  const db = new MockSpreadsheet([]);
  const { context } = loadStoreSync({ store, db });
  context.setupConsolidation();
  assert.equal(db.getSheetByName('Seed Lines'), null);
  assert.throws(() => context.syncProduction(), /PRODUCTION_SPREADSHEET_ID/);
});
