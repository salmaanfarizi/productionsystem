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

  // Popcorn
  'POP-1701': {
    code: '1701',
    productType: 'Popcorn',
    size: 'Cheese',
    unit: 'bag',
    packaging: { type: 'carton', quantity: 8, label: 'carton = 8 bags' },
    weightPerUnit: 0.15, // Assuming 150g
    minStock: {}
  },
  'POP-1702': {
    code: '1702',
    productType: 'Popcorn',
    size: 'Butter',
    unit: 'bag',
    packaging: { type: 'carton', quantity: 8, label: 'carton = 8 bags' },
    weightPerUnit: 0.15,
    minStock: {}
  },
  'POP-1703': {
    code: '1703',
    productType: 'Popcorn',
    size: 'Lightly Salted',
    unit: 'bag',
    packaging: { type: 'carton', quantity: 8, label: 'carton = 8 bags' },
    weightPerUnit: 0.15,
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
