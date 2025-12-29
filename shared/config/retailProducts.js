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
    weightPerUnit: 3.6, // kg per bundle (24 × 25g × 6 bags = 3.6kg)
    regionRestricted: ['Eastern Province'], // Only available for Eastern Province
    minStock: {
      'Eastern Province': 400
    }
  },
  'SUN-4407': {
    code: '4407',
    productType: 'Sunflower Seeds',
    size: '20g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'boxes', label: '1 box = 30 pouches × 20g, 1 carton = 6 boxes' },
    weightPerUnit: 3.6, // kg per carton (30 × 20g × 6 boxes = 3.6kg)
    regionExcluded: ['Eastern Province'], // Not available for Eastern Province (they use 25g)
    minStock: {
      'Riyadh': 250,
      'Bahrain': 100,
      'Qatar': 100
    }
  },
  'SUN-1116': {
    code: '1116',
    productType: 'Sunflower Seeds',
    size: '800g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'pouches', label: '1 pouch = 800g, 1 carton = 6 pouches' },
    weightPerUnit: 4.8, // kg per carton (6 × 800g = 4.8kg)
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
    minStock: {
      'Eastern Province': 100,
      'Riyadh': 50
    }
  },
  'PUM-8002': {
    code: '8002',
    productType: 'Pumpkin Seeds',
    size: '110g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'boxes', label: '1 box = 12 pouches × 110g, 1 carton = 6 boxes' },
    weightPerUnit: 7.92, // kg per carton
    minStock: {
      'Eastern Province': 100,
      'Riyadh': 50
    }
  },
  'PUM-1142': {
    code: '1142',
    productType: 'Pumpkin Seeds',
    size: '10 KG',
    unit: 'sack',
    packaging: { type: 'sack', quantity: 1, unit: 'sack', label: '1 sack = 10 kg' },
    weightPerUnit: 10, // kg per sack
    minStock: {
      'Eastern Province': 0,
      'Riyadh': 0
    }
  },

  // Melon Seeds
  'MEL-9001': {
    code: '9001',
    productType: 'Melon Seeds',
    size: '15g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'boxes', label: '1 box = 24 pouches × 15g, 1 carton = 6 boxes' },
    weightPerUnit: 2.16, // kg per carton
    minStock: {
      'Eastern Province': 100,
      'Riyadh': 50
    }
  },
  'MEL-9002': {
    code: '9002',
    productType: 'Melon Seeds',
    size: '110g',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 6, unit: 'boxes', label: '1 box = 12 pouches × 110g, 1 carton = 6 boxes' },
    weightPerUnit: 7.92, // kg per carton
    minStock: {
      'Eastern Province': 100,
      'Riyadh': 50
    }
  },
  'MEL-1143': {
    code: '1143',
    productType: 'Melon Seeds',
    size: '10 KG',
    unit: 'sack',
    packaging: { type: 'sack', quantity: 1, unit: 'sack', label: '1 sack = 10 kg' },
    weightPerUnit: 10, // kg per sack
    minStock: {
      'Eastern Province': 0,
      'Riyadh': 0
    }
  },

  // Popcorn
  'POP-1701': {
    code: '1701',
    productType: 'Popcorn',
    size: 'Cheese',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 8, unit: 'bags', label: '1 bag = 8 pouches × 16g, 1 carton = 8 bags' },
    weightPerUnit: 1.024, // kg per carton
    minStock: {
      'Eastern Province': 100,
      'Riyadh': 50
    }
  },
  'POP-1702': {
    code: '1702',
    productType: 'Popcorn',
    size: 'Butter',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 8, unit: 'bags', label: '1 bag = 8 pouches × 16g, 1 carton = 8 bags' },
    weightPerUnit: 1.024, // kg per carton
    minStock: {
      'Eastern Province': 100,
      'Riyadh': 50
    }
  },
  'POP-1703': {
    code: '1703',
    productType: 'Popcorn',
    size: 'Lightly Salted',
    unit: 'carton',
    packaging: { type: 'carton', quantity: 8, unit: 'bags', label: '1 bag = 8 pouches × 16g, 1 carton = 8 bags' },
    weightPerUnit: 1.024, // kg per carton
    minStock: {
      'Eastern Province': 100,
      'Riyadh': 50
    }
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
 * Get all SKUs for a product type, optionally filtered by region
 * @param {string} productType - The product type to filter by
 * @param {string} region - Optional region to filter by (for region-restricted SKUs)
 */
export function getSKUsForProduct(productType, region = null) {
  return Object.entries(RETAIL_PRODUCTS)
    .filter(([_, product]) => {
      // Must match product type
      if (product.productType !== productType) return false;

      // If region is specified, check region restrictions
      if (region) {
        // If product is restricted to specific regions, check if this region is allowed
        if (product.regionRestricted && !product.regionRestricted.includes(region)) {
          return false;
        }
        // If product is excluded from specific regions, check if this region is excluded
        if (product.regionExcluded && product.regionExcluded.includes(region)) {
          return false;
        }
      }

      return true;
    })
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
