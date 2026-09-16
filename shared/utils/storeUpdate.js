/**
 * Store Update data
 * Tabs the store sync keeps in the database (google-apps-script/StoreUpdateSync.js):
 *   Item Master     - one row per item, store codes
 *   FG Daily        - one row per item per day from "Packing and dispach 2026"
 *   Store Movements - packed / despatched entries made in the Packing app
 *   Parallel Check  - Store Movements compared with FG Daily during the trial
 */

import { readSheetData, writeSheetData, appendSheetRows, parseSheetData } from './sheetsAPI';
import { getLocalDateString } from './dateUtils';

const ITEMS_SHEET = 'Item Master';
const DAILY_SHEET = 'FG Daily';
const MOVEMENTS_SHEET = 'Store Movements';
const PARALLEL_SHEET = 'Parallel Check';

export const MOVEMENT_TYPES = { PACKED: 'PACKED', DESPATCHED: 'DESPATCHED' };
const CANCELLED = 'CANCELLED';

// Same keys and order as STORE_GROUPS in google-apps-script/StoreUpdateParser.js
export const STORE_GROUPS = [
  { key: 'REG', name: 'Regular sunflower' },
  { key: 'RUH', name: 'Riyadh sunflower' },
  { key: 'QAT', name: 'Qatar sunflower' },
  { key: 'BAH', name: 'Bahrain sunflower' },
  { key: 'MP', name: 'Melon & pumpkin' },
  { key: 'POP', name: 'Popcorn' },
  { key: 'CC', name: 'Cotton candy' }
];

export function groupName(key) {
  return STORE_GROUPS.find((group) => group.key === key)?.name || key || 'Other';
}

function toNumber(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const number = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(number) ? null : number;
}

/**
 * The sync tabs don't exist until setupConsolidation has run; the Sheets API
 * answers a missing tab with 400.
 */
export function isStoreSyncMissing(error) {
  return /status: 400/.test(error?.message || '');
}

export async function loadItemMaster() {
  const rows = parseSheetData(await readSheetData(ITEMS_SHEET, 'A1:P'));
  return rows
    .filter((row) => row['Item Key'])
    .map((row) => ({
      key: row['Item Key'],
      code: row['Code'],
      variant: row['Variant'],
      group: row['Group'],
      name: row['Item'],
      product: row['Product'],
      packSize: row['Pack Size'],
      packUnit: row['Pack Unit'],
      packContents: row['Pack Contents'],
      kgPerUnit: toNumber(row['Kg per Unit']),
      bulkGroup: row['Bulk Alert Group'],
      packingMinutes: toNumber(row['Packing Minutes per Unit']),
      active: String(row['Active']).trim().toUpperCase() !== 'NO'
    }));
}

function dailyRowFromValues(values) {
  const text = (index) => (values[index] === undefined ? '' : String(values[index]));
  return {
    date: text(0),
    itemKey: text(1),
    code: text(2),
    group: text(3),
    name: text(4),
    opening: toNumber(values[5]),
    production: toNumber(values[6]),
    despatch: toNumber(values[7]),
    closing: toNumber(values[8]),
    minLevel: toNumber(values[9]),
    suggestedMin: toNumber(values[10]),
    requiredQty: toNumber(values[11]),
    specificOrder: toNumber(values[12]),
    deliverBy: text(13),
    orderStatus: text(14),
    absentees: text(15),
    sourceRow: toNumber(values[17]),
    syncedAt: text(18)
  };
}

/**
 * Rows for one day (default: the latest synced day).
 * FG Daily is sorted by date, so only that day's block of rows is fetched.
 * @returns {Promise<{date: ?string, dates: string[], rows: Object[]}>} dates newest first
 */
export async function loadStoreDay(date = null) {
  const dateColumn = (await readSheetData(DAILY_SHEET, 'A2:A')).map((row) => row[0] || '');
  const dates = [...new Set(dateColumn.filter(Boolean))].sort().reverse();
  const day = date && dates.includes(date) ? date : dates[0];
  if (!day) {
    return { date: null, dates, rows: [] };
  }

  const { firstRow, lastRow } = dateBlock(dateColumn, day);
  const values = await readSheetData(DAILY_SHEET, `A${firstRow}:S${lastRow}`);
  return {
    date: day,
    dates,
    rows: values.map(dailyRowFromValues).filter((row) => row.date === day)
  };
}

/**
 * Stock position of one day's row against its minimum level.
 * @returns {'out'|'critical'|'low'|'ok'|'no-min'}
 */
