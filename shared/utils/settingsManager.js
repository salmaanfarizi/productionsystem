/**
 * Settings Manager
 * Reads stock keeping levels from Google Sheets Settings tab
 *
 * Sheet Structure (Column-based):
 * Row 1: SKU codes (SS-200G, SS-100G, PS-15G, etc.)
 * Row 2: Min Level values
 * Row 3: Max Level values
 * Row 4: Reorder Point values
 */

import { readSheetData } from './sheetsAPI.js';

const SETTINGS_SHEET = 'Settings';

/**
 * Fetch stock level settings from Google Sheets
 * Returns object with SKU as key and levels as values
 */
export async function fetchStockLevelSettings() {
  try {
    const rawData = await readSheetData(SETTINGS_SHEET);

    if (!rawData || rawData.length < 4) {
      console.warn('Settings sheet not found or incomplete');
      return {};
    }

    // Row 1 = SKU codes
    // Row 2 = Min levels
    // Row 3 = Max levels
    // Row 4 = Reorder points
    const skuRow = rawData[0];
    const minRow = rawData[1];
    const maxRow = rawData[2];
    const reorderRow = rawData[3];

    const settings = {};

    // Start from index 1 (skip the label column)
    for (let i = 1; i < skuRow.length; i++) {
      const sku = skuRow[i];
      if (!sku) continue;

      settings[sku] = {
        sku: sku,
        minLevel: parseFloat(minRow[i]) || 0,
        maxLevel: parseFloat(maxRow[i]) || 0,
        reorderPoint: parseFloat(reorderRow[i]) || 0
      };
    }

    return settings;
  } catch (error) {
    console.error('Error fetching stock level settings:', error);
    return {};
  }
}

/**
 * Get default settings if sheet doesn't exist
 */
export function getDefaultStockLevels() {
  return {
    // Sunflower Seeds
    'SS-200G': { minLevel: 100, maxLevel: 500, reorderPoint: 200 },
    'SS-100G': { minLevel: 150, maxLevel: 800, reorderPoint: 300 },
    'SS-25G': { minLevel: 200, maxLevel: 1000, reorderPoint: 400 },
    'SS-800G': { minLevel: 50, maxLevel: 300, reorderPoint: 100 },
    'SS-130G': { minLevel: 100, maxLevel: 500, reorderPoint: 200 },
    'SS-10KG': { minLevel: 20, maxLevel: 100, reorderPoint: 40 },

    // Pumpkin Seeds
    'PS-15G': { minLevel: 150, maxLevel: 700, reorderPoint: 300 },
    'PS-110G': { minLevel: 100, maxLevel: 500, reorderPoint: 200 },
    'PS-10KG': { minLevel: 15, maxLevel: 80, reorderPoint: 30 },

    // Melon Seeds
    'MS-15G': { minLevel: 100, maxLevel: 500, reorderPoint: 200 },
    'MS-110G': { minLevel: 80, maxLevel: 400, reorderPoint: 150 },

    // Popcorn
    'PC-CHEESE': { minLevel: 200, maxLevel: 1000, reorderPoint: 400 },
    'PC-BUTTER': { minLevel: 200, maxLevel: 1000, reorderPoint: 400 },
    'PC-SALTED': { minLevel: 200, maxLevel: 1000, reorderPoint: 400 }
  };
}

/**
 * Cache settings in localStorage
 */
export function cacheSettings(settings) {
  try {
    localStorage.setItem('stockLevelSettings', JSON.stringify(settings));
    localStorage.setItem('stockLevelSettings_timestamp', Date.now().toString());
  } catch (error) {
    console.error('Error caching settings:', error);
  }
}

/**
 * Get cached settings
 */
export function getCachedSettings() {
  try {
    const cached = localStorage.getItem('stockLevelSettings');
    const timestamp = localStorage.getItem('stockLevelSettings_timestamp');

    if (!cached || !timestamp) return null;

    // Cache valid for 1 hour
    const age = Date.now() - parseInt(timestamp);
    if (age > 60 * 60 * 1000) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading cached settings:', error);
    return null;
  }
}

/**
 * Get settings with fallback to cache and defaults
 */
export async function getStockLevelSettings() {
  // Try to fetch from Google Sheets
  let settings = await fetchStockLevelSettings();

  // If empty, try cache
  if (!settings || Object.keys(settings).length === 0) {
    settings = getCachedSettings();
  }

  // If still empty, use defaults
  if (!settings || Object.keys(settings).length === 0) {
    settings = getDefaultStockLevels();
  } else {
    // Cache successful fetch
    cacheSettings(settings);
  }

  return settings;
}
