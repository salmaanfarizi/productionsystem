# Loading Opening Inventory - Guide

This guide explains how to load your initial 14 opening inventory items into the Raw Material Management system.

## Quick Start

1. **Edit the data file**: Open `apps/raw-material/src/utils/loadOpeningInventory.js`
2. **Add your items**: Update the `OPENING_INVENTORY_ITEMS` array with your 14 items
3. **Run the app**: Start the development server (`npm run dev`)
4. **Authenticate**: Sign in with Google OAuth
5. **Load data**: Click "Load Opening Inventory" → expand → click the button

---

## Step-by-Step Instructions

### Step 1: Prepare Your Data

Open the file: `apps/raw-material/src/utils/loadOpeningInventory.js`

Find the `OPENING_INVENTORY_ITEMS` array (around line 28) and add your items using this format:

```javascript
export const OPENING_INVENTORY_ITEMS = [
  {
    date: '2025-01-01',                    // Opening date (YYYY-MM-DD)
    material: 'Sunflower Seeds',           // Material name
    category: 'Base Item',                 // Category (see categories below)
    unit: 'KG',                            // Unit (KG, LITERS, UNITS, ROLLS)
    quantity: 5000,                        // Quantity
    supplier: 'ABC Suppliers',             // Supplier name (optional)
    batchNumber: 'BATCH-2025-001',         // Batch/Lot number (optional)
    expiryDate: '2025-12-31',              // Expiry date YYYY-MM-DD (optional)
    unitPrice: 2.50,                       // Price per unit (optional)
    notes: 'Grade: T6 | Size: 240-250 | Unit Weight: 25 kg | ID: See High'  // Notes
  },
  // Add remaining 13 items...
];
```

### Step 2: Categories and Materials

**Valid Categories:**
1. `'Base Item'`
2. `'Flavours and Additives'`
3. `'Packing Material'`

**Valid Materials by Category:**

**Base Item:**
- Sunflower Seeds
- Pumpkin Seeds
- Melon Seeds
- Raw Corn
- Raw Peanut

**Flavours and Additives:**
- Salt
- Butter Flavour
- Cheese Flavour
- Vegetable Oil

**Packing Material:**
- Cartons and Boxes
- Packing Roll
- Packing Cover

### Step 3: Units by Material Type

**Base Items:** `'KG'` (Kilograms)

**Flavours and Additives:**
- Most items: `'KG'`
- Vegetable Oil: `'LITERS'`

**Packing Materials:**
- Cartons and Boxes: `'UNITS'`
- Packing Roll: `'ROLLS'`
- Packing Cover: `'UNITS'`

### Step 4: Sunflower Seeds Special Format

For Sunflower Seeds, use the notes field to include detailed information:

```javascript
notes: 'Grade: T6 | Size: 240-250 | Unit Weight: 25 kg | ID: See High'
```

**Available Grades:** T6, 361, 363, 601, S9, Other

**Available Sizes:** 230-240, 240-250, 250-260, 260-270, 270-280, 280-290, 290-300

**Available Unit Weights:** 20 kg, 25 kg, 50 kg

---

## Example Data Set

Here's a complete example with common items:

