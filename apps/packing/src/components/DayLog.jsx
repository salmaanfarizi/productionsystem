import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@shared/utils/dateUtils';
import { isStoreSyncMissing, loadItemMaster, loadStoreMovements, MOVEMENT_TYPES } from '@shared/utils/storeUpdate';
import { loadStaff, loadMachines, loadDayLog, saveDayLog, listsForDay } from '@shared/utils/dayLog';
import {
  STAFF_TYPES,
  BALANCE_REASONS,
  absenteeText,
  isValidTime,
  machineHours,
  staffHours
} from '@shared/utils/workHours';

const NAME_KEY = 'storeEntryName';

const formatHours = (value) => (value === null || value === undefined ? '–' : value.toFixed(2));

function readSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

function emptyDay(machines) {
  return {
    holiday: false,
    absent: [],
    reasons: {},
    machines: Object.fromEntries(machines.map((m) => [m.machine, { start: '', end: '', workers: [] }]))
  };
}

export default function DayLog({ authHelper }) {
  const today = getLocalDateString();
  const [date, setDate] = useState(today);
  const [enteredBy, setEnteredBy] = useState(readSavedName);
  const [allStaff, setAllStaff] = useState([]);
  const [allMachines, setAllMachines] = useState([]);
  const [staff, setStaff] = useState([]); // for the selected day
  const [machines, setMachines] = useState([]);
  const [codeOwner, setCodeOwner] = useState({});
  const [day, setDay] = useState(null);
  const [savedInfo, setSavedInfo] = useState(null);
  const [packedByMachine, setPackedByMachine] = useState({});
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | failed
  const [dayLoading, setDayLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    if (status === 'ready') loadDay();
  }, [date, status]);

  const loadLists = async () => {
    setStatus('loading');
    try {
      const [staffList, machineList, itemMaster] = await Promise.all([loadStaff(), loadMachines(), loadItemMaster()]);
      const activeMachines = machineList.filter((m) => m.active);
      setAllStaff(staffList);
      setAllMachines(machineList);
      // Item key -> machine, through the item's store code
      const byCode = {};
      activeMachines.forEach((m) => m.codes.forEach((code) => { byCode[code] = m.machine; }));
      setCodeOwner(Object.fromEntries(itemMaster.map((item) => [item.key, byCode[item.code]]).filter(([, m]) => m)));
      setStatus('ready');
    } catch (error) {
      console.error('Error loading staff and machines:', error);
      setStatus(isStoreSyncMissing(error) ? 'missing' : 'failed');
    }
  };

  const loadDay = async () => {
    setDayLoading(true);
    setMessage(null);
    setErrors({});
    try {
      const token = authHelper.getAccessToken();
      const [log, movements] = await Promise.all([
        loadDayLog(date, token),
        loadStoreMovements(date, token).catch(() => [])
      ]);

      const packed = {};
      movements
        .filter((m) => !m.cancelled && m.type === MOVEMENT_TYPES.PACKED && codeOwner[m.itemKey])
        .forEach((m) => { packed[codeOwner[m.itemKey]] = (packed[codeOwner[m.itemKey]] || 0) + m.units; });
      setPackedByMachine(packed);

      const lists = listsForDay(allStaff, allMachines, log);
      setStaff(lists.staff);
      setMachines(lists.machines);
      const next = emptyDay(lists.machines);
      if (log) {
        next.holiday = log.holiday;
        next.absent = Object.entries(log.staff).filter(([, s]) => s.absent).map(([name]) => name);
        next.reasons = Object.fromEntries(Object.entries(log.staff).map(([name, s]) => [name, s.reason || '']));
        log.machines.forEach((m) => {
          next.machines[m.machine] = { start: m.start, end: m.end, workers: m.workers };
        });
        setSavedInfo({ by: log.enteredBy, at: log.enteredAt });
      } else {
        setSavedInfo(null);
      }
      setDay(next);
      setDirty(false);
    } catch (error) {
      console.error('Error loading the day log:', error);
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

  const changeDate = (value) => {
    if (dirty && !window.confirm('Discard the changes you have not saved?')) return;
    setDate(value);
  };

  const toggleAbsent = (name) => change((prev) => {
    const absent = prev.absent.includes(name) ? prev.absent.filter((n) => n !== name) : [...prev.absent, name];
    // Someone absent can't have worked on a machine
    const machinesState = Object.fromEntries(Object.entries(prev.machines).map(([m, state]) => [
      m, { ...state, workers: state.workers.filter((w) => !absent.includes(w)) }
    ]));
    return { ...prev, absent, machines: machinesState };
  });

  const setMachineField = (machine, field, value) => {
    change((prev) => ({ ...prev, machines: { ...prev.machines, [machine]: { ...prev.machines[machine], [field]: value } } }));
    setErrors((prev) => ({ ...prev, [machine]: undefined }));
  };

  const toggleWorker = (machine, name) => change((prev) => {
    const state = prev.machines[machine];
    const workers = state.workers.includes(name) ? state.workers.filter((w) => w !== name) : [...state.workers, name];
    return { ...prev, machines: { ...prev.machines, [machine]: { ...state, workers } } };
  });

  const handleSave = async () => {
    const nextErrors = {};
    if (!enteredBy.trim()) nextErrors.enteredBy = 'Enter your name';
    if (!day.holiday) {
      machines.forEach(({ machine }) => {
        const { start, end } = day.machines[machine];
        if ((start && !isValidTime(start)) || (end && !isValidTime(end))) {
          nextErrors[machine] = 'Use 24-hour times like 07:30';
        } else if (start && end && machineHours(start, end) === null) {
          nextErrors[machine] = 'The end time must be after the start time';
        }
      });
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const machineRows = day.holiday
      ? []
      : machines
        .map(({ machine }) => ({ machine, ...day.machines[machine] }))
        .filter((m) => m.start || m.end || m.workers.length > 0);

    setSaving(true);
    try {
      const saved = await saveDayLog({
        date,
        holiday: day.holiday,
        absentees: day.holiday ? '' : absenteeText(staff, day.absent),
        note: '',
        enteredBy: enteredBy.trim(),
        machines: machineRows,
        staff: Object.fromEntries(staff.map((person) => [person.name, {
          absent: day.absent.includes(person.name),
          reason: day.reasons[person.name] || ''
        }]))
      }, authHelper.getAccessToken());
      try {
        localStorage.setItem(NAME_KEY, enteredBy.trim());
      } catch {
        // Name is only remembered for convenience
      }
      setSavedInfo({ by: enteredBy.trim(), at: saved.enteredAt });
      setDirty(false);
      setMessage({ type: 'success', text: 'Day log saved.' });
    } catch (error) {
      console.error('Error saving the day log:', error);
      setMessage({ type: 'error', text: error.message || 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || (status === 'ready' && !day)) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (status !== 'ready') {
    return (
      <div className="card text-center py-10">
        <h3 className="text-lg font-semibold text-gray-900">
          {status === 'missing' ? 'The day log is not set up yet' : 'Could not load staff and machines'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          {status === 'missing'
            ? 'Ask the admin to update the store sync script and run its setup again.'
            : 'Check the internet connection and try again.'}
        </p>
        {status === 'failed' && (
          <button onClick={loadLists} className="btn btn-secondary mt-4">Try Again</button>
        )}
      </div>
    );
  }

  const present = staff.filter((person) => !day.absent.includes(person.name));
  const hours = staffHours(
    date,
    staff,
    machines.map(({ machine }) => ({ machine, ...day.machines[machine] })),
    Object.fromEntries(staff.map((person) => [person.name, {
      absent: day.absent.includes(person.name),
      reason: day.reasons[person.name]
    }]))
  );
  const absentees = absenteeText(staff, day.absent);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="label" htmlFor="daylog-date">Date</label>
            <input
              id="daylog-date"
              type="date"
              className="input"
              value={date}
              max={today}
              onChange={(e) => e.target.value && changeDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="daylog-name">Your name</label>
            <input
              id="daylog-name"
              className="input"
              autoComplete="name"
              value={enteredBy}
              onChange={(e) => {
                setEnteredBy(e.target.value);
                setErrors((prev) => ({ ...prev, enteredBy: undefined }));
              }}
            />
            {errors.enteredBy && <p className="mt-1 text-xs text-red-600">{errors.enteredBy}</p>}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
            checked={day.holiday}
            onChange={(e) => change((prev) => ({ ...prev, holiday: e.target.checked }))}
          />
          Holiday - no work today
        </label>
        <p className="text-xs text-gray-500">
          {dayLoading ? 'Loading...' : savedInfo ? `Last saved ${savedInfo.at} by ${savedInfo.by}` : 'Nothing saved for this day yet'}
          {dirty && ' · unsaved changes'}
        </p>
      </div>

      {!day.holiday && (
        <>
          <div className="card">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Attendance</h3>
              <p className="text-sm text-gray-700">Absentees: <strong>{absentees || 'none'}</strong></p>
            </div>
            <p className="text-xs text-gray-500 mb-2">Tap a name to mark them absent.</p>
            <div className="flex flex-wrap gap-2">
              {staff.map((person) => {
                const absent = day.absent.includes(person.name);
                return (
                  <button
                    key={person.name}
                    type="button"
                    aria-pressed={absent}
                    onClick={() => toggleAbsent(person.name)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      absent ? 'border-red-300 bg-red-50 text-red-800 line-through' : 'border-gray-300 bg-white text-gray-800'
                    }`}
                  >
                    {person.name} ({person.type})
                  </button>
                );
              })}
            </div>
            {staff.length === 0 && <p className="text-sm text-gray-600">No staff in the Staff tab yet.</p>}
          </div>

          <div className="card space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Machines</h3>
            {machines.map(({ machine }) => {
              const state = day.machines[machine];
              const hoursRun = machineHours(state.start, state.end);
              return (
                <div key={machine} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-gray-900">{machine}</p>
                    <p className="text-xs text-gray-600">
                      Packed in the app: {(packedByMachine[machine] || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 items-end">
                    <div>
                      <label className="label" htmlFor={`start-${machine}`}>Start</label>
                      <input
                        id={`start-${machine}`}
                        type="time"
                        className="input"
                        value={state.start}
                        onChange={(e) => setMachineField(machine, 'start', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`end-${machine}`}>End</label>
                      <input
                        id={`end-${machine}`}
                        type="time"
                        className="input"
                        value={state.end}
                        onChange={(e) => setMachineField(machine, 'end', e.target.value)}
                      />
                    </div>
                    <div className="pb-2 text-sm text-gray-700">
                      <span className="block text-xs text-gray-500">Hours</span>
                      {formatHours(hoursRun)}
                    </div>
                  </div>
                  {errors[machine] && <p className="mt-1 text-xs text-red-600">{errors[machine]}</p>}
                  <p className="text-xs text-gray-500 mt-3 mb-1">Who worked on it</p>
                  <div className="flex flex-wrap gap-1.5">
                    {present.map((person) => {
                      const on = state.workers.includes(person.name);
                      return (
                        <button
                          key={person.name}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleWorker(machine, person.name)}
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            on ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          {person.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-500">Machine hours leave out the 12:30-13:00 break.</p>
          </div>

          <div className="card">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Staff hours</h3>
            <p className="text-xs text-gray-500 mb-3">
              Standard: {STAFF_TYPES.S.label} (S) {STAFF_TYPES.S.standardHours} h, Saturday {STAFF_TYPES.S.saturdayHours} h ·{' '}
              {STAFF_TYPES.O.label} (O) {STAFF_TYPES.O.standardHours} h. Give a reason when machine hours are short.
            </p>
            <ul className="divide-y divide-gray-100">
              {hours.filter((row) => !row.absent).map((row) => (
                <li key={row.name} className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-medium text-gray-900">{row.name} <span className="text-gray-500">({row.type})</span></p>
                    <p className="text-xs text-gray-600">
                      {row.machines.length ? row.machines.join(', ') : 'No machine'} · {formatHours(row.machineHours)} of {formatHours(row.standard)} h
                      {' · '}
                      <span className={row.balance > 0.25 ? 'text-amber-700 font-medium' : row.balance < 0 ? 'text-blue-700' : ''}>
                        balance {formatHours(row.balance)} h
                      </span>
                    </p>
                  </div>
                  <select
                    aria-label={`Reason for ${row.name}`}
                    className="input sm:w-56"
                    value={day.reasons[row.name] || ''}
                    onChange={(e) => change((prev) => ({ ...prev, reasons: { ...prev.reasons, [row.name]: e.target.value } }))}
                  >
                    <option value="">No reason</option>
                    {BALANCE_REASONS.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="card space-y-3">
        {message && (
          <p
            role="status"
            className={`rounded-lg px-3 py-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            {message.text}
          </p>
        )}
        {Object.keys(errors).some((key) => errors[key] && key !== 'enteredBy') && (
          <p className="text-sm text-red-600">Check the machine times marked in red.</p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || dayLoading}
          className={`btn btn-primary w-full py-3 ${saving || dayLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {saving ? 'Saving...' : 'Save day log'}
        </button>
      </div>
    </div>
  );
}
