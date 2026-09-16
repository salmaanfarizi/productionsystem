/**
 * Google Sheets API Integration
 * Real-time data synchronization with Google Sheets
 */

const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;

// The initialized auth helper, so API calls can renew an expired token themselves
let activeAuthHelper = null;

/**
 * fetch() with a Bearer token that is renewed when it has expired.
 * Google access tokens only live for an hour, so without this every save
 * after the first hour failed with "HTTP error! status: 401".
 */
async function authorizedFetch(url, options, accessToken) {
  const withToken = (token) => ({
    ...options,
    headers: { ...options.headers, 'Authorization': `Bearer ${token}` }
  });

  if (!activeAuthHelper) {
    return fetch(url, withToken(accessToken));
  }

  const token = await activeAuthHelper.getValidAccessToken();
  const response = await fetch(url, withToken(token));
  if (response.status !== 401) {
    return response;
  }

  // Token was revoked or expired early - get a fresh one and retry once
  const freshToken = await activeAuthHelper.getValidAccessToken({ forceRefresh: true });
  return fetch(url, withToken(freshToken));
}

/**
 * Read data from a specific sheet range
 * @param {string} sheetName - Name of the sheet
 * @param {string} range - Cell range (default: A1:Z, every row)
 * @param {string} accessToken - OAuth access token (optional, uses API key if not provided)
 */
export async function readSheetData(sheetName, range = 'A1:Z', accessToken = null) {
  try {
    let response;

    if (accessToken) {
      // Use OAuth token for authenticated access (no public sharing required)
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!${range}`;
      response = await authorizedFetch(url, {}, accessToken);
    } else {
      // Fall back to API key (requires public sharing)
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!${range}?key=${GOOGLE_SHEETS_API_KEY}`;
      response = await fetch(url);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error reading sheet data:', error);
    throw error;
  }
}

/**
 * Write data to a specific sheet
 * Note: Requires OAuth2 authentication for write operations
 * @param {string} valueInputOption - USER_ENTERED (default) or RAW to store text as typed
 */
export async function writeSheetData(sheetName, range, values, accessToken, valueInputOption = 'USER_ENTERED') {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!${range}?valueInputOption=${valueInputOption}`;

    const response = await authorizedFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: values
      })
    }, accessToken);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error writing sheet data:', error);
    throw error;
  }
}

/**
 * Append data to a sheet
 */
export async function appendSheetData(sheetName, values, accessToken) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`;

    const response = await authorizedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values]
      })
    }, accessToken);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error appending sheet data:', error);
    throw error;
  }
}

/**
 * Append several rows in one request.
 * Values are stored as given (RAW): "2026-09-16" stays text and nothing typed
 * is run as a formula.
 */
export async function appendSheetRows(sheetName, rows, accessToken) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const response = await authorizedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: rows })
  }, accessToken);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Convert sheet data to objects with headers
 */
export function parseSheetData(rawData) {
  if (!rawData || rawData.length === 0) return [];

  const headers = rawData[0];
  const rows = rawData.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_KEY = 'gapi_access_token';
const TOKEN_EXPIRES_KEY = 'gapi_token_expires';
// Treat tokens as expired a minute early so a request never starts with a dying token
const TOKEN_EXPIRY_MARGIN_MS = 60 * 1000;
const GIS_LOAD_TIMEOUT_MS = 15 * 1000;

/**
 * Wait for the Google Identity Services script (loaded async in index.html).
 * The app bundle often runs before it has finished loading.
 */
function waitForGoogleIdentity() {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
      } else if (Date.now() - startedAt > GIS_LOAD_TIMEOUT_MS) {
        reject(new Error('Google sign-in could not load. Check the internet connection and reload the page.'));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Your Google sign-in has expired. Tap "Reconnect Google" at the top of the page, then try again - your entries are still on the form.');
    this.name = 'SessionExpiredError';
  }
}

/**
 * Google OAuth2 Authentication Helper
 */
