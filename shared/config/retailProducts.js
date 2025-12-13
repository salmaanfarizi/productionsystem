/**
 * Retail Product Catalog for Packing Department
 * Maps retail SKUs to their packaging specifications and minimum stock levels
 */

// Retail Products Catalog
export const RETAIL_PRODUCTS = {
  // Sunflower Seeds
  'SUN-4402': {
    code: '4402',
    productType: 'Sunflower Seeds',
    size: '200 g',
    unit: 'bag',
    packaging: { type: 'bundle', quantity: 5, label: 'bundle = 5 bags' },
    weightPerUnit: 0.2, // kg
    minStock: {
      'Eastern Province': 400, // bundles
      'Riyadh': 250
    }
  },
  'SUN-4401': {
    code: '4401',
    productType: 'Sunflower Seeds',
    size: '100 g',
    unit: 'bag',
    packaging: { type: 'bundle', quantity: 5, label: 'bundle = 5 bags' },
    weightPerUnit: 0.1,
    minStock: {
      'Eastern Province': 400,
      'Riyadh': 250
    }
  },
  'SUN-1129': {
    code: '1129',
    productType: 'Sunflower Seeds',
    size: '25 g',
    unit: 'bag',
    packaging: { type: 'bundle', quantity: 6, label: 'bundle = 6 bags' },
    weightPerUnit: 0.025,
    minStock: {
      'Eastern Province': 400,
      'Riyadh': 250
    }
  },
  'SUN-1116': {
    code: '1116',
    productType: 'Sunflower Seeds',
    size: '800 g',
    unit: 'bag',
    packaging: { type: 'carton', quantity: 12, label: 'carton = 12 bags' },
    weightPerUnit: 0.8,
    minStock: {
      'Eastern Province': 150,
      'Riyadh': 50
    }
  },
  'SUN-1145': {
    code: '1145',
    productType: 'Sunflower Seeds',
    size: '130 g',
    unit: 'box',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 boxes' },
    weightPerUnit: 0.13,
    minStock: {
      'Eastern Province': 100,
      'Riyadh': 50
    }
  },
  'SUN-1126': {
    code: '1126',
    productType: 'Sunflower Seeds',
    size: '10 KG',
    unit: 'sack',
    packaging: { type: 'sack', quantity: 1, label: '—' },
    weightPerUnit: 10,
    minStock: {
      'Eastern Province': 0,
      'Riyadh': 0
    }
  },

  // Pumpkin Seeds
  'PUM-8001': {
    code: '8001',
    productType: 'Pumpkin Seeds',
    size: '15 g',
    unit: 'box',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 boxes' },
    weightPerUnit: 0.015,
    minStock: {}
  },
  'PUM-8002': {
    code: '8002',
    productType: 'Pumpkin Seeds',
    size: '110 g',
    unit: 'box',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 boxes' },
    weightPerUnit: 0.11,
    minStock: {}
  },
  'PUM-1142': {
    code: '1142',
    productType: 'Pumpkin Seeds',
    size: '10 KG',
    unit: 'sack',
    packaging: { type: 'sack', quantity: 1, label: '—' },
    weightPerUnit: 10,
    minStock: {}
  },

  // Melon Seeds
  'MEL-9001': {
    code: '9001',
    productType: 'Melon Seeds',
    size: '15 g',
    unit: 'box',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 boxes' },
    weightPerUnit: 0.015,
    minStock: {}
  },
  'MEL-9002': {
    code: '9002',
    productType: 'Melon Seeds',
    size: '110 g',
    unit: 'box',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 boxes' },
    weightPerUnit: 0.11,
    minStock: {}
  },

  // Popcorn - 16g pouches (1 bag = 8 pouches, 1 carton = 8 bags = 64 pouches = 1.024 kg)
  'POP-16-LS': {
    code: '16-LS',
    productType: 'Popcorn',
    size: '16g Lightly Salted',
    unit: 'bag',
    packaging: { type: 'carton', quantity: 8, label: 'carton = 8 bags (64 pouches)' },
    weightPerUnit: 0.128, // 8 pouches × 16g = 128g per bag
    pouchSize: 0.016,
    pouchesPerBag: 8,
    minStock: {}
  },
  'POP-16-CH': {
    code: '16-CH',
    productType: 'Popcorn',
    size: '16g Cheese',
    unit: 'bag',
    packaging: { type: 'carton', quantity: 8, label: 'carton = 8 bags (64 pouches)' },
    weightPerUnit: 0.128,
    pouchSize: 0.016,
    pouchesPerBag: 8,
    minStock: {}
  },
  'POP-16-BT': {
    code: '16-BT',
    productType: 'Popcorn',
    size: '16g Butter',
    unit: 'bag',
    packaging: { type: 'carton', quantity: 8, label: 'carton = 8 bags (64 pouches)' },
    weightPerUnit: 0.128,
    pouchSize: 0.016,
    pouchesPerBag: 8,
    minStock: {}
  },

  // Popcorn - 20g pouches (1 box = 30 pouches, 1 carton = 6 boxes = 180 pouches = 3.6 kg)
  'POP-20-LS': {
    code: '20-LS',
    productType: 'Popcorn',
    size: '20g Lightly Salted',
    unit: 'box',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 boxes (180 pouches)' },
    weightPerUnit: 0.6, // 30 pouches × 20g = 600g per box
    pouchSize: 0.02,
    pouchesPerBox: 30,
    minStock: {}
  },
  'POP-20-CH': {
    code: '20-CH',
    productType: 'Popcorn',
    size: '20g Cheese',
    unit: 'box',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 boxes (180 pouches)' },
    weightPerUnit: 0.6,
    pouchSize: 0.02,
    pouchesPerBox: 30,
    minStock: {}
  },
  'POP-20-BT': {
    code: '20-BT',
    productType: 'Popcorn',
    size: '20g Butter',
    unit: 'box',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 boxes (180 pouches)' },
    weightPerUnit: 0.6,
    pouchSize: 0.02,
    pouchesPerBox: 30,
    minStock: {}
  },

  // Popcorn - 800g packs (1 carton = 6 packs = 4.8 kg)
  'POP-800-LS': {
    code: '800-LS',
    productType: 'Popcorn',
    size: '800g Lightly Salted',
    unit: 'pack',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 packs' },
    weightPerUnit: 0.8,
    minStock: {}
  },
  'POP-800-CH': {
    code: '800-CH',
    productType: 'Popcorn',
    size: '800g Cheese',
    unit: 'pack',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 packs' },
    weightPerUnit: 0.8,
    minStock: {}
  },
  'POP-800-BT': {
    code: '800-BT',
    productType: 'Popcorn',
    size: '800g Butter',
    unit: 'pack',
    packaging: { type: 'carton', quantity: 6, label: 'carton = 6 packs' },
    weightPerUnit: 0.8,
    minStock: {}
  }
};

