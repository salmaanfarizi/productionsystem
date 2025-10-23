# 🔍 Troubleshooting: Apps Showing Nothing

## Current Issue
- ❌ Batch Master, Packing Consumption, Batch History = Empty
- ❌ Inventory app = Showing nothing
- ❓ Other apps status = Unknown

Let's diagnose the problem step by step.

---

## 🎯 Step 1: Check What Sheets Exist

Open your Google Sheets:
```
https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit
```

**Look at the sheet tabs at the bottom and check:**

### Old System Sheets (not needed anymore):
- [ ] Batch Master
- [ ] Packing Consumption
- [ ] Batch History

### New System Sheets (required for current apps):
- [ ] Production Data
- [ ] WIP Inventory
- [ ] Batch Tracking
- [ ] Packing Transfers
- [ ] Finished Goods Inventory

**❓ Question**: Do you see the NEW sheets (Production Data, WIP Inventory, etc.)?

---

## 🎯 Step 2: Check If Google Apps Script Is Installed

The NEW sheets should be created automatically by the Google Apps Script.

### Check if script is installed:

1. **In Google Sheets**, click: **Extensions** → **Apps Script**

2. **Do you see code** in the editor?
   - ✅ **YES**: Code is there → Go to Step 3
   - ❌ **NO**: Empty or old code → **You need to install the new script!**

### If script is NOT installed or old:

**Install the new script now**:

1. Go to: https://github.com/salmaanfarizi/productionsystem/blob/claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4/google-apps-script/BatchTracking.js

2. Copy the ENTIRE code (all 1000+ lines)

3. Go back to Google Sheets → **Extensions** → **Apps Script**

4. **Delete all old code**

5. **Paste the new code**

6. **Save** (Ctrl+S)

7. **Run**: Select function → `initializeSheets` → **Run**
   - Click "Review Permissions" → **Allow**
   - Wait 10 seconds

8. **Check Google Sheets**: New sheets should appear! ✅

---

## 🎯 Step 3: Check If Apps Are Deployed

The apps need to be deployed to Netlify with the latest code.

### Check Production App:
1. Go to: https://productionars.netlify.app
2. **Does it load?**
   - ✅ YES: Deployed
   - ❌ NO: Not deployed

3. **Open the form**:
   - Do you see "Seed Variety" field?
   - ✅ YES: Latest code deployed
   - ❌ NO: Old code deployed

### Check Packing App:
1. Go to: https://packingars.netlify.app
2. **Does it show SKU selection?**
   - ✅ YES: Latest code
   - ❌ NO: Old code

### Check Inventory App:
1. Go to: https://inventoryars.netlify.app
2. **Does it show tabs** (Finished Goods | WIP Inventory)?
   - ✅ YES: Latest code
   - ❌ NO: Old code

---

## 🎯 Step 4: Check Sheet Names Match

The apps look for specific sheet names. They must match EXACTLY (case-sensitive).

### Required Sheet Names (EXACT):
```
Production Data
WIP Inventory
Batch Tracking
Packing Transfers
Finished Goods Inventory
```

### Check your sheets:

1. Open Google Sheets
2. Look at sheet tabs at bottom
3. **Right-click each tab** → Check exact name

**Common mistakes**:
- ❌ "production data" (lowercase)
- ❌ "Production_Data" (underscore)
- ❌ "Production Data " (extra space at end)
- ✅ "Production Data" (correct)

---

## 🎯 Step 5: Check If Sheets Have Headers

Even if sheets exist, they need proper headers.

### Check WIP Inventory Headers (Row 1):

Should be exactly:
```
A: WIP Batch ID
B: Production Date
C: Product Type
D: Seed Variety
E: Size Range
F: Variant/Region
G: Initial WIP (T)
H: Consumed (T)
I: Remaining (T)
J: Status
K: Created At
L: Completed At
M: Notes
```

**❓ Do your headers match?**

### Check Finished Goods Inventory Headers (Row 1):

Should be exactly:
```
A: SKU
B: Product Type
C: Region
D: Package Size
E: Current Stock
F: Minimum Stock
G: Status
H: Last Updated
I: Notes
```

**❓ Do your headers match?**

---

## 🎯 Step 6: Test Data Entry

Let's test if data flows correctly.

### Test Production Entry:

1. **Go to**: https://productionars.netlify.app

2. **Sign in** with Google

3. **Fill the form**:
   - Date: Today
   - Product Type: Sunflower Seeds
   - Seed Variety: T6
   - Size Range: 220-230
   - Variant/Region: Eastern Province
   - Bag Type: 25KG
   - Number of Bags: 10
   - (Fill other required fields)

4. **Submit**

5. **Check Google Sheets**:
   - Open "Production Data" sheet
   - **Do you see a new row?**
   - ✅ YES: Apps are working! → Go to Step 7
   - ❌ NO: Something is wrong → See Step 8

---

## 🎯 Step 7: Check Why Inventory Shows Nothing

If Production Data has rows but Inventory app shows nothing:

