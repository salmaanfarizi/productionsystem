# How to Use the Google Sheets Diagnostic Tool

This guide shows you how to run the diagnostic script to check your spreadsheet.

## Why Use This?

✅ No API key needed - runs directly in Google
✅ Works even if API access is blocked
✅ Shows exactly what's in your spreadsheet
✅ Helps identify issues with sheet structure

## Step-by-Step Instructions

### 1. Open Your Spreadsheet

Go to: https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit

### 2. Open Apps Script Editor

**Option A: Using Menu**
- Click: `Extensions` → `Apps Script`

**Option B: Direct URL**
- Go to: https://script.google.com/home
- Click "New Project"
- This will open the script editor

### 3. Paste the Script

1. In the Apps Script editor, you'll see a file called `Code.gs`
2. Delete any existing code in that file
3. Copy ALL the code from `CheckSpreadsheet.js`
4. Paste it into the editor
5. Click the **disk icon** (💾) or press `Ctrl+S` to save
6. Name your project: "Spreadsheet Diagnostic Tool"

### 4. Run the Diagnostic

**Option 1: From Apps Script Editor**

1. At the top, there's a dropdown that says "Select function"
2. Choose one of these functions:
   - **`checkSpreadsheet`** - Full detailed check (recommended first time)
   - **`quickCheck`** - Fast overview of all sheets
   - **`checkProductionSheets`** - Check specific production-related sheets
   - **`simulateAPIAccess`** - See what the API would see
   - **`checkCommonIssues`** - Look for common problems

3. Click the **▶️ Run** button

4. **First Time Only**: You'll see "Authorization required"
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to Spreadsheet Diagnostic Tool (unsafe)"
   - Click "Allow"

5. Wait for execution to complete (you'll see "Execution completed" at the bottom)

**Option 2: From Your Spreadsheet** (After first run)

1. Refresh your spreadsheet
2. You'll see a new menu: **"📊 Diagnostic Tools"**
3. Click it and choose:
   - 🔍 Full Check
   - ⚡ Quick Check
   - 🏭 Production Sheets
   - 🌐 Simulate API Access
   - ⚠️ Check Issues

### 5. View the Results

**In Apps Script Editor:**
1. Click: `View` → `Logs` (or press `Ctrl+Enter`)
2. You'll see a detailed report

**Or use Execution Log:**
1. Click the "Execution log" at the bottom of the editor
2. Scroll through the output

## What Each Function Does

### 📋 checkSpreadsheet() - FULL CHECK
**Use when**: First time checking or need complete details

**Shows**:
- Spreadsheet name, ID, URL, owner
- All sheet names
- Row and column counts
- Headers for each sheet
- First 3 rows of sample data
- Data quality checks

**Example Output**:
```
========================================
GOOGLE SPREADSHEET DIAGNOSTIC REPORT
========================================

Spreadsheet Name: Production System
Spreadsheet ID: 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
Total Sheets: 8

==========================================
SHEET #1: Batch Master
==========================================
Sheet Name: Batch Master
Last Row: 25
Last Column: 12
--- HEADERS (Row 1) ---
Columns: Batch ID, Date Started, Product Name, ...
--- SAMPLE DATA (First 3 rows) ---
Row 2:
  Batch ID: B001
  Date Started: 2025-01-15
  ...
```

### ⚡ quickCheck() - QUICK OVERVIEW
**Use when**: Need a fast summary

**Shows**:
- List of all sheets
- Row and column counts
- Empty sheet warnings

**Example Output**:
```
=== QUICK SPREADSHEET CHECK ===
1. Batch Master
   Rows: 25, Columns: 12 - ✓ 24 data rows
2. Daily - Jul 2025
   Rows: 0, Columns: 0 - ⚠️ EMPTY
```

### 🏭 checkProductionSheets() - PRODUCTION SHEETS
**Use when**: Checking specific sheets your apps use

**Checks these sheets**:
- Batch Master
- Daily - Jul 2025
- Daily - Aug 2025
- Packing Consumption
- Raw Material Inventory
- Finished Goods Inventory

**Shows**:
- Which sheets exist
- Which are missing
- Headers for each sheet

### 🌐 simulateAPIAccess() - API SIMULATION
**Use when**: Want to see what the API would see

**Shows**:
- Sharing status (public/private)
- API endpoints for each sheet
- Sample API URLs you can test

**Example Output**:
```
=== SIMULATING API ACCESS ===
Spreadsheet ID: 1UYeOfBCs...
Sharing Status: ✓ Public

Sheet: Batch Master
  API Range: Batch Master!A1:L25
  Sample API URL:
  https://sheets.googleapis.com/v4/spreadsheets/1UYeOfBCs.../values/Batch%20Master?key=YOUR_API_KEY
```

### ⚠️ checkCommonIssues() - ISSUE CHECKER
**Use when**: Troubleshooting problems

**Checks for**:
- Empty sheets
- Sheets with only headers (no data)
- Duplicate sheet names
- Incorrect sharing permissions

**Example Output**:
```
=== CHECKING FOR COMMON ISSUES ===
1. Checking for empty sheets...
   ⚠️ EMPTY: Raw Material Inventory

2. Checking for sheets with only headers...
   ✓ All sheets have data rows

=== ISSUES SUMMARY ===
⚠️ Found 1 potential issue(s)
```

## Troubleshooting

### "Authorization required" won't go away
**Solution**:
1. Go to: https://script.google.com/home/my
2. Find your project
3. Click the three dots → "Remove project"
4. Start over from Step 1

### "TypeError: Cannot read property..."
**Solution**: The spreadsheet might be in a different format than expected. Use `quickCheck()` first to see the structure.

### No output in logs
**Solution**:
1. Make sure you clicked "Run"
2. Wait at least 5-10 seconds
3. Refresh the logs: View → Logs
4. Check Execution log at bottom of screen

### Script runs but shows errors
**Solution**: The spreadsheet might have structural issues. Look at the error message - it will tell you which sheet has the problem.

## What to Share

After running the diagnostic, share:

1. **The full log output** from `checkSpreadsheet()`
2. **Issues found** from `checkCommonIssues()`
3. **Any error messages** you see

This will help identify exactly what's wrong with the spreadsheet or API access.

## Next Steps After Diagnosis

Once you have the results:

1. **If sheets are empty**: Add data or check if you're looking at the right spreadsheet
2. **If sharing is restricted**: Fix sharing permissions
3. **If structure looks good**: The problem is likely with the API key (see GOOGLE_SHEET_DIAGNOSIS.md)

## Quick Command Reference

```javascript
// In Apps Script editor, run these functions:

checkSpreadsheet()      // Full detailed report
quickCheck()            // Fast overview
checkProductionSheets() // Check specific sheets
simulateAPIAccess()     // Show API endpoints
checkCommonIssues()     // Find problems
```

## Support

- Google Apps Script Docs: https://developers.google.com/apps-script
- Spreadsheet Service: https://developers.google.com/apps-script/reference/spreadsheet

---

**Last Updated**: 2025-11-03
