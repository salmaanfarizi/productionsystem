/**
 * Daily production log: raw seed used per seed line, salt, diesel, waste water, overtime, waste.
 * Tabs kept by the production sync (google-apps-script/ProductionSync.js):
 *   Seed Lines        - seed type / size / supplier
 *   Production Log    - saves from the Production app (the latest save of a day wins)
 *   Production Days   - one row per day, from the production sheet or the app
 *   Seed Use          - one row per day per seed line
 *   Production Check  - app entries compared with the production sheet (trial)
 */

import { readSheetData, appendSheetRows, parseSheetData } from './sheetsAPI';
import { toNumber, dateBlock, newEntryId, enteredAtText } from './storeUpdate';

const LINES_SHEET = 'Seed Lines';
const LOG_SHEET = 'Production Log';
const DAYS_SHEET = 'Production Days';
const SEED_USE_SHEET = 'Seed Use';
const CHECK_SHEET = 'Production Check';

export const SACK_KG = 20;
export const SALT_BAG_KG = 50;

// Same keys and names as PRODUCTION_DESTINATIONS in google-apps-script/ProductionParser.js
export const DESTINATIONS = [
  { key: 'REGULAR', name: 'Regular' },
  { key: 'RIYADH', name: 'Riyadh' },
  { key: 'PRM10', name: '10 kg Premium' },
  { key: 'STD10', name: '10 kg Standard' },
  { key: 'ECO10', name: '10 kg Eco' }
];

export const SHIFTS = ['Day', 'Night', 'Day and night', 'No production'];
export const NO_PRODUCTION = 'No production';
export const NO_PRODUCTION_REASONS = ['Friday', 'Eid / holiday', 'Maintenance', 'No raw seed', 'Other'];

export function destinationName(key) {
  return DESTINATIONS.find((d) => d.key === key)?.name || 'Regular';
}

function destinationKey(text) {
  const upper = String(text || '').trim().toUpperCase();
  return DESTINATIONS.find((d) => d.key === upper || d.name.toUpperCase() === upper)?.key || 'REGULAR';
}

export function sacksToTonnes(sacks) {
  return Math.round((sacks || 0) * SACK_KG) / 1000;
}

export async function loadSeedLines() {
  const rows = parseSheetData(await readSheetData(LINES_SHEET, 'A1:G'));
  return rows
    .filter((row) => row['Line ID'])
    .map((row) => {
      const id = row['Line ID'].trim();
      const label = [row['Seed'], row['Size'], row['Supplier']].map((part) => String(part || '').trim()).filter(Boolean).join(' ');
      return {
        id,
        seed: row['Seed'] || '',
        size: row['Size'] || '',
        supplier: row['Supplier'] || '',
        label: label || id,
        active: String(row['Active']).trim().toUpperCase() !== 'NO'
      };
    });
}

/**
 * The latest saved log for a day, or null.
 * @returns {Promise<?Object>} {saveId, shift, saltBags, dieselLitres, wwBig, wwSmall, otHours,
 *          wasteKg, wasteSacks, note, seeds: [{lineId, sacks, destination}], enteredBy, enteredAt}
 */
export async function loadProductionLog(date, accessToken = null) {
  const dateColumn = (await readSheetData(LOG_SHEET, 'B2:B', accessToken)).map((row) => row[0] || '');
  const block = dateBlock(dateColumn, date);
  if (!block) return null;

  const rows = (await readSheetData(LOG_SHEET, `A${block.firstRow}:Q${block.lastRow}`, accessToken))
    .filter((row) => row[1] === date);
  const stampOf = (row) => `${row[16] || ''}|${row[0] || ''}`;
  const latest = rows.reduce((best, row) => (stampOf(row) > best ? stampOf(row) : best), '');
  const snapshot = rows.filter((row) => stampOf(row) === latest);
  if (snapshot.length === 0) return null;

  const log = {
    saveId: snapshot[0][0],
    shift: '',
    saltBags: null,
    dieselLitres: null,
    wwBig: null,
    wwSmall: null,
    otHours: null,
    wasteKg: null,
    wasteSacks: null,
    note: '',
    seeds: [],
    enteredBy: snapshot[0][15] || '',
    enteredAt: snapshot[0][16] || ''
  };
  snapshot.forEach((row) => {
    const kind = String(row[2] || '').toUpperCase();
    if (kind === 'DAY') {
      log.shift = row[6] || '';
      log.saltBags = toNumber(row[7]);
      log.dieselLitres = toNumber(row[8]);
      log.wwBig = toNumber(row[9]);
      log.wwSmall = toNumber(row[10]);
      log.otHours = toNumber(row[11]);
      log.wasteKg = toNumber(row[12]);
      log.wasteSacks = toNumber(row[13]);
      log.note = row[14] || '';
    } else if (kind === 'SEED' && row[3] && toNumber(row[4])) {
      log.seeds.push({ lineId: row[3], sacks: toNumber(row[4]), destination: destinationKey(row[5]) });
    }
  });
  return log;
}

/**
 * The latest saved log before a day (to reuse its seed lines), or null.
 */
