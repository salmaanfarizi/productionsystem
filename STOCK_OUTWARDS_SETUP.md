# Stock Outwards Feature Setup Guide v2.0

## Overview

The Stock Outwards feature tracks inventory that goes out (sales, distributions, deliveries, damages, etc.) from your finished goods inventory. This complements the existing inward tracking by providing complete visibility of stock movements.

### Key Features

- **Multiple outwards categories** (Salesman Transfers, Damaged Goods, Samples, Returns, etc.)
- **Auto-sync with Salesman App** (arsinv repository) for transfers
- **Manual entry** for other types of outwards
- **Complete transaction history** with advanced filtering
- **Real-time statistics** and category breakdown

## Outwards Categories

The system supports **6 types** of stock outwards:

| Category | Icon | Description | Data Entry |
|----------|------|-------------|------------|
| 🚚 **Salesman Transfer** | Blue | Stock transferred to salesmen | **Auto-synced from arsinv** |
| 💔 **Damaged Goods** | Red | Damaged or spoiled goods | Manual entry |
| 🎁 **Sample/Promotion** | Purple | Samples or promotional items | Manual entry |
| ↩️ **Return to Supplier** | Orange | Returns to supplier | Manual entry |
| 🏢 **Internal Use** | Green | Internal consumption | Manual entry |
| 📦 **Other** | Gray | Other outward movements | Manual entry |

## Architecture

### Data Flow

```
┌─────────────────┐
│ Production App  │
└────────┬────────┘
         ↓
┌────────────────┐
│ WIP Inventory  │
└────────┬───────┘
         ↓
┌────────────────┐
│  Packing App   │
└────────┬───────┘
         ↓
┌─────────────────────────────┐
│  Finished Goods Inventory   │
└──────────┬──────────────────┘
           ↓
    ┌──────────────┐
    │ STOCK        │
    │ OUTWARDS     │
    └──┬────────┬──┘
       │        │
   ┌───┴───┐ ┌─┴──────────┐
   │Manual │ │Auto-Synced │
   │Entry  │ │from arsinv │
   │       │ │(Salesmen)  │
   └───────┘ └────────────┘
```

### Repository Connection

The Stock Outwards feature connects with the **arsinv repository** (Salesman Inventory App):

- **Arsinv Repository**: https://github.com/salmaanfarizi/arsinv
- **Spreadsheet ID**: `1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0`
- **Data Source**: `INVENTORY_SNAPSHOT` sheet
- **Sync Method**: Google Sheets API v4

## Setup Instructions

### Step 1: Update Google Apps Script

1. Open your Google Spreadsheet
2. Go to **Extensions → Apps Script**
3. Update `BatchTracking.js` with the new code
4. Click **Run → Select function → initializeSheets**
5. Grant permissions if prompted

This will create/update the "Stock Outwards" sheet with these columns:

| Column | Description |
|--------|-------------|
| Date | Transaction date |
| **Category** | Type of outwards (NEW!) |
| SKU | Product SKU |
| Product Type | Type of product |
| Package Size | Package size (e.g., 200g) |
| Region | Destination region |
| Quantity | Quantity out |
| Customer | Customer/recipient name |
| Invoice | Invoice/reference number |
| Notes | Additional notes |
| **Source** | Data source: 'manual' or 'arsinv' (NEW!) |
| Timestamp | Auto-generated timestamp |

### Step 2: Configure Google Sheets API

To enable syncing with the arsinv (Salesman App), you need a Google Sheets API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Google Sheets API**:
   - Navigation → APIs & Services → Library
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create API Key:
   - Navigation → APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

### Step 3: Configure Environment Variables

Update your inventory app's `.env` file:

```bash
# Your main production spreadsheet
VITE_SPREADSHEET_ID=your-production-spreadsheet-id-here

# Google Sheets API Key (Required for Salesman Sync)
VITE_GOOGLE_SHEETS_API_KEY=AIza...your-api-key-here

# Arsinv Spreadsheet ID (Optional - defaults to salmaanfarizi's arsinv)
VITE_ARSINV_SPREADSHEET_ID=1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0
```

### Step 4: Deploy the Apps

```bash
# From the project root
npm run build
npm run deploy
```

## Using the Feature

### Auto-Syncing Salesman Transfers

1. Open Inventory App → **📤 Stock Outwards** tab
2. Click **"Sync Salesman Data"** button
3. The system fetches transfer data from the arsinv spreadsheet
4. Synced transactions appear with:
   - Category: 🚚 Salesman Transfer
   - Source: 🔄 Synced
5. Last sync time is displayed at the top

**What gets synced:**
- Transfers from the `INVENTORY_SNAPSHOT` sheet in arsinv
- Both "Transfer" and "Additional Transfer" columns
- All routes: Al-Hasa 1, Al-Hasa 2, Al-Hasa 3, Al-Hasa 4, Al-Hasa Wholesale

### Adding Manual Outwards

1. Click **"Add Manual Entry"** button
2. Fill in the form:
   - **Date**: Transaction date
   - **Category**: Select type (Damaged, Sample, Return, etc.)
     - ⚠️ Cannot manually enter "Salesman Transfer"
   - **SKU**: Product SKU
   - **Product Type**: Select from dropdown
   - **Quantity**: Amount going out
   - **Optional**: Package Size, Region, Customer, Reference, Notes
