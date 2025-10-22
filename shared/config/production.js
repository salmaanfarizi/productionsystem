/**
 * Updated Product Configuration for Production System
 */

export const PRODUCT_TYPES = {
  SUNFLOWER: 'Sunflower Seeds',
  MELON: 'Melon Seeds',
  PUMPKIN: 'Pumpkin Seeds',
  PEANUTS: 'Peanuts'
};

// Sunflower seed size ranges (in production, these are actual seed sizes, not package sizes)
export const SUNFLOWER_SIZE_RANGES = [
  '200-210',
  '210-220',
  '220-230',
  '230-240',
  '240-250',
  '250-260',
  '260-270',
  '270-280',
  '280-290',
  '290-300'
];

// Sunflower variants (regions)
export const SUNFLOWER_VARIANTS = [
  'Eastern Province Region',
  'Riyadh Region',
  'Bahrain',
  'Qatar'
];

// Production bag types
export const BAG_TYPES = {
  '25KG': { weight: 25, label: '25 kg' },
  '20KG': { weight: 20, label: '20 kg' }
};

// Salt bags (for consumption tracking)
export const SALT_BAG = {
  weight: 50, // kg per bag
  label: '50 kg'
};

// Employees (for overtime tracking)
export const EMPLOYEES = [
  'Sikander',
  'Shihan',
  'Ajmal Ihjas',
  'Ram',
  'Mushraf',
  'Ugrah'
];

// Diesel truck capacities
export const DIESEL_TRUCKS = [
  { capacity: 7000, label: '7,000 L' },
  { capacity: 6000, label: '6,000 L' },
  { capacity: 12000, label: '12,000 L' },
  { capacity: 15000, label: '15,000 L' }
];

// Wastewater collection truck capacities
export const WASTEWATER_TRUCKS = [
  { capacity: 10000, label: '10,000 L' },
  { capacity: 22000, label: '22,000 L' }
];

// Normal loss percentage (applied to raw material to calculate WIP)
export const NORMAL_LOSS_PERCENTAGE = 2; // 2%

/**
 * Calculate WIP from raw material with normal loss
 */
export function calculateWIP(rawMaterialWeight) {
  const lossPercentage = NORMAL_LOSS_PERCENTAGE / 100;
  const loss = rawMaterialWeight * lossPercentage;
  const wip = rawMaterialWeight - loss;
  return {
    rawMaterial: rawMaterialWeight,
    loss: loss,
    wip: wip,
    lossPercentage: NORMAL_LOSS_PERCENTAGE
  };
}

/**
 * Calculate total weight from bags
 */
export function calculateWeightFromBags(bagType, quantity) {
  const bagWeight = BAG_TYPES[bagType]?.weight || 0;
  return bagWeight * quantity;
}

/**
 * Calculate salt consumption weight
 */
export function calculateSaltWeight(saltBags) {
  return SALT_BAG.weight * saltBags;
}

/**
 * Check if product has size and variant fields
 */
export function productHasSizeVariant(productType) {
  return productType === PRODUCT_TYPES.SUNFLOWER;
}

export default {
  PRODUCT_TYPES,
  SUNFLOWER_SIZE_RANGES,
  SUNFLOWER_VARIANTS,
  BAG_TYPES,
  SALT_BAG,
  EMPLOYEES,
  DIESEL_TRUCKS,
  WASTEWATER_TRUCKS,
  NORMAL_LOSS_PERCENTAGE,
  calculateWIP,
  calculateWeightFromBags,
  calculateSaltWeight,
  productHasSizeVariant
};
