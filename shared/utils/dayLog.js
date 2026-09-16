/**
 * Day Log: absentees, machine times and who worked on each machine, per day.
 * Tabs kept by the store sync (google-apps-script/StoreUpdateSync.js): Staff, Machines, Day Log.
 * Each save appends a full snapshot of the day under a new Save ID; the latest save wins.
 */

import { readSheetData, appendSheetRows, parseSheetData } from './sheetsAPI';
import { dateBlock, newEntryId, enteredAtText } from './storeUpdate';

const STAFF_SHEET = 'Staff';
const MACHINES_SHEET = 'Machines';
const DAY_LOG_SHEET = 'Day Log';

const isYes = (value) => String(value || '').trim().toUpperCase() === 'YES';
const splitList = (text) => String(text || '').split(',').map((part) => part.trim()).filter(Boolean);

export async function loadStaff() {
  const rows = parseSheetData(await readSheetData(STAFF_SHEET, 'A1:D'));
  return rows
    .filter((row) => row['Name'])
    .map((row) => ({
      name: row['Name'].trim(),
      type: String(row['Type']).trim().toUpperCase() === 'S' ? 'S' : 'O',
      active: String(row['Active']).trim().toUpperCase() !== 'NO'
    }));
}

export async function loadMachines() {
  const rows = parseSheetData(await readSheetData(MACHINES_SHEET, 'A1:D'));
  return rows
    .filter((row) => row['Machine'])
    .map((row) => ({
      machine: row['Machine'].trim(),
      codes: splitList(row['Item Codes']),
      active: String(row['Active']).trim().toUpperCase() !== 'NO'
    }));
}

/**
 * Staff and machines to show for a day: the active ones, plus any in that day's saved log,
 * so marking someone or something inactive later doesn't hide it from past days.
 */
export function listsForDay(staff, machines, log) {
  const loggedMachines = new Set((log?.machines || []).map((m) => m.machine));
  return {
    staff: staff.filter((person) => person.active || Boolean(log?.staff[person.name])),
    machines: machines.filter((m) => m.active || loggedMachines.has(m.machine))
  };
}

/**
 * The latest saved log for a day, or null.
 * @returns {Promise<?{saveId, absentees, holiday, machines, staff, enteredBy, enteredAt}>}
 *          machines: [{machine, start, end, workers}], staff: {name: {absent, reason}}
 */
export async function loadDayLog(date, accessToken = null) {
  const dateColumn = (await readSheetData(DAY_LOG_SHEET, 'B2:B', accessToken)).map((row) => row[0] || '');
  const block = dateBlock(dateColumn, date);
  if (!block) return null;

  const rows = (await readSheetData(DAY_LOG_SHEET, `A${block.firstRow}:L${block.lastRow}`, accessToken))
    .filter((row) => row[1] === date);
  const stampOf = (row) => `${row[11] || ''}|${row[0] || ''}`;
  const latest = rows.reduce((best, row) => (stampOf(row) > best ? stampOf(row) : best), '');
  const snapshot = rows.filter((row) => stampOf(row) === latest);
  if (snapshot.length === 0) return null;

  const log = {
    saveId: snapshot[0][0],
    absentees: '',
    holiday: false,
    machines: [],
    staff: {},
    enteredBy: snapshot[0][10] || '',
    enteredAt: snapshot[0][11] || ''
  };
  snapshot.forEach((row) => {
    const [, , kind, name = '', start = '', end = '', workers = '', absent = '', reason = ''] = row;
    if (kind === 'DAY') {
      log.absentees = reason;
      log.holiday = String(absent).toUpperCase() === 'HOLIDAY';
    } else if (kind === 'MACHINE') {
      log.machines.push({ machine: name, start, end, workers: splitList(workers) });
    } else if (kind === 'STAFF') {
      log.staff[name] = { absent: isYes(absent), reason };
    }
  });
  return log;
}

/**
 * Save the whole day as a new snapshot.
 * @param {Object} log - { date, absentees, holiday, note, enteredBy, machines, staff }
 */
export async function saveDayLog(log, accessToken) {
  const now = new Date();
  const saveId = newEntryId('DL', now);
  const enteredAt = enteredAtText(now);
  const base = (kind, name, fields) => [
    saveId, log.date, kind, name,
    fields.start || '', fields.end || '', fields.workers || '',
    fields.absent || '', fields.reason || '', fields.note || '',
    log.enteredBy, enteredAt
  ];

  const rows = [
    base('DAY', '', { absent: log.holiday ? 'HOLIDAY' : '', reason: log.absentees, note: log.note }),
    ...log.machines.map((machine) => base('MACHINE', machine.machine, {
      start: machine.start,
      end: machine.end,
      workers: machine.workers.join(', ')
    })),
    ...Object.entries(log.staff).map(([name, day]) => base('STAFF', name, {
      absent: day.absent ? 'YES' : 'NO',
      reason: day.reason
    }))
  ];
  await appendSheetRows(DAY_LOG_SHEET, rows, accessToken);
  return { saveId, enteredAt };
}
