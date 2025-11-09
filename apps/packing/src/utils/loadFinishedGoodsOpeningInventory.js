/**
 * Load Finished Goods Opening Inventory
 * Utility to batch load opening inventory for finished goods
 */

import { getSheetData, updateSheetData } from '@shared/utils/sheetsAPI';

/**
 * Finished Goods Opening Inventory Template
 *
 * Each item should have:
 * - sku: SKU code
 * - productType: Product type/name
 * - region: Region/variant
 * - packageSize: Package size/description
 * - openingStock: Opening stock quantity
 * - minimumStock: Minimum stock threshold
 * - notes: Additional notes
 */

// Finished Goods Opening Inventory Data
export const FINISHED_GOODS_OPENING_INVENTORY = [
  // Regular Sunflower Seeds in Bundle/Bags/Carton
  { sku: '4402', productType: '200 Grams Sunflower Seeds Bundles', region: 'Regular', packageSize: '200g', openingStock: 509, minimumStock: 50, notes: 'Regular Sunflower Seeds' },
  { sku: '4401', productType: '100 Grams Sunflower Seeds Bundles', region: 'Regular', packageSize: '100g', openingStock: 492, minimumStock: 50, notes: 'Regular Sunflower Seeds' },
  { sku: '1129', productType: '25 Grams Sunflower Seeds Bundles (24 Pieces)', region: 'Regular', packageSize: '25g x 24', openingStock: 218, minimumStock: 20, notes: 'Regular Sunflower Seeds' },
  { sku: '1116', productType: '800 Grams Sunflower Seeds (12 x 800grm) Master Carton', region: 'Regular', packageSize: '800g x 12', openingStock: 72, minimumStock: 10, notes: 'Regular Sunflower Seeds' },
  { sku: '1126', productType: '10kg Blue Sunflower Seeds', region: 'Regular', packageSize: '10kg', openingStock: 448, minimumStock: 50, notes: 'Regular Sunflower Seeds' },
  { sku: '1128', productType: '150gm Sunflower Seeds (6x12 Pcs) Master Carton', region: 'Regular', packageSize: '150g x 72', openingStock: 13, minimumStock: 10, notes: 'Regular Sunflower Seeds' },

  // Qatar Sunflower Seeds in Bundle/Carton
  { sku: '4401-Q', productType: '100 Grams Sunflower Seeds Bundles', region: 'Qatar', packageSize: '100g', openingStock: 50, minimumStock: 20, notes: 'Qatar Sunflower Seeds' },
  { sku: '4407-Q', productType: '20 Grams Sunflower Seeds (6x 30) Master Carton', region: 'Qatar', packageSize: '20g x 180', openingStock: 450, minimumStock: 50, notes: 'Qatar Sunflower Seeds' },

  // Riyadh Sunflower Seeds in Bundle/Bags/Carton
  { sku: '4402-R', productType: '200 Grams Sunflower Seeds Bundles', region: 'Riyadh', packageSize: '200g', openingStock: 49, minimumStock: 20, notes: 'Riyadh Sunflower Seeds' },
  { sku: '4401-R', productType: '100 Grams Sunflower Seeds Bundles', region: 'Riyadh', packageSize: '100g', openingStock: 124, minimumStock: 20, notes: 'Riyadh Sunflower Seeds' },
  { sku: '4401-R-AIR', productType: '100 Grams Sunflower Seeds Bundles Air Issued', region: 'Riyadh', packageSize: '100g', openingStock: 21, minimumStock: 10, notes: 'Riyadh Sunflower Seeds - Air Issued' },
  { sku: '4407-R', productType: '20 Grams Sunflower Seeds (6x 30) Master Carton', region: 'Riyadh', packageSize: '20g x 180', openingStock: 58, minimumStock: 20, notes: 'Riyadh Sunflower Seeds' },
  { sku: '1116-R', productType: '800 Grams Sunflower Seeds (12 x 800grm) Master Carton', region: 'Riyadh', packageSize: '800g x 12', openingStock: 36, minimumStock: 10, notes: 'Riyadh Sunflower Seeds' },
  { sku: '1127-T6', productType: '10kg Orange Sunflower Seeds Riyadh Special T-6', region: 'Riyadh', packageSize: '10kg', openingStock: 14, minimumStock: 10, notes: 'Riyadh Sunflower Seeds T-6 Special' },
  { sku: '1127-R', productType: '10kg Orange Sunflower Seeds Riyadh', region: 'Riyadh', packageSize: '10kg', openingStock: 409, minimumStock: 50, notes: 'Riyadh Sunflower Seeds' },
  { sku: '1145', productType: '130gm Sunflower Seeds (6x12 Pcs) Master Carton', region: 'Riyadh', packageSize: '130g x 72', openingStock: 30, minimumStock: 10, notes: 'Riyadh Sunflower Seeds' },

  // Melon & Pumpkin Seeds in Carton
  { sku: '8001', productType: 'Pumpkin 15 gram (13 x 24 Pieces) Master Carton', region: 'Regular', packageSize: '15g x 312', openingStock: 7, minimumStock: 5, notes: 'Pumpkin Seeds' },
  { sku: '8005', productType: 'Pumpkin 15 gram (6 x 24 Pieces) Master Carton', region: 'Regular', packageSize: '15g x 144', openingStock: 50, minimumStock: 10, notes: 'Pumpkin Seeds' },
  { sku: '8002', productType: 'Pumpkin 110 gram (6 x 12 Pieces) Master Carton', region: 'Regular', packageSize: '110g x 72', openingStock: 34, minimumStock: 10, notes: 'Pumpkin Seeds' },
  { sku: '8004', productType: 'Pumpkin 65 gram (6 x 24 Pieces) Master Carton', region: 'Regular', packageSize: '65g x 144', openingStock: 0, minimumStock: 10, notes: 'Pumpkin Seeds' },
  { sku: 'MEL-20', productType: 'Melon Seeds 20 (13 x 20 grm) Master Carton', region: 'Regular', packageSize: '20g x 260', openingStock: 11, minimumStock: 5, notes: 'Melon Seeds' },
  { sku: '9001', productType: 'Melon Seeds 15 gram (13 x 15 grm) Master Carton', region: 'Regular', packageSize: '15g x 195', openingStock: 8, minimumStock: 5, notes: 'Melon Seeds' },
  { sku: '9005', productType: 'Melon Seeds 15 gram (6 x 15 grm) Master Carton', region: 'Regular', packageSize: '15g x 90', openingStock: 25, minimumStock: 10, notes: 'Melon Seeds' },
  { sku: '9002', productType: 'Melon Seeds 110 gram (6 x 12 Pieces) Master Carton', region: 'Regular', packageSize: '110g x 72', openingStock: 2, minimumStock: 5, notes: 'Melon Seeds' },
  { sku: '9004', productType: 'Melon Seeds 65 gram (6 x 24 Pieces) Master Carton', region: 'Regular', packageSize: '65g x 144', openingStock: 0, minimumStock: 10, notes: 'Melon Seeds' },

  // Popcorn in Carton/Bags
  { sku: '1703', productType: 'PC- Salted-16 gm (10x 8) Master Carton', region: 'Regular', packageSize: '16g x 80', openingStock: 50, minimumStock: 10, notes: 'Popcorn' },
  { sku: '1702', productType: 'PC- Cheese- 16 gm (10x 8) Master Carton', region: 'Regular', packageSize: '16g x 80', openingStock: 76, minimumStock: 10, notes: 'Popcorn' },
  { sku: '1701', productType: 'PC- Butter- 16 gm (10x 8) Master Carton', region: 'Regular', packageSize: '16g x 80', openingStock: 53, minimumStock: 10, notes: 'Popcorn' },
  { sku: '1712', productType: 'PC- Salted-16 gm (8 x 8) Master Carton', region: 'Regular', packageSize: '16g x 64', openingStock: 76, minimumStock: 10, notes: 'Popcorn' },
  { sku: '1711', productType: 'PC- Cheese- 16 gm (8 x 8) Master Carton', region: 'Regular', packageSize: '16g x 64', openingStock: 93, minimumStock: 10, notes: 'Popcorn' },
  { sku: '1710', productType: 'PC- Butter- 16 gm (8 x 8) Master Carton', region: 'Regular', packageSize: '16g x 64', openingStock: 134, minimumStock: 10, notes: 'Popcorn' },
  { sku: '1705', productType: 'PC- Cheese- 22 gm (22gm x 5) Master Carton', region: 'Regular', packageSize: '22g x 5', openingStock: 31, minimumStock: 10, notes: 'Popcorn' },
  { sku: '1704', productType: 'PC- Butter- 22 gm (22gm x 5) Master Carton', region: 'Regular', packageSize: '22g x 5', openingStock: 30, minimumStock: 10, notes: 'Popcorn' },

  // Nuts in Bags & Carton
  { sku: '1', productType: 'Melon Seeds-White Blue 10kg', region: 'Regular', packageSize: '10kg', openingStock: 0, minimumStock: 5, notes: 'Nuts' },
  { sku: '2', productType: 'Melon Seeds-Yellow Blue 10kg', region: 'Regular', packageSize: '10kg', openingStock: 15, minimumStock: 5, notes: 'Nuts' },
  { sku: '4406', productType: 'Melon Seeds-Yellow Orange Bag 10kg', region: 'Regular', packageSize: '10kg', openingStock: 13, minimumStock: 5, notes: 'Nuts' },
  { sku: '1142', productType: 'Pumpkin Seeds 10kg', region: 'Regular', packageSize: '10kg', openingStock: 1, minimumStock: 5, notes: 'Nuts' },
  { sku: '1911', productType: 'Peanut-Yellow Lemon Orange Bag 10kg', region: 'Regular', packageSize: '10kg', openingStock: 4, minimumStock: 5, notes: 'Nuts' },
  { sku: '1144', productType: 'Peanut- Yellow 10kg', region: 'Regular', packageSize: '10kg', openingStock: 3, minimumStock: 5, notes: 'Nuts' },
  { sku: '1143-5KG', productType: 'Peanut- Yellow 5kg', region: 'Regular', packageSize: '5kg', openingStock: 34, minimumStock: 10, notes: 'Nuts' },
  { sku: '1143-5KG-W', productType: 'Peanut- White 5kg', region: 'Regular', packageSize: '5kg', openingStock: 6, minimumStock: 10, notes: 'Nuts' }
];

