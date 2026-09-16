/**
 * Packing material stock
 * Tabs the store sync keeps in the database (google-apps-script/StoreUpdateSync.js):
 *   Material Master    - rolls, covers, cartons and tape
 *   Material Stock     - balance, daily use and days left per material (recalculated hourly)
 *   Material Movements - deliveries and stock counts entered in the Packing app
 */

import { readSheetData, writeSheetData, appendSheetRows, parseSheetData } from './sheetsAPI';
import { toNumber, dateBlock, newEntryId, enteredAtText, isStoreSyncMissing } from './storeUpdate';

const MATERIALS_SHEET = 'Material Master';
const STOCK_SHEET = 'Material Stock';
const MOVEMENTS_SHEET = 'Material Movements';

export const MATERIAL_TYPES = { RECEIVED: 'RECEIVED', COUNT: 'COUNT' };
const CANCELLED = 'CANCELLED';

// Material Stock statuses that need someone to act
export const ATTENTION_STATUSES = ['Reorder now', 'Check count', 'No count'];

export { isStoreSyncMissing };

export async function loadMaterialMaster() {
  const rows = parseSheetData(await readSheetData(MATERIALS_SHEET, 'A1:M'));
  return rows
    .filter((row) => row['Material ID'])
    .map((row) => ({
      id: row['Material ID'],
      code: row['Code'],
      name: row['Material'],
      size: row['Size'],
      category: row['Category'] || 'Other',
      unit: row['Count Unit'] || 'Unit',
      active: String(row['Active']).trim().toUpperCase() !== 'NO'
    }));
}

export async function loadMaterialStock() {
  const rows = parseSheetData(await readSheetData(STOCK_SHEET, 'A1:R'));
  return rows
    .filter((row) => row['Material ID'])
    .map((row) => ({
      id: row['Material ID'],
      code: row['Code'],
      name: row['Material'],
      category: row['Category'] || 'Other',
      unit: row['Unit'] || 'Unit',
      usageFrom: row['Usage From'],
      countDate: row['Count Date'],
      counted: toNumber(row['Counted']),
      receivedSince: toNumber(row['Received Since']),
      usedSince: toNumber(row['Used Since']),
      balance: toNumber(row['Balance']),
      used30: toNumber(row['Used (30 days)']),
      avgDaily: toNumber(row['Avg Daily Use']),
      daysLeft: toNumber(row['Days Left']),
      status: row['Status'],
      expected30: toNumber(row['Expected Use (30 days)']),
      lastUsed: row['Last Used'],
      updatedAt: row['Updated At']
    }));
}

function movementFromValues(values) {
  const text = (index) => (values[index] === undefined ? '' : String(values[index]));
  return {
    entryId: text(0),
    date: text(1),
    type: text(2),
    materialId: text(3),
    name: text(4),
    qty: toNumber(values[5]) || 0,
    unit: text(6),
    reference: text(7),
    note: text(8),
    enteredBy: text(9),
    enteredAt: text(10),
    cancelled: text(11).toUpperCase() === CANCELLED
  };
}

/**
 * Deliveries and counts for one day (needs sign-in).
 */
export async function loadMaterialMovements(date, accessToken) {
  const dateColumn = (await readSheetData(MOVEMENTS_SHEET, 'B2:B', accessToken)).map((row) => row[0] || '');
  const block = dateBlock(dateColumn, date);
  if (!block) return [];

  const values = await readSheetData(MOVEMENTS_SHEET, `A${block.firstRow}:L${block.lastRow}`, accessToken);
  return values.map(movementFromValues).filter((movement) => movement.date === date);
}

/**
 * Save one row per material.
 * @param {Object} entry - { type, date, reference, note, enteredBy }
 * @param {Array<{material: Object, qty: number}>} lines - Material Master entries with quantities
 */
export async function addMaterialMovements(entry, lines, accessToken) {
  const now = new Date();
  const enteredAt = enteredAtText(now);
  const prefix = entry.type === MATERIAL_TYPES.COUNT ? 'MC' : 'MR';
  const rows = lines.map(({ material, qty }) => [
    newEntryId(prefix, now),
    entry.date,
    entry.type,
    material.id,
    material.name,
    qty,
    material.unit,
    entry.reference || '',
    entry.note || '',
    entry.enteredBy,
    enteredAt,
    'ACTIVE'
  ]);
  await appendSheetRows(MOVEMENTS_SHEET, rows, accessToken);
  return rows.length;
}

export async function cancelMaterialMovement(entryId, accessToken) {
  const ids = (await readSheetData(MOVEMENTS_SHEET, 'A2:A', accessToken)).map((row) => row[0]);
  const index = ids.indexOf(entryId);
  if (index === -1) {
    throw new Error('Entry not found - refresh and try again.');
  }
  await writeSheetData(MOVEMENTS_SHEET, `L${index + 2}`, [[CANCELLED]], accessToken);
}

/**
 * Categories in the order they first appear in the list.
 */
export function categoriesOf(materials) {
  return [...new Set(materials.map((material) => material.category))];
}