export async function loadPreviousProductionLog(date, accessToken = null) {
  const dates = (await readSheetData(LOG_SHEET, 'B2:B', accessToken)).map((row) => row[0] || '');
  const previous = dates.filter((d) => d && d < date).sort().pop();
  return previous ? { date: previous, log: await loadProductionLog(previous, accessToken) } : null;
}

/**
 * Save the whole day as a new snapshot.
 * @param {Object} log - { date, shift, saltBags, dieselLitres, wwBig, wwSmall, otHours, wasteKg,
 *        wasteSacks, note, enteredBy, seeds: [{lineId, sacks, destination}] }
 */
export async function saveProductionLog(log, accessToken) {
  const now = new Date();
  const saveId = newEntryId('PL', now);
  const enteredAt = enteredAtText(now);
  const blank = (value) => (value === null || value === undefined ? '' : value);
  const rows = [
    [
      saveId, log.date, 'DAY', '', '', '', log.shift, blank(log.saltBags), blank(log.dieselLitres),
      blank(log.wwBig), blank(log.wwSmall), blank(log.otHours), blank(log.wasteKg), blank(log.wasteSacks),
      log.note || '', log.enteredBy, enteredAt
    ],
    ...log.seeds.map((seed) => [
      saveId, log.date, 'SEED', seed.lineId, seed.sacks, destinationName(seed.destination),
      '', '', '', '', '', '', '', '', '', log.enteredBy, enteredAt
    ])
  ];
  await appendSheetRows(LOG_SHEET, rows, accessToken);
  return { saveId, enteredAt };
}

function monthBlock(dateColumn, month) {
  const first = dateColumn.findIndex((date) => date.startsWith(month));
  if (first === -1) return null;
  let last = first;
  dateColumn.forEach((date, index) => {
    if (date.startsWith(month)) last = index;
  });
  return { firstRow: first + 2, lastRow: last + 2 };
}

async function readMonth(sheet, lastColumn, month) {
  const dateColumn = (await readSheetData(sheet, 'A2:A')).map((row) => row[0] || '');
  const months = [...new Set(dateColumn.filter(Boolean).map((date) => date.slice(0, 7)))].sort().reverse();
  // No month given: the latest one. A month without rows gives no rows.
  const chosen = month ? (months.includes(month) ? month : null) : months[0];
  if (!chosen) return { month: month || null, months, rows: [] };
  const block = monthBlock(dateColumn, chosen);
  const values = await readSheetData(sheet, `A${block.firstRow}:${lastColumn}${block.lastRow}`);
  return { month: chosen, months, rows: values.filter((row) => String(row[0] || '').startsWith(chosen)) };
}

/**
 * Production Days rows of one month (default: the latest month).
 * @returns {Promise<{month: ?string, months: string[], days: Object[]}>} months newest first
 */
export async function loadProductionMonth(month = null) {
  const { month: chosen, months, rows } = await readMonth(DAYS_SHEET, 'W', month);
  const number = (row, index) => toNumber(row[index]);
  return {
    month: chosen,
    months,
    days: rows.map((row) => ({
      date: row[0],
      shift: row[1] || '',
      sacks: number(row, 2) || 0,
      tonnes: number(row, 3) || 0,
      saltBags: number(row, 4),
      regularTonnes: number(row, 5),
      riyadhTonnes: number(row, 6),
      tenKgTonnes: number(row, 7),
      prm10Tonnes: number(row, 8),
      std10Tonnes: number(row, 9),
      eco10Tonnes: number(row, 10),
      dieselLitres: number(row, 11),
      wwBig: number(row, 12),
      wwSmall: number(row, 13),
      otHours: number(row, 14),
      wasteKg: number(row, 15),
      wasteSacks: number(row, 16),
      wastePerSack: number(row, 17),
      note: row[18] || '',
      source: row[19] || '',
      syncedAt: row[22] || ''
    }))
  };
}

/**
 * Seed Use rows of one month.
 */
export async function loadSeedUseMonth(month) {
  const { rows } = await readMonth(SEED_USE_SHEET, 'L', month);
  return rows.map((row) => ({
    date: row[0],
    lineId: row[1] || '',
    label: [row[2], row[3], row[4]].map((part) => String(part || '').trim()).filter(Boolean).join(' ') || row[1],
    sacks: toNumber(row[5]) || 0,
    tonnes: toNumber(row[6]) || 0,
    destination: row[7] || '',
    source: row[8] || ''
  }));
}

/**
 * App entries vs production sheet, all trial days.
 */
export async function loadProductionCheck() {
  const rows = parseSheetData(await readSheetData(CHECK_SHEET, 'A1:K'));
  return rows
    .filter((row) => row['Date'])
    .map((row) => ({
      date: row['Date'],
      sheetSacks: toNumber(row['Sheet Sacks']),
      appSacks: toNumber(row['App Sacks']),
      sheetSalt: toNumber(row['Sheet Salt']),
      appSalt: toNumber(row['App Salt']),
      sheetRiyadh: toNumber(row['Sheet Riyadh t']),
      appRiyadh: toNumber(row['App Riyadh t']),
      sheetTenKg: toNumber(row['Sheet 10 kg t']),
      appTenKg: toNumber(row['App 10 kg t']),
      differences: row['Seed Differences'] || '',
      result: row['Result'] || ''
    }));
}