export class GoogleAuthHelper {
  constructor(clientId) {
    this.clientId = clientId;
    this.accessToken = null;
    this.tokenClient = null;
    this.pendingRequest = null;
    this.settlePending = null;
    this.listeners = new Set();
  }

  async initialize() {
    await waitForGoogleIdentity();

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: SHEETS_SCOPE,
      callback: (response) => this.settlePending?.(response, null),
      error_callback: (error) => this.settlePending?.(null, error)
    });

    if (this.hasValidToken()) {
      this.accessToken = localStorage.getItem(TOKEN_KEY);
    }
    activeAuthHelper = this;
  }

  hasValidToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    const expires = parseInt(localStorage.getItem(TOKEN_EXPIRES_KEY), 10);
    return Boolean(token) && Date.now() < expires - TOKEN_EXPIRY_MARGIN_MS;
  }

  /**
   * Subscribe to sign-in state changes (token received, expired, revoked).
   * Returns an unsubscribe function.
   */
  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Open the Google sign-in flow (or reuse a still-valid cached token).
   * @param {Object} options
   * @param {string} options.prompt - '' skips the account chooser when the user already consented
   */
  requestAccessToken({ prompt } = {}) {
    if (this.hasValidToken()) {
      this.accessToken = localStorage.getItem(TOKEN_KEY);
      return Promise.resolve(this.accessToken);
    }
    if (!this.tokenClient) {
      return Promise.reject(new Error('Google sign-in is still loading. Please try again in a moment.'));
    }
    // Several requests can hit an expired token at once - share one sign-in popup
    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    const request = new Promise((resolve, reject) => {
      this.settlePending = (response, error) => {
        this.settlePending = null;

        if (response?.access_token) {
          this.accessToken = response.access_token;
          localStorage.setItem(TOKEN_KEY, response.access_token);
          localStorage.setItem(TOKEN_EXPIRES_KEY, Date.now() + (response.expires_in * 1000));
          this.notify();
          resolve(response.access_token);
        } else if (error?.type === 'popup_failed_to_open') {
          reject(new Error('The browser blocked the Google sign-in window. Allow pop-ups for this site and try again.'));
        } else if (error?.type === 'popup_closed') {
          reject(new Error('Google sign-in was closed before it finished.'));
        } else {
          reject(new Error(response?.error_description || error?.message || 'Failed to get access token'));
        }
      };

      this.tokenClient.requestAccessToken(prompt === undefined ? {} : { prompt });
    });

    // Google can report a blocked popup synchronously, before this assignment,
    // so clear the shared request only once it has settled
    this.pendingRequest = request;
    const clearPending = () => {
      if (this.pendingRequest === request) {
        this.pendingRequest = null;
      }
    };
    request.then(clearPending, clearPending);

    return request;
  }

  /**
   * Return a usable token, renewing it if it has expired.
   * Renewal needs a popup, which browsers only allow right after a click,
   * so background refreshes fail fast with SessionExpiredError instead.
   */
  async getValidAccessToken({ forceRefresh = false } = {}) {
    if (!forceRefresh && this.hasValidToken()) {
      this.accessToken = localStorage.getItem(TOKEN_KEY);
      return this.accessToken;
    }

    this.clearStoredToken();
    this.notify();

    const canOpenPopup = navigator.userActivation ? navigator.userActivation.isActive : true;
    if (!canOpenPopup && !this.pendingRequest) {
      throw new SessionExpiredError();
    }

    try {
      return await this.requestAccessToken({ prompt: '' });
    } catch (error) {
      throw new SessionExpiredError();
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  clearStoredToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
  }

  revokeToken() {
    if (this.accessToken) {
      window.google.accounts.oauth2.revoke(this.accessToken);
      this.accessToken = null;
    }
    this.clearStoredToken();
    this.notify();
  }
}

export default {
  readSheetData,
  writeSheetData,
  appendSheetData,
  appendSheetRows,
  parseSheetData,
  GoogleAuthHelper
};
