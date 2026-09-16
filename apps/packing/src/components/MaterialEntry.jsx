import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@shared/utils/dateUtils';
import {
  MATERIAL_TYPES,
  isStoreSyncMissing,
  loadMaterialMaster,
  loadMaterialStock,
  loadMaterialMovements,
  addMaterialMovements,
  cancelMaterialMovement,
  categoriesOf
} from '@shared/utils/materials';

const NAME_KEY = 'storeEntryName';

const TYPES = {
  [MATERIAL_TYPES.RECEIVED]: { label: 'Received', verb: 'received', hint: 'A delivery came into the store' },
  [MATERIAL_TYPES.COUNT]: { label: 'Stock count', verb: 'counted', hint: 'What is on the shelf at the end of the day' }
};

const REORDER_STATUSES = ['Reorder now', 'Check count'];

const formatDay = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const formatQty = (value) => (value === null || value === undefined ? '–' : value.toLocaleString());

function readSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

export default function MaterialEntry({ authHelper }) {
  const today = getLocalDateString();
  const [type, setType] = useState(MATERIAL_TYPES.RECEIVED);
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState('');
  const [enteredBy, setEnteredBy] = useState(readSavedName);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  // Keyed by `${type}|${materialId}` so received and counted numbers never mix
  const [quantities, setQuantities] = useState({});
  const [materials, setMaterials] = useState([]);
  const [stockById, setStockById] = useState({});
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
      const [materialMaster, stock] = await Promise.all([loadMaterialMaster(), loadMaterialStock()]);
      const active = materialMaster.filter((material) => material.active);
      setMaterials(active);
      setStockById(Object.fromEntries(stock.map((row) => [row.id, row])));
      setCategory((current) => current || categoriesOf(active)[0] || '');
      setStatus('ready');
    } catch (error) {
      console.error('Error loading materials:', error);
      setStatus(isStoreSyncMissing(error) ? 'missing' : 'failed');
    }
  };

  const loadEntries = async () => {
    setEntriesLoading(true);
    try {
      setEntries(await loadMaterialMovements(date, authHelper.getAccessToken()));
    } catch (error) {
      console.error('Error loading material entries:', error);
      if (isStoreSyncMissing(error)) {
        setStatus('missing');
      } else {
        setMessage({ type: 'error', text: `Could not load the entries: ${error.message}` });
      }
    } finally {
      setEntriesLoading(false);
    }
  };

  const quantityKey = (materialId) => `${type}|${materialId}`;

  const filledLines = materials
    .map((material) => ({ material, raw: (quantities[quantityKey(material.id)] || '').trim() }))
    .filter((line) => line.raw !== '');

  const handleQuantity = (materialId, value) => {
    setQuantities((prev) => ({ ...prev, [quantityKey(materialId)]: value }));
    if (errors[materialId] || errors.form) {
      setErrors((prev) => ({ ...prev, [materialId]: undefined, form: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    const lines = [];
    filledLines.forEach(({ material, raw }) => {
      const qty = Number(raw);
      const decimalsOk = /^\d+(\.\d{1,2})?$/.test(raw);
      if (!decimalsOk || Number.isNaN(qty)) {
        nextErrors[material.id] = 'Enter a number (up to 2 decimals)';
      } else if (type === MATERIAL_TYPES.RECEIVED && qty <= 0) {
        nextErrors[material.id] = 'Enter a quantity above 0';
      } else {
        lines.push({ material, qty });
      }
    });
    if (!enteredBy.trim()) nextErrors.enteredBy = 'Enter your name';
    if (!date || date > today) nextErrors.date = 'Pick today or an earlier day';
    if (filledLines.length === 0) nextErrors.form = 'Enter a quantity for at least one material';

    const firstBad = materials.find((material) => nextErrors[material.id]);
    if (firstBad && firstBad.category !== category) setCategory(firstBad.category);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    setMessage(null);
    try {
      const count = await addMaterialMovements(
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
        lines.forEach(({ material }) => delete next[quantityKey(material.id)]);
        return next;
      });
      setReference('');
      setNote('');
      setMessage({
        type: 'success',
        text: `Saved ${count} material(s) as ${TYPES[type].verb} for ${formatDay(date)}. Balances update within the hour.`
      });
      await loadEntries();
    } catch (error) {
      console.error('Error saving material entry:', error);
      setMessage({ type: 'error', text: error.message || 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (entry) => {
    const label = `${formatQty(entry.qty)} ${entry.unit} ${entry.name} (${TYPES[entry.type]?.verb || entry.type})`;
    if (!window.confirm(`Cancel this entry?\n${label}`)) return;

    setCancellingId(entry.entryId);
    setMessage(null);
    try {
      await cancelMaterialMovement(entry.entryId, authHelper.getAccessToken());
      await loadEntries();
    } catch (error) {
      console.error('Error cancelling material entry:', error);
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
          {status === 'missing' ? 'Material stock is not set up yet' : 'Could not load the materials'}
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

  const categories = categoriesOf(materials);
  const visible = materials.filter((material) => material.category === category);
  const filledIn = (name) => filledLines.filter((line) => line.material.category === name).length;
  const filledCount = filledLines.length;
  const saveLabel = filledCount === 0
    ? `Save as ${TYPES[type].verb}`
    : `Save ${filledCount} ${filledCount === 1 ? 'material' : 'materials'} as ${TYPES[type].verb}`;

  const needsReorder = materials
    .map((material) => ({ material, stock: stockById[material.id] }))
    .filter(({ stock }) => stock && REORDER_STATUSES.includes(stock.status))
    .sort((a, b) => (a.stock.daysLeft ?? -1) - (b.stock.daysLeft ?? -1));
  const notCounted = materials.filter((material) => stockById[material.id]?.status === 'No count').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {(needsReorder.length > 0 || notCounted > 0) && (
        <div className="card border border-amber-300">
          <h3 className="text-base font-bold text-gray-900">Needs attention</h3>
          {needsReorder.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-100 text-sm">
              {needsReorder.map(({ material, stock }) => (
                <li key={material.id} className="py-1.5 flex justify-between gap-3">
                  <span className="text-gray-800">{material.name}</span>
                  <span className={`whitespace-nowrap font-medium ${stock.status === 'Check count' ? 'text-red-700' : 'text-amber-700'}`}>
                    {stock.status === 'Check count'
                      ? 'Check count'
                      : `${formatQty(stock.balance)} left · ${formatQty(stock.daysLeft)} days`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {notCounted > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {notCounted} material(s) have never been counted - enter a stock count to start their balance.
            </p>
          )}
        </div>
      )}

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
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
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
              <label className="label" htmlFor="material-date">Date</label>
              <input
                id="material-date"
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
              <label className="label" htmlFor="material-name">Your name</label>
              <input
                id="material-name"
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
            <label className="label" htmlFor="material-category">Category</label>
            <select id="material-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}{filledIn(name) > 0 ? ` (${filledIn(name)} filled)` : ''}
                </option>
              ))}
            </select>
          </div>

          <ul className="divide-y divide-gray-100">
            {visible.map((material) => {
              const stock = stockById[material.id];
              const value = quantities[quantityKey(material.id)] || '';
              return (
                <li key={material.id} className="py-3 flex items-start gap-3">
                  <label htmlFor={`material-${material.id}`} className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">
                      {material.name} <span className="font-normal text-gray-500">{material.id}</span>
                    </span>
                    {material.size && <span className="block text-xs text-gray-600">{material.size}</span>}
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {!stock || stock.balance === null
                        ? 'Not counted yet'
                        : `Balance ${formatQty(stock.balance)}${stock.daysLeft !== null ? ` · ${formatQty(stock.daysLeft)} days` : ''}`}
                    </span>
                    {errors[material.id] && <span className="block text-xs text-red-600 mt-0.5">{errors[material.id]}</span>}
                  </label>
                  <div className="w-28 flex-shrink-0">
                    <input
                      id={`material-${material.id}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      className={`input text-right ${errors[material.id] ? 'border-red-500' : ''}`}
                      placeholder={type === MATERIAL_TYPES.COUNT ? 'count' : '0'}
                      value={value}
                      onChange={(e) => handleQuantity(material.id, e.target.value)}
                    />
                    <span className="block text-right text-xs text-gray-500 mt-0.5">{material.unit.toLowerCase()}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="label" htmlFor="material-reference">
                {type === MATERIAL_TYPES.RECEIVED ? 'Supplier / delivery note' : 'Reference'} (optional)
              </label>
              <input
                id="material-reference"
                className="input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="material-note">Note (optional)</label>
              <input id="material-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {type === MATERIAL_TYPES.COUNT && (
            <p className="text-xs text-gray-600">
              A count replaces the balance with what is on the shelf at the end of this day. Enter 0 for materials that have run out.
            </p>
          )}
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
            className={`btn btn-primary w-full py-3 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Saving...' : saveLabel}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Material entries for {formatDay(date)}</h3>
          <button type="button" onClick={loadEntries} disabled={entriesLoading} className="btn btn-secondary text-sm">
            {entriesLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-gray-600">{entriesLoading ? 'Loading entries...' : 'No material entries for this day yet.'}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <li key={entry.entryId} className={`py-2 flex items-start gap-3 ${entry.cancelled ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0 text-sm">
                  <p className={entry.cancelled ? 'line-through' : ''}>
                    <span className={`badge mr-1 ${entry.type === MATERIAL_TYPES.COUNT ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                      {TYPES[entry.type]?.label || entry.type}
                    </span>
                    <span className="font-semibold">{formatQty(entry.qty)}</span> {entry.unit.toLowerCase()} · {entry.name}
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
        )}
      </div>
    </div>
  );
}
