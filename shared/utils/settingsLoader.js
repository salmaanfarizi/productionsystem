/**
 * Settings Loader - Fetch and cache dynamic configuration from Google Sheets
 * This utility replaces all hardcoded configuration values with dynamic data
 * from the Settings sheet in Google Sheets
 *
 * NEW COLUMN-BASED FORMAT (v2.0):
 * - Row 1: Column headers (setting names)
 * - Row 2+: Values for each setting
 * - Columns can be added/extended without breaking the parser
 * - Empty cells are ignored, allowing different lengths per column
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
    const range = `${sheetName}!A1:AZ1000`; // Fetch large range to get all columns

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

    // Parse the settings sheet into structured data (NEW COLUMN-BASED FORMAT)
    const settings = parseColumnBasedSettings(rows);

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
 * Parse column-based Settings sheet into structured configuration object
 *
 * NEW COLUMN-BASED FORMAT:
 * Row 1 = Headers (column names that identify the data type)
 * Row 2+ = Values (add as many rows as needed)
 *
 * Expected Column Headers:
 * - Products, Product Codes, Batch Prefix
 * - Varieties (Sunflower), Varieties (Melon), Varieties (Pumpkin), Varieties (Peanuts)
 * - Sunflower Sizes
 * - Regions, Region Codes
 * - Employees
 * - Bag Codes, Bag Labels, Bag Weights
 * - Diesel Truck Labels, Diesel Truck Capacities
 * - Wastewater Truck Labels, Wastewater Truck Capacities
 * - Route Codes, Route Names, Route Regions
 * - Config Keys, Config Values
 *
 * @param {Array<Array<string>>} rows - Raw rows from Google Sheets
 * @returns {Object} - Structured settings object
 */