export function stockStatus(row) {
  const closing = row.closing || 0;
  if (!row.minLevel) return 'no-min';
  if (closing <= 0) return 'out';
  if (closing < row.minLevel * 0.5) return 'critical';
  if (closing < row.minLevel) return 'low';
  return 'ok';
}

export function shortage(row) {
  return row.minLevel ? Math.max(0, row.minLevel - (row.closing || 0)) : 0;
}

/**
 * Row numbers (1-based) of a date's block in a tab whose date column is given.
 * Returns null when the date isn't there.
 */
function dateBlock(dateColumn, date) {
  const first = dateColumn.indexOf(date);
  if (first === -1) return null;
  return { firstRow: first + 2, lastRow: dateColumn.lastIndexOf(date) + 2 };
}

function movementFromValues(values) {
  const text = (index) => (values[index] === undefined ? '' : String(values[index]));
  return {
    entryId: text(0),
    date: text(1),
    type: text(2),
    itemKey: text(3),
    code: text(4),
    group: text(5),
    name: text(6),
    units: toNumber(values[7]) || 0,
    reference: text(8),
    note: text(9),
    enteredBy: text(10),
    enteredAt: text(11),
    cancelled: text(12).toUpperCase() === CANCELLED
  };
}

/**
 * Packed / despatched entries for one day (needs sign-in).
 */
export async function loadStoreMovements(date, accessToken) {
  const dateColumn = (await readSheetData(MOVEMENTS_SHEET, 'B2:B', accessToken)).map((row) => row[0] || '');
  const block = dateBlock(dateColumn, date);
  if (!block) return [];

  const values = await readSheetData(MOVEMENTS_SHEET, `A${block.firstRow}:M${block.lastRow}`, accessToken);
  return values.map(movementFromValues).filter((movement) => movement.date === date);
}

function newEntryId(type, now) {
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(2, 14);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${type === MOVEMENT_TYPES.PACKED ? 'PK' : 'DS'}-${stamp}-${suffix}`;
}

/**
 * Save one entry per item.
 * @param {Object} entry - { type, date, reference, note, enteredBy }
 * @param {Array<{item: Object, units: number}>} lines - Item Master items with units
 */
export async function addStoreMovements(entry, lines, accessToken) {
  const now = new Date();
  const enteredAt = `${getLocalDateString(now)} ${now.toTimeString().slice(0, 5)}`;
  const rows = lines.map(({ item, units }) => [
    newEntryId(entry.type, now),
    entry.date,
    entry.type,
    item.key,
    item.code,
    item.group,
    item.name,
    units,
    entry.reference || '',
    entry.note || '',
    entry.enteredBy,
    enteredAt,
    'ACTIVE'
  ]);
  await appendSheetRows(MOVEMENTS_SHEET, rows, accessToken);
  return rows.length;
}

/**
 * Mark an entry as cancelled (the row stays for the record).
 */
export async function cancelStoreMovement(entryId, accessToken) {
  const ids = (await readSheetData(MOVEMENTS_SHEET, 'A2:A', accessToken)).map((row) => row[0]);
  const index = ids.indexOf(entryId);
  if (index === -1) {
    throw new Error('Entry not found - refresh and try again.');
  }
  await writeSheetData(MOVEMENTS_SHEET, `M${index + 2}`, [[CANCELLED]], accessToken);
}

/**
 * App entries vs store sheet for one day. Empty when the day has no app entries
 * or the Parallel Check tab doesn't exist yet.
 */
export async function loadParallelCheck(date) {
  let dateColumn;
  try {
    dateColumn = (await readSheetData(PARALLEL_SHEET, 'A2:A')).map((row) => row[0] || '');
  } catch (error) {
    if (isStoreSyncMissing(error)) return [];
    throw error;
  }
  const block = dateBlock(dateColumn, date);
  if (!block) return [];

  const values = await readSheetData(PARALLEL_SHEET, `A${block.firstRow}:J${block.lastRow}`);
  return values
    .filter((row) => row[0] === date)
    .map((row) => ({
      date: row[0],
      itemKey: row[1] || '',
      code: row[2] || '',
      group: row[3] || '',
      name: row[4] || '',
      sheetPacked: toNumber(row[5]) || 0,
      appPacked: toNumber(row[6]) || 0,
      sheetDespatched: toNumber(row[7]) || 0,
      appDespatched: toNumber(row[8]) || 0,
      result: row[9] || ''
    }));
}
