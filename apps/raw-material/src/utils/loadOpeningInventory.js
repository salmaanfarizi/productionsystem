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
  // Example format:
  // {
  //   date: '2025-01-01',
  //   material: 'Sunflower Seeds',
  //   category: 'Base Item',
  //   unit: 'KG',
  //   quantity: 5000,
  //   supplier: 'ABC Suppliers',
  //   batchNumber: 'BATCH-2025-001',
  //   expiryDate: '2025-12-31',
  //   unitPrice: 2.50,
  //   notes: 'Grade: T6 | Size: 240-250 | Unit Weight: 25 kg | ID: See High'
  // },
  // Add the 14 opening inventory items here...
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
