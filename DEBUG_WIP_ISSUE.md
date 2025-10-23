# WIP Availability Debug Guide

## 🔍 Let's Find The Problem

### Step 1: Check Your WIP Inventory Sheet Headers

Open: https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit

Go to "WIP Inventory" sheet.

**Your headers in Row 1 MUST EXACTLY match this (case-sensitive!):**

| Column | Header Name (EXACT) |
|--------|-------------------|
| A | WIP Batch ID |
| B | Date |
| C | Product Type |
| D | Seed Variety |
| E | Size Range |
| F | Variant/Region |
| G | Initial WIP (T) |
| H | Consumed (T) |
| I | Remaining (T) |
| J | Status |
| K | Created |
| L | Completed |
| M | Notes |

---

### Step 2: Check Data Row

Look at your data row (if any exists). Should look like:

| WIP-SUN-251023-001 | 2025-10-23 | Sunflower Seeds | T6 | 220-230 | Eastern Province | 2.450 | 0.000 | 2.450 | ACTIVE | 2025-10-23... | | Created from... |

**Important checks:**
- ✅ Column C = "Sunflower Seeds" (exact text)
- ✅ Column D = "T6" (or whatever variety you selected)
- ✅ Column E = "220-230" (size range)
- ✅ Column F = "Eastern Province" (EXACT match!)
- ✅ Column I = 2.450 (or some number > 0)
- ✅ Column J = "ACTIVE" (exact text)

---

### Step 3: Common Issues

**Issue 1: Wrong Region Name**
- Packing app looks for: `Eastern Province`
- WIP might have: `Eastern Province Region` ← WRONG!
- Fix: Production should write "Eastern Province" not "Eastern Province Region"

**Issue 2: Headers Don't Match**
- Column F MUST be: `Variant/Region` (with the slash!)
- Column I MUST be: `Remaining (T)` (with space and parentheses!)

**Issue 3: Data in Wrong Columns**
- If you created production entry BEFORE updating sheet
- Data is shifted and corrupted
- Solution: Delete all data rows, create new production entry

---

### Step 4: Take Screenshot

Can you take a screenshot of your WIP Inventory sheet showing:
1. Row 1 (headers) - columns A through M
2. Row 2 (data) - if any exists

Or tell me EXACTLY what you see in:
- Column F header: ?
- Column F data (row 2): ?
- Column J header: ?
- Column J data: ?
- Column I header: ?
- Column I data: ?

---

### Step 5: Quick Fix Test

Let me create a test script for you...

**Open browser console** (F12) in the Packing app and paste:

```javascript
// Check what WIP data looks like
fetch('https://sheets.googleapis.com/v4/spreadsheets/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/values/WIP Inventory!A1:M10?key=YOUR_API_KEY')
  .then(r => r.json())
  .then(data => {
    console.log('Headers:', data.values[0]);
    console.log('Row 2:', data.values[1]);
  });
```

Replace YOUR_API_KEY with your actual Google Sheets API key.

This will show us exactly what's in the sheet!

---

## 🎯 Most Likely Problem:

I suspect the issue is **"Eastern Province Region"** vs **"Eastern Province"**

The Production app might be writing: "Eastern Province Region"
The Packing app is looking for: "Eastern Province"

Let me check the code...