### Check Browser Console:

1. **Open Inventory App**: https://inventoryars.netlify.app

2. **Press F12** (open Developer Tools)

3. **Click "Console" tab**

4. **Look for errors** (red text):
   - "Failed to fetch"
   - "404 Not Found"
   - "CORS error"
   - "Sheet not found"

**❓ What errors do you see?**

### Check Network Tab:

1. In Developer Tools, click **"Network" tab**

2. **Refresh the page** (F5)

3. **Look for requests** to Google Sheets API

4. **Click on any failed requests** (red)

5. **Check the error message**

**❓ What does it say?**

---

## 🎯 Step 8: Common Issues & Fixes

### Issue A: "Sheets not found" or Apps showing nothing

**Cause**: Google Apps Script not run, sheets don't exist

**Fix**:
1. Go to Google Sheets → Extensions → Apps Script
2. Run: `initializeSheets`
3. Authorize when prompted
4. Check if sheets appear

---

### Issue B: "No data" in Inventory app

**Cause**: Sheets exist but are empty

**Fix**:
1. You need to enter data first via Production app
2. Or manually add test data to sheets
3. Or initialize with sample data

---

### Issue C: Apps deployed but old version

**Cause**: Netlify not deployed from correct branch

**Fix**:
1. Go to: https://app.netlify.com/
2. For each app, change branch to: `claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4`
3. Trigger deploy
4. Wait 2-3 minutes

---

### Issue D: Headers don't match

**Cause**: Sheet headers don't match what apps expect

**Fix**:
1. Delete all sheets
2. Run `initializeSheets` in Apps Script
3. Let script create sheets with correct headers

---

### Issue E: API key or OAuth not configured

**Cause**: Environment variables not set in Netlify

**Fix**:
1. Go to Netlify site settings
2. Check Environment Variables
3. Should have:
   - `VITE_GOOGLE_SHEETS_API_KEY`
   - `VITE_SPREADSHEET_ID`
   - `VITE_GOOGLE_CLIENT_ID`

---

## 🎯 Step 9: Quick Diagnostic Script

Run this in Google Sheets Apps Script to check setup:

```javascript
function diagnosticCheck() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  let report = 'DIAGNOSTIC REPORT\n\n';

  // Check sheets
  const requiredSheets = [
    'Production Data',
    'WIP Inventory',
    'Batch Tracking',
    'Packing Transfers',
    'Finished Goods Inventory'
  ];

  report += 'SHEETS:\n';
  requiredSheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const rows = sheet.getLastRow();
      report += `✅ ${sheetName}: ${rows} rows\n`;
    } else {
      report += `❌ ${sheetName}: NOT FOUND\n`;
    }
  });

  report += '\n';
  report += 'Spreadsheet ID: ' + ss.getId() + '\n';
  report += 'URL: ' + ss.getUrl() + '\n';

  ui.alert('Diagnostic Check', report, ui.ButtonSet.OK);
}
```

**How to use**:
1. Paste this in Apps Script editor (below existing code)
2. Save
3. Run: `diagnosticCheck`
4. Read the report

**Report back**: What does it say?

---

## 🎯 Step 10: Share Your Results

Please tell me:

1. **Which sheets exist?** (list the sheet tab names you see)

2. **Does Google Apps Script have code?** (yes/no)

3. **Did you run `initializeSheets`?** (yes/no)

4. **Do apps load on Netlify?** (yes/no)

5. **Can you sign in to apps?** (yes/no)

6. **What errors in browser console?** (if any)

7. **Do "Production Data" sheet have rows?** (how many?)

8. **Run diagnostic script above** - what does it say?

---

## 🚨 Most Likely Issue

Based on "inventory app showing nothing", I suspect:

**Option 1**: Google Apps Script NOT installed/run
- Sheets don't exist yet
- Need to install script and run `initializeSheets`

**Option 2**: Apps NOT deployed with latest code
- Old version still running
- Need to trigger Netlify deploy from correct branch

**Option 3**: Sheets empty (no data entered yet)
- Sheets exist but no production entries
- Need to create test entry via Production app

---

## ✅ Quick Fix Attempt

Try this quick fix:

### 1. Initialize Sheets (2 minutes):
```
Google Sheets → Extensions → Apps Script
→ Paste new code from GitHub
→ Save
→ Run: initializeSheets
→ Authorize
```

### 2. Check Sheets Created (10 seconds):
```
Look at sheet tabs
Should see: Production Data, WIP Inventory, etc.
```

### 3. Add Test Data (1 minute):
```
Manually add one row to "Finished Goods Inventory":
SKU: SUN-4402
Product Type: Sunflower Seeds
Region: Eastern Province
Package Size: 200 g
Current Stock: 100
Minimum Stock: 250
Status: LOW
```

### 4. Check Inventory App (10 seconds):
```
Go to: https://inventoryars.netlify.app
Refresh page
Should see the test row
```

**Does this work?**

---

Tell me the results and I'll help you fix the specific issue! 🚀
