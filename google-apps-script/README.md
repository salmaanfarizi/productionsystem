# Google Apps Script - Production System

This directory contains the Google Apps Script code for the Production System backend that runs in Google Sheets.

## 📁 Files

### `BatchTracking.js`
Main script file containing all batch tracking logic. Deploy this to your Google Sheets.

**Key Features:**
- ✅ WIP Batch creation from Production entries
- ✅ FIFO (First In First Out) WIP consumption
- ✅ Seed Variety support (T6, 361, 363, 601, S9, Shabah, Roomy, Shine Skin, Lady Nail)
- ✅ Automatic batch ID generation (WIP-{PREFIX}-{YYMMDD}-{SEQ})
- ✅ Packing transfer tracking
- ✅ Finished Goods inventory management
- ✅ Complete audit trail in Batch Tracking
- ✅ Web API for React apps integration

**Main Functions:**
- `initializeSheets()` - Create/update all required sheets
- `createWIPFromProduction(rowNumber)` - Generate WIP batch from production entry
- `consumeWIPForPacking(packingData)` - Consume WIP for packing operations
- `getWIPInventoryStatus()` - Get current WIP status
- `searchBatches(searchTerm)` - Search batches by various criteria

### Store Update Sync (`StoreUpdateSync.js`, `StoreUpdateParser.js`, `ItemMasterSeed.js`, `MaterialStock.js`)
Copies the daily STORE UPDATE tabs from the store sheet into the database every hour
(`FG Daily`, `Sync Issues`), compares Packing app entries with it (`Parallel Check`),
and keeps packing material stock (`Material Issues`, `Material Stock`).
Runs as its own Apps Script project — see [STORE_SYNC_SETUP.md](STORE_SYNC_SETUP.md).
Tests: `npm run test:apps-script`.

### `DEPLOYMENT_GUIDE.md`
Complete step-by-step guide for:
- Installing the script in Google Sheets
- Authorization and permissions
- Deploying as Web App for API access
- Testing the system
- Troubleshooting common issues

## 🚀 Quick Start

1. **Open Google Sheets**
   ```
   https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit
   ```

2. **Open Apps Script Editor**
   - Extensions → Apps Script

3. **Copy & Paste**
   - Copy entire contents of `BatchTracking.js`
   - Paste into Apps Script editor
   - Save (Ctrl+S / Cmd+S)

4. **Initialize**
   - Run → Select function → `initializeSheets`
   - Authorize when prompted
   - All sheets will be created automatically

5. **Deploy as Web App**
   - Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone (or your organization)
   - Copy the Web App URL

6. **Configure React Apps**
   - Add Web App URL to each app's `.env.local`:
   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
   ```

## 📊 Sheet Structure

The script manages these sheets:

| Sheet | Columns | Purpose |
|-------|---------|---------|
| **Production Data** | 18 | Production entries from Production app |
| **WIP Inventory** | 13 | Work-in-progress batches (auto-generated) |
| **Batch Tracking** | 13 | Complete audit trail of all batch movements |
| **Packing Transfers** | 14 | Packing operations and WIP consumption |
| **Finished Goods Inventory** | 9 | Final product stock levels |

## 🔄 Workflow

```
Production App Entry
      ↓
Creates Production Data row (18 columns)
      ↓
Auto-generates WIP Batch (createWIPFromProduction)
      ↓
WIP Inventory (ACTIVE, ready for packing)
      ↓
Packing App consumes WIP (consumeWIPForPacking)
      ↓
Updates:
  • WIP Inventory (consumption tracking)
  • Packing Transfers (transfer records)
  • Finished Goods Inventory (stock increase)
  • Batch Tracking (audit trail)
