# Settings Sheet & Cleanup Tools - Setup Guide

This guide shows you how to set up the Settings sheet and use the cleanup tools.

---

## Part 1: Create Settings Sheet

### Step 1: Add the Settings Sheet

1. **Open your Google Spreadsheet**: https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID

2. **Create new sheet**:
   - Click the **+** button at the bottom
   - Name it: **`Settings`**

3. **Add header row**:
   ```
   App | Category | Key | Value | Unit | Display Label | Active | Notes
   ```

### Step 2: Add Initial Settings Data

Copy from `SETTINGS_SHEET_GUIDE.md` and paste into your Settings sheet. Start with these essential settings:

**Production App (6 rows):**
```
Production	Bag Types	BAG_25KG	25	KG	25 kg	TRUE	Standard bag
Production	Bag Types	BAG_20KG	20	KG	20 kg	TRUE	Alternative bag
Production	Trucks	DIESEL_SMALL	6000	L	Small (6,000 L)	TRUE	Standard small
Production	Trucks	DIESEL_MEDIUM	7000	L	Medium (7,000 L)	TRUE	Standard medium
Production	Trucks	DIESEL_LARGE	15000	L	Large (15,000 L)	TRUE	Large capacity
Production	Trucks	WASTE_SMALL	10000	L	Small (10,000 L)	TRUE	Small wastewater
```

**Packing App (4 rows):**
```
Packing	Regions	REGION_EASTERN	Eastern Province	Eastern Province	TRUE	Main region
Packing	Regions	REGION_RIYADH	Riyadh	Riyadh	TRUE	Central region
Packing	Batch	PREFIX_EASTERN	ER	Eastern Region Code	TRUE	ER prefix
Packing	Thresholds	LOW_STOCK_LEVEL	20	%	Low Stock Alert	TRUE	Alert at 20%
```

**Inventory App (3 rows):**
```
Inventory	Warehouses	WH_DAMMAM	Dammam Store	Dammam Store	TRUE	Regional warehouse
Inventory	Warehouses	WH_RIYADH	Riyadh Store	Riyadh Store	TRUE	Regional warehouse
Inventory	Status	STATUS_OK_MIN	110	%	OK Threshold	TRUE	>= 110% of min
```

**Raw Material App (5 rows):**
```
Raw Material	Alerts	EXPIRY_WARNING_DAYS	30	Days	Expiry Warning	TRUE	Warn 30 days before
Raw Material	Alerts	LOW_STOCK_THRESHOLD	20	%	Low Stock Alert	TRUE	Alert at 20%
Raw Material	Sunflower	GRADE_T6	T6	T6 Grade	TRUE	Standard grade
Raw Material	Sunflower	GRADE_361	361	361 Grade	TRUE	Premium grade
Raw Material	Sunflower	SIZE_240_250	240-250	240-250 per 50g	TRUE	Medium size
```

### Step 3: Format the Settings Sheet

1. **Freeze header row**:
   - View → Freeze → 1 row

2. **Add data validation to Active column (G)**:
   - Select column G (click column letter)
   - Data → Data validation
   - Criteria: List of items: `TRUE,FALSE`
   - On invalid data: Reject input
   - Click Save

3. **Add data validation to App column (A)**:
   - Select column A (from A2 downwards)
   - Data → Data validation
   - Criteria: List of items: `Production,Packing,Inventory,Raw Material,All`
   - Click Save

