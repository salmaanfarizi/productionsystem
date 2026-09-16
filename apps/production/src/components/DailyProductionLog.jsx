import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@shared/utils/dateUtils';
import { isStoreSyncMissing } from '@shared/utils/storeUpdate';
import {
  DESTINATIONS,
  SHIFTS,
  NO_PRODUCTION,
  NO_PRODUCTION_REASONS,
  SACK_KG,
  SALT_BAG_KG,
  sacksToTonnes,
  loadSeedLines,
  loadProductionLog,
  loadPreviousProductionLog,
  saveProductionLog
} from '@shared/utils/productionLog';

const NAME_KEY = 'productionEntryName';

const NUMBER_FIELDS = [
  { key: 'saltBags', label: `Salt (${SALT_BAG_KG} kg bags)`, whole: false },
  { key: 'dieselLitres', label: 'Diesel received (litres)', whole: true },
  { key: 'wwBig', label: 'Waste water trips - big tanker', whole: true },
  { key: 'wwSmall', label: 'Waste water trips - small tanker', whole: true },
  { key: 'otHours', label: 'Overtime hours', whole: false }
];

function readSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

let nextRowId = 1;
const seedRow = (lineId = '', sacks = '', destination = 'REGULAR') => ({ rowId: nextRowId++, lineId, sacks, destination });

const text = (value) => (value === null || value === undefined ? '' : String(value));

/**
 * '' -> null, '12' -> 12, anything else -> NaN
 */
function parseAmount(value, whole) {
  const trimmed = String(value).trim().replace(/,/g, '');
  if (trimmed === '') return null;
  const number = Number(trimmed);
  if (Number.isNaN(number) || number < 0 || (whole && !Number.isInteger(number))) return NaN;
  return number;
}

function emptyDay() {
  return {
    shift: '',
    reason: '',
    note: '',
    seeds: [seedRow()],
    saltBags: '',
    dieselLitres: '',
    wwBig: '',
    wwSmall: '',
    otHours: '',
    wasteKg: '',
    wasteSacks: ''
  };
}

function dayFromLog(log) {
  const day = emptyDay();
  day.shift = log.shift;
  // A no-production note starts with its reason: "Maintenance - belt changed"
  const reason = log.shift === NO_PRODUCTION && NO_PRODUCTION_REASONS.find((r) => log.note === r || log.note.startsWith(`${r} - `));
  day.reason = reason || '';
  day.note = reason ? log.note.slice(reason.length).replace(/^ - /, '') : log.note;
  day.seeds = log.seeds.length ? log.seeds.map((s) => seedRow(s.lineId, String(s.sacks), s.destination)) : [seedRow()];
  ['saltBags', 'dieselLitres', 'wwBig', 'wwSmall', 'otHours', 'wasteKg', 'wasteSacks'].forEach((key) => {
    day[key] = text(log[key]);
  });
  return day;
}

const formatTonnes = (value) => `${(Math.round(value * 1000) / 1000).toLocaleString()} t`;