```

## 🔌 API Endpoints

### POST /exec

The Web App URL accepts POST requests with JSON payloads:

#### Create WIP Batch
```javascript
{
  "action": "createWIP",
  "productionRow": 5
}
```

#### Consume WIP
```javascript
{
  "action": "consumeWIP",
  "packingData": {
    "productType": "Sunflower Seeds",
    "region": "Eastern Province",
    "sku": "SUN-4402",
    "unitsPacked": 50,
    "wipConsumed": 0.010,
    "operator": "John",
    "shift": "Morning",
    "date": "2024-10-23"
  }
}
```

#### Get WIP Status
```javascript
{
  "action": "getWIPStatus"
}
```

#### Search Batches
```javascript
{
  "action": "searchBatches",
  "searchTerm": "T6"
}
```

### GET /exec

Query parameters:
- `action=getWIPStatus` - Get current WIP inventory
- `action=getBatchDetails&batchId=WIP-SUN-241023-001` - Get specific batch

## 🎯 Key Features

### 1. Seed Variety Support
All products now include seed variety tracking:
- **Sunflower**: T6, 361, 363, 601, S9
- **Melon**: Shabah, Roomy
- **Pumpkin**: Shine Skin, Lady Nail
- **Peanuts**: (varieties can be added)

### 2. FIFO Batch Consumption
- Oldest WIP batches are consumed first
- Automatic batch status updates
- Prevents inventory discrepancies

### 3. Automatic Batch ID Generation
- Format: `WIP-{PREFIX}-{YYMMDD}-{SEQ}`
- Examples:
  - `WIP-SUN-241023-001` (Sunflower)
  - `WIP-MEL-241023-001` (Melon)
  - `WIP-PUM-241023-001` (Pumpkin)

### 4. Complete Audit Trail
Every batch action is logged in Batch Tracking:
- CREATED - New WIP batch
- CONSUMED - Packing consumption
- Status changes

### 5. Real-time Inventory
- WIP Inventory: Current work-in-progress
- Finished Goods: Retail product stock
- Color-coded status (ACTIVE, CONSUMED, LOW, CRITICAL)

## 🔧 Troubleshooting

### Common Issues

**1. "No WIP available"**
- Check WIP Inventory sheet has ACTIVE batches
- Verify region names match exactly
- Ensure Remaining (T) > 0

**2. "Script not authorized"**
- Re-run authorization: Run → `initializeSheets`
- Review Permissions → Allow

**3. "Data misalignment"**
- Ensure all sheets have correct column count
- Run `initializeSheets()` to fix headers
- Delete corrupted data rows

**4. "Region mismatch"**
- Production app writes: "Eastern Province" (no "Region" suffix)
- Packing app searches for: "Eastern Province"
- They must match exactly (case-sensitive, no extra spaces)

See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting.

## 📝 Development

### Local Testing

Test functions directly in Apps Script:

```javascript
// Test WIP creation
function testWIPCreation() {
  const result = createWIPFromProduction(5);
  Logger.log(result);
}

// Test WIP consumption
function testWIPConsumption() {
  const result = consumeWIPForPacking({
    productType: 'Sunflower Seeds',
    region: 'Eastern Province',
    sku: 'SUN-4402',
    unitsPacked: 50,
    wipConsumed: 0.010,
    date: new Date()
  });
  Logger.log(result);
}

// Test WIP status
function testWIPStatus() {
  const status = getWIPInventoryStatus();
  Logger.log(status);
}
```

### Viewing Logs

1. Apps Script editor
2. Click **Executions** (clock icon)
3. View recent runs and errors

### Updating

1. Make changes in `BatchTracking.js`
2. Copy to Apps Script editor
3. Save
4. Deploy → Manage deployments → Edit → New version → Deploy

## 🔗 Integration with React Apps

The React apps call these functions via the Web App URL:

### Production App
```javascript
// After submitting production form
fetch(APPS_SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'createWIP',
    productionRow: newRowNumber
  })
});
```

### Packing App
```javascript
// When consuming WIP
fetch(APPS_SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'consumeWIP',
    packingData: {
      productType, region, sku, unitsPacked, wipConsumed, ...
    }
  })
});
```

### Inventory App
```javascript
// Fetch WIP status
fetch(APPS_SCRIPT_URL + '?action=getWIPStatus')
  .then(r => r.json())
  .then(data => {
    // Display WIP inventory
  });
```

## 📚 Documentation

- **Installation**: See `DEPLOYMENT_GUIDE.md`
- **API Reference**: See "API Endpoints" section above
- **Troubleshooting**: See `../WIP_FIX_COMPLETE.md`
- **Overall System**: See `../IMPLEMENTATION_SUMMARY.md`

## 🆘 Support

For issues:
1. Check execution logs in Apps Script
2. Verify sheet structure with `initializeSheets()`
3. Review environment variables in React apps
4. Consult `DEPLOYMENT_GUIDE.md` troubleshooting section

---

**Version**: 3.0
**Updated**: 2024-10-23
**Compatibility**: Production System v2.0 (with Seed Variety support)
