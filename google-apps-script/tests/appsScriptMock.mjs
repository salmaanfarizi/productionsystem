// Minimal in-memory stand-ins for the Apps Script services the store sync uses,
// so the .js files in google-apps-script/ can be run under Node.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const SCRIPT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

class MockRange {
  constructor(sheet, row, column, rows, columns) {
    Object.assign(this, { sheet, row, column, rows, columns });
  }

  getValues() {
    const values = [];
    for (let r = 0; r < this.rows; r++) {
      const source = this.sheet.cells[this.row - 1 + r] || [];
      const line = [];
      for (let c = 0; c < this.columns; c++) {
        const value = source[this.column - 1 + c];
        line.push(value === undefined ? '' : value);
      }
      values.push(line);
    }
    return values;
  }

  setValues(values) {
    if (values.length !== this.rows || values.some((line) => line.length !== this.columns)) {
      throw new Error('setValues size does not match the range');
    }
    values.forEach((line, r) => {
      const target = this.sheet.cells[this.row - 1 + r] || (this.sheet.cells[this.row - 1 + r] = []);
      line.forEach((value, c) => {
        const column = this.column - 1 + c;
        const isText = this.sheet.isText(column, this.row + r);
        // Like Sheets: date-looking text becomes a Date unless the cell is formatted as text
        target[column] = !isText && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? new Date(`${value}T00:00:00Z`)
          : value;
      });
    });
    return this;
  }

  clearContent() {
    for (let r = 0; r < this.rows; r++) {
      const target = this.sheet.cells[this.row - 1 + r];
      if (!target) continue;
      for (let c = 0; c < this.columns; c++) target[this.column - 1 + c] = '';
    }
    return this;
  }

  setNumberFormat(format) {
    if (format === '@') {
      this.sheet.textRanges.push({ column: this.column - 1, from: this.row, to: this.row + this.rows - 1 });
    }
    return this;
  }

  setFontWeight() {
    return this;
  }
}

class MockSheet {
  constructor(name, cells = []) {
    this.name = name;
    this.cells = cells.map((line) => [...line]);
    this.textRanges = [];
  }

  isText(column, row) {
    return this.textRanges.some((range) => range.column === column && row >= range.from && row <= range.to);
  }

  getName() { return this.name; }
  getMaxRows() { return 1000; }
  setFrozenRows() {}

  getLastRow() {
    for (let r = this.cells.length - 1; r >= 0; r--) {
      if ((this.cells[r] || []).some((value) => value !== '' && value !== undefined)) return r + 1;
    }
    return 0;
  }

  getLastColumn() {
    return this.cells.reduce((max, line) => {
      let last = 0;
      (line || []).forEach((value, c) => { if (value !== '' && value !== undefined) last = c + 1; });
      return Math.max(max, last);
    }, 0);
  }

  getRange(row, column, rows, columns) {
    return new MockRange(this, row, column, rows, columns);
  }

  getDataRange() {
    return new MockRange(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn()));
  }
}

class MockSpreadsheet {
  constructor(sheets, timeZone = 'Asia/Riyadh') {
    this.sheets = sheets;
    this.timeZone = timeZone;
  }

  getSheets() { return this.sheets; }
  getSheetByName(name) { return this.sheets.find((sheet) => sheet.getName() === name) || null; }
  getSpreadsheetTimeZone() { return this.timeZone; }

  insertSheet(name) {
    const sheet = new MockSheet(name);
    this.sheets.push(sheet);
    return sheet;
  }
}

/**
 * Load the Apps Script files into a sandbox wired to the given spreadsheets.
 * @param {Object<string, MockSpreadsheet>} spreadsheets - by id
 */
export function loadStoreSync(spreadsheets, { now = new Date('2026-09-16T12:00:00Z') } = {}) {
  const logs = [];
  const triggers = [];
  const sandbox = {
    Logger: { log: (message) => logs.push(message) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    SpreadsheetApp: {
      openById: (id) => {
        if (!spreadsheets[id]) throw new Error(`No spreadsheet ${id}`);
        return spreadsheets[id];
      }
    },
    Utilities: {
      // Test dates are UTC midnight, so formatting in UTC keeps the same calendar day
      formatDate: (date, timeZone, pattern) => {
        const iso = date.toISOString();
        return pattern === 'yyyy-MM-dd' ? iso.slice(0, 10) : `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
      }
    },
    ScriptApp: {
      getProjectTriggers: () => triggers,
      deleteTrigger: (trigger) => triggers.splice(triggers.indexOf(trigger), 1),
      newTrigger: (handler) => ({
        timeBased: () => ({
          everyHours: (hours) => ({
            create: () => triggers.push({ handler, hours, getHandlerFunction: () => handler })
          })
        })
      })
    },
    Date: class extends Date {
      constructor(...args) {
        super(...(args.length ? args : [now]));
      }
    }
  };
  const context = vm.createContext(sandbox);
  for (const file of ['StoreUpdateParser.js', 'ItemMasterSeed.js', 'MaterialStock.js', 'StoreUpdateSync.js']) {
    vm.runInContext(fs.readFileSync(path.join(SCRIPT_DIR, file), 'utf8'), context, { filename: file });
  }
  vm.runInContext(
    "SYNC_CONFIG.STORE_SPREADSHEET_ID = 'store'; SYNC_CONFIG.DATABASE_SPREADSHEET_ID = 'db';",
    context
  );
  return { context, logs, triggers };
}

export { MockSheet, MockSpreadsheet };
