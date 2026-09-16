import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@shared/utils/dateUtils';
import {
  STORE_GROUPS,
  groupName,
  isStoreSyncMissing,
  loadItemMaster,
  loadStoreDay
} from '@shared/utils/storeUpdate';
import { ORDER_STATUS, loadOrders, addOrder, setOrderStatus } from '@shared/utils/orders';

const NAME_KEY = 'storeEntryName';
const CLOSED_DAYS_SHOWN = 14;

const formatDay = (isoDate) =>
  isoDate
    ? new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : '–';

function daysBetween(fromIso, toIso) {
  return Math.round((new Date(`${toIso}T00:00:00Z`) - new Date(`${fromIso}T00:00:00Z`)) / 86400000);
}

const dayCount = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;

function readSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

const EMPTY_FORM = { group: 'REG', itemKey: '', qty: '', deliverBy: '', customer: '', note: '' };

export default function StoreOrders({ authHelper }) {
  const today = getLocalDateString();
  const [form, setForm] = useState(EMPTY_FORM);
  const [enteredBy, setEnteredBy] = useState(readSavedName);
  const [items, setItems] = useState([]);
  const [stock, setStock] = useState({ date: null, byKey: {} });
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | failed
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setStatus((current) => (current === 'ready' ? current : 'loading'));
    try {
      const [itemMaster, lastDay, allOrders] = await Promise.all([
        loadItemMaster(),
        loadStoreDay().catch(() => ({ date: null, rows: [] })),
        loadOrders(authHelper.getAccessToken())
      ]);
      setItems(itemMaster.filter((item) => item.active));
      setStock({
        date: lastDay.date,
        byKey: Object.fromEntries(lastDay.rows.map((row) => [row.itemKey, row.closing]))
      });
      setOrders(allOrders);
      setStatus('ready');
    } catch (error) {
      console.error('Error loading orders:', error);
      setStatus(isStoreSyncMissing(error) ? 'missing' : 'failed');
    }
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value, ...(field === 'group' ? { itemKey: '' } : {}) }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    const qty = Number(form.qty);
    if (!form.itemKey) nextErrors.itemKey = 'Choose an item';
    if (!Number.isInteger(qty) || qty <= 0) nextErrors.qty = 'Enter a whole number above 0';
    if (!form.deliverBy) nextErrors.deliverBy = 'Choose the delivery date';
    else if (form.deliverBy < today) nextErrors.deliverBy = 'The delivery date is in the past';
    if (!enteredBy.trim()) nextErrors.enteredBy = 'Enter your name';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setMessage(null);
    try {
      const item = items.find((candidate) => candidate.key === form.itemKey);
      await addOrder({
        item,
        qty,
        deliverBy: form.deliverBy,
        customer: form.customer.trim(),
        note: form.note.trim(),
        enteredOn: today,
        enteredBy: enteredBy.trim()
      }, authHelper.getAccessToken());
      try {
        localStorage.setItem(NAME_KEY, enteredBy.trim());
      } catch {
        // Name is only remembered for convenience
      }
      setForm((prev) => ({ ...EMPTY_FORM, group: prev.group }));
      setMessage({ type: 'success', text: `Order saved: ${qty} x ${item.code} ${groupName(item.group)} by ${formatDay(form.deliverBy)}.` });
      await loadData();
    } catch (error) {
      console.error('Error saving order:', error);
      setMessage({ type: 'error', text: error.message || 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (order, nextStatus) => {
    const verb = nextStatus === ORDER_STATUS.MET ? 'Mark as met' : 'Cancel';
    if (!window.confirm(`${verb}: ${order.qty.toLocaleString()} x ${order.code} ${groupName(order.group)}?`)) return;
    setUpdatingId(order.orderId);
    setMessage(null);
    try {
      await setOrderStatus(order.orderId, nextStatus, today, authHelper.getAccessToken());
      await loadData();
    } catch (error) {
      console.error('Error updating order:', error);
      setMessage({ type: 'error', text: error.message || 'Could not update. Please try again.' });
    } finally {
      setUpdatingId(null);
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
          {status === 'missing' ? 'Orders are not set up yet' : 'Could not load the orders'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          {status === 'missing'
            ? 'Ask the admin to update the store sync script and run its setup again.'
            : 'Check the internet connection and try again.'}
        </p>
        {status === 'failed' && (
          <button onClick={loadData} className="btn btn-secondary mt-4">Try Again</button>
        )}
      </div>
    );
  }

  const groups = STORE_GROUPS.filter((g) => items.some((item) => item.group === g.key));
  const groupItems = items.filter((item) => item.group === form.group);
  const open = orders
    .filter((order) => order.status === ORDER_STATUS.PENDING)
    .sort((a, b) => (a.deliverBy || '9999') < (b.deliverBy || '9999') ? -1 : 1);
  const closed = orders
    .filter((order) => order.status !== ORDER_STATUS.PENDING && order.statusDate &&
      daysBetween(order.statusDate, today) <= CLOSED_DAYS_SHOWN)
    .sort((a, b) => (a.statusDate < b.statusDate ? 1 : -1));

  // Stock is shared by all open orders of the same item, earliest delivery first
  const remaining = { ...stock.byKey };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Open orders ({open.length})</h3>
          <button type="button" onClick={loadData} className="btn btn-secondary text-sm">Refresh</button>
        </div>
        {open.length === 0 ? (
          <p className="text-sm text-gray-600">No open orders.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {open.map((order) => {
              const daysLeft = order.deliverBy ? daysBetween(today, order.deliverBy) : null;
              const available = remaining[order.itemKey];
              const short = available === undefined || available === null ? null : Math.max(0, order.qty - available);
              if (available !== undefined && available !== null) {
                remaining[order.itemKey] = Math.max(0, available - order.qty);
              }
              return (
                <li key={order.orderId} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0 text-sm">
                    <p>
                      <span className="font-semibold">{order.qty.toLocaleString()} x {order.code}</span>{' '}
                      <span className="text-gray-600">{groupName(order.group)}</span>
                      {order.customer && <span className="text-gray-600"> · {order.customer}</span>}
                    </p>
                    <p className="text-xs text-gray-500 break-words">{order.name}</p>
                    <p className="text-xs mt-0.5">
                      <span className={daysLeft !== null && daysLeft < 0 ? 'text-red-700 font-medium' : daysLeft !== null && daysLeft <= 2 ? 'text-amber-700 font-medium' : 'text-gray-600'}>
                        Deliver by {formatDay(order.deliverBy)}
                        {daysLeft !== null && (daysLeft < 0 ? ` (${dayCount(-daysLeft)} late)` : daysLeft === 0 ? ' (today)' : ` (in ${dayCount(daysLeft)})`)}
                      </span>
                      {short !== null && (
                        <span className={short > 0 ? 'text-red-700' : 'text-green-700'}>
                          {' · '}{short > 0 ? `short by ${short.toLocaleString()}` : 'enough stock'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatus(order, ORDER_STATUS.MET)}
                      disabled={updatingId === order.orderId}
                      className="btn btn-success text-sm"
                    >
                      Met
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatus(order, ORDER_STATUS.CANCELLED)}
                      disabled={updatingId === order.orderId}
                      className="btn btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {stock.date && open.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">Stock check uses the closing of {formatDay(stock.date)}.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4" noValidate>
        <h3 className="text-base sm:text-lg font-bold text-gray-900">New order</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="label" htmlFor="order-group">Group</label>
            <select id="order-group" className="input" value={form.group} onChange={(e) => update('group', e.target.value)}>
              {groups.map((g) => (
                <option key={g.key} value={g.key}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="order-item">Item</label>
            <select id="order-item" className="input" value={form.itemKey} onChange={(e) => update('itemKey', e.target.value)}>
              <option value="">Choose an item</option>
              {groupItems.map((item) => (
                <option key={item.key} value={item.key}>{item.code} - {item.name}</option>
              ))}
            </select>
            {errors.itemKey && <p className="mt-1 text-xs text-red-600">{errors.itemKey}</p>}
          </div>
          <div>
            <label className="label" htmlFor="order-qty">Quantity</label>
            <input
              id="order-qty"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              className="input"
              value={form.qty}
              onChange={(e) => update('qty', e.target.value)}
            />
            {errors.qty && <p className="mt-1 text-xs text-red-600">{errors.qty}</p>}
          </div>
          <div>
            <label className="label" htmlFor="order-deliver">Deliver by</label>
            <input
              id="order-deliver"
              type="date"
              min={today}
              className="input"
              value={form.deliverBy}
              onChange={(e) => update('deliverBy', e.target.value)}
            />
            {errors.deliverBy && <p className="mt-1 text-xs text-red-600">{errors.deliverBy}</p>}
          </div>
          <div>
            <label className="label" htmlFor="order-customer">Customer (optional)</label>
            <input id="order-customer" className="input" value={form.customer} onChange={(e) => update('customer', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="order-name">Your name</label>
            <input
              id="order-name"
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
          <div className="sm:col-span-2">
            <label className="label" htmlFor="order-note">Note (optional)</label>
            <input id="order-note" className="input" value={form.note} onChange={(e) => update('note', e.target.value)} />
          </div>
        </div>

        {message && (
          <p
            role="status"
            className={`rounded-lg px-3 py-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            {message.text}
          </p>
        )}

        <button type="submit" disabled={saving} className={`btn btn-primary w-full py-3 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {saving ? 'Saving...' : 'Save order'}
        </button>
      </form>

      {closed.length > 0 && (
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-2">Closed in the last {CLOSED_DAYS_SHOWN} days</h3>
          <ul className="divide-y divide-gray-100 text-sm">
            {closed.map((order) => (
              <li key={order.orderId} className="py-2 flex justify-between gap-3">
                <span className="text-gray-700">
                  {order.qty.toLocaleString()} x {order.code} {groupName(order.group)}
                  {order.customer && ` · ${order.customer}`}
                </span>
                <span className={`whitespace-nowrap ${order.status === ORDER_STATUS.MET ? 'text-green-700' : 'text-gray-500'}`}>
                  {order.status === ORDER_STATUS.MET ? 'Met' : 'Cancelled'} {formatDay(order.statusDate)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
