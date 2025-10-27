/**
 * Packing Material Consumption Configuration
 *
 * Defines the consumption of packing materials per bundle/carton for each SKU.
 * All weights are in grams (GMS).
 */

// Packing material types
export const PACKING_MATERIAL_TYPES = {
  PACKING_ROLL: 'Packing Roll',
  PACKING_COVER: 'Packing Cover',
  BUNDLE_COVER: 'Bundle Cover'
};

/**
 * Packing material consumption per bundle/carton
 * Key: SKU size
 * Value: Object with material types and their consumption in grams
 */
export const PACKING_MATERIAL_CONSUMPTION = {
  '25g': {
    [PACKING_MATERIAL_TYPES.PACKING_ROLL]: 0.6240, // grams per bundle
    [PACKING_MATERIAL_TYPES.PACKING_COVER]: 6.0000, // grams per bundle
    [PACKING_MATERIAL_TYPES.BUNDLE_COVER]: 0.0750  // grams per bundle
  },
  '100g': {
    [PACKING_MATERIAL_TYPES.PACKING_ROLL]: 0.5100, // grams per bundle
    [PACKING_MATERIAL_TYPES.PACKING_COVER]: 0.0500, // grams per bundle
    [PACKING_MATERIAL_TYPES.BUNDLE_COVER]: 0.0750  // grams per bundle
  },
  '150g': {
    [PACKING_MATERIAL_TYPES.PACKING_ROLL]: 0.6000, // grams per carton (estimate, adjust as needed)
    [PACKING_MATERIAL_TYPES.PACKING_COVER]: 0.0500, // grams per carton
    [PACKING_MATERIAL_TYPES.BUNDLE_COVER]: 0.0800  // grams per carton
  },
  '200g': {
    [PACKING_MATERIAL_TYPES.PACKING_ROLL]: 0.7250, // grams per bundle
    [PACKING_MATERIAL_TYPES.PACKING_COVER]: 0.0500, // grams per bundle
    [PACKING_MATERIAL_TYPES.BUNDLE_COVER]: 0.0850  // grams per bundle
  },
  '800g': {
    [PACKING_MATERIAL_TYPES.PACKING_ROLL]: 0.3000  // grams per carton (only packing roll for 800g)
  },
  '10kg': {
    // No packing materials for 10kg sacks
  }
};

/**
 * Calculate total packing material consumption for a packing operation
 * @param {string} size - SKU size (e.g., '25g', '100g')
 * @param {number} unit2Count - Number of bundles/cartons
 * @returns {Object} Consumption by material type in grams
 */
export function calculatePackingMaterialConsumption(size, unit2Count) {
  const consumption = PACKING_MATERIAL_CONSUMPTION[size];

  if (!consumption) {
    return {};
  }

  const result = {};

  for (const [materialType, gramsPerUnit] of Object.entries(consumption)) {
    result[materialType] = {
      grams: gramsPerUnit * unit2Count,
      kilograms: (gramsPerUnit * unit2Count) / 1000
    };
  }

  return result;
}

/**
 * Format consumption for display
 * @param {Object} consumption - Consumption object from calculatePackingMaterialConsumption
 * @returns {string} Formatted consumption string
 */
export function formatConsumption(consumption) {
  const lines = [];

  for (const [materialType, amounts] of Object.entries(consumption)) {
    if (amounts.kilograms >= 1) {
      lines.push(`${materialType}: ${amounts.kilograms.toFixed(3)} kg`);
    } else {
      lines.push(`${materialType}: ${amounts.grams.toFixed(2)} g`);
    }
  }

  return lines.join(', ');
}

/**
 * Get packing material consumption summary
 * @param {string} size - SKU size
 * @param {number} unit2Count - Number of bundles/cartons
 * @returns {Array} Array of consumption objects for raw material deduction
 */
export function getPackingMaterialForDeduction(size, unit2Count) {
  const consumption = calculatePackingMaterialConsumption(size, unit2Count);
  const deductions = [];

  for (const [materialType, amounts] of Object.entries(consumption)) {
    deductions.push({
      material: materialType,
      category: 'Packing Material',
      quantity: amounts.kilograms, // in kg for raw material inventory
      unit: 'KG'
    });
  }

  return deductions;
}

/**
 * Check if SKU uses packing materials
 * @param {string} size - SKU size
 * @returns {boolean}
 */
export function usesPacking Materials(size) {
  return PACKING_MATERIAL_CONSUMPTION[size] &&
         Object.keys(PACKING_MATERIAL_CONSUMPTION[size]).length > 0;
}

export default {
  PACKING_MATERIAL_TYPES,
  PACKING_MATERIAL_CONSUMPTION,
  calculatePackingMaterialConsumption,
  formatConsumption,
  getPackingMaterialForDeduction,
  usesPackingMaterials
};
