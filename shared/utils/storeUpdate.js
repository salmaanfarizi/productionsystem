/**
 * Store Update data
 * Read-only access to the tabs the store sync keeps in the database
 * (google-apps-script/StoreUpdateSync.js): Item Master and FG Daily.
 * FG Daily holds one row per item per day from "Packing and dispach 2026".
 */

import { readSheetData, parseSheetData } from './sheetsAPI';

const ITEMS_SHEET = 'Item Master';
const DAILY_SHEET = 'FG Daily';

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

  const firstRow = dateColumn.indexOf(day) + 2;
  const lastRow = dateColumn.lastIndexOf(day) + 2;
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
