# Google Apps Script Deployment Guide

This guide explains how to deploy the updated Batch Tracking system to your Google Sheets.

## 📋 Prerequisites

1. Access to your Google Sheets spreadsheet
2. The following sheets must exist (or will be created automatically):
   - Production Data
   - WIP Inventory
   - Batch Tracking
   - Packing Transfers
   - Finished Goods Inventory

## 🚀 Installation Steps

### Step 1: Open Google Apps Script Editor

1. Open your Google Sheets: `https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit`
2. Click **Extensions** → **Apps Script**
3. Delete any existing code in the editor

### Step 2: Add the Code

1. Copy the entire contents of `BatchTracking.js`
2. Paste into the Apps Script editor
3. Click the **Save** icon (💾) or press `Ctrl+S` (Windows) / `Cmd+S` (Mac)
4. Name the project: **Production System - Batch Tracking**

### Step 3: Initialize the System

1. Click **Run** → **Select function** → `initializeSheets`
2. **Authorization required**: Click **Review Permissions**
3. Select your Google account
4. Click **Advanced** → **Go to Production System (unsafe)**
5. Click **Allow**

The script will create/update all required sheets with proper headers.

### Step 4: Set Up Custom Menu

1. Close and reopen your Google Sheets
2. You should see a new menu: **Production System**
3. Click it to verify these options appear:
   - Initialize Sheets
   - WIP Inventory Status
   - Search Batches
   - Help

## 🔗 Integrating with Web Apps

### Step 5: Deploy as Web App (for API access)

1. In Apps Script editor, click **Deploy** → **New deployment**
2. Click **Select type** → **Web app**
3. Fill in the following:
   - **Description**: Production System API
   - **Execute as**: Me
   - **Who has access**: Anyone (or "Anyone within [your organization]")
