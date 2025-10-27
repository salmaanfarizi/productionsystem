// Raw Material Categories and Items

export const RAW_MATERIAL_CATEGORIES = {
  BASE_ITEM: 'Base Item',
  FLAVOURS_ADDITIVES: 'Flavours and Additives',
  PACKING_MATERIAL: 'Packing Material'
};

export const BASE_ITEMS = [
  'Sunflower Seeds',
  'Pumpkin Seeds',
  'Melon Seeds',
  'Raw Corn',
  'Raw Peanut'
];

export const FLAVOURS_ADDITIVES = [
  'Salt',
  'Butter Flavour',
  'Cheese Flavour',
  'Vegetable Oil'
];

export const PACKING_MATERIALS = [
  'Cartons and Boxes',
  'Packing Roll',
  'Packing Cover'
];

// Sunflower Seeds detailed tracking
export const SUNFLOWER_GRADES = ['T6', '361', '363', '601', 'S9', 'Other'];

export const SUNFLOWER_SIZES = [
  '230-240',
  '240-250',
  '250-260',
  '260-270',
  '270-280',
  '280-290',
  '290-300'
];

export const SUNFLOWER_UNIT_WEIGHTS = ['20 kg', '25 kg', '50 kg'];

// Map categories to their items
export const CATEGORY_ITEMS = {
  [RAW_MATERIAL_CATEGORIES.BASE_ITEM]: BASE_ITEMS,
  [RAW_MATERIAL_CATEGORIES.FLAVOURS_ADDITIVES]: FLAVOURS_ADDITIVES,
  [RAW_MATERIAL_CATEGORIES.PACKING_MATERIAL]: PACKING_MATERIALS
};

// Units for each material
export const MATERIAL_UNITS = {
  // Base Items - weight based
  'Sunflower Seeds': 'KG',
  'Pumpkin Seeds': 'KG',
  'Melon Seeds': 'KG',
  'Raw Corn': 'KG',
  'Raw Peanut': 'KG',

  // Flavours and Additives
  'Salt': 'KG',
  'Butter Flavour': 'KG',
  'Cheese Flavour': 'KG',
  'Vegetable Oil': 'LITERS',

  // Packing Materials - count based
  'Cartons and Boxes': 'UNITS',
  'Packing Roll': 'ROLLS',
  'Packing Cover': 'UNITS'
};

// Transaction types
export const TRANSACTION_TYPES = {
  STOCK_IN: 'Stock In',
  STOCK_OUT: 'Stock Out',
  ADJUSTMENT: 'Adjustment'
};

// Get unit for a material
export function getUnitForMaterial(materialName) {
  return MATERIAL_UNITS[materialName] || 'UNITS';
}

// Get category for a material
export function getCategoryForMaterial(materialName) {
  for (const [category, items] of Object.entries(CATEGORY_ITEMS)) {
    if (items.includes(materialName)) {
      return category;
    }
  }
  return null;
}

// Get all items across all categories
export function getAllMaterials() {
  return [...BASE_ITEMS, ...FLAVOURS_ADDITIVES, ...PACKING_MATERIALS];
}

// Low stock threshold (percentage)
export const LOW_STOCK_THRESHOLD = 20; // Alert when stock is below 20% of max observed

// Expiry warning days
export const EXPIRY_WARNING_DAYS = 30; // Warn when expiry is within 30 days
