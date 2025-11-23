/**
 * Settings Loader - Fetch and cache dynamic configuration from Google Sheets
 * This utility replaces all hardcoded configuration values with dynamic data
 * from the Settings sheet in Google Sheets
 */

const CACHE_KEY_PREFIX = 'settings_';
const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds (reduced for real-time updates)

/**
 * Fetch all settings from Google Sheets Settings sheet
 * @param {string} spreadsheetId - Google Sheets spreadsheet ID
 * @param {string} apiKey - Google Sheets API key (optional, only needed for public read)
 * @returns {Promise<Object>} - Parsed settings object
 */
export async function fetchSettings(spreadsheetId, apiKey = null) {
  // Check cache first
  const cached = getFromCache('all_settings');
  if (cached) {
    return cached;
  }

  try {
    const sheetName = 'Settings';
    const range = `${sheetName}!A1:Z1000`; // Fetch large range to get all data

    let url;
    if (apiKey) {
      // Use API key for public read
      url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    } else {
      // Use authenticated endpoint (requires OAuth token in header)
      url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    // Parse the settings sheet into structured data
    const settings = parseSettingsSheet(rows);

    // Cache the settings
    saveToCache('all_settings', settings);

    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default fallback configuration
    return getDefaultSettings();
  }
}

/**
 * Parse Settings sheet rows into structured configuration object
 * @param {Array<Array<string>>} rows - Raw rows from Google Sheets
 * @returns {Object} - Structured settings object
 */
function parseSettingsSheet(rows) {
  const settings = {
    products: [],
    productMap: {},
    seedVarieties: {},
    sunflowerSizes: [],
    regions: [],
    employees: [],
    bagTypes: {},
    dieselTrucks: [],
    wastewaterTrucks: [],
    routes: [],
    systemConfig: {},
    openingBalances: []
  };

  let currentSection = null;
  let sectionHeaders = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const firstCell = row[0];

    // Detect section headers
    if (firstCell === 'PRODUCTS') {
      currentSection = 'products';
      i++; // Skip header row
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'SEED VARIETIES') {
      currentSection = 'seedVarieties';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'SUNFLOWER SIZE RANGES') {
      currentSection = 'sunflowerSizes';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'REGIONS / VARIANTS') {
      currentSection = 'regions';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'EMPLOYEES') {
      currentSection = 'employees';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'BAG TYPES') {
      currentSection = 'bagTypes';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'DIESEL TRUCKS') {
      currentSection = 'dieselTrucks';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'WASTEWATER TRUCKS') {
      currentSection = 'wastewaterTrucks';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'DELIVERY ROUTES') {
      currentSection = 'routes';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'SYSTEM CONFIGURATION') {
      currentSection = 'systemConfig';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    } else if (firstCell === 'OPENING BALANCES') {
      currentSection = 'openingBalances';
      i++;
      sectionHeaders = rows[i] || [];
      continue;
    }

    // Parse data rows based on current section
    if (currentSection === 'products' && row.length >= 2) {
      const product = {
        code: row[0],
        name: row[1],
        batchPrefix: row[2] || ''
      };
      settings.products.push(product);
      settings.productMap[product.code] = product.name;
    } else if (currentSection === 'seedVarieties' && row.length >= 3) {
      const productType = row[0];
      const varietyCode = row[1];
      const varietyName = row[2];

      if (!settings.seedVarieties[productType]) {
        settings.seedVarieties[productType] = [];
      }
      settings.seedVarieties[productType].push(varietyName);
    } else if (currentSection === 'sunflowerSizes' && row.length >= 1) {
      settings.sunflowerSizes.push(row[1] || row[0]);
    } else if (currentSection === 'regions' && row.length >= 2) {
      settings.regions.push({
        code: row[0],
        name: row[1]
      });
    } else if (currentSection === 'employees' && row.length >= 2) {
      const status = row[2] || 'Active';
      if (status === 'Active') {
        settings.employees.push(row[1]); // Employee name
      }
    } else if (currentSection === 'bagTypes' && row.length >= 3) {
      const bagCode = row[0];
      settings.bagTypes[bagCode] = {
        weight: parseFloat(row[2]) || 0,
        label: row[1]
      };
    } else if (currentSection === 'dieselTrucks' && row.length >= 3) {
      settings.dieselTrucks.push({
        capacity: parseFloat(row[2]) || 0,
        label: row[1],
        autoFill: parseFloat(row[2]) || 0
      });
    } else if (currentSection === 'wastewaterTrucks' && row.length >= 3) {
      settings.wastewaterTrucks.push({
        capacity: parseFloat(row[2]) || 0,
        label: row[1],
        autoFill: parseFloat(row[2]) || 0
      });
    } else if (currentSection === 'routes' && row.length >= 3) {
      const status = row[3] || 'Active';
      if (status === 'Active') {
        settings.routes.push({
          code: row[0],
          name: row[1],
          region: row[2]
        });
      }
    } else if (currentSection === 'systemConfig' && row.length >= 2) {
      const key = row[0];
      const value = row[1];
      settings.systemConfig[key] = parseFloat(value) || value;
    } else if (currentSection === 'openingBalances' && row.length >= 3) {
      settings.openingBalances.push({
        itemType: row[0],
        itemName: row[1],
        quantity: parseFloat(row[2]) || 0,
        unit: row[3] || 'kg',
        date: row[4] || new Date().toISOString()
      });
    }
  }

  return settings;
}