4. Click **Deploy**
5. Copy the **Web app URL** (you'll need this for the React apps)
6. Click **Done**

### Step 6: Configure React Apps

Update each React app's `.env.local` file with the Web App URL:

```env
# In apps/production/.env.local
VITE_GOOGLE_SHEETS_API_KEY=your_api_key
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# In apps/packing/.env.local
VITE_GOOGLE_SHEETS_API_KEY=your_api_key
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# In apps/inventory/.env.local
VITE_GOOGLE_SHEETS_API_KEY=your_api_key
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## 📊 Sheet Structure

After initialization, your sheets will have these structures:

### Production Data (18 columns)
| Column | Header | Description |
|--------|--------|-------------|
| A | Date | Production date |
| B | Product Type | Sunflower Seeds, Melon Seeds, etc. |
| C | Seed Variety | T6, 361, Shabah, Shine Skin, etc. |
| D | Size Range | 220-230, etc. (seed count per 50g) |
| E | Variant/Region | Eastern Province, Riyadh, etc. |
| F | Bag Type | 25KG, 50KG |
| G | Number of Bags | Quantity of bags processed |
| H | Total Raw Material (T) | Total weight in tonnes |
| I | Salt Added (kg) | Salt added in kg |
| J | Normal Loss (T) | 2% normal loss |
| K | WIP Weight (T) | Work-in-progress weight |
| L | Employee | Employee name |
| M | Truck/Transport | Truck or transport ID |
| N | Shift | Morning, Afternoon, Night |
| O | Line | Production line |
| P | Notes | Additional notes |
| Q | Batch ID | Auto-generated WIP batch ID |
| R | Created At | Timestamp |

### WIP Inventory (13 columns)
| Column | Header | Description |
|--------|--------|-------------|
| A | WIP Batch ID | Format: WIP-{PREFIX}-{YYMMDD}-{SEQ} |
| B | Production Date | Original production date |
| C | Product Type | Product type |
| D | Seed Variety | Crop type/variety |
| E | Size Range | Seed size range |
| F | Variant/Region | Destination region |
| G | Initial WIP (T) | Starting weight |
| H | Consumed (T) | Weight consumed so far |
| I | Remaining (T) | Weight remaining |
| J | Status | ACTIVE, CONSUMED, ON_HOLD |
| K | Created At | Creation timestamp |
| L | Completed At | Completion timestamp |
| M | Notes | Additional notes |

### Batch Tracking (13 columns)
| Column | Header | Description |
|--------|--------|-------------|
| A | Timestamp | Action timestamp |
| B | WIP Batch ID | Batch identifier |
| C | Product Type | Product type |
| D | Seed Variety | Seed variety |
| E | Size Range | Size range |
| F | Variant/Region | Region |
| G | Action | CREATED, CONSUMED, etc. |
| H | Weight Change (T) | Weight added/removed |
| I | Running Balance (T) | Current balance |
| J | Department | Production, Packing, etc. |
| K | User | User email |
| L | Reference | Reference ID |
| M | Notes | Additional notes |

### Packing Transfers (14 columns)
| Column | Header | Description |
|--------|--------|-------------|
| A | Transfer ID | Format: T-{YYMMDD}-{SEQ} |
| B | Date | Transfer date |
| C | Product Type | Product type |
| D | Region | Destination region |
| E | SKU | Retail SKU code |
| F | SKU Description | Product description |
| G | Units Packed | Number of units |
| H | WIP Consumed (T) | WIP weight used |
| I | WIP Batch ID | Source batch |
| J | Operator | Operator name |
| K | Shift | Shift |
| L | Line | Packing line |
| M | Notes | Additional notes |
| N | Created At | Timestamp |

### Finished Goods Inventory (9 columns)
| Column | Header | Description |
|--------|--------|-------------|
| A | SKU | Retail SKU code |
| B | Product Type | Product type |
| C | Region | Region |
| D | Package Size | Package size |
| E | Current Stock | Current quantity |
| F | Minimum Stock | Minimum threshold |
| G | Status | OK, LOW, CRITICAL, OUT |
| H | Last Updated | Last update timestamp |
| I | Notes | Additional notes |

## 🔄 How It Works

### Workflow Overview

```
┌─────────────────┐
│ Production App  │
│  (Entry Form)   │
└────────┬────────┘
         │
         ├─► Creates Production Data row (18 columns)
         │
         ├─► Calls: createWIPFromProduction(rowNumber)
         │
         ▼
┌─────────────────┐
│  WIP Inventory  │
│ (Auto-created)  │
└────────┬────────┘
         │
         │   Batch ID: WIP-SUN-241023-001
         │   Status: ACTIVE
         │   Remaining: 2.450 T
         │
         ▼
┌─────────────────┐
│   Packing App   │
│  (Consumes WIP) │
└────────┬────────┘
         │
         ├─► Calls: consumeWIPForPacking(packingData)
         │
         ├─► Updates WIP Inventory (FIFO consumption)
         │
         ├─► Creates Packing Transfer record
         │
         ├─► Updates Finished Goods Inventory
         │
         ▼
┌─────────────────┐
│ Finished Goods  │
│   Inventory     │
└─────────────────┘
```

### API Functions

The script provides these API functions:

#### 1. Create WIP from Production
```javascript
// Called automatically when production entry is submitted
createWIPFromProduction(productionRow)

// Example:
// Row 5 in Production Data → Creates WIP-SUN-241023-001
```

#### 2. Consume WIP for Packing
```javascript
// Called when packing entry is submitted
consumeWIPForPacking({
  productType: 'Sunflower Seeds',
  region: 'Eastern Province',
  sku: 'SUN-4402',
  skuDescription: '200 g bag',
  unitsPacked: 50,
  wipConsumed: 0.010,
  packageSize: '200 g',
  operator: 'John',
  shift: 'Morning',
  line: 'Line 1',
  notes: '',
  date: '2024-10-23'
})
```

#### 3. Get WIP Status
```javascript
// Get current WIP inventory status
getWIPInventoryStatus()

// Returns:
{
  success: true,
  batches: [...],
  summary: {
    totalActive: 5,
    totalWeight: 12.450,
    totalRemaining: 8.230
  }
}
```

#### 4. Search Batches
```javascript
// Search by batch ID, product type, seed variety, etc.
searchBatches('T6')

// Returns array of matching batches
```

## 🧪 Testing

### Test 1: Create WIP Batch

1. Go to **Production Data** sheet
2. Manually add a row (or use Production app):
   ```
   Date: 2024-10-23
   Product Type: Sunflower Seeds
   Seed Variety: T6
   Size Range: 220-230
   Variant/Region: Eastern Province
   Bag Type: 25KG
   Number of Bags: 100
   Total Raw Material: 2.500
   Salt Added: 0
   Normal Loss: 0.050
   WIP Weight: 2.450
   Employee: Test User
   Shift: Morning
   ```

3. In Apps Script, run: `createWIPFromProduction(2)` (replace 2 with your row number)

4. Check **WIP Inventory** sheet:
   - Should see new row: `WIP-SUN-241023-001`
   - Status: `ACTIVE`
   - Remaining: `2.450`

5. Check **Batch Tracking** sheet:
   - Should see action: `CREATED`

### Test 2: Consume WIP

1. In Apps Script, run:
   ```javascript
   function testConsumption() {
     consumeWIPForPacking({
       productType: 'Sunflower Seeds',
       region: 'Eastern Province',
       sku: 'SUN-4402',
       skuDescription: '200 g bag',
       unitsPacked: 50,
       wipConsumed: 0.010,
       packageSize: '200 g',
       operator: 'Test',
       shift: 'Morning',
       line: 'Line 1',
       date: new Date()
     });
   }
   ```

2. Check **WIP Inventory**:
   - Consumed should increase: `0.010`
   - Remaining should decrease: `2.440`

3. Check **Packing Transfers**:
   - Should see new transfer: `T-241023-001`

4. Check **Finished Goods Inventory**:
   - SKU `SUN-4402` stock should be `50`

## 🔧 Troubleshooting

### Issue: "Script not authorized"
**Solution**: Re-run authorization in Step 3

### Issue: "Sheet not found"
**Solution**: Run `initializeSheets()` to create all sheets

### Issue: "No WIP available"
**Solution**:
1. Check WIP Inventory sheet has ACTIVE batches with Remaining > 0
2. Verify region names match exactly (no extra spaces)
3. Check Seed Variety column exists in all sheets

### Issue: "Data misalignment"
**Solution**:
1. Verify all sheets have correct number of columns
2. Delete any rows with corrupted data
3. Re-run `initializeSheets()` to fix headers

## 📝 Maintenance

### Updating the Script

1. Make changes in Apps Script editor
2. Save changes
3. Re-deploy:
   - **Deploy** → **Manage deployments**
   - Click **Edit** (pencil icon)
   - **Version**: New version
   - Click **Deploy**

### Monitoring

Use the built-in menu options:
- **Production System** → **WIP Inventory Status**: Quick overview
- **Production System** → **Search Batches**: Find specific batches

### Logs

View execution logs:
1. In Apps Script editor, click **Executions** (clock icon)
2. View recent runs and any errors

## 🎯 Best Practices

1. **Always use the Production app** to create production entries (auto-generates WIP)
2. **Always use the Packing app** to consume WIP (ensures FIFO and proper tracking)
3. **Check WIP Inventory regularly** to monitor stock levels
4. **Review Batch Tracking** for audit trail
5. **Never manually edit** WIP Inventory (let the apps handle it)

## 🆘 Support

If you encounter issues:
1. Check the **Executions** log in Apps Script for errors
2. Verify all sheets have correct headers (use `initializeSheets()`)
3. Confirm environment variables are set correctly in React apps
4. Review `WIP_FIX_COMPLETE.md` for common issues

---

**Version**: 3.0
**Last Updated**: 2024-10-23
**Compatible with**: Production System v2.0 (with Seed Variety support)