4. **Color code by app** (optional but recommended):
   - Production rows: Light blue (#E3F2FD)
   - Packing rows: Light green (#E8F5E9)
   - Inventory rows: Light purple (#F3E5F5)
   - Raw Material rows: Light orange (#FFF3E0)
   - All rows: Light gray (#F5F5F5)

5. **Auto-resize all columns**:
   - Select all (Ctrl+A or Cmd+A)
   - Right-click column header → Resize columns A-H → Fit to data

---

## Part 2: Add Cleanup Script to Google Sheets

### Step 1: Open Apps Script Editor

1. In your Google Spreadsheet, go to: **Extensions → Apps Script**
2. This opens the script editor in a new tab

### Step 2: Add the Cleanup Script

1. **Delete the default code** in Code.gs (if any)

2. **Create new file**:
   - Click **+** next to Files
   - Select **Script**
   - Name it: `CleanupSheets`

3. **Copy the code** from `google-apps-script/CleanupSheets.js` and paste it

4. **Save**:
   - Click the disk icon or Ctrl+S (Cmd+S on Mac)
   - Name your project: "Spreadsheet Cleanup Tools"

### Step 3: Authorize the Script

1. **Run the setup**:
   - Select function: `onOpen`
   - Click **Run** (play button)

2. **Grant permissions**:
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to Spreadsheet Cleanup Tools (unsafe)"
   - Click "Allow"

3. **Close the script editor** and go back to your spreadsheet

4. **Refresh the spreadsheet** (F5 or Cmd+R)

5. You should now see a new menu: **🧹 Sheet Cleanup**

---

## Part 3: Using the Cleanup Tools

### Method 1: Using the Custom Menu (Easiest)

After setup, you'll see **🧹 Sheet Cleanup** in the menu bar.

**Available options:**
- **📋 List All Sheets** - See all sheets and their status
- **🔍 Identify Unwanted Sheets** - Find sheets not in required list
- **💾 Create Backup List** - Save list of all sheets before cleanup
- **🗑️ Delete Unwanted Sheets** - Delete all non-required sheets
- **🗑️ Delete Empty Sheets** - Delete sheets with no data
- **🗑️ Delete "Copy of" Sheets** - Delete all duplicate sheets
- **👁️ Hide Unwanted Sheets** - Hide instead of delete (safer)

### Method 2: Using Script Functions

1. **Open Apps Script editor**: Extensions → Apps Script

2. **View logs**: Click "Execution log" at bottom

3. **Run functions**:

**To see what sheets exist:**
```javascript
// Select function: listAllSheets
// Click Run
// Check logs to see all sheets
```

**To safely check before deleting:**
```javascript
// Select function: identifyUnwantedSheets
// Click Run
// Review the list in logs
```

**To delete unwanted sheets:**
```javascript
// Select function: deleteUnwantedSheets
// Click Run
// ⚠️ This will permanently delete sheets!
```

---

## Safe Cleanup Workflow (Recommended)

Follow these steps for safe cleanup:

### Step 1: Create Backup
```
🧹 Sheet Cleanup → 💾 Create Backup List
```
This creates a sheet called `_Backup_Sheet_List` with all current sheets.

### Step 2: List All Sheets
```
🧹 Sheet Cleanup → 📋 List All Sheets
```
Opens script editor and shows logs with all sheets.

### Step 3: Identify Unwanted
```
🧹 Sheet Cleanup → 🔍 Identify Unwanted Sheets
```
Shows which sheets will be deleted.

### Step 4: Review the List
Check the logs carefully. Make sure no important sheets are listed.

### Step 5: Delete (Choose One)

**Option A - Delete all unwanted:**
```
🧹 Sheet Cleanup → 🗑️ Delete Unwanted Sheets
```

**Option B - Delete only empty:**
```
🧹 Sheet Cleanup → 🗑️ Delete Empty Sheets
```

**Option C - Hide instead of delete (safest):**
```
🧹 Sheet Cleanup → 👁️ Hide Unwanted Sheets
```

---

## Customizing Required Sheets

To change which sheets are protected from deletion:

1. **Open Apps Script**: Extensions → Apps Script

2. **Find the REQUIRED_SHEETS array** (around line 20):
   ```javascript
   const REQUIRED_SHEETS = [
     'Production Data',
     'Batch Master',
     // ... etc
   ];
   ```

3. **Add or remove sheet names** from this list

4. **Save** (Ctrl+S)

5. Any sheet in this list will be protected from deletion

---

## Examples

### Example 1: Clean Up After Initial Setup

You just created your system and have sheets named "Sheet1", "Sheet2", "Sheet3":

1. Run: `🧹 Sheet Cleanup → 💾 Create Backup List`
2. Run: `🧹 Sheet Cleanup → 🗑️ Delete Unwanted Sheets`
3. Done! Only your required sheets remain.

### Example 2: Remove All "Copy of" Sheets

Someone made backup copies and you have many "Copy of X" sheets:

1. Run: `🧹 Sheet Cleanup → 🗑️ Delete "Copy of" Sheets`
2. All sheets with "Copy of" in the name are deleted.

### Example 3: Delete Specific Sheets

You want to delete specific sheets:

1. Open: Extensions → Apps Script
2. Modify function `deleteMyUnwantedSheets`:
   ```javascript
   function deleteMyUnwantedSheets() {
     const sheetsToDelete = [
       'Old Backup',
       'Test Data',
       'Temporary Sheet'
     ];
     deleteSpecificSheets(sheetsToDelete);
   }
   ```
3. Select function: `deleteMyUnwantedSheets`
4. Click Run

---

## Troubleshooting

### "Cannot delete the only sheet"
**Solution**: Your spreadsheet must have at least one sheet. Create a dummy sheet first, then delete the unwanted one.

### "Sheet is protected"
**Solution**: The sheet is in the REQUIRED_SHEETS list. Either remove it from that list or manually delete it.

### Menu doesn't appear
**Solution**:
1. Refresh the spreadsheet (F5)
2. If still not visible, run `onOpen` function in script editor
3. Make sure script is authorized

### Accidentally deleted important sheet
**Solution**:
1. Go to File → Version history → See version history
2. Restore a previous version before deletion
3. Or check `_Backup_Sheet_List` for the sheet structure

---

## Benefits

✅ **Clean workspace** - Only keep sheets you need
✅ **Better organization** - No clutter from test sheets
✅ **Safe deletion** - Protected sheets can't be deleted
✅ **Audit trail** - Backup list shows what was deleted
✅ **Easy to use** - Custom menu, no coding needed
✅ **Flexible** - Can customize which sheets to protect

---

## Next Steps

1. ✅ Create Settings sheet
2. ✅ Add cleanup script
3. ✅ Run safe cleanup workflow
4. ✅ Update apps to read from Settings sheet (future enhancement)
5. ✅ Document any custom settings you add

---

## Questions?

- Settings structure: See `SETTINGS_SHEET_GUIDE.md`
- Cleanup script code: See `google-apps-script/CleanupSheets.js`
- Need help? Ask for assistance!