/**
 * Get default settings (fallback when Google Sheets is unavailable)
 * @returns {Object} - Default settings object
 */
export function getDefaultSettings() {
  return {
    products: [
      { code: 'SUNFLOWER', name: 'Sunflower Seeds', batchPrefix: 'SUN' },
      { code: 'MELON', name: 'Melon Seeds', batchPrefix: 'MEL' },
      { code: 'PUMPKIN', name: 'Pumpkin Seeds', batchPrefix: 'PUM' },
      { code: 'PEANUTS', name: 'Peanuts', batchPrefix: 'PEA' }
    ],
    productMap: {
      SUNFLOWER: 'Sunflower Seeds',
      MELON: 'Melon Seeds',
      PUMPKIN: 'Pumpkin Seeds',
      PEANUTS: 'Peanuts'
    },
    seedVarieties: {
      'Sunflower Seeds': ['T6', '361', '363', '601', 'S9'],
      'Melon Seeds': ['Shabah', 'Roomy'],
      'Pumpkin Seeds': ['Shine Skin', 'Lady Nail'],
      'Peanuts': []
    },
    sunflowerSizes: [
      '200-210', '210-220', '220-230', '230-240', '240-250',
      '250-260', '260-270', '270-280', '280-290', '290-300'
    ],
    regions: [
      { code: 'EASTERN', name: 'Eastern Province' },
      { code: 'RIYADH', name: 'Riyadh' },
      { code: 'BAHRAIN', name: 'Bahrain' },
      { code: 'QATAR', name: 'Qatar' }
    ],
    employees: ['Sikander', 'Shihan', 'Ajmal Ihjas', 'Ram', 'Mushraf', 'Ugrah'],
    bagTypes: {
      '25KG': { weight: 25, label: '25 kg' },
      '20KG': { weight: 20, label: '20 kg' },
      'OTHER': { weight: 0, label: 'Other (Enter Weight)' }
    },
    dieselTrucks: [
      { capacity: 6000, label: 'Small (6,000 L)', autoFill: 6000 },
      { capacity: 7000, label: 'Medium (7,000 L)', autoFill: 7000 },
      { capacity: 15000, label: 'Large (15,000 L)', autoFill: 15000 }
    ],
    wastewaterTrucks: [
      { capacity: 10000, label: 'Small (10,000 L)', autoFill: 10000 },
      { capacity: 22000, label: 'Large (22,000 L)', autoFill: 22000 }
    ],
    routes: [],
    systemConfig: {
      NORMAL_LOSS_PERCENT: 2,
      SALT_BAG_WEIGHT: 50,
      LOW_STOCK_THRESHOLD: 100
    },
    openingBalances: []
  };
}

/**
 * Cache utilities
 */
