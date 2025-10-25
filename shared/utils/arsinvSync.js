/**
 * Arsinv (Salesman App) Synchronization Utilities
 * Fetch salesman transfer data from the arsinv Google Spreadsheet
 */

import { ARSINV_CONFIG, OUTWARDS_CATEGORIES } from '../config/outwardsConfig';

const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Build Google Sheets API URL for reading data
 */
function buildSheetsReadURL(spreadsheetId, sheetName, apiKey) {
  const range = encodeURIComponent(`${sheetName}!A:O`); // A to O covers all columns
  return `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}?key=${apiKey}`;
}

/**
 * Fetch salesman transfers from arsinv system
 * @param {string} apiKey - Google Sheets API key
 * @param {object} filters - Optional filters { dateFrom, dateTo, route }
 * @returns {Promise<Array>} Array of outwards transactions
 */
export async function fetchSalesmanTransfers(apiKey, filters = {}) {
  try {
    const { SPREADSHEET_ID, SHEET_NAME, COLUMNS } = ARSINV_CONFIG;

    if (!apiKey) {
      throw new Error('Google Sheets API key is required for syncing salesman data');
    }

    const url = buildSheetsReadURL(SPREADSHEET_ID, SHEET_NAME, apiKey);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch arsinv data: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length === 0) {
      return [];
    }

    // First row is headers
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Map headers to column indices
    const colIndex = {};
    headers.forEach((header, index) => {
      colIndex[header] = index;
    });

    // Parse rows into outwards transactions
    const transactions = [];

    dataRows.forEach(row => {
      const date = row[colIndex[COLUMNS.DATE]] || '';
      const route = row[colIndex[COLUMNS.ROUTE]] || '';
      const category = row[colIndex[COLUMNS.CATEGORY]] || '';
      const code = row[colIndex[COLUMNS.CODE]] || '';
      const itemName = row[colIndex[COLUMNS.ITEM_NAME]] || '';
      const transfer = parseFloat(row[colIndex[COLUMNS.TRANSFER]]) || 0;
      const transferUnit = row[colIndex[COLUMNS.T_UNIT]] || '';
      const additionalTransfer = parseFloat(row[colIndex[COLUMNS.ADDITIONAL_TRANSFER]]) || 0;
      const addUnit = row[colIndex[COLUMNS.ADD_UNIT]] || '';

      // Skip if no transfer quantity
      if (transfer === 0 && additionalTransfer === 0) {
        return;
      }

      // Apply filters
      if (filters.dateFrom && date < filters.dateFrom) return;
      if (filters.dateTo && date > filters.dateTo) return;
      if (filters.route && route !== filters.route) return;

      // Create transaction for main transfer
      if (transfer > 0) {
        transactions.push({
          date,
          sku: code,
          productType: category,
          packageSize: itemName,
          region: route,
          quantity: transfer,
          customer: `Route: ${route}`,
          invoiceRef: `ARSINV-${date}`,
          notes: `Synced from Salesman App - ${route}`,
          category: OUTWARDS_CATEGORIES.SALESMAN_TRANSFER,
          source: 'arsinv',
          timestamp: row[colIndex[COLUMNS.LAST_UPDATED]] || new Date().toISOString()
        });
      }

      // Create transaction for additional transfer if exists
      if (additionalTransfer > 0) {
        transactions.push({
          date,
          sku: code,
          productType: category,
          packageSize: itemName,
          region: route,
          quantity: additionalTransfer,
          customer: `Route: ${route}`,
          invoiceRef: `ARSINV-ADD-${date}`,
          notes: `Additional Transfer - Synced from Salesman App - ${route}`,
          category: OUTWARDS_CATEGORIES.SALESMAN_TRANSFER,
          source: 'arsinv',
          timestamp: row[colIndex[COLUMNS.LAST_UPDATED]] || new Date().toISOString()
        });
      }
    });

    return transactions;
  } catch (error) {
    console.error('Error fetching salesman transfers:', error);
    throw error;
  }
}

/**
 * Get summary statistics from salesman transfers
 */
export function getSalesmanTransfersSummary(transfers) {
  const summary = {
    totalTransfers: transfers.length,
    totalQuantity: 0,
    byRoute: {},
    byProduct: {},
    dateRange: {
      earliest: null,
      latest: null
    }
  };

  transfers.forEach(transfer => {
    summary.totalQuantity += transfer.quantity;

    // By route
    if (!summary.byRoute[transfer.region]) {
      summary.byRoute[transfer.region] = {
        count: 0,
        quantity: 0
      };
    }
    summary.byRoute[transfer.region].count++;
    summary.byRoute[transfer.region].quantity += transfer.quantity;

    // By product
    if (!summary.byProduct[transfer.productType]) {
      summary.byProduct[transfer.productType] = {
        count: 0,
        quantity: 0
      };
    }
    summary.byProduct[transfer.productType].count++;
    summary.byProduct[transfer.productType].quantity += transfer.quantity;

    // Date range
    if (!summary.dateRange.earliest || transfer.date < summary.dateRange.earliest) {
      summary.dateRange.earliest = transfer.date;
    }
    if (!summary.dateRange.latest || transfer.date > summary.dateRange.latest) {
      summary.dateRange.latest = transfer.date;
    }
  });

  return summary;
}

/**
 * Check if arsinv API key is configured
 */
export function isArsinvConfigured() {
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
  return !!apiKey;
}

/**
 * Get last sync timestamp from localStorage
 */
export function getLastSyncTimestamp() {
  const timestamp = localStorage.getItem('arsinv_last_sync');
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Save sync timestamp to localStorage
 */
export function saveLastSyncTimestamp() {
  localStorage.setItem('arsinv_last_sync', new Date().toISOString());
}
