# 📦 ARSinv - Stock Management System

Comprehensive stock management application for tracking salesman transfers and stock outwards movements.

## 🎯 Purpose

ARSinv consolidates all outbound stock movements into a single application:
- **Salesman Transfer**: Stock transfers to sales personnel
- **Stock Outwards**: Non-sales stock movements (damages, samples, returns, etc.)

## 🚀 Features

### 1. Salesman Stock Transfer
- Track inventory transfers to salesmen
- Monitor salesman stock levels
- Real-time transfer history
- Return tracking

### 2. Stock Outwards (6 Categories)
- **Damaged Goods**: Items that are damaged/defective
- **Sample/Promotion**: Marketing samples and promotional items
- **Return to Supplier**: Items returned to suppliers
- **Internal Use**: Stock used internally (testing, demos, etc.)
- **Transfer to Regional Warehouse**: Inter-warehouse transfers
- **Other**: Miscellaneous outward movements

### 3. Module Switching
- Toggle between Inventory and Stock Outwards modules
- Unified interface for all stock movements
- Real-time statistics and filtering

## 📁 File Structure

```
apps/arsinv/
├── Code.gs          # Google Apps Script backend (836 lines)
├── app.js           # Frontend JavaScript (1268 lines)
├── index.html       # Main HTML/CSS UI (1342 lines)
├── config.js        # Google Apps Script URL configuration
├── sw.js            # Service worker for offline support
├── manifest.json    # PWA manifest
├── netlify.toml     # Netlify deployment config
├── _redirects       # Netlify redirects
└── README.md        # This file
```

## 🔧 Setup

### 1. Google Apps Script Deployment

1. Go to https://script.google.com
2. Create new project named "ARSinv Backend"
3. Copy contents of `Code.gs` to the script editor
4. Deploy as Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployment URL

### 2. Configure Frontend

Update `config.js` with your Google Apps Script URL:

```javascript
const CONFIG = {
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
};
```

### 3. Deploy to Netlify

The app is configured for automatic deployment via the root `netlify.toml`:

```toml
[[redirects]]
  from = "https://arsinv.yoursite.com/*"
  to = "/apps/arsinv/:splat"
  status = 200
```

## 📊 Google Sheets Structure

The backend creates/uses the following sheets:

### STOCK_OUTWARDS Sheet
| Column | Description |
|--------|-------------|
| Date | Transaction date (YYYY-MM-DD) |
| Time | Transaction time (HH:MM:SS) |
| Category | One of 6 outward categories |
| Product Category | Raw Material / Finished Goods |
| Product Code | SKU or product identifier |
| Product Name | Product description |
| Quantity | Number of units |
| Recipient | Who received the stock |
| Notes | Additional information |

### INVENTORY_SNAPSHOT Sheet
Salesman transfer and inventory tracking

### Other Sheets
- ACTIVE_USERS
- ITEM_LOCKS
- METADATA
- CASH_RECONCILIATION
- CASH_DENOMINATIONS
- SALES_ITEMS

## 🔌 Integration with Inventory App

The Inventory app (`apps/inventory`) consumes data from ARSinv:

```javascript
// In FinishedGoodsTab.jsx (line 107-109)
// Load movements OUT from stock outwards (arsinv app data)
const movementsOut = []; // Fetch from arsinv STOCK_OUTWARDS sheet
```

**Integration Flow:**
1. ARSinv saves stock outwards to Google Sheets
2. Inventory app reads STOCK_OUTWARDS sheet via API
3. Displays outbound movements in "Movements" section
4. Calculates: `Closing = Opening + Inbound - Outbound`

## 🛠️ Development

### Local Development
```bash
# Serve locally
npx serve apps/arsinv

# Or use Python
python3 -m http.server 8000
```

### Testing
1. Open browser to local server
2. Switch between Inventory and Stock Outwards modules
3. Submit test entries
4. Verify data appears in Google Sheets

## 📝 API Endpoints (Code.gs)

### saveStockOutwards(data)
Saves stock outward transaction to STOCK_OUTWARDS sheet.

**Parameters:**
```javascript
{
  date: 'YYYY-MM-DD',
  category: 'Damaged Goods' | 'Sample/Promotion' | ...,
  productCategory: 'Raw Material' | 'Finished Goods',
  productCode: 'SKU',
  productName: 'Product description',
  quantity: Number,
  recipient: 'Recipient name',
  notes: 'Optional notes'
}
```

**Returns:**
```javascript
{
  status: 'success' | 'error',
  data: { message: '...' } | 'Error message'
}
```

### getStockOutwards(data)
Retrieves all stock outward transactions.

**Returns:**
```javascript
{
  status: 'success',
  data: [
    {
      date: '2025-11-10',
      time: '14:30:00',
      category: 'Damaged Goods',
      productCategory: 'Finished Goods',
      productCode: 'FG001',
      productName: 'Product A',
      quantity: 10,
      recipient: 'Warehouse Manager',
      notes: 'Water damage'
    },
    // ... more entries
  ]
}
```

## 🔐 Security

- Read-only Google Apps Script deployment (anyone can access)
- No authentication required for viewing data
- All writes go through Apps Script backend
- CORS handled by Google Apps Script

## 📱 Progressive Web App (PWA)

ARSinv is a Progressive Web App with:
- Offline support via Service Worker
- Install prompt for mobile devices
- Responsive design for all screen sizes

## 🎨 UI Features

- **Module Tabs**: Switch between Inventory and Stock Outwards
- **Statistics Dashboard**: Real-time counts and totals
- **Filtering**: Filter by date, category, product
- **Export**: Download data as CSV/Excel
- **Search**: Quick search across all fields
- **Responsive Tables**: Mobile-friendly data tables

## 📈 Future Enhancements

- [ ] Role-based access control
- [ ] Approval workflow for stock outwards
- [ ] Email notifications
- [ ] Barcode scanning
- [ ] Photo upload for damaged goods
- [ ] Integration with ERP systems
- [ ] Advanced analytics and reporting

## 🐛 Troubleshooting

### Data not saving
1. Check Google Apps Script URL in `config.js`
2. Verify Apps Script deployment is active
3. Check browser console for errors
4. Ensure Google Sheets permissions are correct

### Module not switching
1. Clear browser cache
2. Check `app.js` is loaded correctly
3. Verify `switchModule()` function exists

### CORS errors
1. Redeploy Google Apps Script
2. Ensure "Anyone" has access to the web app
3. Check network tab for failed requests

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify Google Sheets structure matches documentation
3. Test with sample data first
4. Review recent commits for breaking changes

## 📄 License

Part of the Production System monorepo.

---

**Version**: 2.0
**Last Updated**: 2025-11-10
**Maintained By**: Production System Team
