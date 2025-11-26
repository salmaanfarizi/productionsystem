/**
 * Configuration for Stock Outwards Management System
 */

const CONFIG = {
  // Google Apps Script Web App URL
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby69Ngv7yflRCqkOOtRznWOtzcJDMLltSFGkdWMZmTyYYiYvBNZrIkmffXpcdQTrVqk/exec',

  // Google Sheets API Key for reading arsinv data
  GOOGLE_SHEETS_API_KEY: '', // Set via environment or user input

  // Arsinv Spreadsheet ID for salesman transfers
  ARSINV_SPREADSHEET_ID: '1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0',
  ARSINV_SHEET_NAME: 'INVENTORY_SNAPSHOT',

  // User ID for this session
  USER_ID: localStorage.getItem('userId') || generateUserId(),

  // Enable debug mode
  DEBUG: false
};

/**
 * Stock Outwards Categories
 */
const OUTWARDS_CATEGORIES = {
  SALESMAN_TRANSFER: 'Salesman Transfer',
  REGIONAL_WAREHOUSE: 'Transfer to Regional Warehouse',
  DAMAGED: 'Damaged Goods',
  SAMPLE: 'Sample/Promotion',
  RETURN: 'Return to Supplier',
  INTERNAL_USE: 'Internal Use',
  OTHER: 'Other'
};

// Regional warehouse locations
const REGIONAL_WAREHOUSES = [
  'Dammam Store',
  'Riyadh Store'
];

const OUTWARDS_TYPES = Object.values(OUTWARDS_CATEGORIES);

// Category metadata
const CATEGORY_METADATA = {
  [OUTWARDS_CATEGORIES.SALESMAN_TRANSFER]: {
    color: 'blue',
    icon: '🚚',
    autoSync: true,
    description: 'Stock transferred to salesmen (synced from Salesman App)'
  },
  [OUTWARDS_CATEGORIES.REGIONAL_WAREHOUSE]: {
    color: 'teal',
    icon: '🏭',
    autoSync: false,
    description: 'Transfer to regional warehouses (Dammam/Riyadh)'
  },
  [OUTWARDS_CATEGORIES.DAMAGED]: {
    color: 'red',
    icon: '💔',
    autoSync: false,
    description: 'Damaged or spoiled goods'
  },
  [OUTWARDS_CATEGORIES.SAMPLE]: {
    color: 'purple',
    icon: '🎁',
    autoSync: false,
    description: 'Samples or promotional items'
  },
  [OUTWARDS_CATEGORIES.RETURN]: {
    color: 'orange',
    icon: '↩️',
    autoSync: false,
    description: 'Returns to supplier'
  },
  [OUTWARDS_CATEGORIES.INTERNAL_USE]: {
    color: 'green',
    icon: '🏢',
    autoSync: false,
    description: 'Internal consumption'
  },
  [OUTWARDS_CATEGORIES.OTHER]: {
    color: 'gray',
    icon: '📦',
    autoSync: false,
    description: 'Other outward movements'
  }
};

// Product catalog (matching productionsystem retail products)
const PRODUCT_TYPES = {
  SUNFLOWER_SEEDS: 'Sunflower Seeds',
  PUMPKIN_SEEDS: 'Pumpkin Seeds',
  MELON_SEEDS: 'Melon Seeds',
  POPCORN: 'Popcorn'
};

// Product SKUs with sizes
const PRODUCT_CATALOG = {
  'Sunflower Seeds': [
    { sku: 'SS-200G', code: '4402', size: '200g', unit: 'bag' },
    { sku: 'SS-100G', code: '4401', size: '100g', unit: 'bag' },
    { sku: 'SS-25G', code: '1129', size: '25g', unit: 'bag' },
    { sku: 'SS-800G', code: '1116', size: '800g', unit: 'bag' },
    { sku: 'SS-130G', code: '1145', size: '130g', unit: 'box' },
    { sku: 'SS-10KG', code: '1126', size: '10KG', unit: 'sack' }
  ],
  'Pumpkin Seeds': [
    { sku: 'PS-15G', code: '8001', size: '15g', unit: 'box' },
    { sku: 'PS-110G', code: '8002', size: '110g', unit: 'box' },
    { sku: 'PS-10KG', code: '1142', size: '10KG', unit: 'sack' }
  ],
  'Melon Seeds': [
    { sku: 'MS-15G', code: '9001', size: '15g', unit: 'box' },
    { sku: 'MS-110G', code: '9002', size: '110g', unit: 'box' }
  ],
  'Popcorn': [
    { sku: 'PC-CHEESE', code: '1710', size: 'Cheese', unit: 'bag' },
    { sku: 'PC-BUTTER', code: '1711', size: 'Butter', unit: 'bag' },
    { sku: 'PC-SALTED', code: '1703', size: 'Lightly Salted', unit: 'bag' }
  ]
};

// Regions
const REGIONS = ['Al-Hasa', 'Dammam', 'Riyadh', 'Jeddah'];

// Sales routes for salesman transfers
const ROUTES = ['Al-Hasa 1', 'Al-Hasa 2', 'Al-Hasa 3', 'Al-Hasa 4', 'Al-Hasa Wholesale'];

/**
 * Generate a unique user ID
 */
function generateUserId() {
  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('userId', id);
  return id;
}

/**
 * Get SKUs for a product type
 */
function getSKUsForProduct(productType) {
  return PRODUCT_CATALOG[productType] || [];
}

/**
 * Log debug messages
 */
function debugLog(...args) {
  if (CONFIG.DEBUG) {
    console.log('[Stock Outwards]', ...args);
  }
}
