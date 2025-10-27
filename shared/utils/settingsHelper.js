/**
 * Settings Helper Utility
 *
 * Helper functions to read configuration from the Settings sheet
 * Allows apps to be configured via Google Sheets without code changes
 */

import { readSheetData, parseSheetData } from './sheetsAPI';

/**
 * Cache for settings to avoid repeated API calls
 */
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load all settings from the Settings sheet
 * @param {boolean} forceRefresh - Force reload from sheet
 * @returns {Promise<Array>} Array of setting objects
 */
export async function loadSettings(forceRefresh = false) {
  // Return cached settings if available and not expired
  if (!forceRefresh && settingsCache && cacheTimestamp) {
    const age = Date.now() - cacheTimestamp;
    if (age < CACHE_DURATION) {
      return settingsCache;
    }
  }

  try {
    const rawData = await readSheetData('Settings');
    const parsed = parseSheetData(rawData);

    // Filter out inactive settings
    const activeSettings = parsed.filter(row =>
      row['Active'] === 'TRUE' || row['Active'] === true
    );

    settingsCache = activeSettings;
    cacheTimestamp = Date.now();

    return activeSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    // Return empty array if Settings sheet doesn't exist yet
    return [];
  }
}

/**
 * Get settings for a specific app and category
 * @param {string} app - App name (Production, Packing, Inventory, Raw Material, All)
 * @param {string} category - Category name
 * @returns {Promise<Array>} Filtered settings
 */
export async function getSettings(app, category) {
  const allSettings = await loadSettings();

  return allSettings.filter(row =>
    (row['App'] === app || row['App'] === 'All') &&
    row['Category'] === category
  );
}

/**
 * Get a single setting value by key
 * @param {string} app - App name
 * @param {string} category - Category name
 * @param {string} key - Setting key
 * @returns {Promise<string|null>} Setting value or null if not found
 */
export async function getSetting(app, category, key) {
  const settings = await getSettings(app, category);
  const setting = settings.find(s => s['Key'] === key);
  return setting ? setting['Value'] : null;
}

/**
 * Get all settings for an app
 * @param {string} app - App name
 * @returns {Promise<Array>} All settings for the app
 */
export async function getAppSettings(app) {
  const allSettings = await loadSettings();

  return allSettings.filter(row =>
    row['App'] === app || row['App'] === 'All'
  );
}

/**
 * Get settings as a key-value map
 * @param {string} app - App name
 * @param {string} category - Category name
 * @returns {Promise<Object>} Settings as key-value object
 */
export async function getSettingsMap(app, category) {
  const settings = await getSettings(app, category);

  const map = {};
  settings.forEach(setting => {
    map[setting['Key']] = {
      value: setting['Value'],
      unit: setting['Unit'] || '',
      label: setting['Display Label'] || setting['Value'],
      notes: setting['Notes'] || ''
    };
  });

  return map;
}

/**
 * Get settings as an array of options (for dropdowns)
 * @param {string} app - App name
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of { value, label } objects
 */
export async function getSettingsOptions(app, category) {
  const settings = await getSettings(app, category);

  return settings.map(setting => ({
    value: setting['Value'],
    label: setting['Display Label'] || setting['Value'],
    key: setting['Key']
  }));
}

/**
 * Check if a setting exists
 * @param {string} app - App name
 * @param {string} category - Category name
 * @param {string} key - Setting key
 * @returns {Promise<boolean>} True if setting exists
 */
export async function hasSetting(app, category, key) {
  const value = await getSetting(app, category, key);
  return value !== null;
}

/**
 * Get all categories for an app
 * @param {string} app - App name
 * @returns {Promise<Array<string>>} Array of unique categories
 */
export async function getCategories(app) {
  const settings = await getAppSettings(app);
  const categories = [...new Set(settings.map(s => s['Category']))];
  return categories;
}

/**
 * Clear settings cache
 * Call this when you know settings have been updated
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = null;
}

/**
 * Refresh settings from sheet
 * @returns {Promise<Array>} Updated settings
 */
export async function refreshSettings() {
  return await loadSettings(true);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Get diesel truck options for Production app
 *
 * const trucks = await getSettings('Production', 'Trucks');
 * // Returns:
 * // [
 * //   { App: 'Production', Category: 'Trucks', Key: 'DIESEL_SMALL', Value: '6000', DisplayLabel: 'Small (6,000 L)' },
 * //   { App: 'Production', Category: 'Trucks', Key: 'DIESEL_MEDIUM', Value: '7000', DisplayLabel: 'Medium (7,000 L)' },
 * //   ...
 * // ]
 */

/**
 * Example 2: Get single setting value
 *
 * const expiryWarning = await getSetting('Raw Material', 'Alerts', 'EXPIRY_WARNING_DAYS');
 * // Returns: '30'
 */

/**
 * Example 3: Get settings as dropdown options
 *
 * const regionOptions = await getSettingsOptions('Packing', 'Regions');
 * // Returns:
 * // [
 * //   { value: 'Eastern Province', label: 'Eastern Province', key: 'REGION_EASTERN' },
 * //   { value: 'Riyadh', label: 'Riyadh', key: 'REGION_RIYADH' },
 * //   ...
 * // ]
 *
 * // Use in React:
 * // {regionOptions.map(option => (
 * //   <option key={option.key} value={option.value}>{option.label}</option>
 * // ))}
 */

/**
 * Example 4: Get settings as key-value map
 *
 * const bagTypes = await getSettingsMap('Production', 'Bag Types');
 * // Returns:
 * // {
 * //   'BAG_25KG': { value: '25', unit: 'KG', label: '25 kg', notes: 'Standard bag' },
 * //   'BAG_20KG': { value: '20', unit: 'KG', label: '20 kg', notes: 'Alternative bag' },
 * //   ...
 * // }
 */

/**
 * Example 5: Check if feature is enabled
 *
 * const autoDeduct = await getSetting('Raw Material', 'Alerts', 'AUTO_DEDUCT');
 * if (autoDeduct === 'TRUE') {
 *   // Auto-deduct materials
 * }
 */

/**
 * Example 6: Get all categories for an app
 *
 * const categories = await getCategories('Production');
 * // Returns: ['Bag Types', 'Trucks', 'Shifts']
 */

export default {
  loadSettings,
  getSettings,
  getSetting,
  getAppSettings,
  getSettingsMap,
  getSettingsOptions,
  hasSetting,
  getCategories,
  clearSettingsCache,
  refreshSettings
};