function getFromCache(key) {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expired
    localStorage.removeItem(CACHE_KEY_PREFIX + key);
    return null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

function saveToCache(key, data) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Clear all settings cache
 */
export function clearSettingsCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get product types for dropdown
 * @param {Object} settings - Settings object from fetchSettings()
 * @returns {Array<Object>} - Array of products {code, name}
 */
export function getProductTypes(settings) {
  return settings.products || [];
}

/**
 * Get seed varieties for a specific product
 * @param {Object} settings - Settings object from fetchSettings()
 * @param {string} productType - Product type name
 * @returns {Array<string>} - Array of variety names
 */
export function getSeedVarietiesForProduct(settings, productType) {
  return settings?.seedVarieties?.[productType] || [];
}

/**
 * Get sunflower size ranges
 * @param {Object} settings - Settings object from fetchSettings()
 * @returns {Array<string>} - Array of size ranges
 */
export function getSunflowerSizes(settings) {
  return settings.sunflowerSizes || [];
}

/**
 * Get regions/variants
 * @param {Object} settings - Settings object from fetchSettings()
 * @returns {Array<Object>} - Array of regions {code, name}
 */
export function getRegions(settings) {
  return settings.regions || [];
}

/**
 * Get active employees
 * @param {Object} settings - Settings object from fetchSettings()
 * @returns {Array<string>} - Array of employee names
 */
export function getEmployees(settings) {
  return settings.employees || [];
}

/**
 * Get bag types
 * @param {Object} settings - Settings object from fetchSettings()
 * @returns {Object} - Bag types object
 */
export function getBagTypes(settings) {
  return settings.bagTypes || {};
}

/**
 * Get diesel trucks
 * @param {Object} settings - Settings object from fetchSettings()
 * @returns {Array<Object>} - Array of truck configurations
 */
export function getDieselTrucks(settings) {
  return settings.dieselTrucks || [];
}

/**
 * Get wastewater trucks
 * @param {Object} settings - Settings object from fetchSettings()
 * @returns {Array<Object>} - Array of truck configurations
 */
export function getWastewaterTrucks(settings) {
  return settings.wastewaterTrucks || [];
}

/**
 * Get delivery routes
 * @param {Object} settings - Settings object from fetchSettings()
 * @returns {Array<Object>} - Array of routes
 */
export function getRoutes(settings) {
  return settings.routes || [];
}

/**
 * Get system configuration value
 * @param {Object} settings - Settings object from fetchSettings()
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} - Configuration value
 */
export function getSystemConfig(settings, key, defaultValue = null) {
  return settings.systemConfig[key] !== undefined
    ? settings.systemConfig[key]
    : defaultValue;
}

/**
 * Get opening balances
 * @param {Object} settings - Settings object from fetchSettings()
 * @returns {Array<Object>} - Array of opening balance entries
 */
export function getOpeningBalances(settings) {
  return settings.openingBalances || [];
}

/**
 * Calculate WIP from raw material with normal loss (from settings)
 * @param {Object} settings - Settings object from fetchSettings()
 * @param {number} rawMaterialWeight - Raw material weight
 * @returns {Object} - Calculation result
 */
export function calculateWIP(settings, rawMaterialWeight) {
  const lossPercentage = getSystemConfig(settings, 'NORMAL_LOSS_PERCENT', 2);
  const lossDecimal = lossPercentage / 100;
  const loss = rawMaterialWeight * lossDecimal;
  const wip = rawMaterialWeight - loss;

  return {
    rawMaterial: rawMaterialWeight,
    loss: loss,
    wip: wip,
    lossPercentage: lossPercentage
  };
}

/**
 * Calculate total weight from bags (from settings)
 * @param {Object} settings - Settings object from fetchSettings()
 * @param {string} bagType - Bag type code
 * @param {number} quantity - Number of bags
 * @returns {number} - Total weight
 */
export function calculateWeightFromBags(settings, bagType, quantity) {
  const bagTypes = getBagTypes(settings);
  const bagWeight = bagTypes[bagType]?.weight || 0;
  return bagWeight * quantity;
}

/**
 * Calculate salt consumption weight (from settings)
 * @param {Object} settings - Settings object from fetchSettings()
 * @param {number} saltBags - Number of salt bags
 * @returns {number} - Total salt weight in kg
 */
export function calculateSaltWeight(settings, saltBags) {
  const saltBagWeight = getSystemConfig(settings, 'SALT_BAG_WEIGHT', 50);
  return saltBagWeight * saltBags;
}

/**
 * Check if product has size and variant fields
 * @param {Object} settings - Settings object from fetchSettings()
 * @param {string} productType - Product type name
 * @returns {boolean} - True if product has size/variant fields
 */
export function productHasSizeVariant(settings, productType) {
  return productType === 'Sunflower Seeds';
}

export default {
  fetchSettings,
  getDefaultSettings,
  clearSettingsCache,
  getProductTypes,
  getSeedVarietiesForProduct,
  getSunflowerSizes,
  getRegions,
  getEmployees,
  getBagTypes,
  getDieselTrucks,
  getWastewaterTrucks,
  getRoutes,
  getSystemConfig,
  getOpeningBalances,
  calculateWIP,
  calculateWeightFromBags,
  calculateSaltWeight,
  productHasSizeVariant
};