function parseColumnBasedSettings(rows) {
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

  if (!rows || rows.length < 2) {
    console.warn('Settings sheet is empty or has no data rows');
    return settings;
  }

  // Row 1 = Headers
  const headers = rows[0].map(h => (h || '').trim().toLowerCase());

  // Find column indices for each setting type
  const colIndex = {
    // Products (related columns)
    products: headers.findIndex(h => h === 'products' || h === 'product names' || h === 'product'),
    productCodes: headers.findIndex(h => h === 'product codes' || h === 'product code' || h === 'codes'),
    batchPrefix: headers.findIndex(h => h === 'batch prefix' || h === 'batchprefix' || h === 'prefix'),

    // Seed Varieties (one column per product type)
    varietiesSunflower: headers.findIndex(h => h.includes('varieties') && h.includes('sunflower')),
    varietiesMelon: headers.findIndex(h => h.includes('varieties') && h.includes('melon')),
    varietiesPumpkin: headers.findIndex(h => h.includes('varieties') && h.includes('pumpkin')),
    varietiesPeanuts: headers.findIndex(h => h.includes('varieties') && h.includes('peanut')),

    // Sunflower Sizes
    sunflowerSizes: headers.findIndex(h => h === 'sunflower sizes' || h === 'sizes' || h === 'size ranges'),

    // Regions
    regions: headers.findIndex(h => h === 'regions' || h === 'region names' || h === 'region'),
    regionCodes: headers.findIndex(h => h === 'region codes' || h === 'region code'),

    // Employees
    employees: headers.findIndex(h => h === 'employees' || h === 'employee names' || h === 'employee'),

    // Bag Types (related columns)
    bagCodes: headers.findIndex(h => h === 'bag codes' || h === 'bag code' || h === 'bag type'),
    bagLabels: headers.findIndex(h => h === 'bag labels' || h === 'bag label'),
    bagWeights: headers.findIndex(h => h === 'bag weights' || h === 'bag weight' || h === 'weight (kg)'),

    // Diesel Trucks
    dieselLabels: headers.findIndex(h => h.includes('diesel') && h.includes('label')),
    dieselCapacities: headers.findIndex(h => h.includes('diesel') && (h.includes('capacity') || h.includes('capacities'))),

    // Wastewater Trucks
    wastewaterLabels: headers.findIndex(h => h.includes('wastewater') && h.includes('label')),
    wastewaterCapacities: headers.findIndex(h => h.includes('wastewater') && (h.includes('capacity') || h.includes('capacities'))),

    // Routes
    routeCodes: headers.findIndex(h => h === 'route codes' || h === 'route code'),
    routeNames: headers.findIndex(h => h === 'route names' || h === 'route name' || h === 'routes'),
    routeRegions: headers.findIndex(h => h === 'route regions' || h === 'route region'),

    // System Config
    configKeys: headers.findIndex(h => h === 'config keys' || h === 'config key' || h === 'setting'),
    configValues: headers.findIndex(h => h === 'config values' || h === 'config value' || h === 'value')
  };

  // Process data rows (starting from row 2)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Helper to get cell value
    const getCell = (idx) => (idx >= 0 && row[idx]) ? row[idx].trim() : '';

    // Parse Products (need all 3 columns to match for a valid product)
    const productName = getCell(colIndex.products);
    const productCode = getCell(colIndex.productCodes);
    const batchPrefix = getCell(colIndex.batchPrefix);

    if (productName && productCode) {
      // Check if product already exists (avoid duplicates)
      if (!settings.products.find(p => p.name === productName)) {
        settings.products.push({
          code: productCode,
          name: productName,
          batchPrefix: batchPrefix || productCode.substring(0, 3)
        });
        settings.productMap[productCode] = productName;
      }
    }

    // Parse Seed Varieties for each product type
    const sunflowerVariety = getCell(colIndex.varietiesSunflower);
    if (sunflowerVariety) {
      if (!settings.seedVarieties['Sunflower Seeds']) {
        settings.seedVarieties['Sunflower Seeds'] = [];
      }
      if (!settings.seedVarieties['Sunflower Seeds'].includes(sunflowerVariety)) {
        settings.seedVarieties['Sunflower Seeds'].push(sunflowerVariety);
      }
    }

    const melonVariety = getCell(colIndex.varietiesMelon);
    if (melonVariety) {
      if (!settings.seedVarieties['Melon Seeds']) {
        settings.seedVarieties['Melon Seeds'] = [];
      }
      if (!settings.seedVarieties['Melon Seeds'].includes(melonVariety)) {
        settings.seedVarieties['Melon Seeds'].push(melonVariety);
      }
    }

    const pumpkinVariety = getCell(colIndex.varietiesPumpkin);
    if (pumpkinVariety) {
      if (!settings.seedVarieties['Pumpkin Seeds']) {
        settings.seedVarieties['Pumpkin Seeds'] = [];
      }
      if (!settings.seedVarieties['Pumpkin Seeds'].includes(pumpkinVariety)) {
        settings.seedVarieties['Pumpkin Seeds'].push(pumpkinVariety);
      }
    }

    const peanutVariety = getCell(colIndex.varietiesPeanuts);
    if (peanutVariety) {
      if (!settings.seedVarieties['Peanuts']) {
        settings.seedVarieties['Peanuts'] = [];
      }
      if (!settings.seedVarieties['Peanuts'].includes(peanutVariety)) {
        settings.seedVarieties['Peanuts'].push(peanutVariety);
      }
    }

    // Parse Sunflower Sizes
    const sunflowerSize = getCell(colIndex.sunflowerSizes);
    if (sunflowerSize && !settings.sunflowerSizes.includes(sunflowerSize)) {
      settings.sunflowerSizes.push(sunflowerSize);
    }

    // Parse Regions
    const regionName = getCell(colIndex.regions);
    const regionCode = getCell(colIndex.regionCodes);
    if (regionName) {
      if (!settings.regions.find(r => r.name === regionName)) {
        settings.regions.push({
          code: regionCode || regionName.toUpperCase().replace(/\s+/g, '_'),
          name: regionName
        });
      }
    }

    // Parse Employees
    const employee = getCell(colIndex.employees);
    if (employee && !settings.employees.includes(employee)) {
      settings.employees.push(employee);
    }

    // Parse Bag Types
    const bagCode = getCell(colIndex.bagCodes);
    const bagLabel = getCell(colIndex.bagLabels);
    const bagWeight = getCell(colIndex.bagWeights);
    if (bagCode && !settings.bagTypes[bagCode]) {
      settings.bagTypes[bagCode] = {
        weight: parseFloat(bagWeight) || 0,
        label: bagLabel || bagCode
      };
    }

    // Parse Diesel Trucks
    const dieselLabel = getCell(colIndex.dieselLabels);
    const dieselCapacity = getCell(colIndex.dieselCapacities);
    if (dieselLabel && dieselCapacity) {
      const capacity = parseFloat(dieselCapacity) || 0;
      if (!settings.dieselTrucks.find(t => t.label === dieselLabel)) {
        settings.dieselTrucks.push({
          capacity: capacity,
          label: dieselLabel,
          autoFill: capacity
        });
      }
    }

    // Parse Wastewater Trucks
    const wastewaterLabel = getCell(colIndex.wastewaterLabels);
    const wastewaterCapacity = getCell(colIndex.wastewaterCapacities);
    if (wastewaterLabel && wastewaterCapacity) {
      const capacity = parseFloat(wastewaterCapacity) || 0;
      if (!settings.wastewaterTrucks.find(t => t.label === wastewaterLabel)) {
        settings.wastewaterTrucks.push({
          capacity: capacity,
          label: wastewaterLabel,
          autoFill: capacity
        });
      }
    }

    // Parse Routes
    const routeCode = getCell(colIndex.routeCodes);
    const routeName = getCell(colIndex.routeNames);
    const routeRegion = getCell(colIndex.routeRegions);
    if (routeCode && routeName) {
      if (!settings.routes.find(r => r.code === routeCode)) {
        settings.routes.push({
          code: routeCode,
          name: routeName,
          region: routeRegion || ''
        });
      }
    }

    // Parse System Config
    const configKey = getCell(colIndex.configKeys);
    const configValue = getCell(colIndex.configValues);
    if (configKey && configValue) {
      // Try to parse as number, otherwise keep as string
      const numValue = parseFloat(configValue);
      settings.systemConfig[configKey] = isNaN(numValue) ? configValue : numValue;
    }
  }

  return settings;
}

/**
 * LEGACY: Parse row-based Settings sheet (kept for backward compatibility)
 * This function is no longer used but kept for reference
 * @deprecated Use parseColumnBasedSettings instead
 */
function parseSettingsSheet(rows) {
  // Redirect to new column-based parser
  return parseColumnBasedSettings(rows);
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
  return settings.seedVarieties[productType] || [];
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
