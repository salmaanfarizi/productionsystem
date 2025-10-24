/**
 * Google Sheets API Integration
 * Real-time data synchronization with Google Sheets
 */

const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT = 30000;

/**
 * Fetch with timeout and retry logic
 */
async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Read data from a specific sheet range
 */
export async function readSheetData(sheetName, range = 'A1:Z1000', timeout = DEFAULT_TIMEOUT) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!${range}?key=${GOOGLE_SHEETS_API_KEY}`;

    const response = await fetchWithTimeout(url, {}, timeout);

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
 */
export async function writeSheetData(sheetName, range, values, accessToken, timeout = DEFAULT_TIMEOUT) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!${range}?valueInputOption=USER_ENTERED`;

    const response = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: values
      })
    }, timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
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
export async function appendSheetData(sheetName, values, accessToken, timeout = DEFAULT_TIMEOUT) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`;

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values]
      })
    }, timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error appending sheet data:', error);
    throw error;
  }
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

/**
 * Google OAuth2 Authentication Helper
 */
export class GoogleAuthHelper {
  constructor(clientId) {
    this.clientId = clientId;
    this.accessToken = null;
    this.tokenClient = null;
  }

  async initialize() {
    return new Promise((resolve) => {
      if (window.google) {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          callback: (response) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              localStorage.setItem('gapi_access_token', response.access_token);
              localStorage.setItem('gapi_token_expires', Date.now() + (response.expires_in * 1000));
            }
          }
        });
        resolve();
      } else {
        console.error('Google Identity Services not loaded');
      }
    });
  }

  requestAccessToken() {
    // Check if we have a valid cached token (with 5 minute buffer)
    const cachedToken = localStorage.getItem('gapi_access_token');
    const tokenExpires = localStorage.getItem('gapi_token_expires');

    if (cachedToken && tokenExpires && Date.now() < (parseInt(tokenExpires) - 300000)) {
      this.accessToken = cachedToken;
      return Promise.resolve(cachedToken);
    }

    // Request new token
    return new Promise((resolve, reject) => {
      if (this.tokenClient) {
        this.tokenClient.callback = (response) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            localStorage.setItem('gapi_access_token', response.access_token);
            // Store expiration time (typically 1 hour from now)
            const expiresIn = response.expires_in || 3600;
            localStorage.setItem('gapi_token_expires', Date.now() + (expiresIn * 1000));
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to get access token'));
          }
        };
        this.tokenClient.requestAccessToken();
      } else {
        reject(new Error('Token client not initialized'));
      }
    });
  }

  async getAccessToken() {
    // Auto-refresh if token is expired or about to expire
    const tokenExpires = localStorage.getItem('gapi_token_expires');

    if (!this.accessToken || !tokenExpires || Date.now() >= (parseInt(tokenExpires) - 300000)) {
      console.log('Token expired or about to expire, refreshing...');
      try {
        await this.requestAccessToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Return current token anyway, will fail if truly expired
      }
    }

    return this.accessToken;
  }

  isTokenValid() {
    const tokenExpires = localStorage.getItem('gapi_token_expires');
    return tokenExpires && Date.now() < (parseInt(tokenExpires) - 300000);
  }

  revokeToken() {
    if (this.accessToken) {
      window.google.accounts.oauth2.revoke(this.accessToken);
      this.accessToken = null;
      localStorage.removeItem('gapi_access_token');
      localStorage.removeItem('gapi_token_expires');
    }
  }
}

export default {
  readSheetData,
  writeSheetData,
  appendSheetData,
  parseSheetData,
  GoogleAuthHelper
};
