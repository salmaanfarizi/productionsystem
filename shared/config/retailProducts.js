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
    size: '200g',
    unit: 'bundle',
    packaging: { type: 'bundle', quantity: 5, unit: 'bags', label: '1 bag = 10 pouches × 200g, 1 bundle = 5 bags' },
    weightPerUnit: 10, // kg per bundle
    minStock: {
      'Eastern Province': 400,
      'Riyadh': 250
    }
  },
  'SUN-4401': {
    code: '4401',
    productType: 'Sunflower Seeds',
    size: '100g',
    unit: 'bundle',
    packaging: { type: 'bundle', quantity: 5, unit: 'bags', label: '1 bag = 12 pouches × 100g, 1 bundle = 5 bags' },
    weightPerUnit: 6, // kg per bundle
    minStock: {
      'Eastern Province': 400,
      'Riyadh': 250
    }
  },
  'SUN-1129': {
    code: '1129',
    productType: 'Sunflower Seeds',
    size: '25g',
    unit: 'bundle',
    packaging: { type: 'bundle', quantity: 6, unit: 'bags', label: '1 bag = 24 pouches × 25g, 1 bundle = 6 bags' },
    weightPerUnit: 3.6, // kg per bundle
    minStock: {
      'Eastern Province': 400,
      'Riyadh': 250
    }
  },
  'SUN-1116': {
    code: '1116',
    productType: 'Sunflower Seeds',
    size: '800g',
    unit: 'bundle',
    packaging: { type: 'bundle', quantity: 12, unit: 'pouches', label: '1 bundle = 12 pouches × 800g' },
    weightPerUnit: 9.6, // kg per bundle
    minStock: {
      'Eastern Province': 150,
      'Riyadh': 50
    }
  },
  'SUN-1145': {
    code: '1145',
    productType: 'Sunflower Seeds',
    size: '150g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'boxes', label: '1 box = 12 pouches × 150g, 1 carton = 6 boxes' },
    weightPerUnit: 10.8, // kg per carton
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
    packaging: { type: 'sack', quantity: 1, unit: 'sack', label: '1 sack = 10 kg' },
    weightPerUnit: 10, // kg per sack
    minStock: {
      'Eastern Province': 0,
      'Riyadh': 0
    }
  },

  // Pumpkin Seeds
  'PUM-8001': {
    code: '8001',
    productType: 'Pumpkin Seeds',
    size: '15g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'boxes', label: '1 box = 24 pouches × 15g, 1 carton = 6 boxes' },
    weightPerUnit: 2.16, // kg per carton
    minStock: {}
  },
  'PUM-8002': {
    code: '8002',
    productType: 'Pumpkin Seeds',
    size: '110g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'boxes', label: '1 box = 12 pouches × 110g, 1 carton = 6 boxes' },
    weightPerUnit: 7.92, // kg per carton
    minStock: {}
  },
  'PUM-1142': {
    code: '1142',
    productType: 'Pumpkin Seeds',
    size: '10 KG',
    unit: 'sack',
    packaging: { type: 'sack', quantity: 1, unit: 'sack', label: '1 sack = 10 kg' },
    weightPerUnit: 10, // kg per sack
    minStock: {}
  },

  // Melon Seeds
  'MEL-9001': {
    code: '9001',
    productType: 'Melon Seeds',
    size: '15g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'boxes', label: '1 box = 24 pouches × 15g, 1 carton = 6 boxes' },
    weightPerUnit: 2.16, // kg per carton
    minStock: {}
  },
  'MEL-9002': {
    code: '9002',
    productType: 'Melon Seeds',
    size: '110g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'boxes', label: '1 box = 12 pouches × 110g, 1 carton = 6 boxes' },
    weightPerUnit: 7.92, // kg per carton
    minStock: {}
  },
  'MEL-1143': {
    code: '1143',
    productType: 'Melon Seeds',
    size: '10 KG',
    unit: 'sack',
    packaging: { type: 'sack', quantity: 1, unit: 'sack', label: '1 sack = 10 kg' },
    weightPerUnit: 10, // kg per sack
    minStock: {}
  },

  // Popcorn
  'POP-1701': {
    code: '1701',
    productType: 'Popcorn',
    size: 'Cheese',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 8, unit: 'bags', label: '1 bag = 8 pouches × 16g, 1 carton = 8 bags' },
    weightPerUnit: 1.024, // kg per carton
    minStock: {}
  },
  'POP-1702': {
    code: '1702',
    productType: 'Popcorn',
    size: 'Butter',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 8, unit: 'bags', label: '1 bag = 8 pouches × 16g, 1 carton = 8 bags' },
    weightPerUnit: 1.024, // kg per carton
    minStock: {}
  },
  'POP-1703': {
    code: '1703',
    productType: 'Popcorn',
    size: 'Lightly Salted',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 8, unit: 'bags', label: '1 bag = 8 pouches × 16g, 1 carton = 8 bags' },
    weightPerUnit: 1.024, // kg per carton
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
 * Returns weight in KG
 */
export function calculatePackagingWeight(sku, units) {
  const product = RETAIL_PRODUCTS[sku];
  if (!product) return 0;

  // weightPerUnit is now the weight per bundle/carton in KG
  const weightInKg = units * product.weightPerUnit;
  return weightInKg; // Return in KG (not tonnes)
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