/**
 * Load finished goods opening inventory to Google Sheets
 */
export async function loadFinishedGoodsOpeningInventory(accessToken, onProgress) {
  const results = {
    success: [],
    failed: [],
    updated: []
  };

  // Check if there are items to load
  if (FINISHED_GOODS_OPENING_INVENTORY.length === 0) {
    throw new Error('No finished goods opening inventory items to load.');
  }

  try {
    // Get existing finished goods inventory
    const existingData = await getSheetData('Finished Goods Inventory', accessToken);
    const headers = existingData && existingData.length > 0 ? existingData[0] : [];

    // Create SKU index for existing items
    const skuIndex = {};
    if (existingData && existingData.length > 1) {
      for (let i = 1; i < existingData.length; i++) {
        const row = existingData[i];
        const sku = row[0]; // SKU is first column
        if (sku) {
          skuIndex[sku] = i;
        }
      }
    }

    for (let i = 0; i < FINISHED_GOODS_OPENING_INVENTORY.length; i++) {
      const item = FINISHED_GOODS_OPENING_INVENTORY[i];

      try {
        if (onProgress) {
          onProgress(i + 1, FINISHED_GOODS_OPENING_INVENTORY.length, item.productType);
        }

        const openingStock = parseInt(item.openingStock);
        const minimumStock = parseInt(item.minimumStock || 0);

        // Validate stock is a valid number
        if (isNaN(openingStock)) {
          throw new Error(`Invalid opening stock: ${item.openingStock}`);
        }

        // Determine status based on stock level
        let status = 'ACTIVE';
        if (openingStock === 0) {
          status = 'OUT_OF_STOCK';
        } else if (openingStock <= minimumStock) {
          status = 'LOW_STOCK';
        }

        // Check if SKU exists
        const existingRowIndex = skuIndex[item.sku];

        if (existingRowIndex !== undefined) {
          // Update existing row
          const existingRow = existingData[existingRowIndex];
          const currentStock = parseInt(existingRow[4] || 0);
          const newStock = currentStock + openingStock;

          // Prepare updated row
          const updatedRow = [
            item.sku,
            item.productType,
            item.region,
            item.packageSize,
            newStock,
            minimumStock,
            status,
            new Date().toISOString(),
            item.notes || 'Opening Inventory'
          ];

          // Update the row in the sheet
          await updateSheetData(
            'Finished Goods Inventory',
            `A${existingRowIndex + 1}:I${existingRowIndex + 1}`,
            [updatedRow],
            accessToken
          );

          results.updated.push(`${item.sku} - ${item.productType}`);
        } else {
          // Add new row
          const newRow = [
            item.sku,
            item.productType,
            item.region,
            item.packageSize,
            openingStock,
            minimumStock,
            status,
            new Date().toISOString(),
            item.notes || 'Opening Inventory'
          ];

          // Append to sheet
          await appendSheetData('Finished Goods Inventory', newRow, accessToken);

          results.success.push(`${item.sku} - ${item.productType}`);
        }

      } catch (error) {
        console.error(`Failed to load ${item.sku}:`, error);
        results.failed.push({
          sku: item.sku,
          productType: item.productType,
          error: error.message
        });
      }
    }

  } catch (error) {
    console.error('Error loading finished goods opening inventory:', error);
    throw error;
  }

  return results;
}

// Helper function to append data (import from sheetsAPI if available)
async function appendSheetData(sheetName, row, accessToken) {
  const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to append data: ${response.statusText}`);
  }

  return await response.json();
}
