# Raw Material Management - Google Sheets Setup

This guide explains how to set up Google Sheets for the Raw Material Management application.

## Overview

The Raw Material Management system uses **2 sheets** to track inventory and transactions:

1. **Raw Material Inventory** - Current stock with batch and expiry tracking
2. **Raw Material Transactions** - Complete transaction history (Stock In/Out)

---

## Sheet 1: Raw Material Inventory

**Purpose:** Track current raw material stock with batch numbers and expiry dates

### Column Structure (13 columns)

| Column | Header | Type | Description | Example |
|--------|--------|------|-------------|---------|
| A | Date | Date | Date of stock receipt | 2025-01-15 |
| B | Material Name | Text | Name of the raw material | Sunflower Seeds |
| C | Category | Text | Material category | Base Item |
| D | Unit | Text | Unit of measurement | KG |
| E | Quantity | Number | Stock quantity | 500.00 |
| F | Supplier | Text | Supplier name | ABC Suppliers Ltd |
| G | Batch Number | Text | Batch/Lot number | BATCH-2025-001 |
| H | Expiry Date | Date | Expiry date (if applicable) | 2025-12-31 |
| I | Unit Price | Number | Price per unit | 2.50 |
| J | Total Cost | Number | Total cost (Quantity × Unit Price) | 1250.00 |
| K | Status | Text | Stock status | ACTIVE |
| L | Created At | Timestamp | Record creation timestamp | 2025-01-15T10:30:00Z |
| M | Notes | Text | Additional notes | First batch of the year |

### Header Row (Row 1)

```
Date | Material Name | Category | Unit | Quantity | Supplier | Batch Number | Expiry Date | Unit Price | Total Cost | Status | Created At | Notes
```

### Status Values

- `ACTIVE` - Stock is active and available
- `CONSUMED` - Stock has been fully used
- `EXPIRED` - Stock has expired

### Categories

1. **Base Item**
   - Sunflower Seeds
   - Pumpkin Seeds
   - Melon Seeds
   - Raw Corn
   - Raw Peanut

2. **Flavours and Additives**
   - Salt
   - Butter Flavour
   - Cheese Flavour
   - Vegetable Oil

3. **Packing Material**
   - Cartons and Boxes
   - Packing Roll
   - Packing Cover

### Units by Material Type

**Base Items:** KG (Kilograms)
**Flavours and Additives:** KG (Kilograms) or LITERS (for Vegetable Oil)
**Packing Materials:** UNITS, ROLLS, or UNITS

---

## Sheet 2: Raw Material Transactions

**Purpose:** Complete audit trail of all stock movements (in and out)

### Column Structure (14 columns)

| Column | Header | Type | Description | Example |
|--------|--------|------|-------------|---------|
| A | Timestamp | Timestamp | Transaction timestamp | 2025-01-15T14:25:00Z |
| B | Transaction Date | Date | Date of transaction | 2025-01-15 |
| C | Transaction Type | Text | Type of transaction | Stock In |
| D | Material Name | Text | Name of the material | Salt |
| E | Category | Text | Material category | Flavours and Additives |
| F | Unit | Text | Unit of measurement | KG |
| G | Stock In Qty | Number | Quantity received (0 for Stock Out) | 100.00 |
| H | Stock Out Qty | Number | Quantity issued (0 for Stock In) | 0 |
| I | Supplier | Text | Supplier name (Stock In only) | XYZ Trading |
| J | Batch Number | Text | Batch/Lot number | LOT-2025-042 |
| K | Unit Price | Number | Price per unit | 1.20 |
| L | Total Cost | Number | Total transaction cost | 120.00 |
| M | Notes | Text | Transaction notes | For production batch WIP-SUN-250115-001 |
| N | User | Text | User who made the transaction | System |

### Header Row (Row 1)

```
Timestamp | Transaction Date | Transaction Type | Material Name | Category | Unit | Stock In Qty | Stock Out Qty | Supplier | Batch Number | Unit Price | Total Cost | Notes | User
```

### Transaction Types

- `Stock In` - Material received/purchased
- `Stock Out` - Material issued for production
- `Adjustment` - Stock adjustment (future use)

---

## Setup Instructions

### Step 1: Create New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it: **"Raw Material Management System"**

### Step 2: Create Sheet 1 - Raw Material Inventory

1. Rename the first sheet to **"Raw Material Inventory"**
2. In Row 1, add the following headers (A1 to M1):
   ```
   Date | Material Name | Category | Unit | Quantity | Supplier | Batch Number | Expiry Date | Unit Price | Total Cost | Status | Created At | Notes
   ```
3. **Format the sheet:**
   - Select Row 1 (headers) → Make it **bold** and add **background color** (light gray)
   - Column A (Date): Format → Number → Date
   - Column E (Quantity): Format → Number → Number (2 decimals)
   - Column H (Expiry Date): Format → Number → Date
   - Column I (Unit Price): Format → Number → Currency
   - Column J (Total Cost): Format → Number → Currency
   - Column L (Created At): Format → Number → Date time
   - Freeze Row 1: View → Freeze → 1 row

### Step 3: Create Sheet 2 - Raw Material Transactions

1. Add a new sheet (click + button)
2. Name it **"Raw Material Transactions"**
3. In Row 1, add the following headers (A1 to N1):
   ```
   Timestamp | Transaction Date | Transaction Type | Material Name | Category | Unit | Stock In Qty | Stock Out Qty | Supplier | Batch Number | Unit Price | Total Cost | Notes | User
   ```
