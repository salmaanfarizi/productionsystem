/**
 * Stock Outwards Categories and Configuration
 */

export const OUTWARDS_CATEGORIES = {
  SALESMAN_TRANSFER: 'Salesman Transfer',
  DAMAGED: 'Damaged Goods',
  SAMPLE: 'Sample/Promotion',
  RETURN: 'Return to Supplier',
  INTERNAL_USE: 'Internal Use',
  OTHER: 'Other'
};

export const OUTWARDS_TYPES = Object.values(OUTWARDS_CATEGORIES);

// Category metadata
export const CATEGORY_METADATA = {
  [OUTWARDS_CATEGORIES.SALESMAN_TRANSFER]: {
    color: 'blue',
    icon: '🚚',
    autoSync: true, // Auto-synced from arsinv
    description: 'Stock transferred to salesmen (synced from Salesman App)'
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

// Arsinv (Salesman App) configuration
export const ARSINV_CONFIG = {
  // This should be set in environment variables
  SPREADSHEET_ID: import.meta.env.VITE_ARSINV_SPREADSHEET_ID || '1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0',
  SHEET_NAME: 'INVENTORY_SNAPSHOT',
  ROUTES: ['Al-Hasa 1', 'Al-Hasa 2', 'Al-Hasa 3', 'Al-Hasa 4', 'Al-Hasa Wholesale'],

  // Column mapping from arsinv snapshot
  COLUMNS: {
    DATE: 'Date',
    ROUTE: 'Route',
    CATEGORY: 'Category',
    CODE: 'Code',
    ITEM_NAME: 'Item Name',
    PHYSICAL: 'Physical',
    P_UNIT: 'P.Unit',
    TRANSFER: 'Transfer', // This is the outward quantity!
    T_UNIT: 'T.Unit',
    ADDITIONAL_TRANSFER: 'Additional Transfer',
    ADD_UNIT: 'Add Unit',
    SYSTEM: 'System',
    S_UNIT: 'S.Unit',
    DIFFERENCE: 'Difference',
    LAST_UPDATED: 'Last Updated'
  }
};
