# Bug Fixes Required - Column Mapping Issues

**Date**: 2025-11-04
**Source**: Google Spreadsheet Diagnostic Analysis

---

## 🐛 Bug #1: WIP Inventory Column Mapping (CRITICAL)

### Location
`apps/packing/src/components/PackingForm.jsx:206-211`

### Current Code (INCORRECT)
```javascript
// Line 206-211
await writeSheetData(
  'WIP Inventory',
  `I${rowNum}:K${rowNum}`,
  [['COMPLETE', new Date().toISOString(), '']],
  accessToken
);
```

### Problem
The code writes to the wrong columns when marking a batch as complete:
- **Column I (Remaining)**: Writes `'COMPLETE'` ← Should be `0` (number)
- **Column J (Status)**: Writes `timestamp` ← Should be `'COMPLETE'` (text)
- **Column K (Created At)**: Writes `''` ← Should NOT be modified (leave existing value)
- **Column L (Completed At)**: Not written ← Should write `timestamp`

### Correct Column Structure
According to `google-apps-script/BatchTracking.js` lines 180-194:

| Column | Name | Data Type | Purpose |
|--------|------|-----------|---------|
| I | Remaining (T) | Number | Weight remaining in batch |
| J | Status | Text | 'ACTIVE', 'COMPLETE', or 'CONSUMED' |
| K | Created At | Timestamp | When batch was created |
| L | Completed At | Timestamp | When batch was completed |

### Fixed Code
```javascript
// OPTION 1: Set remaining to 0, update status and completion date
await writeSheetData(
  'WIP Inventory',
  `I${rowNum}:L${rowNum}`,
  [[0, 'COMPLETE', currentBatch.createdAt || '', new Date().toISOString()]],
  accessToken
);

// OPTION 2: Just update status and completion (safer - doesn't modify created date)
// First set remaining to 0
await writeSheetData(
  'WIP Inventory',
  `I${rowNum}`,
  [[0]],
  accessToken
);

// Then update status and completed date
await writeSheetData(
  'WIP Inventory',
  `J${rowNum}:L${rowNum}`,
  [['COMPLETE', '', new Date().toISOString()]],
  accessToken
);
```