4. **Format the sheet:**
   - Select Row 1 (headers) → Make it **bold** and add **background color** (light blue)
   - Column A (Timestamp): Format → Number → Date time
   - Column B (Transaction Date): Format → Number → Date
   - Column G (Stock In Qty): Format → Number → Number (2 decimals)
   - Column H (Stock Out Qty): Format → Number → Number (2 decimals)
   - Column K (Unit Price): Format → Number → Currency
   - Column L (Total Cost): Format → Number → Currency
   - Freeze Row 1: View → Freeze → 1 row

### Step 4: Set Permissions

1. Click **Share** button (top right)
2. Under "General access" → Change to **"Anyone with the link"**
3. Set permission to **"Editor"** (app needs write access)
4. Click **Copy link** and save it
5. Extract the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
   Copy the SHEET_ID part

### Step 5: Configure Environment Variables

1. In your raw-material app folder, create `.env` file:
   ```bash
   cd apps/raw-material
   cp .env.example .env
   ```

2. Edit `.env` and add:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_SHEET_ID=your-sheet-id-here
   ```

---

## Features

### 1. Stock In Transaction
- Records new material purchases
- Tracks supplier, batch number, and expiry date
- Calculates total cost automatically
- Adds to inventory and transaction history

### 2. Stock Out Transaction
- Records material usage for production
- Links to production batches via notes
- Updates transaction history
- Reduces available inventory

### 3. Expiry Tracking
- Automatically identifies materials expiring within 30 days
- Highlights expired items in red
- Shows nearest expiry date for each material

### 4. Low Stock Alerts
- Monitors stock levels across all batches
- Groups by material and category
- Shows total available stock

### 5. Multi-Batch Management
- Tracks multiple batches per material
- FIFO (First In, First Out) visibility
- Batch-level expiry tracking

---

## Data Flow

```
Stock In → Raw Material Inventory (new row) + Raw Material Transactions (new row)
Stock Out → Raw Material Transactions (new row only)
```

---

## Example Data

### Raw Material Inventory (Sample Rows)

| Date | Material Name | Category | Unit | Quantity | Supplier | Batch Number | Expiry Date | Unit Price | Total Cost | Status | Created At | Notes |
|------|---------------|----------|------|----------|----------|--------------|-------------|------------|------------|---------|------------|-------|
| 2025-01-15 | Sunflower Seeds | Base Item | KG | 500.00 | ABC Suppliers | BATCH-001 | 2025-12-31 | 2.50 | 1250.00 | ACTIVE | 2025-01-15T10:00:00Z | First delivery |
| 2025-01-16 | Salt | Flavours and Additives | KG | 200.00 | XYZ Trading | LOT-042 | N/A | 1.20 | 240.00 | ACTIVE | 2025-01-16T11:30:00Z | |
| 2025-01-17 | Packing Roll | Packing Material | ROLLS | 50 | PackCo Ltd | PR-2025-01 | N/A | 15.00 | 750.00 | ACTIVE | 2025-01-17T09:15:00Z | Premium quality |

### Raw Material Transactions (Sample Rows)

| Timestamp | Transaction Date | Transaction Type | Material Name | Category | Unit | Stock In Qty | Stock Out Qty | Supplier | Batch Number | Unit Price | Total Cost | Notes | User |
|-----------|------------------|------------------|---------------|----------|------|--------------|---------------|----------|--------------|------------|------------|-------|------|
| 2025-01-15T10:00:00Z | 2025-01-15 | Stock In | Sunflower Seeds | Base Item | KG | 500.00 | 0 | ABC Suppliers | BATCH-001 | 2.50 | 1250.00 | First delivery | System |
| 2025-01-18T14:20:00Z | 2025-01-18 | Stock Out | Sunflower Seeds | Base Item | KG | 0 | 50.00 | N/A | N/A | 0 | 0 | For production WIP-SUN-250118-001 | System |
| 2025-01-19T09:30:00Z | 2025-01-19 | Stock In | Salt | Flavours and Additives | KG | 100.00 | 0 | XYZ Trading | LOT-055 | 1.20 | 120.00 | Monthly order | System |

---

## Integration with Production App

The Raw Material Management system connects with the Production app:

1. **Stock Out for Production**: When materials are used in production, record a "Stock Out" transaction
2. **Notes Field**: Reference the production batch ID (e.g., "For WIP-SUN-250118-001")
3. **Traceability**: Full audit trail from raw material to finished product

---

## Maintenance

### Regular Tasks

1. **Weekly**: Review expiring materials
2. **Monthly**: Reconcile physical inventory with system
3. **Quarterly**: Archive old transactions (move to archive sheet)
4. **As Needed**: Update supplier information

### Data Validation

The app automatically validates:
- Quantity > 0
- Valid category and material selections
- Proper date formats
- Required fields are filled

---

## Troubleshooting

### Common Issues

**Problem**: "Failed to append data"
- **Solution**: Check sheet permissions (must be "Editor")

**Problem**: "Sheet not found"
- **Solution**: Verify sheet names match exactly: "Raw Material Inventory" and "Raw Material Transactions"

**Problem**: "Authentication failed"
- **Solution**: Check Google Client ID in .env file

**Problem**: Wrong data appearing in app
- **Solution**: Verify VITE_SHEET_ID matches your Google Sheet

---

## Security Notes

⚠️ **Important**: The Google Sheet contains sensitive business data
- Use secure Google account
- Enable 2-factor authentication
- Regularly review access logs
- Don't share the sheet link publicly
- Keep environment variables (.env) confidential

---

## Next Steps

After setting up the sheets:

1. ✅ Configure the environment variables in `.env`
2. ✅ Set up Google Cloud OAuth credentials
3. ✅ Test with sample Stock In transaction
4. ✅ Verify data appears correctly in both sheets
5. ✅ Test Stock Out transaction
6. ✅ Check expiry tracking and alerts

For deployment instructions, see: `NETLIFY_DEPLOYMENT_GUIDE.md`
