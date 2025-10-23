# ✅ Inventory App 400 Error - FIXED

## 🐛 What Was Wrong

You were getting these errors in the Inventory app:

```
GET https://sheets.googleapis.com/v4/spreadsheets/.../Batch%20Master!A1:Z1000?key=undefined 400 (Bad Request)
Error reading sheet data: Error: HTTP error! status: 400
```

### Two Problems:

1. **❌ Reading from OLD sheet names**
   - App was looking for "Batch Master" (old system)
   - Should be "WIP Inventory" (new system)

2. **❌ API key was `undefined`**
   - Environment variable not set in Netlify

---

## ✅ What I Fixed

### 1. Updated All Components to Use New Sheet Names

**Changed in 3 components**:
- `StockDashboard.jsx`
- `BatchMonitor.jsx`
- `ProductBreakdown.jsx`

**Before** (OLD):
```javascript
const rawData = await readSheetData('Batch Master');
// Columns: 'Seed Type', 'Size', 'Remaining Weight (T)'
```

**After** (NEW):
```javascript
const rawData = await readSheetData('WIP Inventory');
// Columns: 'Product Type', 'Seed Variety', 'Size Range', 'Remaining (T)'
```

### 2. Updated Column Names

| Old Column Name | New Column Name |
|----------------|-----------------|
| `Batch ID` | `WIP Batch ID` |
| `Seed Type` | `Product Type` |
| (none) | `Seed Variety` ← NEW! |
| `Size` | `Size Range` |
| `Production Variant` | `Variant/Region` |
| `Initial Weight (T)` | `Initial WIP (T)` |
| `Remaining Weight (T)` | `Remaining (T)` |

### 3. Added Seed Variety Display

Now shows:
```
Sunflower Seeds
T6 - 220-230
3 active batches
```

Instead of:
```
Sunflower Seeds - 220-230
3 active batches
```

---

## 🔧 What YOU Need to Do

### Step 1: Add API Key to Netlify (CRITICAL!)

The error `key=undefined` means the API key is not configured in Netlify.

**Fix this now**:

1. **Go to**: https://console.cloud.google.com/apis/credentials

2. **Copy your API Key**

3. **Go to Netlify**: https://app.netlify.com/sites/inventoryars/configuration/env

4. **Add environment variable**:
   ```
   Key: VITE_GOOGLE_SHEETS_API_KEY
   Value: AIzaSyC... (your actual API key)
   ```

5. **Click "Save"**

6. **Do the same for**:
   - productionars
   - packingars

---

### Step 2: Add Other Required Environment Variables

All 3 apps need these 4 variables:

```
VITE_GOOGLE_SHEETS_API_KEY=AIzaSyC... (your API key)
VITE_GOOGLE_CLIENT_ID=123...xyz.apps.googleusercontent.com
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbweu8JzkGhLZ0DqYA45HOXh5zTgeUAl4V1BFMI1ed0m4wsYma7OAgmwFsrjQgWFCsll/exec
```

**For each app** (productionars, packingars, inventoryars):

1. Go to: https://app.netlify.com/sites/{APP_NAME}/configuration/env

2. Add all 4 variables

3. Click "Save"

---

### Step 3: Deploy to Netlify

After adding environment variables:

**For each app**:

1. **Go to Deploys**: https://app.netlify.com/sites/inventoryars/deploys

2. **Click**: "Trigger deploy" → "Clear cache and deploy site"

3. **Wait**: 2-3 minutes

4. **Repeat for**:
   - productionars
   - packingars

---

## 🧪 Test After Deployment

### Test Inventory App:

1. **Open**: https://inventoryars.netlify.app

2. **Should see**:
   - ✅ No errors in console (F12)
   - ✅ "Finished Goods" tab shows data
   - ✅ "WIP Inventory" tab shows:
     - Stock overview cards
     - Batch queue
     - Product breakdown

3. **If still errors**:
   - Check browser console (F12)
   - Verify environment variables are set
   - Check if WIP Inventory sheet exists in Google Sheets

---

## 📋 Required Google Sheets

Make sure these sheets exist in your Google Sheets:

**New System Sheets** (REQUIRED):
- ✅ Production Data
- ✅ WIP Inventory
- ✅ Batch Tracking
- ✅ Packing Transfers
- ✅ Finished Goods Inventory

**Old System Sheets** (NOT USED - can delete):
- ❌ Batch Master
- ❌ Packing Consumption
- ❌ Batch History

### How to Create New Sheets:

If sheets don't exist:

1. **Open Google Sheets** → **Extensions** → **Apps Script**

2. **Run function**: `initializeSheets`

3. **Authorize** when prompted

4. **Check** Google Sheets - new sheets should appear!

---

## 🔍 Troubleshooting

### Still Getting 400 Error?

**Check**:
1. ✅ API key added to Netlify environment variables?
2. ✅ Deployment triggered after adding variables?
3. ✅ Sheet "WIP Inventory" exists in Google Sheets?
4. ✅ Sheet has correct headers (WIP Batch ID, Product Type, etc.)?

**To verify environment variables**:
1. Go to Netlify app → Configuration → Environment variables
2. Should see all 4 variables listed
3. If missing, add them and redeploy

---

### Still Getting `key=undefined`?

**This means**:
- Environment variable not set, OR
- Deployment didn't pick up new variables

**Fix**:
1. Double-check variable name: `VITE_GOOGLE_SHEETS_API_KEY` (exact match!)
2. Trigger **"Clear cache and deploy site"** (not just "Deploy site")
3. Wait for deployment to complete
4. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

### Inventory Shows "No Data"?

**This is normal if**:
- No WIP batches created yet
- No production entries yet
- All batches consumed

**To test with sample data**:
1. Create a production entry via Production app
2. Should create WIP batch automatically
3. Refresh Inventory app
4. Should see data in "WIP Inventory" tab

---

## ✅ Summary

**Fixed**:
- ✅ Changed all components to read from "WIP Inventory" instead of "Batch Master"
- ✅ Updated all column names to match new sheet structure
- ✅ Added seed variety display

**You need to do**:
- ⚠️ Add API key to Netlify (CRITICAL!)
- ⚠️ Add other environment variables (OAuth Client ID, etc.)
- ⚠️ Trigger deploy for all 3 apps
- ⚠️ Verify WIP Inventory sheet exists in Google Sheets

**After completing these steps**:
- ✅ No more 400 errors
- ✅ Inventory app shows data
- ✅ All 3 apps working correctly

---

## 📸 What You Should See

### Before (ERROR):
```
Console:
❌ GET .../Batch%20Master!A1:Z1000?key=undefined 400
❌ Error reading sheet data
```

### After (WORKING):
```
Console:
✅ (no errors)

Inventory App:
✅ WIP Inventory tab shows:
   - Total Stock: 12.5 T
   - Active Batches: 5
   - Batch Queue with WIP-SUN-241023-001, etc.
   - Product breakdown by seed variety
```

---

**Next Step**: Add environment variables to Netlify and deploy! 🚀
