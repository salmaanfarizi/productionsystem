import React, { useState, useEffect } from 'react';
import {
  loadStoreDay,
  loadItemMaster,
  isStoreSyncMissing,
  stockStatus,
  shortage,
  STORE_GROUPS,
  groupName
} from '@shared/utils/storeUpdate';

const STATUS_STYLES = {
  out: { label: 'Out of stock', badge: 'bg-red-100 text-red-800', row: 'bg-red-50' },
  critical: { label: 'Critical', badge: 'bg-orange-100 text-orange-800', row: 'bg-orange-50' },
  low: { label: 'Below min', badge: 'bg-yellow-100 text-yellow-800', row: 'bg-yellow-50' },
  ok: { label: 'OK', badge: 'bg-green-100 text-green-800', row: '' },
  'no-min': { label: 'No min', badge: 'bg-gray-100 text-gray-600', row: '' }
};

const BELOW_MIN = ['out', 'critical', 'low'];

const formatQty = (value) => (value === null ? '–' : value.toLocaleString());

const formatDay = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export default function StoreUpdate({ refreshTrigger, onUnavailable }) {
  const [selectedDate, setSelectedDate] = useState(null); // null = latest synced day
  const [day, setDay] = useState({ date: null, dates: [], rows: [] });
  const [itemsByKey, setItemsByKey] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState('all');
  const [search, setSearch] = useState('');
  const [belowMinOnly, setBelowMinOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dayData, itemMaster] = await Promise.all([loadStoreDay(selectedDate), loadItemMaster()]);
      setDay(dayData);
      if (!dayData.date) onUnavailable?.();
      setItemsByKey(Object.fromEntries(itemMaster.map((item) => [item.key, item])));
    } catch (err) {
      console.error('Error loading store update:', err);
      const missing = isStoreSyncMissing(err);
      setError(missing ? 'missing' : 'failed');
      if (missing) onUnavailable?.();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !day.date) {
    return (
      <div className="card text-center py-10">
        <h3 className="text-lg font-semibold text-gray-900">
          {error === 'failed' ? 'Could not load store data' : 'Store data is not available yet'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          {error === 'failed'
            ? 'Check the internet connection and try again.'
            : 'The store sync has not copied any days from the daily store sheet yet. Ask the admin to run the store sync setup.'}
        </p>
        {error === 'failed' && (
          <button onClick={loadData} className="btn btn-secondary mt-4">Try Again</button>
        )}
      </div>
    );
  }

  const rows = day.rows.map((row) => {
    const item = itemsByKey[row.itemKey];
    const need = shortage(row);
    return {
      ...row,
      displayName: item?.name || row.name,
      status: stockStatus(row),
      need,
      details: [
        row.minLevel ? `Min ${formatQty(row.minLevel)}` : null,
        need > 0 ? `need ${formatQty(need)}` : null,
        row.specificOrder ? `order ${formatQty(row.specificOrder)} ${row.orderStatus}`.trim() : null
      ].filter(Boolean)
    };
  });

  const summary = {
    belowMin: rows.filter((row) => BELOW_MIN.includes(row.status)).length,
    out: rows.filter((row) => row.status === 'out').length,
    produced: rows.filter((row) => row.production > 0).length,
    despatched: rows.filter((row) => row.despatch > 0).length
  };

  const query = search.trim().toLowerCase();
  const visible = rows.filter((row) =>
    (group === 'all' || row.group === group) &&
    (!belowMinOnly || BELOW_MIN.includes(row.status)) &&
    (!query || row.code.toLowerCase().includes(query) || row.displayName.toLowerCase().includes(query))
  );

  const groupsInDay = new Set(rows.map((row) => row.group));
  const groupKeys = [
    ...STORE_GROUPS.map((g) => g.key).filter((key) => groupsInDay.has(key)),
    ...[...groupsInDay].filter((key) => !STORE_GROUPS.some((g) => g.key === key))
  ];
  const sections = groupKeys
    .map((key) => ({ key, rows: visible.filter((row) => row.group === key) }))
    .filter((section) => section.rows.length > 0);

  const syncedAt = rows.find((row) => row.syncedAt)?.syncedAt;
  const absentees = rows.find((row) => row.absentees)?.absentees;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Day picker */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Store update — {formatDay(day.date)}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              From the daily store sheet
              {syncedAt && <> · synced {syncedAt}</>}
              {absentees && <> · absentees {absentees}</>}
            </p>
          </div>
          <div className="sm:w-56">
            <label className="label" htmlFor="store-day">Day</label>
            <select
              id="store-day"
              className="input"
              value={day.date}
              onChange={(e) => setSelectedDate(e.target.value === day.dates[0] ? null : e.target.value)}
            >
              {day.dates.map((date) => (
                <option key={date} value={date}>{formatDay(date)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <button
          onClick={() => setBelowMinOnly(!belowMinOnly)}
          className={`card text-left ${belowMinOnly ? 'ring-2 ring-red-400' : ''}`}
        >
          <p className="text-xs sm:text-sm text-gray-600">Below minimum</p>
          <p className="text-xl sm:text-3xl font-bold text-red-700">{summary.belowMin}</p>
        </button>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600">Out of stock</p>
          <p className="text-xl sm:text-3xl font-bold text-red-800">{summary.out}</p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600">Items produced</p>
          <p className="text-xl sm:text-3xl font-bold text-green-700">{summary.produced}</p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600">Items despatched</p>
          <p className="text-xl sm:text-3xl font-bold text-purple-700">{summary.despatched}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 sm:items-end">
          <div>
            <label className="label" htmlFor="store-group">Group</label>
            <select id="store-group" className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="all">All groups</option>
              {groupKeys.map((key) => (
                <option key={key} value={key}>{groupName(key)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="store-search">Search</label>
            <input
              id="store-search"
              className="input"
              type="search"
              placeholder="Code or item name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:pb-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              checked={belowMinOnly}
              onChange={(e) => setBelowMinOnly(e.target.checked)}
            />
            Below minimum only
          </label>
        </div>
      </div>

      {sections.length === 0 && (
        <div className="card text-center py-8 text-sm text-gray-600">No items match these filters.</div>
      )}

      {sections.map((section) => (
        <div key={section.key} className="card">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
            {groupName(section.key)} <span className="text-sm font-normal text-gray-500">({section.rows.length})</span>
          </h3>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {section.rows.map((row) => (
              <div key={row.sourceRow} className={`p-3 rounded-lg border border-gray-200 ${STATUS_STYLES[row.status].row}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{row.code}</p>
                    <p className="text-xs text-gray-600 break-words">{row.displayName}</p>
                  </div>
                  <span className={`badge ${STATUS_STYLES[row.status].badge} flex-shrink-0`}>{STATUS_STYLES[row.status].label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-2 text-xs text-center">
                  <div><p className="text-gray-500">Open</p><p className="font-medium">{formatQty(row.opening)}</p></div>
                  <div><p className="text-gray-500">Prod</p><p className="font-medium text-green-700">{formatQty(row.production)}</p></div>
                  <div><p className="text-gray-500">Desp</p><p className="font-medium text-purple-700">{formatQty(row.despatch)}</p></div>
                  <div><p className="text-gray-500">Close</p><p className="font-bold">{formatQty(row.closing)}</p></div>
                </div>
                {row.details.length > 0 && (
                  <p className="text-xs text-gray-600 mt-2">{row.details.join(' · ')}</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Code</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Item</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Opening</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Production</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Despatch</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Closing</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Min</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Need</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {section.rows.map((row) => (
                  <tr key={row.sourceRow} className={STATUS_STYLES[row.status].row}>
                    <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{row.code}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {row.displayName}
                      {row.specificOrder ? (
                        <span className="badge bg-blue-100 text-blue-800 ml-2">
                          Order {formatQty(row.specificOrder)}{row.orderStatus && ` · ${row.orderStatus}`}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatQty(row.opening)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-green-700">{formatQty(row.production)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-purple-700">{formatQty(row.despatch)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatQty(row.closing)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600">{formatQty(row.minLevel)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.need > 0 ? formatQty(row.need) : '–'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`badge ${STATUS_STYLES[row.status].badge}`}>{STATUS_STYLES[row.status].label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
