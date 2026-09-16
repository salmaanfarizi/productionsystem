import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@shared/utils/dateUtils';
import {
  MOVEMENT_TYPES,
  STORE_GROUPS,
  groupName,
  isStoreSyncMissing,
  loadItemMaster,
  loadStoreDay,
  loadStoreMovements,
  addStoreMovements,
  cancelStoreMovement
} from '@shared/utils/storeUpdate';

const NAME_KEY = 'storeEntryName';

const TYPES = {
  [MOVEMENT_TYPES.PACKED]: { label: 'Packed', verb: 'packed', hint: 'Finished goods received into the store' },
  [MOVEMENT_TYPES.DESPATCHED]: { label: 'Despatched', verb: 'despatched', hint: 'Goods sent out of the store' }
};

const formatDay = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

function readSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

export default function StoreEntry({ authHelper, onUnavailable }) {
  const today = getLocalDateString();
  const [type, setType] = useState(MOVEMENT_TYPES.PACKED);
  const [date, setDate] = useState(today);
  const [group, setGroup] = useState('REG');
  const [enteredBy, setEnteredBy] = useState(readSavedName);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  // Keyed by `${type}|${itemKey}` so switching Packed/Despatched never reuses numbers
  const [quantities, setQuantities] = useState({});
  const [items, setItems] = useState([]);
  const [lastStock, setLastStock] = useState({ date: null, byKey: {} });
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | failed
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    if (status === 'ready') loadEntries();
  }, [date, status]);

  const loadMasterData = async () => {
    setStatus('loading');
    try {
      const [itemMaster, lastDay] = await Promise.all([
        loadItemMaster(),
        loadStoreDay().catch(() => ({ date: null, rows: [] }))
      ]);
      setItems(itemMaster.filter((item) => item.active));
      setLastStock({
        date: lastDay.date,
        byKey: Object.fromEntries(lastDay.rows.map((row) => [row.itemKey, row.closing]))
      });
      setStatus('ready');
    } catch (error) {
      console.error('Error loading items:', error);
      const missing = isStoreSyncMissing(error);
      setStatus(missing ? 'missing' : 'failed');
      if (missing) onUnavailable?.();
    }
  };

  const loadEntries = async () => {
    setEntriesLoading(true);
    try {
      setEntries(await loadStoreMovements(date, authHelper.getAccessToken()));
    } catch (error) {
      console.error('Error loading store entries:', error);
      if (isStoreSyncMissing(error)) {
        setStatus('missing');
        onUnavailable?.();
      } else {
        setMessage({ type: 'error', text: `Could not load the entries: ${error.message}` });
      }
    } finally {
      setEntriesLoading(false);
    }
  };

  const quantityKey = (itemKey) => `${type}|${itemKey}`;

  const filledLines = items
    .map((item) => ({ item, raw: (quantities[quantityKey(item.key)] || '').trim() }))
    .filter((line) => line.raw !== '');

  const handleQuantity = (itemKey, value) => {
    setQuantities((prev) => ({ ...prev, [quantityKey(itemKey)]: value }));
    if (errors[itemKey] || errors.form) {
      setErrors((prev) => ({ ...prev, [itemKey]: undefined, form: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    const lines = [];
    filledLines.forEach(({ item, raw }) => {
      const units = Number(raw);
      if (!Number.isInteger(units) || units <= 0) {
        nextErrors[item.key] = 'Enter a whole number above 0';
      } else {
        lines.push({ item, units });
      }
    });
    if (!enteredBy.trim()) nextErrors.enteredBy = 'Enter your name';
    if (!date || date > today) nextErrors.date = 'Pick today or an earlier day';
    if (filledLines.length === 0) nextErrors.form = 'Enter units for at least one item';

    const firstBadItem = items.find((item) => nextErrors[item.key]);
    if (firstBadItem && firstBadItem.group !== group) setGroup(firstBadItem.group);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    setMessage(null);
    try {
      const count = await addStoreMovements(
        { type, date, reference: reference.trim(), note: note.trim(), enteredBy: enteredBy.trim() },
        lines,
        authHelper.getAccessToken()
      );
      try {
        localStorage.setItem(NAME_KEY, enteredBy.trim());
      } catch {
        // Name is only remembered for convenience
      }
      setQuantities((prev) => {
        const next = { ...prev };
        lines.forEach(({ item }) => delete next[quantityKey(item.key)]);
        return next;
      });
      setReference('');
      setNote('');
      setMessage({ type: 'success', text: `Saved ${count} item(s) as ${TYPES[type].verb} for ${formatDay(date)}.` });
      await loadEntries();
    } catch (error) {
      console.error('Error saving store entry:', error);
      setMessage({ type: 'error', text: error.message || 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (entry) => {
    const label = `${entry.units} x ${entry.code} ${entry.name} (${TYPES[entry.type]?.verb || entry.type})`;
    if (!window.confirm(`Cancel this entry?\n${label}`)) return;

    setCancellingId(entry.entryId);
    setMessage(null);
    try {
      await cancelStoreMovement(entry.entryId, authHelper.getAccessToken());
      await loadEntries();
    } catch (error) {
      console.error('Error cancelling store entry:', error);
      setMessage({ type: 'error', text: error.message || 'Could not cancel. Please try again.' });
    } finally {
      setCancellingId(null);
    }
  };

  if (status === 'loading') {
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
          {status === 'missing' ? 'Store entry is not set up yet' : 'Could not load the item list'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          {status === 'missing'
            ? 'Ask the admin to update the store sync script and run its setup again.'
            : 'Check the internet connection and try again.'}
        </p>
        {status === 'failed' && (
          <button onClick={loadMasterData} className="btn btn-secondary mt-4">Try Again</button>
        )}
      </div>
    );
  }

  const groupsWithItems = STORE_GROUPS.filter((g) => items.some((item) => item.group === g.key));
  const visibleItems = items.filter((item) => item.group === group);
  const filledIn = (groupKey) => filledLines.filter((line) => line.item.group === groupKey).length;
  const filledCount = filledLines.length;
  const saveLabel = filledCount === 0
    ? `Save as ${TYPES[type].verb}`
    : `Save ${filledCount} ${filledCount === 1 ? 'item' : 'items'} as ${TYPES[type].verb}`;

  const activeEntries = entries.filter((entry) => !entry.cancelled);
  const totals = Object.values(activeEntries.reduce((acc, entry) => {
    const total = acc[entry.itemKey] || (acc[entry.itemKey] = { ...entry, packed: 0, despatched: 0 });
    if (entry.type === MOVEMENT_TYPES.PACKED) total.packed += entry.units;
    if (entry.type === MOVEMENT_TYPES.DESPATCHED) total.despatched += entry.units;
    return acc;
  }, {}));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Trial period: keep filling the store sheet as well. The Inventory app compares both every hour.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
        <div className="card space-y-4">
          <div>
            <span className="label">Entry type</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Entry type">
              {Object.entries(TYPES).map(([value, option]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={type === value}
                  aria-label={`${option.label} - ${option.hint}`}
                  onClick={() => setType(value)}
                  className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                    type === value
                      ? value === MOVEMENT_TYPES.PACKED
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="block font-semibold">{option.label}</span>
                  <span className="block text-xs opacity-80">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="label" htmlFor="entry-date">Date</label>
              <input
                id="entry-date"
                type="date"
                className="input"
                value={date}
                max={today}
                onChange={(e) => {
                  setDate(e.target.value);
                  setErrors((prev) => ({ ...prev, date: undefined }));
                }}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>
            <div>
              <label className="label" htmlFor="entry-name">Your name</label>
              <input
                id="entry-name"
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
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label" htmlFor="entry-group">Group</label>
            <select id="entry-group" className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
              {groupsWithItems.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.name}{filledIn(g.key) > 0 ? ` (${filledIn(g.key)} filled)` : ''}
                </option>
              ))}
            </select>
          </div>

          <ul className="divide-y divide-gray-100">
            {visibleItems.map((item) => {
              const value = quantities[quantityKey(item.key)] || '';
              const closing = lastStock.byKey[item.key];
              const overStock = type === MOVEMENT_TYPES.DESPATCHED && closing != null && Number(value) > closing;
              return (
                <li key={item.key} className="py-3 flex items-start gap-3">
                  <label htmlFor={`qty-${item.key}`} className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{item.code}</span>
                    <span className="block text-xs text-gray-600 break-words">{item.name}</span>
                    {closing != null && lastStock.date && (
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Store sheet {formatDay(lastStock.date)}: {closing.toLocaleString()}
                      </span>
                    )}
                    {errors[item.key] && <span className="block text-xs text-red-600 mt-0.5">{errors[item.key]}</span>}
                    {!errors[item.key] && overStock && (
                      <span className="block text-xs text-amber-700 mt-0.5">More than the last store closing</span>
                    )}
                  </label>
                  <div className="w-28 flex-shrink-0">
                    <input
                      id={`qty-${item.key}`}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      className={`input text-right ${errors[item.key] ? 'border-red-500' : ''}`}
                      placeholder="0"
                      value={value}
                      onChange={(e) => handleQuantity(item.key, e.target.value)}
                    />
                    <span className="block text-right text-xs text-gray-500 mt-0.5">{(item.packUnit || 'units').toLowerCase()}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="label" htmlFor="entry-reference">
                {type === MOVEMENT_TYPES.DESPATCHED ? 'Customer / route / invoice' : 'Reference'} (optional)
              </label>
              <input
                id="entry-reference"
                className="input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="entry-note">Note (optional)</label>
              <input id="entry-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
          {message && (
            <p
              role="status"
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`btn w-full py-3 text-white ${
              type === MOVEMENT_TYPES.PACKED ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
            } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Saving...' : saveLabel}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Entries for {formatDay(date)}</h3>
          <button type="button" onClick={loadEntries} disabled={entriesLoading} className="btn btn-secondary text-sm">
            {entriesLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-gray-600">{entriesLoading ? 'Loading entries...' : 'No entries for this day yet.'}</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Item</th>
                    <th className="px-2 py-2 text-right font-medium text-gray-500">Packed</th>
                    <th className="px-2 py-2 text-right font-medium text-gray-500">Despatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {totals.map((total) => (
                    <tr key={total.itemKey}>
                      <td className="px-2 py-2">
                        <span className="font-medium text-gray-900">{total.code}</span>{' '}
                        <span className="text-gray-600">{groupName(total.group)}</span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-green-700">{total.packed || '–'}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-purple-700">{total.despatched || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-gray-100 border-t border-gray-100">
              {entries.map((entry) => (
                <li key={entry.entryId} className={`py-2 flex items-start gap-3 ${entry.cancelled ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0 text-sm">
                    <p className={entry.cancelled ? 'line-through' : ''}>
                      <span className={`badge mr-1 ${entry.type === MOVEMENT_TYPES.PACKED ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                        {TYPES[entry.type]?.label || entry.type}
                      </span>
                      <span className="font-semibold">{entry.units}</span> x {entry.code}{' '}
                      <span className="text-gray-600">{groupName(entry.group)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[entry.enteredAt.slice(11), entry.enteredBy, entry.reference, entry.note, entry.cancelled && 'Cancelled']
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {!entry.cancelled && (
                    <button
                      type="button"
                      onClick={() => handleCancel(entry)}
                      disabled={cancellingId === entry.entryId}
                      className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1"
                    >
                      {cancellingId === entry.entryId ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