export default function DailyProductionLog({ authHelper, onSaved }) {
  const today = getLocalDateString();
  const [date, setDate] = useState(today);
  const [enteredBy, setEnteredBy] = useState(readSavedName);
  const [lines, setLines] = useState([]);
  const [day, setDay] = useState(null);
  const [savedInfo, setSavedInfo] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | failed
  const [dayLoading, setDayLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadLines();
  }, []);

  useEffect(() => {
    if (status === 'ready') loadDay();
  }, [date, status]);

  const loadLines = async () => {
    setStatus('loading');
    try {
      setLines(await loadSeedLines());
      setStatus('ready');
    } catch (error) {
      console.error('Error loading seed lines:', error);
      setStatus(isStoreSyncMissing(error) ? 'missing' : 'failed');
    }
  };

  const loadDay = async () => {
    setDayLoading(true);
    setMessage(null);
    setErrors({});
    try {
      const token = authHelper.getAccessToken();
      const [log, before] = await Promise.all([
        loadProductionLog(date, token),
        loadPreviousProductionLog(date, token)
      ]);
      setDay(log ? dayFromLog(log) : emptyDay());
      setSavedInfo(log ? { by: log.enteredBy, at: log.enteredAt } : null);
      setPrevious(before && before.log && before.log.seeds.length ? before : null);
      setDirty(false);
    } catch (error) {
      console.error('Error loading the production log:', error);
      if (isStoreSyncMissing(error)) {
        setStatus('missing');
      } else {
        setMessage({ type: 'error', text: `Could not load the day: ${error.message}` });
      }
    } finally {
      setDayLoading(false);
    }
  };

  const change = (updater) => {
    setDay((prev) => updater(prev));
    setDirty(true);
    setMessage(null);
  };

  const setField = (key, value) => {
    change((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setSeed = (rowId, key, value) => {
    change((prev) => ({ ...prev, seeds: prev.seeds.map((row) => (row.rowId === rowId ? { ...row, [key]: value } : row)) }));
    setErrors((prev) => ({ ...prev, [`seed-${rowId}`]: undefined, seeds: undefined }));
  };

  const addSeed = () => change((prev) => ({ ...prev, seeds: [...prev.seeds, seedRow()] }));

  const removeSeed = (rowId) => change((prev) => {
    const seeds = prev.seeds.filter((row) => row.rowId !== rowId);
    return { ...prev, seeds: seeds.length ? seeds : [seedRow()] };
  });

  const copyPrevious = () => change((prev) => ({
    ...prev,
    seeds: previous.log.seeds.map((s) => seedRow(s.lineId, '', s.destination))
  }));

  const changeDate = (value) => {
    if (dirty && !window.confirm('Discard the changes you have not saved?')) return;
    setDate(value);
  };

  const handleSave = async () => {
    const nextErrors = {};
    if (!enteredBy.trim()) nextErrors.enteredBy = 'Enter your name';
    if (!day.shift) nextErrors.shift = 'Choose the shift';

    const seeds = [];
    const seen = new Set();
    day.seeds.forEach((row) => {
      const blank = !row.lineId && String(row.sacks).trim() === '';
      if (blank) return;
      const sacks = parseAmount(row.sacks, true);
      if (!row.lineId) {
        nextErrors[`seed-${row.rowId}`] = 'Choose the seed';
      } else if (!sacks) {
        nextErrors[`seed-${row.rowId}`] = 'Enter the sacks as a whole number above 0';
      } else if (seen.has(`${row.lineId}|${row.destination}`)) {
        nextErrors[`seed-${row.rowId}`] = 'This seed and destination is already listed - add the sacks together';
      } else {
        seen.add(`${row.lineId}|${row.destination}`);
        seeds.push({ lineId: row.lineId, sacks, destination: row.destination });
      }
    });
    if (day.shift && day.shift !== NO_PRODUCTION && seeds.length === 0 && !Object.keys(nextErrors).some((k) => k.startsWith('seed-'))) {
      nextErrors.seeds = 'Add the seed used, or choose "No production"';
    }

    const numbers = {};
    [...NUMBER_FIELDS, { key: 'wasteKg', whole: false }, { key: 'wasteSacks', whole: true }].forEach(({ key, whole }) => {
      const value = parseAmount(day[key], whole);
      if (Number.isNaN(value)) nextErrors[key] = whole ? 'Enter a whole number' : 'Enter a number (0 or more)';
      numbers[key] = value;
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage({ type: 'error', text: 'Check the fields marked in red.' });
      return;
    }

    const reason = day.shift === NO_PRODUCTION ? day.reason : '';
    const note = [reason, day.note.trim()].filter(Boolean).join(' - ');
    setSaving(true);
    try {
      const saved = await saveProductionLog({
        date,
        shift: day.shift,
        note,
        enteredBy: enteredBy.trim(),
        seeds,
        ...numbers
      }, authHelper.getAccessToken());
      try {
        localStorage.setItem(NAME_KEY, enteredBy.trim());
      } catch {
        // Name is only remembered for convenience
      }
      setSavedInfo({ by: enteredBy.trim(), at: saved.enteredAt });
      setDirty(false);
      setMessage({ type: 'success', text: 'Production log saved.' });
      if (onSaved) onSaved();
    } catch (error) {
      console.error('Error saving the production log:', error);
      setMessage({ type: 'error', text: error.message || 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || (status === 'ready' && !day)) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (status !== 'ready') {
    return (
      <div className="card text-center py-10">
        <h3 className="text-lg font-semibold text-gray-900">
          {status === 'missing' ? 'The production log is not set up yet' : 'Could not load the seed lines'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          {status === 'missing'
            ? 'Ask the admin to turn on the production sync (PRODUCTION_SPREADSHEET_ID) and run its setup.'
            : 'Check the internet connection and try again.'}
        </p>
        {status === 'failed' && (
          <button onClick={loadLines} className="btn btn-secondary mt-4">Try Again</button>
        )}
      </div>
    );
  }

  const usedIds = new Set(day.seeds.map((row) => row.lineId));
  const lineOptions = lines
    .filter((line) => line.active || usedIds.has(line.id))
    .sort((a, b) => a.label.localeCompare(b.label));

  const validSeeds = day.seeds
    .map((row) => ({ ...row, count: parseAmount(row.sacks, true) }))
    .filter((row) => row.lineId && row.count > 0);
  const totalSacks = validSeeds.reduce((sum, row) => sum + row.count, 0);
  const byDestination = DESTINATIONS
    .map((d) => ({ ...d, sacks: validSeeds.filter((row) => row.destination === d.key).reduce((sum, row) => sum + row.count, 0) }))
    .filter((d) => d.sacks > 0);
  const wasteKg = parseAmount(day.wasteKg, false);
  const wasteSacks = parseAmount(day.wasteSacks, true) ?? totalSacks;
  const wastePerSack = wasteKg > 0 && wasteSacks > 0 ? wasteKg / wasteSacks : null;
  const noProduction = day.shift === NO_PRODUCTION;
  const fieldError = (key) => errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="label" htmlFor="prod-date">Date</label>
            <input
              id="prod-date"
              type="date"
              className="input"
              value={date}
              max={today}
              onChange={(e) => e.target.value && changeDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="prod-shift">Shift</label>
            <select id="prod-shift" className="input" value={day.shift} onChange={(e) => setField('shift', e.target.value)}>
              <option value="">Choose...</option>
              {SHIFTS.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
            </select>
            {fieldError('shift')}
          </div>
          <div>
            <label className="label" htmlFor="prod-name">Your name</label>
            <input
              id="prod-name"
              className="input"
              autoComplete="name"
              value={enteredBy}
              onChange={(e) => {
                setEnteredBy(e.target.value);
                setErrors((prev) => ({ ...prev, enteredBy: undefined }));
              }}
            />
            {fieldError('enteredBy')}
          </div>
        </div>
        {noProduction && (
          <div>
            <label className="label" htmlFor="prod-reason">Why no production?</label>
            <select id="prod-reason" className="input sm:w-64" value={day.reason} onChange={(e) => setField('reason', e.target.value)}>
              <option value="">Not given</option>
              {NO_PRODUCTION_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </div>
        )}
        <p className="text-xs text-gray-500">
          {dayLoading ? 'Loading...' : savedInfo ? `Last saved ${savedInfo.at} by ${savedInfo.by}` : 'Nothing saved for this day yet'}
          {dirty && ' · unsaved changes'}
        </p>
      </div>

      <div className="card space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Raw seed used</h3>
          <p className="text-sm text-gray-700">
            <strong>{totalSacks.toLocaleString()}</strong> sacks · {formatTonnes(sacksToTonnes(totalSacks))}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          One line per seed and destination, in {SACK_KG} kg sacks.
          {noProduction && ' Only fill this in if seed was really used today.'}
        </p>
        {previous && !savedInfo && validSeeds.length === 0 && (
          <button type="button" onClick={copyPrevious} className="btn btn-secondary text-sm">
            Same seed lines as {previous.date}
          </button>
        )}

        <ul className="space-y-3">
          {day.seeds.map((row, index) => (
            <li key={row.rowId} className="rounded-lg border border-gray-200 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-end">
                <div className="sm:col-span-5">
                  <label className="label" htmlFor={`seed-line-${row.rowId}`}>Seed {index + 1}</label>
                  <select
                    id={`seed-line-${row.rowId}`}
                    className="input"
                    value={row.lineId}
                    onChange={(e) => setSeed(row.rowId, 'lineId', e.target.value)}
                  >
                    <option value="">Choose the seed...</option>
                    {lineOptions.map((line) => <option key={line.id} value={line.id}>{line.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor={`seed-sacks-${row.rowId}`}>Sacks</label>
                  <input
                    id={`seed-sacks-${row.rowId}`}
                    className="input"
                    inputMode="numeric"
                    value={row.sacks}
                    onChange={(e) => setSeed(row.rowId, 'sacks', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="label" htmlFor={`seed-dest-${row.rowId}`}>Goes to</label>
                  <select
                    id={`seed-dest-${row.rowId}`}
                    className="input"
                    value={row.destination}
                    onChange={(e) => setSeed(row.rowId, 'destination', e.target.value)}
                  >
                    {DESTINATIONS.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-1 flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => removeSeed(row.rowId)}
                    className="btn btn-secondary text-sm w-full sm:w-auto"
                    aria-label={`Remove seed ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {fieldError(`seed-${row.rowId}`)}
            </li>
          ))}
        </ul>
        {fieldError('seeds')}
        <button type="button" onClick={addSeed} className="btn btn-secondary text-sm">+ Add seed line</button>

        {byDestination.length > 0 && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
            {byDestination.map((d) => (
              <span key={d.key} className="mr-4 inline-block">
                {d.name}: <strong>{formatTonnes(sacksToTonnes(d.sacks))}</strong> ({d.sacks.toLocaleString()} sacks)
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Salt, diesel, waste water and overtime</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {NUMBER_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="label" htmlFor={`prod-${field.key}`}>{field.label}</label>
              <input
                id={`prod-${field.key}`}
                className="input"
                inputMode={field.whole ? 'numeric' : 'decimal'}
                value={day[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
              />
              {field.key === 'saltBags' && parseAmount(day.saltBags, false) > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {(parseAmount(day.saltBags, false) * SALT_BAG_KG).toLocaleString()} kg of salt
                </p>
              )}
              {fieldError(field.key)}
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Waste</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="label" htmlFor="prod-wasteKg">Waste (kg)</label>
            <input
              id="prod-wasteKg"
              className="input"
              inputMode="decimal"
              value={day.wasteKg}
              onChange={(e) => setField('wasteKg', e.target.value)}
            />
            {fieldError('wasteKg')}
          </div>
          <div>
            <label className="label" htmlFor="prod-wasteSacks">Measured on (sacks)</label>
            <input
              id="prod-wasteSacks"
              className="input"
              inputMode="numeric"
              placeholder={totalSacks ? `${totalSacks} (all seed today)` : ''}
              value={day.wasteSacks}
              onChange={(e) => setField('wasteSacks', e.target.value)}
            />
            {fieldError('wasteSacks')}
          </div>
        </div>
        {wastePerSack !== null && (
          <p className="text-sm text-gray-700">
            {wastePerSack.toFixed(2)} kg per sack · {((wastePerSack / SACK_KG) * 100).toFixed(1)}% of the seed weight
          </p>
        )}
        <div>
          <label className="label" htmlFor="prod-note">Note (optional)</label>
          <input id="prod-note" className="input" value={day.note} onChange={(e) => setField('note', e.target.value)} />
        </div>
      </div>

      <div className="card space-y-3">
        {message && (
          <p
            role="status"
            className={`rounded-lg px-3 py-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            {message.text}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || dayLoading}
          className={`btn btn-primary w-full py-3 ${saving || dayLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {saving ? 'Saving...' : 'Save production log'}
        </button>
      </div>
    </div>
  );
}
