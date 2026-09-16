import React, { useState, useEffect } from 'react';
import {
  loadMaterialStock,
  isStoreSyncMissing,
  categoriesOf,
  ATTENTION_STATUSES
} from '@shared/utils/materials';

const STATUS_STYLES = {
  'Reorder now': { badge: 'bg-red-100 text-red-800', row: 'bg-red-50' },
  'Check count': { badge: 'bg-red-100 text-red-800', row: 'bg-red-50' },
  'Plan reorder': { badge: 'bg-amber-100 text-amber-800', row: 'bg-amber-50' },
  Healthy: { badge: 'bg-green-100 text-green-800', row: '' },
  'No recent use': { badge: 'bg-gray-100 text-gray-700', row: '' },
  'No count': { badge: 'bg-gray-100 text-gray-700', row: '' }
};

const STATUS_ORDER = ['Check count', 'Reorder now', 'Plan reorder', 'No count', 'Healthy', 'No recent use'];

const styleOf = (status) => STATUS_STYLES[status] || STATUS_STYLES['No count'];

const formatQty = (value) => (value === null || value === undefined ? '–' : value.toLocaleString());

const formatDay = (isoDate) =>
  isoDate
    ? new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '–';

export default function MaterialStockView({ refreshTrigger }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [attentionOnly, setAttentionOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      setStock(await loadMaterialStock());
    } catch (err) {
      console.error('Error loading material stock:', err);
      setError(isStoreSyncMissing(err) ? 'missing' : 'failed');
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

  if (error || stock.length === 0) {
    return (
      <div className="card text-center py-10">
        <h3 className="text-lg font-semibold text-gray-900">
          {error === 'failed' ? 'Could not load material stock' : 'Material stock is not available yet'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          {error === 'failed'
            ? 'Check the internet connection and try again.'
            : 'Ask the admin to update the store sync script and run its setup again.'}
        </p>
        {error === 'failed' && (
          <button onClick={loadData} className="btn btn-secondary mt-4">Try Again</button>
        )}
      </div>
    );
  }

  const summary = {
    reorder: stock.filter((row) => row.status === 'Reorder now').length,
    plan: stock.filter((row) => row.status === 'Plan reorder').length,
    check: stock.filter((row) => row.status === 'Check count').length,
    noCount: stock.filter((row) => row.status === 'No count').length
  };

  const query = search.trim().toLowerCase();
  const visible = stock
    .filter((row) =>
      (category === 'all' || row.category === category) &&
      (!attentionOnly || ATTENTION_STATUSES.includes(row.status)) &&
      (!query || row.id.toLowerCase().includes(query) || row.name.toLowerCase().includes(query) || String(row.code).includes(query))
    )
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9));

  const categories = categoriesOf(stock);
  const sections = categories
    .map((name) => ({ name, rows: visible.filter((row) => row.category === name) }))
    .filter((section) => section.rows.length > 0);
  const updatedAt = stock.find((row) => row.updatedAt)?.updatedAt;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Packing materials</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Last count + deliveries − use from the daily store sheet
          {updatedAt && <> · updated {updatedAt}</>}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <button
          onClick={() => setAttentionOnly(!attentionOnly)}
          className={`card text-left ${attentionOnly ? 'ring-2 ring-red-400' : ''}`}
        >
          <p className="text-xs sm:text-sm text-gray-600">Reorder now</p>
          <p className="text-xl sm:text-3xl font-bold text-red-700">{summary.reorder}</p>
        </button>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600">Plan reorder</p>
          <p className="text-xl sm:text-3xl font-bold text-amber-700">{summary.plan}</p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600">Check count</p>
          <p className="text-xl sm:text-3xl font-bold text-red-800">{summary.check}</p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600">Never counted</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-700">{summary.noCount}</p>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 sm:items-end">
          <div>
            <label className="label" htmlFor="material-category">Category</label>
            <select id="material-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="material-search">Search</label>
            <input
              id="material-search"
              className="input"
              type="search"
              placeholder="ID, code or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:pb-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              checked={attentionOnly}
              onChange={(e) => setAttentionOnly(e.target.checked)}
            />
            Needs attention only
          </label>
        </div>
      </div>

      {sections.length === 0 && (
        <div className="card text-center py-8 text-sm text-gray-600">No materials match these filters.</div>
      )}

      {sections.map((section) => (
        <div key={section.name} className="card">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
            {section.name} <span className="text-sm font-normal text-gray-500">({section.rows.length})</span>
          </h3>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {section.rows.map((row) => (
              <div key={row.id} className={`p-3 rounded-lg border border-gray-200 ${styleOf(row.status).row}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 break-words">{row.name}</p>
                    <p className="text-xs text-gray-500">{[row.id, row.code].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={`badge ${styleOf(row.status).badge} flex-shrink-0`}>{row.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 text-xs text-center">
                  <div><p className="text-gray-500">Balance</p><p className="font-bold">{formatQty(row.balance)}</p></div>
                  <div><p className="text-gray-500">Per day</p><p className="font-medium">{formatQty(row.avgDaily)}</p></div>
                  <div><p className="text-gray-500">Days left</p><p className="font-medium">{formatQty(row.daysLeft)}</p></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {row.unit.toLowerCase()} · counted {formatDay(row.countDate)}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Material</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Balance</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Per day</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Days left</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Last count</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500" title="Used in the last 30 store days, and what the per-item list expects from packing">
                    Used / expected (30 days)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {section.rows.map((row) => (
                  <tr key={row.id} className={styleOf(row.status).row}>
                    <td className="px-3 py-2">
                      <span className="font-medium text-gray-900">{row.name}</span>
                      <span className="block text-xs text-gray-500">{[row.id, row.code, row.unit.toLowerCase()].filter(Boolean).join(' · ')}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatQty(row.balance)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600">{formatQty(row.avgDaily)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatQty(row.daysLeft)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`badge ${styleOf(row.status).badge}`}>{row.status}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">{formatDay(row.countDate)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                      {formatQty(row.used30)} / {formatQty(row.expected30)}
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
