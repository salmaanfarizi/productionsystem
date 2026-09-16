import React, { useState, useEffect } from 'react';
import { isStoreSyncMissing } from '@shared/utils/storeUpdate';
import {
  NO_PRODUCTION,
  SACK_KG,
  SALT_BAG_KG,
  sacksToTonnes,
  loadProductionMonth,
  loadSeedUseMonth,
  loadProductionCheck
} from '@shared/utils/productionLog';

const formatMonth = (month) =>
  month ? new Date(`${month}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '';

const formatDay = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });

const qty = (value, places = 0) =>
  value === null || value === undefined || value === 0
    ? '–'
    : value.toLocaleString(undefined, { maximumFractionDigits: places });

const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] || 0), 0);

const RESULT_STYLES = {
  Match: 'bg-green-100 text-green-800',
  Different: 'bg-red-100 text-red-800',
  'Not on production sheet': 'bg-amber-100 text-amber-800'
};

export default function ProductionMonth({ refreshTrigger }) {
  const [month, setMonth] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData(month);
  }, [month, refreshTrigger]);

  const loadData = async (wanted) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadProductionMonth(wanted);
      const [seedUse, checks] = result.month
        ? await Promise.all([loadSeedUseMonth(result.month), loadProductionCheck().catch(() => [])])
        : [[], []];
      setData({ ...result, seedUse, checks: checks.filter((check) => check.date.startsWith(result.month)) });
    } catch (err) {
      console.error('Error loading the production month:', err);
      setError(isStoreSyncMissing(err) ? 'missing' : 'failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.month) {
    return (
      <div className="card text-center py-10">
        <h3 className="text-lg font-semibold text-gray-900">
          {error === 'failed' ? 'Could not load production' : 'No production days yet'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          {error === 'failed'
            ? 'Check the internet connection and try again.'
            : 'Ask the admin to turn on the production sync and run its setup.'}
        </p>
        {error === 'failed' && (
          <button onClick={() => loadData(month)} className="btn btn-secondary mt-4">Try Again</button>
        )}
      </div>
    );
  }

  const { days, seedUse, checks, months } = data;
  const productionDays = days.filter((day) => day.sacks > 0 && day.shift !== NO_PRODUCTION).length;
  const totalSacks = sum(days, 'sacks');
  const saltBags = sum(days, 'saltBags');
  const wasteKg = sum(days, 'wasteKg');
  const wasteSacks = days.filter((day) => day.wasteKg).reduce((total, day) => total + (day.wasteSacks || 0), 0);
  const dieselDays = days.filter((day) => day.dieselLitres).length;
  const tenKgSplit = days.some((day) => day.prm10Tonnes || day.std10Tonnes || day.eco10Tonnes);
  const fromApp = days.some((day) => day.source === 'App');
  const syncedAt = days.find((day) => day.syncedAt)?.syncedAt;

  const byLine = {};
  seedUse.forEach((use) => {
    const entry = byLine[use.lineId || use.label] || (byLine[use.lineId || use.label] = { label: use.label, sacks: 0 });
    entry.sacks += use.sacks;
  });
  const lines = Object.values(byLine).sort((a, b) => b.sacks - a.sacks);

  const destinations = [
    { name: 'Regular', tonnes: sum(days, 'regularTonnes') },
    { name: 'Riyadh', tonnes: sum(days, 'riyadhTonnes') },
    ...(tenKgSplit
      ? [
          { name: '10 kg Premium', tonnes: sum(days, 'prm10Tonnes') },
          { name: '10 kg Standard', tonnes: sum(days, 'std10Tonnes') },
          { name: '10 kg Eco', tonnes: sum(days, 'eco10Tonnes') }
        ]
      : []),
    { name: tenKgSplit ? '10 kg total' : '10 kg', tonnes: sum(days, 'tenKgTonnes') }
  ];
  const checkCounts = checks.reduce((counts, check) => ({ ...counts, [check.result]: (counts[check.result] || 0) + 1 }), {});

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Printed page header */}
      <div className="hidden print:block">
        <p className="text-sm font-semibold">ARS INTERNATIONAL CO SPC</p>
        <h2 className="text-lg font-bold">ROASTED SUNFLOWER PRODUCTION REPORT - {formatMonth(data.month).toUpperCase()}</h2>
        <p className="text-xs text-gray-600">
          {fromApp ? 'From the Production app' : 'From the daily production sheet'}{syncedAt && <> · synced {syncedAt}</>}
        </p>
      </div>

      <div className="card print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Production - {formatMonth(data.month)}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {fromApp ? 'Includes days entered in the app' : 'From the daily production sheet'}
              {syncedAt && <> · synced {syncedAt}</>}
            </p>
          </div>
          <div className="flex items-end gap-2 sm:w-72">
            <button type="button" onClick={() => window.print()} className="btn btn-secondary whitespace-nowrap">
              Print
            </button>
            <div className="flex-1">
              <label className="label" htmlFor="production-month">Month</label>
              <select
                id="production-month"
                className="input"
                value={data.month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {months.map((m) => <option key={m} value={m}>{formatMonth(m)}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 print:grid-cols-4">
        <div className="card print:shadow-none print:border">
          <p className="text-xs sm:text-sm text-gray-600">Production days</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{productionDays}</p>
        </div>
        <div className="card print:shadow-none print:border">
          <p className="text-xs sm:text-sm text-gray-600">Seed used</p>
          <p className="text-xl sm:text-3xl font-bold text-green-700">{qty(sacksToTonnes(totalSacks), 3)} t</p>
          <p className="text-xs text-gray-500">{totalSacks.toLocaleString()} sacks of {SACK_KG} kg</p>
        </div>
        <div className="card print:shadow-none print:border">
          <p className="text-xs sm:text-sm text-gray-600">Salt</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{qty(saltBags, 1)} bags</p>
          <p className="text-xs text-gray-500">{qty((saltBags * SALT_BAG_KG) / 1000, 2)} t</p>
        </div>
        <div className="card print:shadow-none print:border">
          <p className="text-xs sm:text-sm text-gray-600">Waste</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{qty(wasteKg, 1)} kg</p>
          <p className="text-xs text-gray-500">
            {wasteSacks ? `${(wasteKg / wasteSacks).toFixed(2)} kg per sack · ${((wasteKg / (wasteSacks * SACK_KG)) * 100).toFixed(1)}%` : 'Not measured'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card print:shadow-none print:break-inside-avoid">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Seed used by line</h3>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-500">Seed</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Sacks</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Tonnes</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line) => (
                <tr key={line.label}>
                  <td className="px-2 py-1.5 text-gray-900">{line.label}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{line.sacks.toLocaleString()}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{qty(sacksToTonnes(line.sacks), 3)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                    {totalSacks ? `${Math.round((line.sacks / totalSacks) * 100)}%` : '–'}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="px-2 py-1.5">Total</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{totalSacks.toLocaleString()}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qty(sacksToTonnes(totalSacks), 3)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card print:shadow-none print:break-inside-avoid space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Where the seed went</h3>
            <ul className="text-sm divide-y divide-gray-100">
              {destinations.map((d) => (
                <li key={d.name} className="flex justify-between py-1.5">
                  <span className="text-gray-700">{d.name}</span>
                  <span className="tabular-nums font-medium">{d.tonnes ? `${qty(d.tonnes, 3)} t` : '–'}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Utilities</h3>
            <ul className="text-sm divide-y divide-gray-100">
              <li className="flex justify-between py-1.5">
                <span className="text-gray-700">Diesel received</span>
                <span className="tabular-nums font-medium">
                  {qty(sum(days, 'dieselLitres'))} L{dieselDays ? ` (${dieselDays} deliveries)` : ''}
                </span>
              </li>
              <li className="flex justify-between py-1.5">
                <span className="text-gray-700">Waste water trips (big / small)</span>
                <span className="tabular-nums font-medium">{sum(days, 'wwBig')} / {sum(days, 'wwSmall')}</span>
              </li>
              <li className="flex justify-between py-1.5">
                <span className="text-gray-700">Overtime hours</span>
                <span className="tabular-nums font-medium">{qty(sum(days, 'otHours'), 1)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {checks.length > 0 && (
        <div className={`card border print:hidden ${checkCounts.Different || checkCounts['Not on production sheet'] ? 'border-amber-300' : 'border-green-300'}`}>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">App entries vs production sheet</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 mb-3">
            {checkCounts.Match || 0} matching, {checkCounts.Different || 0} different, {checkCounts['Not on production sheet'] || 0} not on the sheet
          </p>
          <ul className="divide-y divide-gray-100 text-sm">
            {checks.map((check) => (
              <li key={check.date} className="py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="w-24 font-medium text-gray-900">{formatDay(check.date)}</span>
                <span className={`badge ${RESULT_STYLES[check.result] || 'bg-gray-100 text-gray-700'} w-fit`}>{check.result}</span>
                <span className="text-gray-600">
                  Sacks {qty(check.sheetSacks)} / {qty(check.appSacks)} · salt {qty(check.sheetSalt, 1)} / {qty(check.appSalt, 1)}
                  {check.differences && <> · {check.differences}</>}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">Sheet / app. Numbers must match for several days before switching off the sheet.</p>
        </div>
      )}

      <div className="card print:shadow-none print:p-0">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Day by day</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm print:text-[10px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-500">Day</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">Shift</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Sacks</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Tonnes</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Salt</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Riyadh t</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">10 kg t</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Diesel L</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">WW</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">Waste kg</th>
                <th className="px-2 py-2 text-right font-medium text-gray-500">kg/sack</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {days.map((day) => (
                <tr key={day.date} className={day.shift === NO_PRODUCTION ? 'bg-gray-50 text-gray-500' : ''}>
                  <td className="px-2 py-1.5 whitespace-nowrap font-medium">{formatDay(day.date)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {day.shift || '–'}
                    {day.source === 'App' && <span className="badge badge-info ml-1 print:hidden">App</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{qty(day.sacks)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{qty(day.tonnes, 3)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{qty(day.saltBags, 1)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{qty(day.riyadhTonnes, 3)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{qty(day.tenKgTonnes, 3)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{qty(day.dieselLitres)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {day.wwBig || day.wwSmall ? `${day.wwBig || 0}/${day.wwSmall || 0}` : '–'}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{qty(day.wasteKg, 1)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{day.wastePerSack ? day.wastePerSack.toFixed(2) : '–'}</td>
                  <td className="px-2 py-1.5 text-gray-600">{day.note}</td>
                </tr>
              ))}
              <tr className="font-semibold border-t-2 border-gray-300">
                <td className="px-2 py-1.5" colSpan={2}>Total</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qty(totalSacks)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qty(sacksToTonnes(totalSacks), 3)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qty(saltBags, 1)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qty(sum(days, 'riyadhTonnes'), 3)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qty(sum(days, 'tenKgTonnes'), 3)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qty(sum(days, 'dieselLitres'))}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{sum(days, 'wwBig')}/{sum(days, 'wwSmall')}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qty(wasteKg, 1)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{wasteSacks ? (wasteKg / wasteSacks).toFixed(2) : '–'}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