```javascript
export const OPENING_INVENTORY_ITEMS = [
  // Base Items
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds',
    category: 'Base Item',
    unit: 'KG',
    quantity: 5000,
    supplier: 'ABC Suppliers',
    batchNumber: 'BATCH-T6-001',
    expiryDate: '2025-12-31',
    unitPrice: 2.50,
    notes: 'Grade: T6 | Size: 240-250 | Unit Weight: 25 kg | ID: See High'
  },
  {
    date: '2025-01-01',
    material: 'Pumpkin Seeds',
    category: 'Base Item',
    unit: 'KG',
    quantity: 2000,
    supplier: 'XYZ Trading',
    batchNumber: 'BATCH-PS-001',
    expiryDate: '2025-11-30',
    unitPrice: 3.00,
    notes: 'Premium quality'
  },
  {
    date: '2025-01-01',
    material: 'Melon Seeds',
    category: 'Base Item',
    unit: 'KG',
    quantity: 1500,
    supplier: 'ABC Suppliers',
    batchNumber: 'BATCH-MS-001',
    expiryDate: '2025-10-31',
    unitPrice: 2.80,
    notes: 'Shabah variety'
  },
  {
    date: '2025-01-01',
    material: 'Raw Corn',
    category: 'Base Item',
    unit: 'KG',
    quantity: 3000,
    supplier: 'Corn Suppliers Ltd',
    batchNumber: 'BATCH-RC-001',
    expiryDate: '2025-09-30',
    unitPrice: 1.50,
    notes: ''
  },
  {
    date: '2025-01-01',
    material: 'Raw Peanut',
    category: 'Base Item',
    unit: 'KG',
    quantity: 2500,
    supplier: 'Peanut Co',
    batchNumber: 'BATCH-RP-001',
    expiryDate: '2025-08-31',
    unitPrice: 2.00,
    notes: ''
  },

  // Flavours and Additives
  {
    date: '2025-01-01',
    material: 'Salt',
    category: 'Flavours and Additives',
    unit: 'KG',
    quantity: 500,
    supplier: 'Salt Traders',
    batchNumber: 'SALT-001',
    expiryDate: '',
    unitPrice: 0.50,
    notes: 'Food grade'
  },
  {
    date: '2025-01-01',
    material: 'Butter Flavour',
    category: 'Flavours and Additives',
    unit: 'KG',
    quantity: 100,
    supplier: 'Flavour House',
    batchNumber: 'BF-001',
    expiryDate: '2025-06-30',
    unitPrice: 15.00,
    notes: 'Natural butter flavouring'
  },
  {
    date: '2025-01-01',
    material: 'Cheese Flavour',
    category: 'Flavours and Additives',
    unit: 'KG',
    quantity: 80,
    supplier: 'Flavour House',
    batchNumber: 'CF-001',
    expiryDate: '2025-06-30',
    unitPrice: 18.00,
    notes: 'Cheddar cheese flavouring'
  },
  {
    date: '2025-01-01',
    material: 'Vegetable Oil',
    category: 'Flavours and Additives',
    unit: 'LITERS',
    quantity: 300,
    supplier: 'Oil Suppliers',
    batchNumber: 'VO-001',
    expiryDate: '2025-07-31',
    unitPrice: 3.50,
    notes: 'Sunflower oil'
  },

  // Packing Materials
  {
    date: '2025-01-01',
    material: 'Cartons and Boxes',
    category: 'Packing Material',
    unit: 'UNITS',
    quantity: 1000,
    supplier: 'Packaging Co',
    batchNumber: 'BOX-001',
    expiryDate: '',
    unitPrice: 2.00,
    notes: 'Various sizes'
  },
  {
    date: '2025-01-01',
    material: 'Packing Roll',
    category: 'Packing Material',
    unit: 'ROLLS',
    quantity: 200,
    supplier: 'Packaging Co',
    batchNumber: 'PR-001',
    expiryDate: '',
    unitPrice: 15.00,
    notes: 'Standard rolls'
  },
  {
    date: '2025-01-01',
    material: 'Packing Cover',
    category: 'Packing Material',
    unit: 'UNITS',
    quantity: 5000,
    supplier: 'Packaging Co',
    batchNumber: 'PC-001',
    expiryDate: '',
    unitPrice: 0.05,
    notes: 'Clear plastic covers'
  },

  // Additional items (replace with your actual data)
  {
    date: '2025-01-01',
    material: 'Sunflower Seeds',
    category: 'Base Item',
    unit: 'KG',
    quantity: 3000,
    supplier: 'Another Supplier',
    batchNumber: 'BATCH-361-002',
    expiryDate: '2025-11-30',
    unitPrice: 2.40,
    notes: 'Grade: 361 | Size: 250-260 | Unit Weight: 20 kg'
  },
  {
    date: '2025-01-01',
    material: 'Salt',
    category: 'Flavours and Additives',
    unit: 'KG',
    quantity: 300,
    supplier: 'Salt Traders',
    batchNumber: 'SALT-002',
    expiryDate: '',
    unitPrice: 0.50,
    notes: 'Reserve stock'
  }
];
```

---

## Loading Process

### Via Web Interface

1. **Start the app:**
   ```bash
   cd apps/raw-material
   npm run dev
   ```

2. **Open browser:** Navigate to `http://localhost:3003`

3. **Authenticate:** Click "Sign in with Google" in the top right

4. **Open the loader:**
   - Find the "Load Opening Inventory" section with the 📋 icon
   - Click to expand it

5. **Review and load:**
   - Check that it shows "Items configured: 14"
   - Click "Load 14 Opening Inventory Items"
   - Confirm the action
   - Wait for completion

6. **Verify:**
   - Check for success messages
   - View the inventory list on the right
   - Verify all 14 items appear in Google Sheets

---

## What Gets Created

For each item, the system creates:

1. **Inventory Record** (in "Raw Material Inventory" sheet):
   - Date, Material, Category, Unit
   - Quantity, Supplier, Batch Number
   - Expiry Date, Unit Price, Total Cost
   - Status: ACTIVE
   - Created timestamp
   - Notes (with sunflower details if applicable)

2. **Transaction Record** (in "Raw Material Transactions" sheet):
   - Timestamp, Transaction Date
   - Transaction Type: "Stock In"
   - Material, Category, Unit
   - Stock In Qty (Stock Out = 0)
   - Supplier, Batch Number
   - Unit Price, Total Cost
   - Notes, User: "System"

---

## Troubleshooting

### Issue: "No opening inventory items configured"

**Solution:** Make sure you've added items to the `OPENING_INVENTORY_ITEMS` array and saved the file.

### Issue: "Failed to append data"

**Solution:**
- Check Google Sheets permissions (must be "Editor")
- Verify sheet names are exactly: "Raw Material Inventory" and "Raw Material Transactions"
- Ensure you're authenticated with Google

### Issue: "Items configured: 0"

**Solution:**
- Check file path: `apps/raw-material/src/utils/loadOpeningInventory.js`
- Verify the array is exported properly
- Restart the development server after making changes

### Issue: Some items failed to load

**Solution:**
- Check the error messages for specific items
- Verify material names match exactly (case-sensitive)
- Ensure categories are valid
- Check that units match the material type

---

## After Loading

Once successfully loaded:

1. **Verify in app:** Check the inventory list shows all items
2. **Verify in sheets:** Open Google Sheets and confirm data
3. **Test transactions:** Try adding a Stock Out transaction
4. **Monitor expiry:** Check that expiry alerts work correctly

---

## Notes

- This is a **one-time operation** - only use it for initial setup
- After loading, use the regular "Stock In" form for new materials
- The loader does NOT check for duplicates - be careful not to run it twice
- All items are marked as "ACTIVE" status initially
- Transaction history includes all opening inventory as "Stock In" transactions

---

## Need Help?

See the main documentation:
- `README.md` - General app information
- `RAW_MATERIAL_SHEETS_SETUP.md` - Google Sheets setup
- `NETLIFY_DEPLOYMENT_GUIDE.md` - Deployment instructions