3. Click **"Save Outwards"**

### Filtering Transactions

Use the filter panel to narrow results:

- **Category**: Filter by outwards type
- **Product Type**: Filter by product
- **Region**: Filter by region/route
- **Date Range**: Filter by date (from/to)

### Understanding the Dashboard

**Summary Cards:**
- Total Transactions
- Total Quantity Out
- Unique Products
- Salesman Transfers Count

**Category Breakdown:**
- Visual grid showing count per category
- Icons for easy identification

**Transaction Table:**
- Complete history with all details
- Color-coded category badges
- Source indicator (Synced vs Manual)
- Sortable by date (newest first)

## Troubleshooting

### Sync button not appearing

**Cause**: API key not configured

**Solution**: Add `VITE_GOOGLE_SHEETS_API_KEY` to your `.env` file

### Sync fails with API error

**Possible causes:**
1. Invalid API key
2. Google Sheets API not enabled
3. Arsinv spreadsheet not accessible

**Solutions:**
1. Verify API key is correct
2. Enable Google Sheets API in Google Cloud Console
3. Check spreadsheet sharing permissions
4. Try accessing the spreadsheet directly: `https://docs.google.com/spreadsheets/d/1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0`

### Cannot add Salesman Transfer manually

**This is intentional!** Salesman Transfers are auto-synced from the arsinv app. Select a different category for manual entry.

### No data in synced transactions

**Possible causes:**
1. Arsinv spreadsheet has no data
2. Filters are too restrictive
3. Date range doesn't match arsinv data

**Solutions:**
1. Check the arsinv spreadsheet directly
2. Reset filters to "All"
3. Adjust date range or remove it

### Duplicate entries

**Cause**: Syncing multiple times without clearing previous data

**Note**: Synced data is stored in browser memory (not saved to your spreadsheet). It will reset when you refresh the page. Only manual entries are saved to Google Sheets.

## Technical Details

### Files Created/Modified

**New Files:**
- `shared/config/outwardsConfig.js` - Category definitions and arsinv config
- `shared/utils/arsinvSync.js` - Arsinv sync utilities
- `apps/inventory/src/components/StockOutwards.jsx` - Main component (updated)

**Modified Files:**
- `apps/inventory/src/App.jsx` - Added Stock Outwards tab
- `apps/inventory/.env.example` - Added API key configuration
- `google-apps-script/BatchTracking.js` - Updated Stock Outwards sheet structure

### API Integration

**Arsinv Data Fetching:**
- Method: Google Sheets API v4 (REST)
- Endpoint: `https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}`
- Sheet: `INVENTORY_SNAPSHOT`
- Columns Used: Date, Route, Category, Code, Item Name, Transfer, T.Unit, Additional Transfer, Add Unit

**Data Mapping:**
| Arsinv Column | Maps To | Notes |
|---------------|---------|-------|
| Date | Date | Transaction date |
| Route | Region | Al-Hasa 1-4, Wholesale |
| Category | Product Type | Sunflower, Melon, etc. |
| Code | SKU | Item code |
| Item Name | Package Size | 200g, 800g, etc. |
| Transfer | Quantity | Main transfer quantity |
| Additional Transfer | Quantity | Secondary transfer |

### Data Storage

- **Manual Entries**: Saved to Google Sheets "Stock Outwards"
- **Synced Transfers**: Kept in browser state (localStorage for sync timestamp)
- **Combined View**: Merges both sources for display

## Workflow Examples

### Daily Salesman Distribution

1. Salesman app (arsinv) records daily inventory transfers
2. Inventory manager opens Stock Outwards tab
3. Clicks "Sync Salesman Data"
4. Reviews transferred quantities by route
5. Filters by date to see today's distributions

### Damaged Goods Recording

1. Click "Add Manual Entry"
2. Category: "Damaged Goods"
3. Enter SKU, Product Type, Quantity
4. Notes: "Water damage in storage"
5. Save

### Monthly Reports

1. Set date range: First to last day of month
2. Filter by category to see breakdown
3. Export data if needed
4. Review statistics per category

## Future Enhancements

### Planned Features

1. **Automatic Inventory Deduction**
   - When outwards recorded, reduce Finished Goods stock
   - Real-time net stock calculation

2. **Persistent Arsinv Sync**
   - Save synced data to Google Sheets
   - Prevent duplicate syncing
   - Track sync history

3. **Advanced Analytics**
   - Daily/Monthly trends
   - Top products going out
   - Distribution by region
   - Category-wise analysis

4. **Alerts & Notifications**
   - High outward volume alerts
   - Unusual damaged goods patterns
   - Daily sync reminders

5. **Batch Operations**
   - Bulk entry for multiple SKUs
   - Import from CSV
   - Export filtered results

## Support & Feedback

If you encounter issues:
1. Check this documentation
2. Review browser console for errors
3. Verify Google Sheets permissions
4. Check API key configuration

---

**Version**: 2.0
**Last Updated**: October 25, 2025
**Feature**: Multi-Category Stock Outwards with Arsinv Sync
