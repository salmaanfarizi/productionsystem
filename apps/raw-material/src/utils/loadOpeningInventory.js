/**
 * Load Opening Inventory Data
 * Utility to batch load opening inventory items into Raw Material Inventory
 */

import { appendSheetData } from '@shared/utils/sheetsAPI';

/**
 * Opening Inventory Items Template
 *
 * Each item should have:
 * - date: Date of opening inventory (YYYY-MM-DD)
 * - material: Material name
 * - category: Category (Base Item, Flavours and Additives, Packing Material)
 * - unit: Unit of measurement (KG, LITERS, UNITS, ROLLS)
 * - quantity: Quantity
 * - supplier: Supplier name (optional)
 * - batchNumber: Batch/Lot number (optional)
 * - expiryDate: Expiry date (YYYY-MM-DD) (optional)
 * - unitPrice: Price per unit (optional)
 * - notes: Additional notes (optional)
 */

// Opening Inventory Data - Update this array with actual data
export const OPENING_INVENTORY_ITEMS = [
  // Base Items - Sunflower Seeds
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds - T6 (230-240) Eastern Province',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 6027,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2027-05-31',
    unitPrice: 0,
    notes: 'Variety: T6 | Size: 230-240 | Region: Eastern Province'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds - T6 (240-250) Eastern Province',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 486,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-10-30',
    unitPrice: 0,
    notes: 'Variety: T6 | Size: 240-250 | Region: Eastern Province'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds - 361 (240-250) Riyadh',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 29,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-09-30',
    unitPrice: 0,
    notes: 'Variety: 361 | Size: 240-250 | Region: Riyadh'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds - 361 (230-240) Riyadh',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 1064,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-06-30',
    unitPrice: 0,
    notes: 'Variety: 361 | Size: 230-240 | Region: Riyadh'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds - 361 (230-240) Riyadh',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 1827,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-09-30',
    unitPrice: 0,
    notes: 'Variety: 361 | Size: 230-240 | Region: Riyadh'
  },
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds - 361 (240-250) Riyadh',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 1541,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-09-30',
    unitPrice: 0,
    notes: 'Variety: 361 | Size: 240-250 | Region: Riyadh'
  },

  // Base Items - Melon Seeds
  {
    date: '2025-01-01',
    material: 'Melon Seeds - Shabah',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 5,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2027-05-31',
    unitPrice: 0,
    notes: 'Variety: Shabah'
  },
  {
    date: '2025-01-01',
    material: 'Melon Seeds - Shabah',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 96,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2025-12-31',
    unitPrice: 0,
    notes: 'Variety: Shabah'
  },
  {
    date: '2025-01-01',
    material: 'Melon Seeds - Shabah',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 15,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-08-31',
    unitPrice: 0,
    notes: 'Variety: Shabah'
  },
  {
    date: '2025-01-01',
    material: 'Melon Seeds - Roomi',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 99,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-05-31',
    unitPrice: 0,
    notes: 'Variety: Roomi'
  },

  // Base Items - Pumpkin Seeds
  {
    date: '2025-01-01',
    material: 'Pumpkin Seeds - Snow White',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 137,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-10-30',
    unitPrice: 0,
    notes: 'Variety: Snow White'
  },

  // Base Items - Raw Corn
  {
    date: '2025-01-01',
    material: 'Raw Corn - Butterfly',
    category: 'Base Item',
    unit: 'BAGS',
    quantity: 142,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-03-31',
    unitPrice: 0,
    notes: 'Variety: Butterfly'
  },

  // Flavours and Additives
  {
    date: '2025-01-01',
    material: 'Butter Flavour - Al Fanar',
    category: 'Flavours and Additives',
    unit: 'KG',
    quantity: 425,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2025-11-30',
    unitPrice: 0,
    notes: 'Brand: Al Fanar'
  },
  {
    date: '2025-01-01',
    material: 'Cheese Flavour - Al Fanar',
    category: 'Flavours and Additives',
    unit: 'KG',
    quantity: 50,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2026-06-30',
    unitPrice: 0,
    notes: 'Brand: Al Fanar'
  },
  {
    date: '2025-01-01',
    material: 'Corn Starch',
    category: 'Flavours and Additives',
    unit: 'KG',
    quantity: 175,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2027-07-31',
    unitPrice: 0,
    notes: ''
  },
  {
    date: '2025-01-01',
    material: 'Vegetable Oil - Al Tai',
    category: 'Flavours and Additives',
    unit: 'LITERS',
    quantity: 85,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: 'N/A',
    unitPrice: 0,
    notes: 'Brand: Al Tai'
  },
  {
    date: '2025-01-01',
    material: 'Citric Acid',
    category: 'Flavours and Additives',
    unit: 'KG',
    quantity: 50,
    supplier: 'N/A',
    batchNumber: 'N/A',
    expiryDate: '2027-12-31',
    unitPrice: 0,
    notes: ''
  }
];

/**
 * Load opening inventory items to Google Sheets
 */
export async function loadOpeningInventory(accessToken, onProgress) {
  const results = {
    success: [],
    failed: []
  };

  // Check if there are items to load
  if (OPENING_INVENTORY_ITEMS.length === 0) {
    throw new Error('No opening inventory items to load. Please add items to OPENING_INVENTORY_ITEMS array.');
  }

  for (let i = 0; i < OPENING_INVENTORY_ITEMS.length; i++) {
    const item = OPENING_INVENTORY_ITEMS[i];

    try {
      // Validate required fields
      if (!item.date || !item.material || !item.category || !item.unit || item.quantity === undefined) {
        throw new Error('Missing required fields: date, material, category, unit, or quantity');
      }

      if (onProgress) {
        onProgress(i + 1, OPENING_INVENTORY_ITEMS.length, item.material);
      }

      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice) || 0;

      // Validate quantity is a valid number
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity: ${item.quantity}`);
      }

      const totalCost = quantity * unitPrice;

      // Prepare inventory row
      const inventoryRow = [
        item.date,
        item.material,
        item.category,
        item.unit,
        quantity.toFixed(2),
        item.supplier || 'N/A',
        item.batchNumber || 'N/A',
        item.expiryDate || 'N/A',
        unitPrice.toFixed(2),
        totalCost.toFixed(2),
        'ACTIVE',
        new Date().toISOString(),
        item.notes || 'Opening Inventory'
      ];

      // Add to Raw Material Inventory
      await appendSheetData('Raw Material Inventory', inventoryRow, accessToken);

      // Prepare transaction row
      const transactionRow = [
        new Date().toISOString(),
        item.date,
        'Stock In',
        item.material,
        item.category,
        item.unit,
        quantity.toFixed(2),
        '0',
        item.supplier || 'N/A',
        item.batchNumber || 'N/A',
        unitPrice.toFixed(2),
        totalCost.toFixed(2),
        item.notes || 'Opening Inventory',
        'System'
      ];

      // Add to Transaction History
      await appendSheetData('Raw Material Transactions', transactionRow, accessToken);

      results.success.push(item.material);

    } catch (error) {
      console.error(`Failed to load ${item.material}:`, error);
      results.failed.push({
        material: item.material,
        error: error.message
      });
    }
  }

  return results;
}
