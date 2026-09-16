/**
 * Specific orders: a quantity of an item wanted by a date.
 * Tab kept by the store sync: Store Orders. The store update shows an order as PENDING
 * until it is met or cancelled, and as MET on the day it was met.
 */

import { readSheetData, writeSheetData, appendSheetRows, parseSheetData } from './sheetsAPI';
import { toNumber, newEntryId, enteredAtText } from './storeUpdate';

const ORDERS_SHEET = 'Store Orders';

export const ORDER_STATUS = { PENDING: 'PENDING', MET: 'MET', CANCELLED: 'CANCELLED' };

export async function loadOrders(accessToken = null) {
  const rows = parseSheetData(await readSheetData(ORDERS_SHEET, 'A1:N', accessToken));
  return rows
    .filter((row) => row['Order ID'])
    .map((row) => ({
      orderId: row['Order ID'],
      enteredOn: row['Entered On'],
      itemKey: row['Item Key'],
      code: row['Code'],
      group: row['Group'],
      name: row['Item'],
      qty: toNumber(row['Qty']) || 0,
      deliverBy: row['Deliver By'],
      customer: row['Customer'],
      note: row['Note'],
      status: String(row['Status'] || '').toUpperCase() || ORDER_STATUS.PENDING,
      statusDate: row['Status Date'],
      enteredBy: row['Entered By'],
      enteredAt: row['Entered At']
    }));
}

/**
 * @param {Object} order - { item (Item Master entry), qty, deliverBy, customer, note, enteredOn, enteredBy }
 */
export async function addOrder(order, accessToken) {
  const now = new Date();
  await appendSheetRows(ORDERS_SHEET, [[
    newEntryId('OR', now),
    order.enteredOn,
    order.item.key,
    order.item.code,
    order.item.group,
    order.item.name,
    order.qty,
    order.deliverBy,
    order.customer || '',
    order.note || '',
    ORDER_STATUS.PENDING,
    '',
    order.enteredBy,
    enteredAtText(now)
  ]], accessToken);
}

export async function setOrderStatus(orderId, status, statusDate, accessToken) {
  const ids = (await readSheetData(ORDERS_SHEET, 'A2:A', accessToken)).map((row) => row[0]);
  const index = ids.indexOf(orderId);
  if (index === -1) {
    throw new Error('Order not found - refresh and try again.');
  }
  await writeSheetData(ORDERS_SHEET, `K${index + 2}:L${index + 2}`, [[status, statusDate]], accessToken, 'RAW');
}
