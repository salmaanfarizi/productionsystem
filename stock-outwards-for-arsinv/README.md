# Stock Outwards Management System

A comprehensive web application for tracking all outgoing stock movements, including salesman transfers and manual outwards entries.

## Features

### 📊 Unified Stock Tracking
- **Salesman Transfers**: Auto-synced from the ARS Inventory salesman app
- **Manual Entries**: Record damaged goods, samples, returns, warehouse transfers, internal use, and more
- **Combined View**: See all outward movements in one place

### 📦 Outwards Categories
- 🚚 **Salesman Transfer**: Auto-synced from salesman inventory snapshots
- 🏭 **Regional Warehouse**: Transfers to Dammam/Riyadh stores
- 💔 **Damaged Goods**: Spoiled or damaged inventory
- 🎁 **Sample/Promotion**: Promotional items and samples
- ↩️ **Return to Supplier**: Items returned to suppliers
- 🏢 **Internal Use**: Internal consumption
- 📦 **Other**: Miscellaneous outward movements

### 🎯 Key Capabilities
- **Real-time Filtering**: By category, product type, region, and date range
- **Summary Statistics**: Total transactions, quantities, unique products
- **Category Breakdown**: Visual breakdown by outwards type
- **Google Sheets Integration**: Persistent storage with Google Sheets backend
- **Mobile Responsive**: Works seamlessly on phones and tablets

## Setup Instructions

### 1. Google Sheets Setup

1. **Create/Use Existing Spreadsheet**
   - Use the ARS Inventory spreadsheet ID: `1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0`
   - Or create a new spreadsheet

2. **Add Apps Script Functions**
   - Open your Google Sheet
   - Go to Extensions > Apps Script
   - Copy the contents of `StockOutwards.gs` to your script
   - Add the action handlers to the `handleAction()` router (instructions in StockOutwards.gs)
   - Deploy as Web App with "Anyone" access

3. **Update Configuration**
   - Edit `config.js`
   - Set `GOOGLE_SCRIPT_URL` to your deployed web app URL
   - Set `GOOGLE_SHEETS_API_KEY` if you want to sync salesman transfers
   - Set `ARSINV_SPREADSHEET_ID` if using a different spreadsheet

### 2. Enable Google Sheets API (Optional - for Salesman Sync)

If you want to sync salesman transfer data:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create credentials (API Key)
5. Restrict the API key to Google Sheets API only
6. Add the API key to `config.js` as `GOOGLE_SHEETS_API_KEY`

### 3. Deployment

#### Option A: Netlify (Recommended)

1. **Connect Repository**
   ```bash
   # From the arsinv repository root
   cd stock-outwards
   ```

2. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set build directory to `stock-outwards`
   - Deploy!

3. **Custom Domain** (Optional)
   - Configure custom domain in Netlify settings
   - Example: `outwards.arsinv.com`

#### Option B: GitHub Pages

1. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select branch and `/stock-outwards` folder
   - Save

2. **Access**
   - Your app will be available at: `https://[username].github.io/arsinv/stock-outwards/`

#### Option C: Local Development

1. **Serve Locally**
   ```bash
   cd stock-outwards
   python -m http.server 8000
   # or
   npx serve .
   ```

2. **Open Browser**
   - Navigate to `http://localhost:8000`

## Usage Guide

### Adding Manual Stock Outwards

1. Click **"Add Manual Entry"** button
2. Fill in the form:
   - **Date**: Transaction date
   - **Category**: Select type of outwards
   - **Product Type**: Choose product category
   - **SKU**: Select specific SKU (based on product type)
   - **Quantity**: Enter quantity moved out
   - **Customer/Warehouse**: Recipient information
   - **Reference**: Invoice or transfer reference
   - **Notes**: Additional details
3. Click **"Save Outwards"**

### Syncing Salesman Transfers

1. Set date range using filters
2. Click **"Sync Salesman Data"** button
3. Data will be fetched from the ARS Inventory snapshot
4. Transfers will appear with 🔄 Synced badge

### Filtering Data

Use the filter section to narrow down transactions:
- **Category**: Filter by outwards type
- **Product Type**: Filter by product category
- **Region**: Filter by geographic region
- **Date Range**: Specify from/to dates

### Viewing Summary

The dashboard shows:
- **Total Transactions**: Count of all outwards
- **Total Quantity Out**: Sum of all quantities
- **Unique Products**: Number of distinct SKUs
- **Salesman Transfers**: Count of auto-synced transfers

## File Structure

```
stock-outwards/
├── index.html          # Main HTML with embedded CSS
├── app.js             # Application logic (vanilla JavaScript)
├── config.js          # Configuration and constants
├── netlify.toml       # Netlify deployment config
├── StockOutwards.gs   # Google Apps Script backend functions
└── README.md          # This file
```

## Configuration Reference

### config.js

```javascript
const CONFIG = {
  // Google Apps Script Web App URL (required)
  GOOGLE_SCRIPT_URL: 'YOUR_DEPLOYED_SCRIPT_URL',

  // Google Sheets API Key (optional - for salesman sync)
  GOOGLE_SHEETS_API_KEY: '',

  // Arsinv Spreadsheet ID (for salesman transfer sync)
  ARSINV_SPREADSHEET_ID: '1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0',

  // Sheet name containing inventory snapshots
  ARSINV_SHEET_NAME: 'INVENTORY_SNAPSHOT'
};
```

## Troubleshooting

### Cannot Save Manual Entries
- **Check**: Is `GOOGLE_SCRIPT_URL` correctly set in config.js?
- **Check**: Is the Apps Script deployed as web app with proper permissions?
- **Check**: Are the Apps Script functions added to the router?

### Salesman Sync Not Working
- **Check**: Is `GOOGLE_SHEETS_API_KEY` configured?
- **Check**: Is Google Sheets API enabled in your Google Cloud project?
- **Check**: Is the API key restricted to Google Sheets API?
- **Check**: Does the spreadsheet have an `INVENTORY_SNAPSHOT` sheet?

### Data Not Showing
- **Check**: Browser console for errors (F12)
- **Check**: Network tab to see if API calls are successful
- **Check**: Google Sheets to verify data is being saved

## Integration with ARS Inventory System

This app integrates with the main ARS Inventory system:

1. **Salesman Inventory Snapshots** → Auto-synced as transfers
2. **Manual Outwards Entries** → Saved to `Stock Outwards` sheet
3. **Combined View** → Unified tracking of all outgoing stock

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Google Apps Script execution logs
3. Check browser console for JavaScript errors
4. Verify Google Sheets permissions and API access

## License

Part of the ARS Inventory Management System.
