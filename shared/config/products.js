/**
 * Product Configuration
 * Defines all product types, sizes, and packaging units
 */

export const PRODUCT_TYPES = {
  SUNFLOWER: 'Sunflower Seeds',
  MELON: 'Melon Seeds',
  PUMPKIN: 'Pumpkin Seeds',
  POPCORN: 'Popcorn'
};

export const SEED_TYPES = {
  T6: 'T6',
  S361: '361',
  S363: '363',
  S601: '601',
  S9: 'S9'
};

export const BATCH_PREFIX = {
  'T6': 'BT6',
  '361': 'B361',
  '363': 'B363',
  '601': 'B601',
  'S9': 'BS9'
};

// Packaging configurations by product type
export const PACKAGING_CONFIG = {
  [PRODUCT_TYPES.SUNFLOWER]: {
    sizes: ['25g', '100g', '130g', '200g', '800g', '10kg'],
    packaging: {
      '25g': {
        unit1: 'Bag',
        unit2: 'Bundle',
        conversion: 6, // 6 bags = 1 bundle
        weight: 0.025 // kg
      },
      '100g': {
        unit1: 'Bag',
        unit2: 'Bundle',
        conversion: 5, // 5 bags = 1 bundle
        weight: 0.1 // kg
      },
      '130g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6, // 6 boxes = 1 carton
        weight: 0.13 // kg
      },
      '200g': {
        unit1: 'Bag',
        unit2: 'Bundle',
        conversion: 5, // 5 bags = 1 bundle
        weight: 0.2 // kg
      },
      '800g': {
        unit1: 'Bag',
        unit2: 'Carton',
        conversion: 12, // 12 bags = 1 carton
        weight: 0.8 // kg
      },
      '10kg': {
        unit1: 'Sack',
        unit2: null,
        conversion: 1, // No secondary unit
        weight: 10 // kg
      }
    }
  },
  [PRODUCT_TYPES.MELON]: {
    sizes: ['25g', '100g', '130g', '200g', '800g', '10kg'],
    packaging: {
      // All sizes except 10kg use box/carton
      default: {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6 // 6 boxes = 1 carton
      },
      '25g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.025
      },
      '100g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.1
      },
      '130g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.13
      },
      '200g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.2
      },
      '800g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.8
      },
      '10kg': {
        unit1: 'Sack',
        unit2: null,
        conversion: 1,
        weight: 10
      }
    }
  },
  [PRODUCT_TYPES.PUMPKIN]: {
    sizes: ['25g', '100g', '130g', '200g', '800g', '10kg'],
    packaging: {
      // All sizes except 10kg use box/carton
      default: {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6 // 6 boxes = 1 carton
      },
      '25g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.025
      },
      '100g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.1
      },
      '130g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.13
      },
      '200g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.2
      },
      '800g': {
        unit1: 'Box',
        unit2: 'Carton',
        conversion: 6,
        weight: 0.8
      },
      '10kg': {
        unit1: 'Sack',
        unit2: null,
        conversion: 1,
        weight: 10
      }
    }
  },
  [PRODUCT_TYPES.POPCORN]: {
    sizes: ['25g', '100g', '130g', '200g', '800g'],
    packaging: {
      // All sizes use bag/carton with 8:1 ratio
      default: {
        unit1: 'Bag',
        unit2: 'Carton',
        conversion: 8 // 8 bags = 1 carton
      },
      '25g': {
        unit1: 'Bag',
        unit2: 'Carton',
        conversion: 8,
        weight: 0.025
      },
      '100g': {
        unit1: 'Bag',
        unit2: 'Carton',
        conversion: 8,
        weight: 0.1
      },
      '130g': {
        unit1: 'Bag',
        unit2: 'Carton',
        conversion: 8,
        weight: 0.13
      },
      '200g': {
        unit1: 'Bag',
        unit2: 'Carton',
        conversion: 8,
        weight: 0.2
      },
      '800g': {
        unit1: 'Bag',
        unit2: 'Carton',
        conversion: 8,
        weight: 0.8
      }
    }
  }
};

/**
 * Get packaging configuration for a product and size
 */
export function getPackagingConfig(productType, size) {
  const productConfig = PACKAGING_CONFIG[productType];
  if (!productConfig) return null;

  return productConfig.packaging[size] || productConfig.packaging.default;
}

/**
 * Calculate total weight from units
 */
export function calculateWeightFromUnits(productType, size, unit1Count, unit2Count = 0) {
  const config = getPackagingConfig(productType, size);
  if (!config) return 0;

  const totalUnit1 = unit1Count + (unit2Count * config.conversion);
  return (totalUnit1 * config.weight) / 1000; // Convert to tonnes
}

/**
 * Calculate units from weight
 */
export function calculateUnitsFromWeight(productType, size, weightInTonnes) {
  const config = getPackagingConfig(productType, size);
  if (!config) return { unit1: 0, unit2: 0 };

  const weightInKg = weightInTonnes * 1000;
  const totalUnit1 = Math.floor(weightInKg / config.weight);

  if (config.unit2) {
    const unit2 = Math.floor(totalUnit1 / config.conversion);
    const unit1 = totalUnit1 % config.conversion;
    return { unit1, unit2 };
  }

  return { unit1: totalUnit1, unit2: 0 };
}

export default {
  PRODUCT_TYPES,
  SEED_TYPES,
  BATCH_PREFIX,
  PACKAGING_CONFIG,
  getPackagingConfig,
  calculateWeightFromUnits,
  calculateUnitsFromWeight
};
