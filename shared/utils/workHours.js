/**
 * Work hours rules from the daily store sheet's machine work log:
 *   Saudi (S) staff: 8 h - 07:30 to 16:00, break 12:30-13:00 (Saturday 4 h)
 *   Other (O) staff: 9 h - 07:30 to 12:30 + 13:00 to 17:00, then 1 h cleaning
 * Plain JavaScript with no imports, so it can be tested with Node.
 */

export const STAFF_TYPES = {
  S: { label: 'Saudi', standardHours: 8, saturdayHours: 4 },
  O: { label: 'Other', standardHours: 9, saturdayHours: 9 }
};

export const BREAK_START = '12:30';
export const BREAK_END = '13:00';

export const BALANCE_REASONS = [
  'Maintenance / Breakdown',
  'Cleaning',
  'Loading / Unloading',
  'Other work',
  'No production'
];

function toMinutes(time) {
  const match = String(time || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function isValidTime(time) {
  return toMinutes(time) !== null;
}

/**
 * Hours between start and end (24 h "HH:MM"), without the lunch break.
 * Returns null when a time is missing or the end is not after the start.
 */
export function machineHours(start, end) {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === null || to === null || to <= from) return null;
  const breakFrom = toMinutes(BREAK_START);
  const breakTo = toMinutes(BREAK_END);
  const overlap = Math.max(0, Math.min(to, breakTo) - Math.max(from, breakFrom));
  return Math.round(((to - from - overlap) / 60) * 100) / 100;
}

export function standardHours(type, isoDate) {
  const rules = STAFF_TYPES[type] || STAFF_TYPES.O;
  const [year, month, day] = isoDate.split('-').map(Number);
  const saturday = new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 6;
  return saturday ? rules.saturdayHours : rules.standardHours;
}

/**
 * Absentee text as written on the store sheet, e.g. "2S 1O" (empty when nobody is absent).
 */
export function absenteeText(staff, absentNames) {
  const absent = new Set(absentNames);
  const count = (type) => staff.filter((person) => person.type === type && absent.has(person.name)).length;
  return ['S', 'O']
    .map((type) => (count(type) ? `${count(type)}${type}` : ''))
    .filter(Boolean)
    .join(' ');
}

/**
 * Hours per person for one day.
 * @param {string} isoDate
 * @param {Array<{name, type}>} staff
 * @param {Array<{machine, start, end, workers: string[]}>} machines
 * @param {Object<string, {absent: boolean, reason: string}>} staffDay - by name
 * @returns {Array<{name, type, absent, machines: string[], machineHours, standard, balance, reason}>}
 */
export function staffHours(isoDate, staff, machines, staffDay = {}) {
  return staff.map((person) => {
    const day = staffDay[person.name] || {};
    const worked = machines.filter((machine) => (machine.workers || []).includes(person.name));
    const hours = worked.reduce((sum, machine) => sum + (machineHours(machine.start, machine.end) || 0), 0);
    const standard = day.absent ? 0 : standardHours(person.type, isoDate);
    return {
      name: person.name,
      type: person.type,
      absent: Boolean(day.absent),
      machines: worked.map((machine) => machine.machine),
      machineHours: Math.round(hours * 100) / 100,
      standard,
      balance: Math.round((standard - hours) * 100) / 100,
      reason: day.reason || ''
    };
  });
}