**Recommended**: Use Option 2 (safer, doesn't risk overwriting created date)

### Impact
- ❌ WIP batches show "COMPLETE" in Remaining column instead of 0
- ❌ Status column shows timestamps instead of "COMPLETE"
- ❌ Apps can't correctly identify completed batches
- ❌ Reports show incorrect WIP calculations
- ❌ Inventory calculations are wrong

### Priority
**CRITICAL** - Affects core inventory tracking functionality

### Files to Update
1. `apps/packing/src/components/PackingForm.jsx` (line 206-211)
2. `apps/packing/src/components/PackingFormNew.jsx` (line 362 - same issue)

---

## 🐛 Bug #2: Batch Tracking Column Shift (MEDIUM)

### Location
Unknown - needs investigation (likely in packing app)

### Problem
When packing transfers consume WIP, the batch tracking log has shifted columns.

**Correct structure** (from CREATED action):
```
Row 2 (CREATED):
  Timestamp: 2025-10-30T09:43:47.496Z
  Batch ID: WIP-SUN-251030-001
  Seed Type: Sunflower Seeds
  seed variety: T6              ✓
  Size: 200-210                 ✓
  Variant: Eastern Province     ✓
  Action: CREATED               ✓
  Weight Change (T): 4.875      ✓
  ...
```

**Incorrect structure** (from CONSUMED action):
```
Row 3 (CONSUMED):
  Timestamp: 2025-10-30T09:57:58.483Z
  Batch ID: WIP-SUN-251030-001
  Seed Type: Sunflower Seeds
  seed variety: 200-210         ✗ Should be "T6"
  Size: Eastern Province        ✗ Should be "200-210"
  Variant: CONSUMED             ✗ Should be "Eastern Province"
  Action: -0.323                ✗ Should be "CONSUMED"
  Weight Change (T): (empty)    ✗ Should be -0.323
  Running Total (T): Packing    ✗ Should be a number
  Department: Unknown           ✗ Should be "Packing"
  ...all columns shifted right
```

### Root Cause
The CONSUMED action log is missing one or more column values, causing all subsequent columns to shift right.

### Correct Column Structure
According to `google-apps-script/BatchTracking.js`:

| Column | Name | Example (CREATED) | Example (CONSUMED) |
|--------|------|-------------------|-------------------|
| A | Timestamp | 2025-10-30T09:43:47.496Z | 2025-10-30T09:57:58.483Z |
| B | Batch ID | WIP-SUN-251030-001 | WIP-SUN-251030-001 |
| C | Seed Type | Sunflower Seeds | Sunflower Seeds |
| D | seed variety | T6 | T6 |
| E | Size | 200-210 | 200-210 |
| F | Variant | Eastern Province | Eastern Province |
| G | Action | CREATED | CONSUMED |
| H | Weight Change (T) | 4.875 | -0.323 |
| I | Running Total (T) | 4.875 | 4.552 |
| J | Department | Production | Packing |
| K | User | Production User | Unknown |
| L | Reference | Production Row 2 | Transfer: TRF-251030-001 |
| M | Notes | New WIP batch created: T6 4.875T | Packed 323 bundles (1615 bags) |

### Investigation Needed
Search for where batch tracking logs are written during packing consumption:
1. Check `apps/packing/src/components/PackingForm.jsx`
2. Check `apps/packing/src/components/PackingFormNew.jsx`
3. Look for calls to 'Batch Tracking' sheet
4. Verify all 13 columns are being written

### Likely Issue
The code is probably writing something like:
```javascript
// WRONG - missing seed variety column
[
  timestamp,
  batchId,
  seedType,
  // seedVariety is missing! ← This causes the shift
  size,
  variant,
  'CONSUMED',
  ...
]
```

Should be:
```javascript
// CORRECT - all columns present
[
  timestamp,
  batchId,
  seedType,
  seedVariety,  // ← Must be included
  size,
  variant,
  'CONSUMED',
  weightChange,
  runningTotal,
  department,
  user,
  reference,
  notes
]
```

### Impact
- ⚠️ Batch tracking logs are unreliable for CONSUMED actions
- ⚠️ Reports based on batch tracking will show wrong data
- ⚠️ Difficult to trace WIP consumption history
- ⚠️ Seed variety tracking is lost for consumed batches

### Priority
**MEDIUM** - Affects tracking and reporting, but doesn't break core functionality

---

## 🔍 How to Verify Fixes

### Test WIP Inventory Fix

1. Create a test WIP batch through production app
2. Consume the entire batch through packing app
3. Check WIP Inventory sheet:
   - Column I (Remaining) should be `0` (number)
   - Column J (Status) should be `'COMPLETE'` (text)
   - Column L (Completed At) should have timestamp

### Test Batch Tracking Fix

1. Create a test WIP batch
2. Consume some WIP through packing
3. Check Batch Tracking sheet:
   - Find the CONSUMED action row
   - Verify all columns align correctly:
     - Column D should be seed variety (e.g., "T6")
     - Column E should be size (e.g., "200-210")
     - Column F should be variant (e.g., "Eastern Province")
     - Column G should be "CONSUMED"
     - Column H should be negative weight

---

## 📋 Implementation Checklist

### For Bug #1 (WIP Inventory)

- [ ] Open `apps/packing/src/components/PackingForm.jsx`
- [ ] Find line 206-211 (batch completion logic)
- [ ] Replace with Option 2 fix (safer approach)
- [ ] Open `apps/packing/src/components/PackingFormNew.jsx`
- [ ] Find line 362 (same issue)
- [ ] Apply same fix
- [ ] Test locally with dev environment
- [ ] Verify column mapping matches Google Apps Script
- [ ] Deploy to production

### For Bug #2 (Batch Tracking)

- [ ] Search packing apps for Batch Tracking writes
- [ ] Identify where CONSUMED logs are created
- [ ] Verify 13 columns are being written
- [ ] Ensure seed variety is included
- [ ] Test locally
- [ ] Verify column alignment in sheet
- [ ] Deploy to production

---

## 🎯 Success Criteria

After fixes are deployed:

1. ✅ New completed WIP batches show:
   - Remaining = 0 (number)
   - Status = "COMPLETE" (text)
   - Completed At = valid timestamp

2. ✅ New batch tracking CONSUMED logs show:
   - All columns properly aligned
   - Seed variety in correct column
   - Action = "CONSUMED" in correct column

3. ✅ WIP calculations are accurate
4. ✅ Batch history is reliable
5. ✅ Reports show correct data

---

## 🔗 Related Files

- **Bug Analysis**: `GOOGLE_SHEET_ANALYSIS.md`
- **Diagnostic Tool**: `google-apps-script/CheckSpreadsheet.js`
- **Google Apps Script**: `google-apps-script/BatchTracking.js` (reference implementation)
- **Sheet Structure**: `GOOGLE_SHEETS_STRUCTURE.md`

---

**Report Created**: 2025-11-04
**Bugs Found By**: Google Apps Script diagnostic + code analysis
**Priority**: Bug #1 (Critical), Bug #2 (Medium)
