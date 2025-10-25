# Stock Outwards Feature Setup Guide

## Overview

The Stock Outwards feature allows you to track inventory that goes out (sales, distributions, deliveries) from your finished goods inventory. This complements the existing inward tracking by providing complete visibility of stock movements.

## Features

### 1. **Stock Outwards Tab**
- New tab in the Inventory app (📤 Stock Outwards)
- Record outward transactions with detailed information
- View complete history of all outward movements
- Filter by product type, region, and date range

### 2. **Transaction Recording**
Track the following information for each outward movement:
- **Date**: When the stock went out
- **SKU**: Stock Keeping Unit (e.g., SF-200-RH)
- **Product Type**: Type of product (Sunflower Seeds, Pumpkin Seeds, etc.)
- **Package Size**: Size of the package (e.g., 200g, 800g)
- **Region**: Destination region
- **Quantity**: Amount going out (in units)
- **Customer**: Customer/recipient name (optional)
- **Invoice/Reference**: Invoice or reference number (optional)
- **Notes**: Additional notes (optional)

### 3. **Real-time Statistics**
- Total number of outward transactions
- Total quantity distributed
- Number of unique products
- Number of unique customers

### 4. **Filtering & Search**
- Filter by product type
- Filter by region
- Filter by date range (from/to)
- View filtered transaction history

## Google Sheets Setup

### Step 1: Update Google Apps Script

1. Open your Google Spreadsheet
2. Go to **Extensions → Apps Script**
3. The `BatchTracking.js` file has been updated with Stock Outwards support
4. Copy the updated content from:
   ```
   /google-apps-script/BatchTracking.js
   ```

### Step 2: Initialize the Stock Outwards Sheet

1. In Apps Script editor, click **Run → Select function → initializeSheets**
2. Grant permissions if prompted
3. This will create a new sheet called "Stock Outwards" with the following columns:

| Column | Description |
|--------|-------------|
| Date | Transaction date |
| SKU | Product SKU |
| Product Type | Type of product |
| Package Size | Package size (e.g., 200g) |
| Region | Destination region |
| Quantity | Quantity out |
| Customer | Customer name |
| Invoice | Invoice/reference number |
| Notes | Additional notes |
| Timestamp | Auto-generated timestamp |

### Step 3: Verify Sheet Creation

1. Go back to your spreadsheet
2. You should see a new tab: **"Stock Outwards"**
3. The sheet should have a blue header row with all column names

## Using the Feature

### Recording an Outward Transaction

1. Open the Inventory app
2. Click on the **📤 Stock Outwards** tab
3. Click the **Record Outwards** button
4. Fill in the required fields:
   - Date (defaults to today)
   - SKU (e.g., SF-200-RH)
   - Product Type (select from dropdown)
   - Quantity (number of units)
5. Fill in optional fields:
   - Package Size
   - Region
   - Customer name
   - Invoice/reference number
   - Notes
6. Click **Save Outwards**

### Viewing Transaction History

1. The table shows all outward transactions, sorted by date (newest first)
2. Use filters to narrow down results:
   - **Product Type**: Filter by specific product
   - **Region**: Filter by destination region
   - **Date From/To**: Filter by date range

### Understanding the Statistics

The summary cards at the top show:
- **Total Transactions**: How many outward movements have been recorded
- **Total Quantity Out**: Sum of all quantities distributed
- **Unique Products**: Number of different SKUs that went out
- **Unique Customers**: Number of different customers served

## Integration with Existing System

### Data Flow

```
Production App → WIP Inventory → Packing App → Finished Goods Inventory
                                                           ↓
                                                   Stock Outwards
```

### Future Enhancements (Planned)

1. **Automatic Inventory Deduction**
   - When an outward transaction is recorded, automatically reduce the "Current Stock" in Finished Goods Inventory

2. **Net Stock Calculation**
   - Update Finished Goods Inventory to show:
     - Total Inwards
     - Total Outwards
     - Net Stock = Inwards - Outwards

3. **Analytics & Reports**
   - Daily/Monthly outwards summary
   - Top customers by volume
   - Product distribution by region
   - Trend analysis

4. **Integration with arsinv System**
   - Sync data between productionsystem and arsinv repository
   - Unified inventory view across both systems

## Troubleshooting

### Issue: "Stock Outwards" sheet not found

**Solution**: Run the `initializeSheets()` function in Apps Script to create the sheet.

### Issue: Form submission fails

**Solution**:
1. Check that you have edit permissions on the Google Spreadsheet
2. Verify the SPREADSHEET_ID in your `.env` file
3. Check browser console for specific error messages

### Issue: Data not appearing after submission

**Solution**:
1. Click the **Refresh All** button in the app header
2. Check the Google Sheet directly to verify data was saved
3. Clear browser cache and reload the app

## Technical Details

### Files Modified

1. **Frontend**:
   - `apps/inventory/src/components/StockOutwards.jsx` (NEW)
   - `apps/inventory/src/App.jsx` (UPDATED - added Stock Outwards tab)

2. **Backend**:
   - `google-apps-script/BatchTracking.js` (UPDATED - added Stock Outwards sheet initialization)

### API Integration

The component uses the existing `sheetsAPI` utilities:
- `readSheetData('Stock Outwards')` - Fetch transaction history
- `appendSheetData('Stock Outwards', rowData)` - Add new transaction
- `parseSheetData(rawData)` - Parse sheet data into JSON format

## Next Steps

1. ✅ Set up the Stock Outwards sheet using the steps above
2. ✅ Test recording a few sample transactions
3. 📋 Monitor the transaction history
4. 🔄 Provide feedback for future enhancements

## Support

If you encounter any issues or have questions:
1. Check this documentation
2. Review the browser console for error messages
3. Verify Google Sheets permissions
4. Check that all required fields are filled when recording transactions

---

**Last Updated**: October 25, 2025
**Version**: 1.0
**Feature**: Stock Outwards Tracking
