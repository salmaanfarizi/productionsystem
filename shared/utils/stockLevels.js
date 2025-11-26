/**
 * Stock Keeping Level Configuration
 * Reads min/max stock levels from Google Sheets (Settings sheet)
 *
 * Settings Sheet Structure (COLUMN-based for easy data entry):
 *
 * | SKU       | SS-200G | SS-100G | PS-15G | PC-CHEESE | ...
 * | Min Level | 100     | 150     | 50     | 200       | ...
 * | Max Level | 500     | 800     | 300    | 1000      | ...
 * | Reorder   | 200     | 300     | 100    | 400       | ...
 *
 */

export const STOCK_LEVEL_THRESHOLDS = {
  CRITICAL: 0.2,  // 20% of min level = critical (red)
  LOW: 0.5,       // 50% of min level = low (yellow)
  NORMAL: 1.0,    // At or above min = normal (green)
  HIGH: 1.5       // 150% of max = overstock (orange)
};

/**
 * Get stock level status based on current quantity and thresholds
 */
export function getStockLevelStatus(currentQty, minLevel, maxLevel) {
  if (!minLevel && !maxLevel) {
    return { status: 'unknown', color: 'gray', message: 'No limits set' };
  }

  const min = parseFloat(minLevel) || 0;
  const max = parseFloat(maxLevel) || Infinity;
  const qty = parseFloat(currentQty) || 0;

  // Critical - below 20% of minimum
  if (qty < min * STOCK_LEVEL_THRESHOLDS.CRITICAL) {
    return {
      status: 'critical',
      color: 'red',
      message: '🔴 Critical - Immediate reorder required',
      icon: '⚠️',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200'
    };
  }

  // Low - below 50% of minimum
  if (qty < min * STOCK_LEVEL_THRESHOLDS.LOW) {
    return {
      status: 'low',
      color: 'orange',
      message: '🟠 Low Stock - Reorder soon',
      icon: '⚡',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-200'
    };
  }

  // Below minimum
  if (qty < min) {
    return {
      status: 'below-min',
      color: 'yellow',
      message: '🟡 Below Minimum - Reorder recommended',
      icon: '📉',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200'
    };
  }

  // Overstock - above 150% of maximum
  if (qty > max * STOCK_LEVEL_THRESHOLDS.HIGH) {
    return {
      status: 'overstock',
      color: 'purple',
      message: '🟣 Overstock - Consider redistribution',
      icon: '📈',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200'
    };
  }

  // Above maximum
  if (qty > max) {
    return {
      status: 'high',
      color: 'blue',
      message: '🔵 Above Maximum',
      icon: '⬆️',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200'
    };
  }

  // Normal - within range
  return {
    status: 'normal',
    color: 'green',
    message: '🟢 Optimal Level',
    icon: '✓',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200'
  };
}

/**
 * Get stock level percentage
 */
export function getStockPercentage(currentQty, minLevel, maxLevel) {
  const min = parseFloat(minLevel) || 0;
  const max = parseFloat(maxLevel) || min * 2;
  const qty = parseFloat(currentQty) || 0;

  if (max === min) return 100;

  const percentage = ((qty - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Format stock levels for display
 */
export function formatStockLevels(settings) {
  if (!settings) return {};

  const formatted = {};

  // Assuming settings is an object with SKU as keys
  Object.entries(settings).forEach(([sku, levels]) => {
    formatted[sku] = {
      min: parseFloat(levels.minLevel) || 0,
      max: parseFloat(levels.maxLevel) || 0,
      reorder: parseFloat(levels.reorderLevel) || 0
    };
  });

  return formatted;
}
