// Run with: npm run test:apps-script
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStoreSync, MockSheet, MockSpreadsheet } from './appsScriptMock.mjs';

const BUNDLE = '200 Grams Sunflower Seeds Bundles(10 Pieces x 5 Bags)';

function storeTab(date, staffRows) {
  return [
    [''],
    ['ARS INTERNATIONAL CO SPC'],
    ['STORE UPDATE- COMPANY FINISHED GOODS'],
    ['Date', date, 'Company', '', '', '', 'No. of Absentees', '', '1S'],
    ['No', 'Item Code', 'ITEM', 'Opening', 'Production', 'Despatch', 'Closing', 'Mini Level'],
    ['REGULAR SUNFLOWER SEEDS IN BUNDLES/BAGS/CARTON'],
    ['1', '4402', BUNDLE, 100, 0, 0, 100, 800],
    [''],
    ['MACHINE WORK LOG — machine times'],
    ['MACHINE', '', '', 'Units today', 'Start (24h)', 'End (24h)', 'Hours'],
    ['200 gm', '', '', 10, '07:30', '', ''],
    [''],
    ['EMPLOYEE  (tick the machines worked on)', '', '', '200 gm', 'Machine Hrs', 'Standard'],
    ...staffRows.map((name) => [name, '', '', 'FALSE', '', '9.00']),
    ['TOTAL  (people per machine → day man-hours)', '', '', '0', '', '17.00']
  ];
}

// Names here are made up
const OLD_TAB = storeTab('9/13/2026', ['Old Person  (O)']);
const NEW_TAB = storeTab('9/14/2026', ['Test One  (O)', 'Test Two  (S)']);

function setup() {
  const store = new MockSpreadsheet([new MockSheet('14', NEW_TAB), new MockSheet('13', OLD_TAB)]);
  const db = new MockSpreadsheet([]);
  const sync = loadStoreSync({ store, db });
  return { ...sync, db };
}

function body(sheet) {
  return sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

test('reads staff names and types from the EMPLOYEE grid', () => {
  const { context } = setup();
  const staff = context.parseStaffList(NEW_TAB).map((person) => `${person.name}/${person.type}`);
  assert.deepEqual([...staff], ['Test One/O', 'Test Two/S']);
  assert.equal(context.parseStaffList([['No staff here']]).length, 0);
});

test('setup adds machines and the staff of the latest store tab', () => {
  const { context, db } = setup();
  context.setupConsolidation();
  assert.deepEqual(body(db.getSheetByName('Staff')).map((row) => `${row[0]} ${row[1]} ${row[2]}`),
    ['Test One O YES', 'Test Two S YES']);
  assert.equal(body(db.getSheetByName('Machines')).length, context.MACHINE_SEED.length);
  assert.ok(db.getSheetByName('Day Log'));
  assert.ok(db.getSheetByName('Store Orders'));

  // Running setup again keeps an edited staff list
  const staff = db.getSheetByName('Staff');
  staff.getRange(2, 3, 1, 1).setValues([['NO']]);
  context.setupConsolidation();
  assert.equal(body(staff).length, 2);
  assert.equal(body(staff)[0][2], 'NO');
});

test('the latest Day Log save for a date wins', () => {
  const { context } = setup();
  const row = (saveId, enteredAt, kind, name, extra = {}) => ({
    saveId, date: '2026-09-15', kind, name, start: '', end: '', workers: '', absent: '', reason: '', enteredAt, ...extra
  });
  const days = context.latestDayLogs([
    row('S1', '2026-09-15 10:00', 'DAY', '', { reason: '1S' }),
    row('S1', '2026-09-15 10:00', 'MACHINE', '200 gm', { start: '07:30', end: '12:00', workers: 'A, B' }),
    row('S2', '2026-09-15 16:00', 'DAY', '', { reason: '2S 1O' }),
    row('S2', '2026-09-15 16:00', 'MACHINE', '200 gm', { start: '07:30', end: '16:00', workers: 'A' }),
    row('S2', '2026-09-15 16:00', 'STAFF', 'B', { absent: 'YES' }),
    { ...row('S3', '2026-09-16 09:00', 'DAY', '', { absent: 'HOLIDAY' }), date: '2026-09-16' }
  ]);
  const day = days['2026-09-15'];
  assert.equal(day.absentees, '2S 1O');
  assert.equal(day.machines.length, 1);
  assert.deepEqual([...day.machines[0].workers], ['A']);
  assert.equal(day.staff[0].absent, true);
  assert.equal(days['2026-09-16'].holiday, true);
});

test('orders show as pending until met, and as met on that day', () => {
  const { context } = setup();
  const orders = [
    { itemKey: 'X', enteredOn: '2026-09-08', qty: 100, deliverBy: '2026-09-12', status: 'MET', statusDate: '2026-09-10' },
    { itemKey: 'X', enteredOn: '2026-09-09', qty: 20, deliverBy: '2026-09-11', status: 'PENDING', statusDate: '' },
    { itemKey: 'Y', enteredOn: '2026-09-09', qty: 5, deliverBy: '', status: 'CANCELLED', statusDate: '2026-09-10' }
  ];
  const on = (day) => {
    const result = context.ordersOnDay(orders, day);
    return Object.keys(result).sort().map((key) => `${key}:${result[key].qty}:${result[key].deliverBy}:${result[key].status}`).join(' ');
  };
  assert.equal(on('2026-09-07'), '');
  assert.equal(on('2026-09-08'), 'X:100:2026-09-12:PENDING');
  assert.equal(on('2026-09-09'), 'X:120:2026-09-11:PENDING Y:5::PENDING');
  assert.equal(on('2026-09-10'), 'X:120:2026-09-11:PENDING');
  assert.equal(on('2026-09-11'), 'X:20:2026-09-11:PENDING');
});

test('app-built store days carry orders and absentees', () => {
  const { context } = setup();
  const rows = context.buildStoreRowsFromApp({
    itemMaster: [{ key: '4402-REG', code: '4402', group: 'REG', name: '200 g', active: 'YES', minLevel: '' }],
    movements: [],
    sheetRows: [{ date: '2026-09-14', itemKey: '4402-REG', closing: 100, minLevel: 800, despatch: 0 }],
    fromDate: '2026-09-15',
    toDate: '2026-09-18',
    skipFridays: true,
    orders: [{ itemKey: '4402-REG', enteredOn: '2026-09-15', qty: 50, deliverBy: '2026-09-20', status: 'MET', statusDate: '2026-09-16' }],
    dayLogs: {
      '2026-09-15': { absentees: '2S', holiday: false },
      '2026-09-18': { absentees: '', holiday: true }
    }
  });
  const summary = rows.map((row) => `${row.date} ${row.specificOrder} ${row.deliverBy} ${row.orderStatus} ${row.absentees}`);
  // 18 Sep is a Friday, kept because it has a Day Log
  assert.deepEqual([...summary], [
    '2026-09-15 50 2026-09-20 PENDING 2S',
    '2026-09-16 50 2026-09-20 MET ',
    '2026-09-17 null   ',
    '2026-09-18 null   HOLIDAY'
  ]);
});
