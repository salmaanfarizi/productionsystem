import React, { useState, useEffect } from 'react';
import { loadStaff, loadMachines, loadDayLog } from '@shared/utils/dayLog';
import { machineHours, staffHours } from '@shared/utils/workHours';

const formatHours = (value) => (value === null || value === undefined ? '–' : value.toFixed(2));

/**
 * Machine work log and staff hours for one store day (from the Packing app's Day Log).
 * @param {string} date
 * @param {Array<Object>} rows - the day's store update rows (for units produced per machine)
 */
export default function DayLogSummary({ date, rows }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    Promise.all([loadDayLog(date), loadStaff(), loadMachines()])
      .then(([log, staff, machines]) => {
        // Only the people in the saved day, including anyone marked inactive since
        if (!cancelled) setData({ log, staff: log ? staff.filter((p) => log.staff[p.name]) : [], machines });
      })
      .catch(() => {
        // The Day Log tabs don't exist until the store sync setup adds them
        if (!cancelled) setData({ log: null });
      });
    return () => { cancelled = true; };
  }, [date]);

  if (!data || !data.log || data.log.holiday) return null;

  const { log, staff, machines } = data;
  const codesOf = Object.fromEntries(machines.map((m) => [m.machine, m.codes]));
  const unitsOf = (machine) => rows
    .filter((row) => (codesOf[machine] || []).includes(row.code))
    .reduce((sum, row) => sum + (row.production || 0), 0);
  const hours = staffHours(date, staff, log.machines, log.staff).filter((row) => !row.absent);
  const totals = hours.reduce(
    (sum, row) => ({ machine: sum.machine + row.machineHours, standard: sum.standard + row.standard }),
    { machine: 0, standard: 0 }
  );

  return (
    <div className="card print:shadow-none print:p-0 print:break-inside-avoid">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Machine work log</h3>
        <p className="text-xs text-gray-500">Saved {log.enteredAt} by {log.enteredBy}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Machine</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500">Units</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Start</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">End</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500">Hours</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Who worked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {log.machines.map((m) => (
              <tr key={m.machine}>
                <td className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap">{m.machine}</td>
                <td className="px-2 py-2 text-right tabular-nums">{unitsOf(m.machine).toLocaleString()}</td>
                <td className="px-2 py-2 tabular-nums">{m.start || '–'}</td>
                <td className="px-2 py-2 tabular-nums">{m.end || '–'}</td>
                <td className="px-2 py-2 text-right tabular-nums">{formatHours(machineHours(m.start, m.end))}</td>
                <td className="px-2 py-2 text-gray-700">{m.workers.join(', ') || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Staff</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500">Machine hrs</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500">Standard</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500">Balance</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hours.map((row) => (
              <tr key={row.name}>
                <td className="px-2 py-2 text-gray-900 whitespace-nowrap">{row.name} ({row.type})</td>
                <td className="px-2 py-2 text-right tabular-nums">{formatHours(row.machineHours)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{formatHours(row.standard)}</td>
                <td className={`px-2 py-2 text-right tabular-nums ${row.balance > 0.25 && !row.reason ? 'text-amber-700 font-semibold' : ''}`}>
                  {formatHours(row.balance)}
                </td>
                <td className="px-2 py-2 text-gray-700">{row.reason || '–'}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="px-2 py-2">Total</td>
              <td className="px-2 py-2 text-right tabular-nums">{formatHours(totals.machine)}</td>
              <td className="px-2 py-2 text-right tabular-nums">{formatHours(totals.standard)}</td>
              <td className="px-2 py-2 text-right tabular-nums">{formatHours(totals.standard - totals.machine)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