// Product Types
export const PACKING_PRODUCT_TYPES = {
  SUNFLOWER: 'Sunflower Seeds',
  PUMPKIN: 'Pumpkin Seeds',
  MELON: 'Melon Seeds',
  POPCORN: 'Popcorn'
};

// Regions (for Sunflower only)
export const REGIONS = [
  'Eastern Province',
  'Riyadh',
  'Bahrain',
  'Qatar'
];

// Regions with minimum stock tracking
export const STOCK_REGIONS = [
  'Eastern Province',
  'Riyadh'
];

/**
 * Get all SKUs for a product type
 */
export function getSKUsForProduct(productType) {
  return Object.entries(RETAIL_PRODUCTS)
    .filter(([_, product]) => product.productType === productType)
    .map(([sku, product]) => ({
      sku,
      ...product
    }));
}

/**
 * Get product by SKU
 */
export function getProductBySKU(sku) {
  return RETAIL_PRODUCTS[sku];
}

/**
 * Calculate total weight from packaging units
 */
export function calculatePackagingWeight(sku, units) {
  const product = RETAIL_PRODUCTS[sku];
  if (!product) return 0;

  const bagsPerUnit = product.packaging.quantity;
  const totalBags = units * bagsPerUnit;
  const weightInKg = totalBags * product.weightPerUnit;
  return weightInKg / 1000; // Convert to tonnes
}

/**
 * Calculate recommended packing quantity based on current stock and minimum
 */
export function calculateRecommendedPacking(sku, region, currentStock) {
  const product = RETAIL_PRODUCTS[sku];
  if (!product || !product.minStock[region]) return 0;

  const minStock = product.minStock[region];
  const shortage = minStock - currentStock;
  return shortage > 0 ? shortage : 0;
}

/**
 * Check if product needs region selection
 */
export function productNeedsRegion(productType) {
  return productType === PACKING_PRODUCT_TYPES.SUNFLOWER;
}

export default {
  RETAIL_PRODUCTS,
  PACKING_PRODUCT_TYPES,
  REGIONS,
  STOCK_REGIONS,
  getSKUsForProduct,
  getProductBySKU,
  calculatePackagingWeight,
  calculateRecommendedPacking,
  productNeedsRegion
};
